/**
 * TYPES — Prévoyance & Retraite TNS / Professions Libérales
 */

// ---------------------------------------------------------------------------
// PRÉVOYANCE OBLIGATOIRE — RÉGIME GÉNÉRAL (CPAM)
// ---------------------------------------------------------------------------

export interface PrevoyanceCPAMConfig {
  ij_maladie: {
    delai_carence_jours: number
    taux_normal: number
    taux_3_enfants: number
    plafond_sjb: number
    duree_max_jours: number
    duree_max_ald_jours: number
    subrogation_employeur: boolean
  }
  invalidite: {
    categorie_1: { taux: number; plafond_annuel: number; description: string }
    categorie_2: { taux: number; plafond_annuel: number; description: string }
    categorie_3: { taux: number; plafond_annuel: number; majoration_tierce_personne: number; description: string }
  }
  capital_deces: {
    montant_forfaitaire: number
    conditions: string
  }
  reversion: {
    taux: number
    age_minimum: number
    plafond_ressources_celibataire: number
    plafond_ressources_couple: number
  }
}

// ---------------------------------------------------------------------------
// PRÉVOYANCE OBLIGATOIRE — TNS / SSI
// ---------------------------------------------------------------------------

export interface PrevoyanceTNSConfig {
  ij_maladie: {
    delai_carence_jours: number
    base_calcul: string
    plafond_pass: number
    duree_max_jours: number
    cotisation_taux: number
    cotisation_plafond_pass: number
  }
  invalidite: {
    partielle: { taux: number; description: string }
    totale: { taux: number; description: string }
  }
  capital_deces: {
    montant_base: number
    description: string
  }
  cotisation_invalidite_deces: {
    taux: number
    plafond: number
  }
}

// ---------------------------------------------------------------------------
// LOI MADELIN — PLAFONDS DÉDUCTION PRÉVOYANCE TNS
// ---------------------------------------------------------------------------

export interface MadelinPrevoyanceConfig {
  prevoyance: {
    taux_benefice: number
    supplement_pass: number
    plafond_max_pass: number
    plafond_max_montant: number
  }
  sante: {
    taux_benefice: number
    supplement_pass: number
    plafond_max_pass: number
    plafond_max_montant: number
  }
  perte_emploi: {
    taux_benefice: number
    plafond_pass: number
    plafond_max_montant: number
  }
}

// ---------------------------------------------------------------------------
// COTISATIONS TNS (SSI)
// ---------------------------------------------------------------------------

export interface CotisationsTNSConfig {
  assiette_sociale: {
    abattement_forfaitaire: number
    plancher_abattement_pass: number
    plafond_abattement_pass: number
    description: string
  }
  maladie_maternite: {
    taux_base: number
    taux_au_dela_3pass: number
    description: string
  }
  indemnites_journalieres: {
    taux: number
    plafond_pass: number
  }
  retraite_base: {
    taux_plafonne: number
    plafond: number
    taux_deplafonne: number
    plafond_deplafonne: number
  }
  retraite_complementaire_rci: {
    taux_tranche_1: number
    plafond_tranche_1: number
    taux_tranche_2: number
    plafond_tranche_2: number
  }
  invalidite_deces: {
    taux: number
    plafond: number
  }
  allocations_familiales: {
    taux_normal: number
    taux_reduit: number
    seuil_reduction: number
  }
  csg_crds: {
    csg_taux: number
    crds_taux: number
    csg_deductible: number
  }
  cotisations_minimales: {
    base_maladie_ij: number
    base_retraite_invalidite: number
    retraite_base_minimum: number
    invalidite_deces_minimum: number
    ij_minimum: number
  }
  cfp: {
    artisan: number
    commercant: number
    pl_non_reglementee: number
    avec_conjoint_collaborateur: number
  }
}

// ---------------------------------------------------------------------------
// RETRAITE BASE CNAVPL
// ---------------------------------------------------------------------------

export interface RetraiteBaseCNAVPLConfig {
  cotisations: {
    tranche_1_taux: number
    tranche_1_plafond: number
    tranche_1_points_max: number
    tranche_2_taux: number
    tranche_2_plafond: number
    tranche_2_points_max: number
    cotisation_minimale: number
    assiette_forfaitaire_debut: number
    cotisation_debut: number
  }
  valeur_point: number
  liquidation: {
    decote_par_trimestre: number
    surcote_par_trimestre: number
    majoration_3_enfants: number
    age_taux_plein_auto: number
  }
  sections: string[]
}

// ---------------------------------------------------------------------------
// CAISSES COMPLÉMENTAIRES PL
// ---------------------------------------------------------------------------

export interface CaissePLConfig {
  code: string
  nom: string
  professions: string[]
  retraite_complementaire: {
    systeme: 'points' | 'classes'
    valeur_point_service: number
    taux_cotisation?: number
    plafond_cotisation?: number
    classes?: { nom: string; cotisation: number; points: number; revenus_min: number; revenus_max: number }[]
    points_max_annuel?: number
    prix_achat_point?: number
    description: string
  }
  asv?: {
    valeur_point_service: number
    cotisation_forfaitaire?: number
    taux_proportionnel_secteur_1?: number
    taux_proportionnel_secteur_2?: number
    prise_en_charge_am: number
    description: string
  }
  invalidite_deces: {
    cotisation_forfaitaire?: number
    taux_cotisation?: number
    plafond?: number
    pension_invalidite_totale: number | string
    pension_invalidite_partielle: number | string
    capital_deces_conjoint: number | string
    capital_deces_enfants?: number | string
    rente_orphelin?: number | string
    rente_conjoint?: number | string
    ij_montant?: number
    ij_debut_jour?: number
    ij_duree_max_jours?: number
    description: string
  }
  reversion: {
    taux_base: number
    taux_complementaire: number
    taux_asv?: number
    conditions: string
  }
  cumul_emploi_retraite: {
    plafond_cumul_partiel: number
    cumul_integral_conditions: string
    cotisations_generent_droits: boolean
    description: string
  }
}

// ---------------------------------------------------------------------------
// CONFIGURATION COMPLÈTE
// ---------------------------------------------------------------------------

export interface PrevoyanceRetraiteConfig {
  meta: {
    version: string
    date_mise_a_jour: string
    pass_2026: number
    sources: string[]
  }
  prevoyance_cpam: PrevoyanceCPAMConfig
  prevoyance_tns: PrevoyanceTNSConfig
  madelin_prevoyance: MadelinPrevoyanceConfig
  cotisations_tns: CotisationsTNSConfig
  retraite_base_cnavpl: RetraiteBaseCNAVPLConfig
  caisses_pl: Record<string, CaissePLConfig>
}
