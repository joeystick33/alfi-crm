package com.alkaus.smp.application.engines;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.alkaus.smp.domain.fiscal.RelationshipEnum;
import com.alkaus.smp.domain.succession.HeirInput;
import com.alkaus.smp.domain.succession.util.MaritalStatusEnum;
import com.alkaus.smp.domain.succession.util.SpouseOptionEnum;

class LegalDevolutionEngineTest {

	private LegalDevolutionEngine engine;

	@BeforeEach
	void setUp() {
		engine = new LegalDevolutionEngine();
	}

	// ================================================================
	// With children
	// ================================================================

	@Test
	@DisplayName("Married + 2 children: spouse + 2 children heirs")
	void married_2children() {
		List<HeirInput> heirs = engine.buildHeirs(
				MaritalStatusEnum.MARRIED, true, "Spouse",
				List.of("Child1", "Child2"), true, false, false,
				false, false, null, null, List.of(),
				SpouseOptionEnum.USUFRUIT_TOTAL);

		assertThat(heirs).hasSize(3);
		assertThat(heirs.get(0).name()).isEqualTo("Spouse");
		assertThat(heirs.get(0).spouse()).isTrue();
		assertThat(heirs.get(0).exemptTax()).isTrue();
		assertThat(heirs.get(1).relationshipEnum()).isEqualTo(RelationshipEnum.DIRECT_LINE);
		assertThat(heirs.get(2).relationshipEnum()).isEqualTo(RelationshipEnum.DIRECT_LINE);
		// Children share equally: 100/2 = 50 each
		assertThat(heirs.get(1).quotaPercentage()).isEqualByComparingTo(new BigDecimal("50"));
	}

	@Test
	@DisplayName("Single + 3 children: no spouse, 3 equal children")
	void single_3children() {
		List<HeirInput> heirs = engine.buildHeirs(
				MaritalStatusEnum.SINGLE, false, null,
				List.of("A", "B", "C"), true, false, false,
				false, false, null, null, List.of(), null);

		assertThat(heirs).hasSize(3);
		heirs.forEach(h -> {
			assertThat(h.spouse()).isFalse();
			assertThat(h.relationshipEnum()).isEqualTo(RelationshipEnum.DIRECT_LINE);
		});
	}

	// ================================================================
	// No children — married
	// ================================================================

	@Test
	@DisplayName("Married, no children, 2 parents alive: spouse 50%, father 25%, mother 25%")
	void married_noChildren_2parents() {
		List<HeirInput> heirs = engine.buildHeirs(
				MaritalStatusEnum.MARRIED, true, "Spouse",
				List.of(), true, false, false,
				true, true, "Père", "Mère", List.of(), null);

		assertThat(heirs).hasSize(3);
		assertThat(heirs.get(0).name()).isEqualTo("Spouse");
		assertThat(heirs.get(0).quotaPercentage()).isEqualByComparingTo(new BigDecimal("50"));
		assertThat(heirs.get(1).name()).isEqualTo("Père");
		assertThat(heirs.get(1).quotaPercentage()).isEqualByComparingTo(new BigDecimal("25"));
		assertThat(heirs.get(2).name()).isEqualTo("Mère");
		assertThat(heirs.get(2).quotaPercentage()).isEqualByComparingTo(new BigDecimal("25"));
	}

	@Test
	@DisplayName("Married, no children, 1 parent alive: spouse 75%, parent 25%")
	void married_noChildren_1parent() {
		List<HeirInput> heirs = engine.buildHeirs(
				MaritalStatusEnum.MARRIED, true, "Spouse",
				List.of(), true, false, false,
				true, false, "Père", null, List.of(), null);

		assertThat(heirs).hasSize(2);
		assertThat(heirs.get(0).quotaPercentage()).isEqualByComparingTo(new BigDecimal("75"));
		assertThat(heirs.get(1).quotaPercentage()).isEqualByComparingTo(new BigDecimal("25"));
	}

	@Test
	@DisplayName("Married, no children, no parents: spouse gets 100%")
	void married_noChildren_noParents() {
		List<HeirInput> heirs = engine.buildHeirs(
				MaritalStatusEnum.MARRIED, true, "Spouse",
				List.of(), true, false, false,
				false, false, null, null, List.of(), null);

		assertThat(heirs).hasSize(1);
		assertThat(heirs.get(0).name()).isEqualTo("Spouse");
		assertThat(heirs.get(0).quotaPercentage()).isEqualByComparingTo(new BigDecimal("100"));
	}

	// ================================================================
	// No children — no spouse
	// ================================================================

