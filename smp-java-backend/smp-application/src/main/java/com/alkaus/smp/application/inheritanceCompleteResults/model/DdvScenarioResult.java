package com.alkaus.smp.application.inheritanceCompleteResults.model;

/**
 * Represents a DDV option comparison result:
 * first death with the chosen option + corresponding sequential second death.
 */
public record DdvScenarioResult(
		String optionLabel,
		String optionCode,
		ScenarioResult firstDeath,
		ScenarioResult secondDeath
) {}
