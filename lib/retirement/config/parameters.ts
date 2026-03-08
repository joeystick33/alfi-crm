/**
 * =============================================================================
 * PARAMÈTRES RETRAITE — FICHIER UNIQUE DE MAINTENANCE
 * =============================================================================
 * 
 * CE FICHIER CENTRALISE TOUS LES PARAMÈTRES QUI CHANGENT CHAQUE ANNÉE.
 * Période d'application : voir ANNEE_REFERENCE ci-dessous.
 * 
 * 📅 Dernière mise à jour : 01/01/2026
 * 📋 Prochaine révision prévue : 01/01/2027
 * 
 * ⚠️ SUSPENSION RÉFORME RETRAITES 2023 :
 * L'âge légal est figé à 62 ans et 9 mois jusqu'au 31/12/2027.
 * Le nombre de trimestres requis est également gelé.
 * Revalorisation pensions base : +0,9% au 01/01/2026.
 * 
 * Sources officielles :
 * - PASS : https://www.urssaf.fr
 * - AGIRC-ARRCO : https://www.agirc-arrco.fr
 * - CNAV : https://www.lassuranceretraite.fr
 * - Caisses libérales : sites respectifs
 * - LFSS 2026 : suspension réforme
 * 
 * =============================================================================
 */

// =============================================================================
// ANNÉE DE RÉFÉRENCE
// =============================================================================
export const ANNEE_REFERENCE = 2026

// =============================================================================
// PLAFONDS DE SÉCURITÉ SOCIALE
// =============================================================================
export const PLAFONDS = {
  /** Plafond Annuel de la Sécurité Sociale 2026 */
  PASS: 48060,  // 2026 (arrêté 22/12/2025, +2%)
  
  /** Plafond mensuel */
  PMSS: 4005,   // PASS / 12
  
  /** SMIC mensuel brut */
  SMIC_MENSUEL: 1801.80,
  
  /** SMIC horaire */
  SMIC_HORAIRE: 11.88,
} as const

// =============================================================================
// RÉGIME DE BASE - CNAV
// =============================================================================
export const REGIME_BASE = {
  /** Taux plein */
  TAUX_PLEIN: 0.50,
  
  /** Décote par trimestre manquant */
  DECOTE_PAR_TRIMESTRE: 0.00625,  // 0.625%
  
  /** Décote maximale */
  DECOTE_MAX: 0.25,  // 25% = 40 trimestres
  
  /** Surcote par trimestre supplémentaire */
  SURCOTE_PAR_TRIMESTRE: 0.0125,  // 1.25%
  
  /** Nombre de meilleures années pour le SAM */
  ANNEES_SAM: 25,
  
  /** Âge légal de départ — Figé à 62a9m (suspension réforme 2023, LFSS 2026) */
  AGE_LEGAL: 62.75, // 62 ans et 9 mois (gelé jusqu'au 31/12/2027)
  
  /** Âge du taux plein automatique */
  AGE_TAUX_PLEIN_AUTO: 67,
} as const

// =============================================================================
// TRIMESTRES REQUIS PAR GÉNÉRATION
// =============================================================================
// SUSPENSION RÉFORME 2023 : trimestres gelés à 172 pour générations 1965+
export const TRIMESTRES_REQUIS: Record<number, number> = {
  1958: 167,
  1959: 167,
  1960: 167,  // 1er semestre
  1961: 168,
  1962: 169,
  1963: 170,
  1964: 171,
  // Gelés à 172 (suspension réforme)
  1965: 172,
  1966: 172,
  1967: 172,
  1968: 172,  // et générations suivantes
}

