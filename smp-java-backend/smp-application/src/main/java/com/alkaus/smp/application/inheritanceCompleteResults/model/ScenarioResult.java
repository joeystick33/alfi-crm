package com.alkaus.smp.application.inheritanceCompleteResults.model;

import java.math.BigDecimal;
import java.util.List;

/**
 * Record for the scenarioResult
 * 
 * @author alkaus
 */
public record ScenarioResult(
		String label,
		DeceasedResult deceased,
		String spouseOption,
		BigDecimal inheritanceAsset,
		LiquidationResult liquidation,
		MassResult mass,
		List<HeirResult> heirs,
		BigDecimal inheritanceRights,
		BigDecimal notaryFees,
		BigDecimal netTransmission,
		BigDecimal transmissionRate,
		FinancialImpactResult financialImpact,
		boolean relevant) {
}
