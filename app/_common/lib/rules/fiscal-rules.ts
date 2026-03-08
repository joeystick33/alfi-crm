import type { PrevoyanceRetraiteConfig } from './fiscal-rules-prevoyance-types'
import { PREVOYANCE_RETRAITE } from './fiscal-rules-prevoyance-data'

/**
 * =============================================================================
 * RÈGLES RÉGLEMENTAIRES CENTRALISÉES — ALFI CRM
 * =============================================================================
 *
 * ⚠️  CE FICHIER EST LE POINT UNIQUE DE VÉRITÉ POUR TOUTES LES DONNÉES
 *     RÉGLEMENTAIRES, FISCALES, SOCIALES ET FINANCIÈRES DU CRM.
 *
 * 📅 Année fiscale : 2026 (revenus 2025)
 * 📋 Version : 2026.1.0
 * 🔄 Dernière mise à jour : 06/03/2026
 *
 * Sources officielles :
 * - Loi de finances 2026 (promulguée 19/02/2026) — JORF n°0043
 * - LFSS 2026 (suspension réforme retraites)
 * - Arrêté 28/01/2026 (taux épargne réglementée)
 * - BOI-IR-LIQ-20, BOI-PAT-IFI, BOI-RPPM-RCM
 * - service-public.fr, economie.gouv.fr
 * - AGIRC-ARRCO, CNAV, URSSAF
 *
 * Pour mettre à jour :
 * 1. Modifier les valeurs dans ce fichier
 * 2. Tous les modules (tax-service, simulateurs, audit-engine, RAG) sont
 *    automatiquement impactés via les exports.
 * 3. Aucun autre fichier ne doit contenir de valeur hardcodée.
 *
 * =============================================================================
 */

// =============================================================================
// TYPES
// =============================================================================

export interface Tranche {
  min: number
  max: number
  taux: number
}

export interface TrancheLimit {
  limit: number
  rate: number
}

export interface DecoteConfig {
  seuil_celibataire: number
  seuil_couple: number
  base_celibataire: number
  base_couple: number
  coefficient: number
}

export interface QuotientFamilialConfig {
  plafond_demi_part: number
  plafond_quart_part: number
  demi_part_parent_isole: number
  plafond_demi_part_invalidite: number
}

export interface CEHRConfig {
  celibataire: Tranche[]
  couple: Tranche[]
}

export interface CDHRConfig {
  taux_minimum: number
  seuil_celibataire: number
  seuil_couple: number
  description: string
}

export interface IRConfig {
  bareme: Tranche[]
  decote: DecoteConfig
  quotient_familial: QuotientFamilialConfig
  cehr: CEHRConfig
  cdhr: CDHRConfig
  plafond_niches_fiscales: number
  plafond_niches_outremer: number
  abattement_10pct_salaires: { taux: number; plancher: number; plafond: number }
  abattement_65ans: { montant_1: number; montant_2: number; seuil_1: number; seuil_2: number }
}

export interface IFIConfig {
  seuil_assujettissement: number
  seuil_debut_taxation: number
  bareme: Tranche[]
  decote: { seuil: number; base: number; taux: number }
  abattement_rp: number
}

export interface PSConfig {
  csg: number
  crds: number
  solidarite: number
  total: number
  csg_deductible: number
  pfu_ir: number
  pfu_total: number
  pfu_per_2026: number
}

export interface PERConfig {
  plafond_taux: number
  plafond_max_salarie: number
  plancher_salarie: number
  report_annees: number
  mutualisation_conjoint: boolean
  tns: {
    taux_base: number
    taux_additionnel: number
    plafond_base: number
    plafond_additionnel: number
    plafond_max: number
    plancher: number
  }
  age_max_deduction: number | null
  flat_tax_interets: number
}

export interface AssuranceVieRachatConfig {
  pfu_ir: number
  pfl_moins_4ans: number
  pfl_4_8ans: number
  taux_reduit_8ans: number
  abattement_celibataire_8ans: number
  abattement_couple_8ans: number
  seuil_primes_150k: number
}

export interface AssuranceVieDecesConfig {
  abattement_990i: number
  taux_990i_1: number
  taux_990i_2: number
  seuil_990i: number
  abattement_757b: number
}

export interface SuccessionConfig {
  bareme_ligne_directe: Tranche[]
  bareme_freres_soeurs: Tranche[]
  bareme_autres_parents: Tranche[]
  bareme_non_parents: Tranche[]
  abattements: {
    enfant: number
    petit_enfant: number
    arriere_petit_enfant: number
    frere_soeur: number
    neveu_niece: number
    handicape: number
    conjoint: number
    tiers: number
  }
  delai_rappel_fiscal: number
  exoneration_conjoint: boolean
}

export interface DonationConfig {
  abattement_don_familial_especes: number
  age_max_donateur: number
  age_min_donataire: number
  reduction_coluche_2026: number
  reduction_coluche_standard: number
  dutreil: {
    exoneration_taux: number
    engagement_collectif_duree: number
    engagement_individuel_duree: number
  }
}

