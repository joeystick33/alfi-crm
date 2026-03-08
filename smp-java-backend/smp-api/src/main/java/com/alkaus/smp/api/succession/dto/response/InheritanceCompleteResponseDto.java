package com.alkaus.smp.api.succession.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record InheritanceCompleteResponseDto(
		
		MetadataDto metadata,
		
		@JsonProperty("patrimoine")
        HeritageDto heritage,
        
        ScenarioDto scenario1,
        
        ScenarioDto scenario2,

        @JsonProperty("scenariosDDV")
        List<DdvScenarioDto> ddvScenarios,

        @JsonProperty("scenariosLegaux")
        List<DdvScenarioDto> legalScenarios,
        
        OptimizationsDto optimisations,
        
        @JsonProperty("alertes")
        List<AlertDto> alerts,

        @JsonProperty("detailsFiscaux")
        FiscalDetailsDto fiscalDetails,

        @JsonProperty("resultatInverse")
        InheritanceCompleteResponseDto resultatInverse // nullable — present only in mode_couple
){
	/** Backward-compatible constructor (no resultatInverse) */
	public InheritanceCompleteResponseDto(
			MetadataDto metadata, HeritageDto heritage,
			ScenarioDto scenario1, ScenarioDto scenario2,
			List<DdvScenarioDto> ddvScenarios, List<DdvScenarioDto> legalScenarios,
			OptimizationsDto optimisations, List<AlertDto> alerts,
			FiscalDetailsDto fiscalDetails) {
		this(metadata, heritage, scenario1, scenario2, ddvScenarios, legalScenarios,
				optimisations, alerts, fiscalDetails, null);
	}
}
