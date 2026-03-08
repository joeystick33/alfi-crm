package com.alkaus.smp.domain.succession;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.alkaus.smp.domain.fiscal.RelationshipEnum;

public record DonationInput(
	String beneficiaryName,			// doit matcher un héritier par nom
	RelationshipEnum relationship,
	BigDecimal montant, 
	LocalDate dateDonation,
	boolean rapportable				// true = rapport civil + rappel fiscal
) {}