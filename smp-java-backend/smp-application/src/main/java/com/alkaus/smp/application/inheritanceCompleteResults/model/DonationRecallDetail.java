package com.alkaus.smp.application.inheritanceCompleteResults.model;

import java.math.BigDecimal;

/**
 * Détail du rapport fiscal d'une donation (art. 784 CGI).
 */
public record DonationRecallDetail(
		String beneficiaryName,
		BigDecimal montant,
		String dateDonation,
		boolean rapportable,
		boolean recalled,
		BigDecimal montantRappele,
		BigDecimal abattementInitial,
		BigDecimal abattementApresRappel
) {}
