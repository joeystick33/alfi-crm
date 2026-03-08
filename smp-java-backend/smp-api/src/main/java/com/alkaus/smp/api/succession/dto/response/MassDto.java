package com.alkaus.smp.api.succession.dto.response;

import java.math.BigDecimal;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MassDto(
		BigDecimal civil,
		
		BigDecimal reserve,

		@JsonProperty("quotiteDisponible")
		BigDecimal availableQuota,
		
		@JsonProperty("abattementResidence")
		BigDecimal residenceAllowance,

		@JsonProperty("baseResidenceAvantAbattement")
		BigDecimal residenceBaseBeforeAllowance,
		
		@JsonProperty("exonerationConjoint")
		BigDecimal spouseExemption,

		@JsonProperty("fiscale")
		BigDecimal tax
) {}
