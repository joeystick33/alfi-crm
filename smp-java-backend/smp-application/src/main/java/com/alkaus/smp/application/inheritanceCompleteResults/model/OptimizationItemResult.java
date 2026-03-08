package com.alkaus.smp.application.inheritanceCompleteResults.model;

import java.math.BigDecimal;

public record OptimizationItemResult(
		String title,
		String description,
		BigDecimal saving,
		boolean advisable,
		String deadline
) {}
