/**
 * Constantes fiscales immobilier 2025
 * SÉCURISÉES - Côté serveur uniquement
 * 
 * Sources :
 * - CGI art. 197 (barème IR)
 * - CGI art. 977 (barème IFI)
 * - CGI art. 199 novovicies (Pinel)
 * - CGI art. 199 tervicies (Malraux)
 * - CGI art. 156-I-3° (déficit foncier)
 */

// ══════════════════════════════════════════════════════════════════════════════
// BARÈME IR 2025
// ══════════════════════════════════════════════════════════════════════════════

export const BAREME_IR_2025 = [
  { min: 0, max: 11497, taux: 0 },
  { min: 11497, max: 29315, taux: 11 },
  { min: 29315, max: 83823, taux: 30 },
  { min: 83823, max: 180294, taux: 41 },
  { min: 180294, max: Infinity, taux: 45 },
] as const

// ══════════════════════════════════════════════════════════════════════════════
// DÉCOTE IR 2025 - CGI art. 197 I-4°
// ══════════════════════════════════════════════════════════════════════════════
export const DECOTE_IR_2025 = {
  // Célibataire, divorcé, séparé, veuf
  SEUL: {
    SEUIL: 1929,      // Seuil de déclenchement
    PLAFOND: 873,     // Décote maximale
    TAUX: 0.4525      // Coefficient de réduction
  },
  // Couple (marié ou pacsé)
  COUPLE: {
    SEUIL: 3191,
    PLAFOND: 1444,
    TAUX: 0.4525
  }
} as const

// ══════════════════════════════════════════════════════════════════════════════
// CEHR - Contribution Exceptionnelle Hauts Revenus - CGI art. 223 sexies
// ══════════════════════════════════════════════════════════════════════════════
export const CEHR_2025 = {
  // Célibataire
  SEUL: [
    { min: 0, max: 250000, taux: 0 },
    { min: 250000, max: 500000, taux: 3 },   // 3%
    { min: 500000, max: Infinity, taux: 4 }  // 4%
  ],
  // Couple (marié ou pacsé)
  COUPLE: [
    { min: 0, max: 500000, taux: 0 },
    { min: 500000, max: 1000000, taux: 3 },  // 3%
    { min: 1000000, max: Infinity, taux: 4 } // 4%
  ]
} as const

// ══════════════════════════════════════════════════════════════════════════════
// PLAFONNEMENT QUOTIENT FAMILIAL 2025 - CGI art. 197 I-2°
// ══════════════════════════════════════════════════════════════════════════════
export const PLAFOND_QF_2025 = {
  GENERAL: 1759,                  // Avantage max par demi-part supplémentaire
  PARENT_ISOLE_PREMIERE: 4149,    // 1ère demi-part pour parent isolé
  INVALIDITE: 3566,               // Demi-part pour invalidité
  ANCIEN_COMBATTANT: 3566         // Demi-part ancien combattant > 74 ans
} as const

// ══════════════════════════════════════════════════════════════════════════════
// BARÈME IFI 2025
// ══════════════════════════════════════════════════════════════════════════════

