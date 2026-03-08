/**
 * ══════════════════════════════════════════════════════════════════════════════
 * PARAMÈTRES FISCAUX IR — Calculateur Impôt sur le Revenu
 * ══════════════════════════════════════════════════════════════════════════════
 * 
 * Source unique de vérité : RULES (fiscal-rules.ts)
 * Période d’application : déterminée par RULES.meta (année fiscale, version)
 * Mise à jour : via l’interface admin /superadmin/fiscal-rules ou fiscal-rules.ts
 * 
 * Sources réglementaires :
 * - CGI art. 197 (barème IR)
 * - CGI art. 197 I-2° (plafonnement QF)
 * - CGI art. 200 (dons)
 * - CGI art. 199 sexdecies (emploi domicile)
 * - CGI art. 199 quater C (frais garde)
 * - CGI art. 199 terdecies-0 A (IR-PME)
 * - CGI art. 200-0 A (plafonnement niches)
 */

import { RULES } from '@/app/_common/lib/rules/fiscal-rules'

// ══════════════════════════════════════════════════════════════════════════════
// PÉRIODE D’APPLICATION — Lecture dynamique depuis RULES.meta
// ══════════════════════════════════════════════════════════════════════════════
export const PERIODE = {
  annee_fiscale: RULES.meta.annee_fiscale,
  annee_revenus: RULES.meta.annee_revenus,
  version: RULES.meta.version,
  date_maj: RULES.meta.date_mise_a_jour,
}

// ══════════════════════════════════════════════════════════════════════════════
// BARÈME IR 2025 - CGI art. 197 — Source : RULES.ir.bareme
// ══════════════════════════════════════════════════════════════════════════════
const labels = ['Non imposable', 'Tranche 11%', 'Tranche 30%', 'Tranche 41%', 'Tranche 45%']
export const BAREME_IR_2025 = RULES.ir.bareme.map((t, i) => ({
  min: t.min,
  max: t.max,
  taux: t.taux * 100,
  label: labels[i] || `Tranche ${t.taux * 100}%`,
}))

// ══════════════════════════════════════════════════════════════════════════════
// QUOTIENT FAMILIAL - CGI art. 197 I-2°
// ══════════════════════════════════════════════════════════════════════════════
export const QUOTIENT_FAMILIAL_2025 = {
  // Plafonds de l'avantage fiscal — Source : RULES.ir.quotient_familial
  PLAFOND_DEMI_PART: RULES.ir.quotient_familial.plafond_demi_part,
  PLAFOND_QUART_PART: RULES.ir.quotient_familial.plafond_quart_part,
  PLAFOND_PARENT_ISOLE: RULES.ir.quotient_familial.demi_part_parent_isole,
  PLAFOND_INVALIDITE: 3566,          // Demi-part invalidité
  PLAFOND_ANCIEN_COMBATTANT: 3566,   // Demi-part ancien combattant >74 ans
  
  // Parts selon situation
  PARTS: {
    CELIBATAIRE: 1,
    MARIE_PACSE: 2,
    VEUF_AVEC_ENFANT: 2,             // Part non plafonnée
    VEUF_SANS_ENFANT: 1,
    DIVORCE: 1,
  }
} as const

