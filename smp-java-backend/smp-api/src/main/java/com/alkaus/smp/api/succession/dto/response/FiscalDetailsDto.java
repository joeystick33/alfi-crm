package com.alkaus.smp.api.succession.dto.response;

import java.math.BigDecimal;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

public record FiscalDetailsDto(

		@JsonProperty("detailAssuranceVie")
		List<AvBeneficiaryDetailDto> avDetails,

		@JsonProperty("detailDonationsRappelees")
		List<DonationRecallDetailDto> donationDetails,

		@JsonProperty("detailLegs")
		List<LegDetailDto> legDetails,

		@JsonProperty("totalLegsDeduits")
		BigDecimal totalLegsDeducted
) {

	public record AvBeneficiaryDetailDto(
			@JsonProperty("beneficiaire") String beneficiaryName,
			@JsonProperty("lien") String relationship,
			@JsonProperty("capital990I") BigDecimal art990I_capital,
			@JsonProperty("abattement990I") BigDecimal art990I_allowance,
			@JsonProperty("baseTaxable990I") BigDecimal art990I_taxable,
			@JsonProperty("taxe990I") BigDecimal art990I_tax,
			@JsonProperty("primes757B") BigDecimal art757B_premiums,
			@JsonProperty("abattement757B") BigDecimal art757B_allowanceShare,
			@JsonProperty("reintegre757B") BigDecimal art757B_reintegrated,
			@JsonProperty("exonere") boolean exempt
	) {}

	public record DonationRecallDetailDto(
			@JsonProperty("beneficiaire") String beneficiaryName,
			@JsonProperty("montant") BigDecimal montant,
			@JsonProperty("dateDonation") String dateDonation,
			@JsonProperty("rapportable") boolean rapportable,
			@JsonProperty("rappele") boolean recalled,
			@JsonProperty("montantRappele") BigDecimal montantRappele,
			@JsonProperty("abattementInitial") BigDecimal abattementInitial,
			@JsonProperty("abattementApresRappel") BigDecimal abattementApresRappel
	) {}

	public record LegDetailDto(
			@JsonProperty("legataire") String legataireName,
			@JsonProperty("lien") String relationship,
			@JsonProperty("montant") BigDecimal montant,
			@JsonProperty("droits") BigDecimal droits
	) {}
}
