package com.alkaus.smp.application.inheritanceCompleteResults.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.alkaus.smp.application.engines.ForcedHeirshipCalculator;
import com.alkaus.smp.application.engines.InheritanceSimulationEngineService;
import com.alkaus.smp.application.engines.LegalDevolutionEngine;
import com.alkaus.smp.application.engines.LiquidationRegimeService;
import com.alkaus.smp.application.fiscal.FiscalCalculator;
import com.alkaus.smp.domain.fiscal.Abatement;
import com.alkaus.smp.domain.fiscal.FiscalRules;
import com.alkaus.smp.domain.fiscal.RelationshipEnum;
import com.alkaus.smp.domain.fiscal.Scale;
import com.alkaus.smp.domain.repository.FiscalRulesRepository;
import com.alkaus.smp.application.inheritanceCompleteResults.command.AssetCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.DonationCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.LegCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.LifeInsuranceCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.PersonCommand;
import com.alkaus.smp.domain.succession.LifeInsuranceInput;
import com.alkaus.smp.application.inheritanceCompleteResults.command.SiblingsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.AvBeneficiaryDetail;
import com.alkaus.smp.application.inheritanceCompleteResults.model.DdvScenarioResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.DeceasedResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.DonationRecallDetail;
import com.alkaus.smp.application.inheritanceCompleteResults.model.FinancialImpactResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.FiscalDetailsResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.HeirResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.HeritageResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.LegDetail;
import com.alkaus.smp.application.inheritanceCompleteResults.model.LiquidationResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.MassResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.ScenarioResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.YearImpactResult;
import com.alkaus.smp.application.utils.Constantes;
import com.alkaus.smp.application.utils.ServiceUtils;
import com.alkaus.smp.domain.succession.DonationInput;
import com.alkaus.smp.domain.succession.HeirInput;
import com.alkaus.smp.domain.succession.InheritanceInput;
import com.alkaus.smp.domain.succession.InheritanceResult;
import com.alkaus.smp.domain.succession.util.MaritalStatusEnum;
import com.alkaus.smp.domain.succession.util.ScenarioTypeEnum;
import com.alkaus.smp.domain.succession.util.SpouseOptionEnum;

/**
 * Builds scenario results (1st death, 2nd death, DDV comparisons) by orchestrating
 * legal devolution, liquidation, forced heirship, and the fiscal engine.
 */
@Service
public class InheritanceScenariosServiceImpl implements InheritanceScenariosService {

	private static final BigDecimal ZERO = BigDecimal.ZERO;
	private static final BigDecimal NOTARY_RATE = new BigDecimal("0.02");
	private static final BigDecimal HUNDRED = new BigDecimal("100");
	private static final BigDecimal ONE_QUARTER = new BigDecimal("0.25");

	private final InheritanceSimulationEngineService engineService;
	private final LegalDevolutionEngine devolutionEngine;
	private final LiquidationRegimeService liquidationService;
	private final ForcedHeirshipCalculator heirshipCalculator;
	private final FiscalRulesRepository fiscalRulesRepository;

	public InheritanceScenariosServiceImpl(InheritanceSimulationEngineService engineService,
			LegalDevolutionEngine devolutionEngine, LiquidationRegimeService liquidationService,
			ForcedHeirshipCalculator heirshipCalculator, FiscalRulesRepository fiscalRulesRepository) {
		this.engineService = engineService;
		this.devolutionEngine = devolutionEngine;
		this.liquidationService = liquidationService;
		this.heirshipCalculator = heirshipCalculator;
		this.fiscalRulesRepository = fiscalRulesRepository;
	}

	// ================================================================
	// 1st death: client deceased (ab intestat or chosen option)
	// ================================================================

	@Override
	public ScenarioResult deceasedClientScenario(CompleteResultsCommand cmd, HeritageResult heritage) {
		LiquidationResult liquidation = buildLiquidation(cmd, heritage);
		MaritalStatusEnum status = mapStatut(cmd.maritalStatus());
		boolean isMarried = status == MaritalStatusEnum.MARRIED;
		boolean isPacsed = status == MaritalStatusEnum.PACSED;
		int nbChildren = cmd.children() != null ? cmd.children().size() : 0;

		// Determine spouse option based on situation
		SpouseOptionEnum option = resolveDefaultSpouseOption(
				isMarried, isPacsed, nbChildren, cmd.allCommonChildren(), cmd.hasWill(), cmd.spouseOption());
		InheritanceInput input = buildFirstDeathInput(cmd, heritage, liquidation, option);
		InheritanceResult result = engineService.simulate(input);

		// Label: show option for married with children or PACSé with testament+children
		String label = null;
		if ((isMarried && nbChildren > 0) || (isPacsed && cmd.hasWill() && nbChildren > 0)) {
			label = optionLabel(option);
		}

		ScenarioResult baseResult = toScenarioResult(Constantes.SC_SCENARIO_TYPE_DECEASED_CLIENT,
				deceasedFrom(cmd.client()), label, result, liquidation, nbChildren, true);

		// Add legs taxation: compute tax on each legataire and include in result
		return enrichWithLegsTax(baseResult, cmd.legs());
	}

	// ================================================================
	// 2nd death: spouse deceased sequentially AFTER the client
	// The spouse's estate depends on the option chosen at 1st death:
	// - Usufruit total   → NP rejoins USF at 2nd death → estate = own half only
	// - 1/4 PP + 3/4 USF → 1/4 PP received is now spouse's property → estate = own half + 1/4 × deceased's share
	// - QD PP            → QD received is now spouse's property → estate = own half + QD × deceased's share
	// ================================================================

	@Override
	public ScenarioResult deceasedSpouseScenario(CompleteResultsCommand cmd, HeritageResult heritage) {
		if (cmd.spouse() == null) {
			return notApplicableScenario();
		}
		// 2nd death only relevant for married or PACS with testament
		// Concubins have no matrimonial regime → sequential death scenario is not applicable
		MaritalStatusEnum status = mapStatut(cmd.maritalStatus());
		boolean isMarried = status == MaritalStatusEnum.MARRIED;
		boolean isPacsedWithWill = status == MaritalStatusEnum.PACSED && cmd.hasWill();
		if (!isMarried && !isPacsedWithWill) {
			return notApplicableScenario();
		}
		SpouseOptionEnum option = mapSpouseOption(cmd.spouseOption());
		return buildSecondDeathForOption(cmd, heritage, option);
	}

	// ================================================================
	// DDV scenarios: for each DDV option, compute 1st death + 2nd death
	// ================================================================

	@Override
	public List<DdvScenarioResult> ddvScenarios(CompleteResultsCommand cmd, HeritageResult heritage) {
		if (cmd.spouse() == null) {
			return List.of();
		}
		MaritalStatusEnum status = mapStatut(cmd.maritalStatus());
		if (status != MaritalStatusEnum.MARRIED) {
			return List.of();
		}
		int nbChildren = cmd.children() != null ? cmd.children().size() : 0;
		if (nbChildren == 0) {
			return List.of();
		}

		List<DdvScenarioResult> results = new ArrayList<>();

		// Option A: Usufruit total (art. 757 or 1094-1)
		results.add(buildDdvScenario(cmd, heritage,
				SpouseOptionEnum.USUFRUIT_TOTAL,
				"Usufruit total", "USUFRUIT_TOTAL"));

		// Option B: 1/4 PP + 3/4 USF (art. 1094-1 DDV)
		results.add(buildDdvScenario(cmd, heritage,
				SpouseOptionEnum.QUART_PP_TROIS_QUART_US,
				"1/4 PP + 3/4 usufruit", "QUART_PP_TROIS_QUART_USF"));

		// Option C: Quotité disponible en pleine propriété (art. 1094-1 DDV)
		results.add(buildDdvScenario(cmd, heritage,
				SpouseOptionEnum.TOUTE_PLEINE_PROPRIETE,
				"Quotité disponible en PP", "QD_PLEINE_PROPRIETE"));

		return results;
	}

