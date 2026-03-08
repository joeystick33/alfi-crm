package com.alkaus.smp.application.inheritanceCompleteResults.model;

import java.math.BigDecimal;
import java.util.List;

public record OptimizationsResult(
		BigDecimal potentialSavings,
		List<OptimizationItemResult> optimizations
) {}
