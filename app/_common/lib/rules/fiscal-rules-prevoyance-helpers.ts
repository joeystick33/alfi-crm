/**
 * HELPERS — Calculs Prévoyance & Retraite TNS / PL
 */

import { PREVOYANCE_RETRAITE } from './fiscal-rules-prevoyance-data'

/**
 * Calcule les IJ CPAM pour un salarié
 */
export function calculIJCPAM(salaireBrutMensuel: number, nombreEnfants: number): number {
  const config = PREVOYANCE_RETRAITE.prevoyance_cpam.ij_maladie
  const sjb = salaireBrutMensuel / 30
  const taux = nombreEnfants >= 3 ? config.taux_3_enfants : config.taux_normal
  return Math.min(sjb * taux, config.plafond_sjb)
}

/**
 * Calcule la cotisation retraite de base CNAVPL
 */
export function calculCotisationBaseCNAVPL(revenuProfessionnel: number): {
  tranche1: number
  tranche2: number
  total: number
  points_acquis: number
} {
  const config = PREVOYANCE_RETRAITE.retraite_base_cnavpl.cotisations
  const PASS = PREVOYANCE_RETRAITE.meta.pass_2026

  const assiette_t1 = Math.min(revenuProfessionnel, config.tranche_1_plafond)
  const assiette_t2 = Math.min(revenuProfessionnel, config.tranche_2_plafond)

  const tranche1 = assiette_t1 * config.tranche_1_taux
  const tranche2 = assiette_t2 * config.tranche_2_taux
  const total = Math.max(tranche1 + tranche2, config.cotisation_minimale)

  // Points acquis (prorata de la cotisation max)
  const cotisation_max_t1 = PASS * config.tranche_1_taux
  const cotisation_max_t2 = config.tranche_2_plafond * config.tranche_2_taux
  const points_t1 = Math.round((tranche1 / cotisation_max_t1) * config.tranche_1_points_max * 10) / 10
  const points_t2 = Math.round((tranche2 / cotisation_max_t2) * config.tranche_2_points_max * 10) / 10

  return {
    tranche1,
    tranche2,
    total,
    points_acquis: points_t1 + points_t2,
  }
}

/**
 * Calcule la pension de retraite de base CNAVPL
 */
export function calculPensionBaseCNAVPL(
  totalPoints: number,
  trimestresAcquis: number,
  trimestresRequis: number,
  age: number,
): { pension_annuelle: number; taux_liquidation: number } {
  const config = PREVOYANCE_RETRAITE.retraite_base_cnavpl.liquidation
  let taux = 1.0

  if (age >= config.age_taux_plein_auto) {
    taux = 1.0
  } else if (trimestresAcquis < trimestresRequis) {
    const manquants = trimestresRequis - trimestresAcquis
    taux = Math.max(1.0 - (manquants * config.decote_par_trimestre), 0.50)
  } else if (trimestresAcquis > trimestresRequis) {
    const supplementaires = trimestresAcquis - trimestresRequis
    taux = 1.0 + (supplementaires * config.surcote_par_trimestre)
  }

  const pension = totalPoints * PREVOYANCE_RETRAITE.retraite_base_cnavpl.valeur_point * taux
  return { pension_annuelle: Math.round(pension * 100) / 100, taux_liquidation: taux }
}

/**
 * Calcule le plafond Madelin prévoyance
 */
export function calculPlafondMadelinPrevoyance(beneficeImposable: number): number {
  const config = PREVOYANCE_RETRAITE.madelin_prevoyance.prevoyance
  const PASS = PREVOYANCE_RETRAITE.meta.pass_2026
  const montant = (beneficeImposable * config.taux_benefice) + (PASS * config.supplement_pass)
  return Math.min(montant, config.plafond_max_montant)
}

/**
 * Calcule les cotisations TNS complètes (artisan/commerçant)
 */
export function calculCotisationsTNS(revenuBrut: number): {
  assiette_sociale: number
  maladie: number
  ij: number
  retraite_base: number
  retraite_complementaire: number
  invalidite_deces: number
  allocations_familiales: number
  csg_crds: number
  cfp: number
  total: number
} {
  const config = PREVOYANCE_RETRAITE.cotisations_tns
  const PASS = PREVOYANCE_RETRAITE.meta.pass_2026

  // Nouvelle assiette 2026
  const abattement = revenuBrut * config.assiette_sociale.abattement_forfaitaire
  const plancher = PASS * config.assiette_sociale.plancher_abattement_pass
  const plafond = PASS * config.assiette_sociale.plafond_abattement_pass
  const abattement_final = Math.min(Math.max(abattement, plancher), plafond)
  const assiette = revenuBrut - abattement_final

  // Maladie-maternité (simplifié)
  const seuil_3pass = PASS * 3
  const maladie = assiette <= seuil_3pass
    ? assiette * config.maladie_maternite.taux_base
    : (seuil_3pass * config.maladie_maternite.taux_base) +
      ((assiette - seuil_3pass) * config.maladie_maternite.taux_au_dela_3pass)

  // IJ
  const ij = Math.min(assiette, PASS * config.indemnites_journalieres.plafond_pass) *
    config.indemnites_journalieres.taux

  // Retraite base
  const retraite_base = (Math.min(assiette, config.retraite_base.plafond) * config.retraite_base.taux_plafonne) +
    (assiette * config.retraite_base.taux_deplafonne)

  // Retraite complémentaire RCI
  const rc_t1 = Math.min(assiette, config.retraite_complementaire_rci.plafond_tranche_1) *
    config.retraite_complementaire_rci.taux_tranche_1
  const rc_t2 = Math.max(0, Math.min(assiette, config.retraite_complementaire_rci.plafond_tranche_2) - config.retraite_complementaire_rci.plafond_tranche_1) *
    config.retraite_complementaire_rci.taux_tranche_2
  const retraite_complementaire = rc_t1 + rc_t2

  // Invalidité-décès
  const invalidite_deces = Math.min(assiette, config.invalidite_deces.plafond) *
    config.invalidite_deces.taux

  // Allocations familiales (simplifié : taux normal)
  const allocations_familiales = assiette * config.allocations_familiales.taux_normal

  // CSG-CRDS
  const csg_crds = assiette * (config.csg_crds.csg_taux + config.csg_crds.crds_taux)

  // CFP (forfaitaire)
  const cfp = config.cfp.commercant

  const total = maladie + ij + retraite_base + retraite_complementaire +
    invalidite_deces + allocations_familiales + csg_crds + cfp

  return {
    assiette_sociale: assiette,
    maladie: Math.round(maladie),
    ij: Math.round(ij),
    retraite_base: Math.round(retraite_base),
    retraite_complementaire: Math.round(retraite_complementaire),
    invalidite_deces: Math.round(invalidite_deces),
    allocations_familiales: Math.round(allocations_familiales),
    csg_crds: Math.round(csg_crds),
    cfp,
    total: Math.round(total),
  }
}
