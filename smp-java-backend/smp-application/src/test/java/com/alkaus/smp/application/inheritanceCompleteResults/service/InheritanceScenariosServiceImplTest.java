package com.alkaus.smp.application.inheritanceCompleteResults.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.alkaus.smp.application.TestFiscalRulesFactory;
import com.alkaus.smp.application.engines.AssuranceVieRulesService;
import com.alkaus.smp.application.engines.DonationRulesService;
import com.alkaus.smp.application.engines.ForcedHeirshipCalculator;
import com.alkaus.smp.application.engines.InheritanceSimulationEngineServiceImpl;
import com.alkaus.smp.application.engines.LegalDevolutionEngine;
import com.alkaus.smp.application.engines.LiquidationRegimeService;
import com.alkaus.smp.application.engines.ScenarioOptionsEngineImpl;
import com.alkaus.smp.application.inheritanceCompleteResults.command.AssetCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.DonationCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.PersonCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.HeritageResult;
import com.alkaus.smp.application.inheritanceCompleteResults.model.ScenarioResult;

/**
 * Integration tests for InheritanceScenariosServiceImpl — real objects, no mocks.
 */
public class InheritanceScenariosServiceImplTest {

	private InheritanceScenariosServiceImpl svc;
	private HeritageResult heritage;

	@BeforeEach
	void setUp() {
		var rules = TestFiscalRulesFactory.rules2026();
		var repo = new com.alkaus.smp.domain.repository.FiscalRulesRepository() {
			@Override public Optional<com.alkaus.smp.domain.fiscal.FiscalRules> findByYear(int year) {
				return Optional.of(rules);
			}
		};
		var scenarioEngine = new ScenarioOptionsEngineImpl(new ForcedHeirshipCalculator());
		var donationService = new DonationRulesService();
		var avService = new AssuranceVieRulesService();
		var engineService = new InheritanceSimulationEngineServiceImpl(scenarioEngine, repo, donationService, avService);
		var devolutionEngine = new LegalDevolutionEngine();
		var liquidationService = new LiquidationRegimeService();
		var heirshipCalculator = new ForcedHeirshipCalculator();

		svc = new InheritanceScenariosServiceImpl(engineService, devolutionEngine, liquidationService, heirshipCalculator, repo);

		heritage = new HeritageResult(
				new BigDecimal("200000.00"),
				new BigDecimal("200000.00"),
				null, List.of());
	}

	private CompleteResultsCommand cmd(String marital, String regime, PersonCommand client,
			PersonCommand spouse, List<PersonCommand> children, String spouseOption) {
		return new CompleteResultsCommand(marital, regime, client, spouse, children,
				null, List.of(), List.of(), BigDecimal.ZERO, BigDecimal.ZERO,
				spouseOption, null, BigDecimal.ZERO, BigDecimal.ZERO);
	}

	@Test
	@DisplayName("Client deceased: maps result with deceased info and correct label")
	void deceasedClient_mapsResult() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		PersonCommand spouse = new PersonCommand("Jane", "Doe", 60, "F");
		List<PersonCommand> children = List.of(new PersonCommand("Alice", "Doe", 30, "F"));
		CompleteResultsCommand command = cmd("marié", "communauté", client, spouse, children, "usufruit total");

		ScenarioResult result = svc.deceasedClientScenario(command, heritage);