export interface DemembrementConfig {
  bareme_art669: { age_max: number; usufruit: number; nue_propriete: number }[]
}

export interface ImmobilierConfig {
  taux_credit_moyen: {
    duree_10: number
    duree_15: number
    duree_20: number
    duree_25: number
  }
  frais_notaire: {
    ancien: number
    neuf: number
  }
  plus_value: {
    abattement_rp: number
    seuil_exoneration_montant: number
    abattement_duree_ir: { annees: number; taux: number }[]
    abattement_duree_ps: { annees: number; taux: number }[]
    taux_ir: number
    taux_ps: number
    surtaxe: Tranche[]
  }
  hcsf: {
    taux_endettement_max: number
    duree_max_ans: number
  }
  dispositifs: {
    nom: string
    actif: boolean
    description: string
    conditions: string
    avantage: string
    date_fin: string | null
    reference_legale: string
  }[]
  deficit_foncier: {
    plafond_imputation_revenu_global: number
    report_duree_ans: number
  }
  micro_foncier: {
    seuil: number
    abattement: number
  }
}

export interface TauxPlacementConfig {
  livret_a: number
  ldds: number
  lep: number
  pel_ouverture_2026: number
  cel: number
  livret_jeune_min: number
  fonds_euros_moyen: number
  scpi_rendement_moyen: number
  date_effet: string
  prochaine_revision: string
}

export interface RetraiteConfig {
  pass: number
  pass_n_moins_1: number
  pmss: number
  smic_mensuel_brut: number
  smic_horaire: number
  regime_base: {
    taux_plein: number
    decote_par_trimestre: number
    decote_max: number
    surcote_par_trimestre: number
    annees_sam: number
    age_legal: number
    age_taux_plein_auto: number
    suspension_reforme: boolean
    date_fin_suspension: string
  }
  trimestres_requis: Record<number, number>
  age_legal_par_generation: Record<number, number>
  agirc_arrco: {
    valeur_point: number
    prix_achat_point: number
    taux_acquisition: number
    taux_cotisation_salarie: number
    taux_cotisation_employeur: number
    plafond_t1: number
    plafond_t2: number
    coef_solidarite_malus: number
    duree_malus_annees: number
    bonus_report: { annees: number; coefficient: number }[]
    majoration_enfants: number
    plafond_majoration_enfants: number
  }
  prelevements_pensions: {
    csg_normal: number
    csg_median: number
    csg_reduit: number
    crds: number
    casa: number
  }
}

export interface SocialConfig {
  charges_salariales_moyen: number
  charges_patronales_moyen: number
  abondement_max_per: number
}

export interface OptimisationConfig {
  nom: string
  actif: boolean
  plafond: number | null
  taux_reduction: number | null
  conditions: string
  reference_legale: string
  categorie: string
}

export interface JurisprudenceEntry {
  reference: string
  date: string
  resume: string
  impact: string
  domaine: string
}

export interface FiscalRules {
  meta: {
    annee_fiscale: number
    annee_revenus: number
    version: string
    date_mise_a_jour: string
    sources: string[]
  }
  ir: IRConfig
  ifi: IFIConfig
  ps: PSConfig
  per: PERConfig
  assurance_vie: {
    rachat: AssuranceVieRachatConfig
    deces: AssuranceVieDecesConfig
  }
  succession: SuccessionConfig
  donation: DonationConfig
  demembrement: DemembrementConfig
  immobilier: ImmobilierConfig
  placements: TauxPlacementConfig
  retraite: RetraiteConfig
  social: SocialConfig
  optimisations: OptimisationConfig[]
  jurisprudence: JurisprudenceEntry[]
  prevoyance_retraite: PrevoyanceRetraiteConfig
}

// =============================================================================
// CONFIGURATION 2026
// =============================================================================