	@Test
	@DisplayName("No spouse, no children, 2 parents + 1 sibling: parents 25% each, sibling 50%")
	void noSpouse_noChildren_parentsAndSibling() {
		List<HeirInput> heirs = engine.buildHeirs(
				MaritalStatusEnum.SINGLE, false, null,
				List.of(), true, false, false,
				true, true, "Père", "Mère", List.of("Frère"), null);

		assertThat(heirs).hasSize(3);
		assertThat(heirs.get(0).name()).isEqualTo("Père");
		assertThat(heirs.get(0).quotaPercentage()).isEqualByComparingTo(new BigDecimal("25"));
		assertThat(heirs.get(1).name()).isEqualTo("Mère");
		assertThat(heirs.get(1).quotaPercentage()).isEqualByComparingTo(new BigDecimal("25"));
		assertThat(heirs.get(2).name()).isEqualTo("Frère");
		assertThat(heirs.get(2).relationshipEnum()).isEqualTo(RelationshipEnum.SIBLINGS);
		assertThat(heirs.get(2).quotaPercentage()).isEqualByComparingTo(new BigDecimal("50"));
	}

	@Test
	@DisplayName("No spouse, no children, only siblings: equal shares")
	void noSpouse_noChildren_onlySiblings() {
		List<HeirInput> heirs = engine.buildHeirs(
				MaritalStatusEnum.SINGLE, false, null,
				List.of(), true, false, false,
				false, false, null, null, List.of("Frère", "Sœur"), null);

		assertThat(heirs).hasSize(2);
		assertThat(heirs.get(0).quotaPercentage()).isEqualByComparingTo(new BigDecimal("50"));
		assertThat(heirs.get(1).quotaPercentage()).isEqualByComparingTo(new BigDecimal("50"));
	}

	@Test
	@DisplayName("No spouse, no children, only parents: equal shares")
	void noSpouse_noChildren_onlyParents() {
		List<HeirInput> heirs = engine.buildHeirs(
				MaritalStatusEnum.SINGLE, false, null,
				List.of(), true, false, false,
				true, true, "Père", "Mère", List.of(), null);

		assertThat(heirs).hasSize(2);
		assertThat(heirs.get(0).quotaPercentage()).isEqualByComparingTo(new BigDecimal("50"));
		assertThat(heirs.get(1).quotaPercentage()).isEqualByComparingTo(new BigDecimal("50"));
	}

	// ================================================================
	// PACS
	// ================================================================

	@Test
	@DisplayName("PACS with children and will: spouse present in heirs")
	void pacs_withChildren_withWill() {
		List<HeirInput> heirs = engine.buildHeirs(
				MaritalStatusEnum.PACSED, true, "Partner",
				List.of("Child1"), true, false, true,
				false, false, null, null, List.of(), null);

		assertThat(heirs).hasSize(2);
		assertThat(heirs.get(0).name()).isEqualTo("Partner");
		assertThat(heirs.get(0).exemptTax()).isTrue();
	}

	@Test
	@DisplayName("PACS without will and no children: partner gets nothing, parents/siblings inherit")
	void pacs_noWill_noChildren() {
		List<HeirInput> heirs = engine.buildHeirs(
				MaritalStatusEnum.PACSED, true, "Partner",
				List.of(), true, false, false,
				true, true, "Père", "Mère", List.of(), null);

		// No will => devolution goes to parents, not PACS partner
		assertThat(heirs.stream().noneMatch(h -> h.name().equals("Partner"))).isTrue();
		assertThat(heirs).hasSize(2); // parents only
	}

	// ================================================================
	// Available options
	// ================================================================

	@Test
	@DisplayName("Married with common children: USF total available")
	void availableOptions_married_commonChildren() {
		List<SpouseOptionEnum> opts = engine.availableOptions(
				MaritalStatusEnum.MARRIED, true, true, false);

		assertThat(opts).contains(SpouseOptionEnum.USUFRUIT_TOTAL);
	}

	@Test
	@DisplayName("Married with DDV: 1/4 PP + 3/4 US and all PP available")
	void availableOptions_withDDV() {
		List<SpouseOptionEnum> opts = engine.availableOptions(
				MaritalStatusEnum.MARRIED, true, true, true);

		assertThat(opts).contains(SpouseOptionEnum.QUART_PP_TROIS_QUART_US);
		assertThat(opts).contains(SpouseOptionEnum.TOUTE_PLEINE_PROPRIETE);
	}

	@Test
	@DisplayName("Not married: no options")
	void availableOptions_single() {
		List<SpouseOptionEnum> opts = engine.availableOptions(
				MaritalStatusEnum.SINGLE, true, true, false);

		assertThat(opts).isEmpty();
	}

	// ================================================================
	// Representation (art. 751 C.civ) — nephews/nieces
	// ================================================================

