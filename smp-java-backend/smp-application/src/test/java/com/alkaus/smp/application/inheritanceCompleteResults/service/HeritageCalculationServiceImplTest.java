package com.alkaus.smp.application.inheritanceCompleteResults.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.alkaus.smp.application.inheritanceCompleteResults.command.AssetCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.CompleteResultsCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.command.PersonCommand;
import com.alkaus.smp.application.inheritanceCompleteResults.model.HeritageResult;

public class HeritageCalculationServiceImplTest {

	private final HeritageCalculationServiceImpl svc = new HeritageCalculationServiceImpl();
	private final PersonCommand client = new PersonCommand("John", "Doe", 40, "M");

	@Test
	@DisplayName("calculate(): totalGross = sum of all asset values")
	void totalGross_sumOfValues() {
		List<AssetCommand> assets = List.of(
				new AssetCommand("IMMOBILIER", new BigDecimal("100000"), new BigDecimal("0"), "House"),
				new AssetCommand("FINANCIER", new BigDecimal("50000"), new BigDecimal("0"), "Account"),
				new AssetCommand("AUTRE", new BigDecimal("10000"), new BigDecimal("0"), "Other")
		);

		CompleteResultsCommand cmd = new CompleteResultsCommand(
				"marié", "communauté",
				client, null,
				List.of(), null, List.of(),
				assets, // totalNetWorth=0 -> recalcul
				new BigDecimal("0"), // forces recalculation
				BigDecimal.ZERO, null, null, BigDecimal.ZERO, BigDecimal.ZERO
		);

		HeritageResult res = svc.calculate(cmd);

		assertThat(res.totalGross()).isEqualByComparingTo(new BigDecimal("160000.00"));
	}

	@Test
	@DisplayName("calculate(): totalNet = sum of (value - debt per asset) - totalDebts (recalcul mode)")
	void totalNet_recalcul_withDebts() {
		List<AssetCommand> assets = List.of(
				new AssetCommand("IMMOBILIER", new BigDecimal("100000"), new BigDecimal("20000"), "House"),
				new AssetCommand("FINANCIER", new BigDecimal("50000"), new BigDecimal("5000"), "Account"),
				new AssetCommand("PROFESSIONNEL", new BigDecimal("30000"), new BigDecimal("3000"), "Enterprise")
		);

		CompleteResultsCommand cmd = new CompleteResultsCommand(
				"marié", "communauté",
				client, null,
				List.of(), null, List.of(),
				assets,
				BigDecimal.ZERO, // recalculation mode
				new BigDecimal("10000"), // totalDebts globally
				null, null, BigDecimal.ZERO, BigDecimal.ZERO
		);

		HeritageResult res = svc.calculate(cmd);

		// totalGross = 100000 + 50000 + 30000 = 180000
		// netAssets = (100000-20000) + (50000-5000) + (30000-3000) = 80000 + 45000 + 27000
		// = 152000
		// totalNet = 152000 - 10000 = 142000
		assertThat(res.totalGross()).isEqualByComparingTo(new BigDecimal("180000.00"));
		assertThat(res.totalNet()).isEqualByComparingTo(new BigDecimal("142000.00"));
	}

	@Test
	@DisplayName("calculate(): totalNet = patrimoineNetFourni - totalDebts (no recalculation)")
	void totalNet_noRecalcul_withProvidedPatrimoine() {
		List<AssetCommand> assets = List.of(
				new AssetCommand("IMMOBILIER", new BigDecimal("100000"), new BigDecimal("10000"), "House")
		);

		BigDecimal providedPatrimoine = new BigDecimal("95000");
		BigDecimal totalDebts = new BigDecimal("5000");

		CompleteResultsCommand cmd = new CompleteResultsCommand(
				"marié", "communauté",
				client, null,
				List.of(), null, List.of(),
				assets,
				providedPatrimoine, // > 0 -> no recalculation
				totalDebts,
				null, null, BigDecimal.ZERO, BigDecimal.ZERO
		);

		HeritageResult res = svc.calculate(cmd);

		// totalGross = 100000
		// totalNet = 95000 (provided) - 5000 = 90000
		assertThat(res.totalGross()).isEqualByComparingTo(new BigDecimal("100000.00"));
		assertThat(res.totalNet()).isEqualByComparingTo(new BigDecimal("90000.00"));
	}

