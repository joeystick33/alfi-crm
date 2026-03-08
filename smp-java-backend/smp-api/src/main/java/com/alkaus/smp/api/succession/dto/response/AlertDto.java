package com.alkaus.smp.api.succession.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AlertDto(

		String type,

		@JsonProperty("titre")
		String title,
		
		String message
) {}
