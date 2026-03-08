package com.alkaus.smp.api.succession.dto.request;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AssetsRequestDto(
		String type, // "IMMOBILIER" | "FINANCIER" | "PROFESSIONNEL" | etc

		@JsonProperty("valeur")
		BigDecimal value,

		@JsonProperty("dette")
		BigDecimal debt,

		@JsonProperty("libelle")
		String label,

		@JsonProperty("propriete")
		String ownership // "PROPRE_CLIENT" | "PROPRE_CONJOINT" | "COMMUN" | "INDIVISION" | null (default=COMMUN)
) {}