export const RULES: FiscalRules = {

  // ===========================================================================
  // META
  // ===========================================================================
  meta: {
    annee_fiscale: 2026,
    annee_revenus: 2025,
    version: '2026.1.0',
    date_mise_a_jour: '2026-03-06',
    sources: [
      'Loi de finances 2026 (promulguée 19/02/2026, JORF n°0043)',
      'LFSS 2026 (suspension réforme retraites)',
      'Arrêté 28/01/2026 (taux épargne réglementée 01/02/2026)',
      'Arrêté 22/12/2025 (PASS 2026)',
      'BOI-IR-LIQ-20 (barème IR)',
      'BOI-PAT-IFI (IFI)',
      'BOI-RPPM-RCM (PFU, AV)',
      'Art. 669 CGI (démembrement)',
      'Art. 779-790 CGI (succession/donation)',
      'Art. 990 I / 757 B CGI (AV décès)',
      'Art. 163 quatervicies CGI (PER salarié)',
      'Art. 154 bis CGI (PER TNS)',
      'CNAV / AGIRC-ARRCO / URSSAF',
    ],
  },

  // ===========================================================================
  // IMPÔT SUR LE REVENU — Barème 2026 (revenus 2025)
  // Revalorisation +0,9% (inflation)
  // Source : economie.gouv.fr
  // ===========================================================================
  ir: {
    bareme: [
      { min: 0,      max: 11600,   taux: 0.00 },
      { min: 11600,  max: 29579,   taux: 0.11 },
      { min: 29579,  max: 84577,   taux: 0.30 },
      { min: 84577,  max: 181917,  taux: 0.41 },
      { min: 181917, max: Infinity, taux: 0.45 },
    ],

    // Décote 2026 (revenus 2025)
    // Source: economie.gouv.fr — décote pour revenus modestes
    decote: {
      seuil_celibataire: 1982,    // Seuil IR brut max pour bénéficier de la décote
      seuil_couple: 3277,
      base_celibataire: 897,      // Somme forfaitaire
      base_couple: 1483,
      coefficient: 0.4525,        // 45,25%
    },

    // Quotient familial — Plafonnement
    quotient_familial: {
      plafond_demi_part: 1807,    // Avantage max par demi-part supplémentaire
      plafond_quart_part: 904,
      demi_part_parent_isole: 4149, // Plafond spécifique parent isolé
      plafond_demi_part_invalidite: 3598, // Demi-part invalidité / ancien combattant
    },

    // CEHR — Contribution Exceptionnelle Hauts Revenus (CGI art. 223 sexies)
    cehr: {
      celibataire: [
        { min: 0,      max: 250000,  taux: 0.00 },
        { min: 250000, max: 500000,  taux: 0.03 },
        { min: 500000, max: Infinity, taux: 0.04 },
      ],
      couple: [
        { min: 0,       max: 500000,   taux: 0.00 },
        { min: 500000,  max: 1000000,  taux: 0.03 },
        { min: 1000000, max: Infinity,  taux: 0.04 },
      ],
    },

    // CDHR — Contribution Différentielle Hauts Revenus (LF 2025, reconduite LF 2026)
    // Garantit un taux d'imposition minimum de 20%
    cdhr: {
      taux_minimum: 0.20,
      seuil_celibataire: 250000,
      seuil_couple: 500000,
      description: 'Garantit un taux d\'imposition minimum de 20% pour les foyers fiscaux les plus aisés. Reconduite jusqu\'à ce que le déficit public soit inférieur à 3% du PIB.',
    },

    plafond_niches_fiscales: 10000,
    plafond_niches_outremer: 18000,

    // Abattement 10% sur salaires
    abattement_10pct_salaires: {
      taux: 0.10,
      plancher: 495,    // Minimum déductible (revalorisé +0.9%)
      plafond: 14171,   // Maximum déductible (revalorisé +0.9%)
    },

    // Abattement spécifique pour les + de 65 ans (maintenu par LF 2026)
    abattement_65ans: {
      montant_1: 2746,   // RNI < seuil_1
      montant_2: 1373,   // RNI entre seuil_1 et seuil_2
      seuil_1: 17200,
      seuil_2: 27670,
    },
  },

  // ===========================================================================
  // IFI — Impôt Fortune Immobilière (CGI art. 977 et suivants)
  // Inchangé en 2026
  // ===========================================================================
  ifi: {
    seuil_assujettissement: 1300000,
    seuil_debut_taxation: 800000,
    bareme: [
      { min: 0,        max: 800000,    taux: 0.0000 },
      { min: 800000,   max: 1300000,   taux: 0.0050 },
      { min: 1300000,  max: 2570000,   taux: 0.0070 },
      { min: 2570000,  max: 5000000,   taux: 0.0100 },
      { min: 5000000,  max: 10000000,  taux: 0.0125 },
      { min: 10000000, max: Infinity,   taux: 0.0150 },
    ],
    decote: {
      seuil: 1400000,
      base: 17500,
      taux: 0.0125,
    },
    abattement_rp: 0.30,
  },

  // ===========================================================================
  // PRÉLÈVEMENTS SOCIAUX
  // CSG augmentée sur PER (LFSS 2026) → flat tax PER = 31.4%
  // ===========================================================================
  ps: {
    csg: 0.092,
    crds: 0.005,
    solidarite: 0.075,
    total: 0.172,
    csg_deductible: 0.068,
    pfu_ir: 0.128,           // Part IR du PFU
    pfu_total: 0.30,         // PFU global (12.8% IR + 17.2% PS)
    pfu_per_2026: 0.314,     // Flat tax PER 2026 (hausse CSG sur PER)
  },

  // ===========================================================================
  // PER — Plan d'Épargne Retraite
  // LF 2026 : fin déduction versements >70 ans, report porté à 5 ans
  // ===========================================================================
  per: {
    plafond_taux: 0.10,             // 10% des revenus
    plafond_max_salarie: 38322,     // 10% de 8 PASS (8 × 48060 × 10%)
    plancher_salarie: 4806,         // 10% du PASS
    report_annees: 5,               // LF 2026 : porté de 3 à 5 ans
    mutualisation_conjoint: true,
    tns: {
      taux_base: 0.10,
      taux_additionnel: 0.15,
      plafond_base: 38322,          // 10% de 8 PASS
      plafond_additionnel: 50463,   // 15% de 7 PASS
      plafond_max: 88785,           // Base + additionnel
      plancher: 4806,               // 10% PASS
    },
    age_max_deduction: 70,          // LF 2026 : versements non déductibles après 70 ans
    flat_tax_interets: 0.314,       // LFSS 2026 : flat tax PER = 31.4%
  },

  // ===========================================================================
  // ASSURANCE-VIE
  // Inchangé en 2026 (extension IFI aux fonds euros abandonnée)
  // ===========================================================================
  assurance_vie: {
    rachat: {
      pfu_ir: 0.128,
      pfl_moins_4ans: 0.35,
      pfl_4_8ans: 0.15,
      taux_reduit_8ans: 0.075,
      abattement_celibataire_8ans: 4600,
      abattement_couple_8ans: 9200,
      seuil_primes_150k: 150000,
    },
    deces: {
      abattement_990i: 152500,
      taux_990i_1: 0.20,
      taux_990i_2: 0.3125,
      seuil_990i: 700000,
      abattement_757b: 30500,
    },
  },

  // ===========================================================================
  // SUCCESSION — DMTG (CGI art. 777 et suivants)
  // ===========================================================================
  succession: {
    bareme_ligne_directe: [
      { min: 0,       max: 8072,    taux: 0.05 },
      { min: 8072,    max: 12109,   taux: 0.10 },
      { min: 12109,   max: 15932,   taux: 0.15 },
      { min: 15932,   max: 552324,  taux: 0.20 },
      { min: 552324,  max: 902838,  taux: 0.30 },
      { min: 902838,  max: 1805677, taux: 0.40 },
      { min: 1805677, max: Infinity, taux: 0.45 },
    ],
    bareme_freres_soeurs: [
      { min: 0,     max: 24430,   taux: 0.35 },
      { min: 24430, max: Infinity, taux: 0.45 },
    ],
    bareme_autres_parents: [
      { min: 0, max: Infinity, taux: 0.55 },
    ],
    bareme_non_parents: [
      { min: 0, max: Infinity, taux: 0.60 },
    ],
    abattements: {
      enfant: 100000,
      petit_enfant: 31865,
      arriere_petit_enfant: 5310,
      frere_soeur: 15932,
      neveu_niece: 7967,
      handicape: 159325,
      conjoint: Infinity,       // Exonération totale (TEPA 2007)
      tiers: 1594,
    },
    delai_rappel_fiscal: 15,    // Années avant reconstitution abattement
    exoneration_conjoint: true,
  },

  // ===========================================================================
  // DONATION
  // LF 2026 : réduction Coluche doublée (2000€)
  // ===========================================================================
  donation: {
    abattement_don_familial_especes: 31865,
    age_max_donateur: 80,
    age_min_donataire: 18,
    reduction_coluche_2026: 2000,   // Doublé pour dons entre 01/01 et 31/12/2026
    reduction_coluche_standard: 1000,
    dutreil: {
      exoneration_taux: 0.75,
      engagement_collectif_duree: 2,
      engagement_individuel_duree: 4,
    },
  },

  // ===========================================================================
  // DÉMEMBREMENT — Art. 669 CGI
  // ===========================================================================
  demembrement: {
    bareme_art669: [
      { age_max: 21,       usufruit: 90, nue_propriete: 10 },
      { age_max: 31,       usufruit: 80, nue_propriete: 20 },
      { age_max: 41,       usufruit: 70, nue_propriete: 30 },
      { age_max: 51,       usufruit: 60, nue_propriete: 40 },
      { age_max: 61,       usufruit: 50, nue_propriete: 50 },
      { age_max: 71,       usufruit: 40, nue_propriete: 60 },
      { age_max: 81,       usufruit: 30, nue_propriete: 70 },
      { age_max: 91,       usufruit: 20, nue_propriete: 80 },
      { age_max: Infinity, usufruit: 10, nue_propriete: 90 },
    ],
  },

  // ===========================================================================
  // IMMOBILIER
  // Taux crédit mars 2026, dispositifs à jour
  // ===========================================================================
  immobilier: {
    taux_credit_moyen: {
      duree_10: 3.07,
      duree_15: 3.13,
      duree_20: 3.29,
      duree_25: 3.15,
    },

    frais_notaire: {
      ancien: 0.08,    // ~8% du prix
      neuf: 0.025,     // ~2.5% du prix
    },

    plus_value: {
      abattement_rp: 1.00,   // Exonération totale RP
      seuil_exoneration_montant: 15000,   // Exonération si prix cession < 15 000 €

      // Abattements pour durée de détention — IR
      abattement_duree_ir: [
        { annees: 5,  taux: 0.00 },    // 0% les 5 premières années
        { annees: 17, taux: 0.06 },    // 6%/an de la 6e à la 21e année
        { annees: 22, taux: 0.04 },    // 4% la 22e année
        // Exonération totale IR à partir de 22 ans
      ],
      // Abattements pour durée de détention — PS
      abattement_duree_ps: [
        { annees: 5,  taux: 0.00 },    // 0% les 5 premières années
        { annees: 21, taux: 0.0165 },  // 1.65%/an de la 6e à la 21e année
        { annees: 22, taux: 0.018 },   // 1.80% la 22e année
        { annees: 30, taux: 0.09 },    // 9%/an de la 23e à la 30e année
        // Exonération totale PS à partir de 30 ans
      ],

      taux_ir: 0.19,
      taux_ps: 0.172,

      // Surtaxe sur plus-values > 50 000 €
      surtaxe: [
        { min: 0,      max: 50000,  taux: 0.00 },
        { min: 50000,  max: 100000, taux: 0.02 },
        { min: 100000, max: 150000, taux: 0.03 },
        { min: 150000, max: 200000, taux: 0.04 },
        { min: 200000, max: 250000, taux: 0.05 },
        { min: 250000, max: Infinity, taux: 0.06 },
      ],
    },

    hcsf: {
      taux_endettement_max: 0.35,
      duree_max_ans: 25,
    },

    dispositifs: [
      {
        nom: 'Pinel / Pinel+',
        actif: false,
        description: 'Réduction IR pour investissement locatif neuf. SUPPRIMÉ depuis le 31/12/2024.',
        conditions: 'N/A — dispositif terminé',
        avantage: 'N/A',
        date_fin: '2024-12-31',
        reference_legale: 'Art. 199 novovicies CGI (abrogé)',
      },
      {
        nom: 'Denormandie',
        actif: true,
        description: 'Réduction IR pour investissement locatif dans l\'ancien avec travaux (centres-villes Action Cœur de Ville)',
        conditions: 'Travaux ≥ 25% du coût total, zones éligibles, plafonds loyers/ressources',
        avantage: 'Réduction IR 12% (6 ans), 18% (9 ans), 21% (12 ans)',
        date_fin: '2027-12-31',
        reference_legale: 'Art. 199 novovicies I bis CGI',
      },
      {
        nom: 'LMNP',
        actif: true,
        description: 'Loueur Meublé Non Professionnel — amortissement du bien et des meubles',
        conditions: 'Recettes < 23 000 €/an OU < 50% des revenus du foyer',
        avantage: 'Amortissement comptable, charges déductibles, micro-BIC 50% ou réel',
        date_fin: null,
        reference_legale: 'Art. 35 bis CGI, BOI-BIC-CHAMP-40-20',
      },
      {
        nom: 'Déficit foncier',
        actif: true,
        description: 'Imputation du déficit foncier sur le revenu global (travaux déductibles)',
        conditions: 'Location nue, régime réel, conservation du bien 3 ans après imputation',
        avantage: 'Imputation sur revenu global jusqu\'à 10 700 €/an (21 400 € pour rénovation énergétique)',
        date_fin: null,
        reference_legale: 'Art. 156-I-3° CGI',
      },
      {
        nom: 'Malraux',
        actif: true,
        description: 'Réduction IR pour restauration immobilière en secteur sauvegardé',
        conditions: 'SPR/PSMV, travaux de restauration complète, location nue 9 ans',
        avantage: 'Réduction IR 22% à 30% des travaux (plafond 400 000 € sur 4 ans)',
        date_fin: null,
        reference_legale: 'Art. 199 tervicies CGI',
      },
      {
        nom: 'Monuments historiques',
        actif: true,
        description: 'Déduction intégrale des charges et travaux sur immeubles classés',
        conditions: 'Immeuble classé ou inscrit MH, ouverture au public possible',
        avantage: 'Déduction totale des travaux du revenu global (sans plafond)',
        date_fin: null,
        reference_legale: 'Art. 156 II-1° ter CGI',
      },
      {
        nom: 'Loc\'Avantages (Cosse)',
        actif: true,
        description: 'Réduction IR pour location à loyer maîtrisé via convention ANAH',
        conditions: 'Convention ANAH, plafonds de loyers et ressources, 6 à 9 ans',
        avantage: 'Réduction IR 15% (Loc1), 35% (Loc2), 65% (intermédiation locative)',
        date_fin: null,
        reference_legale: 'Art. 199 tricies CGI',
      },
    ],

    deficit_foncier: {
      plafond_imputation_revenu_global: 10700,
      report_duree_ans: 10,
    },

    micro_foncier: {
      seuil: 15000,
      abattement: 0.30,
    },
  },

  // ===========================================================================
  // TAUX DE PLACEMENT — Mise à jour 01/02/2026
  // Source : Arrêté 28/01/2026, service-public.fr
  // ===========================================================================
  placements: {
    livret_a: 1.5,
    ldds: 1.5,
    lep: 2.5,
    pel_ouverture_2026: 2.0,
    cel: 1.0,
    livret_jeune_min: 1.5,
    fonds_euros_moyen: 2.5,
    scpi_rendement_moyen: 4.5,
    date_effet: '2026-02-01',
    prochaine_revision: '2026-08-01',
  },

  // ===========================================================================
  // RETRAITE — PASS 2026, suspension réforme
  // Source : Arrêté 22/12/2025, LFSS 2026, CNAV, AGIRC-ARRCO
  // ===========================================================================
  retraite: {
    pass: 48060,
    pass_n_moins_1: 47100,    // PASS 2025 (N-1), pour calcul plafonds PER
    pmss: 4005,
    smic_mensuel_brut: 1801.80,
    smic_horaire: 11.88,

    regime_base: {
      taux_plein: 0.50,
      decote_par_trimestre: 0.00625,
      decote_max: 0.25,
      surcote_par_trimestre: 0.0125,
      annees_sam: 25,
      age_legal: 62.75,       // Gelé à 62a9m (suspension réforme)
      age_taux_plein_auto: 67,
      suspension_reforme: true,
      date_fin_suspension: '2027-12-31',
    },

    trimestres_requis: {
      1958: 167, 1959: 167, 1960: 167,
      1961: 168, 1962: 169, 1963: 170, 1964: 171,
      1965: 172, 1966: 172, 1967: 172, 1968: 172,
    },

    age_legal_par_generation: {
      1960: 62, 1961: 62.25, 1962: 62.5, 1963: 62.75,
      1964: 62.75, 1965: 62.75, 1966: 62.75,
      1967: 62.75, 1968: 62.75,
    },

    agirc_arrco: {
      valeur_point: 1.4159,
      prix_achat_point: 19.6321,
      taux_acquisition: 0.0620,
      taux_cotisation_salarie: 0.0400,
      taux_cotisation_employeur: 0.0620,
      plafond_t1: 48060,      // 1 PASS
      plafond_t2: 384480,     // 8 PASS
      coef_solidarite_malus: 0.90,
      duree_malus_annees: 3,
      bonus_report: [
        { annees: 1, coefficient: 1.10 },
        { annees: 2, coefficient: 1.20 },
        { annees: 3, coefficient: 1.30 },
      ],
      majoration_enfants: 1.10,
      plafond_majoration_enfants: 2221.34,
    },

    prelevements_pensions: {
      csg_normal: 0.083,
      csg_median: 0.066,
      csg_reduit: 0.038,
      crds: 0.005,
      casa: 0.003,
    },
  },

  // ===========================================================================
  // SOCIAL
  // ===========================================================================
  social: {
    charges_salariales_moyen: 0.22,
    charges_patronales_moyen: 0.45,
    abondement_max_per: 7686,   // 16% PASS
  },

  // ===========================================================================
  // OPTIMISATIONS FISCALES ACTIVES EN 2026
  // ===========================================================================
  optimisations: [
    {
      nom: 'PER — Déduction versements',
      actif: true,
      plafond: 38322,
      taux_reduction: null,
      conditions: 'Versements déductibles du revenu imposable. Non déductible après 70 ans (LF 2026). Report sur 5 ans.',
      reference_legale: 'Art. 163 quatervicies CGI',
      categorie: 'RETRAITE',
    },
    {
      nom: 'Dons aux associations (Coluche)',
      actif: true,
      plafond: 2000,     // Doublé en 2026
      taux_reduction: 0.75,
      conditions: 'Dons aux organismes d\'aide aux personnes en difficulté. Plafond doublé à 2000€ pour 2026.',
      reference_legale: 'Art. 200 CGI, LF 2026',
      categorie: 'DONS',
    },
    {
      nom: 'Dons aux associations (intérêt général)',
      actif: true,
      plafond: null,      // 20% du revenu imposable
      taux_reduction: 0.66,
      conditions: 'Dons aux organismes d\'intérêt général ou reconnus d\'utilité publique. Plafonné à 20% du revenu imposable.',
      reference_legale: 'Art. 200 CGI',
      categorie: 'DONS',
    },
    {
      nom: 'Emploi à domicile',
      actif: true,
      plafond: 12000,
      taux_reduction: 0.50,
      conditions: 'Crédit d\'impôt 50% des dépenses. Majoré de 1500€ par enfant à charge ou membre du foyer >65 ans. Plafond max 15000€.',
      reference_legale: 'Art. 199 sexdecies CGI',
      categorie: 'SERVICES',
    },
    {
      nom: 'Investissement PME (IR-PME / Madelin)',
      actif: true,
      plafond: 50000,
      taux_reduction: 0.18,
      conditions: 'Souscription au capital de PME. Réduction IR 18% (25% temporairement si prorogé). Conservation 5 ans min.',
      reference_legale: 'Art. 199 terdecies-0 A CGI',
      categorie: 'INVESTISSEMENT',
    },
    {
      nom: 'FIP/FCPI',
      actif: true,
      plafond: 12000,
      taux_reduction: 0.18,
      conditions: 'Fonds d\'investissement de proximité ou FCPI. Réduction IR 18%. Conservation 5 ans min. Risque de perte en capital.',
      reference_legale: 'Art. 199 terdecies-0 A CGI',
      categorie: 'INVESTISSEMENT',
    },
    {
      nom: 'SOFICA',
      actif: true,
      plafond: 18000,
      taux_reduction: 0.48,
      conditions: 'Investissement cinéma/audiovisuel. Réduction IR 30% à 48%. Hors plafond global des niches fiscales.',
      reference_legale: 'Art. 199 unvicies CGI',
      categorie: 'INVESTISSEMENT',
    },
    {
      nom: 'Déficit foncier',
      actif: true,
      plafond: 10700,
      taux_reduction: null,
      conditions: 'Imputation sur revenu global limité à 10 700€/an. 21 400€ pour travaux de rénovation énergétique. Report 10 ans.',
      reference_legale: 'Art. 156-I-3° CGI',
      categorie: 'IMMOBILIER',
    },
    {
      nom: 'Girardin industriel',
      actif: true,
      plafond: 40909,
      taux_reduction: 1.10,
      conditions: 'Investissement productif outre-mer. Réduction IR one-shot 110-120% du montant investi. Hors plafond global niches.',
      reference_legale: 'Art. 199 undecies B CGI',
      categorie: 'INVESTISSEMENT',
    },
  ],

  // ===========================================================================
  // JURISPRUDENCE & POSITIONS DOCTRINALES CLÉS
  // ===========================================================================
  jurisprudence: [
    {
      reference: 'CE, 10/02/2023, n°461198',
      date: '2023-02-10',
      resume: 'Le Conseil d\'État confirme que les SCPI ne sont pas des biens immobiliers au sens de l\'IFI mais des parts de sociétés à prépondérance immobilière.',
      impact: 'Les SCPI restent dans l\'assiette IFI mais selon la valeur des actifs immobiliers de la société, pas la valeur de marché de la part.',
      domaine: 'IFI',
    },
    {
      reference: 'Cass. Com., 15/03/2023, n°21-20.312',
      date: '2023-03-15',
      resume: 'Qualification d\'abus de droit pour démembrement de propriété avec réserve d\'usufruit suivi d\'une donation de la nue-propriété quand le donateur est très âgé et le bien est cédé peu après.',
      impact: 'Vigilance renforcée sur les démembrements tardifs. L\'administration peut requalifier si l\'opération n\'a pas de substance économique.',
      domaine: 'SUCCESSION',
    },
    {
      reference: 'BOI-RPPM-RCM-10-10-80 du 20/12/2024',
      date: '2024-12-20',
      resume: 'Précisions sur le PFU : les contribuables peuvent opter pour le barème progressif globalement pour tous les revenus de capitaux mobiliers et plus-values de l\'année.',
      impact: 'L\'option pour le barème est irrévocable et globale. Analyse au cas par cas nécessaire selon la TMI.',
      domaine: 'PFU',
    },
    {
      reference: 'Loi n°2025-1403 du 30/12/2025 (LFSS 2026)',
      date: '2025-12-30',
      resume: 'Suspension de la réforme des retraites de 2023. L\'âge légal de départ est gelé à 62 ans et 9 mois jusqu\'au 31/12/2027.',
      impact: 'Les trimestres requis sont également gelés. La montée progressive vers 64 ans est suspendue.',
      domaine: 'RETRAITE',
    },
    {
      reference: 'LF 2026, art. 28',
      date: '2026-02-19',
      resume: 'Fin de la déductibilité des versements PER après 70 ans. Objectif : recentrer le PER sur son objectif de financement de la retraite.',
      impact: 'Les versements effectués après 70 ans ne sont plus déductibles du revenu imposable. Impact majeur sur les stratégies de transmission via PER.',
      domaine: 'PER',
    },
    {
      reference: 'LF 2026, art. 15',
      date: '2026-02-19',
      resume: 'Doublement du plafond de la réduction d\'impôt Coluche à 2000€ pour les dons effectués en 2026.',
      impact: 'Les contribuables peuvent bénéficier d\'une réduction d\'impôt de 75% sur les dons jusqu\'à 2000€ (au lieu de 1000€) aux organismes d\'aide aux personnes en difficulté.',
      domaine: 'DONS',
    },
    {
      reference: 'LFSS 2026, art. 12',
      date: '2025-12-30',
      resume: 'Hausse de la CSG sur les intérêts de PER. La flat tax sur les intérêts de PER passe de 30% à 31.4%.',
      impact: 'Impact sur le rendement net des PER. Les fonds en euros d\'assurance-vie sont épargnés par cette hausse.',
      domaine: 'PER',
    },
  ],

  // ===========================================================================
  // PRÉVOYANCE & RETRAITE TNS / PROFESSIONS LIBÉRALES
  // Importé depuis fiscal-rules-prevoyance-data.ts
  // ===========================================================================
  prevoyance_retraite: PREVOYANCE_RETRAITE,
}

