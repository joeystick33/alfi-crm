/**
 * PARAMÈTRES PRÉVOYANCE TNS 2026
 * 
 * ATTENTION : Fichier préparatoire - À METTRE À JOUR avec les données officielles
 * publiées fin 2025 / début 2026 par chaque caisse.
 * 
 * Source PASS 2026 : Bulletin officiel de la Sécurité sociale du 21 octobre 2025
 * https://www.service-public.gouv.fr/particuliers/actualites/A15386
 * 
 * Mis à jour : Décembre 2025 (préparatoire)
 */

import {
  CPAM_2025,
  CAISSES_AVEC_CPAM,
  CAISSES_REGIME_SPECIFIQUE,
} from './parameters-prevoyance-2025'

// ============================================================================
// PLAFOND SÉCURITÉ SOCIALE 2026 (OFFICIEL - +2%)
// Source: BOSS du 21 octobre 2025
// ============================================================================
export const PASS_2026 = 48060           // +2% vs 2025 (47 100 €)
export const PASS_MENSUEL_2026 = 4005    // +2% vs 2025 (3 925 €)
export const PASS_JOURNALIER_2026 = 186  // +2% vs 2025 (183 €)

// Coefficient de revalorisation 2025 → 2026
const COEF_REVAL_2026 = 1.02

// ============================================================================
// RÉGIME COMMUN CNAVPL - CPAM 2026 (estimations basées sur +2% PASS)
// À CONFIRMER avec publications officielles janvier 2026
// ============================================================================
export const CPAM_2026 = {
  // Estimations basées sur revalorisation PASS
  ijMin: Math.round(25.80 * COEF_REVAL_2026 * 100) / 100,     // ~26,32 €
  ijMax: Math.round(193.56 * COEF_REVAL_2026 * 100) / 100,    // ~197,43 €
  seuilMinPass: 0.40,     // 40% PASS = 19 224 €
  seuilMaxPass: 3.0,      // 3 PASS = 144 180 €
  carenceJours: 3,
  debutVersement: 4,
  finVersement: 90,
  dureeMaxJours: 87,
  formule: '1/730e du RAAM (3 dernières années)',
  
  // FLAG pour indiquer que ce sont des estimations
  _estimation: true,
  _aConfirmer: 'Attendre publication officielle CPAM janvier 2026',
}

// ============================================================================
// SSI 2026 (estimations)
// ============================================================================
export const SSI_2026 = {
  ij: {
    formule: '1/730e du RAAM (3 dernières années)',
    plafondRevenu: PASS_2026,
    max: Math.round((PASS_2026 / 730) * 100) / 100,  // ~65,83 €
    conjointCollaborateur: Math.round((PASS_2026 / 730 / 2) * 100) / 100, // ~32,92 €
    carenceJours: 3,
    dureeMaxJours: 360,
    periodeTroisAns: true,
  },
  invalidite: {
    categorie1: {
      taux: 0.30,
      description: 'Invalidité partielle - capacité de travail réduite',
    },
    categorie2: {
      taux: 0.50,
      plafondAnnuel: Math.round(PASS_2026 / 2), // 50% PASS = 24 030 €
      description: 'Invalidité totale - incapacité d\'exercer toute activité',
    },
  },
  deces: {
    capitalBase: Math.round(PASS_2026 * 0.20), // ~20% PASS = 9 612 €
    description: 'Capital versé au conjoint ou ayants droit',
  },
  
  _estimation: true,
}

// ============================================================================
// MSA 2026 (estimations)
// ============================================================================
export const MSA_2026 = {
  ij: {
    montantForfaitaire: Math.round(34.39 * COEF_REVAL_2026 * 100) / 100, // ~35,08 €
    carenceJours: 4,
    carenceHospitalisation: 3,
    dureeMaxMois: 36,
    dureeMaxJours: 360,
  },
  invalidite: {
    description: 'Pension AMEXA proportionnelle aux revenus antérieurs',
  },
  deces: {
    capitalForfaitaire: Math.round(3539 * COEF_REVAL_2026), // ~3 610 €
    description: 'Capital décès forfaitaire',
  },
  
  _estimation: true,
}

// ============================================================================
// CARMF 2026 (estimations post-réforme 2025)
// ============================================================================
export const CARMF_2026 = {
  reforme2025: true,
  franchiseJours: 90,
  dureeMaxAns: 3,
  
  classeA: {
    seuilRevenuMax: PASS_2026,
    ijJour: Math.round((PASS_2026 / 730) * 100) / 100,  // ~65,83 €
    invaliditeAnnuelle: Math.round(23198 * COEF_REVAL_2026), // ~23 662 €
    deces: 60000, // À confirmer si revalorisé
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
    ijJour: Math.round((PASS_2026 * 3 / 730) * 100) / 100, // ~197,48 €
    invaliditeAnnuelle: Math.round(30930 * COEF_REVAL_2026), // ~31 549 €
    deces: 60000,
  },
  
  classeD: null, // Toujours supprimée
  decesDoublementAccident: false,
  
  _estimation: true,
}

