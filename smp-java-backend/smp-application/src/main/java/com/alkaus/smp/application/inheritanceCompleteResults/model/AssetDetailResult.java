package com.alkaus.smp.application.inheritanceCompleteResults.model;

import java.math.BigDecimal;

public record AssetDetailResult(
		String type,
		String designation,
		String label,
		BigDecimal value,
		BigDecimal debt,
		BigDecimal netValue
) {}
