package com.alkaus.smp.api.succession.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SpouseDto(

		@JsonProperty("prenom")
		String firstName,
		
		@JsonProperty("nom")
		String lastName,
		
		Integer age,

		@JsonProperty("regimeMatrimonial")
		String regimeMatrimonial,

		@JsonProperty("regimePACS")
		String regimePACS,

		@JsonProperty("clauseAttributionIntegrale")
		Boolean clauseAttributionIntegrale
) {}
