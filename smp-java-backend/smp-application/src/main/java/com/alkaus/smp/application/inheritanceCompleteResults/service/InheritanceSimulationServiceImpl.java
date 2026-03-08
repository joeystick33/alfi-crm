package com.alkaus.smp.application.inheritanceCompleteResults.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.CompleteResultsResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.DdvScenarioResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.HeritageResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.MetadataResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.OptimizationsResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.ScenarioResult;

/**
 * Implementation of @link InheritanceSimulationService
 * 
 * @author alkaus
 */
@Service
public class InheritanceSimulationServiceImpl implements InheritanceSimulationService {

	private final MetadataService metadataService;
	private final HeritageCalculationService heritageCalculationService;
	private final InheritanceScenariosService inheritanceScenariosService;
	private final FinancialImpactService financialImpactService;
	private final OptimizationService optimizationService;
	private final AlertService alertService;

	public InheritanceSimulationServiceImpl(MetadataService metadataService,
			HeritageCalculationService heritageCalculationService,
			InheritanceScenariosService inheritanceScenariosService, FinancialImpactService financialImpactService,
			OptimizationService optimizationService, AlertService alertService) {

		this.metadataService = metadataService;
		this.heritageCalculationService = heritageCalculationService;
		this.inheritanceScenariosService = inheritanceScenariosService;
		this.financialImpactService = financialImpactService;
		this.optimizationService = optimizationService;
		this.alertService = alertService;
	}

	@Override
	public CompleteResultsResult calculateCompleteResults(CompleteResultsCommand inheritanceInput) {
		// 1) Metadata
		MetadataResult metadata = metadataService.build(inheritanceInput);

		// 2) Heritage
		HeritageResult heritage = heritageCalculationService.calculate(inheritanceInput);

		// 3) Scenarios (engine call + Yaml with inheritanceSimulationService)
		ScenarioResult scenario1 = inheritanceScenariosService.deceasedClientScenario(inheritanceInput, heritage);
		ScenarioResult scenario2 = inheritanceScenariosService.deceasedSpouseScenario(inheritanceInput, heritage);

		// 4) Financial impact
		scenario1 = financialImpactService.enrichImpact(inheritanceInput, scenario1);
		scenario2 = financialImpactService.enrichImpact(inheritanceInput, scenario2);

		// 5) DDV option comparison scenarios (1st death + 2nd death for each option)
		List<DdvScenarioResult> ddvScenarios = inheritanceScenariosService.ddvScenarios(inheritanceInput, heritage);
		// Enrich financial impact for each DDV scenario
		ddvScenarios = ddvScenarios.stream().map(ddv -> new DdvScenarioResult(
				ddv.optionLabel(), ddv.optionCode(),
				financialImpactService.enrichImpact(inheritanceInput, ddv.firstDeath()),
				financialImpactService.enrichImpact(inheritanceInput, ddv.secondDeath())
		)).toList();

		// 5b) Legal devolution scenarios (ab intestat: Option A + Option B)
		List<DdvScenarioResult> legalScenarios = inheritanceScenariosService.legalScenarios(inheritanceInput, heritage);
		legalScenarios = legalScenarios.stream().map(ls -> new DdvScenarioResult(
				ls.optionLabel(), ls.optionCode(),
				financialImpactService.enrichImpact(inheritanceInput, ls.firstDeath()),
				financialImpactService.enrichImpact(inheritanceInput, ls.secondDeath())
		)).toList();

		// 6) Optimization
		OptimizationsResult optimizations = optimizationService.calculateOptimization(inheritanceInput, heritage,
				scenario1, scenario2);

		// 7) Alerts
		var alerts = alertService.generate(inheritanceInput, heritage, scenario1, scenario2);

		// 8) Fiscal details (AV, donations, legs breakdowns)
		var fiscalDetails = inheritanceScenariosService.computeFiscalDetails(inheritanceInput, heritage);

		return new CompleteResultsResult(metadata, heritage, scenario1, scenario2, ddvScenarios, legalScenarios, optimizations, alerts, fiscalDetails);
	}

}
