package com.alkaus.smp.application.inheritanceCompleteResults.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.PersonCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.AlertResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.ScenarioResult;

class AlertServiceImplTest {

	private AlertServiceImpl svc;

	@BeforeEach
	void setUp() {
		svc = new AlertServiceImpl();
	}

	private CompleteResultsCommand cmd(String marital, String regime, PersonCommand client,
			PersonCommand spouse, BigDecimal income) {
		return new CompleteResultsCommand(marital, regime, client, spouse, List.of(),
				null, List.of(), List.of(), BigDecimal.ZERO, BigDecimal.ZERO,
				null, null, income, BigDecimal.ZERO);
	}

	private ScenarioResult scenario(BigDecimal netAsset, BigDecimal rights) {
		return new ScenarioResult("Test", null, null, netAsset, null, null, List.of(),
				rights, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, null, true);
	}

	@Test
	@DisplayName("Always generates the 6-month deadline alert")
	void alwaysDeadlineAlert() {
		CompleteResultsCommand command = cmd("célibataire", null,
				new PersonCommand("John", "Doe", 65, "M"), null, BigDecimal.ZERO);

		List<AlertResult> alerts = svc.generate(command, null, null, null);

		assertThat(alerts.stream().anyMatch(a -> a.title().contains("Délai de déclaration"))).isTrue();
	}

	@Test
	@DisplayName("Liquidity alert when rights > 50% of annual income")
	void liquidityAlert() {
		CompleteResultsCommand command = cmd("marié", "communauté",
				new PersonCommand("John", "Doe", 65, "M"),
				new PersonCommand("Jane", "Doe", 60, "F"),
				new BigDecimal("30000"));
		ScenarioResult s1 = scenario(new BigDecimal("500000"), new BigDecimal("20000"));

		List<AlertResult> alerts = svc.generate(command, null, s1, null);

		// 20000 / 30000 = 0.67 > 0.50 => liquidity alert
		assertThat(alerts.stream().anyMatch(a -> a.type().equals("DANGER")
				&& a.title().contains("trésorerie"))).isTrue();
	}

	@Test
	@DisplayName("No liquidity alert when rights < 50% of annual income")
	void noLiquidityAlert() {
		CompleteResultsCommand command = cmd("marié", "communauté",
				new PersonCommand("John", "Doe", 65, "M"),
				new PersonCommand("Jane", "Doe", 60, "F"),
				new BigDecimal("100000"));
		ScenarioResult s1 = scenario(new BigDecimal("500000"), new BigDecimal("5000"));

		List<AlertResult> alerts = svc.generate(command, null, s1, null);

		assertThat(alerts.stream().noneMatch(a -> a.title().contains("trésorerie"))).isTrue();
	}

	@Test
	@DisplayName("High tax rate alert when effective rate > 20%")
	void highTaxRateAlert() {
		CompleteResultsCommand command = cmd("célibataire", null,
				new PersonCommand("John", "Doe", 65, "M"), null, BigDecimal.ZERO);
		ScenarioResult s1 = scenario(new BigDecimal("100000"), new BigDecimal("25000"));

		List<AlertResult> alerts = svc.generate(command, null, s1, null);

		assertThat(alerts.stream().anyMatch(a -> a.type().equals("WARNING")
				&& a.title().contains("imposition élevé"))).isTrue();
	}

	@Test
	@DisplayName("Concubin alert when spouse present but not married/pacsed")
	void concubinAlert() {
		CompleteResultsCommand command = cmd("concubinage", null,
				new PersonCommand("John", "Doe", 65, "M"),
				new PersonCommand("Jane", "Doe", 60, "F"),
				BigDecimal.ZERO);

		List<AlertResult> alerts = svc.generate(command, null, null, null);

		assertThat(alerts.stream().anyMatch(a -> a.type().equals("DANGER")
				&& a.title().contains("Concubin"))).isTrue();
	}

	@Test
	@DisplayName("PACS testament alert when pacsed with spouse")
	void pacsTestamentAlert() {
		CompleteResultsCommand command = cmd("pacsé", null,
				new PersonCommand("John", "Doe", 65, "M"),
				new PersonCommand("Jane", "Doe", 60, "F"),
				BigDecimal.ZERO);

		List<AlertResult> alerts = svc.generate(command, null, null, null);

		assertThat(alerts.stream().anyMatch(a -> a.type().equals("WARNING")
				&& a.title().contains("pacsé"))).isTrue();
	}

	@Test
	@DisplayName("Payment deferral alert when rights > 10000")
	void paymentDeferralAlert() {
		CompleteResultsCommand command = cmd("marié", "communauté",
				new PersonCommand("John", "Doe", 65, "M"),
				new PersonCommand("Jane", "Doe", 60, "F"),
				BigDecimal.ZERO);
		ScenarioResult s1 = scenario(new BigDecimal("500000"), new BigDecimal("15000"));

		List<AlertResult> alerts = svc.generate(command, null, s1, null);

		assertThat(alerts.stream().anyMatch(a -> a.title().contains("fractionné"))).isTrue();
	}

	@Test
	@DisplayName("Communauté universelle clause alert")
	void communauteUniverselleClauseAlert() {
		CompleteResultsCommand command = cmd("marié", "communauté universelle avec clause d'attribution intégrale",
				new PersonCommand("John", "Doe", 65, "M"),
				new PersonCommand("Jane", "Doe", 60, "F"),
				BigDecimal.ZERO);

		List<AlertResult> alerts = svc.generate(command, null, null, null);

		assertThat(alerts.stream().anyMatch(a -> a.title().contains("Communauté universelle"))).isTrue();
	}
}
