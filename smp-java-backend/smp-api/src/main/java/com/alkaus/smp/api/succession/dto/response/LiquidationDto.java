package com.alkaus.smp.api.succession.dto.response;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

public record LiquidationDto(

		@JsonProperty("biensPropreDefunt")
		BigDecimal deceasedSeparateAsset,

		@JsonProperty("biensCommuns")
		BigDecimal commonAsset,

		@JsonProperty("partDefunt")
		BigDecimal deceasedShare,

		@JsonProperty("partConjoint")
		BigDecimal spouseShare,

		@JsonProperty("actifSuccessoral")
		BigDecimal inheritanceAsset
) {}
