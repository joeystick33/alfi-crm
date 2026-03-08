package com.alkaus.smp.application.inheritanceCompleteResults.service;

import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.HeritageResult;

/**
 * Interface for HeritageCalculationService.
 * Service in charge of the calcul of the heritage
 * 
 * @author alkaus
 */
public interface HeritageCalculationService {

	/**
	 * Calculate the heritage
	 * 
	 * @param cmd
	 * @return
	 */
	HeritageResult calculate(CompleteResultsCommand cmd);
}
