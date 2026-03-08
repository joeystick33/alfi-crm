package com.alkaus.smp.application.inheritanceCompleteResults.service;

import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.CompleteResultsResult;

/**
 * Interface of InheritanceSimulationService Service in charge of the
 * calculation of the complete results of the inheritance input datas
 * 
 * @author alkaus
 */
public interface InheritanceSimulationService {

	/**
	 * Calculate the complete results of an inheritance
	 * 
	 * @param inheritanceInput
	 * @return
	 */
	CompleteResultsResult calculateCompleteResults(CompleteResultsCommand inheritanceInput);
}
