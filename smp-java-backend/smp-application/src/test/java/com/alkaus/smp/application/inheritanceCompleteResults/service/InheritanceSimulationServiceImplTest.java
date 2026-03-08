package com.alkaus.smp.application.inheritanceCompleteResults.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.PersonCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.AlertResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.CompleteResultsResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.CustomerResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.HeritageResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.MetadataResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.OptimizationsResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.ScenarioResult;

@ExtendWith(MockitoExtension.class)
public class InheritanceSimulationServiceImplTest {

	@Mock
	private MetadataService metadataService;

	@Mock
	private HeritageCalculationService heritageCalculationService;

	@Mock
	private InheritanceScenariosService inheritanceScenariosService;

	@Mock
	private FinancialImpactService financialImpactService;

	@Mock
	private OptimizationService optimizationService;

	@Mock
	private AlertService alertService;

	private InheritanceSimulationServiceImpl svc;
	private CompleteResultsCommand cmd;

	@BeforeEach
	void setUp() {
		svc = new InheritanceSimulationServiceImpl(
				metadataService,
				heritageCalculationService,
				inheritanceScenariosService,
				financialImpactService,
				optimizationService,
				alertService
		);

		PersonCommand client = new PersonCommand("John", "Doe", 40, "M");
		cmd = new CompleteResultsCommand(
				"marié", "communauté",
				client, null,
				List.of(), null, List.of(),
				List.of(),
				BigDecimal.ZERO, BigDecimal.ZERO,
				null, null, BigDecimal.ZERO, BigDecimal.ZERO
		);
	}

	@Test
	@DisplayName("calculateCompleteResults(): assembles all services results in correct order")
	void calculateCompleteResults_orchestratesServicesCorrectly() {
		// Setup mocks
		MetadataResult metadata = new MetadataResult(
				LocalDate.now(),
				new CustomerResult("John", "Doe", 40, "M"),
				null,
				"communauté",
				"marié"
		);
		when(metadataService.build(cmd)).thenReturn(metadata);

		HeritageResult heritage = new HeritageResult(
				new BigDecimal("100000.00"),
				new BigDecimal("90000.00"),
				null,
				List.of()
		);
		when(heritageCalculationService.calculate(cmd)).thenReturn(heritage);

		ScenarioResult scenario1 = new ScenarioResult(
				"Décès du client", null, null,
				new BigDecimal("90000.00"), null, null, List.of(),
				new BigDecimal("0.00"), new BigDecimal("0.00"), new BigDecimal("90000.00"),
				new BigDecimal("0.00"), null, true
		);
		when(inheritanceScenariosService.deceasedClientScenario(cmd, heritage)).thenReturn(scenario1);

		ScenarioResult scenario2 = new ScenarioResult(
				"Décès du conjoint", null, null,
				new BigDecimal("90000.00"), null, null, List.of(),
				new BigDecimal("0.00"), new BigDecimal("0.00"), new BigDecimal("90000.00"),
				new BigDecimal("0.00"), null, true
		);
		when(inheritanceScenariosService.deceasedSpouseScenario(cmd, heritage)).thenReturn(scenario2);

		// Financial impact enrichment - use any() for flexibility
		when(financialImpactService.enrichImpact(any(), any())).thenAnswer(invocation -> invocation.getArgument(1));

		OptimizationsResult optimizations = new OptimizationsResult(
				new BigDecimal("10000.00"),
				List.of()
		);
		when(optimizationService.calculateOptimization(any(), any(), any(), any()))
				.thenReturn(optimizations);

		List<AlertResult> alerts = List.of();
		when(alertService.generate(any(), any(), any(), any())).thenReturn(alerts);

		// Execute
		CompleteResultsResult result = svc.calculateCompleteResults(cmd);

		// Verify assembly
		assertThat(result).isNotNull();
		assertThat(result.metadata()).isEqualTo(metadata);
		assertThat(result.heritage()).isEqualTo(heritage);
		assertThat(result.scenario1()).isNotNull();
		assertThat(result.scenario2()).isNotNull();
		assertThat(result.optimizations()).isEqualTo(optimizations);
		assertThat(result.alerts()).isEqualTo(alerts);
	}

