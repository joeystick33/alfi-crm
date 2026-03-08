package com.alkaus.smp.api.succession.dto.request;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public record SiblingsDto(
		@JsonProperty("prenom")
		String firstName,
		
		@JsonProperty("fiscalConditions")
		TaxConditionsDto taxConditions,

		@JsonProperty("lien")
		@JsonAlias("relationship")
		String relationship,
		
		@JsonProperty("alive")
		@JsonAlias("vivant")
		boolean alive,

		@JsonProperty("representants")
		List<RepresentantDto> representants
) {

	/** Représentant = neveu/nièce héritant par représentation d'un frère/sœur décédé */
	public record RepresentantDto(
			@JsonProperty("prenom")
			String firstName
	) {}
}
