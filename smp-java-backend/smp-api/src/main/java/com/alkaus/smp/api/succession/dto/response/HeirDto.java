package com.alkaus.smp.api.succession.dto.response;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

public record HeirDto(

		@JsonProperty("nom")
		String lastName,

		@JsonProperty("lien")
		String relationship,

		@JsonProperty("typeDroit")
		String rightType,

		@JsonProperty("quotite")
		BigDecimal quota,

		@JsonProperty("montantTransmis")
		BigDecimal amountTransmitted,

		@JsonProperty("valeurTaxable")
		BigDecimal taxableValue,

		@JsonProperty("abattement")
		BigDecimal taxAllowance,

		@JsonProperty("baseApresAbattement")
		BigDecimal baseAfterAllowance,

		@JsonProperty("droits")
		BigDecimal taxRights,

		@JsonProperty("handicape")
		boolean disabled
) {}
