package com.alkaus.smp.application.engines;

import com.alkaus.smp.domain.succession.InheritanceInput;
import com.alkaus.smp.domain.succession.InheritanceResult;

/**
 * Interface of InheritanceSimulationService Service in charge of the simulation
 * of the inheritance according to the actual fiscal rules
 * 
 * @author alkaus
 * 
 */
public interface InheritanceSimulationEngineService {

	/**
	 * Simulate the inheritance scenarios with the fiscal rules application
	 * 
	 * @param successionInput
	 * @return InheritanceResult
	 */
	InheritanceResult simulate(InheritanceInput successionInput);
}
