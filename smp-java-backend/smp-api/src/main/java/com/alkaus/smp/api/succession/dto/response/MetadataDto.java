package com.alkaus.smp.api.succession.dto.response;

import com.alkaus.smp.api.succession.dto.common.AdvisorDto;
import com.alkaus.smp.api.succession.dto.common.IdentityDto;
import com.fasterxml.jackson.annotation.JsonProperty;

public record MetadataDto(
		
		@JsonProperty("dateEtude")
		String studyDate,
		
		@JsonProperty("client")
		IdentityDto customer,
		
		@JsonProperty("conseiller")
		AdvisorDto advisor,
		
		@JsonProperty("regimeMatrimonial")
		String matrimonialRegime,
		
		@JsonProperty("statutMatrimonial")
		String maritalStatus
) {}
