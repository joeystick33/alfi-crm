package com.alkaus.smp.application.inheritanceCompleteResults.command;

import java.math.BigDecimal;

/**
 * Represents a specific legacy (legs particulier) that reduces the estate
 * before legal devolution to universal heirs.
 */
public record LegCommand(
		String beneficiaryName,
		BigDecimal amount,
		String description,
		String relationship,
		String owner // "CLIENT" | "CONJOINT" | null (null=CLIENT by default)
) {
	/** Backward-compatible constructor (owner defaults to null = CLIENT) */
	public LegCommand(String beneficiaryName, BigDecimal amount, String description, String relationship) {
		this(beneficiaryName, amount, description, relationship, null);
	}
}
