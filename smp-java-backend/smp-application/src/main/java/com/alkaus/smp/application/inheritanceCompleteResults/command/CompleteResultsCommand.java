package com.alkaus.smp.application.inheritanceCompleteResults.command;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * The command represent the api request object
 */
public record CompleteResultsCommand(
		String maritalStatus,
		String matrimonialRegime,
		PersonCommand client,
		PersonCommand spouse,	// nullable
		List<PersonCommand> children,	// nullable/empty
		ParentsCommand parentsOfDeceased, // nullable — parents of the client (deceased in scenario A)
		List<SiblingsCommand> siblingsOfDeceased, // nullable/empty — siblings of the client
		ParentsCommand parentsOfSpouse, // nullable — parents of the spouse (used in inverse scenario)
		List<SiblingsCommand> siblingsOfSpouse, // nullable/empty — siblings of the spouse
		List<AssetCommand> assets,
		BigDecimal totalNetWorth,	// could be 0 -> recalculate
		BigDecimal totalDebts,
		String spouseOption,
        AdvisorCommand advisor,
		BigDecimal annualIncome,
		BigDecimal annualCharges,
		boolean presenceDDV,
		List<DonationCommand> donations,
		List<LegCommand> legs,
		List<LifeInsuranceCommand> lifeInsurances,
		boolean hasWill,
		boolean allCommonChildren,
		LocalDate dateOfDeath
) {
	/** Backward-compatible constructor (no spouse family, no DDV, no donations, no legs, no AV, no will, all common, no death date) */
	public CompleteResultsCommand(
			String maritalStatus, String matrimonialRegime,
			PersonCommand client, PersonCommand spouse,
			List<PersonCommand> children, ParentsCommand parentsOfDeceased,
			List<SiblingsCommand> siblingsOfDeceased, List<AssetCommand> assets,
			BigDecimal totalNetWorth, BigDecimal totalDebts,
			String spouseOption, AdvisorCommand advisor,
			BigDecimal annualIncome, BigDecimal annualCharges) {
		this(maritalStatus, matrimonialRegime, client, spouse, children,
				parentsOfDeceased, siblingsOfDeceased, null, List.of(),
				assets, totalNetWorth, totalDebts,
				spouseOption, advisor, annualIncome, annualCharges,
				false, List.of(), List.of(), List.of(), false, true, null);
	}

	/** Backward-compatible constructor (with full fields but no spouse family) */
	public CompleteResultsCommand(
			String maritalStatus, String matrimonialRegime,
			PersonCommand client, PersonCommand spouse,
			List<PersonCommand> children, ParentsCommand parentsOfDeceased,
			List<SiblingsCommand> siblingsOfDeceased, List<AssetCommand> assets,
			BigDecimal totalNetWorth, BigDecimal totalDebts,
			String spouseOption, AdvisorCommand advisor,
			BigDecimal annualIncome, BigDecimal annualCharges,
			boolean presenceDDV, List<DonationCommand> donations,
			List<LegCommand> legs, List<LifeInsuranceCommand> lifeInsurances,
			boolean hasWill, boolean allCommonChildren, LocalDate dateOfDeath) {
		this(maritalStatus, matrimonialRegime, client, spouse, children,
				parentsOfDeceased, siblingsOfDeceased, null, List.of(),
				assets, totalNetWorth, totalDebts,
				spouseOption, advisor, annualIncome, annualCharges,
				presenceDDV, donations, legs, lifeInsurances, hasWill, allCommonChildren, dateOfDeath);
	}
}
