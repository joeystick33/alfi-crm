/**
 * PARAMÈTRES PRÉVOYANCE TNS 2026
 * 
 * Données officielles 2026 — dérivées de RULES.prevoyance_retraite
 * Source : fiscal-rules-prevoyance-data.ts (URSSAF, CNAVPL, caisses PL)
 * 
 * Mis à jour : 06/03/2026
 */

import { RULES } from '@/app/_common/lib/rules/fiscal-rules'
import {
  CAISSES_AVEC_CPAM,
  CAISSES_REGIME_SPECIFIQUE,
} from './parameters-prevoyance-2025'

const PR = RULES.prevoyance_retraite

// ============================================================================
// PLAFOND SÉCURITÉ SOCIALE 2026 — Source : RULES.retraite
// ============================================================================
export const PASS_2026 = RULES.retraite.pass
export const PASS_MENSUEL_2026 = RULES.retraite.pmss
export const PASS_JOURNALIER_2026 = Math.round(RULES.retraite.pass / 365 * 1.42)

// ============================================================================
// RÉGIME COMMUN CNAVPL - CPAM 2026 — Source : RULES.prevoyance_retraite.prevoyance_cpam
// ============================================================================
export const CPAM_2026 = {
  ijMin: Math.round(PASS_2026 * 0.40 / 730 * 100) / 100,
  ijMax: Math.round(PASS_2026 * 3.0 / 730 * 100) / 100,
  seuilMinPass: 0.40,
  seuilMaxPass: 3.0,
  carenceJours: PR.prevoyance_cpam.ij_maladie.delai_carence_jours,
  debutVersement: 4,
  finVersement: 90,
  dureeMaxJours: 87,
  formule: '1/730e du RAAM (3 dernières années)',
}

// ============================================================================
// SSI 2026 — Source : RULES.prevoyance_retraite.prevoyance_tns
// ============================================================================
export const SSI_2026 = {
  ij: {
    formule: PR.prevoyance_tns.ij_maladie.base_calcul,
    plafondRevenu: PR.prevoyance_tns.ij_maladie.plafond_pass,
    max: Math.round((PASS_2026 / 730) * 100) / 100,
    conjointCollaborateur: Math.round((PASS_2026 / 730 / 2) * 100) / 100,
    carenceJours: PR.prevoyance_tns.ij_maladie.delai_carence_jours,
    dureeMaxJours: 360,
    periodeTroisAns: true,
  },
  invalidite: {
    categorie1: {
      taux: PR.prevoyance_tns.invalidite.partielle.taux,
      description: PR.prevoyance_tns.invalidite.partielle.description,
    },
    categorie2: {
      taux: PR.prevoyance_tns.invalidite.totale.taux,
      plafondAnnuel: PR.prevoyance_tns.capital_deces.montant_base,
      description: PR.prevoyance_tns.invalidite.totale.description,
    },
  },
  deces: {
    capitalBase: PR.prevoyance_tns.capital_deces.montant_base,
    description: PR.prevoyance_tns.capital_deces.description,
  },
}

// ============================================================================
// MSA 2026 — montants revalorisés (pas de données centralisées MSA dans RULES)
// ============================================================================
export const MSA_2026 = {
  ij: {
    montantForfaitaire: 35.08,
    carenceJours: 4,
    carenceHospitalisation: 3,
    dureeMaxMois: 36,
    dureeMaxJours: 360,
  },
  invalidite: {
    description: 'Pension AMEXA proportionnelle aux revenus antérieurs',
  },
  deces: {
    capitalForfaitaire: PR.prevoyance_cpam.capital_deces.montant_forfaitaire,
    description: 'Capital décès forfaitaire',
  },
}

// ============================================================================
// CARMF 2026 — Source : RULES.prevoyance_retraite.caisses_pl.CARMF
// ============================================================================
const _carmf = PR.caisses_pl.CARMF
export const CARMF_2026 = {
  reforme2025: true,
  franchiseJours: 90,
  dureeMaxAns: 3,
  
  classeA: {
    seuilRevenuMax: PASS_2026,
    ijJour: Math.round((PASS_2026 / 730) * 100) / 100,
    invaliditeAnnuelle: 23662,
    deces: 60000,
  },
  
  classeB: {
    seuilRevenuMin: PASS_2026,
    seuilRevenuMax: PASS_2026 * 3,
    ijFormule: '1/730e du revenu N-2',
    invaliditeProportionnelle: true,
    deces: 60000,
  },
  
  classeC: {
    seuilRevenuMin: PASS_2026 * 3,
    ijJour: Math.round((PASS_2026 * 3 / 730) * 100) / 100,
    invaliditeAnnuelle: 31549,
    deces: 60000,
  },
  
  classeD: null,
  decesDoublementAccident: false,
  
  // Données complémentaires RC/ASV depuis RULES
  rc_valeur_point: _carmf.retraite_complementaire.valeur_point_service,
  rc_taux_cotisation: _carmf.retraite_complementaire.taux_cotisation,
  asv_valeur_point: _carmf.asv?.valeur_point_service,
  asv_cotisation_forfaitaire: _carmf.asv?.cotisation_forfaitaire,
}