	private DdvScenarioResult buildDdvScenario(CompleteResultsCommand cmd, HeritageResult heritage,
			SpouseOptionEnum option, String label, String code) {

		LiquidationResult liquidation = buildLiquidation(cmd, heritage);
		int nbChildren = cmd.children() != null ? cmd.children().size() : 0;

		// 1st death with this option
		InheritanceInput firstDeathInput = buildFirstDeathInput(cmd, heritage, liquidation, option);
		InheritanceResult firstDeathResult = engineService.simulate(firstDeathInput);
		ScenarioResult firstDeath = toScenarioResult(
				"Décès du client — " + label,
				deceasedFrom(cmd.client()), label, firstDeathResult, liquidation, nbChildren, true);

		// Corresponding 2nd death
		ScenarioResult secondDeath = buildSecondDeathForOption(cmd, heritage, option);

		return new DdvScenarioResult(label, code, firstDeath, secondDeath);
	}

	// ================================================================
	// Legal devolution scenarios (ab intestat, art. 757 C.civ)
	// Option A: Usufruit total — Option B: 1/4 pleine propriété
	// ================================================================

	@Override
	public List<DdvScenarioResult> legalScenarios(CompleteResultsCommand cmd, HeritageResult heritage) {
		if (cmd.spouse() == null) {
			return List.of();
		}
		MaritalStatusEnum status = mapStatut(cmd.maritalStatus());
		if (status != MaritalStatusEnum.MARRIED) {
			return List.of();
		}
		int nbChildren = cmd.children() != null ? cmd.children().size() : 0;
		if (nbChildren == 0) {
			return List.of();
		}

		List<DdvScenarioResult> results = new ArrayList<>();

		// Option A: Usufruit total (art. 757 al. 1) — only if ALL children are common
		if (cmd.allCommonChildren()) {
			results.add(buildDdvScenario(cmd, heritage,
					SpouseOptionEnum.USUFRUIT_TOTAL,
					"Option A — Usufruit total", "LEGAL_USF_TOTAL"));
		}

		// Option B: 1/4 pleine propriété (art. 757 al. 2) — always available
		results.add(buildDdvScenario(cmd, heritage,
				SpouseOptionEnum.QUART_PLEINE_PROPRIETE,
				"Option B — 1/4 pleine propriété", "LEGAL_QUART_PP"));

		return results;
	}

	// ================================================================
	// Core 1st death builder (with specific option)
	// ================================================================

	private InheritanceInput buildFirstDeathInput(CompleteResultsCommand cmd, HeritageResult heritage,
			LiquidationResult liquidation, SpouseOptionEnum spouseOption) {

		MaritalStatusEnum status = mapStatut(cmd.maritalStatus());
		boolean hasSpouse = cmd.spouse() != null;

		Integer deceasedAge = cmd.client().age();
		Integer survivorAge = hasSpouse ? cmd.spouse().age() : null;
		String survivorName = hasSpouse ? fullName(cmd.spouse()) : null;

		BigDecimal grossTotal = heritage != null ? ServiceUtils.bigDecimalNullOrZero(heritage.totalGross()) : ZERO;
		BigDecimal passif = ServiceUtils.bigDecimalNullOrZero(cmd.totalDebts()).add(sumAssetsDebts(cmd.assets()));

		BigDecimal grossAsset;
		BigDecimal inputPassif;
		if (liquidation != null && liquidation.inheritanceAsset() != null
				&& liquidation.inheritanceAsset().compareTo(ZERO) > 0) {
			grossAsset = liquidation.inheritanceAsset();
			inputPassif = ZERO;
		} else {
			grossAsset = grossTotal;
			inputPassif = passif;
		}

		// Filter liberalities by owner: only the deceased's own liberalities apply
		// owner=null or owner="CLIENT" → belongs to the current deceased
		// owner="CONJOINT" → belongs to the survivor, not relevant for this succession
		List<DonationCommand> deceasedDonations = filterByDeceasedOwner(cmd.donations());
		List<LegCommand> deceasedLegs = filterLegsByDeceasedOwner(cmd.legs());
		List<LifeInsuranceCommand> deceasedAV = filterAVByDeceasedOwner(cmd.lifeInsurances());

		// Deduct only the deceased's legs particuliers from estate
		BigDecimal totalLegs = sumLegs(deceasedLegs);
		grossAsset = grossAsset.subtract(totalLegs).max(ZERO);

		boolean fatherAlive = cmd.parentsOfDeceased() != null && cmd.parentsOfDeceased().livingFather();
		boolean motherAlive = cmd.parentsOfDeceased() != null && cmd.parentsOfDeceased().livingMother();
		String fatherName = fatherAlive ? "Père" : null;
		String motherName = motherAlive ? "Mère" : null;

		// Build sibling names (alive) + representation entries (deceased siblings' children)
		List<String> aliveSiblingNames = new ArrayList<>();
		// Representation: map of deceased sibling souche name → list of nephews/nieces names
		java.util.Map<String, List<String>> representationMap = new java.util.LinkedHashMap<>();
		List<String> ordinaryAscendants = new ArrayList<>();
		List<String> ordinaryCollaterals = new ArrayList<>();
		if (cmd.siblingsOfDeceased() != null) {
			for (SiblingsCommand sib : cmd.siblingsOfDeceased()) {
				String rel = normalizeSiblingRelationship(sib.relationship());
				if ("GRANDPARENT".equals(rel)) {
					if (sib.alive() && sib.firstName() != null && !sib.firstName().isBlank()) {
						ordinaryAscendants.add(sib.firstName());
					}
					continue;
				}
				if ("UNCLE_AUNT".equals(rel)) {
					if (sib.alive() && sib.firstName() != null && !sib.firstName().isBlank()) {
						ordinaryCollaterals.add(sib.firstName());
					}
					continue;
				}
				// Default branch = sibling (order 2, with representation)
				if (sib.alive()) {
					aliveSiblingNames.add(sib.firstName());
				} else if (sib.childrenNames() != null && !sib.childrenNames().isEmpty()) {
					representationMap.put(sib.firstName(), sib.childrenNames());
				}
			}
		}

		List<String> childNames = cmd.children() != null
				? cmd.children().stream().map(this::fullName).collect(Collectors.toList())
				: List.of();

		// Build set of disabled children names for the engine
		Set<String> disabledChildren = cmd.children() != null
				? cmd.children().stream()
						.filter(PersonCommand::disabled)
						.map(this::fullName)
						.collect(Collectors.toSet())
				: Set.of();

		// Build childSoucheMap: representant name → souche name (predeceased parent)
		// for per-souche share calculation (art. 751 C.civ)
		java.util.Map<String, String> childSoucheMap = new java.util.LinkedHashMap<>();
		if (cmd.children() != null) {
			for (PersonCommand child : cmd.children()) {
				if (child.soucheName() != null) {
					childSoucheMap.put(fullName(child), child.soucheName());
				}
			}
		}

		boolean hasDDV = cmd.presenceDDV();
		boolean hasWill = cmd.hasWill();
		boolean allCommon = cmd.allCommonChildren();
		List<HeirInput> heirs = devolutionEngine.buildHeirs(
				status, hasSpouse, survivorName,
				childNames, allCommon, hasDDV, hasWill,
				fatherAlive, motherAlive, fatherName, motherName,
				aliveSiblingNames, representationMap, disabledChildren, spouseOption, childSoucheMap,
				ordinaryAscendants, ordinaryCollaterals);

		BigDecimal netTotal = grossTotal.subtract(passif).max(ZERO);
		BigDecimal rpValue = extractPrincipalResidenceValueForEstate(cmd.assets(), grossAsset, netTotal);

		List<DonationInput> donations = mapDonations(deceasedDonations);
		List<LifeInsuranceInput> lifeInsurances = mapLifeInsurances(deceasedAV);

		LocalDate deathDate = cmd.dateOfDeath() != null ? cmd.dateOfDeath() : LocalDate.now();
		int fiscalYear = deathDate.getYear();
		return new InheritanceInput(fiscalYear, ScenarioTypeEnum.CLIENT_DECEASED, status, cmd.matrimonialRegime(),
				spouseOption, deceasedAge, survivorAge, grossAsset, inputPassif, inputPassif, ZERO,
				heirs, donations, lifeInsurances, deathDate, deathDate,
				hasDDV, false, null, null, true, rpValue);
	}