export const BAREME_IFI = {
  SEUIL: 1300000,
  ABATTEMENT_RP: 0.30,
  TRANCHES: [
    { min: 0, max: 800000, taux: 0 },
    { min: 800000, max: 1300000, taux: 0.50 },
    { min: 1300000, max: 2570000, taux: 0.70 },
    { min: 2570000, max: 5000000, taux: 1.00 },
    { min: 5000000, max: 10000000, taux: 1.25 },
    { min: 10000000, max: Infinity, taux: 1.50 },
  ],
  DECOTE: {
    MIN: 1300000,
    MAX: 1400000,
    FORMULE: (patrimoine: number) => 17500 - 0.0125 * patrimoine,
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// PRÉLÈVEMENTS SOCIAUX
// ══════════════════════════════════════════════════════════════════════════════

export const PRELEVEMENTS_SOCIAUX = {
  TAUX_GLOBAL: 0.172,
  CSG: 0.092,
  CSG_DEDUCTIBLE: 0.068,
  CRDS: 0.005,
  PRELEVEMENT_SOLIDARITE: 0.075,
} as const

// ══════════════════════════════════════════════════════════════════════════════
// LMNP / LMP
// ══════════════════════════════════════════════════════════════════════════════

export const LMNP = {
  MICRO_BIC: {
    CLASSIQUE: {
      PLAFOND: 15000,
      ABATTEMENT: 30,
    },
    TOURISME_CLASSE: {
      PLAFOND: 77700,
      ABATTEMENT: 50,
    },
    CHAMBRE_HOTES: {
      PLAFOND: 188700,
      ABATTEMENT: 71,
    },
  },
  PLAFOND_MICRO_BIC: 77700,
  ABATTEMENT_MICRO_BIC: 50,
  DUREE_AMORT_IMMEUBLE: 30,
  DUREE_AMORT_MOBILIER: 7,
  DUREE_AMORT_TRAVAUX: 10,
  PART_TERRAIN_DEFAULT: 15,
  SEUIL_RECETTES_LMNP: 23000,
} as const

export const LMP = {
  SEUIL_RECETTES: 23000,
  // Condition LMP : recettes > 50% des revenus professionnels du foyer
  SEUIL_PART_REVENUS: 0.5,
  
  // Cotisations SSI 2025 - Taux détaillés (source URSSAF)
  SSI: {
    // Taux global selon niveau de bénéfice (35% bas revenus → 45% hauts revenus)
    TAUX_MIN: 0.35,
    TAUX_MAX: 0.45,
    TAUX_MOYEN: 0.40, // Estimation moyenne pour calcul simplifié
    
    // Détail des cotisations (sur bénéfice net BIC)
    MALADIE_TAUX_MIN: 0.065,   // 6,5% (revenus bas)
    MALADIE_TAUX_MAX: 0.25,   // 25% (revenus élevés) - progressif
    RETRAITE_BASE: 0.1775,    // 17,75%
    RETRAITE_COMPLEMENTAIRE_MIN: 0.07, // 7%
    RETRAITE_COMPLEMENTAIRE_MAX: 0.11, // 11%
    INVALIDITE_DECES_MIN: 0.013, // 1,3%
    INVALIDITE_DECES_MAX: 0.019, // 1,9%
    ALLOCATIONS_FAMILIALES_MIN: 0.031, // 3,1%
    ALLOCATIONS_FAMILIALES_MAX: 0.0525, // 5,25%
    
    // CSG/CRDS calculée sur (bénéfice + cotisations obligatoires)
    CSG_CRDS: 0.097, // 9,7%
    
    // Cotisations minimales annuelles (2025)
    MINIMUM_MALADIE_IJ: 9,
    MINIMUM_RETRAITE_BASE: 931,
    MINIMUM_INVALIDITE_DECES: 69,
    MINIMUM_CFP: 116,
    MINIMUM_TOTAL: 1208,
    
    // PASS 2025 (Plafond Annuel Sécurité Sociale)
    PASS_2025: 46368,
  },
  
  // Exonération plus-value professionnelle (art. 151 septies CGI)
  EXONERATION_PV_PRO_SEUIL: 90000,
  EXONERATION_PV_PRO_PLAFOND: 126000,
} as const

// ══════════════════════════════════════════════════════════════════════════════
// LOCATION NUE
// ══════════════════════════════════════════════════════════════════════════════

export const LOCATION_NUE = {
  MICRO_FONCIER: {
    PLAFOND: 15000,
    ABATTEMENT: 30,
  },
  DEFICIT_FONCIER: {
    PLAFOND_IMPUTATION_RG: 10700,
    PLAFOND_IMPUTATION_RG_RENOVATION_ENERGETIQUE: 21400,
    DUREE_REPORT: 10,
    ENGAGEMENT_LOCATION: 3,
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// LOCATION SAISONNIÈRE
// ══════════════════════════════════════════════════════════════════════════════

export const LOCATION_SAISONNIERE = {
  // Réforme LF 2024 - Revenus 2025 (art. 45 LF 2024)
  // https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000048727345
  TOURISME_CLASSE: {
    PLAFOND_MICRO_BIC: 77700,  // Abaissé de 188 700 € (ancien régime)
    ABATTEMENT: 50,            // Réduit de 71%
  },
  TOURISME_NON_CLASSE: {
    PLAFOND_MICRO_BIC: 15000,  // Abaissé de 77 700 € - Réforme majeure 2024
    ABATTEMENT: 30,            // Réduit de 50%
  },
  CHAMBRE_HOTES: {
    // Chambre d'hôtes : maintien du régime favorable
    PLAFOND_MICRO_BIC: 188700,
    ABATTEMENT: 71,
  },
  LIMITE_RP: 120, // nuits max/an si résidence principale
} as const

// ══════════════════════════════════════════════════════════════════════════════
// PINEL 2025
// ══════════════════════════════════════════════════════════════════════════════

export const PINEL = {
  PLAFOND_INVESTISSEMENT: 300000,
  PLAFOND_M2: 5500,
  TAUX_REDUCTION: {
    6: 9,
    9: 12,
    12: 14,
  },
  TAUX_REDUCTION_PLUS: {
    6: 12,
    9: 18,
    12: 21,
  },
  PLAFONDS_LOYER_M2: {
    A_BIS: 18.89,
    A: 14.03,
    B1: 11.31,
    B2: 9.83,
  },
  PLAFONDS_RESSOURCES: {
    A_BIS: { 1: 43475, 2: 64976, 3: 85175, 4: 101693, 5: 121110, 6: 136131 },
    A: { 1: 43475, 2: 64976, 3: 78104, 4: 93556, 5: 110753, 6: 124630 },
    B1: { 1: 35435, 2: 47321, 3: 56905, 4: 68699, 5: 80816, 6: 91078 },
    B2: { 1: 31892, 2: 42588, 3: 51215, 4: 61830, 5: 72735, 6: 81971 },
  },
  ZONES_AUTORISEES_PLUS: ['A_BIS', 'A', 'B1'] as const,
  SURFACE_MIN_PINEL_PLUS: 28,
  ANNEE_FIN_STANDARD: 2024,
} as const

// ══════════════════════════════════════════════════════════════════════════════
// DENORMANDIE
// ══════════════════════════════════════════════════════════════════════════════

export const DENORMANDIE = {
  PLAFOND_INVESTISSEMENT: 300000,
  SEUIL_TRAVAUX_POURCENTAGE: 25,
  TAUX_REDUCTION: {
    6: 12,
    9: 18,
    12: 21,
  },
  // Plafonds loyer et ressources = même que Pinel
} as const

// ══════════════════════════════════════════════════════════════════════════════
// MALRAUX
// ══════════════════════════════════════════════════════════════════════════════

export const MALRAUX = {
  PLAFOND_TRAVAUX: 400000,
  DUREE_TRAVAUX_MAX: 4,
  TAUX_SPR: 30,
  TAUX_QAD: 22,
  ENGAGEMENT_LOCATION: 9,
  HORS_PLAFOND_NICHES: true,
} as const

// ══════════════════════════════════════════════════════════════════════════════
// MONUMENTS HISTORIQUES
// ══════════════════════════════════════════════════════════════════════════════

export const MONUMENTS_HISTORIQUES = {
  DEDUCTION_TRAVAUX: 100,
  OUVERTURE_PUBLIC: {
    OUI: { charges: 100, travaux: 100 },
    PARTIEL: { charges: 50, travaux: 100 },
    NON: { charges: 50, travaux: 100 },
  },
  HORS_PLAFOND_NICHES: true,
  MINIMUM_JOURS_OUVERTURE: 50,
} as const

// ══════════════════════════════════════════════════════════════════════════════
// SCPI
// ══════════════════════════════════════════════════════════════════════════════

export const SCPI = {
  DELAI_JOUISSANCE_MOYEN: 4,
  FRAIS_SOUSCRIPTION_MOYEN: 10,
  PART_REVENUS_FRANCE_DEFAULT: 60,
} as const

// ══════════════════════════════════════════════════════════════════════════════
// PLUS-VALUE IMMOBILIÈRE
// ══════════════════════════════════════════════════════════════════════════════

export const PLUS_VALUE_IMMOBILIERE = {
  TAUX_IR: 19,
  TAUX_PS: 17.2,
  ABATTEMENT_IR: {
    DEBUT: 6, // année de début (après 5 ans)
    TAUX_ANNUEL: 6, // % par an de 6 à 21
    ANNEE_EXONERATION: 22,
  },
  ABATTEMENT_PS: {
    DEBUT: 6,
    TAUX_ANNUEL_6_21: 1.65,
    TAUX_ANNEE_22: 1.60,
    TAUX_ANNUEL_23_30: 9,
    ANNEE_EXONERATION: 30,
  },
  SURTAXE: [
    { min: 50000, max: 60000, taux: 2 },
    { min: 60000, max: 100000, taux: 2 },
    { min: 100000, max: 110000, lissage: true },
    { min: 110000, max: 150000, taux: 3 },
    { min: 150000, max: 160000, lissage: true },
    { min: 160000, max: 200000, taux: 4 },
    { min: 200000, max: 210000, lissage: true },
    { min: 210000, max: 250000, taux: 5 },
    { min: 250000, max: 260000, lissage: true },
    { min: 260000, max: Infinity, taux: 6 },
  ],
} as const

// ══════════════════════════════════════════════════════════════════════════════
// PLAFOND DES NICHES FISCALES
// ══════════════════════════════════════════════════════════════════════════════

export const PLAFOND_NICHES = {
  GLOBAL: 10000,
  OUTRE_MER: 18000,
  SOFICA: 18000,
} as const

// ══════════════════════════════════════════════════════════════════════════════
// DÉMEMBREMENT (CGI art. 669)
// ══════════════════════════════════════════════════════════════════════════════

export const BAREME_DEMEMBREMENT = [
  { ageMax: 20, usufruit: 90, nuePropriete: 10 },
  { ageMax: 30, usufruit: 80, nuePropriete: 20 },
  { ageMax: 40, usufruit: 70, nuePropriete: 30 },
  { ageMax: 50, usufruit: 60, nuePropriete: 40 },
  { ageMax: 60, usufruit: 50, nuePropriete: 50 },
  { ageMax: 70, usufruit: 40, nuePropriete: 60 },
  { ageMax: 80, usufruit: 30, nuePropriete: 70 },
  { ageMax: 90, usufruit: 20, nuePropriete: 80 },
  { ageMax: Infinity, usufruit: 10, nuePropriete: 90 },
] as const
