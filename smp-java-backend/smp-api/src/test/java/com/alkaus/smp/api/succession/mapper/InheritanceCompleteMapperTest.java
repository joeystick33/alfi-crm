package com.alkaus.smp.api.succession.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import com.alkaus.smp.api.succession.dto.common.IdentityDto;
import com.alkaus.smp.api.succession.dto.request.InheritanceCompleteRequestDto;
import com.alkaus.smp.api.succession.dto.request.SpouseDto;
import com.alkaus.smp.application.inheritanceCompleteResults.command.AssetCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.DonationCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.LegCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.LifeInsuranceCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.ParentsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.PersonCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.SiblingsCommand;

class InheritanceCompleteMapperTest {

	private InheritanceCompleteMapper mapper;

	@BeforeEach
	void setUp() {
		mapper = new InheritanceCompleteMapper();
	}

	// ================================================================
	// toInverseCommand: swap client ↔ spouse + families
	// ================================================================

	@Test
	@DisplayName("toInverseCommand swaps client/spouse and their families")
	void toInverseCommand_swapsClientSpouseAndFamilies() {
		PersonCommand client = new PersonCommand("Jean", "Dupont", 65, "M");
		PersonCommand spouse = new PersonCommand("Marie", "Dupont", 60, "F");
		ParentsCommand clientParents = new ParentsCommand(true, false); // father alive
		ParentsCommand spouseParents = new ParentsCommand(false, true); // mother alive
		List<SiblingsCommand> clientSiblings = List.of(new SiblingsCommand("Pierre", true, List.of()));
		List<SiblingsCommand> spouseSiblings = List.of(new SiblingsCommand("Sophie", true, List.of()));

		CompleteResultsCommand original = new CompleteResultsCommand(
				"marié", "communauté réduite aux acquêts",
				client, spouse,
				List.of(), // no children
				clientParents, clientSiblings,
				spouseParents, spouseSiblings,
				List.of(), // assets
				BigDecimal.valueOf(500000), BigDecimal.ZERO,
				null, null,
				BigDecimal.ZERO, BigDecimal.ZERO,
				false, List.of(), List.of(), List.of(), false, true, null);

		CompleteResultsCommand inverse = mapper.toInverseCommand(original);

		assertThat(inverse).isNotNull();

		// Client/spouse swapped
		assertThat(inverse.client().firstName()).isEqualTo("Marie");
		assertThat(inverse.spouse().firstName()).isEqualTo("Jean");

		// Families swapped: deceased's parents are now the spouse's parents from original
		assertThat(inverse.parentsOfDeceased()).isNotNull();
		assertThat(inverse.parentsOfDeceased().livingFather()).isFalse();
		assertThat(inverse.parentsOfDeceased().livingMother()).isTrue(); // was spouseParents

		assertThat(inverse.parentsOfSpouse()).isNotNull();
		assertThat(inverse.parentsOfSpouse().livingFather()).isTrue(); // was clientParents
		assertThat(inverse.parentsOfSpouse().livingMother()).isFalse();

		// Siblings swapped
		assertThat(inverse.siblingsOfDeceased()).hasSize(1);
		assertThat(inverse.siblingsOfDeceased().get(0).firstName()).isEqualTo("Sophie");

		assertThat(inverse.siblingsOfSpouse()).hasSize(1);
		assertThat(inverse.siblingsOfSpouse().get(0).firstName()).isEqualTo("Pierre");

		// Non-swapped fields remain the same
		assertThat(inverse.maritalStatus()).isEqualTo("marié");
		assertThat(inverse.matrimonialRegime()).isEqualTo("communauté réduite aux acquêts");
		assertThat(inverse.totalNetWorth()).isEqualByComparingTo(BigDecimal.valueOf(500000));
	}

	@Test
	@DisplayName("toInverseCommand returns null when no spouse")
	void toInverseCommand_noSpouse_returnsNull() {
		CompleteResultsCommand original = new CompleteResultsCommand(
				"célibataire", null,
				new PersonCommand("Jean", null, 65, "M"), null,
				List.of(), null, List.of(), List.of(),
				BigDecimal.valueOf(300000), BigDecimal.ZERO,
				null, null, BigDecimal.ZERO, BigDecimal.ZERO);

		assertThat(mapper.toInverseCommand(original)).isNull();
	}

	@Test
	@DisplayName("toInverseCommand handles null spouse family gracefully")
	void toInverseCommand_nullSpouseFamily_handledGracefully() {
		PersonCommand client = new PersonCommand("Jean", null, 65, "M");
		PersonCommand spouse = new PersonCommand("Marie", null, 60, "F");
		ParentsCommand clientParents = new ParentsCommand(true, true);

		CompleteResultsCommand original = new CompleteResultsCommand(
				"marié", "communauté réduite aux acquêts",
				client, spouse,
				List.of(),
				clientParents, List.of(new SiblingsCommand("Paul", true, List.of())),
				null, null, // spouse parents/siblings not provided
				List.of(),
				BigDecimal.valueOf(400000), BigDecimal.ZERO,
				null, null,
				BigDecimal.ZERO, BigDecimal.ZERO,
				false, List.of(), List.of(), List.of(), false, true, null);

		CompleteResultsCommand inverse = mapper.toInverseCommand(original);

		assertThat(inverse).isNotNull();
		// Deceased parents = spouse's parents (was null) → null
		assertThat(inverse.parentsOfDeceased()).isNull();
		// Deceased siblings = spouse's siblings (was null) → empty list
		assertThat(inverse.siblingsOfDeceased()).isEmpty();
		// Spouse parents = client's parents → preserved
		assertThat(inverse.parentsOfSpouse()).isNotNull();
		assertThat(inverse.parentsOfSpouse().livingFather()).isTrue();
	}

