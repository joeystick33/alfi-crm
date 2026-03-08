package com.alkaus.smp.api.succession.dto.response;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

public record YearImpactDto(
		
		@JsonProperty("revenus")
		BigDecimal annualIncome,
		@JsonProperty("charges")
		BigDecimal annualCharges,
		@JsonProperty("fraisObseques")
		BigDecimal funeralFees,
		@JsonProperty("droitsSuccession")
		BigDecimal inheritanceRights,
		@JsonProperty("fraisNotaire")
		BigDecimal notaryFees,

		BigDecimal total,
		
		@JsonProperty("solde")
		BigDecimal balance
){}