// =============================================================================
// EXPORTS DE COMPATIBILITÉ
// Permet aux anciens modules de continuer à fonctionner sans modification
// immédiate. À terme, tous les consommateurs importeront directement RULES.
// =============================================================================

/** Barème IR 2026 — Format compatible avec parameters.ts */
export const BAREME_IR = RULES.ir.bareme

/** Barème IR — Format limit/rate pour tax-service.ts */
export const TAX_BRACKETS = RULES.ir.bareme.map(t => ({
  limit: t.max,
  rate: t.taux,
}))

/** Barème IFI — Format compatible */
export const IFI_BRACKETS = RULES.ifi.bareme

/** Seuil IFI */
export const IFI_THRESHOLD = RULES.ifi.seuil_assujettissement
export const IFI_FRANCHISE_MIN = RULES.ifi.seuil_debut_taxation

/** PS */
export const SOCIAL_CONTRIBUTIONS_RATE = RULES.ps.total

/** Constantes IR */
export const TAX_CONSTANTS = {
  RP_ABATEMENT_IFI: RULES.ifi.abattement_rp,
  DECOTE_CELIBATAIRE: RULES.ir.decote.seuil_celibataire,
  DECOTE_COUPLE: RULES.ir.decote.seuil_couple,
  DECOTE_BASE_CELIBATAIRE: RULES.ir.decote.base_celibataire,
  DECOTE_BASE_COUPLE: RULES.ir.decote.base_couple,
  DECOTE_COEFFICIENT: RULES.ir.decote.coefficient,
} as const

