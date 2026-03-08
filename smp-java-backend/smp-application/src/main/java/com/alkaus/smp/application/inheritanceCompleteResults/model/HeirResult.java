package com.alkaus.smp.application.inheritanceCompleteResults.model;

import java.math.BigDecimal;

import com.alkaus.smp.domain.fiscal.RelationshipEnum;

public record HeirResult(
		String name,
		RelationshipEnum relationship,
		BigDecimal quota,
		BigDecimal amountTransmitted,
		BigDecimal taxAllowance,
		BigDecimal taxRights,
		String rightType,              // "Pleine propriété", "Usufruit", "Nue-propriété"
		BigDecimal taxableValue,       // value after USF/NP evaluation
		BigDecimal baseAfterAllowance, // taxable base after allowance
		boolean disabled               // art. 779 II CGI — personne handicapée
) {
	/** Backward-compatible constructor */
	public HeirResult(String name, RelationshipEnum relationship, BigDecimal quota,
			BigDecimal amountTransmitted, BigDecimal taxAllowance, BigDecimal taxRights) {
		this(name, relationship, quota, amountTransmitted, taxAllowance, taxRights, null, null, null, false);
	}
	/** Constructor without disabled (backward-compatible) */
	public HeirResult(String name, RelationshipEnum relationship, BigDecimal quota,
			BigDecimal amountTransmitted, BigDecimal taxAllowance, BigDecimal taxRights,
			String rightType, BigDecimal taxableValue, BigDecimal baseAfterAllowance) {
		this(name, relationship, quota, amountTransmitted, taxAllowance, taxRights,
				rightType, taxableValue, baseAfterAllowance, false);
	}
}
