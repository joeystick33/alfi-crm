package com.alkaus.smp.application.inheritanceCompleteResults.model;

import java.math.BigDecimal;
import java.util.List;

/**
 * Container for detailed fiscal breakdowns (AV, donations, legs).
 */
public record FiscalDetailsResult(
		List<AvBeneficiaryDetail> avDetails,
		List<DonationRecallDetail> donationDetails,
		List<LegDetail> legDetails,
		BigDecimal totalLegsDeducted
) {}
