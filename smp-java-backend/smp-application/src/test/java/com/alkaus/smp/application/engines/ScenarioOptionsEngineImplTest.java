package com.alkaus.smp.application.engines;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.alkaus.smp.domain.fiscal.RelationshipEnum;
import com.alkaus.smp.domain.succession.HeirInput;
import com.alkaus.smp.domain.succession.InheritanceInput;
import com.alkaus.smp.domain.succession.ScenarioAllocation;
import com.alkaus.smp.domain.succession.util.MaritalStatusEnum;
import com.alkaus.smp.domain.succession.util.RightReceivedEnum;
import com.alkaus.smp.domain.succession.util.ScenarioTypeEnum;
import com.alkaus.smp.domain.succession.util.SpouseOptionEnum;

class ScenarioOptionsEngineImplTest {

	private final ScenarioOptionsEngineImpl engine = new ScenarioOptionsEngineImpl(new ForcedHeirshipCalculator());

	private InheritanceInput buildInput(SpouseOptionEnum option, List<HeirInput> heirs) {
		return new InheritanceInput(2026, ScenarioTypeEnum.CLIENT_DECEASED,
				MaritalStatusEnum.MARRIED, "communauté", option, 65, 60,
				new BigDecimal("500000"), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
				heirs, List.of(), List.of(), LocalDate.now(), LocalDate.now());
	}

	// --- Without spouse ---

