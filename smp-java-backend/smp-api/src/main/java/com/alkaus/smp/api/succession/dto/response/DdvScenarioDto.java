package com.alkaus.smp.api.succession.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record DdvScenarioDto(
		@JsonProperty("optionLabel")
		String optionLabel,

		@JsonProperty("optionCode")
		String optionCode,

		@JsonProperty("premierDeces")
		ScenarioDto firstDeath,

		@JsonProperty("secondDeces")
		ScenarioDto secondDeath
) {}
