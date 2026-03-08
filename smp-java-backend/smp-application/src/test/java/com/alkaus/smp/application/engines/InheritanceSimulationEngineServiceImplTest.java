package com.alkaus.smp.application.engines;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.alkaus.smp.application.TestFiscalRulesFactory;
import com.alkaus.smp.domain.fiscal.FiscalRules;
import com.alkaus.smp.domain.fiscal.RelationshipEnum;
import com.alkaus.smp.domain.repository.FiscalRulesRepository;
import com.alkaus.smp.domain.succession.DonationInput;
import com.alkaus.smp.domain.succession.HeirInput;
import com.alkaus.smp.domain.succession.HeirResult;
import com.alkaus.smp.domain.succession.InheritanceInput;
import com.alkaus.smp.domain.succession.InheritanceResult;
import com.alkaus.smp.domain.succession.LifeInsuranceInput;
import com.alkaus.smp.domain.succession.util.MaritalStatusEnum;
import com.alkaus.smp.domain.succession.util.RightReceivedEnum;
import com.alkaus.smp.domain.succession.util.ScenarioTypeEnum;
import com.alkaus.smp.domain.succession.util.SpouseOptionEnum;

/**
 * Integration tests for the full engine — real objects, no mocks.
 */
class InheritanceSimulationEngineServiceImplTest {

	private InheritanceSimulationEngineServiceImpl engine;

	@BeforeEach
	void setUp() {
		FiscalRules rules = TestFiscalRulesFactory.rules2026();
		FiscalRulesRepository repo = year -> Optional.of(rules);
		ScenarioOptionsEngine scenarioEngine = new ScenarioOptionsEngineImpl(new ForcedHeirshipCalculator());
		DonationRulesService donationService = new DonationRulesService();
		AssuranceVieRulesService avService = new AssuranceVieRulesService();
		engine = new InheritanceSimulationEngineServiceImpl(scenarioEngine, repo, donationService, avService);
	}

	private InheritanceInput buildInput(SpouseOptionEnum option, List<HeirInput> heirs,
			BigDecimal gross, BigDecimal passif, Integer deceasedAge, Integer spouseAge,
			List<DonationInput> donations, List<LifeInsuranceInput> avs) {
		return new InheritanceInput(2026, ScenarioTypeEnum.CLIENT_DECEASED,
				MaritalStatusEnum.MARRIED, "communauté", option, deceasedAge, spouseAge,
				gross, passif, passif, BigDecimal.ZERO, heirs, donations, avs,
				LocalDate.of(2026, 1, 1), LocalDate.now());
	}

	// =====================================================================
	// Case 1: Married + 2 children + usufruit total + 500k net
	// =====================================================================

