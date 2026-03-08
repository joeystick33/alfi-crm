package com.alkaus.smp.api.succession.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DeceasedDto(

		@JsonProperty("nom")
		String lasName,
		
		@JsonProperty("prenom")
		String firstName,
		
		int age
) {}
