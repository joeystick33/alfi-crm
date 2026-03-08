package com.alkaus.smp.application.engines;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.alkaus.smp.application.TestFiscalRulesFactory;
import com.alkaus.smp.domain.fiscal.FiscalRules;
import com.alkaus.smp.domain.succession.LifeInsuranceInput;

class AssuranceVieRulesServiceTest {

	private final AssuranceVieRulesService svc = new AssuranceVieRulesService();
	private final FiscalRules rules = TestFiscalRulesFactory.rules2026();

	// --- taxBefore70 (art. 990 I) ---

	@Test
	@DisplayName("No life insurance => 0")
	void taxBefore70_noInsurance() {
		assertThat(svc.taxBefore70("Child1", List.of(), rules, false))
				.isEqualByComparingTo(BigDecimal.ZERO);
	}

	@Test
	@DisplayName("Spouse/PACS beneficiary => always exempt (0)")
	void taxBefore70_spouseExempt() {
		List<LifeInsuranceInput> avs = List.of(
				new LifeInsuranceInput("Spouse", new BigDecimal("200000"), new BigDecimal("300000"),
						LocalDate.of(2010, 1, 1), null, 55));
		assertThat(svc.taxBefore70("Spouse", avs, rules, true))
				.isEqualByComparingTo(BigDecimal.ZERO);
	}

	@Test
	@DisplayName("200000 € death benefit before 70 => (200000-152500)*20% = 9500 €")
	void taxBefore70_belowThreshold700k() {
		List<LifeInsuranceInput> avs = List.of(
				new LifeInsuranceInput("Child1", new BigDecimal("150000"), new BigDecimal("200000"),
						LocalDate.of(2010, 1, 1), null, 55));
		BigDecimal tax = svc.taxBefore70("Child1", avs, rules, false);
		assertThat(tax).isEqualByComparingTo(new BigDecimal("9500.00"));
	}

	@Test
	@DisplayName("Below allowance => 0")
	void taxBefore70_belowAllowance() {
		List<LifeInsuranceInput> avs = List.of(
				new LifeInsuranceInput("Child1", new BigDecimal("100000"), new BigDecimal("100000"),
						LocalDate.of(2010, 1, 1), null, 60));
		assertThat(svc.taxBefore70("Child1", avs, rules, false))
				.isEqualByComparingTo(BigDecimal.ZERO);
	}

	@Test
	@DisplayName("1000000 € death benefit => (152500*0 + 700000*20% + 147500*31.25%)")
	void taxBefore70_aboveThreshold700k() {
		List<LifeInsuranceInput> avs = List.of(
				new LifeInsuranceInput("Child1", new BigDecimal("800000"), new BigDecimal("1000000"),
						LocalDate.of(2005, 1, 1), null, 50));
		BigDecimal tax = svc.taxBefore70("Child1", avs, rules, false);
		// taxable = 1000000 - 152500 = 847500
		// 700000 * 0.20 = 140000
		// (847500 - 700000) * 0.3125 = 147500 * 0.3125 = 46093.75
		// total = 186093.75
		assertThat(tax).isEqualByComparingTo(new BigDecimal("186093.75"));
	}

	@Test
	@DisplayName("Premiums paid after 70 are ignored for art. 990 I")
	void taxBefore70_ignoresAfter70() {
		List<LifeInsuranceInput> avs = List.of(
				new LifeInsuranceInput("Child1", new BigDecimal("300000"), new BigDecimal("400000"),
						LocalDate.of(2000, 1, 1), null, 75));
		assertThat(svc.taxBefore70("Child1", avs, rules, false))
				.isEqualByComparingTo(BigDecimal.ZERO);
	}

	@Test
	@DisplayName("Only matching beneficiary is considered")
	void taxBefore70_filtersByBeneficiary() {
		List<LifeInsuranceInput> avs = List.of(
				new LifeInsuranceInput("Child1", new BigDecimal("200000"), new BigDecimal("300000"),
						LocalDate.of(2010, 1, 1), null, 55),
				new LifeInsuranceInput("Child2", new BigDecimal("200000"), new BigDecimal("300000"),
						LocalDate.of(2010, 1, 1), null, 55));
		BigDecimal taxChild1 = svc.taxBefore70("Child1", avs, rules, false);
		// 300000 - 152500 = 147500 * 20% = 29500
		assertThat(taxChild1).isEqualByComparingTo(new BigDecimal("29500.00"));
	}

	// --- reintegratedAfter70 (art. 757 B) ---

	@Test
	@DisplayName("No insurance => 0")
	void reintegratedAfter70_noInsurance() {
		assertThat(svc.reintegratedAfter70("Child1", List.of(), rules, 1))
				.isEqualByComparingTo(BigDecimal.ZERO);
	}

	@Test
	@DisplayName("50000 € premiums after 70, 1 beneficiary => 50000 - 30500 = 19500 €")
	void reintegratedAfter70_singleBeneficiary() {
		List<LifeInsuranceInput> avs = List.of(
				new LifeInsuranceInput("Child1", new BigDecimal("50000"), new BigDecimal("60000"),
						LocalDate.of(2015, 1, 1), null, 72));
		BigDecimal reintegrated = svc.reintegratedAfter70("Child1", avs, rules, 1);
		assertThat(reintegrated).isEqualByComparingTo(new BigDecimal("19500.00"));
	}

	@Test
	@DisplayName("50000 € premiums after 70, 2 beneficiaries => 50000 - 15250 = 34750 €")
	void reintegratedAfter70_twoBeneficiaries() {
		List<LifeInsuranceInput> avs = List.of(
				new LifeInsuranceInput("Child1", new BigDecimal("50000"), new BigDecimal("60000"),
						LocalDate.of(2015, 1, 1), null, 72));
		BigDecimal reintegrated = svc.reintegratedAfter70("Child1", avs, rules, 2);
		assertThat(reintegrated).isEqualByComparingTo(new BigDecimal("34750.00"));
	}

	@Test
	@DisplayName("Below allowance share => 0")
	void reintegratedAfter70_belowAllowance() {
		List<LifeInsuranceInput> avs = List.of(
				new LifeInsuranceInput("Child1", new BigDecimal("10000"), new BigDecimal("12000"),
						LocalDate.of(2015, 1, 1), null, 75));
		assertThat(svc.reintegratedAfter70("Child1", avs, rules, 1))
				.isEqualByComparingTo(BigDecimal.ZERO);
	}

	@Test
	@DisplayName("Premiums before 70 are ignored for art. 757 B")
	void reintegratedAfter70_ignoresBefore70() {
		List<LifeInsuranceInput> avs = List.of(
				new LifeInsuranceInput("Child1", new BigDecimal("200000"), new BigDecimal("300000"),
						LocalDate.of(2005, 1, 1), null, 55));
		assertThat(svc.reintegratedAfter70("Child1", avs, rules, 1))
				.isEqualByComparingTo(BigDecimal.ZERO);
	}
}
