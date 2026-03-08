package com.alkaus.smp.api.succession.dto.response;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

public record OptimizationItemDto(

		@JsonProperty("titre")
		String title,
		
		String description,

		@JsonProperty("economie")
		BigDecimal saving,

		@JsonProperty("recommande")
		boolean advisable,

		@JsonProperty("delai")
		String deadline
		
) {}
