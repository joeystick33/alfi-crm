package com.alkaus.smp.domain.succession;

import java.math.BigDecimal;

import com.alkaus.smp.domain.fiscal.RelationshipEnum;

/**
 * Record for HeirInput with the heir input informations
 * 
 * @author alkaus
 */
public record HeirInput(
		String name, 
		RelationshipEnum relationshipEnum, 
		BigDecimal quotaPercentage, // [0;100] percentage share
		boolean spouse,
		boolean exemptTax,
		boolean commonChild,          // true if child of both spouses (art. 757)
		boolean disabled,             // true if disabled heir (+159 325 € allowance)
		String inheritsOnBehalfOf,    // non-null if inheriting by representation (parent name)
		int coRepresentantsCount      // number of co-representants sharing the represented parent's share
) {
	/** Backward-compatible constructor for existing code */
	public HeirInput(String name, RelationshipEnum relationshipEnum, BigDecimal quotaPercentage,
			boolean spouse, boolean exemptTax) {
		this(name, relationshipEnum, quotaPercentage, spouse, exemptTax, true, false, null, 0);
	}
}
