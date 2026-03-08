package com.alkaus.smp.application.inheritanceCompleteResults.model;

import java.util.List;

public record CompleteResultsResult(
		MetadataResult metadata,
		HeritageResult heritage,
		ScenarioResult scenario1,
		ScenarioResult scenario2,
		List<DdvScenarioResult> ddvScenarios,
		List<DdvScenarioResult> legalScenarios,
		OptimizationsResult optimizations,
		List<AlertResult> alerts,
		FiscalDetailsResult fiscalDetails
) {}