	// ================================================================
	// Core 2nd death builder (with option distinction)
	// ================================================================

	private ScenarioResult buildSecondDeathForOption(CompleteResultsCommand cmd, HeritageResult heritage,
			SpouseOptionEnum firstDeathOption) {

		if (cmd.spouse() == null) {
			return notApplicableScenario();
		}

		LiquidationResult firstDeathLiquidation = buildLiquidation(cmd, heritage);
		BigDecimal spouseOwnHalf = firstDeathLiquidation.spouseShare() != null
				? firstDeathLiquidation.spouseShare() : ZERO;
		BigDecimal deceasedShare = firstDeathLiquidation.inheritanceAsset() != null
				? firstDeathLiquidation.inheritanceAsset() : ZERO;

		int nbChildren = cmd.children() != null ? cmd.children().size() : 0;

		// Compute the PP portion the spouse received at 1st death (now part of their estate)
		BigDecimal ppReceivedFromFirstDeath = computePPReceivedBySpouse(firstDeathOption, deceasedShare, nbChildren);

		// PROPRE_CONJOINT assets: the survivor's own assets were excluded from the 1st death
		// liquidation (correctly). At the 2nd death they form part of the survivor's estate.
		BigDecimal conjointPropreNet = sumConjointPropreNet(cmd.assets());

		// Spouse's total estate at 2nd death =
		//   own half of common + own PROPRE_CONJOINT assets + PP received from 1st death
		BigDecimal spousePatrimoine = spouseOwnHalf.add(conjointPropreNet).add(ppReceivedFromFirstDeath);

		// Liquidation for 2nd death (widow/widower, single estate)
		LiquidationResult secondDeathLiquidation = new LiquidationResult(
				spousePatrimoine, null, spousePatrimoine, null, spousePatrimoine);

		List<String> childNames = cmd.children() != null
				? cmd.children().stream().map(this::fullName).collect(Collectors.toList())
				: List.of();

		// At 2nd death, the spouse dies as a single person.
		// If there are children → they inherit (order 1).
		// If no children → use the spouse's own family (parentsOfSpouse, siblingsOfSpouse)
		// for proper order 2 devolution (art. 734-755 C.civ).
		boolean spouseFatherAlive = cmd.parentsOfSpouse() != null && cmd.parentsOfSpouse().livingFather();
		boolean spouseMotherAlive = cmd.parentsOfSpouse() != null && cmd.parentsOfSpouse().livingMother();
		String spouseFatherName = spouseFatherAlive ? "Père (conjoint)" : null;
		String spouseMotherName = spouseMotherAlive ? "Mère (conjoint)" : null;

		List<String> spouseAliveSiblings = new ArrayList<>();
		java.util.Map<String, List<String>> spouseRepMap = new java.util.LinkedHashMap<>();
		List<String> spouseOrdinaryAscendants = new ArrayList<>();
		List<String> spouseOrdinaryCollaterals = new ArrayList<>();
		if (cmd.siblingsOfSpouse() != null) {
			for (SiblingsCommand sib : cmd.siblingsOfSpouse()) {
				String rel = normalizeSiblingRelationship(sib.relationship());
				if ("GRANDPARENT".equals(rel)) {
					if (sib.alive() && sib.firstName() != null && !sib.firstName().isBlank()) {
						spouseOrdinaryAscendants.add(sib.firstName());
					}
					continue;
				}
				if ("UNCLE_AUNT".equals(rel)) {
					if (sib.alive() && sib.firstName() != null && !sib.firstName().isBlank()) {
						spouseOrdinaryCollaterals.add(sib.firstName());
					}
					continue;
				}
				if (sib.alive()) {
					spouseAliveSiblings.add(sib.firstName());
				} else if (sib.childrenNames() != null && !sib.childrenNames().isEmpty()) {
					spouseRepMap.put(sib.firstName(), sib.childrenNames());
				}
			}
		}

		// Build childSoucheMap for per-souche representation at 2nd death (art. 751 C.civ)
		java.util.Map<String, String> childSoucheMap2 = new java.util.LinkedHashMap<>();
		if (cmd.children() != null) {
			for (PersonCommand child : cmd.children()) {
				if (child.soucheName() != null) {
					childSoucheMap2.put(fullName(child), child.soucheName());
				}
			}
		}

		List<HeirInput> heirs = devolutionEngine.buildHeirs(
				MaritalStatusEnum.SINGLE, false, null,
				childNames, true, false, false,
				spouseFatherAlive, spouseMotherAlive, spouseFatherName, spouseMotherName,
				spouseAliveSiblings, spouseRepMap, Set.of(), null, childSoucheMap2,
				spouseOrdinaryAscendants, spouseOrdinaryCollaterals);

		// Scale RP value proportionally to the spouse's estate share
		BigDecimal rpValueFull = extractPrincipalResidenceValue(cmd.assets());
		BigDecimal rpValue = rpValueFull;
		// If spouse patrimoine < rpValue, cap RP to patrimoine (can't deduct more than estate)
		if (spousePatrimoine.compareTo(rpValue) < 0) {
			rpValue = spousePatrimoine;
		}

		// Survivor's own donations (owner=CONJOINT) are recalled at 2nd death (art. 784 CGI)
		List<DonationCommand> survivorDonations = filterBySurvivorOwner(cmd.donations());
		List<DonationInput> secondDeathDonations = mapDonations(survivorDonations);

		// Survivor's own AV contracts (owner=CONJOINT) trigger at 2nd death
		List<LifeInsuranceCommand> survivorAV = filterAVBySurvivorOwner(cmd.lifeInsurances());
		List<LifeInsuranceInput> secondDeathAV = mapLifeInsurances(survivorAV);

		int fiscalYear2 = LocalDate.now().getYear();
		InheritanceInput input = new InheritanceInput(fiscalYear2, ScenarioTypeEnum.SPOUSE_DECEASED,
				MaritalStatusEnum.SINGLE, null,
				null, cmd.spouse().age(), null,
				spousePatrimoine, ZERO, ZERO, ZERO,
				heirs, secondDeathDonations, secondDeathAV, LocalDate.now(), LocalDate.now(),
				false, false, null, null, true, rpValue);

		InheritanceResult result = engineService.simulate(input);

		String secondDeathLabel = Constantes.SC_SCENARIO_TYPE_DECEASED_SPOUSE;
		return toScenarioResult(secondDeathLabel,
				deceasedFrom(cmd.spouse()), optionLabel(firstDeathOption), result,
				secondDeathLiquidation, nbChildren, true);
	}

