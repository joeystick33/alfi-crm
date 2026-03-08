package com.alkaus.smp.application.inheritanceCompleteResults.model;

import java.math.BigDecimal;

/**
 * Détail de la fiscalité assurance-vie par bénéficiaire.
 * Art. 990 I (avant 70 ans) + Art. 757 B (après 70 ans).
 */
public record AvBeneficiaryDetail(
		String beneficiaryName,
		String relationship,
		BigDecimal art990I_capital,
		BigDecimal art990I_allowance,
		BigDecimal art990I_taxable,
		BigDecimal art990I_tax,
		BigDecimal art757B_premiums,
		BigDecimal art757B_allowanceShare,
		BigDecimal art757B_reintegrated,
		boolean exempt
) {}