// =============================================================================
// ÂGE LÉGAL PAR GÉNÉRATION (Réforme 2023)
// =============================================================================
// SUSPENSION RÉFORME 2023 : âge légal figé à 62a9m pour générations 1964+
// jusqu'au 31/12/2027. Les générations antérieures conservent l'âge antérieur.
export const AGE_LEGAL_PAR_GENERATION: Record<number, number> = {
  1960: 62,
  1961: 62.25,  // 62 ans et 3 mois
  1962: 62.5,   // 62 ans et 6 mois
  1963: 62.75,  // 62 ans et 9 mois
  // À partir de 1964 : gelé à 62a9m (suspension réforme)
  1964: 62.75,  // Gelé (au lieu de 63)
  1965: 62.75,  // Gelé (au lieu de 63a3m)
  1966: 62.75,  // Gelé (au lieu de 63a6m)
  1967: 62.75,  // Gelé (au lieu de 63a9m)
  1968: 62.75,  // Gelé (au lieu de 64)
}

// =============================================================================
// AGIRC-ARRCO (Salariés du privé)
// =============================================================================
export const AGIRC_ARRCO = {
  /** Valeur du point (liquidation) en € — Pas de hausse début 2026 */
  VALEUR_POINT: 1.4159,  // Inchangée début 2026
  
  /** Prix d'achat du point en € */
  PRIX_ACHAT_POINT: 19.6321,
  
  /** Taux d'acquisition des points */
  TAUX_ACQUISITION: 0.0620,  // 6.20%
  
  /** Taux de cotisation salarié */
  TAUX_COTISATION_SALARIE: 0.0400,  // 4.00%
  
  /** Taux de cotisation employeur */
  TAUX_COTISATION_EMPLOYEUR: 0.0620,  // 6.20%
  
  /** Plafond tranche 1 */
  PLAFOND_T1: 48060,  // = 1 PASS 2026
  
  /** Plafond tranche 2 */
  PLAFOND_T2: 384480,  // = 8 PASS 2026
  
  /** Coefficient de solidarité (malus départ immédiat) */
  COEF_SOLIDARITE_MALUS: 0.90,  // -10%
  
  /** Durée du malus en années */
  DUREE_MALUS_ANNEES: 3,
  
  /** Bonus report 1 an */
  BONUS_REPORT_1AN: 1.10,  // +10%
  
  /** Bonus report 2 ans */
  BONUS_REPORT_2ANS: 1.20,  // +20%
  
  /** Bonus report 3 ans+ */
  BONUS_REPORT_3ANS: 1.30,  // +30%
  
  /** Majoration enfants (3+) */
  MAJORATION_ENFANTS: 1.10,  // +10%
  
  /** Plafond majoration enfants en €/an */
  PLAFOND_MAJORATION_ENFANTS: 2221.34,
} as const

// =============================================================================
// RAFP (Fonctionnaires titulaires)
// =============================================================================
export const RAFP = {
  /** Valeur du point en € */
  VALEUR_POINT: 0.05593,
  
  /** Taux global de cotisation */
  TAUX_COTISATION: 0.10,  // 10% (5% salarié + 5% employeur)
  
  /** Assiette maximale (% du traitement) */
  ASSIETTE_MAX_PERCENT: 0.20,  // 20%
  
  /** Âge minimum de liquidation */
  AGE_MIN_LIQUIDATION: 62,
} as const

// =============================================================================
// IRCANTEC (Contractuels du public)
// =============================================================================
export const IRCANTEC = {
  /** Valeur du point tranche A en € */
  VALEUR_POINT_A: 0.55553,
  
  /** Valeur du point tranche B en € */
  VALEUR_POINT_B: 0.55553,
  
  /** Prix d'achat point tranche A */
  PRIX_ACHAT_A: 3.55,
  
  /** Prix d'achat point tranche B */
  PRIX_ACHAT_B: 4.11,
  
  /** Plafond tranche A */
  PLAFOND_A: 48060,  // = 1 PASS 2026
} as const

// =============================================================================
// SSI (Artisans / Commerçants - ex RSI)
// =============================================================================
export const SSI = {
  /** Valeur du point en € */
  VALEUR_POINT: 1.280,
  
  /** Taux de cotisation */
  TAUX_COTISATION: 0.07,  // 7%
  
  /** Plafond de cotisation */
  PLAFOND: 43992,  // ~0.93 PASS
} as const

