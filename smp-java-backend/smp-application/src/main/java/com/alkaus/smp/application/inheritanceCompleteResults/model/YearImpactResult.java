package com.alkaus.smp.application.inheritanceCompleteResults.model;

import java.math.BigDecimal;

public record YearImpactResult(
		BigDecimal annualIncome,
		BigDecimal annualCharges,
		BigDecimal funeralFees,
		BigDecimal inheritanceRights,
		BigDecimal notaryFees,
		BigDecimal total,
		BigDecimal balance
) {}
