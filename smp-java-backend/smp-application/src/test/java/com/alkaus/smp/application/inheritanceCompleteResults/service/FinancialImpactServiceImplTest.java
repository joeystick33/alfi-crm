package com.alkaus.smp.application.inheritanceCompleteResults.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.PersonCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.FinancialImpactResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.ScenarioResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.YearImpactResult;

class FinancialImpactServiceImplTest {

	private FinancialImpactServiceImpl svc;

	@BeforeEach
	void setUp() {
		svc = new FinancialImpactServiceImpl();
	}

	private CompleteResultsCommand cmd(BigDecimal income, BigDecimal charges) {
		return new CompleteResultsCommand("marié", "communauté",
				new PersonCommand("John", "Doe", 65, "M"),
				new PersonCommand("Jane", "Doe", 60, "F"),
				List.of(), null, List.of(), List.of(),
				BigDecimal.ZERO, BigDecimal.ZERO, null, null, income, charges);
	}

	private ScenarioResult scenario(BigDecimal rights, BigDecimal notaryFees) {
		FinancialImpactResult emptyImpact = new FinancialImpactResult(
				new YearImpactResult(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
						BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO),
				new YearImpactResult(BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
						BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO));
		return new ScenarioResult("Test", null, null, new BigDecimal("500000"), null, null,
				List.of(), rights, notaryFees, BigDecimal.ZERO, BigDecimal.ZERO, emptyImpact, true);
	}

	@Test
	@DisplayName("Year N: total = charges + funeral(5000) + rights + notary")
	void yearN_totalCalculation() {
		CompleteResultsCommand command = cmd(new BigDecimal("60000"), new BigDecimal("20000"));
		ScenarioResult s = scenario(new BigDecimal("15000"), new BigDecimal("4000"));

		ScenarioResult result = svc.enrichImpact(command, s);

		YearImpactResult yearN = result.financialImpact().yearN();
		// total = 20000 + 5000 + 15000 + 4000 = 44000
		assertThat(yearN.total()).isEqualByComparingTo(new BigDecimal("44000.00"));
		assertThat(yearN.funeralFees()).isEqualByComparingTo(new BigDecimal("5000.00"));
		assertThat(yearN.inheritanceRights()).isEqualByComparingTo(new BigDecimal("15000.00"));
		assertThat(yearN.notaryFees()).isEqualByComparingTo(new BigDecimal("4000.00"));
	}

	@Test
	@DisplayName("Year N: balance = income - total")
	void yearN_balance() {
		CompleteResultsCommand command = cmd(new BigDecimal("60000"), new BigDecimal("20000"));
		ScenarioResult s = scenario(new BigDecimal("15000"), new BigDecimal("4000"));

		ScenarioResult result = svc.enrichImpact(command, s);

		YearImpactResult yearN = result.financialImpact().yearN();
		// balance = 60000 - 44000 = 16000
		assertThat(yearN.balance()).isEqualByComparingTo(new BigDecimal("16000.00"));
	}

	@Test
	@DisplayName("Year N+1: reduced income (60%) and charges (80%), no one-time costs")
	void yearN1_reducedValues() {
		CompleteResultsCommand command = cmd(new BigDecimal("60000"), new BigDecimal("20000"));
		ScenarioResult s = scenario(new BigDecimal("15000"), new BigDecimal("4000"));

		ScenarioResult result = svc.enrichImpact(command, s);

		YearImpactResult year1 = result.financialImpact().year1();
		// income N+1 = 60000 * 0.60 = 36000
		assertThat(year1.annualIncome()).isEqualByComparingTo(new BigDecimal("36000.00"));
		// charges N+1 = 20000 * 0.80 = 16000
		assertThat(year1.annualCharges()).isEqualByComparingTo(new BigDecimal("16000.00"));
		// No funeral, rights, notary in N+1
		assertThat(year1.funeralFees()).isEqualByComparingTo(BigDecimal.ZERO);
		assertThat(year1.inheritanceRights()).isEqualByComparingTo(BigDecimal.ZERO);
		// balance = 36000 - 16000 = 20000
		assertThat(year1.balance()).isEqualByComparingTo(new BigDecimal("20000.00"));
	}

	@Test
	@DisplayName("Not applicable scenario: returned as-is")
	void notApplicable_unchanged() {
		CompleteResultsCommand command = cmd(BigDecimal.ZERO, BigDecimal.ZERO);
		ScenarioResult notApplicable = new ScenarioResult("Non applicable", null, null, null, null, null,
				List.of(), null, null, null, null, null, false);

		ScenarioResult result = svc.enrichImpact(command, notApplicable);

		assertThat(result.relevant()).isFalse();
	}

	@Test
	@DisplayName("Null scenario: returns null")
	void nullScenario_returnsNull() {
		CompleteResultsCommand command = cmd(BigDecimal.ZERO, BigDecimal.ZERO);

		ScenarioResult result = svc.enrichImpact(command, null);

		assertThat(result).isNull();
	}

	@Test
	@DisplayName("Negative balance: deficit shown correctly")
	void negativeBalance() {
		CompleteResultsCommand command = cmd(new BigDecimal("10000"), new BigDecimal("5000"));
		ScenarioResult s = scenario(new BigDecimal("50000"), new BigDecimal("10000"));

		ScenarioResult result = svc.enrichImpact(command, s);

		YearImpactResult yearN = result.financialImpact().yearN();
		// total = 5000 + 5000 + 50000 + 10000 = 70000
		// balance = 10000 - 70000 = -60000
		assertThat(yearN.balance()).isEqualByComparingTo(new BigDecimal("-60000.00"));
	}
}