	@Test
	@DisplayName("calculate(): repartition percentages correct when totalNet > 0")
	void repartition_percentages_whenTotalNetPositive() {
		List<AssetCommand> assets = List.of(
				new AssetCommand("IMMOBILIER", new BigDecimal("100000"), BigDecimal.ZERO, "House"),
				new AssetCommand("FINANCIER", new BigDecimal("50000"), BigDecimal.ZERO, "Account"),
				new AssetCommand("PROFESSIONNEL", new BigDecimal("50000"), BigDecimal.ZERO, "Fonds")
		);

		CompleteResultsCommand cmd = new CompleteResultsCommand(
				"marié", "communauté",
				client, null,
				List.of(), null, List.of(),
				assets,
				BigDecimal.ZERO, // recalculation
				BigDecimal.ZERO, null, null, BigDecimal.ZERO, BigDecimal.ZERO
		);

		HeritageResult res = svc.calculate(cmd);

		// totalGross = 200000
		// netAssets = 200000
		// totalNet = 200000
		// immobilier = 100000 -> 50%
		// financier = 50000 -> 25%
		// professionnel = 50000 -> 25%

		assertThat(res.repartition().realEstate().total()).isEqualByComparingTo(new BigDecimal("100000.00"));
		assertThat(res.repartition().realEstate().percentage()).isEqualByComparingTo(new BigDecimal("50.00"));

		assertThat(res.repartition().financial().total()).isEqualByComparingTo(new BigDecimal("50000.00"));
		assertThat(res.repartition().financial().percentage()).isEqualByComparingTo(new BigDecimal("25.00"));

		assertThat(res.repartition().professional().total()).isEqualByComparingTo(new BigDecimal("50000.00"));
		assertThat(res.repartition().professional().percentage()).isEqualByComparingTo(new BigDecimal("25.00"));
	}

	@Test
	@DisplayName("calculate(): repartition percentages = 0 when totalNet <= 0")
	void repartition_percentages_zero_whenTotalNetNegative() {
		List<AssetCommand> assets = List.of(
				new AssetCommand("IMMOBILIER", new BigDecimal("50000"), new BigDecimal("60000"), "House")
		);

		CompleteResultsCommand cmd = new CompleteResultsCommand(
				"marié", "communauté",
				client, null,
				List.of(), null, List.of(),
				assets,
				BigDecimal.ZERO, // recalc -> netAssets = -10000
				BigDecimal.ZERO, null, null, BigDecimal.ZERO, BigDecimal.ZERO
		);

		HeritageResult res = svc.calculate(cmd);

		// totalNet = -10000
		// All percentages should be 0 (no positive net)
		assertThat(res.repartition().realEstate().percentage()).isEqualByComparingTo(BigDecimal.ZERO);
		assertThat(res.repartition().financial().percentage()).isEqualByComparingTo(BigDecimal.ZERO);
		assertThat(res.repartition().professional().percentage()).isEqualByComparingTo(BigDecimal.ZERO);
	}

	@Test
	@DisplayName("calculate(): assetDetails contains correct netValue per asset")
	void assetDetails_netValue_correct() {
		List<AssetCommand> assets = List.of(
				new AssetCommand("IMMOBILIER", new BigDecimal("100000"), new BigDecimal("20000"), "House"),
				new AssetCommand("FINANCIER", new BigDecimal("50000"), new BigDecimal("5000"), "PEA")
		);

		CompleteResultsCommand cmd = new CompleteResultsCommand(
				"marié", "communauté",
				client, null,
				List.of(), null, List.of(),
				assets,
				BigDecimal.ZERO, BigDecimal.ZERO, null, null, BigDecimal.ZERO, BigDecimal.ZERO
		);

		HeritageResult res = svc.calculate(cmd);

		assertThat(res.assets()).hasSize(2);

		// First asset: 100000 - 20000 = 80000
		assertThat(res.assets().get(0).value()).isEqualByComparingTo(new BigDecimal("100000"));
		assertThat(res.assets().get(0).debt()).isEqualByComparingTo(new BigDecimal("20000"));
		assertThat(res.assets().get(0).netValue()).isEqualByComparingTo(new BigDecimal("80000"));

		// Second asset: 50000 - 5000 = 45000
		assertThat(res.assets().get(1).value()).isEqualByComparingTo(new BigDecimal("50000"));
		assertThat(res.assets().get(1).debt()).isEqualByComparingTo(new BigDecimal("5000"));
		assertThat(res.assets().get(1).netValue()).isEqualByComparingTo(new BigDecimal("45000"));
	}

