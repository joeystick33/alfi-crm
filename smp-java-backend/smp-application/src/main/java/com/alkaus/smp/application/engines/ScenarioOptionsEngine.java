package com.alkaus.smp.application.engines;

import com.alkaus.smp.domain.succession.InheritanceInput;
import com.alkaus.smp.domain.succession.ScenarioAllocation;

/**
 * Interface of ConjointOptionsEngine Service in charge of different type of
 * scenario
 */
public interface ScenarioOptionsEngine {

	/**
	 * Generate the scenarios
	 * 
	 * @param input
	 * @return
	 */
	ScenarioAllocation generateScenario(InheritanceInput input);
}
