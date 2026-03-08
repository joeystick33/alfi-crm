/**
 * Constantes fiscales 2026 — Source unique de vérité
 * 
 * Loi de Finances 2026 (PLF 2026 adopté via 49-3, art. 2 ter)
 * Revenus 2025 — Revalorisation +0,9%
 * 
 * Sources :
 * - Barème IR : art. 2 ter PLF 2026 (revalorisation 0,9%)
 * - CEHR : CGI art. 223 sexies (inchangé)
 * - CDHR : art. 3 PLF 2026 (prorogation pour revenus 2026)
 * - IFI : CGI art. 977 (inchangé en 2026)
 * - PS : LFSS 2026 — CSG portée à 10,6% UNIQUEMENT sur revenus financiers
 *        (dividendes, intérêts, PV mobilières, crypto, PEA, LMNP/BIC, épargne salariale)
 *        PS restent à 17,2% pour : revenus fonciers, PV immobilières, assurance-vie
 * - PV immo : INCHANGÉ — exonération IR à 22 ans, PS à 30 ans
 *        (amendement Le Fur 17 ans NON RETENU dans version définitive 49-3)
 * - Succession/Donation : CGI art. 777 et suivants (inchangé)
 * - PER : plafonds indexés sur PASS 2025
 * - Retraite : âge légal figé à 62 ans et 9 mois jusqu'au 31/12/2027
 * - Dispositif Jeanbrun : nouveau statut bailleur privé (PLF 2026)
 */

// ══════════════════════════════════════════════════════════════════════════════
// BARÈME IR 2026 (revenus 2025) — Revalorisation +0,9%
// ══════════════════════════════════════════════════════════════════════════════

export const BAREME_IR_2026 = [
  { min: 0, max: 11600, taux: 0 },
  { min: 11600, max: 29579, taux: 11 },
  { min: 29579, max: 84577, taux: 30 },
  { min: 84577, max: 181917, taux: 41 },
  { min: 181917, max: Infinity, taux: 45 },
] as const

// Variante avec taux en décimal (0.11 au lieu de 11) pour certains simulateurs
export const BAREME_IR_2026_DECIMAL = [
  { min: 0, max: 11600, taux: 0 },
  { min: 11600, max: 29579, taux: 0.11 },
  { min: 29579, max: 84577, taux: 0.30 },
  { min: 84577, max: 181917, taux: 0.41 },
  { min: 181917, max: Infinity, taux: 0.45 },
] as const

// ══════════════════════════════════════════════════════════════════════════════
// DÉCOTE IR 2026 — CGI art. 197 I-4° (revalorisée +0,9%)
// ══════════════════════════════════════════════════════════════════════════════

