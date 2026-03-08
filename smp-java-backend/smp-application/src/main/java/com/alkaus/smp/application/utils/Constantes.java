package com.alkaus.smp.application.utils;

import java.math.BigDecimal;

public class Constantes {

	// Commons
	public static final BigDecimal ZERO = BigDecimal.ZERO;
	public static final BigDecimal TWENTY_FIVE = new BigDecimal("25");
	public static final BigDecimal SEVENTY_FIVE = new BigDecimal("75");
	public static final BigDecimal ONE_HUNDRED = new BigDecimal("100");

	/*----------------- HERITAGE -----------------*/

	public static final String H_ASSET_TYPE_REAL_ESTATE = "Immobilier";
	public static final String H_ASSET_TYPE_REAL_ESTATE_UP_CASE = "IMMOBILIER";
	public static final String H_ASSET_TYPE_REAL_ESTATE_RESIDENCE = "RESIDENCE";
	public static final String H_ASSET_TYPE_REAL_ESTATE_HOUSE = "MAISON";
	public static final String H_ASSET_TYPE_REAL_ESTATE_FLAT = "APPART";

	public static final String H_ASSET_TYPE_FINANCIAL = "Financier";
	public static final String H_ASSET_TYPE_PROFESSIONAL = "Professionnel";
	public static final String H_ASSET_TYPE_OTHERS = "Autre";

	/*----------------- SCENARIOS -----------------*/
	public static final String SC_SCENARIO_TYPE_DECEASED_CLIENT = "Décès du client";
	public static final String SC_SCENARIO_TYPE_DECEASED_SPOUSE = "Décès du conjoint";
	public static final String SC_SCENARIO_TYPE_NOT_APPLICABLE = "Non applicable";

	// Fiscal Rules
	public static final int RF_ABATTEMENT_LIGNE_DIRECTE = 100000;
	public static final int RF_ABATTEMENT_FRERE_SOEUR = 15932;
	public static final int RF_ABATTEMENT_NEVEU_NIECE = 7967; // Abattement par souche pour représentation
	public static final int RF_ABATTEMENT_TIERS = 1594;
	public static final int RF_ABATTEMENT_CONJOINT_DONATION_VIVANT = 80724; // Donations entre époux
	public static final int RF_ABATTEMENT_ASSURANCE_VIE_AVANT_70 = 152500; // Par bénéficiaire
	public static final int RF_ABATTEMENT_ASSURANCE_VIE_APRES_70_GLOBAL = 30500; // Sur les primes, global à tous
																					// bénéficiaires
	public static final double RF_ABATTEMENT_RES_PRINCIPALE = 0.20; // Abattement fiscal de 20% sur résidence principale
																	// (art. 764 bis CGI)

}
