package com.alkaus.smp.application.engines;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.alkaus.smp.domain.fiscal.RelationshipEnum;
import com.alkaus.smp.domain.succession.HeirInput;
import com.alkaus.smp.domain.succession.util.MaritalStatusEnum;
import com.alkaus.smp.domain.succession.util.SpouseOptionEnum;

/**
 * Determines legal devolution (heir shares) according to French civil law.
 * Art. 731-767 C.civ for legal succession, art. 1094-1 for DDV options.
 *
 * This engine builds the list of HeirInput with correct quotas and relationships
 * based on the family situation, before the fiscal engine applies taxes.
 */
@Service
public class LegalDevolutionEngine {

	private static final BigDecimal HUNDRED = new BigDecimal("100");
	private static final BigDecimal FIFTY = new BigDecimal("50");
	private static final BigDecimal TWENTY_FIVE = new BigDecimal("25");
	private static final BigDecimal SEVENTY_FIVE = new BigDecimal("75");

	/**
	 * Backward-compatible overload (no representation map, no souche map).
	 */
	public List<HeirInput> buildHeirs(
			MaritalStatusEnum maritalStatus,
			boolean hasSpouse, String spouseName,
			List<String> children,
			boolean hasAllCommonChildren,
			boolean hasLastSurvivorDonation, boolean hasWill,
			boolean fatherAlive, boolean motherAlive,
			String fatherName, String motherName,
			List<String> siblings,
			SpouseOptionEnum spouseOption) {
		return buildHeirs(maritalStatus, hasSpouse, spouseName, children, hasAllCommonChildren,
				hasLastSurvivorDonation, hasWill, fatherAlive, motherAlive, fatherName, motherName,
				siblings, null, Set.of(), spouseOption, Map.of(), List.of(), List.of());
	}

	/**
	 * Backward-compatible overload (no souche map).
	 */
	public List<HeirInput> buildHeirs(
			MaritalStatusEnum maritalStatus,
			boolean hasSpouse, String spouseName,
			List<String> children,
			boolean hasAllCommonChildren,
			boolean hasLastSurvivorDonation, boolean hasWill,
			boolean fatherAlive, boolean motherAlive,
			String fatherName, String motherName,
			List<String> aliveSiblings,
			Map<String, List<String>> representationMap,
			Set<String> disabledChildren,
			SpouseOptionEnum spouseOption) {
		return buildHeirs(maritalStatus, hasSpouse, spouseName, children, hasAllCommonChildren,
				hasLastSurvivorDonation, hasWill, fatherAlive, motherAlive, fatherName, motherName,
				aliveSiblings, representationMap, disabledChildren, spouseOption, Map.of(), List.of(), List.of());
	}

	/**
	 * Full signature with souche map for per-souche representation of predeceased children.
	 *
	 * @param childSoucheMap  map: child name → souche name (predeceased parent). Empty for direct children.
	 */
	public List<HeirInput> buildHeirs(
			MaritalStatusEnum maritalStatus,
			boolean hasSpouse, String spouseName,
			List<String> children,
			boolean hasAllCommonChildren,
			boolean hasLastSurvivorDonation, boolean hasWill,
			boolean fatherAlive, boolean motherAlive,
			String fatherName, String motherName,
			List<String> aliveSiblings,
			Map<String, List<String>> representationMap,
			Set<String> disabledChildren,
			SpouseOptionEnum spouseOption,
			Map<String, String> childSoucheMap) {
		return buildHeirs(maritalStatus, hasSpouse, spouseName, children, hasAllCommonChildren,
				hasLastSurvivorDonation, hasWill, fatherAlive, motherAlive, fatherName, motherName,
				aliveSiblings, representationMap, disabledChildren, spouseOption, childSoucheMap, List.of(), List.of());
	}