// ============================================================================
// CAVEC 2026 (estimations)
// ============================================================================
export const CAVEC_2026 = {
  ij: {
    tauxUnique: true,
    montantJour: Math.round(125 * COEF_REVAL_2026), // ~128 €
    debutVersement: 91,
    dureeMaxMois: 36,
    dureeMaxJours: 1095,
  },
  invalidite: {
    commissionInaptitude: true,
    proportionnelCotisations: true,
  },
  deces: {
    selonClasse: true,
    renteEducation: true,
  },
  
  _estimation: true,
}

// ============================================================================
// CARPIMKO 2026 (estimations post-réforme 2025)
// ============================================================================
export const CARPIMKO_2026 = {
  reforme2025: true,
  franchiseJours: 90,
  dureeMaxAns: 3,
  
  classes: [
    { classe: '1', ijJour: Math.round(33.50 * COEF_REVAL_2026 * 100) / 100, invaliditeAnnuelle: Math.round(8000 * COEF_REVAL_2026), deces: 30000 },
    { classe: '2', ijJour: Math.round(67.00 * COEF_REVAL_2026 * 100) / 100, invaliditeAnnuelle: Math.round(16000 * COEF_REVAL_2026), deces: 30000 },
    { classe: '3', ijJour: Math.round(100.50 * COEF_REVAL_2026 * 100) / 100, invaliditeAnnuelle: Math.round(24000 * COEF_REVAL_2026), deces: 30000 },
    { classe: '4', ijJour: Math.round(134.00 * COEF_REVAL_2026 * 100) / 100, invaliditeAnnuelle: Math.round(32000 * COEF_REVAL_2026), deces: 30000 },
  ],
  
  majorations2025: {
    conjoint: { supprimee: true },
    enfant: { montantJour: Math.round(8.06 * COEF_REVAL_2026 * 100) / 100, reduction: 0.50 },
    tiercePersonne: { montantAnnuel: Math.round(3024 * COEF_REVAL_2026), reduction: 0.50 },
  },
  
  pacsReconnu: true,
  
  _estimation: true,
}

// ============================================================================
// CARCDSF 2026 (estimations)
// ============================================================================
export const CARCDSF_2026 = {
  tauxUniques: true,
  franchiseJours: 90,
  dureeMaxAns: 3,
  
  chirurgiensDentistes: {
    code: 'CD',
    ijJour: Math.round(111.00 * COEF_REVAL_2026 * 100) / 100, // ~113,22 €
    ijAnnuel: Math.round(40515 * COEF_REVAL_2026),
  },
  
  sagesFemmes: {
    code: 'SF',
    ijJour: Math.round(48.73 * COEF_REVAL_2026 * 100) / 100, // ~49,70 €
    ijAnnuel: Math.round(17786.45 * COEF_REVAL_2026),
  },
  
  _estimation: true,
}

// ============================================================================
// CARPV 2026 (estimations)
// ============================================================================
export const CARPV_2026 = {
  ijApres90Jours: false,
  
  invalidite: {
    partielle: {
      minimum: Math.round(8240 * COEF_REVAL_2026),
      medium: Math.round(16480 * COEF_REVAL_2026),
      maximum: Math.round(24720 * COEF_REVAL_2026),
    },
    totale: {
      minimum: Math.round(12875 * COEF_REVAL_2026),
      medium: Math.round(25750 * COEF_REVAL_2026),
      maximum: Math.round(38625 * COEF_REVAL_2026),
    },
  },
  
  deces: {
    capital: {
      minimum: Math.round(36565 * COEF_REVAL_2026),
      medium: Math.round(73130 * COEF_REVAL_2026),
      maximum: Math.round(109695 * COEF_REVAL_2026),
    },
    renteSurvie: {
      minimum: Math.round(4635 * COEF_REVAL_2026),
      medium: Math.round(9270 * COEF_REVAL_2026),
      maximum: Math.round(13905 * COEF_REVAL_2026),
    },
    renteEducation: {
      minimum: Math.round(4120 * COEF_REVAL_2026),
      medium: Math.round(8240 * COEF_REVAL_2026),
      maximum: Math.round(12360 * COEF_REVAL_2026),
      jusquA: 21,
    },
  },
  
  _estimation: true,
}

// ============================================================================
// CNBF 2026 (estimations)
// ============================================================================
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
    capital: 50000, // À confirmer si revalorisé
    doublementAccident: false,
  },
  
  _estimation: true,
}

// ============================================================================
// AUTRES CAISSES 2026 (à confirmer)
// ============================================================================
export const CAVP_2026 = {
  _estimation: true,
  _aConfirmer: 'Attendre publication officielle CAVP',
}

export const CIPAV_2026 = {
  _estimation: true,
  _aConfirmer: 'Attendre publication officielle CIPAV',
}

export const CAVAMAC_2026 = {
  _estimation: true,
  _aConfirmer: 'Attendre publication officielle CAVAMAC',
}

export const CAVOM_2026 = {
  _estimation: true,
  _aConfirmer: 'Attendre publication officielle CAVOM',
}

export const CPRN_2026 = {
  _estimation: true,
  _aConfirmer: 'Attendre publication officielle CPRN',
}

export const ENIM_2026 = {
  _estimation: true,
  _aConfirmer: 'Attendre publication officielle ENIM',
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
    estimation: true,
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
  
  // FLAG IMPORTANT
  _estimation: true,
  _dateEstimation: '2025-12-17',
  _aConfirmer: 'Mettre à jour avec publications officielles janvier 2026',
  
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
