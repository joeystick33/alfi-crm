/**
 * Constantes fiscales immobilier — Source unique : RULES (fiscal-rules.ts)
 * SÉCURISÉES - Côté serveur uniquement
 * 
 * Les valeurs fiscales annuelles (barème IR, PS, IFI, etc.) sont lues
 * depuis RULES et se mettent à jour automatiquement via l'admin.
 * Les constantes structurelles (LMNP, Pinel, Jeanbrun, etc.) restent ici.
 */

import { RULES } from '@/app/_common/lib/rules/fiscal-rules'

// ══════════════════════════════════════════════════════════════════════════════
// BARÈME IR — Source : RULES.ir.bareme
// ══════════════════════════════════════════════════════════════════════════════

export const BAREME_IR_2025 = RULES.ir.bareme.map(t => ({
  min: t.min,
  max: t.max,
  taux: t.taux * 100,
}))

// ══════════════════════════════════════════════════════════════════════════════
// DÉCOTE IR — Source : RULES.ir.decote
// ══════════════════════════════════════════════════════════════════════════════
export const DECOTE_IR_2025 = {
  SEUL: {
    SEUIL: RULES.ir.decote.seuil_celibataire,
    PLAFOND: RULES.ir.decote.base_celibataire,
    TAUX: RULES.ir.decote.coefficient,
  },
  COUPLE: {
    SEUIL: RULES.ir.decote.seuil_couple,
    PLAFOND: RULES.ir.decote.base_couple,
    TAUX: RULES.ir.decote.coefficient,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CEHR — Source : RULES.ir.cehr
// ══════════════════════════════════════════════════════════════════════════════
export const CEHR_2025 = {
  SEUL: RULES.ir.cehr.celibataire,
  COUPLE: RULES.ir.cehr.couple,
}

// ══════════════════════════════════════════════════════════════════════════════
// PLAFONNEMENT QUOTIENT FAMILIAL — Source : RULES.ir.quotient_familial
// ══════════════════════════════════════════════════════════════════════════════
export const PLAFOND_QF_2025 = {
  GENERAL: RULES.ir.quotient_familial.plafond_demi_part,
  PARENT_ISOLE_PREMIERE: RULES.ir.quotient_familial.demi_part_parent_isole,
  INVALIDITE: RULES.ir.quotient_familial.plafond_demi_part_invalidite,
  ANCIEN_COMBATTANT: RULES.ir.quotient_familial.plafond_demi_part_invalidite,
}

// ══════════════════════════════════════════════════════════════════════════════
// BARÈME IFI — Source : RULES.ifi
// ══════════════════════════════════════════════════════════════════════════════

export const BAREME_IFI = {
  SEUIL: RULES.ifi.seuil_assujettissement,
  ABATTEMENT_RP: RULES.ifi.abattement_rp,
  TRANCHES: RULES.ifi.bareme.map(t => ({
    min: t.min,
    max: t.max,
    taux: t.taux * 100,
  })),
  DECOTE: {
    MIN: RULES.ifi.seuil_assujettissement,
    MAX: RULES.ifi.decote.seuil,
    FORMULE: (patrimoine: number) => RULES.ifi.decote.base - RULES.ifi.decote.taux * patrimoine,
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// PRÉLÈVEMENTS SOCIAUX — Source : RULES.ps
// ══════════════════════════════════════════════════════════════════════════════

export const PRELEVEMENTS_SOCIAUX = {
  // Revenus FINANCIERS (LMNP/BIC, dividendes, PV mobilières, crypto, PEA)
  FINANCIER: {
    TAUX_GLOBAL: RULES.ps.pfu_per_2026,
    CSG: RULES.ps.csg,
  },
  // Revenus FONCIERS & PV IMMO & AV
  FONCIER: {
    TAUX_GLOBAL: RULES.ps.total,
    CSG: RULES.ps.csg,
  },
  // Valeurs communes
  CSG_DEDUCTIBLE: RULES.ps.csg_deductible,
  CRDS: RULES.ps.crds,
  PRELEVEMENT_SOLIDARITE: RULES.ps.solidarite,
}

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
  // LF2025 : réintégration des amortissements dans le calcul de la PV
  REINTEGRATION_AMORT_PV: true,
} as const

export const LMP = {
  SEUIL_RECETTES: 23000,
  // Condition LMP : recettes > 50% des revenus professionnels du foyer
  SEUIL_PART_REVENUS: 0.5,
  
  // Cotisations SSI — Source : RULES.prevoyance_retraite.cotisations_tns
  SSI: {
    // Taux global selon niveau de bénéfice (35% bas revenus → 45% hauts revenus)
    TAUX_MIN: 0.35,
    TAUX_MAX: 0.45,
    TAUX_MOYEN: 0.40,
    
    // Détail des cotisations — depuis RULES
    MALADIE_TAUX_MIN: RULES.prevoyance_retraite.cotisations_tns.maladie_maternite.taux_au_dela_3pass,
    MALADIE_TAUX_MAX: 0.25,
    RETRAITE_BASE: RULES.prevoyance_retraite.cotisations_tns.retraite_base.taux_plafonne,
    RETRAITE_COMPLEMENTAIRE_MIN: RULES.prevoyance_retraite.cotisations_tns.retraite_complementaire_rci.taux_tranche_1,
    RETRAITE_COMPLEMENTAIRE_MAX: RULES.prevoyance_retraite.cotisations_tns.retraite_complementaire_rci.taux_tranche_2,
    INVALIDITE_DECES_MIN: RULES.prevoyance_retraite.cotisations_tns.invalidite_deces.taux,
    INVALIDITE_DECES_MAX: RULES.prevoyance_retraite.cotisations_tns.invalidite_deces.taux,
    ALLOCATIONS_FAMILIALES_MIN: RULES.prevoyance_retraite.cotisations_tns.allocations_familiales.taux_normal,
    ALLOCATIONS_FAMILIALES_MAX: 0.0525,
    
    // CSG/CRDS — depuis RULES
    CSG_CRDS: RULES.prevoyance_retraite.cotisations_tns.csg_crds.csg_taux + RULES.prevoyance_retraite.cotisations_tns.csg_crds.crds_taux,
    
    // Cotisations minimales annuelles — depuis RULES
    MINIMUM_MALADIE_IJ: 9,
    MINIMUM_RETRAITE_BASE: RULES.prevoyance_retraite.cotisations_tns.cotisations_minimales.retraite_base_minimum,
    MINIMUM_INVALIDITE_DECES: RULES.prevoyance_retraite.cotisations_tns.cotisations_minimales.invalidite_deces_minimum,
    MINIMUM_CFP: RULES.prevoyance_retraite.cotisations_tns.cfp.commercant,
    MINIMUM_TOTAL: 1208,
    
    // PASS — depuis RULES
    PASS_2025: RULES.retraite.pass,
  } as const,
  
  // Exonération plus-value professionnelle (art. 151 septies CGI)
  EXONERATION_PV_PRO_SEUIL: 90000,
  EXONERATION_PV_PRO_PLAFOND: 126000,
} as const

// ══════════════════════════════════════════════════════════════════════════════
// LOCATION NUE
// ══════════════════════════════════════════════════════════════════════════════

export const LOCATION_NUE = {
  MICRO_FONCIER: {
    PLAFOND: RULES.immobilier.micro_foncier.seuil,
    ABATTEMENT: RULES.immobilier.micro_foncier.abattement * 100,
  },
  DEFICIT_FONCIER: {
    PLAFOND_IMPUTATION_RG: RULES.immobilier.deficit_foncier.plafond_imputation_revenu_global,
    PLAFOND_IMPUTATION_RG_RENOVATION_ENERGETIQUE: 21400,
    DUREE_REPORT: RULES.immobilier.deficit_foncier.report_duree_ans,
    ENGAGEMENT_LOCATION: 3,
  },
}

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

/**
 * @deprecated Pinel a expiré le 31/12/2024. Conservé pour les simulations
 * de biens acquis avant cette date. Pour les nouveaux investissements,
 * utiliser le dispositif Jeanbrun (JEANBRUN ci-dessous).
 */
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
  /** @deprecated Pinel expiré fin 2024 */
  EXPIRE: true,
} as const

// ══════════════════════════════════════════════════════════════════════════════
// DISPOSITIF JEANBRUN 2026 — Nouveau statut bailleur privé
// Remplace le Pinel. Amortissement fiscal sur revenus fonciers.
// ══════════════════════════════════════════════════════════════════════════════

export const JEANBRUN = {
  ENGAGEMENT_LOCATION: 9,
  NEUF: {
    INTERMEDIAIRE: { TAUX_AMORTISSEMENT: 3.5, PLAFOND_ANNUEL: 8000 },
    SOCIAL: { TAUX_AMORTISSEMENT: 4.5, PLAFOND_ANNUEL: 10000 },
    TRES_SOCIAL: { TAUX_AMORTISSEMENT: 5.5, PLAFOND_ANNUEL: 12000 },
  },
  ANCIEN: {
    INTERMEDIAIRE: { TAUX_AMORTISSEMENT: 3.0, PLAFOND_ANNUEL: 10700 },
    SOCIAL: { TAUX_AMORTISSEMENT: 3.5, PLAFOND_ANNUEL: 10700 },
    TRES_SOCIAL: { TAUX_AMORTISSEMENT: 4.0, PLAFOND_ANNUEL: 10700 },
  },
  PART_TERRAIN: 0.20,
  BASE_AMORTISSABLE: 0.80,
  CONDITIONS: {
    TYPE_BIEN: 'collectif' as const,
    SEUIL_TRAVAUX_ANCIEN: 0.30,
    DPE_CIBLE: ['A', 'B'] as const,
    RE2020_NEUF: true,
  },
  DECOTE_LOYER: {
    INTERMEDIAIRE: 0.15,
    SOCIAL: 0.30,
    TRES_SOCIAL: 0.45,
  },
  DEFICIT_FONCIER: {
    PLAFOND_RG: 10700,
    PLAFOND_RG_RENOVATION_ENERGETIQUE: 21400,
  },
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
  TAUX_IR: RULES.immobilier.plus_value.taux_ir * 100,
  TAUX_PS: RULES.immobilier.plus_value.taux_ps * 100,
  ABATTEMENT_IR: {
    DEBUT: 6,
    TAUX_ANNUEL_6_21: 6,      // 6% par an de l'année 6 à 21
    TAUX_ANNEE_22: 4,          // 4% la 22e année (complément → 100%)
    ANNEE_EXONERATION: 22,     // Exonération IR à 22 ans (INCHANGÉ)
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
  GLOBAL: RULES.ir.plafond_niches_fiscales,
  OUTRE_MER: RULES.ir.plafond_niches_outremer,
  SOFICA: RULES.ir.plafond_niches_outremer,
}

// ══════════════════════════════════════════════════════════════════════════════
// DÉMEMBREMENT (CGI art. 669)
// ══════════════════════════════════════════════════════════════════════════════

export const BAREME_DEMEMBREMENT = RULES.demembrement.bareme_art669.map(t => ({
  ageMax: t.age_max,
  usufruit: t.usufruit,
  nuePropriete: t.nue_propriete,
}))
