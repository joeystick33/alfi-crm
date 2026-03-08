package com.alkaus.smp.domain.fiscal;

/**
 * Family relationship between the heir and the deceased for tax category This
 * enum is used to : _ choose which abatement to use _ choose which scale to use
 * in the fiscal rules
 */
public enum RelationshipEnum {
	// Direct line : parents, children, ascendants / descendants
	DIRECT_LINE,

	// Brothers and sisters of the deceased
	SIBLINGS,

	// Nephew and niece of the deceased
	NIECE_NEPHEW,

	// Grandparents (ascendants ordinaires, ordre 3 — art. 746-749 C.civ)
	GRANDPARENT,

	// Uncles, aunts, cousins (collatéraux ordinaires, ordre 4 — art. 750-755 C.civ)
	UNCLE_AUNT,

	// non parents
	OTHERS;

}
