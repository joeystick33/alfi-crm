package com.alkaus.smp.api.succession.dto.response;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AssetDetailDto(
		String type,
		String designation,
		
		@JsonProperty("libelle")
		String label,
		
		@JsonProperty("valeur")
		BigDecimal value,
		
		@JsonProperty("dette")
		BigDecimal debt,
		
		@JsonProperty("valeurNette")
		BigDecimal netValue
) {}
