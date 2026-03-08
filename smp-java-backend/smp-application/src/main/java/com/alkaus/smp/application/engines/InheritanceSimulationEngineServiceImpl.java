package com.alkaus.smp.application.engines;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.alkaus.smp.application.fiscal.FiscalCalculator;
import com.alkaus.smp.application.utils.Constantes;
import com.alkaus.smp.domain.fiscal.Abatement;
import com.alkaus.smp.domain.fiscal.FiscalRules;
import com.alkaus.smp.domain.fiscal.RelationshipEnum;
import com.alkaus.smp.domain.fiscal.Scale;
import com.alkaus.smp.domain.repository.FiscalRulesRepository;
import com.alkaus.smp.domain.succession.HeirInput;
import com.alkaus.smp.domain.succession.HeirResult;
import com.alkaus.smp.domain.succession.InheritanceInput;
import com.alkaus.smp.domain.succession.InheritanceResult;
import com.alkaus.smp.domain.succession.ScenarioAllocation;
import com.alkaus.smp.domain.succession.util.RightReceivedEnum;

/**
 * Core inheritance simulation engine.
 * Orchestrates civil allocation, fiscal valuation (USF/NP), donation recall,
 * life insurance taxation, and progressive scale application.
 */
@Service
public class InheritanceSimulationEngineServiceImpl implements InheritanceSimulationEngineService {

	private final ScenarioOptionsEngine scenarioOptionsEngine;
	private final FiscalRulesRepository fiscalRulesRepository;
	private final DonationRulesService donationRulesService;
	private final AssuranceVieRulesService assuranceVieRulesService;

	private static final BigDecimal DEFAULT_DISABILITY_ALLOWANCE = new BigDecimal("159325");
	private static final BigDecimal DEFAULT_RP_ABATEMENT_RATE = new BigDecimal("0.20");

	public InheritanceSimulationEngineServiceImpl(ScenarioOptionsEngine scenarioOptionsEngine,
			FiscalRulesRepository fiscalRulesRepository, DonationRulesService donationRulesService,
			AssuranceVieRulesService assuranceVieRulesService) {
		this.scenarioOptionsEngine = scenarioOptionsEngine;
		this.fiscalRulesRepository = fiscalRulesRepository;
		this.donationRulesService = donationRulesService;
		this.assuranceVieRulesService = assuranceVieRulesService;
	}

