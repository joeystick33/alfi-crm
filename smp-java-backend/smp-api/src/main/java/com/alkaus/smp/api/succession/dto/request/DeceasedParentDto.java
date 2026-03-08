package com.alkaus.smp.api.succession.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record DeceasedParentDto(

		@JsonProperty("pere")
		PersonDto father,

		@JsonProperty("mere")
		PersonDto mother
) {}
