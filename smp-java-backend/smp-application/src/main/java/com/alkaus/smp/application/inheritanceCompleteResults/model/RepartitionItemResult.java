package com.alkaus.smp.application.inheritanceCompleteResults.model;

import java.math.BigDecimal;

public record RepartitionItemResult(
		BigDecimal total,
		BigDecimal percentage
) {}
