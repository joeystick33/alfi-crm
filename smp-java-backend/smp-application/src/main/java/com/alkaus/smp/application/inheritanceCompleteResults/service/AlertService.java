package com.alkaus.smp.application.inheritanceCompleteResults.service;

import java.util.List;

import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.AlertResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.HeritageResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.ScenarioResult;

/**
 * Interface for AlertsService
 * 
 * @author alkaus
 */
public interface AlertService {

	/**
	 * Generate alerts according to the heritage, the scenarios
	 * 
	 * @param cmd
	 * @param heritage
	 * @param scenario1
	 * @param scenario2
	 * @return list of alerts
	 */
	List<AlertResult> generate(CompleteResultsCommand cmd, HeritageResult heritage, ScenarioResult scenario1,
			ScenarioResult scenario2);
}