	@Test
	@DisplayName("Single, 1 parent, 2 alive siblings + 1 deceased sibling with 2 nephews: 4 souches")
	void noSpouse_representation_1parent_2siblings_1deceasedWith2Nephews() {
		// 1 parent alive → 25%, 3 souches (2 alive + 1 deceased) share 75%
		// Each souche = 25%, deceased sibling's 25% split between 2 nephews = 12.5% each
		List<HeirInput> heirs = engine.buildHeirs(
				MaritalStatusEnum.SINGLE, false, null,
				List.of(), true, false, false,
				true, false, "Père", null,
				List.of("thierry", "sophie"),
				Map.of("frèreDécédé", List.of("neveu1", "neveu2")),
				Set.of(),
				null);

		assertThat(heirs).hasSize(5);
		// Parent: 25%
		assertThat(heirs.get(0).name()).isEqualTo("Père");
		assertThat(heirs.get(0).quotaPercentage()).isEqualByComparingTo(new BigDecimal("25"));
		// Alive siblings: 25% each
		assertThat(heirs.get(1).name()).isEqualTo("thierry");
		assertThat(heirs.get(1).relationshipEnum()).isEqualTo(RelationshipEnum.SIBLINGS);
		assertThat(heirs.get(1).quotaPercentage()).isEqualByComparingTo(new BigDecimal("25"));
		assertThat(heirs.get(2).name()).isEqualTo("sophie");
		assertThat(heirs.get(2).quotaPercentage()).isEqualByComparingTo(new BigDecimal("25"));
		// Nephews: 12.5% each
		assertThat(heirs.get(3).name()).isEqualTo("neveu1");
		assertThat(heirs.get(3).relationshipEnum()).isEqualTo(RelationshipEnum.NIECE_NEPHEW);
		assertThat(heirs.get(3).quotaPercentage()).isEqualByComparingTo(new BigDecimal("12.5"));
		assertThat(heirs.get(4).name()).isEqualTo("neveu2");
		assertThat(heirs.get(4).relationshipEnum()).isEqualTo(RelationshipEnum.NIECE_NEPHEW);
		assertThat(heirs.get(4).quotaPercentage()).isEqualByComparingTo(new BigDecimal("12.5"));
	}

	@Test
	@DisplayName("Single, no parents, only deceased siblings with nephews")
	void noSpouse_representation_noParents_onlyNephews() {
		// 0 parents, 2 souches (both deceased with children)
		// souche1: 2 nephews → 25% each, souche2: 1 nephew → 50%
		List<HeirInput> heirs = engine.buildHeirs(
				MaritalStatusEnum.SINGLE, false, null,
				List.of(), true, false, false,
				false, false, null, null,
				List.of(),
				Map.of("frère1", List.of("n1", "n2"), "frère2", List.of("n3")),
				Set.of(),
				null);

		assertThat(heirs).hasSize(3);
		// Total 100% / 2 souches = 50% per souche
		// Souche 1: 50% / 2 = 25% each
		assertThat(heirs.stream().filter(h -> h.name().equals("n1")).findFirst().get().quotaPercentage())
				.isEqualByComparingTo(new BigDecimal("25"));
		assertThat(heirs.stream().filter(h -> h.name().equals("n2")).findFirst().get().quotaPercentage())
				.isEqualByComparingTo(new BigDecimal("25"));
		// Souche 2: 50% / 1 = 50%
		assertThat(heirs.stream().filter(h -> h.name().equals("n3")).findFirst().get().quotaPercentage())
				.isEqualByComparingTo(new BigDecimal("50"));
	}

	// ================================================================
	// Order 3/4 fallback (no parents, no siblings)
	// ================================================================

	@Test
	@DisplayName("Single, no children, no order-2 and no order-3/4 data: explicit error")
	void noSpouse_noChildren_noParents_noSiblings_missingOrder34_throws() {
		assertThatThrownBy(() -> engine.buildHeirs(
				MaritalStatusEnum.SINGLE, false, null,
				List.of(), true, false, false,
				false, false, null, null, List.of(), null))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("ordre 3/4");
	}

	@Test
	@DisplayName("PACS no will, no children, no order-2 and no order-3/4 data: explicit error")
	void pacs_noWill_noChildren_noParents_noSiblings() {
		assertThatThrownBy(() -> engine.buildHeirs(
				MaritalStatusEnum.PACSED, true, "Partner",
				List.of(), true, false, false,
				false, false, null, null, List.of(), null))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("ordre 3/4");
	}

	@Test
	@DisplayName("Single no order-2: uses nominative ordinary ascendants when provided")
	void noSpouse_noChildren_usesOrdinaryAscendantsWhenProvided() {
		List<HeirInput> heirs = engine.buildHeirs(
				MaritalStatusEnum.SINGLE, false, null,
				List.of(), true, false, false,
				false, false, null, null, List.of(), Map.of(), Set.of(), null, Map.of(),
				List.of("Grand-mère Alice", "Grand-père Bernard"), List.of());

		assertThat(heirs).hasSize(2);
		assertThat(heirs.get(0).relationshipEnum()).isEqualTo(RelationshipEnum.GRANDPARENT);
		assertThat(heirs.get(1).relationshipEnum()).isEqualTo(RelationshipEnum.GRANDPARENT);
		assertThat(heirs.get(0).quotaPercentage()).isEqualByComparingTo(new BigDecimal("50"));
		assertThat(heirs.get(1).quotaPercentage()).isEqualByComparingTo(new BigDecimal("50"));
	}
}