	@Test
	@DisplayName("calculate(): assetDetails designation correct per type")
	void assetDetails_designation_byType() {
		List<AssetCommand> assets = List.of(
				new AssetCommand("IMMOBILIER", new BigDecimal("100000"), BigDecimal.ZERO, "House"),
				new AssetCommand("MAISON", new BigDecimal("80000"), BigDecimal.ZERO, "My House"),
				new AssetCommand("APPART", new BigDecimal("50000"), BigDecimal.ZERO, "Flat"),
				new AssetCommand("FINANCIER", new BigDecimal("30000"), BigDecimal.ZERO, "Account"),
				new AssetCommand("PEA", new BigDecimal("20000"), BigDecimal.ZERO, "PEA"),
				new AssetCommand("PROFESSIONNEL", new BigDecimal("50000"), BigDecimal.ZERO, "Enterprise"),
				new AssetCommand("FONDS", new BigDecimal("10000"), BigDecimal.ZERO, "Fund"),
				new AssetCommand("UNKNOWN", new BigDecimal("5000"), BigDecimal.ZERO, "Unknown Type"),
				new AssetCommand(null, new BigDecimal("1000"), BigDecimal.ZERO, "Type Null")
		);

		CompleteResultsCommand cmd = new CompleteResultsCommand(
				"marié", "communauté",
				client, null,
				List.of(), null, List.of(),
				assets,
				BigDecimal.ZERO, BigDecimal.ZERO, null, null, BigDecimal.ZERO, BigDecimal.ZERO
		);

		HeritageResult res = svc.calculate(cmd);

		assertThat(res.assets()).hasSize(9);
		assertThat(res.assets().get(0).designation()).isEqualTo("Immobilier");
		assertThat(res.assets().get(1).designation()).isEqualTo("Immobilier");
		assertThat(res.assets().get(2).designation()).isEqualTo("Immobilier");
		assertThat(res.assets().get(3).designation()).isEqualTo("Financier");
		assertThat(res.assets().get(4).designation()).isEqualTo("Financier");
		assertThat(res.assets().get(5).designation()).isEqualTo("Professionnel");
		assertThat(res.assets().get(6).designation()).isEqualTo("Professionnel");
		assertThat(res.assets().get(7).designation()).isEqualTo("Autre");
		assertThat(res.assets().get(8).designation()).isEqualTo("Autre");
	}

	@Test
	@DisplayName("calculate(): empty assets list -> no repartition, totalGross=0")
	void emptyAssets_zeroTotals() {
		CompleteResultsCommand cmd = new CompleteResultsCommand(
				"marié", "communauté",
				client, null,
				List.of(), null, List.of(),
				List.of(),
				BigDecimal.ZERO, BigDecimal.ZERO, null, null, BigDecimal.ZERO, BigDecimal.ZERO
		);

		HeritageResult res = svc.calculate(cmd);

		assertThat(res.totalGross()).isEqualByComparingTo(BigDecimal.ZERO);
		assertThat(res.totalNet()).isEqualByComparingTo(BigDecimal.ZERO);
		assertThat(res.assets()).isEmpty();
		assertThat(res.repartition().realEstate().total()).isEqualByComparingTo(BigDecimal.ZERO);
		assertThat(res.repartition().financial().total()).isEqualByComparingTo(BigDecimal.ZERO);
		assertThat(res.repartition().professional().total()).isEqualByComparingTo(BigDecimal.ZERO);
	}

	@Test
	@DisplayName("calculate(): null assets -> same as empty list")
	void nullAssets_sameAsEmpty() {
		CompleteResultsCommand cmd = new CompleteResultsCommand(
				"marié", "communauté",
				client, null,
				List.of(), null, List.of(),
				null, // null assets
				BigDecimal.ZERO, BigDecimal.ZERO, null, null, BigDecimal.ZERO, BigDecimal.ZERO
		);

		HeritageResult res = svc.calculate(cmd);

		assertThat(res.totalGross()).isEqualByComparingTo(BigDecimal.ZERO);
		assertThat(res.assets()).isEmpty();
	}

	@Test
	@DisplayName("calculate(): rounding HALF_UP to 2 decimals")
	void rounding_halfUp_twoDecimals() {
		List<AssetCommand> assets = List.of(
				new AssetCommand("IMMOBILIER", new BigDecimal("333333.335"), new BigDecimal("0"), "House")
		);

		CompleteResultsCommand cmd = new CompleteResultsCommand(
				"marié", "communauté",
				client, null,
				List.of(), null, List.of(),
				assets,
				BigDecimal.ZERO, BigDecimal.ZERO, null, null, BigDecimal.ZERO, BigDecimal.ZERO
		);

		HeritageResult res = svc.calculate(cmd);

		// 333333.335 rounded HALF_UP to 2 decimals = 333333.34
		assertThat(res.totalGross()).isEqualByComparingTo(new BigDecimal("333333.34"));
	}

	@Test
	@DisplayName("calculate(): percentage calculation with 3 decimals rounds to 2 (HALF_UP)")
	void percentage_rounding() {
		List<AssetCommand> assets = List.of(
				new AssetCommand("IMMOBILIER", new BigDecimal("100000"), BigDecimal.ZERO, "House"),
				new AssetCommand("FINANCIER", new BigDecimal("666.67"), BigDecimal.ZERO, "Account")
		);

		CompleteResultsCommand cmd = new CompleteResultsCommand(
				"marié", "communauté",
				client, null,
				List.of(), null, List.of(),
				assets,
				BigDecimal.ZERO, BigDecimal.ZERO, null, null, BigDecimal.ZERO, BigDecimal.ZERO
		);

		HeritageResult res = svc.calculate(cmd);

		// totalNet = 100666.67
		// immobilier: 100000 / 100666.67 * 100 = 99.33783... -> rounded to 99.34
		// financier: 666.67 / 100666.67 * 100 = 0.66216... -> rounded to 0.66
		assertThat(res.repartition().realEstate().percentage()).isEqualByComparingTo(new BigDecimal("99.34"));
		assertThat(res.repartition().financial().percentage()).isEqualByComparingTo(new BigDecimal("0.66"));
	}
}
