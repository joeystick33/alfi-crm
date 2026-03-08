package com.alkaus.smp.application.engines;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.alkaus.smp.application.inheritanceCompleteResults.model.LiquidationResult;

class LiquidationRegimeServiceTest {

	private LiquidationRegimeService svc;

	@BeforeEach
	void setUp() {
		svc = new LiquidationRegimeService();
	}

	@Test
	@DisplayName("Communauté réduite aux acquêts: propres 100k + communs 400k => deceased share = 100k + 200k = 300k")
	void communityProperty_withDetail() {
		LiquidationResult r = svc.liquidate("communauté réduite aux acquêts",
				new BigDecimal("500000"), BigDecimal.ZERO,
				new BigDecimal("100000"), new BigDecimal("400000"));

		assertThat(r.deceasedSeparateAsset()).isEqualByComparingTo(new BigDecimal("100000.00"));
		assertThat(r.commonAsset()).isEqualByComparingTo(new BigDecimal("400000.00"));
		assertThat(r.deceasedShare()).isEqualByComparingTo(new BigDecimal("300000.00"));
		assertThat(r.spouseShare()).isEqualByComparingTo(new BigDecimal("200000.00"));
		assertThat(r.inheritanceAsset()).isEqualByComparingTo(new BigDecimal("300000.00"));
	}

	@Test
	@DisplayName("Communauté réduite: no detail => all common, deceased gets 50%")
	void communityProperty_noDetail() {
		LiquidationResult r = svc.liquidate("communauté", new BigDecimal("600000"), BigDecimal.ZERO, null, null);

		assertThat(r.deceasedShare()).isEqualByComparingTo(new BigDecimal("300000.00"));
		assertThat(r.spouseShare()).isEqualByComparingTo(new BigDecimal("300000.00"));
		assertThat(r.inheritanceAsset()).isEqualByComparingTo(new BigDecimal("300000.00"));
	}

	@Test
	@DisplayName("Communauté universelle sans clause: each 50%")
	void universalCommunity() {
		LiquidationResult r = svc.liquidate("communauté universelle",
				new BigDecimal("800000"), BigDecimal.ZERO, null, null);

		assertThat(r.deceasedShare()).isEqualByComparingTo(new BigDecimal("400000.00"));
		assertThat(r.spouseShare()).isEqualByComparingTo(new BigDecimal("400000.00"));
	}

	@Test
	@DisplayName("Communauté universelle avec clause: nothing in succession")
	void universalCommunityWithClause() {
		LiquidationResult r = svc.liquidate("communauté universelle avec clause d'attribution intégrale",
				new BigDecimal("1000000"), BigDecimal.ZERO, null, null);

		assertThat(r.deceasedShare()).isEqualByComparingTo(BigDecimal.ZERO);
		assertThat(r.spouseShare()).isEqualByComparingTo(new BigDecimal("1000000.00"));
		assertThat(r.inheritanceAsset()).isEqualByComparingTo(BigDecimal.ZERO);
	}

	@Test
	@DisplayName("Séparation de biens: only deceased's own assets enter succession")
	void separateProperty() {
		LiquidationResult r = svc.liquidate("séparation de biens",
				new BigDecimal("500000"), BigDecimal.ZERO,
				new BigDecimal("300000"), null);

		assertThat(r.deceasedShare()).isEqualByComparingTo(new BigDecimal("300000.00"));
		assertThat(r.spouseShare()).isEqualByComparingTo(new BigDecimal("200000.00"));
		assertThat(r.inheritanceAsset()).isEqualByComparingTo(new BigDecimal("300000.00"));
	}

	@Test
	@DisplayName("Séparation de biens: no detail => fallback all to deceased")
	void separateProperty_noDetail() {
		LiquidationResult r = svc.liquidate("separation de biens",
				new BigDecimal("400000"), BigDecimal.ZERO, null, null);

		assertThat(r.inheritanceAsset()).isEqualByComparingTo(new BigDecimal("400000.00"));
	}

	@Test
	@DisplayName("Null regime: full net enters succession")
	void nullRegime() {
		LiquidationResult r = svc.liquidate(null, new BigDecimal("500000"), new BigDecimal("100000"), null, null);

		assertThat(r.inheritanceAsset()).isEqualByComparingTo(new BigDecimal("400000.00"));
	}

	@Test
	@DisplayName("Passif reduces net total")
	void withPassif() {
		LiquidationResult r = svc.liquidate("communauté",
				new BigDecimal("600000"), new BigDecimal("200000"), null, null);

		// net = 400000, each spouse 200000
		assertThat(r.deceasedShare()).isEqualByComparingTo(new BigDecimal("200000.00"));
		assertThat(r.inheritanceAsset()).isEqualByComparingTo(new BigDecimal("200000.00"));
	}
}
