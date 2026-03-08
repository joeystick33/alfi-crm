package com.alkaus.smp.application.inheritanceCompleteResults.service;

import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.ScenarioResult;

/**
 * Interface for FinancialImpactServie
 * 
 * @author alkaus
 */
public interface FinancialImpactService {

	/**
	 * Calculate the financial impact of a scenario
	 * 
	 * @param cmd
	 * @param scenario
	 * @return scenarioResult
	 */
	ScenarioResult enrichImpact(CompleteResultsCommand cmd, ScenarioResult scenario);
}