// =============================================================================
// CIPAV (Professions libérales)
// =============================================================================
export const CIPAV = {
  /** Valeur du point en € */
  VALEUR_POINT: 2.89,
  
  /** Classes de cotisation avec points/an */
  CLASSES: {
    A: { pointsParAn: 36, cotisation: 1527 },
    B: { pointsParAn: 72, cotisation: 3054 },
    C: { pointsParAn: 108, cotisation: 4581 },
    D: { pointsParAn: 144, cotisation: 6108 },
    E: { pointsParAn: 216, cotisation: 9162 },
    F: { pointsParAn: 288, cotisation: 12216 },
    G: { pointsParAn: 360, cotisation: 15270 },
    H: { pointsParAn: 432, cotisation: 18324 },
  },
  
  /** Classe par défaut */
  CLASSE_DEFAUT: 'C',
} as const

// =============================================================================
// CARMF (Médecins)
// =============================================================================
export const CARMF = {
  /** Valeur du point complémentaire en € */
  VALEUR_POINT: 76.15,
  
  /** Classes de cotisation */
  CLASSES: {
    M: { pointsParAn: 10, cotisation: 2880 },
    B: { pointsParAn: 30, cotisation: 8630 },
    C: { pointsParAn: 40, cotisation: 11500 },
    D: { pointsParAn: 50, cotisation: 14380 },
    E: { pointsParAn: 60, cotisation: 17250 },
    F: { pointsParAn: 70, cotisation: 20130 },
    G: { pointsParAn: 80, cotisation: 23000 },
  },
  
  CLASSE_DEFAUT: 'C',
} as const

// =============================================================================
// CARPIMKO (Paramédicaux)
// =============================================================================
export const CARPIMKO = {
  /** Valeur du point en € */
  VALEUR_POINT: 21.28,
  
  /** Classes de cotisation */
  CLASSES: {
    '1': { pointsParAn: 32, cotisation: 1660 },
    '2': { pointsParAn: 64, cotisation: 3320 },
    '3': { pointsParAn: 96, cotisation: 4980 },
    '4': { pointsParAn: 128, cotisation: 6640 },
    '5': { pointsParAn: 160, cotisation: 8300 },
  },
  
  CLASSE_DEFAUT: '2',
} as const

// =============================================================================
// CNBF (Avocats)
// =============================================================================
export const CNBF = {
  /** Valeur du point en € */
  VALEUR_POINT: 1.0111,
  
  /** Classes de cotisation */
  CLASSES: {
    '1': { pointsParAn: 264, cotisation: 1740 },
    '2': { pointsParAn: 528, cotisation: 3480 },
    '3': { pointsParAn: 792, cotisation: 5220 },
    '4': { pointsParAn: 1056, cotisation: 6960 },
    '5': { pointsParAn: 1320, cotisation: 8700 },
  },
  
  CLASSE_DEFAUT: '2',
} as const

// =============================================================================
// CRPCEN (Notaires)
// =============================================================================
export const CRPCEN = {
  /** Valeur du point en € */
  VALEUR_POINT: 15.78,
  
  /** Classes de cotisation */
  CLASSES: {
    'B1': { pointsParAn: 60, cotisation: 2400 },
    'B2': { pointsParAn: 120, cotisation: 4800 },
    'C': { pointsParAn: 180, cotisation: 7200 },
  },
  
  CLASSE_DEFAUT: 'B2',
} as const

// =============================================================================
// PRÉLÈVEMENTS SOCIAUX SUR LES PENSIONS
// =============================================================================
export const PRELEVEMENTS = {
  /** CSG sur les pensions (taux normal) */
  CSG_NORMAL: 0.083,  // 8.3%
  
  /** CSG taux médian */
  CSG_MEDIAN: 0.066,  // 6.6%
  
  /** CSG taux réduit */
  CSG_REDUIT: 0.038,  // 3.8%
  
  /** CRDS */
  CRDS: 0.005,  // 0.5%
  
  /** CASA (autonomie) */
  CASA: 0.003,  // 0.3%
  
  /** Taux total standard (CSG normal + CRDS) */
  TAUX_TOTAL_STANDARD: 0.091,  // 9.1%
} as const

