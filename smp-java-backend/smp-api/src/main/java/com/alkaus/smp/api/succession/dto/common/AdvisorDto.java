package com.alkaus.smp.api.succession.dto.common;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AdvisorDto(
		@JsonProperty("nom")
		String name,
		
		@JsonProperty("cabinet")
		String office,
		
		@JsonProperty("email")
		String email,

		@JsonProperty("telephone")
		String phone
) {}