	@Override
	public InheritanceResult simulate(InheritanceInput input) {
		Objects.requireNonNull(input, "inheritance input data must not be null");

		FiscalRules fiscalRules = fiscalRulesRepository.getOrThrow(input.fiscalYear());
		// Civil net estate (used for rights received display and net transmission KPIs)
		BigDecimal civilNetAsset = input.netAsset().max(BigDecimal.ZERO);
		// Fiscal net estate (used to compute taxable values and inheritance rights)
		BigDecimal fiscalNetAsset = civilNetAsset;

		// Art. 764 bis CGI: 20% abatement on principal residence when occupied by surviving spouse/PACS
		BigDecimal rpAbatement = BigDecimal.ZERO;
		BigDecimal rpRate = fiscalRules.abatementsPrincipalResidencePct() != null ? fiscalRules.abatementsPrincipalResidencePct() : DEFAULT_RP_ABATEMENT_RATE;
		if (input.principalResidenceValue() != null
				&& input.principalResidenceValue().compareTo(BigDecimal.ZERO) > 0
				&& hasSpouseOrPacs(input)) {
			rpAbatement = input.principalResidenceValue()
					.multiply(rpRate).setScale(2, RoundingMode.HALF_UP);
			fiscalNetAsset = fiscalNetAsset.subtract(rpAbatement).max(BigDecimal.ZERO);
		}
		BigDecimal fiscalAsset = fiscalNetAsset;

		// 1) Civil allocation (PP/US/NP) according to spouse option
		ScenarioAllocation allocation = scenarioOptionsEngine.generateScenario(input);

		// 2) Index heirs by name
		Map<String, HeirInput> heirByName = new HashMap<>();
		for (HeirInput h : input.heirs()) {
			heirByName.put(h.name(), h);
		}

		// 3) Accumulate civil values & fiscal values per heir
		Map<String, MutableFiscalHeir> acc = new LinkedHashMap<>();

		for (ScenarioAllocation.AllocationLine line : allocation.lines()) {
			HeirInput heir = heirByName.get(line.heirName());
			if (heir == null) continue;

			MutableFiscalHeir fHeir = acc.computeIfAbsent(heir.name(), k -> new MutableFiscalHeir(heir));

			BigDecimal grossValue = civilNetAsset.multiply(line.quotaPercentage())
					.divide(Constantes.ONE_HUNDRED, 6, RoundingMode.HALF_UP);
			fHeir.grossValueReceived = fHeir.grossValueReceived.add(grossValue);

			BigDecimal fiscalGrossValue = fiscalAsset.multiply(line.quotaPercentage())
					.divide(Constantes.ONE_HUNDRED, 6, RoundingMode.HALF_UP);

			BigDecimal taxable = switch (line.rightReceived()) {
				case PLEINE_PROPRIETE -> fiscalGrossValue;
				case USUFRUIT -> FiscalCalculator.valueRights(fiscalGrossValue, true,
						usufructAge(input, heir), fiscalRules.usufructScales());
				case NUE_PROPRIETE -> FiscalCalculator.valueRights(fiscalGrossValue, false,
						usufructAge(input, heir), fiscalRules.usufructScales());
			};

			fHeir.taxableValue = fHeir.taxableValue.add(taxable);
			fHeir.rightsReceived.add(line.rightReceived());
			fHeir.quotaPercentage = fHeir.quotaPercentage.add(line.quotaPercentage());
		}

		// Count non-exempt beneficiaries for AV art. 757 B global allowance split
		int avBeneficiaryCount = (int) acc.values().stream().filter(f -> !f.heir.exemptTax()).count();

		// 4) Apply allowance (with donation recall) + progressive scale + life insurance
		BigDecimal totalRights = BigDecimal.ZERO;
		List<HeirResult> heirsResult = new ArrayList<>();

		for (MutableFiscalHeir fHeir : acc.values()) {
			RelationshipEnum link = fHeir.heir.relationshipEnum();

			// Spouse/PACS exemption => inheritance rights = 0
			if (fHeir.heir.exemptTax()) {
				BigDecimal avTax = assuranceVieRulesService.taxBefore70(fHeir.heir.name(),
						input.lifeInsurances(), fiscalRules, true);
				heirsResult.add(toHeirResult(fHeir, link, BigDecimal.ZERO, BigDecimal.ZERO, avTax));
				totalRights = totalRights.add(avTax);
				continue;
			}

			// Full allowance for this relationship
			BigDecimal fullAllowance = getAllowance(fiscalRules, link);
			// Disability allowance: +159 325 € (art. 779 II CGI), cumulative
			if (fHeir.heir.disabled()) {
				BigDecimal disab = fiscalRules.disabilityAllowance() != null ? fiscalRules.disabilityAllowance() : DEFAULT_DISABILITY_ALLOWANCE;
				fullAllowance = fullAllowance.add(disab);
			}

			// AV art. 757 B: reintegrated premiums after 70 added to taxable base
			BigDecimal reintegrated757B = assuranceVieRulesService.reintegratedAfter70(
					fHeir.heir.name(), input.lifeInsurances(), fiscalRules, avBeneficiaryCount);

			// ─── Art. 784 CGI — Rapport fiscal des donations < 15 ans ───
			// 1) Cumul: héritage + donations rappelées + 757B
			// 2) Barème sur le cumul (plafond = abattement plein)
			// 3) Imputation du crédit d'impôt = droits théoriques sur les donations seules
			// 4) Droits dus = taxe sur cumul − crédit donations
			BigDecimal recalledDonations = donationRulesService.recalledDonationsTotal(
					fHeir.heir.name(), input.donations(), input.dateOfDeath());
			BigDecimal inheritanceBase = fHeir.taxableValue.add(reintegrated757B);
			BigDecimal totalCumulBase = inheritanceBase.add(recalledDonations);

			// Apply full allowance on the cumulated base
			BigDecimal allowanceUsed = fullAllowance.min(totalCumulBase);
			BigDecimal cumulAfterAllowance = totalCumulBase.subtract(allowanceUsed).max(BigDecimal.ZERO);

			// Progressive scale on cumulated base (inheritance + recalled donations)
			Scale scale = getScale(fiscalRules, link);
			BigDecimal taxOnCumul = FiscalCalculator.rightsPerSlice(cumulAfterAllowance, scale);

			// Tax credit: theoretical tax on donations alone (with same full allowance)
			BigDecimal donationAfterAllowance = recalledDonations.subtract(fullAllowance).max(BigDecimal.ZERO);
			BigDecimal taxCreditDonations = FiscalCalculator.rightsPerSlice(donationAfterAllowance, scale);

			// Net inheritance rights = tax on cumul − credit for donations already taxed
			BigDecimal inheritanceRights = taxOnCumul.subtract(taxCreditDonations).max(BigDecimal.ZERO);

			// For display: baseAfterAllowance = the net taxable base attributable to the inheritance
			BigDecimal baseAfterAllowance = cumulAfterAllowance.subtract(donationAfterAllowance).max(BigDecimal.ZERO);

			// AV art. 990 I: separate tax on premiums before 70
			BigDecimal avTax = assuranceVieRulesService.taxBefore70(fHeir.heir.name(),
					input.lifeInsurances(), fiscalRules, false);

			BigDecimal totalHeirRights = inheritanceRights.add(avTax);
			totalRights = totalRights.add(totalHeirRights);

			heirsResult.add(toHeirResult(fHeir, link, allowanceUsed, baseAfterAllowance, totalHeirRights));
		}

		return new InheritanceResult(
				input.scenarioType(),
				input.netAsset().max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP),
				fiscalAsset.setScale(2, RoundingMode.HALF_UP),
				totalRights.setScale(2, RoundingMode.HALF_UP),
				heirsResult);
	}

	private Scale getScale(FiscalRules fiscalRules, RelationshipEnum link) {
		return fiscalRules.scalesByLink().getOrDefault(link, new Scale(List.of()));
	}

	private BigDecimal getAllowance(FiscalRules fiscalRules, RelationshipEnum link) {
		Abatement a = fiscalRules.abatementsByLink().get(link);
		return a != null && a.amount() != null ? a.amount() : BigDecimal.ZERO;
	}

	/**
	 * Art. 764 bis CGI: the 20% RP abatement only applies when the principal residence
	 * is occupied at the time of death by the surviving spouse (married) or PACS partner.
	 * Concubins do NOT qualify even if they inherit via testament.
	 */
	private boolean hasSpouseOrPacs(InheritanceInput input) {
		if (input.maritalStatusEnum() == null) return false;
		boolean isMarriedOrPacsed = input.maritalStatusEnum() == com.alkaus.smp.domain.succession.util.MaritalStatusEnum.MARRIED
				|| input.maritalStatusEnum() == com.alkaus.smp.domain.succession.util.MaritalStatusEnum.PACSED;
		return isMarriedOrPacsed && input.heirs() != null && input.heirs().stream().anyMatch(HeirInput::spouse);
	}

	private int usufructAge(InheritanceInput input, HeirInput heir) {
		// Art. 669 CGI: usufruct valued by the usufructuary's age (surviving spouse)
		if (input.spouseAge() != null) {
			return input.spouseAge();
		}
		return input.deceasedAge() != null ? input.deceasedAge() : 70;
	}

	private HeirResult toHeirResult(MutableFiscalHeir fHeir, RelationshipEnum link,
			BigDecimal allowanceUsed, BigDecimal baseAfterAllowance, BigDecimal rights) {

		RightReceivedEnum right = fHeir.rightsReceived.contains(RightReceivedEnum.PLEINE_PROPRIETE)
				? RightReceivedEnum.PLEINE_PROPRIETE
				: fHeir.rightsReceived.contains(RightReceivedEnum.USUFRUIT)
						? RightReceivedEnum.USUFRUIT
						: RightReceivedEnum.NUE_PROPRIETE;

		return new HeirResult(
				fHeir.heir.name(), link, right,
				fHeir.quotaPercentage.setScale(2, RoundingMode.HALF_UP),
				fHeir.grossValueReceived.setScale(2, RoundingMode.HALF_UP),
				fHeir.taxableValue.setScale(2, RoundingMode.HALF_UP),
				allowanceUsed.setScale(2, RoundingMode.HALF_UP),
				baseAfterAllowance.setScale(2, RoundingMode.HALF_UP),
				rights.setScale(2, RoundingMode.HALF_UP),
				fHeir.heir.disabled());
	}

	private static final class MutableFiscalHeir {
		final HeirInput heir;
		BigDecimal quotaPercentage = BigDecimal.ZERO;
		BigDecimal grossValueReceived = BigDecimal.ZERO;
		BigDecimal taxableValue = BigDecimal.ZERO;
		final EnumSet<RightReceivedEnum> rightsReceived = EnumSet.noneOf(RightReceivedEnum.class);

		MutableFiscalHeir(HeirInput heirInput) {
			this.heir = heirInput;
		}
	}
}