/** PASS */
export const PASS = RULES.retraite.pass

/** Abattements succession */
export const ABATTEMENTS_SUCCESSION = RULES.succession.abattements

/** Barème succession ligne directe */
export const BAREME_SUCCESSION_LIGNE_DIRECTE = RULES.succession.bareme_ligne_directe

/** Barème démembrement */
export const BAREME_DEMEMBREMENT = RULES.demembrement.bareme_art669

/** AV Rachat */
export const ASSURANCE_VIE_RACHAT = RULES.assurance_vie.rachat
export const ASSURANCE_VIE_DECES = RULES.assurance_vie.deces

/** CEHR */
export const CEHR = RULES.ir.cehr

/** Prélèvements sociaux */
export const PRELEVEMENTS_SOCIAUX = {
  CSG: RULES.ps.csg,
  CRDS: RULES.ps.crds,
  SOLIDARITE: RULES.ps.solidarite,
  TOTAL: RULES.ps.total,
  CSG_DEDUCTIBLE: RULES.ps.csg_deductible,
}

/** PER — Plafonds */
export const PLAFONDS_EPARGNE_RETRAITE = {
  PASS: RULES.retraite.pass,
  PLANCHER: RULES.per.plancher_salarie,
  PLAFOND_MAX: RULES.per.plafond_max_salarie,
  ANNEES_REPORT: RULES.per.report_annees,
  MUTUALISATION_CONJOINT: RULES.per.mutualisation_conjoint,
}