	/**
	 * Computes the pleine propriété portion the surviving spouse received at 1st death,
	 * which becomes part of the spouse's own estate at 2nd death.
	 *
	 * - Usufruit total:     PP = 0 (NP rejoins USF, no fiscal event)
	 * - 1/4 PP + 3/4 USF:  PP = 1/4 × deceasedShare
	 * - QD PP:              PP = quotité disponible × deceasedShare = 1/(nbChildren+1) × deceasedShare
	 */
	private BigDecimal computePPReceivedBySpouse(SpouseOptionEnum option, BigDecimal deceasedShare, int nbChildren) {
		if (option == null || deceasedShare.compareTo(ZERO) <= 0) {
			return ZERO;
		}
		return switch (option) {
			case USUFRUIT_TOTAL -> ZERO;
			case QUART_PP_TROIS_QUART_US, QUART_PLEINE_PROPRIETE ->
					deceasedShare.multiply(ONE_QUARTER).setScale(2, RoundingMode.HALF_UP);
			case TOUTE_PLEINE_PROPRIETE -> {
				BigDecimal qdFraction = heirshipCalculator.availableQuotaFraction(nbChildren);
				yield deceasedShare.multiply(qdFraction).setScale(2, RoundingMode.HALF_UP);
			}
		};
	}

	// ================================================================
	// Liquidation & Mass
	// ================================================================

	private LiquidationResult buildLiquidation(CompleteResultsCommand cmd, HeritageResult heritage) {
		BigDecimal grossAsset = heritage != null ? ServiceUtils.bigDecimalNullOrZero(heritage.totalGross()) : ZERO;
		String regime = cmd.matrimonialRegime();

		// Compute separate/common assets AND passif from ownership field (art. 1401-1408 C.civ)
		// PROPRE_CLIENT   → deceased's own assets → separateAsset; debts → succession passif
		// PROPRE_CONJOINT → survivor's own assets → excluded from succession estate AND passif
		// COMMUN / null   → common pool → commonAsset; debts → succession passif
		// INDIVISION      → treated as common (simplified: 50% each)
		BigDecimal separateAsset = ZERO;
		BigDecimal commonAsset = ZERO;
		BigDecimal ownershipPassif = ZERO; // only debts on succession-relevant assets
		boolean hasOwnershipData = false;

		if (cmd.assets() != null) {
			for (AssetCommand a : cmd.assets()) {
				BigDecimal val = ServiceUtils.bigDecimalNullOrZero(a.value());
				BigDecimal debt = ServiceUtils.bigDecimalNullOrZero(a.debt());
				BigDecimal net = val.subtract(debt).max(ZERO);
				String own = a.ownership();

				if (own != null && !own.isBlank()) {
					hasOwnershipData = true;
					String o = own.trim().toUpperCase();
					if (o.contains("PROPRE_CLIENT") || o.equals("PROPRE")) {
						separateAsset = separateAsset.add(net);
						ownershipPassif = ownershipPassif.add(debt);
					} else if (o.contains("PROPRE_CONJOINT")) {
						// Survivor's own asset — excluded from succession estate AND passif
					} else {
						// COMMUN, INDIVISION, or unrecognized → common pool
						commonAsset = commonAsset.add(net);
						ownershipPassif = ownershipPassif.add(debt);
					}
				} else {
					commonAsset = commonAsset.add(net);
					ownershipPassif = ownershipPassif.add(debt);
				}
			}
		}

		// Passif: when ownership data is present, use only succession-relevant debts;
		// otherwise fall back to totalDebts + all per-asset debts (legacy behavior)
		BigDecimal passif = hasOwnershipData ? ownershipPassif
				: ServiceUtils.bigDecimalNullOrZero(cmd.totalDebts()).add(sumAssetsDebts(cmd.assets()));

		// Only pass separate/common if at least one asset has ownership data
		// Otherwise let LiquidationRegimeService use its default logic (all common)
		return liquidationService.liquidate(regime, grossAsset, passif,
				hasOwnershipData ? separateAsset : null,
				hasOwnershipData ? commonAsset : null);
	}

	private MassResult buildMass(BigDecimal civilEstate, int nbChildren, BigDecimal fiscalAsset) {
		BigDecimal reserve = heirshipCalculator.reserveAmount(civilEstate, nbChildren);
		BigDecimal availableQuota = heirshipCalculator.availableQuotaAmount(civilEstate, nbChildren);
		BigDecimal residenceAllowance = civilEstate.subtract(fiscalAsset).max(ZERO).setScale(2, RoundingMode.HALF_UP);
		// Art. 764 bis CGI: allowance amount = 20% of retained principal residence base.
		// We expose the inferred base for transparent reporting.
		BigDecimal residenceBaseBeforeAllowance = residenceAllowance.signum() > 0
				? residenceAllowance.multiply(new BigDecimal("5")).setScale(2, RoundingMode.HALF_UP)
				: ZERO;
		return new MassResult(civilEstate, reserve, availableQuota, residenceAllowance, residenceBaseBeforeAllowance, null, fiscalAsset);
	}

	// ================================================================
	// Mapping InheritanceResult -> ScenarioResult
	// ================================================================

	private ScenarioResult toScenarioResult(String label, DeceasedResult deceased, String spouseOption,
			InheritanceResult result, LiquidationResult liquidation, int nbChildren, boolean applicable) {

		BigDecimal netAsset = ServiceUtils.bigDecimalNullOrZero(result.netAsset());
		BigDecimal rights = ServiceUtils.bigDecimalNullOrZero(result.totalRights());
		BigDecimal notaryFees = netAsset.multiply(NOTARY_RATE).setScale(2, RoundingMode.HALF_UP);
		BigDecimal netTransmission = netAsset.subtract(rights).subtract(notaryFees).max(ZERO);

		BigDecimal transmissionRate = ZERO;
		if (netAsset.compareTo(ZERO) > 0) {
			transmissionRate = netTransmission.multiply(HUNDRED).divide(netAsset, 2, RoundingMode.HALF_UP);
		}

		BigDecimal civilEstate = liquidation != null && liquidation.inheritanceAsset() != null
				? liquidation.inheritanceAsset() : netAsset;
		BigDecimal fiscalAsset = ServiceUtils.bigDecimalNullOrZero(result.fiscalInheritanceAsset());
		MassResult mass = buildMass(civilEstate, nbChildren, fiscalAsset);

		List<HeirResult> heirs = result.heirs() == null ? List.of()
				: result.heirs().stream().map(h -> new HeirResult(
						h.name(), h.relationship(), h.quotaPercentage(),
						h.grossValueReceived(), h.allowanceUsed(), h.rights(),
						rightTypeLabel(h.taxReceived()),
						h.taxableValue(), h.baseTaxableAfterAllowance(),
						h.disabled())).toList();

		FinancialImpactResult emptyImpact = new FinancialImpactResult(
				new YearImpactResult(ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO),
				new YearImpactResult(ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO));

		return new ScenarioResult(label, deceased, spouseOption, netAsset,
				liquidation, mass, heirs, rights, notaryFees,
				netTransmission.setScale(2, RoundingMode.HALF_UP), transmissionRate,
				emptyImpact, applicable);
	}

	// ================================================================
	// Legs taxation: compute tax per legataire and enrich ScenarioResult
	// ================================================================

