package com.alkaus.smp.application.fiscal;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.alkaus.smp.application.TestFiscalRulesFactory;
import com.alkaus.smp.domain.fiscal.FiscalRules;
import com.alkaus.smp.domain.fiscal.RelationshipEnum;
import com.alkaus.smp.domain.fiscal.Scale;
import com.alkaus.smp.domain.fiscal.UsufructScales;

class FiscalCalculatorTest {

	private final FiscalRules rules = TestFiscalRulesFactory.rules2026();

	// --- rightsPerSlice: direct line ---

	@Test
	@DisplayName("Direct line: 0 € taxable => 0 € rights")
	void directLine_zero() {
		Scale scale = rules.scalesByLink().get(RelationshipEnum.DIRECT_LINE);
		assertThat(FiscalCalculator.rightsPerSlice(BigDecimal.ZERO, scale))
				.isEqualByComparingTo(BigDecimal.ZERO);
	}

	@Test
	@DisplayName("Direct line: 5000 € taxable => 5000 * 5% = 250 €")
	void directLine_firstSliceOnly() {
		Scale scale = rules.scalesByLink().get(RelationshipEnum.DIRECT_LINE);
		BigDecimal rights = FiscalCalculator.rightsPerSlice(new BigDecimal("5000"), scale);
		assertThat(rights).isEqualByComparingTo(new BigDecimal("250.00"));
	}

	@Test
	@DisplayName("Direct line: 100000 € taxable => progressive calculation across 4 slices")
	void directLine_100k() {
		Scale scale = rules.scalesByLink().get(RelationshipEnum.DIRECT_LINE);
		// 8072*0.05 + (12109-8072)*0.10 + (15932-12109)*0.15 + (100000-15932)*0.20
		// = 403.60 + 403.70 + 573.45 + 16813.60 = 18194.35
		BigDecimal rights = FiscalCalculator.rightsPerSlice(new BigDecimal("100000"), scale);
		assertThat(rights).isEqualByComparingTo(new BigDecimal("18194.35"));
	}

	@Test
	@DisplayName("Direct line: 2000000 € taxable => all 7 slices used")
	void directLine_2M() {
		Scale scale = rules.scalesByLink().get(RelationshipEnum.DIRECT_LINE);
		// 8072*0.05 + 4037*0.10 + 3823*0.15 + 536392*0.20 + 350514*0.30 + 902839*0.40 + 194323*0.45
		// = 403.60 + 403.70 + 573.45 + 107278.40 + 105154.20 + 361135.60 + 87445.35 = 662394.30
		BigDecimal rights = FiscalCalculator.rightsPerSlice(new BigDecimal("2000000"), scale);
		assertThat(rights).isEqualByComparingTo(new BigDecimal("662394.30"));
	}

	// --- rightsPerSlice: siblings ---

	@Test
	@DisplayName("Siblings: 20000 € taxable => 20000 * 35% = 7000 €")
	void siblings_firstSlice() {
		Scale scale = rules.scalesByLink().get(RelationshipEnum.SIBLINGS);
		BigDecimal rights = FiscalCalculator.rightsPerSlice(new BigDecimal("20000"), scale);
		assertThat(rights).isEqualByComparingTo(new BigDecimal("7000.00"));
	}

	@Test
	@DisplayName("Siblings: 50000 € taxable => 24430*0.35 + 25570*0.45")
	void siblings_twoSlices() {
		Scale scale = rules.scalesByLink().get(RelationshipEnum.SIBLINGS);
		// 24430*0.35 + (50000-24430)*0.45 = 8550.50 + 11506.50 = 20057.00
		BigDecimal rights = FiscalCalculator.rightsPerSlice(new BigDecimal("50000"), scale);
		assertThat(rights).isEqualByComparingTo(new BigDecimal("20057.00"));
	}

	// --- rightsPerSlice: niece/nephew ---

