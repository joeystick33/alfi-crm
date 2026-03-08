package com.alkaus.smp.application.inheritanceCompleteResults.command;

import java.math.BigDecimal;

/**
 * Represents a life insurance contract from the frontend.
 * Each beneficiary of a contract generates a separate command entry.
 */
public record LifeInsuranceCommand(
		String beneficiaryName,
		String beneficiaryRelationship,
		BigDecimal primesAvant70,
		BigDecimal primesApres70,
		BigDecimal capitalDeces,
		Integer ageAssureAuVersement,
		BigDecimal allowanceFraction,		// fraction de l'abattement 152 500 € (1.0 = PP, NP% = démembrement)
		String owner // "CLIENT" | "CONJOINT" | null (null=CLIENT by default)
) {
	/** Backward-compatible constructor: allowanceFraction defaults to 1.0, owner null */
	public LifeInsuranceCommand(String beneficiaryName, String beneficiaryRelationship,
			BigDecimal primesAvant70, BigDecimal primesApres70, BigDecimal capitalDeces,
			Integer ageAssureAuVersement) {
		this(beneficiaryName, beneficiaryRelationship, primesAvant70, primesApres70,
				capitalDeces, ageAssureAuVersement, BigDecimal.ONE, null);
	}

	/** Constructor with allowanceFraction but no owner */
	public LifeInsuranceCommand(String beneficiaryName, String beneficiaryRelationship,
			BigDecimal primesAvant70, BigDecimal primesApres70, BigDecimal capitalDeces,
			Integer ageAssureAuVersement, BigDecimal allowanceFraction) {
		this(beneficiaryName, beneficiaryRelationship, primesAvant70, primesApres70,
				capitalDeces, ageAssureAuVersement, allowanceFraction, null);
	}
}
