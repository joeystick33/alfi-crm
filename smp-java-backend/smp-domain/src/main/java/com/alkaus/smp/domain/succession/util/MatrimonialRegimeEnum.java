package com.alkaus.smp.domain.succession.util;

/**
 * Matrimonial regime types affecting the liquidation of the marital estate.
 */
public enum MatrimonialRegimeEnum {
	COMMUNITY_PROPERTY,                    // Communauté réduite aux acquêts (default)
	UNIVERSAL_COMMUNITY,                   // Communauté universelle (sans clause)
	UNIVERSAL_COMMUNITY_WITH_CLAUSE,       // Communauté universelle avec clause d'attribution intégrale
	SEPARATE_PROPERTY,                     // Séparation de biens
	PARTICIPATION_IN_ACQUISITIONS;         // Participation aux acquêts

	public String label() {
		return switch (this) {
			case COMMUNITY_PROPERTY -> "Communauté réduite aux acquêts";
			case UNIVERSAL_COMMUNITY -> "Communauté universelle";
			case UNIVERSAL_COMMUNITY_WITH_CLAUSE -> "Communauté universelle avec clause d'attribution intégrale";
			case SEPARATE_PROPERTY -> "Séparation de biens";
			case PARTICIPATION_IN_ACQUISITIONS -> "Participation aux acquêts";
		};
	}
}