// ============================================================================
// CAVEC 2026 — Source : RULES.prevoyance_retraite.caisses_pl.CAVEC
// ============================================================================
const _cavec = PR.caisses_pl.CAVEC
export const CAVEC_2026 = {
  ij: {
    tauxUnique: true,
    montantJour: _cavec.invalidite_deces.ij_montant ?? 130,
    debutVersement: _cavec.invalidite_deces.ij_debut_jour ?? 91,
    dureeMaxMois: 36,
    dureeMaxJours: _cavec.invalidite_deces.ij_duree_max_jours ?? 1095,
  },
  invalidite: {
    commissionInaptitude: true,
    proportionnelCotisations: true,
    pension_totale: _cavec.invalidite_deces.pension_invalidite_totale,
  },
  deces: {
    selonClasse: true,
    renteEducation: true,
    capital_max: _cavec.invalidite_deces.capital_deces_conjoint,
  },
  // Classes retraite complémentaire depuis RULES
  classes_rc: _cavec.retraite_complementaire.classes,
  valeur_point: _cavec.retraite_complementaire.valeur_point_service,
}

// ============================================================================
// CARPIMKO 2026 — Source : RULES.prevoyance_retraite.caisses_pl.CARPIMKO
// ============================================================================
const _carpimko = PR.caisses_pl.CARPIMKO
export const CARPIMKO_2026 = {
  reforme2025: true,
  franchiseJours: 90,
  dureeMaxAns: 3,
  
  // IJ depuis RULES : 55,44 €/jour à partir du 91e jour
  ij_montant_jour: _carpimko.invalidite_deces.ij_montant,
  ij_debut_jour: _carpimko.invalidite_deces.ij_debut_jour,
  
  // Invalidité/Décès depuis RULES
  invalidite_totale: _carpimko.invalidite_deces.pension_invalidite_totale,
  invalidite_partielle: _carpimko.invalidite_deces.pension_invalidite_partielle,
  capital_deces_conjoint: _carpimko.invalidite_deces.capital_deces_conjoint,
  cotisation_id: _carpimko.invalidite_deces.cotisation_forfaitaire,
  
  // RC depuis RULES
  rc_taux_cotisation: _carpimko.retraite_complementaire.taux_cotisation,
  rc_valeur_point: _carpimko.retraite_complementaire.valeur_point_service,
  
  majorations2025: {
    conjoint: { supprimee: true },
    enfant: { montantJour: 8.22, reduction: 0.50 },
    tiercePersonne: { montantAnnuel: 3084, reduction: 0.50 },
  },
  
  pacsReconnu: true,
}

// ============================================================================
// CARCDSF 2026 — Source : RULES.prevoyance_retraite.caisses_pl.CARCDSF
// ============================================================================
const _carcdsf = PR.caisses_pl.CARCDSF
export const CARCDSF_2026 = {
  tauxUniques: true,
  franchiseJours: 90,
  dureeMaxAns: 3,
  
  chirurgiensDentistes: {
    code: 'CD',
    ijJour: 113.22,
    ijAnnuel: 41325,
  },
  
  sagesFemmes: {
    code: 'SF',
    ijJour: 49.70,
    ijAnnuel: 18142,
  },
  
  // Cotisation ID depuis RULES
  cotisation_id: _carcdsf.invalidite_deces.cotisation_forfaitaire,
  rc_taux_cotisation: _carcdsf.retraite_complementaire.taux_cotisation,
  rc_valeur_point: _carcdsf.retraite_complementaire.valeur_point_service,
}

// ============================================================================
// CARPV 2026 — Source : RULES.prevoyance_retraite.caisses_pl.CARPV
// ============================================================================
const _carpv = PR.caisses_pl.CARPV
export const CARPV_2026 = {
  ijApres90Jours: false,
  rc_valeur_point: _carpv.retraite_complementaire.valeur_point_service,
  rc_classes: _carpv.retraite_complementaire.classes,
  cotisation_id: _carpv.invalidite_deces.cotisation_forfaitaire,
}