	@Test
	@DisplayName("No spouse: all heirs get PP with their quota")
	void noSpouse_allPP() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("50"), false, false),
				new HeirInput("Child2", RelationshipEnum.DIRECT_LINE, new BigDecimal("50"), false, false));

		ScenarioAllocation alloc = engine.generateScenario(buildInput(null, heirs));

		assertThat(alloc.lines()).hasSize(2);
		assertThat(alloc.lines().get(0).rightReceived()).isEqualTo(RightReceivedEnum.PLEINE_PROPRIETE);
		assertThat(alloc.lines().get(1).rightReceived()).isEqualTo(RightReceivedEnum.PLEINE_PROPRIETE);
		assertThat(alloc.lines().get(0).quotaPercentage()).isEqualByComparingTo(new BigDecimal("50"));
	}

	@Test
	@DisplayName("No spouse: invalid quota sum throws")
	void noSpouse_invalidQuota() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("30"), false, false),
				new HeirInput("Child2", RelationshipEnum.DIRECT_LINE, new BigDecimal("30"), false, false));

		assertThatThrownBy(() -> engine.generateScenario(buildInput(null, heirs)))
				.isInstanceOf(IllegalArgumentException.class);
	}

	// --- USUFRUIT_TOTAL ---

	@Test
	@DisplayName("Usufruit total: spouse gets 100% USF, children get NP with their quota")
	void usufruitTotal() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Spouse", RelationshipEnum.OTHERS, new BigDecimal("100"), true, true),
				new HeirInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("50"), false, false),
				new HeirInput("Child2", RelationshipEnum.DIRECT_LINE, new BigDecimal("50"), false, false));

		ScenarioAllocation alloc = engine.generateScenario(buildInput(SpouseOptionEnum.USUFRUIT_TOTAL, heirs));

		assertThat(alloc.lines()).hasSize(3);

		var spouseLine = alloc.lines().get(0);
		assertThat(spouseLine.heirName()).isEqualTo("Spouse");
		assertThat(spouseLine.rightReceived()).isEqualTo(RightReceivedEnum.USUFRUIT);
		assertThat(spouseLine.quotaPercentage()).isEqualByComparingTo(new BigDecimal("100"));

		var child1Line = alloc.lines().get(1);
		assertThat(child1Line.rightReceived()).isEqualTo(RightReceivedEnum.NUE_PROPRIETE);
		assertThat(child1Line.quotaPercentage()).isEqualByComparingTo(new BigDecimal("50"));
	}

	// --- QUART_PP_TROIS_QUART_US ---

	@Test
	@DisplayName("1/4 PP + 3/4 US: spouse gets 25% PP + 75% USF, children get NP on 75%")
	void quarterPP_threeQuarterUS() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Spouse", RelationshipEnum.OTHERS, new BigDecimal("100"), true, true),
				new HeirInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("50"), false, false),
				new HeirInput("Child2", RelationshipEnum.DIRECT_LINE, new BigDecimal("50"), false, false));

		ScenarioAllocation alloc = engine.generateScenario(
				buildInput(SpouseOptionEnum.QUART_PP_TROIS_QUART_US, heirs));

		assertThat(alloc.lines()).hasSize(4);

		assertThat(alloc.lines().get(0).heirName()).isEqualTo("Spouse");
		assertThat(alloc.lines().get(0).rightReceived()).isEqualTo(RightReceivedEnum.PLEINE_PROPRIETE);
		assertThat(alloc.lines().get(0).quotaPercentage()).isEqualByComparingTo(new BigDecimal("25"));

		assertThat(alloc.lines().get(1).heirName()).isEqualTo("Spouse");
		assertThat(alloc.lines().get(1).rightReceived()).isEqualTo(RightReceivedEnum.USUFRUIT);
		assertThat(alloc.lines().get(1).quotaPercentage()).isEqualByComparingTo(new BigDecimal("75"));

		// Children: NP on 75% => 50 * 0.75 = 37.5 each
		assertThat(alloc.lines().get(2).rightReceived()).isEqualTo(RightReceivedEnum.NUE_PROPRIETE);
		assertThat(alloc.lines().get(2).quotaPercentage()).isEqualByComparingTo(new BigDecimal("37.5"));
		assertThat(alloc.lines().get(3).quotaPercentage()).isEqualByComparingTo(new BigDecimal("37.5"));
	}

	// --- TOUTE_PLEINE_PROPRIETE ---

	@Test
	@DisplayName("All PP with 1 child: spouse gets QD (50% PP), child gets reserve (50% PP)")
	void allPP_1child() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Spouse", RelationshipEnum.OTHERS, new BigDecimal("100"), true, true),
				new HeirInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("100"), false, false));

		ScenarioAllocation alloc = engine.generateScenario(
				buildInput(SpouseOptionEnum.TOUTE_PLEINE_PROPRIETE, heirs));

		assertThat(alloc.lines()).hasSize(2);
		// Spouse: QD = 1/2 with 1 child => 50% PP
		assertThat(alloc.lines().get(0).heirName()).isEqualTo("Spouse");
		assertThat(alloc.lines().get(0).rightReceived()).isEqualTo(RightReceivedEnum.PLEINE_PROPRIETE);
		assertThat(alloc.lines().get(0).quotaPercentage()).isEqualByComparingTo(new BigDecimal("50"));
		// Child: reserve = 1/2 with 1 child => 100 * 0.50 = 50% PP
		assertThat(alloc.lines().get(1).heirName()).isEqualTo("Child1");
		assertThat(alloc.lines().get(1).rightReceived()).isEqualTo(RightReceivedEnum.PLEINE_PROPRIETE);
		assertThat(alloc.lines().get(1).quotaPercentage()).isEqualByComparingTo(new BigDecimal("50"));
	}

	@Test
	@DisplayName("All PP with 2 children: spouse gets QD (33.33% PP), children get reserve (33.33% each)")
	void allPP_2children() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Spouse", RelationshipEnum.OTHERS, new BigDecimal("100"), true, true),
				new HeirInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("50"), false, false),
				new HeirInput("Child2", RelationshipEnum.DIRECT_LINE, new BigDecimal("50"), false, false));

		ScenarioAllocation alloc = engine.generateScenario(
				buildInput(SpouseOptionEnum.TOUTE_PLEINE_PROPRIETE, heirs));

		assertThat(alloc.lines()).hasSize(3);
		// Spouse: QD = 1/3 with 2 children => 33.3333% PP
		assertThat(alloc.lines().get(0).heirName()).isEqualTo("Spouse");
		assertThat(alloc.lines().get(0).rightReceived()).isEqualTo(RightReceivedEnum.PLEINE_PROPRIETE);
		assertThat(alloc.lines().get(0).quotaPercentage()).isEqualByComparingTo(new BigDecimal("33.3333"));
		// Child1: reserve = 2/3, quota 50% => 50 * 0.666667 = 33.33335 PP
		assertThat(alloc.lines().get(1).rightReceived()).isEqualTo(RightReceivedEnum.PLEINE_PROPRIETE);
		assertThat(alloc.lines().get(1).quotaPercentage()).isEqualByComparingTo(new BigDecimal("33.33335"));
		assertThat(alloc.lines().get(2).quotaPercentage()).isEqualByComparingTo(new BigDecimal("33.33335"));
	}

	@Test
	@DisplayName("All PP without children: spouse gets 100% PP")
	void allPP_noChildren() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Spouse", RelationshipEnum.OTHERS, new BigDecimal("100"), true, true));

		ScenarioAllocation alloc = engine.generateScenario(
				buildInput(SpouseOptionEnum.TOUTE_PLEINE_PROPRIETE, heirs));

		assertThat(alloc.lines()).hasSize(1);
		assertThat(alloc.lines().get(0).heirName()).isEqualTo("Spouse");
		assertThat(alloc.lines().get(0).quotaPercentage()).isEqualByComparingTo(new BigDecimal("100"));
	}

	// --- Default option ---

	@Test
	@DisplayName("Null spouse option allocates all in PP (no démembrement — e.g. married without children)")
	void defaultOption_allInPP() {
		List<HeirInput> heirs = List.of(
				new HeirInput("Spouse", RelationshipEnum.OTHERS, new BigDecimal("100"), true, true),
				new HeirInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("100"), false, false));

		ScenarioAllocation alloc = engine.generateScenario(buildInput(null, heirs));

		assertThat(alloc.lines().get(0).rightReceived()).isEqualTo(RightReceivedEnum.PLEINE_PROPRIETE);
		assertThat(alloc.lines().get(1).rightReceived()).isEqualTo(RightReceivedEnum.PLEINE_PROPRIETE);
	}
}