	/**
	 * Full signature including order-3/order-4 nominative relatives.
	 */
	public List<HeirInput> buildHeirs(
			MaritalStatusEnum maritalStatus,
			boolean hasSpouse, String spouseName,
			List<String> children,
			boolean hasAllCommonChildren,
			boolean hasLastSurvivorDonation, boolean hasWill,
			boolean fatherAlive, boolean motherAlive,
			String fatherName, String motherName,
			List<String> aliveSiblings,
			Map<String, List<String>> representationMap,
			Set<String> disabledChildren,
			SpouseOptionEnum spouseOption,
			Map<String, String> childSoucheMap,
			List<String> ordinaryAscendants,
			List<String> ordinaryCollaterals) {

		int nbChildren = children != null ? children.size() : 0;
		boolean isMarried = maritalStatus == MaritalStatusEnum.MARRIED;
		boolean isPacsed = maritalStatus == MaritalStatusEnum.PACSED;
		List<String> safeSiblings = aliveSiblings != null ? aliveSiblings : List.of();
		Map<String, List<String>> safeRepMap = representationMap != null ? representationMap : Map.of();
		Map<String, String> safeSoucheMap = childSoucheMap != null ? childSoucheMap : Map.of();
		List<String> safeOrdAsc = ordinaryAscendants != null ? ordinaryAscendants : List.of();
		List<String> safeOrdCol = ordinaryCollaterals != null ? ordinaryCollaterals : List.of();

		// ================================================================
		// CASE 1: With children
		// ================================================================
		Set<String> safeDisabled = disabledChildren != null ? disabledChildren : Set.of();
		if (nbChildren > 0) {
			return buildWithChildren(isMarried, isPacsed, hasSpouse, spouseName,
					children, hasAllCommonChildren, hasLastSurvivorDonation, hasWill, safeDisabled, spouseOption, safeSoucheMap);
		}

		// ================================================================
		// CASE 2: No children — with spouse
		// ================================================================
		if (hasSpouse && isMarried) {
			return buildMarriedNoChildren(spouseName, fatherAlive, motherAlive, fatherName, motherName, safeSiblings);
		}

		// PACS: no legal succession rights without will
		if (hasSpouse && isPacsed) {
			return buildPacsNoChildren(spouseName, hasWill, fatherAlive, motherAlive,
					fatherName, motherName, safeSiblings);
		}

		// ================================================================
		// CASE 3: No spouse — legal devolution by order (with representation)
		// ================================================================
		return buildNoSpouse(fatherAlive, motherAlive, fatherName, motherName, safeSiblings, safeRepMap,
				safeOrdAsc, safeOrdCol);
	}

	/**
	 * Determines the available spouse options based on the family situation.
	 */
	public List<SpouseOptionEnum> availableOptions(
			MaritalStatusEnum maritalStatus, boolean hasChildren,
			boolean hasAllCommonChildren, boolean hasLastSurvivorDonation) {

		if (maritalStatus != MaritalStatusEnum.MARRIED || !hasChildren) {
			return List.of();
		}

		List<SpouseOptionEnum> options = new ArrayList<>();

		if (hasAllCommonChildren) {
			// Art. 757: USF total OR 1/4 PP
			options.add(SpouseOptionEnum.USUFRUIT_TOTAL);
		}

		// 1/4 PP is always available with children (art. 757)
		// (this is the default when children are not all common)

		if (hasLastSurvivorDonation) {
			// Art. 1094-1: DDV opens 1/4 PP + 3/4 USF and QD in PP
			options.add(SpouseOptionEnum.QUART_PP_TROIS_QUART_US);
			options.add(SpouseOptionEnum.TOUTE_PLEINE_PROPRIETE);
		}

		return options;
	}

	// ================================================================
	// Private builders
	// ================================================================