export const DECOTE_IR_2026 = {
  SEUL: {
    SEUIL: 1946,      // 1929 × 1,009 arrondi
    PLAFOND: 881,      // 873 × 1,009 arrondi
    TAUX: 0.4525,
  },
  COUPLE: {
    SEUIL: 3220,       // 3191 × 1,009 arrondi
    PLAFOND: 1457,     // 1444 × 1,009 arrondi
    TAUX: 0.4525,
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// PLAFONNEMENT QUOTIENT FAMILIAL 2026 — CGI art. 197 I-2°
// ══════════════════════════════════════════════════════════════════════════════

export const PLAFOND_QF_2026 = {
  GENERAL: 1775,                  // 1759 × 1,009 arrondi
  PARENT_ISOLE_PREMIERE: 4186,    // 4149 × 1,009 arrondi
  INVALIDITE: 3598,               // 3566 × 1,009 arrondi
  ANCIEN_COMBATTANT: 3598,
} as const

// ══════════════════════════════════════════════════════════════════════════════
// ABATTEMENTS IR 2026 (revalorisés +0,9%)
// ══════════════════════════════════════════════════════════════════════════════

export const ABATTEMENT_10_2026 = {
  MIN: 499,   // 495 × 1,009
  MAX: 14299, // 14171 × 1,009
} as const

export const ABATTEMENT_PENSIONS_2026 = {
  MIN: 446,   // 442 × 1,009
  MAX: 4360,  // 4321 × 1,009
} as const

// ══════════════════════════════════════════════════════════════════════════════
// CEHR — Contribution Exceptionnelle Hauts Revenus — CGI art. 223 sexies
// Inchangé en 2026
// ══════════════════════════════════════════════════════════════════════════════

export const CEHR_2026 = {
  SEUL: [
    { min: 0, max: 250000, taux: 0 },
    { min: 250000, max: 500000, taux: 3 },
    { min: 500000, max: Infinity, taux: 4 },
  ],
  COUPLE: [
    { min: 0, max: 500000, taux: 0 },
    { min: 500000, max: 1000000, taux: 3 },
    { min: 1000000, max: Infinity, taux: 4 },
  ],
} as const

// ══════════════════════════════════════════════════════════════════════════════
// CDHR — Contribution Différentielle Hauts Revenus (LF2025 prorogée LF2026)
// Imposition minimale de 20% pour les très hauts revenus
// ══════════════════════════════════════════════════════════════════════════════

export const CDHR_2026 = {
  TAUX_MINIMUM: 0.20, // 20% du RFR
  SEUILS: {
    SEUL: 250000,
    COUPLE: 500000,
  },
  ACOMPTE_TAUX: 0.95, // 95% à verser entre 1er et 15 décembre
} as const

// ══════════════════════════════════════════════════════════════════════════════
// BARÈME IFI 2026 — CGI art. 977 (inchangé)
// ══════════════════════════════════════════════════════════════════════════════

export const BAREME_IFI_2026 = {
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
// PRÉLÈVEMENTS SOCIAUX 2026 — LFSS 2026 : système DUAL
// CSG portée à 10,6% UNIQUEMENT sur certains revenus du capital
// ══════════════════════════════════════════════════════════════════════════════

export const PRELEVEMENTS_SOCIAUX_2026 = {
  // TAUX MAJORÉ 18,6% — Revenus financiers (LFSS 2026)
  // Dividendes, intérêts, PV mobilières, crypto, PEA, LMNP/BIC non pro,
  // épargne salariale, PER bancaire
  FINANCIER: {
    TAUX_GLOBAL: 0.186,          // 18,6%
    CSG: 0.106,                  // 10,6% (hausse +1,4 point)
    CSG_DEDUCTIBLE: 0.068,       // 6,8% (inchangé)
    CRDS: 0.005,                 // 0,5% (inchangé)
    PRELEVEMENT_SOLIDARITE: 0.075, // 7,5% (inchangé)
  },

  // TAUX MAINTENU 17,2% — Revenus immobiliers et assurance-vie
  // Revenus fonciers (location nue), PV immobilières, assurance-vie,
  // contrats de capitalisation, CEL/PEL, PEP, PER assurance
  IMMOBILIER_AV: {
    TAUX_GLOBAL: 0.172,          // 17,2% (INCHANGÉ)
    CSG: 0.092,                  // 9,2% (INCHANGÉ)
    CSG_DEDUCTIBLE: 0.068,       // 6,8% (inchangé)
    CRDS: 0.005,                 // 0,5% (inchangé)
    PRELEVEMENT_SOLIDARITE: 0.075, // 7,5% (inchangé)
  },

  // Sur revenus d'activité (inchangé)
  ACTIVITE: {
    TAUX_GLOBAL: 0.172,
    CSG: 0.092,
    CSG_DEDUCTIBLE: 0.068,
    CRDS: 0.005,
    PRELEVEMENT_SOLIDARITE: 0.075,
  },
} as const

// PFU 2026 : 12,8% IR + 18,6% PS financiers = 31,4%
// S'applique aux revenus financiers (dividendes, intérêts, PV mobilières)
export const PFU_2026 = {
  TAUX_IR: 0.128,
  TAUX_PS: 0.186,
  TAUX_GLOBAL: 0.314,
} as const

// ══════════════════════════════════════════════════════════════════════════════
// PLUS-VALUE IMMOBILIÈRE 2026 — INCHANGÉ
// Amendement Le Fur (17 ans) NON RETENU dans la version définitive (49-3)
// Exonération IR : 22 ans | Exonération PS : 30 ans
// PS sur PV immo : 17,2% (exclus de la hausse LFSS 2026)
// ══════════════════════════════════════════════════════════════════════════════

export const PLUS_VALUE_IMMOBILIERE_2026 = {
  TAUX_IR: 19,
  TAUX_PS: 17.2, // 17,2% INCHANGÉ (PV immo exclues de la hausse CSG)

  // Abattement IR : INCHANGÉ, exonération à 22 ans
  ABATTEMENT_IR: {
    DEBUT: 6,
    TAUX_ANNUEL_6_21: 6,    // 6% par an de l'année 6 à 21
    TAUX_ANNEE_22: 4,        // 4% la 22e année (complément → 100%)
    ANNEE_EXONERATION: 22,   // Exonération totale IR après 22 ans
  },

  // Abattement PS : INCHANGÉ, exonération à 30 ans
  ABATTEMENT_PS: {
    DEBUT: 6,
    TAUX_ANNUEL_6_21: 1.65,
    TAUX_ANNEE_22: 1.60,
    TAUX_ANNUEL_23_30: 9,
    ANNEE_EXONERATION: 30,
  },

  // Surtaxe PV > 50 000 € (inchangée)
  SURTAXE: [
    { min: 50000, max: 60000, taux: 2 },
    { min: 60000, max: 100000, taux: 2 },
    { min: 100000, max: 110000, taux: 3 },
    { min: 110000, max: 150000, taux: 3 },
    { min: 150000, max: 160000, taux: 4 },
    { min: 160000, max: 200000, taux: 4 },
    { min: 200000, max: 210000, taux: 5 },
    { min: 210000, max: 250000, taux: 5 },
    { min: 250000, max: 260000, taux: 6 },
    { min: 260000, max: Infinity, taux: 6 },
  ],

  // Forfaits majorant le prix d'acquisition
  FORFAIT_ACQUISITION: 0.075,
  FORFAIT_TRAVAUX: 0.15, // si détention > 5 ans
} as const

// ══════════════════════════════════════════════════════════════════════════════
// SUCCESSION & DONATION 2026 — CGI art. 777 et suivants (inchangé)
// ══════════════════════════════════════════════════════════════════════════════

export const ABATTEMENTS_SUCCESSION_2026 = {
  CONJOINT: 80724,        // Exonéré de fait (art. 796-0 bis)
  ENFANT: 100000,
  PETIT_ENFANT: 31865,
  ARRIERE_PETIT_ENFANT: 5310,
  FRERE_SOEUR: 15932,
  NEVEU_NIECE: 7967,
  AUTRE: 1594,
  HANDICAPE: 159325,      // Cumul avec abattement personnel
  // Donation spécifique
  DONATION_SOMME_ARGENT: 31865, // "Don familial" (donateur < 80 ans, donataire majeur)
  RENOUVELLEMENT_ANNEES: 15,    // Délai de rappel fiscal
} as const

export const BAREME_SUCCESSION_LIGNE_DIRECTE_2026 = [
  { limit: 8072, rate: 0.05 },
  { limit: 12109, rate: 0.10 },
  { limit: 15932, rate: 0.15 },
  { limit: 552324, rate: 0.20 },
  { limit: 902838, rate: 0.30 },
  { limit: 1805677, rate: 0.40 },
  { limit: Infinity, rate: 0.45 },
] as const

export const BAREME_SUCCESSION_FRERE_SOEUR_2026 = [
  { limit: 24430, rate: 0.35 },
  { limit: Infinity, rate: 0.45 },
] as const

export const BAREME_SUCCESSION_NEVEU_NIECE_2026 = [
  { limit: Infinity, rate: 0.55 },
] as const

export const BAREME_SUCCESSION_AUTRE_2026 = [
  { limit: Infinity, rate: 0.60 },
] as const

// ══════════════════════════════════════════════════════════════════════════════
// PER — Plafonds 2026 (indexés sur PASS)
// ══════════════════════════════════════════════════════════════════════════════

export const PASS_2026 = {
  ANNUEL: 48060,          // PASS 2026 officiel (+2% vs 2025)
  ANNUEL_N_MOINS_1: 47100, // PASS 2025
} as const

export const PER_2026 = {
  // Salarié : 10% des revenus nets, plancher/plafond indexés sur PASS
  SALARIE: {
    TAUX_DEDUCTION: 0.10,
    PLAFOND_MIN: 4710,    // 10% du PASS N-1 (47100)
    PLAFOND_MAX: 37680,   // 10% de 8 × PASS N-1 (8 × 47100)
  },
  // TNS : article 154 bis CGI
  TNS: {
    TAUX_TRANCHE_1: 0.10, // 10% du bénéfice (jusqu'à 1 PASS)
    TAUX_TRANCHE_2: 0.15, // 15% du bénéfice (entre 1 et 8 PASS)
  },
  // Rendements de référence
  RENDEMENTS: {
    prudent: 0.025,
    equilibre: 0.04,
    dynamique: 0.06,
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// ASSURANCE-VIE 2026
// ══════════════════════════════════════════════════════════════════════════════

export const ASSURANCE_VIE_2026 = {
  // Rachat après 8 ans
  ABATTEMENT_ANNUEL: {
    SEUL: 4600,
    COUPLE: 9200,
  },
  // Taux forfaitaire après 8 ans (primes versées après 27/09/2017)
  TAUX_PFL_APRES_8_ANS: 0.075, // 7,5%
  SEUIL_150K: 150000,
  TAUX_PFL_AU_DELA_150K: 0.128, // 12,8%
  // PS sur gains AV : 17,2% (AV exclue de la hausse CSG LFSS 2026)
  TAUX_PS: 0.172, // 17,2% INCHANGÉ

  // Transmission (décès)
  ARTICLE_990I: {
    ABATTEMENT: 152500, // Par bénéficiaire
    TAUX_TRANCHE_1: 0.20, // Jusqu'à 700 000 € (après abattement)
    SEUIL_TRANCHE_1: 700000,
    TAUX_TRANCHE_2: 0.3125, // Au-delà
  },
  ARTICLE_757B: {
    ABATTEMENT_GLOBAL: 30500, // Partagé entre bénéficiaires
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// RETRAITE 2026 — Suspension réforme 2023
// Âge légal figé à 62 ans et 9 mois jusqu'au 31/12/2027
// ══════════════════════════════════════════════════════════════════════════════

export const RETRAITE_2026 = {
  // Âge légal figé (suspension réforme Macron 2023)
  AGE_LEGAL: {
    ANS: 62,
    MOIS: 9,
    TOTAL_MOIS: 62 * 12 + 9, // 753 mois
    GEL_JUSQU_AU: '2027-12-31',
  },
  // Âge taux plein automatique (inchangé)
  AGE_TAUX_PLEIN: 67,
  // Revalorisation pensions base 2026
  REVALORISATION: 0.009, // +0,9%

  // Trimestres requis par génération (figés)
  TRIMESTRES_REQUIS: [
    { anneeNaissance: 1961, trimestres: 168, ageLegal: { ans: 62, mois: 0 } },
    { anneeNaissance: 1962, trimestres: 169, ageLegal: { ans: 62, mois: 3 } },
    { anneeNaissance: 1963, trimestres: 170, ageLegal: { ans: 62, mois: 6 } },
    { anneeNaissance: 1964, trimestres: 171, ageLegal: { ans: 62, mois: 9 } },
    // Figé pour les générations suivantes (suspension)
    { anneeNaissance: 1965, trimestres: 172, ageLegal: { ans: 62, mois: 9 } },
    { anneeNaissance: 1966, trimestres: 172, ageLegal: { ans: 62, mois: 9 } },
    { anneeNaissance: 1967, trimestres: 172, ageLegal: { ans: 62, mois: 9 } },
    { anneeNaissance: 1968, trimestres: 172, ageLegal: { ans: 62, mois: 9 } },
  ],

  // Décote / Surcote
  DECOTE: {
    TAUX_PAR_TRIMESTRE: 0.00625, // 0,625% par trimestre manquant
    MAX_TRIMESTRES: 20,
  },
  SURCOTE: {
    TAUX_PAR_TRIMESTRE: 0.0125, // 1,25% par trimestre supplémentaire
  },

  // PASS pour calcul pension
  PASS: 48060,
  TAUX_PLEIN: 0.50,

  // Agirc-Arrco (pas de hausse début 2026)
  AGIRC_ARRCO: {
    VALEUR_POINT_2026: 1.4159, // Valeur inchangée début 2026
    PRIX_ACHAT_POINT: 19.6321,
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// DISPOSITIF JEANBRUN 2026 — Nouveau statut bailleur privé
// Remplace le Pinel (expiré fin 2024)
// ══════════════════════════════════════════════════════════════════════════════

export const JEANBRUN_2026 = {
  // Durée d'engagement location
  ENGAGEMENT_LOCATION: 9, // 9 ans minimum

  // Taux d'amortissement NEUF (par catégorie de loyer)
  NEUF: {
    INTERMEDIAIRE: {
      TAUX_AMORTISSEMENT: 3.5,  // 3,5% par an
      PLAFOND_ANNUEL: 8000,     // 8 000 €/an
    },
    SOCIAL: {
      TAUX_AMORTISSEMENT: 4.5,
      PLAFOND_ANNUEL: 10000,
    },
    TRES_SOCIAL: {
      TAUX_AMORTISSEMENT: 5.5,
      PLAFOND_ANNUEL: 12000,
    },
  },

  // Taux d'amortissement ANCIEN (travaux ≥ 30% du prix)
  ANCIEN: {
    INTERMEDIAIRE: {
      TAUX_AMORTISSEMENT: 3.0,
      PLAFOND_ANNUEL: 10700,
    },
    SOCIAL: {
      TAUX_AMORTISSEMENT: 3.5,
      PLAFOND_ANNUEL: 10700,
    },
    TRES_SOCIAL: {
      TAUX_AMORTISSEMENT: 4.0,
      PLAFOND_ANNUEL: 10700,
    },
  },

  // Part terrain exclue de l'amortissement
  PART_TERRAIN: 0.20, // 20% du prix = terrain (non amortissable)
  BASE_AMORTISSABLE: 0.80, // 80% du prix

  // Conditions d'éligibilité
  CONDITIONS: {
    TYPE_BIEN: 'collectif' as const, // Uniquement immeubles collectifs
    SEUIL_TRAVAUX_ANCIEN: 0.30, // 30% du prix d'acquisition
    DPE_CIBLE: ['A', 'B'] as const, // DPE requis après travaux
    RE2020_NEUF: true,
  },

  // Plafonds loyers (décote par rapport au marché)
  DECOTE_LOYER: {
    INTERMEDIAIRE: 0.15, // -15% du marché
    SOCIAL: 0.30,        // -30% du marché
    TRES_SOCIAL: 0.45,   // -45% du marché
  },

  // Déficit foncier imputable sur revenu global
  DEFICIT_FONCIER: {
    PLAFOND_RG: 10700,
    PLAFOND_RG_RENOVATION_ENERGETIQUE: 21400,
  },

  // Pinel expiré
  PINEL_EXPIRE: true,
  PINEL_DATE_FIN: '2024-12-31',
} as const

// ══════════════════════════════════════════════════════════════════════════════
// LMNP / LMP 2026 — Maintenu (amortissement LMNP conservé)
// ══════════════════════════════════════════════════════════════════════════════

export const LMNP_2026 = {
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
  // Réintégration amortissements dans PV (LF2025, applicable 2025+)
  REINTEGRATION_AMORT_PV: true,
} as const

// ══════════════════════════════════════════════════════════════════════════════
// LOCATION NUE 2026
// ══════════════════════════════════════════════════════════════════════════════

export const LOCATION_NUE_2026 = {
  MICRO_FONCIER: {
    PLAFOND: 15000,
    ABATTEMENT: 30,
  },
  DEFICIT_FONCIER: {
    PLAFOND_IMPUTATION_RG: 10700,
    PLAFOND_IMPUTATION_RG_RENOVATION_ENERGETIQUE: 21400, // Super-déficit prolongé → 2027
    DUREE_REPORT: 10,
    ENGAGEMENT_LOCATION: 3,
  },
} as const

// ══════════════════════════════════════════════════════════════════════════════
// DÉMEMBREMENT 2026 — CGI art. 669 (barème fiscal inchangé)
// ══════════════════════════════════════════════════════════════════════════════

export const BAREME_DEMEMBREMENT_2026 = [
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

// ══════════════════════════════════════════════════════════════════════════════
// PLAFOND DES NICHES FISCALES 2026 (inchangé)
// ══════════════════════════════════════════════════════════════════════════════

export const PLAFOND_NICHES_2026 = {
  GLOBAL: 10000,
  OUTRE_MER: 18000,
  SOFICA: 18000,
} as const

// ══════════════════════════════════════════════════════════════════════════════
// MALRAUX, DENORMANDIE, MONUMENTS HISTORIQUES 2026 (inchangés)
// ══════════════════════════════════════════════════════════════════════════════

export const MALRAUX_2026 = {
  PLAFOND_TRAVAUX: 400000,
  DUREE_TRAVAUX_MAX: 4,
  TAUX_SPR: 30,
  TAUX_QAD: 22,
  ENGAGEMENT_LOCATION: 9,
  HORS_PLAFOND_NICHES: true,
} as const

export const DENORMANDIE_2026 = {
  PLAFOND_INVESTISSEMENT: 300000,
  SEUIL_TRAVAUX_POURCENTAGE: 25,
  TAUX_REDUCTION: {
    6: 12,
    9: 18,
    12: 21,
  },
} as const

export const MONUMENTS_HISTORIQUES_2026 = {
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
// SCPI 2026 (inchangé)
// ══════════════════════════════════════════════════════════════════════════════

export const SCPI_2026 = {
  DELAI_JOUISSANCE_MOYEN: 4,
  FRAIS_SOUSCRIPTION_MOYEN: 10,
  PART_REVENUS_FRANCE_DEFAULT: 60,
} as const

// ══════════════════════════════════════════════════════════════════════════════
// CAPACITÉ D'EMPRUNT 2026
// ══════════════════════════════════════════════════════════════════════════════

export const EMPRUNT_2026 = {
  TAUX_ENDETTEMENT_MAX: 0.35, // HCSF : 35%
  DUREE_MAX: 25, // ans
  DUREE_MAX_NEUF: 27, // ans (VEFA)
} as const

// ══════════════════════════════════════════════════════════════════════════════
// ANNÉE FISCALE
// ══════════════════════════════════════════════════════════════════════════════

export const ANNEE_FISCALE = 2026
export const ANNEE_REVENUS = 2025
