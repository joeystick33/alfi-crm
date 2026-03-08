package com.alkaus.smp.application.engines;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import com.alkaus.smp.domain.fiscal.RelationshipEnum;
import com.alkaus.smp.domain.succession.DonationInput;

/**
 * Donation fiscal recall rules service.
 * Donations made within 15 years of death are recalled into the taxable base.
 * The allowance consumed by recalled donations reduces the allowance available at succession.
 */
@Service
public class DonationRulesService {

	public static final int DEFAULT_RECALL_YEARS = 15;

	/**
	 * Computes the remaining allowance for an heir after consuming recalled donations (< 15 years).
	 *
	 * @param heirName         the heir name
	 * @param link             the relationship (used only for clarity, allowance comes from caller)
	 * @param initialAllowance the full allowance for this relationship
	 * @param donations        all donations
	 * @param dateOfDeath      date of death (reference for the 15-year window)
	 * @return remaining allowance after recalled donations
	 */
	public BigDecimal remainingAllowance(String heirName, RelationshipEnum link, BigDecimal initialAllowance,
			List<DonationInput> donations, LocalDate dateOfDeath) {
		return remainingAllowance(heirName, link, initialAllowance, donations, dateOfDeath, DEFAULT_RECALL_YEARS);
	}

	public BigDecimal remainingAllowance(String heirName, RelationshipEnum link, BigDecimal initialAllowance,
			List<DonationInput> donations, LocalDate dateOfDeath, int recallYears) {

		if (initialAllowance == null) {
			initialAllowance = BigDecimal.ZERO;
		}
		if (CollectionUtils.isEmpty(donations)) {
			return initialAllowance;
		}

		BigDecimal consumed = recalledDonationsTotal(heirName, donations, dateOfDeath, recallYears);
		return initialAllowance.subtract(consumed).max(BigDecimal.ZERO);
	}

	/**
	 * Returns the total amount of recalled donations (within 15 years) for a given heir.
	 * This amount must be added to the taxable base for progressive scale calculation.
	 */
	public BigDecimal recalledDonationsTotal(String heirName, List<DonationInput> donations, LocalDate dateOfDeath) {
		return recalledDonationsTotal(heirName, donations, dateOfDeath, DEFAULT_RECALL_YEARS);
	}

	public BigDecimal recalledDonationsTotal(String heirName, List<DonationInput> donations, LocalDate dateOfDeath, int recallYears) {
		if (CollectionUtils.isEmpty(donations)) {
			return BigDecimal.ZERO;
		}

		final LocalDate reference = dateOfDeath != null ? dateOfDeath : LocalDate.now();
		final LocalDate lowerBound = reference.minusYears(recallYears);

		return donations.stream()
				.filter(d -> heirName.equals(d.beneficiaryName()))
				.filter(DonationInput::rapportable)
				.filter(d -> d.dateDonation() != null && !d.dateDonation().isBefore(lowerBound))
				.map(DonationInput::montant)
				.reduce(BigDecimal.ZERO, BigDecimal::add);
	}
}
