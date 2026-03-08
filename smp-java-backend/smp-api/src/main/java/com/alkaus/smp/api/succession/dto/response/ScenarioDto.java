package com.alkaus.smp.api.succession.dto.response;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record ScenarioDto(
		String label,
		
		@JsonProperty("defunt")
		DeceasedDto deceased,

		@JsonProperty("optionConjoint")
		String spouseOption,
		
		@JsonProperty("actifSuccessoral")
		BigDecimal inheritanceAsset,
		
		LiquidationDto liquidation,

		@JsonProperty("masse")
		MassDto mass,
		
		@JsonProperty("heritiers")
		List<HeirDto> heirs,

		@JsonProperty("droitsSuccession")
		BigDecimal inheritanceRights,

		@JsonProperty("fraisNotaire")
		BigDecimal notaryFees,

		@JsonProperty("transmissionNette")
		BigDecimal netTransmission,

		@JsonProperty("tauxTransmission")
		BigDecimal transmissionRate,

		@JsonProperty("impactBudgetaire")
		FinancialImpactDto financialImpact
) {}
