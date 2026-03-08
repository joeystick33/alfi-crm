package com.alkaus.smp.api.succession.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record FinancialImpactDto(
		@JsonProperty("anneeN")
		YearImpactDto yearN,

		@JsonProperty("annee1")
		YearImpactDto year1
) {}
