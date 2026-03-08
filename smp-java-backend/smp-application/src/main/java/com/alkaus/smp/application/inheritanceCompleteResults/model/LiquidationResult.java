package com.alkaus.smp.application.inheritanceCompleteResults.model;

import java.math.BigDecimal;

public record LiquidationResult(
		BigDecimal deceasedSeparateAsset,
		BigDecimal commonAsset,
		BigDecimal deceasedShare,
		BigDecimal spouseShare,
		BigDecimal inheritanceAsset
) {}