	// ================================================================
	// toInverseCommand: asset ownership swap
	// ================================================================

	@Test
	@DisplayName("toInverseCommand swaps PROPRE_CLIENT ↔ PROPRE_CONJOINT on assets")
	void toInverseCommand_swapsAssetOwnership() {
		PersonCommand client = new PersonCommand("Jean", null, 65, "M");
		PersonCommand spouse = new PersonCommand("Marie", null, 60, "F");

		List<AssetCommand> assets = List.of(
				new AssetCommand("Immobilier", BigDecimal.valueOf(300000), BigDecimal.ZERO, "Maison", "PROPRE_CLIENT"),
				new AssetCommand("Compte", BigDecimal.valueOf(100000), BigDecimal.ZERO, "Livret", "PROPRE_CONJOINT"),
				new AssetCommand("PEA", BigDecimal.valueOf(200000), BigDecimal.ZERO, "PEA commun", "COMMUN")
		);

		CompleteResultsCommand original = new CompleteResultsCommand(
				"marié", "communauté réduite aux acquêts",
				client, spouse,
				List.of(), null, List.of(), null, List.of(),
				assets,
				BigDecimal.valueOf(600000), BigDecimal.ZERO,
				null, null,
				BigDecimal.ZERO, BigDecimal.ZERO,
				false, List.of(), List.of(), List.of(), false, true, null);

		CompleteResultsCommand inverse = mapper.toInverseCommand(original);

		assertThat(inverse.assets()).hasSize(3);
		// PROPRE_CLIENT → PROPRE_CONJOINT
		assertThat(inverse.assets().get(0).ownership()).isEqualTo("PROPRE_CONJOINT");
		// PROPRE_CONJOINT → PROPRE_CLIENT
		assertThat(inverse.assets().get(1).ownership()).isEqualTo("PROPRE_CLIENT");
		// COMMUN stays COMMUN
		assertThat(inverse.assets().get(2).ownership()).isEqualTo("COMMUN");
	}

	// ================================================================
	// toInverseCommand: liberality owner swap
	// ================================================================

	@Test
	@DisplayName("toInverseCommand swaps donation owner: null→CONJOINT, CONJOINT→CLIENT")
	void toInverseCommand_swapsDonationOwner() {
		PersonCommand client = new PersonCommand("Jean", null, 65, "M");
		PersonCommand spouse = new PersonCommand("Marie", null, 60, "F");

		List<DonationCommand> donations = List.of(
				new DonationCommand("Enfant1", "enfant", BigDecimal.valueOf(50000),
						LocalDate.of(2020, 1, 1), true, null),       // null owner → CLIENT default
				new DonationCommand("Enfant2", "enfant", BigDecimal.valueOf(30000),
						LocalDate.of(2021, 6, 1), true, "CONJOINT")  // spouse's donation
		);

		CompleteResultsCommand original = new CompleteResultsCommand(
				"marié", "communauté réduite aux acquêts",
				client, spouse,
				List.of(), null, List.of(), null, List.of(),
				List.of(),
				BigDecimal.valueOf(500000), BigDecimal.ZERO,
				null, null,
				BigDecimal.ZERO, BigDecimal.ZERO,
				false, donations, List.of(), List.of(), false, true, null);

		CompleteResultsCommand inverse = mapper.toInverseCommand(original);

		assertThat(inverse.donations()).hasSize(2);
		// null owner → CONJOINT (client's donation is now the survivor's)
		assertThat(inverse.donations().get(0).owner()).isEqualTo("CONJOINT");
		// CONJOINT owner → CLIENT (spouse's donation is now the deceased's)
		assertThat(inverse.donations().get(1).owner()).isEqualTo("CLIENT");
	}

	// ================================================================
	// toCommand: souscripteur → owner mapping (CRIT-2)
	// ================================================================