// =============================================================================
// SEUILS RFR POUR TAUX CSG (Revenus 2024, applicable 2025)
// =============================================================================
export const SEUILS_RFR_CSG = {
  /** 1 part fiscale */
  PART_1: {
    exoneration: 12455,
    tauxReduit: 16267,
    tauxMedian: 25246,
    // Au-delà : taux normal
  },
  
  /** 2 parts fiscales */
  PARTS_2: {
    exoneration: 19105,
    tauxReduit: 24964,
    tauxMedian: 38739,
  },
  
  /** Par demi-part supplémentaire */
  DEMI_PART_SUPP: {
    exoneration: 3325,
    tauxReduit: 4348,
    tauxMedian: 6746,
  },
} as const

// =============================================================================
// HISTORIQUE DES VALEURS (pour projections)
// =============================================================================
export const HISTORIQUE = {
  AGIRC_ARRCO_VALEUR_POINT: {
    2020: 1.2714,
    2021: 1.2714,
    2022: 1.2841,
    2023: 1.3498,
    2024: 1.4159,
    2025: 1.4386,
    2026: 1.4159,  // Inchangée début 2026
  },
  
  PASS: {
    2020: 41136,
    2021: 41136,
    2022: 41136,
    2023: 43992,
    2024: 46368,
    2025: 47100,
    2026: 48060,
  },
  
  /** Taux de revalorisation annuel moyen */
  TAUX_REVALORISATION_MOYEN: 0.024,  // ~2.4%/an
} as const

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Obtenir le nombre de trimestres requis pour une année de naissance
 */
export function getTrimestresRequis(anneeNaissance: number): number {
  if (anneeNaissance >= 1968) return 172
  return TRIMESTRES_REQUIS[anneeNaissance] || 172
}

/**
 * Obtenir l'âge légal pour une année de naissance
 */
export function getAgeLegal(anneeNaissance: number): number {
  // Suspension réforme : gelé à 62a9m pour 1964+ (jusqu'au 31/12/2027)
  if (anneeNaissance >= 1964) return 62.75
  return AGE_LEGAL_PAR_GENERATION[anneeNaissance] || 62.75
}

/**
 * Calculer le taux de prélèvements selon le RFR
 */
export function getTauxPrelevements(rfr: number, nbParts: number): number {
  const seuils = {
    exoneration: SEUILS_RFR_CSG.PART_1.exoneration + (nbParts - 1) * 2 * SEUILS_RFR_CSG.DEMI_PART_SUPP.exoneration,
    tauxReduit: SEUILS_RFR_CSG.PART_1.tauxReduit + (nbParts - 1) * 2 * SEUILS_RFR_CSG.DEMI_PART_SUPP.tauxReduit,
    tauxMedian: SEUILS_RFR_CSG.PART_1.tauxMedian + (nbParts - 1) * 2 * SEUILS_RFR_CSG.DEMI_PART_SUPP.tauxMedian,
  }
  
  if (rfr <= seuils.exoneration) return 0
  if (rfr <= seuils.tauxReduit) return PRELEVEMENTS.CSG_REDUIT + PRELEVEMENTS.CRDS
  if (rfr <= seuils.tauxMedian) return PRELEVEMENTS.CSG_MEDIAN + PRELEVEMENTS.CRDS + PRELEVEMENTS.CASA
  return PRELEVEMENTS.TAUX_TOTAL_STANDARD
}

/**
 * Projeter une valeur avec revalorisation
 */
export function projeterValeur(valeurActuelle: number, anneesProjection: number): number {
  return valeurActuelle * Math.pow(1 + HISTORIQUE.TAUX_REVALORISATION_MOYEN, anneesProjection)
}
