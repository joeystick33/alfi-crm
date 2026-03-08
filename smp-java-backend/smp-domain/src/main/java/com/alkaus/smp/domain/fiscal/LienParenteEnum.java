package com.alkaus.smp.domain.fiscal;

/**
 * Catégories fiscales utiles (granularité à ajuster si besoin)
 */
public enum LienParenteEnum {
	CONJOINT,			// droits du conjoint survivant (souvent exonéré fiscalement, mais utile côté civil)
	LIGNE_DIRECTE,				// enfants, parents
	FRERE_SOEUR,
	NEVEU_NIECE,
	TIERS				// non parents
}
