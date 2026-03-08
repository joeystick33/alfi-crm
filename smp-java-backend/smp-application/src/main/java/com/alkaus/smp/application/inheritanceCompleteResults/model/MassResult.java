package com.alkaus.smp.application.inheritanceCompleteResults.model;

import java.math.BigDecimal;

public record MassResult(
		BigDecimal civil,
		BigDecimal reserve,
		BigDecimal availableQuota,
		BigDecimal residenceAllowance,
		BigDecimal residenceBaseBeforeAllowance,
		BigDecimal spouseExemption,
		BigDecimal fiscal
) {}
