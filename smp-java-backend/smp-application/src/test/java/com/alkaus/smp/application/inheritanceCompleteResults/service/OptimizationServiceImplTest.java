package com.alkaus.smp.application.inheritanceCompleteResults.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.PersonCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.HeritageResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.OptimizationsResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.ScenarioResult;

class OptimizationServiceImplTest {

	private OptimizationServiceImpl svc;

	@BeforeEach
	void setUp() {
		svc = new OptimizationServiceImpl();
	}

	private CompleteResultsCommand cmd(String marital, PersonCommand client, PersonCommand spouse,
			List<PersonCommand> children) {
		return new CompleteResultsCommand(marital, "communauté", client, spouse, children,
				null, List.of(), List.of(), BigDecimal.ZERO, BigDecimal.ZERO,
				null, null, BigDecimal.ZERO, BigDecimal.ZERO);
	}

	private ScenarioResult scenario(BigDecimal netAsset, BigDecimal rights, boolean relevant) {
		return new ScenarioResult("Test", null, null, netAsset, null, null, List.of(),
				rights, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, null, relevant);
	}

	@Test
	@DisplayName("Married + 2 children + 500k: donation + AV + DDV optimizations generated")
	void married_2children_500k() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		PersonCommand spouse = new PersonCommand("Jane", "Doe", 60, "F");
		List<PersonCommand> children = List.of(
				new PersonCommand("Alice", "Doe", 30, "F"),
				new PersonCommand("Bob", "Doe", 28, "M"));
		CompleteResultsCommand command = cmd("marié", client, spouse, children);
		HeritageResult heritage = new HeritageResult(new BigDecimal("600000"), new BigDecimal("600000"), null, List.of());
		ScenarioResult s1 = scenario(new BigDecimal("500000"), new BigDecimal("20000"), true);

		OptimizationsResult result = svc.calculateOptimization(command, heritage, s1, null);

		assertThat(result.optimizations()).hasSizeGreaterThanOrEqualTo(3);
		assertThat(result.potentialSavings().compareTo(BigDecimal.ZERO)).isGreaterThan(0);

		// Check donation optimization present
		assertThat(result.optimizations().stream()
				.anyMatch(o -> o.title().contains("Donation anticipée"))).isTrue();
		// Check AV optimization present
		assertThat(result.optimizations().stream()
				.anyMatch(o -> o.title().contains("Assurance-vie"))).isTrue();
		// Check DDV present
		assertThat(result.optimizations().stream()
				.anyMatch(o -> o.title().contains("Donation au dernier vivant"))).isTrue();
		// Check démembrement present (500k+ estate)
		assertThat(result.optimizations().stream()
				.anyMatch(o -> o.title().contains("Démembrement"))).isTrue();
	}

	@Test
	@DisplayName("Single + no children + low asset: minimal optimizations")
	void single_noChildren_lowAsset() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		CompleteResultsCommand command = cmd("célibataire", client, null, List.of());
		HeritageResult heritage = new HeritageResult(new BigDecimal("50000"), new BigDecimal("50000"), null, List.of());
		ScenarioResult s1 = scenario(new BigDecimal("50000"), new BigDecimal("5000"), true);

		OptimizationsResult result = svc.calculateOptimization(command, heritage, s1, null);

		// No donation (no children), no DDV (not married), no démembrement (< 500k)
		assertThat(result.optimizations().stream()
				.noneMatch(o -> o.title().contains("Donation anticipée"))).isTrue();
		assertThat(result.optimizations().stream()
				.noneMatch(o -> o.title().contains("DDV"))).isTrue();
	}

	@Test
	@DisplayName("Scenario comparison: generates saving when difference > 1000")
	void scenarioComparison() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		CompleteResultsCommand command = cmd("marié", client, new PersonCommand("Jane", "Doe", 60, "F"), List.of());
		HeritageResult heritage = new HeritageResult(new BigDecimal("300000"), new BigDecimal("300000"), null, List.of());
		ScenarioResult s1 = scenario(new BigDecimal("300000"), new BigDecimal("15000"), true);
		ScenarioResult s2 = scenario(new BigDecimal("300000"), new BigDecimal("8000"), true);

		OptimizationsResult result = svc.calculateOptimization(command, heritage, s1, s2);

		assertThat(result.optimizations().stream()
				.anyMatch(o -> o.title().contains("Comparaison"))).isTrue();
	}

	@Test
	@DisplayName("Null scenario: no crash, returns result")
	void nullScenario() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		CompleteResultsCommand command = cmd("célibataire", client, null, List.of());

		OptimizationsResult result = svc.calculateOptimization(command, null, null, null);

		assertThat(result).isNotNull();
		assertThat(result.optimizations()).isNotNull();
	}
}
