package com.alkaus.smp.domain.fiscal;

import java.math.BigDecimal;

public record Abatement(
		BigDecimal amount // ex: 100000 pour ligne directe (exemple) 
){}