	/**
	 * Build heirs when children are present, with per-souche share calculation.
	 * Art. 751 C.civ: When a child has predeceased, their descendants (representants)
	 * inherit the predeceased child's share, divided equally among them.
	 * Each souche (predeceased child) counts as one child for share calculation.
	 *
	 * @param childSoucheMap map: representant name → souche name (predeceased parent).
	 *                       Empty for direct children (they are their own souche).
	 */
	private List<HeirInput> buildWithChildren(
			boolean isMarried, boolean isPacsed,
			boolean hasSpouse, String spouseName,
			List<String> children, boolean hasAllCommonChildren,
			boolean hasLastSurvivorDonation, boolean hasWill,
			Set<String> disabledChildren,
			SpouseOptionEnum spouseOption,
			Map<String, String> childSoucheMap) {

		List<HeirInput> heirs = new ArrayList<>();

		if (hasSpouse && isMarried) {
			heirs.add(new HeirInput(spouseName, RelationshipEnum.OTHERS,
					HUNDRED, true, true));
		} else if (hasSpouse && isPacsed && hasWill) {
			heirs.add(new HeirInput(spouseName, RelationshipEnum.OTHERS,
					HUNDRED, true, true));
		} else if (hasSpouse && hasWill && !isMarried && !isPacsed) {
			heirs.add(new HeirInput(spouseName, RelationshipEnum.OTHERS,
					HUNDRED, true, false));
		}

		// ── Per-souche share calculation (art. 751 C.civ) ──
		// Count souches: direct children each = 1 souche, all representants of same predeceased child = 1 souche
		java.util.LinkedHashMap<String, List<String>> soucheGroups = new java.util.LinkedHashMap<>();
		for (String childName : children) {
			String souche = childSoucheMap.getOrDefault(childName, null);
			if (souche != null) {
				soucheGroups.computeIfAbsent(souche, k -> new ArrayList<>()).add(childName);
			} else {
				// Direct child: own souche
				soucheGroups.computeIfAbsent(childName, k -> new ArrayList<>()).add(childName);
			}
		}

		int nbSouches = soucheGroups.size();
		BigDecimal soucheShare = HUNDRED.divide(new BigDecimal(nbSouches), 6, RoundingMode.HALF_UP);

		for (Map.Entry<String, List<String>> entry : soucheGroups.entrySet()) {
			String soucheName = entry.getKey();
			List<String> members = entry.getValue();
			boolean isRepresentation = members.size() == 1 && members.get(0).equals(soucheName)
					? false // direct child
					: childSoucheMap.containsValue(soucheName); // representants

			if (!isRepresentation) {
				// Direct child
				String childName = members.get(0);
				boolean isDisabled = disabledChildren.contains(childName);
				heirs.add(new HeirInput(childName, RelationshipEnum.DIRECT_LINE,
						soucheShare, false, false, true, isDisabled, null, 0));
			} else {
				// Representants sharing the souche's share
				BigDecimal repShare = soucheShare.divide(new BigDecimal(members.size()), 6, RoundingMode.HALF_UP);
				for (String repName : members) {
					boolean isDisabled = disabledChildren.contains(repName);
					heirs.add(new HeirInput(repName, RelationshipEnum.DIRECT_LINE,
							repShare, false, false, true, isDisabled, soucheName, members.size()));
				}
			}
		}

		return heirs;
	}

	/**
	 * Married, no children: art. 757-1 and 757-2 C.civ
	 */
	private List<HeirInput> buildMarriedNoChildren(
			String spouseName,
			boolean fatherAlive, boolean motherAlive,
			String fatherName, String motherName,
			List<String> siblings) {

		List<HeirInput> heirs = new ArrayList<>();
		int nbParents = (fatherAlive ? 1 : 0) + (motherAlive ? 1 : 0);

		if (nbParents == 2) {
			// Art. 757-1: conjoint 1/2, père 1/4, mère 1/4
			heirs.add(new HeirInput(spouseName, RelationshipEnum.OTHERS, FIFTY, true, true));
			heirs.add(new HeirInput(fatherName, RelationshipEnum.DIRECT_LINE, TWENTY_FIVE, false, false));
			heirs.add(new HeirInput(motherName, RelationshipEnum.DIRECT_LINE, TWENTY_FIVE, false, false));
		} else if (nbParents == 1) {
			// Art. 757-1: conjoint 3/4, parent survivant 1/4
			heirs.add(new HeirInput(spouseName, RelationshipEnum.OTHERS, SEVENTY_FIVE, true, true));
			String parentName = fatherAlive ? fatherName : motherName;
			heirs.add(new HeirInput(parentName, RelationshipEnum.DIRECT_LINE, TWENTY_FIVE, false, false));
		} else {
			// Art. 757-2: conjoint hérite de tout (sauf droit de retour fratrie)
			heirs.add(new HeirInput(spouseName, RelationshipEnum.OTHERS, HUNDRED, true, true));
		}

		return heirs;
	}

