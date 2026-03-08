package com.alkaus.smp.domain.succession;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.alkaus.smp.domain.succession.util.MaritalStatusEnum;
import com.alkaus.smp.domain.succession.util.ScenarioTypeEnum;
import com.alkaus.smp.domain.succession.util.SpouseOptionEnum;

public record InheritanceInput(
		int fiscalYear,
		ScenarioTypeEnum scenarioType,
		MaritalStatusEnum maritalStatusEnum,       // CELIBATAIRE / MARIE / PACSE / ...
        String matrimonialRegime,                  // libre pour V1
        SpouseOptionEnum spouseOption,             // USUFRUIT_TOTAL / QUART_PP_TROIS_QUART_US / ...
        Integer deceasedAge,                         // utile pour l’usufruit
        Integer spouseAge,                       // utile si le conjoint est usufruitier
        BigDecimal grossAsset,                      // somme valeurs brutes
        BigDecimal totalPassif,                    // dettes (actifs + global)
        BigDecimal deductibleDebt,              // si tu veux différencier plus tard
        BigDecimal lifeInsuranceCapital,           // total si simplifié
        List<HeirInput> heirs,             // inclut le conjoint si applicable
        List<DonationInput> donations,             // V1: historique pour abattement restant
        List<LifeInsuranceInput> lifeInsurances,     // V1: détails AV
        LocalDate dateOfDeath,                       // utile pour “< 15 ans”
        LocalDate dateOfStudy,                       // auditability
        boolean hasLastSurvivorDonation,   // donation au dernier vivant (art. 1094-1)
        boolean hasWill,                   // testament exists
        BigDecimal deceasedSeparateAsset,  // biens propres du défunt
        BigDecimal commonAsset,            // biens communs du couple
        boolean hasAllCommonChildren,      // all children are common (affects spouse options)
        BigDecimal principalResidenceValue // value of the principal residence (for 20% abatement art. 764 bis CGI)
){ 
	/** Backward-compatible constructor */
	public InheritanceInput(int fiscalYear, ScenarioTypeEnum scenarioType,
			MaritalStatusEnum maritalStatusEnum, String matrimonialRegime,
			SpouseOptionEnum spouseOption, Integer deceasedAge, Integer spouseAge,
			BigDecimal grossAsset, BigDecimal totalPassif, BigDecimal deductibleDebt,
			BigDecimal lifeInsuranceCapital, List<HeirInput> heirs,
			List<DonationInput> donations, List<LifeInsuranceInput> lifeInsurances,
			LocalDate dateOfDeath, LocalDate dateOfStudy) {
		this(fiscalYear, scenarioType, maritalStatusEnum, matrimonialRegime,
				spouseOption, deceasedAge, spouseAge, grossAsset, totalPassif,
				deductibleDebt, lifeInsuranceCapital, heirs, donations, lifeInsurances,
				dateOfDeath, dateOfStudy, false, false, null, null, true, null);
	}

	public BigDecimal netAsset() {
		return grossAsset.subtract(totalPassif);
    }
}
