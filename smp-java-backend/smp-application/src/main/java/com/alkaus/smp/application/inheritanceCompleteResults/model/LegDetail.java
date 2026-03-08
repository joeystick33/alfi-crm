package com.alkaus.smp.application.inheritanceCompleteResults.model;

import java.math.BigDecimal;

/**
 * Détail d'un legs particulier et sa fiscalité.
 */
public record LegDetail(
		String legataireName,
		String relationship,
		BigDecimal montant,
		BigDecimal droits
) {}