	@Test
	@DisplayName("Niece/Nephew: 100000 € taxable => 100000 * 55% = 55000 €")
	void nieceNephew_flatRate() {
		Scale scale = rules.scalesByLink().get(RelationshipEnum.NIECE_NEPHEW);
		BigDecimal rights = FiscalCalculator.rightsPerSlice(new BigDecimal("100000"), scale);
		assertThat(rights).isEqualByComparingTo(new BigDecimal("55000.00"));
	}

	// --- rightsPerSlice: others ---

	@Test
	@DisplayName("Others: 100000 € taxable => 100000 * 60% = 60000 €")
	void others_flatRate() {
		Scale scale = rules.scalesByLink().get(RelationshipEnum.OTHERS);
		BigDecimal rights = FiscalCalculator.rightsPerSlice(new BigDecimal("100000"), scale);
		assertThat(rights).isEqualByComparingTo(new BigDecimal("60000.00"));
	}

	// --- rightsPerSlice: edge cases ---

	@Test
	@DisplayName("Null scale => 0 €")
	void nullScale_zero() {
		assertThat(FiscalCalculator.rightsPerSlice(new BigDecimal("50000"), null))
				.isEqualByComparingTo(BigDecimal.ZERO);
	}

	@Test
	@DisplayName("Negative taxable => 0 €")
	void negativeTaxable_zero() {
		Scale scale = rules.scalesByLink().get(RelationshipEnum.DIRECT_LINE);
		assertThat(FiscalCalculator.rightsPerSlice(new BigDecimal("-1000"), scale))
				.isEqualByComparingTo(BigDecimal.ZERO);
	}

	// --- valueRights: usufruct & bare ownership ---

	@Test
	@DisplayName("Usufruct at age 65 (40% — ceiling 70) on 500000 => 200000")
	void usufruct_age65() {
		UsufructScales scales = rules.usufructScales();
		BigDecimal val = FiscalCalculator.valueRights(new BigDecimal("500000"), true, 65, scales);
		assertThat(val).isEqualByComparingTo(new BigDecimal("200000"));
	}

	@Test
	@DisplayName("Bare ownership at age 65 (40% USF => 60% NP) on 500000 => 300000")
	void bareOwnership_age65() {
		UsufructScales scales = rules.usufructScales();
		BigDecimal val = FiscalCalculator.valueRights(new BigDecimal("500000"), false, 65, scales);
		assertThat(val).isEqualByComparingTo(new BigDecimal("300000"));
	}

	@Test
	@DisplayName("Usufruct at age 25 (80%) on 400000 => 320000")
	void usufruct_age25() {
		UsufructScales scales = rules.usufructScales();
		BigDecimal val = FiscalCalculator.valueRights(new BigDecimal("400000"), true, 25, scales);
		assertThat(val).isEqualByComparingTo(new BigDecimal("320000"));
	}

	@Test
	@DisplayName("Usufruct at age 91+ (10%) on 300000 => 30000")
	void usufruct_age95() {
		UsufructScales scales = rules.usufructScales();
		BigDecimal val = FiscalCalculator.valueRights(new BigDecimal("300000"), true, 95, scales);
		assertThat(val).isEqualByComparingTo(new BigDecimal("30000"));
	}

	@Test
	@DisplayName("Bare ownership at age 91+ (90%) on 300000 => 270000")
	void bareOwnership_age95() {
		UsufructScales scales = rules.usufructScales();
		BigDecimal val = FiscalCalculator.valueRights(new BigDecimal("300000"), false, 95, scales);
		assertThat(val).isEqualByComparingTo(new BigDecimal("270000"));
	}

	@Test
	@DisplayName("valueRights with zero base => 0")
	void valueRights_zeroBase() {
		UsufructScales scales = rules.usufructScales();
		assertThat(FiscalCalculator.valueRights(BigDecimal.ZERO, true, 65, scales))
				.isEqualByComparingTo(BigDecimal.ZERO);
	}
}