	/** Helper: build an InheritanceCompleteRequestDto with a single AV contract */
	private InheritanceCompleteRequestDto dtoWithAV(Map<String, Object> avContrat) {
		var identity = new IdentityDto("Jean", "Dupont", 65, "M", null);
		var spouse = new SpouseDto("Marie", "Dupont", 60, null, null, null);
		return new InheritanceCompleteRequestDto(
				"marié", "communauté réduite aux acquêts",
				identity, spouse, List.of(),
				(com.alkaus.smp.api.succession.dto.request.DeceasedParentDto) null,
				(List<com.alkaus.smp.api.succession.dto.request.SiblingsDto>) null,
				List.of(), BigDecimal.ZERO, BigDecimal.ZERO,
				"usufruit total",
				(com.alkaus.smp.api.succession.dto.common.AdvisorDto) null,
				BigDecimal.ZERO, BigDecimal.ZERO,
				(Integer) null, (Boolean) null, (Boolean) null, (BigDecimal) null,
				(Boolean) null, (Boolean) null,
				List.of(avContrat),
				(List<Map<String, Object>>) null, (List<Map<String, Object>>) null,
				(String) null, (Boolean) null, (Boolean) null, (Boolean) null,
				(com.alkaus.smp.api.succession.dto.request.DeceasedParentDto) null,
				(List<com.alkaus.smp.api.succession.dto.request.SiblingsDto>) null);
	}

	@Test
	@DisplayName("toCommand maps souscripteur MADAME → owner CONJOINT on AV contracts")
	void toCommand_mapsSouscripteurToOwner() {
		Map<String, Object> avContrat = new java.util.HashMap<>();
		avContrat.put("souscripteur", "MADAME");
		avContrat.put("montantVersementsAvant70", 80000);
		avContrat.put("montantVersementsApres70", 0);
		avContrat.put("valeurContratActuelle", 100000);
		avContrat.put("clauseBeneficiaire", "STANDARD");

		CompleteResultsCommand cmd = mapper.toCommand(dtoWithAV(avContrat));

		assertThat(cmd.lifeInsurances()).isNotEmpty();
		assertThat(cmd.lifeInsurances().get(0).owner()).isEqualTo("CONJOINT");
	}

	@Test
	@DisplayName("toCommand maps souscripteur MONSIEUR → owner CLIENT on AV contracts")
	void toCommand_mapsSouscripteurMonsieurToClient() {
		Map<String, Object> avContrat = new java.util.HashMap<>();
		avContrat.put("souscripteur", "MONSIEUR");
		avContrat.put("montantVersementsAvant70", 50000);
		avContrat.put("valeurContratActuelle", 70000);
		avContrat.put("clauseBeneficiaire", "STANDARD");

		CompleteResultsCommand cmd = mapper.toCommand(dtoWithAV(avContrat));

		assertThat(cmd.lifeInsurances()).isNotEmpty();
		assertThat(cmd.lifeInsurances().get(0).owner()).isEqualTo("CLIENT");
	}

	@Test
	@DisplayName("toCommand: explicit owner takes precedence over souscripteur")
	void toCommand_ownerTakesPrecedenceOverSouscripteur() {
		Map<String, Object> avContrat = new java.util.HashMap<>();
		avContrat.put("owner", "CLIENT");
		avContrat.put("souscripteur", "MADAME"); // should be ignored
		avContrat.put("montantVersementsAvant70", 50000);
		avContrat.put("valeurContratActuelle", 70000);
		avContrat.put("clauseBeneficiaire", "STANDARD");

		CompleteResultsCommand cmd = mapper.toCommand(dtoWithAV(avContrat));

		assertThat(cmd.lifeInsurances()).isNotEmpty();
		// owner=CLIENT wins over souscripteur=MADAME
		assertThat(cmd.lifeInsurances().get(0).owner()).isEqualTo("CLIENT");
	}

	// ================================================================
	// toInverseCommand: liberality owner swap
	// ================================================================

	@Test
	@DisplayName("toInverseCommand swaps leg and AV owner")
	void toInverseCommand_swapsLegAndAVOwner() {
		PersonCommand client = new PersonCommand("Jean", null, 65, "M");
		PersonCommand spouse = new PersonCommand("Marie", null, 60, "F");

		List<LegCommand> legs = List.of(
				new LegCommand("Ami", BigDecimal.valueOf(20000), "Legs ami", "tiers", "CLIENT")
		);
		List<LifeInsuranceCommand> avs = List.of(
				new LifeInsuranceCommand("Enfant1", "ENFANT",
						BigDecimal.valueOf(80000), BigDecimal.ZERO, BigDecimal.valueOf(100000),
						50, BigDecimal.ONE, "CONJOINT")
		);

		CompleteResultsCommand original = new CompleteResultsCommand(
				"marié", "communauté réduite aux acquêts",
				client, spouse,
				List.of(), null, List.of(), null, List.of(),
				List.of(),
				BigDecimal.valueOf(500000), BigDecimal.ZERO,
				null, null,
				BigDecimal.ZERO, BigDecimal.ZERO,
				false, List.of(), legs, avs, false, true, null);

		CompleteResultsCommand inverse = mapper.toInverseCommand(original);

		// Leg owner CLIENT → CONJOINT
		assertThat(inverse.legs()).hasSize(1);
		assertThat(inverse.legs().get(0).owner()).isEqualTo("CONJOINT");

		// AV owner CONJOINT → CLIENT
		assertThat(inverse.lifeInsurances()).hasSize(1);
		assertThat(inverse.lifeInsurances().get(0).owner()).isEqualTo("CLIENT");
	}
}
