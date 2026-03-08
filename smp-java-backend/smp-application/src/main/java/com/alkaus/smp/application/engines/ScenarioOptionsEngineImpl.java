package com.alkaus.smp.application.engines;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Component;

import com.alkaus.smp.application.utils.Constantes;
import com.alkaus.smp.application.utils.ServiceUtils;
import com.alkaus.smp.domain.succession.HeirInput;
import com.alkaus.smp.domain.succession.InheritanceInput;
import com.alkaus.smp.domain.succession.ScenarioAllocation;
import com.alkaus.smp.domain.succession.util.RightReceivedEnum;


@Component
public class ScenarioOptionsEngineImpl implements ScenarioOptionsEngine {

	private final static BigDecimal ZERO = Constantes.ZERO;
	private final static BigDecimal ONE_HUNDRED = Constantes.ONE_HUNDRED;
	private final static BigDecimal TWENTY_FIVE = Constantes.TWENTY_FIVE;
	private final static BigDecimal SEVENTY_FIVE = Constantes.SEVENTY_FIVE;

	private final ForcedHeirshipCalculator heirshipCalculator;

	public ScenarioOptionsEngineImpl(ForcedHeirshipCalculator heirshipCalculator) {
		this.heirshipCalculator = heirshipCalculator;
	}

	@Override
	public ScenarioAllocation generateScenario(InheritanceInput input) {
		// Detection spouse & children
		List<HeirInput> heirs = input.heirs() != null ? input.heirs() : List.of();

		HeirInput spouse = heirs.stream().filter(HeirInput::spouse).findFirst().orElse(null);
		List<HeirInput> children = heirs.stream().filter(h -> !h.spouse()).toList();

		// No spouse => all in PP to the heirs according to the existing quota
		// percentage
		if (spouse == null) {
			if (heirs.isEmpty()) {
				return new ScenarioAllocation(List.of());
			}
			validateQuotesSumOrThrow(heirs);
			return allocationWithoutSpouse(children);
		}

		// If no spouse option specified (e.g. married without children, or PACSé without children),
		// allocate everything in PP according to the quotas from buildHeirs
		if (input.spouseOption() == null) {
			return allocationAllInPP(spouse, children);
		}

		return switch (input.spouseOption()) {
		case USUFRUIT_TOTAL -> allocationTotalUsufruct(spouse, children);
		case QUART_PP_TROIS_QUART_US -> allocationQuarterPP_ThreeQuarterUs(spouse, children);
		case TOUTE_PLEINE_PROPRIETE -> allocationAllPP(spouse, children);
		case QUART_PLEINE_PROPRIETE -> allocationQuarterPPOnly(spouse, children);
		};

	}

	/* ------------- Scénarios ----------------- */

	/**
	 * All heirs (including spouse) receive their quota in pleine propriété.
	 * Used when no spouse option applies (e.g. married without children, PACSé without children).
	 * No démembrement (no USF/NP split).
	 */
	private ScenarioAllocation allocationAllInPP(HeirInput spouse, List<HeirInput> nonSpouseHeirs) {
		var lines = new ArrayList<ScenarioAllocation.AllocationLine>();
		lines.add(new ScenarioAllocation.AllocationLine(spouse.name(), RightReceivedEnum.PLEINE_PROPRIETE,
				ServiceUtils.bigDecimalNullOrZero(spouse.quotaPercentage())));
		for (HeirInput h : nonSpouseHeirs) {
			lines.add(new ScenarioAllocation.AllocationLine(h.name(), RightReceivedEnum.PLEINE_PROPRIETE,
					ServiceUtils.bigDecimalNullOrZero(h.quotaPercentage())));
		}
		return new ScenarioAllocation(lines);
	}

	/**
	 * Scenario without spouse
	 * 
	 * @param heirs
	 * @return scenarioAllocation
	 */
	private ScenarioAllocation allocationWithoutSpouse(List<HeirInput> heirs) {
		var lines = new ArrayList<ScenarioAllocation.AllocationLine>();
		for (HeirInput h : heirs) {
			lines.add(new ScenarioAllocation.AllocationLine(h.name(), RightReceivedEnum.PLEINE_PROPRIETE,
					ServiceUtils.bigDecimalNullOrZero(h.quotaPercentage())));
		}
		return new ScenarioAllocation(lines);
	}

	/**
	 * Scenario for children full property
	 * 
	 * @param spouse
	 * @param children
	 * @return scenarioAllocation
	 */
	private ScenarioAllocation allocationTotalUsufruct(HeirInput spouse, List<HeirInput> children) {
		var lines = new ArrayList<ScenarioAllocation.AllocationLine>();

		// Spouse : 100% usufruct
		lines.add(new ScenarioAllocation.AllocationLine(spouse.name(), RightReceivedEnum.USUFRUIT, ONE_HUNDRED));
		// Enfants : 100% nue-propriété répartie selon quote-part
		for (HeirInput e : children) {
			lines.add(new ScenarioAllocation.AllocationLine(e.name(), RightReceivedEnum.NUE_PROPRIETE,
					ServiceUtils.bigDecimalNullOrZero(e.quotaPercentage())));
		}

		return new ScenarioAllocation(lines);
	}

