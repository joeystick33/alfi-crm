package com.alkaus.smp.domain.fiscal;

import java.math.BigDecimal;

public record Slice(
		BigDecimal upperLimitInc,  // ex: 8072.00 (null = pas de plafond pour la dernière tranche
		BigDecimal rate				 // ex: 0.05 pour 5%
) { }
