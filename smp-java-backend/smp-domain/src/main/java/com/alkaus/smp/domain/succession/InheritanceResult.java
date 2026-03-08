package com.alkaus.smp.domain.succession;

import java.math.BigDecimal;
import java.util.List;

import com.alkaus.smp.domain.succession.util.ScenarioTypeEnum;

public record InheritanceResult(
		ScenarioTypeEnum scenarioTypeEnum,
		BigDecimal netAsset,
		BigDecimal fiscalInheritanceAsset,
		BigDecimal totalRights,
		List<HeirResult> heirs
){}