// ══════════════════════════════════════════════════════════════════════════════
// DÉCOTE - CGI art. 197 I-4°
// ══════════════════════════════════════════════════════════════════════════════
export const DECOTE_2025 = {
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
// ABATTEMENTS - CGI art. 83, 158
// ══════════════════════════════════════════════════════════════════════════════
export const ABATTEMENTS_2025 = {
  // Salaires (10%) — Source : RULES.ir.abattement_10pct_salaires
  SALAIRES: {
    TAUX: RULES.ir.abattement_10pct_salaires.taux * 100,
    MIN: RULES.ir.abattement_10pct_salaires.plancher,
    MAX: RULES.ir.abattement_10pct_salaires.plafond,
  },
  // Pensions (10%)
  PENSIONS: {
    TAUX: 10,
    MIN: 442,
    MAX: 4321,        // Par foyer
  },
  // Revenus fonciers micro
  MICRO_FONCIER: {
    TAUX: 30,
    PLAFOND_RECETTES: 15000,
  },
  // Dividendes (option barème)
  DIVIDENDES: {
    TAUX: 40,         // Abattement si option barème
  }
} as const

// ══════════════════════════════════════════════════════════════════════════════
// PLAFONNEMENT DES NICHES FISCALES - CGI art. 200-0 A
// ══════════════════════════════════════════════════════════════════════════════
export const PLAFOND_NICHES_2025 = {
  GENERAL: RULES.ir.plafond_niches_fiscales,
  MAJORE: RULES.ir.plafond_niches_outremer,
  
  // Détail des avantages entrant dans le plafond
  DANS_PLAFOND: [
    'Emploi salarié à domicile',
    'Frais de garde enfants',
    'Investissement locatif (Pinel, Denormandie...)',
    'Investissement PME/FIP/FCPI',
    'SOFICA',
    'Investissements outre-mer',
    'Dons (pour la partie réduction)',
  ],
  
  // Avantages HORS plafond
  HORS_PLAFOND: [
    'Dons aux organismes d\'aide aux personnes (75%)',
    'Frais de scolarité',
    'Intérêts d\'emprunt (anciens dispositifs)',
    'Monuments historiques',
  ]
} as const

// ══════════════════════════════════════════════════════════════════════════════
// CHARGES DÉDUCTIBLES DU REVENU GLOBAL
// ══════════════════════════════════════════════════════════════════════════════
export const CHARGES_DEDUCTIBLES_2025 = {
  // Pensions alimentaires
  PENSION_ENFANT_MAJEUR: {
    PLAFOND: 6674,                   // Par enfant majeur non rattaché
    CONDITIONS: 'Enfant majeur dans le besoin, non rattaché au foyer',
  },
  PENSION_ASCENDANT: {
    PLAFOND: null,                   // Pas de plafond si besoin justifié
    CONDITIONS: 'Parents/grands-parents dans le besoin',
  },
  
  // Épargne retraite PER - CGI art. 163 quatervicies — Source : RULES.per
  PER: {
    TAUX_PLAFOND: RULES.per.plafond_taux * 100,
    PLAFOND_ABSOLU: RULES.per.plafond_max_salarie,
    PLANCHER: RULES.per.plancher_salarie,
    PASS_2024: RULES.retraite.pass_n_moins_1,
    MUTUALISATION_COUPLE: RULES.per.mutualisation_conjoint,
    REPORT_3_ANS: true,              // Report des plafonds non utilisés
  },
  
  // CSG déductible — Source : RULES.ps
  CSG_DEDUCTIBLE: {
    TAUX: RULES.ps.csg_deductible * 100,
    CONDITIONS: 'Revenus du patrimoine de l\'année N-1',
  },
  
  // Déficit foncier — Source : RULES.immobilier.deficit_foncier
  DEFICIT_FONCIER: {
    IMPUTABLE_RG: RULES.immobilier.deficit_foncier.plafond_imputation_revenu_global,
    CONDITIONS: 'Hors intérêts d\'emprunt, reportable 10 ans',
  }
} as const

// ══════════════════════════════════════════════════════════════════════════════
// RÉDUCTIONS D'IMPÔT
// ══════════════════════════════════════════════════════════════════════════════
export const REDUCTIONS_IMPOT_2025 = {
  // ─────────────────────────────────────────────────────────────────────────────
  // DONS - CGI art. 200, 238 bis
  // ─────────────────────────────────────────────────────────────────────────────
  DONS: {
    // Dons aux organismes d'intérêt général
    INTERET_GENERAL: {
      TAUX: 66,
      PLAFOND_REVENU: 20,            // % du revenu imposable
      REPORT: 5,                      // Années de report si dépassement
      EXEMPLES: ['Associations culturelles', 'Fondations', 'Universités', 'Partis politiques'],
    },
    // Dons aux organismes d'aide aux personnes en difficulté
    AIDE_PERSONNES: {
      TAUX: 75,
      PLAFOND: 1000,                  // Plafond versement ouvrant droit à 75%
      REPORT: 5,
      EXEMPLES: ['Restos du Cœur', 'Secours Populaire', 'Croix-Rouge', 'Banques alimentaires'],
      INFO: 'Au-delà de 1 000 €, réduction à 66%',
    },
    // Dons au profit de la Fondation du patrimoine (Coluche)
    PATRIMOINE: {
      TAUX: 75,
      PLAFOND: 1000,
      CONDITIONS: 'Monuments historiques en péril',
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // INVESTISSEMENTS LOCATIFS
  // ─────────────────────────────────────────────────────────────────────────────
  INVESTISSEMENT_LOCATIF: {
    // Pinel (fin progressive 2024)
    PINEL: {
      TAUX_6_ANS: 9,
      TAUX_9_ANS: 12,
      TAUX_12_ANS: 14,
      PLAFOND_INVESTISSEMENT: 300000,
      PLAFOND_M2: 5500,
      CONDITIONS: 'Zone A, A bis, B1 - Fin au 31/12/2024',
      INFO: 'Taux réduits en 2024, dispositif terminé',
    },
    // Denormandie
    DENORMANDIE: {
      TAUX_6_ANS: 12,
      TAUX_9_ANS: 18,
      TAUX_12_ANS: 21,
      PLAFOND_INVESTISSEMENT: 300000,
      CONDITIONS: 'Centres-villes dégradés, travaux ≥25% du coût total',
    },
    // Loc'Avantages (ex-Cosse)
    LOC_AVANTAGES: {
      DEDUCTION_LOC1: 15,
      DEDUCTION_LOC2: 35,
      DEDUCTION_LOC3: 65,            // Intermédiation locative
      CONDITIONS: 'Loyer plafonné selon zone, convention ANAH',
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // INVESTISSEMENTS ENTREPRISES - CGI art. 199 terdecies-0 A
  // ─────────────────────────────────────────────────────────────────────────────
  INVESTISSEMENT_ENTREPRISE: {
    // IR-PME (Madelin)
    PME: {
      TAUX: 18,                       // 25% temporaire terminé
      PLAFOND_SEUL: 50000,
      PLAFOND_COUPLE: 100000,
      CONSERVATION: 5,                // Années minimum
      CONDITIONS: 'PME européenne <7 ans, 10 salariés min',
      INFO: 'Report 4 ans si dépassement plafond niches',
    },
    // FIP (Fonds d'Investissement de Proximité)
    FIP: {
      TAUX: 18,
      PLAFOND_SEUL: 12000,
      PLAFOND_COUPLE: 24000,
      CONSERVATION: 5,
      INFO: 'FIP Corse/Outre-mer : 30%',
    },
    // FCPI (Innovation)
    FCPI: {
      TAUX: 18,
      PLAFOND_SEUL: 12000,
      PLAFOND_COUPLE: 24000,
      CONSERVATION: 5,
    },
    // SOFICA
    SOFICA: {
      TAUX: 30,                       // Jusqu'à 48% selon conditions
      TAUX_MAJORE: 48,
      PLAFOND: 18000,
      PLAFOND_REVENU: 25,             // % du revenu net global
      CONDITIONS: 'Investissement dans le cinéma/audiovisuel',
      INFO: 'Entre dans le plafond majoré de 18 000 €',
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTRES RÉDUCTIONS
  // ─────────────────────────────────────────────────────────────────────────────
  AUTRES: {
    // Frais de scolarité - CGI art. 199 quater F
    SCOLARITE: {
      COLLEGE: 61,
      LYCEE: 153,
      SUPERIEUR: 183,
      CONDITIONS: 'Enfant à charge poursuivant des études',
      HORS_PLAFOND: true,
    },
    // Cotisations syndicales - CGI art. 199 quater C
    SYNDICAT: {
      TAUX: 66,
      PLAFOND_REVENU: 1,              // % du salaire
    },
    // Prestations compensatoires
    PRESTATION_COMPENSATOIRE: {
      TAUX: 25,
      PLAFOND: 30500,
      CONDITIONS: 'Versée en capital sur 12 mois max',
    }
  }
} as const

// ══════════════════════════════════════════════════════════════════════════════
// CRÉDITS D'IMPÔT (remboursables)
// ══════════════════════════════════════════════════════════════════════════════
export const CREDITS_IMPOT_2025 = {
  // ─────────────────────────────────────────────────────────────────────────────
  // EMPLOI À DOMICILE - CGI art. 199 sexdecies
  // ─────────────────────────────────────────────────────────────────────────────
  EMPLOI_DOMICILE: {
    TAUX: 50,
    PLAFOND_BASE: 12000,
    MAJORATION_ENFANT: 1500,          // Par enfant à charge
    MAJORATION_MAX: 15000,            // Plafond avec majorations
    PLAFOND_PREMIERE_ANNEE: 15000,    // 1ère année d'emploi
    PLAFOND_DEPENDANCE: 20000,        // Personne invalide/dépendante
    
    ACTIVITES: [
      'Garde d\'enfants',
      'Soutien scolaire',
      'Assistance aux personnes âgées',
      'Ménage, repassage',
      'Jardinage (5 000 € max)',
      'Bricolage (500 € max)',
      'Assistance informatique (3 000 € max)',
    ],
    INFO: 'Crédit d\'impôt = remboursable même si non imposable',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // FRAIS DE GARDE - CGI art. 199 quater F
  // ─────────────────────────────────────────────────────────────────────────────
  GARDE_ENFANTS: {
    TAUX: 50,
    PLAFOND_PAR_ENFANT: 3500,         // Dépenses retenues max
    CREDIT_MAX_PAR_ENFANT: 1750,      // = 3500 × 50%
    AGE_LIMITE: 6,                     // Moins de 6 ans au 1er janvier
    CONDITIONS: 'Garde hors domicile (crèche, assistante maternelle, garderie)',
    INFO: 'Si garde à domicile → crédit emploi à domicile',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // TRANSITION ÉNERGÉTIQUE (MaPrimeRénov')
  // ─────────────────────────────────────────────────────────────────────────────
  RENOVATION_ENERGETIQUE: {
    INFO: 'Remplacé par MaPrimeRénov\' depuis 2021',
    LIEN: 'https://www.maprimerenov.gouv.fr',
    RESIDUEL: 'Crédit maintenu pour travaux engagés avant 2021',
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // AUTRES CRÉDITS
  // ─────────────────────────────────────────────────────────────────────────────
  AUTRES: {
    // Intérêts d'emprunt étudiant
    EMPRUNT_ETUDIANT: {
      TAUX: 25,
      PLAFOND: 1000,                   // Intérêts retenus (seul)
      PLAFOND_COUPLE: 2000,
      DUREE: 5,                        // Premières annuités
      CONDITIONS: 'Prêt souscrit entre 2005 et 2008',
    },
    // Cotisations AGA/CGA
    COTISATION_CGA: {
      TAUX: 100,                       // Réduction = montant cotisation
      PLAFOND: 915,                    // 2/3 du plafond
    }
  }
} as const

// ══════════════════════════════════════════════════════════════════════════════
// CEHR - Contribution Exceptionnelle Hauts Revenus - CGI art. 223 sexies
// ══════════════════════════════════════════════════════════════════════════════
export const CEHR_2025 = {
  SEUL: RULES.ir.cehr.celibataire.map(t => ({ min: t.min, max: t.max, taux: t.taux * 100 })),
  COUPLE: RULES.ir.cehr.couple.map(t => ({ min: t.min, max: t.max, taux: t.taux * 100 })),
}

// ══════════════════════════════════════════════════════════════════════════════
// PFU - Prélèvement Forfaitaire Unique - CGI art. 200 A
// ══════════════════════════════════════════════════════════════════════════════
export const PFU_2025 = {
  TAUX_GLOBAL: RULES.ps.pfu_total * 100,
  TAUX_IR: RULES.ps.pfu_ir * 100,
  TAUX_PS: RULES.ps.total * 100,
  
  OPTION_BAREME: {
    INFO: 'Option pour le barème progressif possible',
    AVANTAGE_SI_TMI: 'TMI ≤ 11% (avec abattement 40% sur dividendes)',
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PRÉLÈVEMENTS SOCIAUX
// ══════════════════════════════════════════════════════════════════════════════
export const PRELEVEMENTS_SOCIAUX_2025 = {
  TAUX_GLOBAL: RULES.ps.total * 100,
  DETAIL: {
    CSG: RULES.ps.csg * 100,
    CRDS: RULES.ps.crds * 100,
    PRELEVEMENT_SOLIDARITE: RULES.ps.solidarite * 100,
  },
  CSG_DEDUCTIBLE: RULES.ps.csg_deductible * 100,
  
  APPLICATION: {
    REVENUS_PATRIMOINE: true,         // Fonciers, capitaux mobiliers, PV
    SALAIRES: false,                  // Prélevés à la source par l'employeur
    BIC_BNC: 'Selon régime',
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calcule le nombre de parts fiscales
 */
export function calculerNombreParts(params: {
  situation: 'CELIBATAIRE' | 'MARIE_PACSE' | 'DIVORCE' | 'VEUF'
  enfantsCharge: number
  enfantsGardeAlternee: number
  parentIsole: boolean
  invalidite: boolean
  invaliditeConjoint: boolean
  ancienCombattant: boolean
}): number {
  let parts = params.situation === 'CELIBATAIRE' || params.situation === 'DIVORCE' ? 1 : 2
  
  // Veuf avec enfant = 2 parts
  if (params.situation === 'VEUF' && params.enfantsCharge > 0) parts = 2
  
  // Enfants à charge
  if (params.enfantsCharge >= 1) parts += 0.5
  if (params.enfantsCharge >= 2) parts += 0.5
  if (params.enfantsCharge >= 3) parts += (params.enfantsCharge - 2)
  
  // Garde alternée
  if (params.enfantsGardeAlternee >= 1) parts += 0.25
  if (params.enfantsGardeAlternee >= 2) parts += 0.25
  if (params.enfantsGardeAlternee >= 3) parts += (params.enfantsGardeAlternee - 2) * 0.5
  
  // Cases spéciales
  if (params.parentIsole && (params.enfantsCharge > 0 || params.enfantsGardeAlternee > 0)) parts += 0.5
  if (params.invalidite) parts += 0.5
  if (params.invaliditeConjoint) parts += 0.5
  if (params.ancienCombattant) parts += 0.5
  
  return parts
}

/**
 * Détermine la TMI selon le quotient familial
 */
export function getTMI(quotientFamilial: number): number {
  for (let i = BAREME_IR_2025.length - 1; i >= 0; i--) {
    if (quotientFamilial > BAREME_IR_2025[i].min) {
      return BAREME_IR_2025[i].taux
    }
  }
  return 0
}

/**
 * Calcule le plafond PER pour un déclarant
 */
export function calculerPlafondPER(revenuN1: number, plafondNonUtilise: number = 0): {
  plafond: number
  detail: string
} {
  const { PER } = CHARGES_DEDUCTIBLES_2025
  const plafondCalcule = Math.max(
    PER.PLANCHER,
    Math.min(revenuN1 * PER.TAUX_PLAFOND / 100, PER.PLAFOND_ABSOLU)
  )
  
  return {
    plafond: plafondCalcule + plafondNonUtilise,
    detail: `10% de ${revenuN1.toLocaleString('fr-FR')} € = ${plafondCalcule.toLocaleString('fr-FR')} € + reports = ${(plafondCalcule + plafondNonUtilise).toLocaleString('fr-FR')} €`
  }
}

/**
 * Vérifie si le plafond des niches fiscales est dépassé
 */
export function verifierPlafondNiches(
  totalReductions: number,
  inclutSOFICA: boolean = false
): { depasse: boolean; plafond: number; message: string } {
  const plafond = inclutSOFICA ? PLAFOND_NICHES_2025.MAJORE : PLAFOND_NICHES_2025.GENERAL
  const depasse = totalReductions > plafond
  
  return {
    depasse,
    plafond,
    message: depasse 
      ? `⚠️ Plafond niches fiscales dépassé de ${(totalReductions - plafond).toLocaleString('fr-FR')} €`
      : `✅ Plafond niches : ${totalReductions.toLocaleString('fr-FR')} € / ${plafond.toLocaleString('fr-FR')} €`
  }
}
