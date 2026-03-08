package com.alkaus.smp.domain.repository;

import java.util.Optional;

import com.alkaus.smp.domain.fiscal.FiscalRules;

public interface FiscalRulesRepository {

	/**
	 * Find the fiscal rules of year
	 * @param year
	 * @return 
	 */
	Optional<FiscalRules> findByYear(int year);
	
	/**
	 * Utile pour un "par défaut" si l'année demandée n'est pas trouvée
	 * @param annee
	 * @return
	 */
	default FiscalRules getOrThrow(int year) {
		return findByYear(year).orElseThrow(() -> new IllegalStateException("No fiscal Rules for year : " + year));
	}
}