	@Test
	@DisplayName("calculateCompleteResults(): calls services in correct order")
	void calculateCompleteResults_callsServicesInOrder() {
		// Setup minimal mocks
		when(metadataService.build(any())).thenReturn(buildMockMetadata());
		when(heritageCalculationService.calculate(any())).thenReturn(buildMockHeritage());
		when(inheritanceScenariosService.deceasedClientScenario(any(), any())).thenReturn(buildMockScenario());
		when(inheritanceScenariosService.deceasedSpouseScenario(any(), any())).thenReturn(buildMockScenario());
		when(financialImpactService.enrichImpact(any(), any())).thenReturn(buildMockScenario());
		when(optimizationService.calculateOptimization(any(), any(), any(), any()))
				.thenReturn(new OptimizationsResult(BigDecimal.ZERO, List.of()));
		when(alertService.generate(any(), any(), any(), any())).thenReturn(List.of());

		// Execute
		svc.calculateCompleteResults(cmd);

		// Verify call order
		InOrder inOrder = inOrder(
				metadataService,
				heritageCalculationService,
				inheritanceScenariosService,
				financialImpactService,
				optimizationService,
				alertService
		);

		inOrder.verify(metadataService).build(cmd);
		inOrder.verify(heritageCalculationService).calculate(cmd);
		inOrder.verify(inheritanceScenariosService).deceasedClientScenario(any(), any());
		inOrder.verify(inheritanceScenariosService).deceasedSpouseScenario(any(), any());
		inOrder.verify(financialImpactService, times(2)).enrichImpact(any(), any());
		inOrder.verify(optimizationService).calculateOptimization(any(), any(), any(), any());
		inOrder.verify(alertService).generate(any(), any(), any(), any());
	}

	@Test
	@DisplayName("calculateCompleteResults(): passes heritage to scenario services")
	void calculateCompleteResults_passesHeritageToScenarios() {
		HeritageResult heritage = buildMockHeritage();
		when(metadataService.build(cmd)).thenReturn(buildMockMetadata());
		when(heritageCalculationService.calculate(cmd)).thenReturn(heritage);
		when(inheritanceScenariosService.deceasedClientScenario(any(), any())).thenReturn(buildMockScenario());
		when(inheritanceScenariosService.deceasedSpouseScenario(any(), any())).thenReturn(buildMockScenario());
		when(financialImpactService.enrichImpact(any(), any())).thenReturn(buildMockScenario());
		when(optimizationService.calculateOptimization(any(), any(), any(), any()))
				.thenReturn(new OptimizationsResult(BigDecimal.ZERO, List.of()));
		when(alertService.generate(any(), any(), any(), any())).thenReturn(List.of());

		// Execute
		svc.calculateCompleteResults(cmd);

		// Verify heritage is passed to scenario services
		verify(inheritanceScenariosService).deceasedClientScenario(cmd, heritage);
		verify(inheritanceScenariosService).deceasedSpouseScenario(cmd, heritage);
	}

	@Test
	@DisplayName("calculateCompleteResults(): enriches both scenarios with financial impact")
	void calculateCompleteResults_enrichesBothScenarios() {
		ScenarioResult scenario1 = new ScenarioResult(
				"Décès du client", null, null,
				new BigDecimal("90000.00"), null, null, List.of(),
				new BigDecimal("0.00"), new BigDecimal("0.00"), new BigDecimal("90000.00"),
				new BigDecimal("0.00"), null, true
		);
		ScenarioResult scenario2 = new ScenarioResult(
				"Décès du conjoint", null, null,
				new BigDecimal("90000.00"), null, null, List.of(),
				new BigDecimal("0.00"), new BigDecimal("0.00"), new BigDecimal("90000.00"),
				new BigDecimal("0.00"), null, true
		);

		when(metadataService.build(any())).thenReturn(buildMockMetadata());
		when(heritageCalculationService.calculate(any())).thenReturn(buildMockHeritage());
		when(inheritanceScenariosService.deceasedClientScenario(any(), any())).thenReturn(scenario1);
		when(inheritanceScenariosService.deceasedSpouseScenario(any(), any())).thenReturn(scenario2);
		when(financialImpactService.enrichImpact(any(), any())).thenAnswer(invocation -> invocation.getArgument(1));
		when(optimizationService.calculateOptimization(any(), any(), any(), any()))
				.thenReturn(new OptimizationsResult(BigDecimal.ZERO, List.of()));
		when(alertService.generate(any(), any(), any(), any())).thenReturn(List.of());

		// Execute
		CompleteResultsResult result = svc.calculateCompleteResults(cmd);

		// Verify both scenarios are enriched (called twice)
		verify(financialImpactService, times(2)).enrichImpact(any(), any());

		// Verify scenarios are in result
		assertThat(result.scenario1()).isNotNull();
		assertThat(result.scenario2()).isNotNull();
	}

