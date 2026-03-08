package com.alkaus.smp.api.succession.dto.response;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record OptimizationsDto(

		@JsonProperty("economiePotentielle")
		BigDecimal potentialSavings,
		
		List<OptimizationItemDto> strategies
) {}
