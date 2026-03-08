package com.alkaus.smp.application.engines;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.alkaus.smp.domain.fiscal.RelationshipEnum;
import com.alkaus.smp.domain.succession.DonationInput;

class DonationRulesServiceTest {

	private final DonationRulesService svc = new DonationRulesService();

	// --- remainingAllowance ---

	@Test
	@DisplayName("No donations => full allowance returned")
	void remainingAllowance_noDonations() {
		BigDecimal result = svc.remainingAllowance("Child1", RelationshipEnum.DIRECT_LINE,
				new BigDecimal("100000"), List.of(), LocalDate.of(2026, 1, 1));
		assertThat(result).isEqualByComparingTo(new BigDecimal("100000"));
	}

	@Test
	@DisplayName("Donation within 15 years consumes allowance")
	void remainingAllowance_donationWithin15Years() {
		List<DonationInput> donations = List.of(
				new DonationInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("60000"),
						LocalDate.of(2020, 6, 1), true));
		BigDecimal result = svc.remainingAllowance("Child1", RelationshipEnum.DIRECT_LINE,
				new BigDecimal("100000"), donations, LocalDate.of(2026, 1, 1));
		assertThat(result).isEqualByComparingTo(new BigDecimal("40000"));
	}

	@Test
	@DisplayName("Donation older than 15 years is not recalled")
	void remainingAllowance_donationOlderThan15Years() {
		List<DonationInput> donations = List.of(
				new DonationInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("80000"),
						LocalDate.of(2005, 1, 1), true));
		BigDecimal result = svc.remainingAllowance("Child1", RelationshipEnum.DIRECT_LINE,
				new BigDecimal("100000"), donations, LocalDate.of(2026, 1, 1));
		assertThat(result).isEqualByComparingTo(new BigDecimal("100000"));
	}

	@Test
	@DisplayName("Donations exceeding allowance => 0 remaining")
	void remainingAllowance_exceedsAllowance() {
		List<DonationInput> donations = List.of(
				new DonationInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("120000"),
						LocalDate.of(2020, 1, 1), true));
		BigDecimal result = svc.remainingAllowance("Child1", RelationshipEnum.DIRECT_LINE,
				new BigDecimal("100000"), donations, LocalDate.of(2026, 1, 1));
		assertThat(result).isEqualByComparingTo(BigDecimal.ZERO);
	}

	@Test
	@DisplayName("Non-rapportable donations are ignored")
	void remainingAllowance_nonRapportable() {
		List<DonationInput> donations = List.of(
				new DonationInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("80000"),
						LocalDate.of(2020, 1, 1), false));
		BigDecimal result = svc.remainingAllowance("Child1", RelationshipEnum.DIRECT_LINE,
				new BigDecimal("100000"), donations, LocalDate.of(2026, 1, 1));
		assertThat(result).isEqualByComparingTo(new BigDecimal("100000"));
	}

	@Test
	@DisplayName("Only matching beneficiary donations are considered")
	void remainingAllowance_filtersByBeneficiary() {
		List<DonationInput> donations = List.of(
				new DonationInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("60000"),
						LocalDate.of(2020, 1, 1), true),
				new DonationInput("Child2", RelationshipEnum.DIRECT_LINE, new BigDecimal("50000"),
						LocalDate.of(2020, 1, 1), true));
		BigDecimal result = svc.remainingAllowance("Child1", RelationshipEnum.DIRECT_LINE,
				new BigDecimal("100000"), donations, LocalDate.of(2026, 1, 1));
		assertThat(result).isEqualByComparingTo(new BigDecimal("40000"));
	}

	// --- recalledDonationsTotal ---

	@Test
	@DisplayName("Total recalled donations within 15 years")
	void recalledDonationsTotal_multiDonations() {
		List<DonationInput> donations = List.of(
				new DonationInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("30000"),
						LocalDate.of(2018, 1, 1), true),
				new DonationInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("20000"),
						LocalDate.of(2022, 6, 1), true),
				new DonationInput("Child1", RelationshipEnum.DIRECT_LINE, new BigDecimal("50000"),
						LocalDate.of(2005, 1, 1), true));
		BigDecimal total = svc.recalledDonationsTotal("Child1", donations, LocalDate.of(2026, 1, 1));
		assertThat(total).isEqualByComparingTo(new BigDecimal("50000"));
	}

	@Test
	@DisplayName("No donations => 0")
	void recalledDonationsTotal_empty() {
		assertThat(svc.recalledDonationsTotal("Child1", List.of(), LocalDate.of(2026, 1, 1)))
				.isEqualByComparingTo(BigDecimal.ZERO);
	}
}