	@Test
	@DisplayName("calculateCompleteResults(): passes scenarios and heritage to optimization service")
	void calculateCompleteResults_passesDataToOptimization() {
		HeritageResult heritage = buildMockHeritage();
		ScenarioResult scenario1 = buildMockScenario();
		ScenarioResult scenario2 = buildMockScenario();

		when(metadataService.build(any())).thenReturn(buildMockMetadata());
		when(heritageCalculationService.calculate(any())).thenReturn(heritage);
		when(inheritanceScenariosService.deceasedClientScenario(any(), any())).thenReturn(scenario1);
		when(inheritanceScenariosService.deceasedSpouseScenario(any(), any())).thenReturn(scenario2);
		when(financialImpactService.enrichImpact(any(), any())).thenReturn(scenario1);
		OptimizationsResult optimizations = new OptimizationsResult(BigDecimal.ZERO, List.of());
		when(optimizationService.calculateOptimization(cmd, heritage, scenario1, scenario2))
				.thenReturn(optimizations);
		when(alertService.generate(any(), any(), any(), any())).thenReturn(List.of());

		// Execute
		svc.calculateCompleteResults(cmd);

		// Verify optimization service receives correct data
		verify(optimizationService).calculateOptimization(cmd, heritage, scenario1, scenario2);
	}

	@Test
	@DisplayName("calculateCompleteResults(): passes all data to alert service")
	void calculateCompleteResults_passesDataToAlerts() {
		HeritageResult heritage = buildMockHeritage();
		ScenarioResult scenario1 = buildMockScenario();
		ScenarioResult scenario2 = buildMockScenario();

		when(metadataService.build(any())).thenReturn(buildMockMetadata());
		when(heritageCalculationService.calculate(any())).thenReturn(heritage);
		when(inheritanceScenariosService.deceasedClientScenario(any(), any())).thenReturn(scenario1);
		when(inheritanceScenariosService.deceasedSpouseScenario(any(), any())).thenReturn(scenario2);
		when(financialImpactService.enrichImpact(any(), any())).thenReturn(scenario1);
		when(optimizationService.calculateOptimization(any(), any(), any(), any()))
				.thenReturn(new OptimizationsResult(BigDecimal.ZERO, List.of()));
		List<AlertResult> alerts = List.of();
		when(alertService.generate(cmd, heritage, scenario1, scenario2)).thenReturn(alerts);

		// Execute
		svc.calculateCompleteResults(cmd);

		// Verify alert service receives all enriched data
		verify(alertService).generate(cmd, heritage, scenario1, scenario2);
	}

	// Helper methods for creating mock objects
	private MetadataResult buildMockMetadata() {
		return new MetadataResult(
				LocalDate.now(),
				new CustomerResult("John", "Doe", 40, "M"),
				null,
				"Communauté réduite aux acquêts",
				"Marié(e)"
		);
	}

	private HeritageResult buildMockHeritage() {
		return new HeritageResult(
				new BigDecimal("100000.00"),
				new BigDecimal("90000.00"),
				null,
				List.of()
		);
	}

	private ScenarioResult buildMockScenario() {
		return new ScenarioResult(
				"Scenario Label", null, null,
				new BigDecimal("90000.00"), null, null, List.of(),
				new BigDecimal("0.00"), new BigDecimal("0.00"), new BigDecimal("90000.00"),
				new BigDecimal("0.00"), null, true
		);
	}
}
