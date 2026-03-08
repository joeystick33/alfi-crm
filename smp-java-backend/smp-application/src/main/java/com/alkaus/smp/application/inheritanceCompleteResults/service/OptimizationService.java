package com.alkaus.smp.application.inheritanceCompleteResults.service;

import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.HeritageResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.OptimizationsResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.ScenarioResult;

/**
 * Interface for OptimizationsService
 * 
 * @author alkaus
 */
public interface OptimizationService {

	/**
	 * Calculate possible optimizations according to the scenarios
	 * 
	 * @param cmd
	 * @param heritage
	 * @param scenario1
	 * @param scenario2
	 * @return optimizationsResult
	 */
	OptimizationsResult calculateOptimization(CompleteResultsCommand cmd, HeritageResult heritage, ScenarioResult scenario1,
			ScenarioResult scenario2);
}
