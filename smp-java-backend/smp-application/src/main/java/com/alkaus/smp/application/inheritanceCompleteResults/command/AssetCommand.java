package com.alkaus.smp.application.inheritanceCompleteResults.command;

import java.math.BigDecimal;

public record AssetCommand(
		String type,
		BigDecimal value,
		BigDecimal debt,
		String label,
		String ownership // "PROPRE_CLIENT" | "PROPRE_CONJOINT" | "COMMUN" | "INDIVISION" | null (default=COMMUN)
) {
	/** Backward-compatible constructor (ownership defaults to null = COMMUN) */
	public AssetCommand(String type, BigDecimal value, BigDecimal debt, String label) {
		this(type, value, debt, label, null);
	}
}