	private ScenarioResult enrichWithLegsTax(ScenarioResult base, List<LegCommand> legs) {
		if (legs == null || legs.isEmpty()) return base;

		FiscalRules fiscalRules = fiscalRulesRepository.getOrThrow(2026);
		List<HeirResult> allHeirs = new ArrayList<>(base.heirs());
		BigDecimal additionalRights = ZERO;

		for (LegCommand leg : legs) {
			if (leg.amount() == null || leg.amount().signum() <= 0) continue;
			String name = leg.beneficiaryName() != null ? leg.beneficiaryName() : "Légataire";

			RelationshipEnum link = mapLegRelationship(leg.relationship());

			// Conjoint/PACS legataire is exempt from inheritance tax
			boolean exempt = leg.relationship() != null
					&& (leg.relationship().contains("conjoint") || leg.relationship().contains("pacs"));
			if (exempt) {
				allHeirs.add(new HeirResult(name, RelationshipEnum.OTHERS, ZERO,
						leg.amount(), ZERO, ZERO, "Pleine propriété", leg.amount(), ZERO));
				continue;
			}

			// Compute allowance and progressive tax
			Abatement abatement = fiscalRules.abatementsByLink().get(link);
			BigDecimal allowance = abatement != null && abatement.amount() != null ? abatement.amount() : ZERO;
			BigDecimal baseAfterAllowance = leg.amount().subtract(allowance).max(ZERO);

			Scale scale = fiscalRules.scalesByLink().getOrDefault(link, new Scale(List.of()));
			BigDecimal legRights = FiscalCalculator.rightsPerSlice(baseAfterAllowance, scale);

			additionalRights = additionalRights.add(legRights);

			allHeirs.add(new HeirResult(name, link, ZERO,
					leg.amount(), allowance, legRights, "Pleine propriété",
					leg.amount(), baseAfterAllowance));
		}

		if (additionalRights.signum() == 0) return base;

		BigDecimal newTotalRights = ServiceUtils.bigDecimalNullOrZero(base.inheritanceRights()).add(additionalRights);
		BigDecimal netAsset = ServiceUtils.bigDecimalNullOrZero(base.inheritanceAsset());
		BigDecimal notaryFees = ServiceUtils.bigDecimalNullOrZero(base.notaryFees());
		BigDecimal newNetTransmission = netAsset.subtract(newTotalRights).subtract(notaryFees).max(ZERO);
		BigDecimal transmissionRate = netAsset.compareTo(ZERO) > 0
				? newNetTransmission.multiply(HUNDRED).divide(netAsset, 2, RoundingMode.HALF_UP) : ZERO;

		return new ScenarioResult(base.label(), base.deceased(), base.spouseOption(), netAsset,
				base.liquidation(), base.mass(), allHeirs, newTotalRights, notaryFees,
				newNetTransmission.setScale(2, RoundingMode.HALF_UP), transmissionRate,
				base.financialImpact(), base.relevant());
	}

	private RelationshipEnum mapLegRelationship(String rel) {
		if (rel == null) return RelationshipEnum.OTHERS;
		String s = rel.trim().toLowerCase(Locale.ROOT);
		if (s.contains("enfant") || s.contains("child") || s.contains("parent")) return RelationshipEnum.DIRECT_LINE;
		if (s.contains("conjoint") || s.contains("pacs")) return RelationshipEnum.OTHERS;
		if (s.contains("frere") || s.contains("soeur") || s.contains("frère") || s.contains("sœur") || s.contains("sibling")) return RelationshipEnum.SIBLINGS;
		if (s.contains("neveu") || s.contains("nièce") || s.contains("niece")) return RelationshipEnum.NIECE_NEPHEW;
		if (s.contains("grand-parent") || s.contains("grandparent") || s.contains("grand_parent") || s.contains("ascendant")) return RelationshipEnum.GRANDPARENT;
		if (s.contains("oncle") || s.contains("tante") || s.contains("cousin") || s.contains("uncle") || s.contains("aunt")) return RelationshipEnum.UNCLE_AUNT;
		return RelationshipEnum.OTHERS;
	}

	private ScenarioResult notApplicableScenario() {
		FinancialImpactResult emptyImpact = new FinancialImpactResult(
				new YearImpactResult(ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO),
				new YearImpactResult(ZERO, ZERO, ZERO, ZERO, ZERO, ZERO, ZERO));
		return new ScenarioResult("Non applicable", null, null, null, null, null,
				List.of(), null, null, null, null, emptyImpact, false);
	}

	// ================================================================
	// Donation mapping: DonationCommand -> DonationInput
	// ================================================================

	private List<DonationInput> mapDonations(List<DonationCommand> donations) {
		if (donations == null || donations.isEmpty()) return List.of();
		return donations.stream().map(d -> new DonationInput(
				d.beneficiaryName(),
				mapRelationship(d.relationship()),
				d.amount(),
				d.donationDate(),
				d.rapportable()
		)).collect(Collectors.toList());
	}

	// ================================================================
	// Life insurance mapping: LifeInsuranceCommand -> LifeInsuranceInput
	// ================================================================

	private List<LifeInsuranceInput> mapLifeInsurances(List<LifeInsuranceCommand> avCommands) {
		if (avCommands == null || avCommands.isEmpty()) return List.of();
		return avCommands.stream().map(av -> {
			// allowanceFraction: 1.0 for PP, NP% for démembrement (prorata art. 990 I abattement)
			BigDecimal fraction = av.allowanceFraction() != null ? av.allowanceFraction() : BigDecimal.ONE;

			BigDecimal avant70 = av.primesAvant70() != null ? av.primesAvant70() : ZERO;
			BigDecimal apres70 = av.primesApres70() != null ? av.primesApres70() : ZERO;
			BigDecimal capital = av.capitalDeces() != null ? av.capitalDeces() : ZERO;
			BigDecimal totalPrimes = avant70.add(apres70);

			// BOI-TCAS-AUT-60 §10 : pour un contrat mixte (versements avant ET après 70 ans),
			// le capital décès est proratisé :
			//   art. 990 I → fraction du capital correspondant aux primes avant 70
			//   art. 757 B → primes versées après 70 (pas le capital, les intérêts sont exonérés)
			BigDecimal capitalAvant70;
			if (totalPrimes.signum() > 0 && avant70.signum() > 0) {
				capitalAvant70 = capital.multiply(avant70)
						.divide(totalPrimes, 2, RoundingMode.HALF_UP);
			} else {
				capitalAvant70 = avant70.signum() > 0 ? capital : ZERO;
			}

			return List.of(
				// Entry for premiums paid before age 70 (art. 990 I)
				// deathBenefit = fraction of capital attributable to before-70 premiums
				new LifeInsuranceInput(av.beneficiaryName(),
						avant70, capitalAvant70,
						null, null,
						av.ageAssureAuVersement() != null && av.ageAssureAuVersement() < 70
								? av.ageAssureAuVersement() : 50,
						fraction),
				// Entry for premiums paid after age 70 (art. 757 B)
				// bonusesPaid = premiums only (interest/gains are exempt from DMTG)
				new LifeInsuranceInput(av.beneficiaryName(),
						apres70, ZERO,
						null, null,
						av.ageAssureAuVersement() != null && av.ageAssureAuVersement() >= 70
								? av.ageAssureAuVersement() : 75,
						BigDecimal.ONE)
			);
		}).flatMap(List::stream)
		.filter(li -> li.bonusesPaid() != null && li.bonusesPaid().signum() > 0)
		.collect(Collectors.toList());
	}

	private RelationshipEnum mapRelationship(String rel) {
		if (rel == null) return RelationshipEnum.DIRECT_LINE;
		String s = rel.trim().toLowerCase(Locale.ROOT);
		if (s.contains("direct") || s.contains("enfant") || s.contains("child") || s.contains("parent")) return RelationshipEnum.DIRECT_LINE;
		if (s.contains("conjoint") || s.contains("spouse") || s.contains("pacs")) return RelationshipEnum.OTHERS;
		if (s.contains("frère") || s.contains("frere") || s.contains("soeur") || s.contains("sœur") || s.contains("sibling")) return RelationshipEnum.SIBLINGS;
		if (s.contains("neveu") || s.contains("nièce") || s.contains("niece")) return RelationshipEnum.NIECE_NEPHEW;
		if (s.contains("grand-parent") || s.contains("grandparent") || s.contains("grand_parent") || s.contains("ascendant")) return RelationshipEnum.GRANDPARENT;
		if (s.contains("oncle") || s.contains("tante") || s.contains("cousin") || s.contains("uncle") || s.contains("aunt")) return RelationshipEnum.UNCLE_AUNT;
		return RelationshipEnum.OTHERS;
	}

	// ================================================================
	// Legs: sum of specific legacies
	// ================================================================