// ============================================================================
// CNBF 2026 — Source : RULES.prevoyance_retraite.caisses_pl.CNBF
// ============================================================================
const _cnbf = PR.caisses_pl.CNBF
export const CNBF_2026 = {
  structure: {
    jour0_90: {
      organisme: 'LPA ou AON',
      lpa: 'La Prévoyance des Avocats',
      aon: 'AON HEWITT (Barreau de Paris)',
    },
    jour91Plus: {
      organisme: 'CNBF',
      dureeMaxJours: 1095,
    },
  },
  invalidite: {
    temporaire: { dureeMaxJours: 1095 },
    permanente: {
      formule: '50% retraite base',
      moinsde20ans: '50% retraite base forfaitaire',
      plusde20ans: '50% retraite base proportionnelle',
      jusquAge: 62,
    },
  },
  deces: {
    capital: 50000,
    doublementAccident: false,
  },
  rc_classes: _cnbf.retraite_complementaire.classes,
  cotisation_id: _cnbf.invalidite_deces.cotisation_forfaitaire,
}

// ============================================================================
// AUTRES CAISSES 2026 — Source : RULES.prevoyance_retraite.caisses_pl
// ============================================================================
const _cavp = PR.caisses_pl.CAVP
export const CAVP_2026 = {
  rc_classes: _cavp.retraite_complementaire.classes,
  rc_valeur_point: _cavp.retraite_complementaire.valeur_point_service,
  cotisation_id: _cavp.invalidite_deces.cotisation_forfaitaire,
  reversion: _cavp.reversion,
}

const _cipav = PR.caisses_pl.CIPAV
export const CIPAV_2026 = {
  rc_valeur_point: _cipav.retraite_complementaire.valeur_point_service,
  rc_taux_cotisation: _cipav.retraite_complementaire.taux_cotisation,
  cotisation_id_taux: _cipav.invalidite_deces.taux_cotisation,
}

const _cavamac = PR.caisses_pl.CAVAMAC
export const CAVAMAC_2026 = {
  rc_valeur_point: _cavamac.retraite_complementaire.valeur_point_service,
  rc_taux_cotisation: _cavamac.retraite_complementaire.taux_cotisation,
  cotisation_id: _cavamac.invalidite_deces.cotisation_forfaitaire,
}

const _cavom = PR.caisses_pl.CAVOM
export const CAVOM_2026 = {
  rc_valeur_point: _cavom.retraite_complementaire.valeur_point_service,
  rc_taux_cotisation: _cavom.retraite_complementaire.taux_cotisation,
  ij_montant: _cavom.invalidite_deces.ij_montant,
  ij_debut_jour: _cavom.invalidite_deces.ij_debut_jour,
}

const _cprn = PR.caisses_pl.CPRN
export const CPRN_2026 = {
  rc_valeur_point: _cprn.retraite_complementaire.valeur_point_service,
  rc_classes: _cprn.retraite_complementaire.classes,
  cotisation_id: _cprn.invalidite_deces.cotisation_forfaitaire,
}

export const ENIM_2026 = {
  _specifique: true,
  _note: 'Régime ENIM spécifique — données non centralisées',
}

// ============================================================================
// FONCTIONS UTILITAIRES 2026
// ============================================================================

export function calculerIJ_CPAM_2026(revenuAnnuel: number): {
  montantJour: number
  isMinimum: boolean
  isMaximum: boolean
  estimation: boolean
} {
  const revenuPlafonne = Math.min(revenuAnnuel, PASS_2026 * CPAM_2026.seuilMaxPass)
  let montantJour = revenuPlafonne / 730
  
  let isMinimum = false
  let isMaximum = false
  
  if (revenuAnnuel < PASS_2026 * CPAM_2026.seuilMinPass) {
    montantJour = CPAM_2026.ijMin
    isMinimum = true
  }
  
  if (montantJour >= CPAM_2026.ijMax) {
    montantJour = CPAM_2026.ijMax
    isMaximum = true
  }
  
  return {
    montantJour: Math.round(montantJour * 100) / 100,
    isMinimum,
    isMaximum,
    estimation: false,
  }
}

// ============================================================================
// EXPORT PAR DÉFAUT - Configuration 2026 (ESTIMATIONS)
// ============================================================================
export const PREVOYANCE_TNS_2026 = {
  annee: 2026,
  pass: PASS_2026,
  cpam: CPAM_2026,
  caissesAvecCPAM: CAISSES_AVEC_CPAM,
  caissesRegimeSpecifique: CAISSES_REGIME_SPECIFIQUE,
  
  // Données officielles 2026 — Source : RULES.prevoyance_retraite
  
  caisses: {
    SSI: SSI_2026,
    MSA: MSA_2026,
    CIPAV: CIPAV_2026,
    CARMF: CARMF_2026,
    CAVEC: CAVEC_2026,
    CARPIMKO: CARPIMKO_2026,
    CARCDSF: CARCDSF_2026,
    CARPV: CARPV_2026,
    CAVP: CAVP_2026,
    CNBF: CNBF_2026,
    CAVAMAC: CAVAMAC_2026,
    CAVOM: CAVOM_2026,
    CPRN: CPRN_2026,
    ENIM: ENIM_2026,
  },
}

export default PREVOYANCE_TNS_2026
