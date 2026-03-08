package com.alkaus.smp.api.succession.dto.request;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ChildDto(

		@JsonProperty("prenom")
		String firstName,

		@JsonProperty("age")
		Integer age,

		@JsonProperty("predecede")
		Boolean predecede,

		@JsonProperty("communAvecConjoint")
		Boolean communAvecConjoint,

		@JsonProperty("handicape")
		Boolean handicape,

		@JsonProperty("representants")
		List<RepresentantDto> representants
) {

	@JsonIgnoreProperties(ignoreUnknown = true)
	public record RepresentantDto(
			@JsonProperty("prenom")
			String firstName,

			@JsonProperty("lien")
			String lien
	) {}
}
