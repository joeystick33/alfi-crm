package com.alkaus.smp.application.inheritanceCompleteResults.model;

import java.math.BigDecimal;
import java.util.List;

public record HeritageResult(
		BigDecimal totalGross,
		BigDecimal totalNet,
		RepartitionResult repartition,
		List<AssetDetailResult> assets
) {}