	private BigDecimal sumLegs(List<LegCommand> legs) {
		if (legs == null || legs.isEmpty()) return ZERO;
		return legs.stream()
				.map(l -> ServiceUtils.bigDecimalNullOrZero(l.amount()))
				.reduce(ZERO, BigDecimal::add);
	}

	// ================================================================
	// Owner-based filtering for liberalities (inversion support)
	// ================================================================

	/** Keep only donations belonging to the current deceased (owner=null or "CLIENT") */
	private List<DonationCommand> filterByDeceasedOwner(List<DonationCommand> donations) {
		if (donations == null || donations.isEmpty()) return List.of();
		return donations.stream()
				.filter(d -> d.owner() == null || d.owner().isBlank() || d.owner().equalsIgnoreCase("CLIENT"))
				.collect(Collectors.toList());
	}

	/** Keep only legs belonging to the current deceased */
	private List<LegCommand> filterLegsByDeceasedOwner(List<LegCommand> legs) {
		if (legs == null || legs.isEmpty()) return List.of();
		return legs.stream()
				.filter(l -> l.owner() == null || l.owner().isBlank() || l.owner().equalsIgnoreCase("CLIENT"))
				.collect(Collectors.toList());
	}

	/** Keep only AV contracts belonging to the current deceased */
	private List<LifeInsuranceCommand> filterAVByDeceasedOwner(List<LifeInsuranceCommand> avs) {
		if (avs == null || avs.isEmpty()) return List.of();
		return avs.stream()
				.filter(av -> av.owner() == null || av.owner().isBlank() || av.owner().equalsIgnoreCase("CLIENT"))
				.collect(Collectors.toList());
	}

	/** Keep only donations belonging to the surviving spouse (owner="CONJOINT") — for 2nd death recall */
	private List<DonationCommand> filterBySurvivorOwner(List<DonationCommand> donations) {
		if (donations == null || donations.isEmpty()) return List.of();
		return donations.stream()
				.filter(d -> d.owner() != null && d.owner().equalsIgnoreCase("CONJOINT"))
				.collect(Collectors.toList());
	}

	/** Keep only AV contracts belonging to the surviving spouse (owner="CONJOINT") — for 2nd death */
	private List<LifeInsuranceCommand> filterAVBySurvivorOwner(List<LifeInsuranceCommand> avs) {
		if (avs == null || avs.isEmpty()) return List.of();
		return avs.stream()
				.filter(av -> av.owner() != null && av.owner().equalsIgnoreCase("CONJOINT"))
				.collect(Collectors.toList());
	}

	/**
	 * Sum net value (valeur - dette) of PROPRE_CONJOINT assets.
	 * These are the surviving spouse's own assets, excluded from the 1st death
	 * liquidation but forming part of their estate at the 2nd death.
	 */
	private BigDecimal sumConjointPropreNet(List<AssetCommand> assets) {
		if (assets == null) return ZERO;
		BigDecimal total = ZERO;
		for (AssetCommand a : assets) {
			String own = a.ownership();
			if (own != null && own.trim().toUpperCase().contains("PROPRE_CONJOINT")) {
				BigDecimal val = ServiceUtils.bigDecimalNullOrZero(a.value());
				BigDecimal debt = ServiceUtils.bigDecimalNullOrZero(a.debt());
				total = total.add(val.subtract(debt).max(ZERO));
			}
		}
		return total;
	}

	// ================================================================
	// Helpers
	// ================================================================

	private String rightTypeLabel(com.alkaus.smp.domain.succession.util.RightReceivedEnum right) {
		if (right == null) return "Pleine propriété";
		return switch (right) {
			case PLEINE_PROPRIETE -> "Pleine propriété";
			case USUFRUIT -> "Usufruit";
			case NUE_PROPRIETE -> "Nue-propriété";
		};
	}

	private String optionLabel(SpouseOptionEnum option) {
		if (option == null) return null;
		return switch (option) {
			case USUFRUIT_TOTAL -> "Usufruit total";
			case QUART_PP_TROIS_QUART_US -> "1/4 PP + 3/4 usufruit";
			case TOUTE_PLEINE_PROPRIETE -> "Quotité disponible en PP";
			case QUART_PLEINE_PROPRIETE -> "1/4 pleine propriété";
		};
	}

	/**
	 * Normalizes frontend/API relation labels carried by SiblingsCommand.relationship:
	 * - GRANDPARENT / GRAND_PARENT / ASCENDANT_ORDINAIRE
	 * - UNCLE_AUNT / ONCLE_TANTE / COUSIN
	 * - default: SIBLING
	 */
	private String normalizeSiblingRelationship(String relationship) {
		if (relationship == null || relationship.isBlank()) return "SIBLING";
		String r = relationship.trim().toUpperCase(Locale.ROOT);
		if (r.contains("GRAND") || r.contains("ASCEND")) return "GRANDPARENT";
		if (r.contains("ONCLE") || r.contains("TANTE") || r.contains("COUSIN") || r.contains("UNCLE") || r.contains("AUNT"))
			return "UNCLE_AUNT";
		return "SIBLING";
	}

	private DeceasedResult deceasedFrom(PersonCommand p) {
		return new DeceasedResult(p.firstName(), p.lastName(), p.age());
	}

	private BigDecimal extractPrincipalResidenceValue(List<AssetCommand> assets) {
		if (assets == null) return ZERO;
		return assets.stream()
				.filter(a -> a.type() != null && stripAccents(a.type()).toUpperCase(Locale.ROOT).contains("RESIDENCE"))
				.map(a -> ServiceUtils.bigDecimalNullOrZero(a.value())
						.subtract(ServiceUtils.bigDecimalNullOrZero(a.debt()))
						.max(ZERO))
				.reduce(ZERO, BigDecimal::add);
	}

	/**
	 * Computes the principal residence value actually included in the deceased estate.
	 *
	 * Priority:
	 * 1) If ownership is provided on assets, compute directly by ownership:
	 *    - PROPRE_CLIENT / PROPRE: 100%
	 *    - PROPRE_CONJOINT: 0%
	 *    - COMMUN / INDIVISION / other: 50% (same simplification as liquidation)
	 * 2) If ownership is not provided, fallback to declared RP(net), capped by estate.
	 *    (No proportional scaling, which can under/over-estimate RP in practice.)
	 */
	private BigDecimal extractPrincipalResidenceValueForEstate(
			List<AssetCommand> assets, BigDecimal estateNet, BigDecimal globalNet) {
		if (assets == null || estateNet == null || estateNet.signum() <= 0) return ZERO;

		boolean hasOwnershipData = assets.stream()
				.anyMatch(a -> a.ownership() != null && !a.ownership().isBlank());

		BigDecimal rpNet = extractPrincipalResidenceValue(assets);
		if (rpNet.signum() <= 0) return ZERO;

		if (!hasOwnershipData) {
			return rpNet.min(estateNet).setScale(2, RoundingMode.HALF_UP);
		}

		BigDecimal includedRp = ZERO;
		for (AssetCommand a : assets) {
			if (a == null || a.type() == null) continue;
			String t = stripAccents(a.type()).toUpperCase(Locale.ROOT);
			if (!t.contains("RESIDENCE")) continue;

			BigDecimal val = ServiceUtils.bigDecimalNullOrZero(a.value());
			BigDecimal debt = ServiceUtils.bigDecimalNullOrZero(a.debt());
			BigDecimal net = val.subtract(debt).max(ZERO);
			if (net.signum() <= 0) continue;

			String own = a.ownership() == null ? "" : a.ownership().trim().toUpperCase(Locale.ROOT);
			if (own.contains("PROPRE_CLIENT") || own.equals("PROPRE")) {
				includedRp = includedRp.add(net);
			} else if (own.contains("PROPRE_CONJOINT")) {
				// Not part of deceased estate at 1st death
			} else {
				// COMMUN / INDIVISION / unknown ownership → simplified 50%
				includedRp = includedRp.add(net.multiply(new BigDecimal("0.5")));
			}
		}

		return includedRp.min(estateNet).setScale(2, RoundingMode.HALF_UP);
	}