	@Test
	@DisplayName("Married + 2 children + usufruit total: spouse exempt, children taxed on NP")
	void married_2children_usufruitTotal_500k() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Spouse", RelationshipEnum.OTHERS, new BigDecimal("100"), true, true),
				new HeirInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("50"), false, false),
				new HeirInput("Child2", RelationshipEnum.DIRECT_LINE, new BigDecimal("50"), false, false));

		InheritanceInput input = buildInput(SpouseOptionEnum.USUFRUIT_TOTAL, heirs,
				new BigDecimal("500000"), BigDecimal.ZERO, 65, 60, List.of(), List.of());

		InheritanceResult result = engine.simulate(input);

		assertThat(result.netAsset()).isEqualByComparingTo(new BigDecimal("500000.00"));
		assertThat(result.heirs()).hasSize(3);

		// Spouse: exempt => rights = 0
		HeirResult spouse = result.heirs().stream().filter(h -> h.name().equals("Spouse")).findFirst().orElseThrow();
		assertThat(spouse.rights()).isEqualByComparingTo(BigDecimal.ZERO);
		assertThat(spouse.taxReceived()).isEqualTo(RightReceivedEnum.USUFRUIT);

		// Children: NP on 250k each, at spouse age 60 => USF=50%, NP=50%
		// taxable = 250000 * 50% = 125000
		// allowance = 100000
		// base after allowance = 25000
		// rights: 8072*5% + (12109-8072)*10% + (15932-12109)*15% + (25000-15932)*20%
		//       = 403.60 + 403.70 + 573.45 + 1813.60 = 3194.35
		for (String name : List.of("Child1", "Child2")) {
			HeirResult child = result.heirs().stream().filter(h -> h.name().equals(name)).findFirst().orElseThrow();
			assertThat(child.taxReceived()).isEqualTo(RightReceivedEnum.NUE_PROPRIETE);
			assertThat(child.grossValueReceived()).isEqualByComparingTo(new BigDecimal("250000.00"));
			assertThat(child.taxableValue()).isEqualByComparingTo(new BigDecimal("125000.00"));
			assertThat(child.allowanceUsed()).isEqualByComparingTo(new BigDecimal("100000.00"));
			assertThat(child.baseTaxableAfterAllowance()).isEqualByComparingTo(new BigDecimal("25000.00"));
			assertThat(child.rights()).isEqualByComparingTo(new BigDecimal("3194.35"));
		}

		// Total = 2 * 3194.35 = 6388.70
		assertThat(result.totalRights()).isEqualByComparingTo(new BigDecimal("6388.70"));
	}

	// =====================================================================
	// Case 2: Married + 2 children + 1/4 PP option
	// =====================================================================

	@Test
	@DisplayName("Married + 2 children + 1/4 PP: spouse gets 25% PP + 75% USF (exempt)")
	void married_2children_quarterPP_500k() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Spouse", RelationshipEnum.OTHERS, new BigDecimal("100"), true, true),
				new HeirInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("50"), false, false),
				new HeirInput("Child2", RelationshipEnum.DIRECT_LINE, new BigDecimal("50"), false, false));

		InheritanceInput input = buildInput(SpouseOptionEnum.QUART_PP_TROIS_QUART_US, heirs,
				new BigDecimal("500000"), BigDecimal.ZERO, 65, 60, List.of(), List.of());

		InheritanceResult result = engine.simulate(input);

		HeirResult spouse = result.heirs().stream().filter(h -> h.name().equals("Spouse")).findFirst().orElseThrow();
		assertThat(spouse.rights()).isEqualByComparingTo(BigDecimal.ZERO);

		// Children: NP on 75% of their quota => 50 * 0.75 = 37.5% each
		// grossValue = 500000 * 37.5 / 100 = 187500
		// NP value at spouse age 60 (USF=50%) => 187500 * 50% = 93750
		// allowance = 93750 (capped by taxable)
		// base = 0 => rights = 0
		for (String name : List.of("Child1", "Child2")) {
			HeirResult child = result.heirs().stream().filter(h -> h.name().equals(name)).findFirst().orElseThrow();
			assertThat(child.taxReceived()).isEqualTo(RightReceivedEnum.NUE_PROPRIETE);
			assertThat(child.grossValueReceived()).isEqualByComparingTo(new BigDecimal("187500.00"));
		}
	}

	// =====================================================================
	// Case 3: No spouse, 2 children, 400k net
	// =====================================================================

	@Test
	@DisplayName("No spouse + 2 children: each gets 50% PP, taxed at direct line scale")
	void noSpouse_2children_400k() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("50"), false, false),
				new HeirInput("Child2", RelationshipEnum.DIRECT_LINE, new BigDecimal("50"), false, false));

		InheritanceInput input = buildInput(null, heirs,
				new BigDecimal("400000"), BigDecimal.ZERO, 65, null, List.of(), List.of());

		InheritanceResult result = engine.simulate(input);

		// Each child: grossValue = 400000 * 50 / 100 = 200000
		assertThat(result).isNotNull();
		assertThat(result.heirs()).hasSize(2);
		assertThat(result.heirs().get(0).grossValueReceived())
				.isEqualByComparingTo(new BigDecimal("200000"));
	}

	@Test
	@DisplayName("No spouse + 1 sibling: 100% PP, taxed at siblings scale")
	void noSpouse_1sibling() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Sibling1", RelationshipEnum.SIBLINGS, new BigDecimal("100"), false, false));

		InheritanceInput input = buildInput(null, heirs,
				new BigDecimal("200000"), BigDecimal.ZERO, 65, null, List.of(), List.of());

		InheritanceResult result = engine.simulate(input);

		// grossValue = 200000 * 100 / 100 = 200000
		assertThat(result.heirs()).hasSize(1);
		assertThat(result.heirs().get(0).relationship()).isEqualTo(RelationshipEnum.SIBLINGS);
		assertThat(result.heirs().get(0).grossValueReceived())
				.isEqualByComparingTo(new BigDecimal("200000"));
	}

	// =====================================================================
	// Case 4: With donations reducing allowance
	// =====================================================================

	@Test
	@DisplayName("Donation rapport fiscal art. 784 CGI: 60k donated within 15y => full allowance on cumul")
	void withDonation_reducedAllowance() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Spouse", RelationshipEnum.OTHERS, new BigDecimal("100"), true, true),
				new HeirInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("100"), false, false));

		List<DonationInput> donations = List.of(
				new DonationInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("60000"),
						LocalDate.of(2020, 6, 1), true));

		InheritanceInput input = buildInput(SpouseOptionEnum.USUFRUIT_TOTAL, heirs,
				new BigDecimal("400000"), BigDecimal.ZERO, 65, 60, donations, List.of());

		InheritanceResult result = engine.simulate(input);

		HeirResult child = result.heirs().stream().filter(h -> h.name().equals("Child1")).findFirst().orElseThrow();
		// NP on 400000 at spouse 60 (USF=50%) => taxable = 200000
		// Art. 784 CGI: cumul = 200000 + 60000 = 260000, full allowance = 100000
		// allowanceUsed = min(100000, 260000) = 100000
		assertThat(child.allowanceUsed()).isEqualByComparingTo(new BigDecimal("100000.00"));
		// cumulAfterAllowance = 260000 - 100000 = 160000
		// donationAfterAllowance = max(0, 60000 - 100000) = 0, taxCredit = 0
		// baseAfterAllowance = 160000 - 0 = 160000
		assertThat(child.baseTaxableAfterAllowance()).isEqualByComparingTo(new BigDecimal("160000.00"));
		// rights > 0
		assertThat(child.rights().compareTo(BigDecimal.ZERO)).isGreaterThan(0);
	}

	// =====================================================================
	// Case 5: With life insurance (art. 990 I)
	// =====================================================================

	@Test
	@DisplayName("Life insurance art. 990 I: adds AV tax to heir rights")
	void withLifeInsurance_art990I() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Spouse", RelationshipEnum.OTHERS, new BigDecimal("100"), true, true),
				new HeirInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("100"), false, false));

		List<LifeInsuranceInput> avs = List.of(
				new LifeInsuranceInput("Child1", new BigDecimal("200000"), new BigDecimal("250000"),
						LocalDate.of(2010, 1, 1), null, 55));

		InheritanceInput input = buildInput(SpouseOptionEnum.USUFRUIT_TOTAL, heirs,
				new BigDecimal("300000"), BigDecimal.ZERO, 65, 60, List.of(), avs);

		InheritanceResult result = engine.simulate(input);

		HeirResult child = result.heirs().stream().filter(h -> h.name().equals("Child1")).findFirst().orElseThrow();
		// AV tax: (250000 - 152500) * 20% = 97500 * 20% = 19500
		// Inheritance rights on NP + AV tax
		// NP = 300000 * 50% = 150000, allowance 100000, base 50000
		// inheritance = 8072*5% + 4037*10% + 3823*15% + 34068*20% = ...
		// total rights = inheritance + 19500
		assertThat(child.rights().compareTo(new BigDecimal("19500"))).isGreaterThan(0);
	}

	// =====================================================================
	// Case 6: With life insurance art. 757 B (after 70)
	// =====================================================================

	@Test
	@DisplayName("Life insurance art. 757 B: reintegrated premiums increase taxable base")
	void withLifeInsurance_art757B() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Spouse", RelationshipEnum.OTHERS, new BigDecimal("100"), true, true),
				new HeirInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("100"), false, false));

		List<LifeInsuranceInput> avs = List.of(
				new LifeInsuranceInput("Child1", new BigDecimal("80000"), new BigDecimal("90000"),
						LocalDate.of(2015, 1, 1), null, 72));

		InheritanceInput input = buildInput(SpouseOptionEnum.USUFRUIT_TOTAL, heirs,
				new BigDecimal("300000"), BigDecimal.ZERO, 75, 70, List.of(), avs);

		InheritanceResult result = engine.simulate(input);

		HeirResult child = result.heirs().stream().filter(h -> h.name().equals("Child1")).findFirst().orElseThrow();
		// NP on 300000 at spouse 70 (USF=40%) => NP = 60% => 180000
		// Reintegrated 757B: 80000 (bonuses) - 30500 = 49500
		// Total taxable = 180000 + 49500 = 229500
		// allowance = 100000
		// base = 129500
		assertThat(child.baseTaxableAfterAllowance()).isEqualByComparingTo(new BigDecimal("129500.00"));
	}

	// =====================================================================
	// Case 7: Spouse exempt from AV tax
	// =====================================================================

	@Test
	@DisplayName("Spouse beneficiary of AV: exempt from art. 990 I tax")
	void spouseAV_exempt() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Spouse", RelationshipEnum.OTHERS, new BigDecimal("100"), true, true),
				new HeirInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("100"), false, false));

		List<LifeInsuranceInput> avs = List.of(
				new LifeInsuranceInput("Spouse", new BigDecimal("500000"), new BigDecimal("600000"),
						LocalDate.of(2005, 1, 1), null, 50));

		InheritanceInput input = buildInput(SpouseOptionEnum.USUFRUIT_TOTAL, heirs,
				new BigDecimal("300000"), BigDecimal.ZERO, 65, 60, List.of(), avs);

		InheritanceResult result = engine.simulate(input);

		HeirResult spouse = result.heirs().stream().filter(h -> h.name().equals("Spouse")).findFirst().orElseThrow();
		assertThat(spouse.rights()).isEqualByComparingTo(BigDecimal.ZERO);
	}

	// =====================================================================
	// Case 8: Disabled heir gets +159 325 € allowance
	// =====================================================================

	// =====================================================================
	// Case 9: Principal residence 20% abatement (art. 764 bis CGI)
	// =====================================================================

	@Test
	@DisplayName("RP abatement: 500k estate with 300k RP => fiscal asset = 500k - 60k = 440k")
	void principalResidence_20pctAbatement() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Spouse", RelationshipEnum.OTHERS, new BigDecimal("100"), true, true,
						true, false, null, 0),
				new HeirInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("100"), false, false,
						true, false, null, 0));

		InheritanceInput input = new InheritanceInput(2026, ScenarioTypeEnum.CLIENT_DECEASED,
				MaritalStatusEnum.MARRIED, "communauté", SpouseOptionEnum.USUFRUIT_TOTAL,
				65, 60, new BigDecimal("500000"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
				heirs, List.of(), List.of(), LocalDate.now(), LocalDate.now(),
				false, false, null, null, true, new BigDecimal("300000"));

		InheritanceResult result = engine.simulate(input);

		// RP abatement = 300000 * 0.20 = 60000
		// fiscal asset = 500000 - 60000 = 440000
		assertThat(result.fiscalInheritanceAsset()).isEqualByComparingTo(new BigDecimal("440000.00"));
		// net asset remains 500000 (civil)
		assertThat(result.netAsset()).isEqualByComparingTo(new BigDecimal("500000.00"));
	}

	@Test
	@DisplayName("Disabled child: allowance = 100000 + 159325 = 259325")
	void disabledChild_extraAllowance() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Spouse", RelationshipEnum.OTHERS, new BigDecimal("100"), true, true,
						true, false, null, 0),
				new HeirInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("100"), false, false,
						true, true, null, 0));

		InheritanceInput input = buildInput(SpouseOptionEnum.USUFRUIT_TOTAL, heirs,
				new BigDecimal("500000"), BigDecimal.ZERO, 65, 60, List.of(), List.of());

		InheritanceResult result = engine.simulate(input);

		HeirResult child = result.heirs().stream().filter(h -> h.name().equals("Child1")).findFirst().orElseThrow();
		// NP on 500000 at spouse 60 (USF=50%) => taxable = 250000
		// allowance = 100000 + 159325 = 259325 > 250000 => used = 250000
		// base = 0 => rights = 0
		assertThat(child.allowanceUsed()).isEqualByComparingTo(new BigDecimal("250000.00"));
		assertThat(child.baseTaxableAfterAllowance()).isEqualByComparingTo(BigDecimal.ZERO);
		assertThat(child.rights()).isEqualByComparingTo(BigDecimal.ZERO);
	}
}
