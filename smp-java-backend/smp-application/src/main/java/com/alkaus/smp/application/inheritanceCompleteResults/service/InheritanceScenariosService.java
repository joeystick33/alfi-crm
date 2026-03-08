package com.alkaus.smp.application.inheritanceCompleteResults.service;

import java.util.List;

import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.DdvScenarioResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.FiscalDetailsResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.HeritageResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.ScenarioResult;

/**
 * Interface for InheritanceScenariosService : Service in charge of Scenarios
 * generation.
 * 
 * @author alkaus
 */
public interface InheritanceScenariosService {

	/**
	 * Calculate the scenario for a deceased client
	 * 
	 * @param cmd
	 * @param heritage
	 * @return scenarioResult
	 */
	ScenarioResult deceasedClientScenario(CompleteResultsCommand cmd, HeritageResult heritage);

	/**
	 * Calculate the scenario for a deceased spouse (sequential 2nd death)
	 * 
	 * @param cmd
	 * @param heritage
	 * @return scenarioResult
	 */
	ScenarioResult deceasedSpouseScenario(CompleteResultsCommand cmd, HeritageResult heritage);

	/**
	 * Calculate DDV option comparison scenarios.
	 * Each DDV option (usufruit total, 1/4 PP + 3/4 USF, QD PP) produces
	 * a first death result + a corresponding sequential second death result.
	 * 
	 * @param cmd
	 * @param heritage
	 * @return list of DDV scenario comparisons (empty if not applicable)
	 */
	List<DdvScenarioResult> ddvScenarios(CompleteResultsCommand cmd, HeritageResult heritage);

	/**
	 * Calculate legal devolution scenarios (ab intestat, art. 757 C.civ).
	 * Option A: Usufruit total (1st death + 2nd death)
	 * Option B: 1/4 pleine propriété (1st death + 2nd death)
	 *
	 * @param cmd
	 * @param heritage
	 * @return list of legal scenario comparisons (empty if not applicable)
	 */
	List<DdvScenarioResult> legalScenarios(CompleteResultsCommand cmd, HeritageResult heritage);

	/**
	 * Compute detailed fiscal breakdowns for AV, donations, and legs.
	 */
	FiscalDetailsResult computeFiscalDetails(CompleteResultsCommand cmd, HeritageResult heritage);
}