	private String stripAccents(String s) {
		return java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD).replaceAll("\\p{M}", "");
	}

	private BigDecimal sumAssetsDebts(List<AssetCommand> assets) {
		if (assets == null) return ZERO;
		return assets.stream().map(a -> ServiceUtils.bigDecimalNullOrZero(a.debt())).reduce(ZERO, BigDecimal::add);
	}

	private String fullName(PersonCommand person) {
		if (person == null) return null;
		String first = person.firstName() != null ? person.firstName() : "";
		String last = person.lastName() != null ? person.lastName() : "";
		String name = (first + " " + last).trim();
		return name.isBlank() ? first : name;
	}

	/**
	 * Resolves the correct default spouse option based on family situation.
	 * - Married + all common children: default USUFRUIT_TOTAL (art. 757 al. 1)
	 * - Married + NOT all common children: forced QUART_PLEINE_PROPRIETE (art. 757 al. 2)
	 * - Married + no children: null (no spouse option applies)
	 * - PACSé + testament + children: TOUTE_PLEINE_PROPRIETE (partner receives QD by testament)
	 * - PACSé + testament + no children: null (handled by buildPacsNoChildren)
	 * - Otherwise: null
	 */
	private SpouseOptionEnum resolveDefaultSpouseOption(
			boolean isMarried, boolean isPacsed, int nbChildren,
			boolean allCommonChildren, boolean hasWill, String rawSpouseOption) {

		if (isMarried && nbChildren > 0) {
			// If user explicitly chose an option (via DDV or frontend), respect it
			if (rawSpouseOption != null && !rawSpouseOption.isBlank()) {
				return mapSpouseOption(rawSpouseOption);
			}
			// Default: depends on whether all children are common
			if (allCommonChildren) {
				return SpouseOptionEnum.USUFRUIT_TOTAL; // art. 757 al. 1
			} else {
				return SpouseOptionEnum.QUART_PLEINE_PROPRIETE; // art. 757 al. 2 — only option
			}
		}

		if (isPacsed && hasWill && nbChildren > 0) {
			// PACSé with testament: partner receives quotité disponible in PP
			return SpouseOptionEnum.TOUTE_PLEINE_PROPRIETE;
		}

		if (!isMarried && !isPacsed && hasWill && nbChildren > 0) {
			// Cohabitation with testament: concubin receives QD in PP, taxed at 60%
			return SpouseOptionEnum.TOUTE_PLEINE_PROPRIETE;
		}

		// No spouse option for: married without children, PACSé without will,
		// PACSé without children, concubin without will, célibataire
		return null;
	}

	private MaritalStatusEnum mapStatut(String raw) {
		if (raw == null) return MaritalStatusEnum.SINGLE;
		String s = raw.trim().toLowerCase(Locale.ROOT);
		if (s.contains("mar")) return MaritalStatusEnum.MARRIED;
		if (s.contains("pacs")) return MaritalStatusEnum.PACSED;
		if (s.contains("concub")) return MaritalStatusEnum.COHABITATION;
		return MaritalStatusEnum.SINGLE;
	}

	private SpouseOptionEnum mapSpouseOption(String raw) {
		if (raw == null) return SpouseOptionEnum.USUFRUIT_TOTAL;
		String s = raw.trim().toLowerCase(Locale.ROOT);
		// "usufruit total" (no "1/4" prefix) → pure usufruit
		if (s.contains("usuf") && !s.contains("1/4") && !s.contains("quart")) return SpouseOptionEnum.USUFRUIT_TOTAL;
		// "1/4 PP + 3/4 usufruit" → mixed option (DDV art. 1094-1)
		if ((s.contains("1/4") || s.contains("quart")) && s.contains("usuf")) return SpouseOptionEnum.QUART_PP_TROIS_QUART_US;
		// "1/4 pleine propriété" (no usufruit) → ab intestat option B (art. 757 C.civ)
		if ((s.contains("1/4") || s.contains("quart")) && !s.contains("usuf")) return SpouseOptionEnum.QUART_PLEINE_PROPRIETE;
		// "pleine propriété quotité disponible" → DDV full PP
		if (s.contains("pp") || s.contains("pleine")) return SpouseOptionEnum.TOUTE_PLEINE_PROPRIETE;
		return SpouseOptionEnum.USUFRUIT_TOTAL;
	}

	// ================================================================
	// Fiscal detail computation (AV, Donations, Legs)
	// ================================================================

	@Override
	public FiscalDetailsResult computeFiscalDetails(CompleteResultsCommand cmd, HeritageResult heritage) {
		List<AvBeneficiaryDetail> avDetails = computeAvDetails(cmd);
		List<DonationRecallDetail> donationDetails = computeDonationDetails(cmd);
		List<LegDetail> legDetails = computeLegDetails(cmd);
		BigDecimal totalLegs = sumLegs(cmd.legs());
		return new FiscalDetailsResult(avDetails, donationDetails, legDetails, totalLegs);
	}

	private List<AvBeneficiaryDetail> computeAvDetails(CompleteResultsCommand cmd) {
		List<LifeInsuranceCommand> avCommands = cmd.lifeInsurances();
		if (avCommands == null || avCommands.isEmpty()) return List.of();

		List<LifeInsuranceInput> inputs = mapLifeInsurances(avCommands);
		if (inputs.isEmpty()) return List.of();

		FiscalRules fiscalRules = fiscalRulesRepository.getOrThrow(2026);
		BigDecimal baseAllowance990I = fiscalRules.lifeInsuranceBefore70GlobalAbatement();
		if (baseAllowance990I == null) baseAllowance990I = new BigDecimal("152500");
		BigDecimal globalAllowance757B = fiscalRules.lifeInsuranceAfter70ReintegrationTreshold();
		if (globalAllowance757B == null) globalAllowance757B = new BigDecimal("30500");

		// Collect unique beneficiary names
		List<String> beneficiaryNames = avCommands.stream()
				.map(LifeInsuranceCommand::beneficiaryName)
				.distinct()
				.collect(Collectors.toList());

		// Count non-exempt beneficiaries for 757 B allowance split
		int nonExemptCount = (int) avCommands.stream()
				.filter(av -> !"CONJOINT".equalsIgnoreCase(av.beneficiaryRelationship())
						&& !"PACS".equalsIgnoreCase(av.beneficiaryRelationship()))
				.map(LifeInsuranceCommand::beneficiaryName)
				.distinct()
				.count();
		nonExemptCount = Math.max(nonExemptCount, 1);

		List<AvBeneficiaryDetail> details = new ArrayList<>();

		for (String name : beneficiaryNames) {
			// Determine relationship from commands
			String rel = avCommands.stream()
					.filter(av -> name.equals(av.beneficiaryName()))
					.map(LifeInsuranceCommand::beneficiaryRelationship)
					.findFirst().orElse("ENFANT");
			boolean exempt = "CONJOINT".equalsIgnoreCase(rel) || "PACS".equalsIgnoreCase(rel);

			// Art. 990 I: sum deathBenefit for before-70 entries
			BigDecimal capital990I = inputs.stream()
					.filter(li -> name.equals(li.beneficiaryName()))
					.filter(li -> li.ageOfInsuredAtPayment() != null && li.ageOfInsuredAtPayment() < 70)
					.map(li -> li.deathBenefit() != null ? li.deathBenefit() : ZERO)
					.reduce(ZERO, BigDecimal::add);

			// Effective allowance (prorated for démembrement)
			BigDecimal effectiveAllowance = ZERO;
			List<LifeInsuranceInput> before70 = inputs.stream()
					.filter(li -> name.equals(li.beneficiaryName()))
					.filter(li -> li.ageOfInsuredAtPayment() != null && li.ageOfInsuredAtPayment() < 70)
					.toList();
			for (LifeInsuranceInput entry : before70) {
				BigDecimal frac = entry.allowanceFraction() != null ? entry.allowanceFraction() : BigDecimal.ONE;
				effectiveAllowance = effectiveAllowance.add(baseAllowance990I.multiply(frac));
			}
			effectiveAllowance = effectiveAllowance.min(baseAllowance990I).setScale(2, RoundingMode.HALF_UP);

			BigDecimal taxable990I = exempt ? ZERO : capital990I.subtract(effectiveAllowance).max(ZERO);
			BigDecimal tax990I = ZERO;
			if (!exempt && taxable990I.signum() > 0) {
				BigDecimal rate1 = fiscalRules.lifeInsurance990IRate1() != null ? fiscalRules.lifeInsurance990IRate1() : new BigDecimal("0.20");
				BigDecimal rate2 = fiscalRules.lifeInsurance990IRate2() != null ? fiscalRules.lifeInsurance990IRate2() : new BigDecimal("0.3125");
				BigDecimal threshold = fiscalRules.lifeInsurance990IThreshold() != null ? fiscalRules.lifeInsurance990IThreshold() : new BigDecimal("700000");
				if (taxable990I.compareTo(threshold) <= 0) {
					tax990I = taxable990I.multiply(rate1);
				} else {
					tax990I = threshold.multiply(rate1)
							.add(taxable990I.subtract(threshold).multiply(rate2));
				}
				tax990I = tax990I.setScale(2, RoundingMode.HALF_UP);
			}

			// Art. 757 B: sum bonusesPaid for after-70 entries
			BigDecimal premiums757B = inputs.stream()
					.filter(li -> name.equals(li.beneficiaryName()))
					.filter(li -> li.ageOfInsuredAtPayment() != null && li.ageOfInsuredAtPayment() >= 70)
					.map(li -> li.bonusesPaid() != null ? li.bonusesPaid() : ZERO)
					.reduce(ZERO, BigDecimal::add);

			BigDecimal allowanceShare757B = exempt ? ZERO
					: globalAllowance757B.divide(new BigDecimal(nonExemptCount), 2, RoundingMode.HALF_UP);
			BigDecimal reintegrated757B = exempt ? ZERO
					: premiums757B.subtract(allowanceShare757B).max(ZERO).setScale(2, RoundingMode.HALF_UP);

			// Only include beneficiaries who have actual AV data
			if (capital990I.signum() > 0 || premiums757B.signum() > 0) {
				details.add(new AvBeneficiaryDetail(
						name, rel,
						capital990I.setScale(2, RoundingMode.HALF_UP),
						exempt ? ZERO : effectiveAllowance,
						taxable990I.setScale(2, RoundingMode.HALF_UP),
						tax990I,
						premiums757B.setScale(2, RoundingMode.HALF_UP),
						allowanceShare757B,
						reintegrated757B,
						exempt));
			}
		}
		return details;
	}

	private List<DonationRecallDetail> computeDonationDetails(CompleteResultsCommand cmd) {
		List<DonationCommand> donations = cmd.donations();
		if (donations == null || donations.isEmpty()) return List.of();

		LocalDate deathDate = cmd.dateOfDeath() != null ? cmd.dateOfDeath() : LocalDate.now();
		FiscalRules fiscalRules = fiscalRulesRepository.getOrThrow(2026);
		int recallYears = fiscalRules.donationRecallYears();
		LocalDate lowerBound = deathDate.minusYears(recallYears);

		List<DonationRecallDetail> details = new ArrayList<>();

		for (DonationCommand don : donations) {
			boolean rapportable = don.rapportable();
			LocalDate donDate = don.donationDate();
			boolean recalled = rapportable && donDate != null && !donDate.isBefore(lowerBound);
			BigDecimal donAmount = don.amount() != null ? don.amount() : ZERO;
			BigDecimal montantRappele = recalled ? donAmount : ZERO;

			// Look up the allowance for this relationship
			RelationshipEnum rel = mapDonationRelationship(don.relationship());
			BigDecimal fullAllowance = getAllowanceForRelationship(fiscalRules, rel);
			BigDecimal afterRecall = recalled ? fullAllowance.subtract(montantRappele).max(ZERO) : fullAllowance;

			details.add(new DonationRecallDetail(
					don.beneficiaryName(),
					donAmount.setScale(2, RoundingMode.HALF_UP),
					donDate != null ? donDate.toString() : null,
					rapportable,
					recalled,
					montantRappele.setScale(2, RoundingMode.HALF_UP),
					fullAllowance.setScale(2, RoundingMode.HALF_UP),
					afterRecall.setScale(2, RoundingMode.HALF_UP)));
		}
		return details;
	}

	private RelationshipEnum mapDonationRelationship(String rel) {
		if (rel == null) return RelationshipEnum.OTHERS;
		String s = rel.trim().toLowerCase(Locale.ROOT);
		if (s.contains("enfant") || s.contains("direct") || s.contains("child") || s.contains("parent")) return RelationshipEnum.DIRECT_LINE;
		if (s.contains("conjoint") || s.contains("spouse") || s.contains("pacs")) return RelationshipEnum.OTHERS;
		if (s.contains("frère") || s.contains("frere") || s.contains("soeur") || s.contains("sœur") || s.contains("sibling")) return RelationshipEnum.SIBLINGS;
		if (s.contains("neveu") || s.contains("nièce") || s.contains("niece")) return RelationshipEnum.NIECE_NEPHEW;
		if (s.contains("grand-parent") || s.contains("grandparent") || s.contains("ascendant")) return RelationshipEnum.GRANDPARENT;
		if (s.contains("oncle") || s.contains("tante") || s.contains("cousin") || s.contains("uncle") || s.contains("aunt")) return RelationshipEnum.UNCLE_AUNT;
		return RelationshipEnum.OTHERS;
	}

	private BigDecimal getAllowanceForRelationship(FiscalRules fiscalRules, RelationshipEnum rel) {
		if (fiscalRules.abatementsByLink() != null) {
			Abatement ab = fiscalRules.abatementsByLink().get(rel);
			if (ab != null && ab.amount() != null) return ab.amount();
		}
		return ZERO;
	}

	private List<LegDetail> computeLegDetails(CompleteResultsCommand cmd) {
		List<LegCommand> legs = cmd.legs();
		if (legs == null || legs.isEmpty()) return List.of();

		FiscalRules fiscalRules = fiscalRulesRepository.getOrThrow(2026);

		List<LegDetail> details = new ArrayList<>();
		for (LegCommand leg : legs) {
			String rel = leg.relationship();
			BigDecimal montant = leg.amount() != null ? leg.amount() : ZERO;

			// Compute tax for this legataire
			RelationshipEnum relEnum = mapLegRelationship(rel);
			BigDecimal droits;
			if (isSpouseOrPacs(rel)) {
				droits = ZERO;
			} else {
				BigDecimal allowance = getAllowanceForRelationship(fiscalRules, relEnum);
				BigDecimal taxable = montant.subtract(allowance).max(ZERO);
				Scale scale = fiscalRules.scalesByLink() != null ? fiscalRules.scalesByLink().get(relEnum) : null;
				droits = scale != null ? FiscalCalculator.rightsPerSlice(taxable, scale) : ZERO;
			}

			details.add(new LegDetail(
					leg.beneficiaryName(),
					rel != null ? rel : "Tiers",
					montant.setScale(2, RoundingMode.HALF_UP),
					droits.setScale(2, RoundingMode.HALF_UP)));
		}
		return details;
	}

	private boolean isSpouseOrPacs(String rel) {
		if (rel == null) return false;
		String s = rel.toLowerCase(Locale.ROOT);
		return s.contains("conjoint") || s.contains("pacs") || s.contains("spouse");
	}

}
