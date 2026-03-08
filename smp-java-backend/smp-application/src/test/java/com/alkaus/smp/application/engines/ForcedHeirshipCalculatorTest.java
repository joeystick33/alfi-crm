package com.alkaus.smp.application.engines;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ForcedHeirshipCalculatorTest {

	private ForcedHeirshipCalculator calc;

	@BeforeEach
	void setUp() {
		calc = new ForcedHeirshipCalculator();
	}

	@Test
	@DisplayName("0 children: reserve = 0, QD = 100%")
	void noChildren() {
		assertThat(calc.reserveFraction(0)).isEqualByComparingTo(BigDecimal.ZERO);
		assertThat(calc.availableQuotaFraction(0)).isEqualByComparingTo(BigDecimal.ONE);
	}

	@Test
	@DisplayName("1 child: reserve = 1/2, QD = 1/2")
	void oneChild() {
		assertThat(calc.reserveFraction(1)).isEqualByComparingTo(new BigDecimal("0.50"));
		assertThat(calc.availableQuotaFraction(1)).isEqualByComparingTo(new BigDecimal("0.50"));
	}

	@Test
	@DisplayName("2 children: reserve = 2/3, QD = 1/3")
	void twoChildren() {
		assertThat(calc.reserveFraction(2)).isEqualByComparingTo(new BigDecimal("0.666667"));
		assertThat(calc.availableQuotaFraction(2)).isEqualByComparingTo(new BigDecimal("0.333333"));
	}

	@Test
	@DisplayName("3+ children: reserve = 3/4, QD = 1/4")
	void threeOrMoreChildren() {
		assertThat(calc.reserveFraction(3)).isEqualByComparingTo(new BigDecimal("0.75"));
		assertThat(calc.reserveFraction(5)).isEqualByComparingTo(new BigDecimal("0.75"));
		assertThat(calc.availableQuotaFraction(4)).isEqualByComparingTo(new BigDecimal("0.25"));
	}

	@Test
	@DisplayName("Reserve amount: 600k estate, 2 children => 400k reserve")
	void reserveAmount() {
		BigDecimal reserve = calc.reserveAmount(new BigDecimal("600000"), 2);
		assertThat(reserve).isEqualByComparingTo(new BigDecimal("400000.20"));
	}

	@Test
	@DisplayName("Available quota amount: 600k estate, 2 children => 200k QD")
	void availableQuotaAmount() {
		BigDecimal qd = calc.availableQuotaAmount(new BigDecimal("600000"), 2);
		assertThat(qd).isEqualByComparingTo(new BigDecimal("199999.80"));
	}

	@Test
	@DisplayName("Reserve + QD = estate value")
	void reservePlusQD_equalsEstate() {
		BigDecimal estate = new BigDecimal("1000000");
		for (int n = 0; n <= 5; n++) {
			BigDecimal reserve = calc.reserveAmount(estate, n);
			BigDecimal qd = calc.availableQuotaAmount(estate, n);
			assertThat(reserve.add(qd)).isEqualByComparingTo(estate);
		}
	}
}
