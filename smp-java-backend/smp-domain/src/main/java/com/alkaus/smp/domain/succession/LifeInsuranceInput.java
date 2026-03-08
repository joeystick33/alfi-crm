package com.alkaus.smp.domain.succession;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LifeInsuranceInput(
	String beneficiaryName,					
	BigDecimal bonusesPaid,				// montant total des primes
	BigDecimal deathBenefit,
	LocalDate subscriptionDate,
	Integer lastBonusPaymentDate,		
	Integer ageOfInsuredAtPayment,			// pour distinguer <70 / >=70 (v1: on prendra l'âge au 1er versement)
	BigDecimal allowanceFraction			// fraction de l'abattement 152 500 € applicable (1.0 = PP, NP% = démembrement art. 669 CGI)
) {
	/** Backward-compatible constructor: allowanceFraction defaults to 1.0 (pleine propriété) */
	public LifeInsuranceInput(String beneficiaryName, BigDecimal bonusesPaid, BigDecimal deathBenefit,
			LocalDate subscriptionDate, Integer lastBonusPaymentDate, Integer ageOfInsuredAtPayment) {
		this(beneficiaryName, bonusesPaid, deathBenefit, subscriptionDate, lastBonusPaymentDate,
				ageOfInsuredAtPayment, BigDecimal.ONE);
	}
}