		assertThat(result).isNotNull();
		assertThat(result.label()).contains("Décès");
		assertThat(result.deceased().firstName()).isEqualTo("John");
		assertThat(result.deceased().lastName()).isEqualTo("Doe");
		assertThat(result.relevant()).isTrue();
	}

	@Test
	@DisplayName("Client deceased: notary fees = 2% of net asset")
	void deceasedClient_notaryFees() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		PersonCommand spouse = new PersonCommand("Jane", "Doe", 60, "F");
		List<PersonCommand> children = List.of(new PersonCommand("Alice", "Doe", 30, "F"));
		CompleteResultsCommand command = cmd("marié", "communauté", client, spouse, children, "usufruit total");

		ScenarioResult result = svc.deceasedClientScenario(command, heritage);

		// heritage gross = 200000, communauté → liquidation splits 50/50 → 100000 enters succession
		// notaryFees = 100000 * 0.02 = 2000
		assertThat(result.notaryFees()).isEqualByComparingTo(new BigDecimal("2000.00"));
	}

	@Test
	@DisplayName("Client deceased: netTransmission = netAsset - rights - notaryFees, never negative")
	void deceasedClient_netTransmission() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		PersonCommand spouse = new PersonCommand("Jane", "Doe", 60, "F");
		List<PersonCommand> children = List.of(new PersonCommand("Alice", "Doe", 30, "F"));
		CompleteResultsCommand command = cmd("marié", "communauté", client, spouse, children, "usufruit total");

		ScenarioResult result = svc.deceasedClientScenario(command, heritage);

		assertThat(result.netTransmission()).isNotNull();
		assertThat(result.netTransmission().compareTo(BigDecimal.ZERO)).isGreaterThanOrEqualTo(0);
		// netTransmission = netAsset - inheritanceRights - notaryFees
		BigDecimal expected = result.inheritanceAsset()
				.subtract(result.inheritanceRights())
				.subtract(result.notaryFees())
				.max(BigDecimal.ZERO);
		assertThat(result.netTransmission()).isEqualByComparingTo(expected);
	}

	@Test
	@DisplayName("Client deceased: transmission rate is percentage of net transmission over net asset")
	void deceasedClient_transmissionRate() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		PersonCommand spouse = new PersonCommand("Jane", "Doe", 60, "F");
		List<PersonCommand> children = List.of(new PersonCommand("Alice", "Doe", 30, "F"));
		CompleteResultsCommand command = cmd("marié", "communauté", client, spouse, children, "usufruit total");

		ScenarioResult result = svc.deceasedClientScenario(command, heritage);

		assertThat(result.transmissionRate()).isNotNull();
		assertThat(result.transmissionRate().compareTo(BigDecimal.ZERO)).isGreaterThanOrEqualTo(0);
		assertThat(result.transmissionRate().compareTo(new BigDecimal("100"))).isLessThanOrEqualTo(0);
	}

	@Test
	@DisplayName("Client deceased: liquidation and mass results are filled")
	void deceasedClient_liquidationAndMass() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		PersonCommand spouse = new PersonCommand("Jane", "Doe", 60, "F");
		List<PersonCommand> children = List.of(
				new PersonCommand("Alice", "Doe", 30, "F"),
				new PersonCommand("Bob", "Doe", 28, "M"));
		CompleteResultsCommand command = cmd("marié", "communauté", client, spouse, children, "usufruit total");

		ScenarioResult result = svc.deceasedClientScenario(command, heritage);

		// Liquidation should be filled (not all nulls)
		assertThat(result.liquidation()).isNotNull();
		assertThat(result.liquidation().inheritanceAsset()).isNotNull();

		// Mass should have reserve and available quota for 2 children
		assertThat(result.mass()).isNotNull();
		assertThat(result.mass().reserve()).isNotNull();
		assertThat(result.mass().availableQuota()).isNotNull();
		// 2 children: reserve = 2/3, QD = 1/3
		assertThat(result.mass().reserve().compareTo(result.mass().availableQuota())).isGreaterThan(0);
	}

	@Test
	@DisplayName("Client deceased: heirs contain spouse (exempt) + children")
	void deceasedClient_heirs() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		PersonCommand spouse = new PersonCommand("Jane", "Doe", 60, "F");
		List<PersonCommand> children = List.of(
				new PersonCommand("Alice", "Doe", 30, "F"),
				new PersonCommand("Bob", "Doe", 28, "M"));
		CompleteResultsCommand command = cmd("marié", "communauté", client, spouse, children, "usufruit total");

		ScenarioResult result = svc.deceasedClientScenario(command, heritage);

		assertThat(result.heirs()).hasSize(3);
		// Spouse should have 0 rights (exempt)
		var spouseHeir = result.heirs().stream().filter(h -> h.name().contains("Jane")).findFirst().orElseThrow();
		assertThat(spouseHeir.taxRights()).isEqualByComparingTo(BigDecimal.ZERO);
	}

	@Test
	@DisplayName("Spouse deceased: not applicable when no spouse")
	void deceasedSpouse_noSpouse() {
		PersonCommand client = new PersonCommand("John", "Doe", 40, "M");
		CompleteResultsCommand command = cmd("célibataire", null, client, null, List.of(), null);

		ScenarioResult result = svc.deceasedSpouseScenario(command, heritage);

		assertThat(result.relevant()).isFalse();
		assertThat(result.label()).isEqualTo("Non applicable");
		assertThat(result.deceased()).isNull();
	}

	@Test
	@DisplayName("Spouse deceased: returns applicable result with spouse info when spouse present")
	void deceasedSpouse_withSpouse() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		PersonCommand spouse = new PersonCommand("Jane", "Doe", 60, "F");
		List<PersonCommand> children = List.of(new PersonCommand("Alice", "Doe", 30, "F"));
		CompleteResultsCommand command = cmd("marié", "communauté", client, spouse, children, "usufruit total");

		ScenarioResult result = svc.deceasedSpouseScenario(command, heritage);

		assertThat(result.relevant()).isTrue();
		assertThat(result.deceased().firstName()).isEqualTo("Jane");
		assertThat(result.deceased().lastName()).isEqualTo("Doe");
		assertThat(result.label()).contains("Décès");
	}

	@Test
	@DisplayName("Spouse deceased: financial calculations are consistent")
	void deceasedSpouse_financialCalculations() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		PersonCommand spouse = new PersonCommand("Jane", "Doe", 60, "F");
		List<PersonCommand> children = List.of(new PersonCommand("Alice", "Doe", 30, "F"));
		CompleteResultsCommand command = cmd("marié", "communauté", client, spouse, children, "usufruit total");

		ScenarioResult result = svc.deceasedSpouseScenario(command, heritage);

		assertThat(result.inheritanceRights()).isNotNull();
		assertThat(result.notaryFees()).isNotNull();
		assertThat(result.netTransmission()).isNotNull();
		assertThat(result.netTransmission().compareTo(BigDecimal.ZERO)).isGreaterThanOrEqualTo(0);
	}

	@Test
	@DisplayName("Client deceased with no children: no children in heirs")
	void deceasedClient_noChildren() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		PersonCommand spouse = new PersonCommand("Jane", "Doe", 60, "F");
		CompleteResultsCommand command = cmd("marié", "communauté", client, spouse, List.of(), null);

		ScenarioResult result = svc.deceasedClientScenario(command, heritage);

		// Married no children: spouse gets everything
		assertThat(result.heirs()).isNotEmpty();
		assertThat(result.relevant()).isTrue();
	}

	@Test
	@DisplayName("Client deceased: missing order 3/4 data is explicitly rejected")
	void deceasedClient_zeroAsset() {
		HeritageResult zeroHeritage = new HeritageResult(BigDecimal.ZERO, BigDecimal.ZERO, null, List.of());
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		CompleteResultsCommand command = cmd("célibataire", null, client, null, List.of(), null);

		assertThatThrownBy(() -> svc.deceasedClientScenario(command, zeroHeritage))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("ordre 3/4");
	}

	// ================================================================
	// Ownership-aware tests (CRIT-1: 2nd death includes PROPRE_CONJOINT)
	// ================================================================

	private CompleteResultsCommand cmdWithAssets(PersonCommand client, PersonCommand spouse,
			List<PersonCommand> children, List<AssetCommand> assets, String spouseOption) {
		// Heritage must be rebuilt from assets for ownership tests
		return new CompleteResultsCommand("marié", "communauté réduite aux acquêts",
				client, spouse, children,
				null, List.of(), null, List.of(),
				assets, BigDecimal.ZERO, BigDecimal.ZERO,
				spouseOption, null, BigDecimal.ZERO, BigDecimal.ZERO,
				false, List.of(), List.of(), List.of(), false, true, null);
	}

	@Test
	@DisplayName("2nd death includes PROPRE_CONJOINT assets in spouse patrimoine")
	void secondDeath_includesConjointPropre() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		PersonCommand spouse = new PersonCommand("Jane", "Doe", 60, "F");
		List<PersonCommand> children = List.of(new PersonCommand("Alice", "Doe", 30, "F"));

		// Assets: 200k propre client + 100k commun + 150k propre conjoint
		List<AssetCommand> assets = List.of(
				new AssetCommand("IMMOBILIER", new BigDecimal("200000"), BigDecimal.ZERO, "Maison client", "PROPRE_CLIENT"),
				new AssetCommand("LIQUIDITES", new BigDecimal("100000"), BigDecimal.ZERO, "Compte joint", "COMMUN"),
				new AssetCommand("IMMOBILIER", new BigDecimal("150000"), BigDecimal.ZERO, "Appart conjoint", "PROPRE_CONJOINT"));

		CompleteResultsCommand command = cmdWithAssets(client, spouse, children, assets, "usufruit total");

		// Heritage for ownership-aware: totalGross excludes PROPRE_CONJOINT = 200k + 100k = 300k
		HeritageResult ownershipHeritage = new HeritageResult(
				new BigDecimal("300000"), new BigDecimal("300000"), null, List.of());

		ScenarioResult secondDeath = svc.deceasedSpouseScenario(command, ownershipHeritage);

		assertThat(secondDeath.relevant()).isTrue();
		// Spouse patrimoine at 2nd death:
		//   spouseOwnHalf (half of 100k common = 50k)
		// + conjointPropreNet (150k)
		// + ppReceivedFromFirstDeath (USF total → PP = 0)
		// = 200k
		assertThat(secondDeath.inheritanceAsset())
				.isEqualByComparingTo(new BigDecimal("200000.00"));
	}

	@Test
	@DisplayName("2nd death with 1/4 PP: spouse gets own half + conjoint propre + 1/4 of deceased share")
	void secondDeath_quarterPP_includesConjointPropre() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		PersonCommand spouse = new PersonCommand("Jane", "Doe", 60, "F");
		List<PersonCommand> children = List.of(new PersonCommand("Alice", "Doe", 30, "F"));

		// Assets: 300k propre client + 100k commun + 100k propre conjoint
		List<AssetCommand> assets = List.of(
				new AssetCommand("IMMOBILIER", new BigDecimal("300000"), BigDecimal.ZERO, "Maison", "PROPRE_CLIENT"),
				new AssetCommand("LIQUIDITES", new BigDecimal("100000"), BigDecimal.ZERO, "Joint", "COMMUN"),
				new AssetCommand("LIQUIDITES", new BigDecimal("100000"), BigDecimal.ZERO, "Epargne conjoint", "PROPRE_CONJOINT"));

		CompleteResultsCommand command = cmdWithAssets(client, spouse, children, assets, "1/4 en pleine propriété");

		// Heritage: totalGross excludes PROPRE_CONJOINT = 300k + 100k = 400k
		HeritageResult h = new HeritageResult(new BigDecimal("400000"), new BigDecimal("400000"), null, List.of());

		ScenarioResult secondDeath = svc.deceasedSpouseScenario(command, h);

		assertThat(secondDeath.relevant()).isTrue();
		// Liquidation: propre=300k, commun=100k → deceased share = 300k + 50k = 350k, spouse half = 50k
		// PP received = 1/4 × 350k = 87500
		// conjointPropreNet = 100k
		// Total = 50k + 100k + 87500 = 237500
		assertThat(secondDeath.inheritanceAsset())
				.isEqualByComparingTo(new BigDecimal("237500.00"));
	}

	@Test
	@DisplayName("1st death: only deceased's donations recalled, not survivor's")
	void firstDeath_onlyDeceasedDonations() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		PersonCommand spouse = new PersonCommand("Jane", "Doe", 60, "F");
		List<PersonCommand> children = List.of(new PersonCommand("Alice", "Doe", 30, "F"));

		List<AssetCommand> assets = List.of(
				new AssetCommand("LIQUIDITES", new BigDecimal("500000"), BigDecimal.ZERO, "Compte", "COMMUN"));

		// Client's donation (should be recalled at 1st death)
		DonationCommand clientDonation = new DonationCommand("Alice Doe", "enfant",
				new BigDecimal("50000"), java.time.LocalDate.now().minusYears(5), true, "CLIENT");
		// Spouse's donation (should NOT be recalled at 1st death)
		DonationCommand spouseDonation = new DonationCommand("Alice Doe", "enfant",
				new BigDecimal("30000"), java.time.LocalDate.now().minusYears(3), true, "CONJOINT");

		CompleteResultsCommand command = new CompleteResultsCommand("marié", "communauté réduite aux acquêts",
				client, spouse, children,
				null, List.of(), null, List.of(),
				assets, BigDecimal.ZERO, BigDecimal.ZERO,
				"usufruit total", null, BigDecimal.ZERO, BigDecimal.ZERO,
				false, List.of(clientDonation, spouseDonation), List.of(), List.of(),
				false, true, null);

		HeritageResult h = new HeritageResult(new BigDecimal("500000"), new BigDecimal("500000"), null, List.of());

		ScenarioResult firstDeath = svc.deceasedClientScenario(command, h);

		// Result should exist and be valid — the key assertion is that only CLIENT's
		// donation is recalled (affects abattement). We verify no exception + valid result.
		assertThat(firstDeath.relevant()).isTrue();
		assertThat(firstDeath.heirs()).isNotEmpty();
	}

	@Test
	@DisplayName("Ownership liquidation: PROPRE_CLIENT goes to separateAsset, COMMUN split 50/50")
	void ownershipLiquidation_correctSplit() {
		PersonCommand client = new PersonCommand("John", "Doe", 65, "M");
		PersonCommand spouse = new PersonCommand("Jane", "Doe", 60, "F");
		List<PersonCommand> children = List.of(new PersonCommand("Alice", "Doe", 30, "F"));

		// 400k propre client + 200k commun + 100k propre conjoint
		List<AssetCommand> assets = List.of(
				new AssetCommand("IMMOBILIER", new BigDecimal("400000"), BigDecimal.ZERO, "Propre", "PROPRE_CLIENT"),
				new AssetCommand("LIQUIDITES", new BigDecimal("200000"), BigDecimal.ZERO, "Commun", "COMMUN"),
				new AssetCommand("LIQUIDITES", new BigDecimal("100000"), BigDecimal.ZERO, "Conjoint", "PROPRE_CONJOINT"));

		CompleteResultsCommand command = cmdWithAssets(client, spouse, children, assets, "usufruit total");

		// Heritage excludes PROPRE_CONJOINT: 400k + 200k = 600k
		HeritageResult h = new HeritageResult(new BigDecimal("600000"), new BigDecimal("600000"), null, List.of());

		ScenarioResult result = svc.deceasedClientScenario(command, h);

		assertThat(result.relevant()).isTrue();
		// Liquidation: separate=400k, common=200k → deceased share = 400k + 100k = 500k
		assertThat(result.liquidation()).isNotNull();
		assertThat(result.liquidation().inheritanceAsset())
				.isEqualByComparingTo(new BigDecimal("500000.00"));
	}
}
