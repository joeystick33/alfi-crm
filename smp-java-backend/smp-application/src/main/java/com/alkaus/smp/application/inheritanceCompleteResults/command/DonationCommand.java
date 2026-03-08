package com.alkaus.smp.application.inheritanceCompleteResults.command;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Represents a donation previously made by the deceased,
 * to be recalled fiscally if within 15 years of death (art. 784 CGI).
 */
public record DonationCommand(
		String beneficiaryName,
		String relationship,
		BigDecimal amount,
		LocalDate donationDate,
		boolean rapportable,
		String owner // "CLIENT" | "CONJOINT" | null (null=CLIENT by default)
) {
	/** Backward-compatible constructor (owner defaults to null = CLIENT) */
	public DonationCommand(String beneficiaryName, String relationship,
			BigDecimal amount, LocalDate donationDate, boolean rapportable) {
		this(beneficiaryName, relationship, amount, donationDate, rapportable, null);
	}
}
