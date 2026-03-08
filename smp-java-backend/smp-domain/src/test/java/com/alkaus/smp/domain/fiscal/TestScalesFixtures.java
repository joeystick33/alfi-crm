package com.alkaus.smp.domain.fiscal;

import java.math.BigDecimal;
import java.util.List;

public final class TestScalesFixtures {
	private TestScalesFixtures() {}

    public static List<Slice> ligneDirecte2025() {
        return List.of(
            new Slice(new BigDecimal("8072"),   new BigDecimal("0.05")),
            new Slice(new BigDecimal("12109"),  new BigDecimal("0.10")),
            new Slice(new BigDecimal("15932"),  new BigDecimal("0.15")),
            new Slice(new BigDecimal("552324"), new BigDecimal("0.20")),
            new Slice(new BigDecimal("902838"), new BigDecimal("0.30")),
            new Slice(new BigDecimal("1805677"),new BigDecimal("0.40")),
            new Slice(null,                     new BigDecimal("0.45")) // tranche ouverte
        );
    }
}
