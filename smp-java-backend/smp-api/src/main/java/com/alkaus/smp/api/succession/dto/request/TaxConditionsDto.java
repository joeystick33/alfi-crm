package com.alkaus.smp.api.succession.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record TaxConditionsDto(
		@JsonProperty("fratrieCelibVeufDivorceSep")
		String maritalStatus,
		
		@JsonProperty("fratrieCohabitationContinue5ans")
		String cohabitation,
		
		@JsonProperty("ageAuDeces")
		int ageOfDeath,
		
		@JsonProperty("fratrieInvalide")
		boolean isDisabled
) {}