	/**
	 * PACS, no children: no legal rights without will.
	 * With will + no children: since 2006 reform, ascendants have NO réserve héréditaire,
	 * only a droit de retour (art. 738-2 C.civ) which is not modelled here.
	 * Therefore QD = 100% → partner can receive everything by testament.
	 */
	private List<HeirInput> buildPacsNoChildren(
			String spouseName, boolean hasWill,
			boolean fatherAlive, boolean motherAlive,
			String fatherName, String motherName,
			List<String> siblings) {

		if (!hasWill) {
			// No will: PACS partner gets nothing, devolution goes to parents/siblings
			return buildNoSpouse(fatherAlive, motherAlive, fatherName, motherName, siblings, Map.of(), List.of(), List.of());
		}

		// With will + no children: no héritiers réservataires → QD = 100%
		// Partner receives everything (fiscally exempt, art. 796-0 bis CGI)
		List<HeirInput> heirs = new ArrayList<>();
		heirs.add(new HeirInput(spouseName, RelationshipEnum.OTHERS, HUNDRED, true, true));
		return heirs;
	}

	/**
	 * No spouse: legal orders (art. 734-755 C.civ), with representation support.
	 * Order 1: children (already handled above in buildWithChildren)
	 * Order 2: parents + siblings (+ nephews/nieces by representation, art. 751 C.civ)
	 * Order 3: ascendants other than parents (grands-parents, art. 746-749 C.civ)
	 * Order 4: collaterals ordinaires (oncles/tantes/cousins, art. 750-755 C.civ)
	 * Fallback: empty list → État recueille en déshérence (art. 811 C.civ)
	 *
	 * Representation (art. 751 C.civ): When a sibling has predeceased, their children
	 * (nephews/nieces) inherit the deceased sibling's share, divided equally among them.
	 * Each souche (deceased sibling) counts as one sibling for share calculation.
	 *
	 * @param aliveSiblings    list of alive sibling names
	 * @param representationMap map: deceased sibling name → list of their children names
	 */
	private List<HeirInput> buildNoSpouse(
			boolean fatherAlive, boolean motherAlive,
			String fatherName, String motherName,
			List<String> aliveSiblings,
			Map<String, List<String>> representationMap,
			List<String> ordinaryAscendants,
			List<String> ordinaryCollaterals) {

		List<HeirInput> heirs = new ArrayList<>();
		List<String> safeSiblings = aliveSiblings != null ? aliveSiblings : List.of();
		Map<String, List<String>> safeRepMap = representationMap != null ? representationMap : Map.of();
		int nbParents = (fatherAlive ? 1 : 0) + (motherAlive ? 1 : 0);

		// Total number of souches = alive siblings + deceased siblings with representation
		int nbSouches = safeSiblings.size() + safeRepMap.size();

		// ── ORDER 2: parents + privileged collaterals (siblings/nephews) ──
		if (nbParents > 0 && nbSouches > 0) {
			// Parents: 1/4 each, siblings/souches share the rest
			BigDecimal parentShare = TWENTY_FIVE;
			if (fatherAlive) {
				heirs.add(new HeirInput(fatherName, RelationshipEnum.DIRECT_LINE, parentShare, false, false));
			}
			if (motherAlive) {
				heirs.add(new HeirInput(motherName, RelationshipEnum.DIRECT_LINE, parentShare, false, false));
			}
			BigDecimal siblingTotal = HUNDRED.subtract(parentShare.multiply(new BigDecimal(nbParents)));
			addSiblingsAndNephews(heirs, safeSiblings, safeRepMap, siblingTotal, nbSouches);
		} else if (nbParents > 0) {
			// Parents only: equal shares
			BigDecimal parentShare = HUNDRED.divide(new BigDecimal(nbParents), 6, RoundingMode.HALF_UP);
			if (fatherAlive) {
				heirs.add(new HeirInput(fatherName, RelationshipEnum.DIRECT_LINE, parentShare, false, false));
			}
			if (motherAlive) {
				heirs.add(new HeirInput(motherName, RelationshipEnum.DIRECT_LINE, parentShare, false, false));
			}
		} else if (nbSouches > 0) {
			// Siblings/souches only: equal shares
			addSiblingsAndNephews(heirs, safeSiblings, safeRepMap, HUNDRED, nbSouches);
		}
		// ── ORDER 3: ascendants ordinaires (grands-parents, art. 746-749 C.civ) ──
		// Triggered only if no order 2 heirs found.
		// Fente successorale: 50% ligne paternelle, 50% ligne maternelle.
		// Not collected in current UI → generate placeholder heirs if needed.
		// For now: if no parents and no siblings, the engine reports no heirs
		// and the frontend disclaimer warns about limitations.

		// ── ORDER 4: collateraux ordinaires (oncles/tantes/cousins, art. 750-755 C.civ) ──
		// Same limitation: not collected in current UI.
		// Placeholder: if heirs is still empty, add a single "Collatéral ordinaire" heir
		// so the fiscal engine can at least compute the 55-60% tax rate.
		// This is a graceful degradation — better than silently returning 0 heirs.

		if (heirs.isEmpty() && ordinaryAscendants != null && !ordinaryAscendants.isEmpty()) {
			BigDecimal share = HUNDRED.divide(new BigDecimal(ordinaryAscendants.size()), 6, RoundingMode.HALF_UP);
			for (String asc : ordinaryAscendants) {
				heirs.add(new HeirInput(asc, RelationshipEnum.GRANDPARENT, share, false, false));
			}
		}

		if (heirs.isEmpty() && ordinaryCollaterals != null && !ordinaryCollaterals.isEmpty()) {
			BigDecimal share = HUNDRED.divide(new BigDecimal(ordinaryCollaterals.size()), 6, RoundingMode.HALF_UP);
			for (String col : ordinaryCollaterals) {
				heirs.add(new HeirInput(col, RelationshipEnum.UNCLE_AUNT, share, false, false));
			}
		}

		if (heirs.isEmpty()) {
			throw new IllegalArgumentException(
					"Données familiales insuffisantes: renseignez les ascendants/collatéraux ordinaires (ordre 3/4).");
		}

		return heirs;
	}

	/**
	 * Helper: distribute shares among alive siblings and nephews/nieces by representation.
	 */
	private void addSiblingsAndNephews(List<HeirInput> heirs, List<String> aliveSiblings,
			Map<String, List<String>> representationMap, BigDecimal totalShare, int nbSouches) {
		BigDecimal soucheShare = totalShare.divide(new BigDecimal(nbSouches), 6, RoundingMode.HALF_UP);
		for (String sib : aliveSiblings) {
			heirs.add(new HeirInput(sib, RelationshipEnum.SIBLINGS, soucheShare, false, false));
		}
		for (Map.Entry<String, List<String>> entry : representationMap.entrySet()) {
			List<String> nephews = entry.getValue();
			if (!nephews.isEmpty()) {
				BigDecimal nephewShare = soucheShare.divide(new BigDecimal(nephews.size()), 6, RoundingMode.HALF_UP);
				for (String nephew : nephews) {
					heirs.add(new HeirInput(nephew, RelationshipEnum.NIECE_NEPHEW, nephewShare, false, false));
				}
			}
		}
	}
}
