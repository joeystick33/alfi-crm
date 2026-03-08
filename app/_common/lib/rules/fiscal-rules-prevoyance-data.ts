/**
 * DONNÉES — Prévoyance & Retraite TNS / PL 2026
 * Source unique de vérité pour les cotisations, prestations et paramètres
 */

import type { PrevoyanceRetraiteConfig } from './fiscal-rules-prevoyance-types'
import { PREVOYANCE_RETRAITE_CAISSES_PL } from './fiscal-rules-prevoyance-caisses'

export const PREVOYANCE_RETRAITE: PrevoyanceRetraiteConfig = {

  meta: {
    version: '2026.1.0',
    date_mise_a_jour: '2026-03-06',
    pass_2026: 48060,
    sources: [
      'CPAM / Ameli.fr (IJ, invalidité, capital décès 2026)',
      'URSSAF (taux cotisations TNS 2026, réforme assiette sociale)',
      'Décret n°2024-688 du 05/07/2024 (nouveaux taux TNS)',
      'CNAVPL (régime de base PL, valeur du point 01/01/2026)',
      'CIPAV (retraite complémentaire + invalidité-décès 2026)',
      'CARMF (médecins : RC + ASV + ID, chiffres clés 2026)',
      'CARPIMKO (paramédicaux : cotisations et prestations 2026)',
      'CAVEC (experts-comptables : RC + prévoyance 2026)',
      'LFSS 2026 (suspension réforme retraites)',
    ],
  },

  // ===========================================================================
  // PRÉVOYANCE OBLIGATOIRE — CPAM (régime général / salariés)
  // ===========================================================================
  prevoyance_cpam: {
    ij_maladie: {
      delai_carence_jours: 3,
      taux_normal: 0.50,
      taux_3_enfants: 0.6666,
      plafond_sjb: 53.44,
      duree_max_jours: 360,
      duree_max_ald_jours: 1095,
      subrogation_employeur: true,
    },
    invalidite: {
      categorie_1: {
        taux: 0.30,
        plafond_annuel: 14414,
        description: 'Invalide capable d\'exercer une activité rémunérée réduite',
      },
      categorie_2: {
        taux: 0.50,
        plafond_annuel: 24030,
        description: 'Invalide absolument incapable d\'exercer une profession quelconque',
      },
      categorie_3: {
        taux: 0.50,
        plafond_annuel: 24030,
        majoration_tierce_personne: 15572,
        description: 'Invalide nécessitant l\'assistance d\'une tierce personne',
      },
    },
    capital_deces: {
      montant_forfaitaire: 3910,
      conditions: 'Versé aux ayants droit si l\'assuré était affilié au régime général et à jour de cotisations',
    },
    reversion: {
      taux: 0.54,
      age_minimum: 55,
      plafond_ressources_celibataire: 24232,
      plafond_ressources_couple: 38771,
    },
  },

  // ===========================================================================
  // PRÉVOYANCE OBLIGATOIRE — TNS / SSI (Artisans, Commerçants)
  // ===========================================================================
  prevoyance_tns: {
    ij_maladie: {
      delai_carence_jours: 3,
      base_calcul: '1/730e du revenu annuel moyen des 3 dernières années',
      plafond_pass: 48060,
      duree_max_jours: 1095,
      cotisation_taux: 0.0085,
      cotisation_plafond_pass: 5,
    },
    invalidite: {
      partielle: {
        taux: 0.30,
        description: 'Perte de capacité de gain ≥ 2/3 — 30% du RAM plafonné au PASS',
      },
      totale: {
        taux: 0.50,
        description: 'Incapacité totale d\'exercice — 50% du RAM plafonné au PASS',
      },
    },
    capital_deces: {
      montant_base: 24030,
      description: 'Capital décès versé aux ayants droit, égal à la moitié du PASS',
    },
    cotisation_invalidite_deces: {
      taux: 0.013,
      plafond: 48060,
    },
  },

  // ===========================================================================
  // LOI MADELIN — PLAFONDS DÉDUCTION PRÉVOYANCE TNS
  // ===========================================================================
  madelin_prevoyance: {
    prevoyance: {
      taux_benefice: 0.0375,
      supplement_pass: 0.07,
      plafond_max_pass: 0.03,
      plafond_max_montant: 11534,
    },
    sante: {
      taux_benefice: 0.0375,
      supplement_pass: 0.07,
      plafond_max_pass: 0.03,
      plafond_max_montant: 11534,
    },
    perte_emploi: {
      taux_benefice: 0.025,
      plafond_pass: 0.015,
      plafond_max_montant: 90113,
    },
  },

  // ===========================================================================
  // COTISATIONS TNS (SSI) 2026
  // Réforme assiette : Décret n°2024-688
  // ===========================================================================
  cotisations_tns: {
    assiette_sociale: {
      abattement_forfaitaire: 0.26,
      plancher_abattement_pass: 0.0176,
      plafond_abattement_pass: 1.30,
      description: 'Assiette unique 2026 : revenu brut abattu de 26%. Remplace les deux anciennes assiettes (nette + super-brute).',
    },
    maladie_maternite: {
      taux_base: 0.085,
      taux_au_dela_3pass: 0.065,
      description: 'Taux progressif avec dégressivité entre 20% et 300% du PASS',
    },
    indemnites_journalieres: {
      taux: 0.0085,
      plafond_pass: 5,
    },
    retraite_base: {
      taux_plafonne: 0.1787,
      plafond: 48060,
      taux_deplafonne: 0.0072,
      plafond_deplafonne: Infinity,
    },
    retraite_complementaire_rci: {
      taux_tranche_1: 0.081,
      plafond_tranche_1: 48060,
      taux_tranche_2: 0.091,
      plafond_tranche_2: 192240,
    },
    invalidite_deces: {
      taux: 0.013,
      plafond: 48060,
    },
    allocations_familiales: {
      taux_normal: 0.031,
      taux_reduit: 0.00,
      seuil_reduction: 1.10,
    },
    csg_crds: {
      csg_taux: 0.092,
      crds_taux: 0.005,
      csg_deductible: 0.068,
    },
    cotisations_minimales: {
      base_maladie_ij: 19224,
      base_retraite_invalidite: 9131,
      retraite_base_minimum: 988,
      invalidite_deces_minimum: 72,
      ij_minimum: 163,
    },
    cfp: {
      artisan: 139,
      commercant: 120,
      pl_non_reglementee: 120,
      avec_conjoint_collaborateur: 163,
    },
  },

  // ===========================================================================
  // RETRAITE DE BASE CNAVPL
  // Source : cnavpl.fr, valeur du point au 01/01/2026
  // ===========================================================================
  retraite_base_cnavpl: {
    cotisations: {
      tranche_1_taux: 0.0873,
      tranche_1_plafond: 48060,
      tranche_1_points_max: 557,
      tranche_2_taux: 0.0187,
      tranche_2_plafond: 240300,
      tranche_2_points_max: 25,
      cotisation_minimale: 573,
      assiette_forfaitaire_debut: 9131,
      cotisation_debut: 968,
    },
    valeur_point: 0.6599,
    liquidation: {
      decote_par_trimestre: 0.0125,
      surcote_par_trimestre: 0.0125,
      majoration_3_enfants: 0.10,
      age_taux_plein_auto: 67,
    },
    sections: [
      'CARMF (médecins)',
      'CARPIMKO (infirmiers, kinés, orthophonistes, podologues, orthoptistes)',
      'CAVEC (experts-comptables, commissaires aux comptes)',
      'CIPAV (architectes, ingénieurs-conseil, psychologues, ostéopathes…)',
      'CARCDSF (chirurgiens-dentistes, sages-femmes)',
      'CARPV (vétérinaires)',
      'CAVOM (officiers ministériels)',
      'CAVAMAC (agents d\'assurance)',
      'CPRN (notaires)',
      'CRN (pharmaciens)',
    ],
  },

  // ===========================================================================
  // CAISSES COMPLÉMENTAIRES PL — importées du module dédié
  // ===========================================================================
  caisses_pl: PREVOYANCE_RETRAITE_CAISSES_PL,
}