export const PER_TNS = RULES.per.tns

/** Taux immobilier */
export const TAUX_CREDIT_IMMOBILIER = RULES.immobilier.taux_credit_moyen

/** Taux placements */
export const TAUX_PLACEMENTS = RULES.placements

/** Dispositifs immobiliers */
export const DISPOSITIFS_IMMOBILIER = RULES.immobilier.dispositifs

/** HCSF */
export const HCSF = RULES.immobilier.hcsf

/** Prévoyance & Retraite TNS / PL */
export { PREVOYANCE_RETRAITE }
export type { PrevoyanceRetraiteConfig }
export { calculIJCPAM, calculCotisationBaseCNAVPL, calculPensionBaseCNAVPL, calculPlafondMadelinPrevoyance, calculCotisationsTNS } from './fiscal-rules-prevoyance-helpers'
export type { PrevoyanceCPAMConfig, PrevoyanceTNSConfig, MadelinPrevoyanceConfig, CotisationsTNSConfig, RetraiteBaseCNAVPLConfig, CaissePLConfig } from './fiscal-rules-prevoyance-types'

// =============================================================================
// PATCH DYNAMIQUE — Permet de muter RULES en mémoire via les surcharges admin
// Appelé par fiscal-rules-admin.ts après écriture des overrides JSON
// =============================================================================

function deepMergeInPlace(target: Record<string, unknown>, source: Record<string, unknown>): void {
  for (const key of Object.keys(source)) {
    if (key === '_meta') continue
    const sv = source[key]
    const tv = target[key]
    if (
      sv !== null && typeof sv === 'object' && !Array.isArray(sv) &&
      tv !== null && typeof tv === 'object' && !Array.isArray(tv)
    ) {
      deepMergeInPlace(tv as Record<string, unknown>, sv as Record<string, unknown>)
    } else {
      target[key] = sv
    }
  }
}

/**
 * Applique des surcharges directement sur l'objet RULES en mémoire.
 * Tous les modules qui importent RULES verront immédiatement les nouvelles valeurs
 * (car ils référencent le même objet JavaScript).
 */
export function _patchRulesInPlace(overrides: Record<string, unknown>): void {
  deepMergeInPlace(RULES as unknown as Record<string, unknown>, overrides)
}

/** Flag indiquant si les overrides ont déjà été appliqués */
let _overridesApplied = false
export function _isOverridesApplied(): boolean { return _overridesApplied }
export function _setOverridesApplied(v: boolean): void { _overridesApplied = v }

export default RULES
