package com.alkaus.smp.api.succession.dto.common;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record IdentityDto(

		@JsonProperty("prenom")
		String firstName,
		
		@JsonProperty("nom")
        String lastName,

        Integer age,

		@JsonProperty("sexe")
        String sex,

		@JsonProperty("revenusMensuels")
		java.math.BigDecimal revenusMensuels
) {}