	/**
	 * Scenario for 1/4 full property and 3/4 usufruct
	 * 
	 * @param spouse
	 * @param children
	 * @return scenarioAllocation
	 */
	private ScenarioAllocation allocationQuarterPP_ThreeQuarterUs(HeirInput spouse, List<HeirInput> children) {
		var lines = new ArrayList<ScenarioAllocation.AllocationLine>();

		// Spouse : 25% PP + 75% US
		lines.add(
				new ScenarioAllocation.AllocationLine(spouse.name(), RightReceivedEnum.PLEINE_PROPRIETE, TWENTY_FIVE));
		lines.add(new ScenarioAllocation.AllocationLine(spouse.name(), RightReceivedEnum.USUFRUIT, SEVENTY_FIVE));

		// Children : 75% NP répartie + 75% ? => en civil, ils ont NP sur 75, et PP sur
		// 75? Non.
		// Ici on suit l'option "1/4 PP + 3/4 US" => enfants ont NP sur 3/4.
		for (HeirInput e : children) {
			BigDecimal pctNP = ServiceUtils.bigDecimalNullOrZero(e.quotaPercentage()).multiply(new BigDecimal("0.75"));
			lines.add(new ScenarioAllocation.AllocationLine(e.name(), RightReceivedEnum.NUE_PROPRIETE, pctNP));
		}

		return new ScenarioAllocation(lines);
	}

	/**
	 * Scenario for 1/4 PP only (ab intestat option B, art. 757 C.civ)
	 * Spouse: 25% PP, Children: 75% PP equally divided. No usufruit.
	 */
	private ScenarioAllocation allocationQuarterPPOnly(HeirInput spouse, List<HeirInput> children) {
		var lines = new ArrayList<ScenarioAllocation.AllocationLine>();
		// Spouse: 25% pleine propriété
		lines.add(new ScenarioAllocation.AllocationLine(spouse.name(), RightReceivedEnum.PLEINE_PROPRIETE, TWENTY_FIVE));
		// Children: 75% pleine propriété equally divided
		for (HeirInput e : children) {
			BigDecimal pctPP = ServiceUtils.bigDecimalNullOrZero(e.quotaPercentage())
					.multiply(new BigDecimal("0.75"));
			lines.add(new ScenarioAllocation.AllocationLine(e.name(), RightReceivedEnum.PLEINE_PROPRIETE, pctPP));
		}
		return new ScenarioAllocation(lines);
	}

	/**
	 * Scenario for QD en pleine propriété (DDV art. 1094-1 C.civ).
	 * Spouse receives the quotité disponible in PP.
	 * Children receive the réserve héréditaire in PP, equally divided.
	 * If no children, spouse receives 100% PP.
	 *
	 * @param spouse
	 * @param children
	 * @return scenarioAllocation
	 */
	private ScenarioAllocation allocationAllPP(HeirInput spouse, List<HeirInput> children) {
		var lignes = new ArrayList<ScenarioAllocation.AllocationLine>();
		int nbChildren = children.size();

		if (nbChildren == 0) {
			// No children: spouse receives everything in PP
			lignes.add(new ScenarioAllocation.AllocationLine(
					spouse.name(), RightReceivedEnum.PLEINE_PROPRIETE, ONE_HUNDRED));
		} else {
			// Spouse: quotité disponible en pleine propriété (art. 913 C.civ)
			BigDecimal qdFraction = heirshipCalculator.availableQuotaFraction(nbChildren);
			BigDecimal qdPct = qdFraction.multiply(ONE_HUNDRED);
			lignes.add(new ScenarioAllocation.AllocationLine(
					spouse.name(), RightReceivedEnum.PLEINE_PROPRIETE, qdPct));

			// Children: réserve héréditaire en pleine propriété, répartie selon quote-part
			BigDecimal reserveFraction = BigDecimal.ONE.subtract(qdFraction);
			for (HeirInput e : children) {
				BigDecimal pctPP = ServiceUtils.bigDecimalNullOrZero(e.quotaPercentage())
						.multiply(reserveFraction);
				lignes.add(new ScenarioAllocation.AllocationLine(
						e.name(), RightReceivedEnum.PLEINE_PROPRIETE, pctPP));
			}
		}

		return new ScenarioAllocation(lignes);
	}

	/**
	 * Helper
	 * 
	 * @param heritiers
	 */
	private void validateQuotesSumOrThrow(List<HeirInput> heritiers) {
		var sum = heritiers.stream().map(HeirInput::quotaPercentage).reduce(ZERO, BigDecimal::add);
		// Quotas are expressed as percentages (0-100), so the sum must be ~100
		if (sum.subtract(ONE_HUNDRED).abs().compareTo(new BigDecimal("0.01")) > 0) {
			throw new IllegalArgumentException(
					"La somme des quotes-parts doit être égale à 100 (actuelle=" + sum + ")");
		}
	}

}
