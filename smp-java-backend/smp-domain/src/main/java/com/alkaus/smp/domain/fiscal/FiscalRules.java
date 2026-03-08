package com.alkaus.smp.domain.fiscal;

import java.math.BigDecimal;
import java.util.Map;

public record FiscalRules(
		int year,
		Map<RelationshipEnum, Abatement> abatementsByLink,
		Map<RelationshipEnum, Scale> scalesByLink,
		UsufructScales usufructScales,
		BigDecimal abatementsPrincipalResidencePct, // ex: 0.20 (20%) art. 764 bis CGI
		BigDecimal lifeInsuranceBefore70GlobalAbatement, // ex: 152500 art. 990 I CGI
		BigDecimal lifeInsuranceAfter70ReintegrationTreshold, // ex: 30500 art. 757 B CGI
		BigDecimal disabilityAllowance, // ex: 159325 art. 779 II CGI
		int donationRecallYears, // ex: 15 art. 784 CGI
		BigDecimal lifeInsurance990IRate1, // ex: 0.20 (20%) art. 990 I 1er taux
		BigDecimal lifeInsurance990IRate2, // ex: 0.3125 (31,25%) art. 990 I 2nd taux
		BigDecimal lifeInsurance990IThreshold // ex: 700000 seuil entre taux 1 et taux 2
) { }
