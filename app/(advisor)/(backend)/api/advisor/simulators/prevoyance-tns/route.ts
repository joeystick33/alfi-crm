 
/**
 * Simulateur Prévoyance TNS - API Backend
 * 
 * Endpoints:
 * - GET /api/advisor/simulators/prevoyance-tns - Config (professions, caisses, paramètres)
 * - POST /api/advisor/simulators/prevoyance-tns - Simulation complète
 * 
 * Les paramètres sont centralisés dans parameters-prevoyance-2025.ts
 * Pour mettre à jour les règles : modifier ce fichier de paramètres
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/app/_common/lib/logger'
import { calculPlafondMadelinPrevoyance } from '@/app/_common/lib/rules/fiscal-rules'
import {
  PASS_2025,
  CPAM_2025,
  CAISSES_AVEC_CPAM,
  CAISSES_REGIME_SPECIFIQUE,
  SSI_2025,
  MSA_2025,
  CIPAV_2025,
  CARMF_2025,
  CAVEC_2025,
  CARPIMKO_2025,
  CARCDSF_2025,
  CARPV_2025,
  CAVP_2025,
  CNBF_2025,
  calculerIJ_CPAM as calculerIJ_CPAM_Utils,
  calculerIJ_SSI as calculerIJ_SSI_Utils,
  calculerIJ_CNBF,
} from './parameters-prevoyance-2025'

// ============================================================================
// CONSTANTES EXPORTÉES DEPUIS LE FICHIER CENTRALISÉ
// Toute modification des règles doit se faire dans parameters-prevoyance-2025.ts
// ============================================================================
const ANNEE_PARAMS = 2026

// ============================================================================
// RÈGLES DES CAISSES (caisses.json)
// ============================================================================
const CAISSES_RULES: Record<string, {
  description: string
  classes: Array<{
    classe: string
    ij: number
    invalidite: number | null
    deces: number
    descIj: string
    descInv: string
    descDeces: string
    invaliditeAnnuelleProp: boolean
    invaliditeBaseAnnuelle: number | null
  }> | null
  garanties: {
    IJ: { desc: string }
    Invalidite: { desc: string }
    Deces: { desc: string }
  }
}> = {
  MSA: {
    description: "Caisse des non-salariés agricoles (agriculteurs, viticulteurs, éleveurs, etc.). Pas de classes. Garanties basées sur le revenu professionnel.",
    classes: null,
    garanties: {
      IJ: { desc: "IJ AMEXA versées du 4ème jour (carence 4 jours depuis fév 2024, 3j si hospitalisation). Montant forfaitaire selon situation." },
      Invalidite: { desc: "Pension d'invalidité AMEXA proportionnelle aux revenus antérieurs." },
      Deces: { desc: "Capital décès forfaitaire 2025." }
    }
  },
  SSI: {
    description: "Sécurité Sociale des Indépendants pour artisans, commerçants, micro-entrepreneurs. Pas de classes.",
    classes: null,
    garanties: {
      IJ: { desc: "1/730e du RAAM (3 dernières années), plafond 64,52 €/jour (1 PASS/730). Carence 3 jours. Conjoint collaborateur : 31,75 €/jour. Max 360 jours sur 3 ans." },
      Invalidite: { desc: "Catégorie 1 (partielle) : 30% du RAAM. Catégorie 2 (totale) : 50% du RAAM, max 23 550 €/an (50% PASS)." },
      Deces: { desc: "Capital décès ~8 798 € (20% du PASS 2025)." }
    }
  },
  CIPAV: {
    description: "Caisse des professions libérales non réglementées. Régime commun CNAVPL pour IJ (0-90j), pas de couverture CIPAV après 90j.",
    classes: null,
    garanties: {
      IJ: { desc: "Régime CNAVPL : 1/730e du RAAM (3 ans), plafond 3 PASS. Min 25,80 €/jour, max 193,56 €/jour. Carence 3 jours. Versement du 4e au 90e jour par CPAM. Pas d'IJ CIPAV après 90 jours." },
      Invalidite: { desc: "Depuis réforme 2023 : prestations proportionnelles aux revenus (plus de classes). Pension calculée sur revenus cotisés." },
      Deces: { desc: "Capital décès réformé 2023 : montant selon revenus cotisés et situation familiale." }
    }
  },
  CARMF: {
    description: "Caisse des médecins libéraux. RÉFORME 2025 : suppression de la classe B, calcul proportionnel pour revenus entre 1 et 3 PASS.",
    classes: [
      { classe: "A", ij: 64.52, invalidite: 23198.0, deces: 60000.0, descIj: "64,52 €/jour (revenus ≤ 1 PASS). Franchise 90 jours. Durée max 3 ans.", descInv: "Rente invalidité : 23 198 €/an (revenus < 1 PASS).", descDeces: "Capital décès 60 000 €", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: 23198.0 },
      { classe: "B", ij: 0, invalidite: null, deces: 60000.0, descIj: "PROPORTIONNEL : 1/730e du revenu N-2. Si revenu entre 1 et 3 PASS. Franchise 90 jours.", descInv: "Rente invalidité proportionnelle aux revenus N-2.", descDeces: "Capital décès 60 000 €", invaliditeAnnuelleProp: true, invaliditeBaseAnnuelle: null },
      { classe: "C", ij: 193.56, invalidite: 30930.0, deces: 60000.0, descIj: "193,56 €/jour (revenus ≥ 3 PASS). Franchise 90 jours. Durée max 3 ans.", descInv: "Rente invalidité : 30 930 €/an (revenus > 3 PASS).", descDeces: "Capital décès 60 000 €", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: 30930.0 }
    ],
    garanties: {
      IJ: { desc: "RÉFORME 2025 : IJ fixes (A/C) ou proportionnelles (B). Franchise 90 jours. Max 3 ans. Du 4e au 90e jour : régime CNAVPL (CPAM)." },
      Invalidite: { desc: "Rente annuelle : 23 198 € (< 1 PASS) à 30 930 € (> 3 PASS), proportionnelle entre." },
      Deces: { desc: "Capital décès 60 000 € (pas de doublement accident depuis réforme)." }
    }
  },
  CAVP: {
    description: "Caisse des pharmaciens. IJ via régime CPAM uniquement. Invalidité forfaitaire 16 705 €/an.",
    classes: null, // Pas de classes IJ propres - régime CPAM uniquement
    garanties: {
      IJ: { desc: "RÉGIME CPAM UNIQUEMENT : IJ du 4e au 90e jour via CPAM (1/730e du revenu, max 193,56 €/jour). Pas d'IJ CAVP propres après 90 jours." },
      Invalidite: { desc: "Invalidité forfaitaire : 16 705 €/an (1 392 €/mois). Majoration enfants possible." },
      Deces: { desc: "Capital décès selon situation. Allocation conjoint, rente éducation possibles." }
    }
  },
  CAVEC: {
    description: "Caisse des experts-comptables et commissaires aux comptes. TAUX UNIQUE 2025 pour les IJ (classes supprimées pour IJ).",
    classes: null,
    garanties: {
      IJ: { desc: "TAUX UNIQUE 2025 : 125 € bruts/jour à partir du 91e jour d'arrêt, quelle que soit la classe de cotisation. Du 4e au 90e jour : régime CNAVPL (CPAM). Durée max 36 mois ou 1095 jours cumulés." },
      Invalidite: { desc: "Pension d'invalidité selon décision commission d'inaptitude. Proportionnelle aux cotisations versées." },
      Deces: { desc: "Capital décès selon classe de cotisation prévoyance. Rente éducation possible." }
    }
  },
  CARPIMKO: {
    description: "Caisse des paramédicaux (infirmiers, kinés, orthophonistes...). RÉFORME 2025 : majorations réduites.",
    classes: [
      { classe: "1", ij: 33.5, invalidite: 8000.0, deces: 30000.0, descIj: "33,50 €/jour à partir du 91e jour. Du 4e au 90e jour : régime CNAVPL (CPAM).", descInv: "8 000 €/an. Majoration enfant réduite à 8,06 €/jour (2025).", descDeces: "Capital décès 30 000 €.", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: null },
      { classe: "2", ij: 67.0, invalidite: 16000.0, deces: 30000.0, descIj: "67 €/jour à partir du 91e jour.", descInv: "16 000 €/an. Majoration conjoint SUPPRIMÉE (2025).", descDeces: "Capital décès 30 000 €.", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: null },
      { classe: "3", ij: 100.5, invalidite: 24000.0, deces: 30000.0, descIj: "100,50 €/jour à partir du 91e jour.", descInv: "24 000 €/an. Majoration tierce personne : 3 024 €/an (réduite 50%).", descDeces: "Capital décès 30 000 €.", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: null },
      { classe: "4", ij: 134.0, invalidite: 32000.0, deces: 30000.0, descIj: "134 €/jour à partir du 91e jour.", descInv: "32 000 €/an.", descDeces: "Capital décès 30 000 €.", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: null }
    ],
    garanties: {
      IJ: { desc: "IJ CARPIMKO à partir du 91e jour. Du 4e au 90e jour : régime CNAVPL versé par CPAM." },
      Invalidite: { desc: "Rente invalidité annuelle selon classe. RÉFORME 2025 : majoration conjoint supprimée, majoration enfant/tierce personne réduites de 50%." },
      Deces: { desc: "Capital décès selon classe. Rentes conjoint et éducation possibles (partenaire PACS reconnu depuis juil. 2024)." }
    }
  },
  CARCDSF: {
    description: "Caisse des chirurgiens-dentistes et sages-femmes. TAUX UNIQUES 2025 par profession (pas de classes IJ).",
    classes: [
      { classe: "CD", ij: 111.0, invalidite: 31824.20, deces: 30000.0, descIj: "Chirurgiens-dentistes : 111 €/jour à partir du 91e jour.", descInv: "Invalidité : 31 824,20 €/an.", descDeces: "Capital décès selon situation.", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: 31824.20 },
      { classe: "SF", ij: 48.73, invalidite: 13460, deces: 30000.0, descIj: "Sages-femmes : 48,73 €/jour à partir du 91e jour.", descInv: "Invalidité : 13 460 €/an.", descDeces: "Capital décès selon situation.", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: 13460 }
    ],
    garanties: {
      IJ: { desc: "TAUX UNIQUES 2025 : Chirurgiens-dentistes 111 €/jour, Sages-femmes 48,73 €/jour. À partir du 91e jour. Du 4e au 90e jour : régime CNAVPL (CPAM). Durée max 3 ans." },
      Invalidite: { desc: "Pension d'invalidité sur décision de la commission d'inaptitude. Exonération cotisations possible > 6 mois." },
      Deces: { desc: "Capital décès selon situation familiale. Rentes conjoint et éducation possibles." }
    }
  },
  CARPV: {
    description: "Caisse des vétérinaires. Classes 1 à 3.",
    classes: [
      { classe: "1", ij: 30.0, invalidite: 8000.0, deces: 30000.0, descIj: "30 €/jour. Franchise 90 jours.", descInv: "8 000 €/an.", descDeces: "Capital décès 30 000 €.", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: null },
      { classe: "2", ij: 60.0, invalidite: 16000.0, deces: 30000.0, descIj: "60 €/jour. Franchise 90 jours.", descInv: "16 000 €/an.", descDeces: "Capital décès 30 000 €.", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: null },
      { classe: "3", ij: 90.0, invalidite: 24000.0, deces: 30000.0, descIj: "90 €/jour. Franchise 90 jours.", descInv: "24 000 €/an.", descDeces: "Capital décès 30 000 €.", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: null }
    ],
    garanties: {
      IJ: { desc: "Montant selon classe. Franchise 90 jours." },
      Invalidite: { desc: "Pension selon taux et classe." },
      Deces: { desc: "Capital décès, rente éducation." }
    }
  },
  CAVAMAC: {
    description: "Caisse des agents généraux d'assurance. Classes A à B.",
    classes: [
      { classe: "A", ij: 55.44, invalidite: 13310, deces: 44370, descIj: "55,44 €/jour. Franchise 90 jours.", descInv: "13 310 €/an.", descDeces: "Capital décès 44 370 €.", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: null },
      { classe: "B", ij: 110.88, invalidite: 26620, deces: 88740, descIj: "110,88 €/jour. Franchise 90 jours.", descInv: "26 620 €/an.", descDeces: "Capital décès 88 740 €.", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: null }
    ],
    garanties: {
      IJ: { desc: "Montant selon classe. Franchise 90 jours." },
      Invalidite: { desc: "Pension selon taux et classe." },
      Deces: { desc: "Capital décès, rente éducation." }
    }
  },
  CAVOM: {
    description: "Caisse des Officiers Ministériels. Classes A à B.",
    classes: [
      { classe: "A", ij: 55.44, invalidite: 13310, deces: 44370, descIj: "55,44 €/jour. Franchise 90 jours.", descInv: "13 310 €/an.", descDeces: "Capital décès 44 370 €.", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: null },
      { classe: "B", ij: 110.88, invalidite: 26620, deces: 88740, descIj: "110,88 €/jour. Franchise 90 jours.", descInv: "26 620 €/an.", descDeces: "Capital décès 88 740 €.", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: null }
    ],
    garanties: {
      IJ: { desc: "Montant selon classe. Franchise 90 jours." },
      Invalidite: { desc: "Pension selon taux et classe." },
      Deces: { desc: "Capital décès, rente éducation." }
    }
  },
  CPRN: {
    description: "Caisse des notaires. Classes A à B.",
    classes: [
      { classe: "A", ij: 40.0, invalidite: 8000.0, deces: 30000.0, descIj: "40 €/jour. Franchise 90 jours.", descInv: "8 000 €/an.", descDeces: "Capital décès 30 000 €.", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: null },
      { classe: "B", ij: 80.0, invalidite: 16000.0, deces: 30000.0, descIj: "80 €/jour. Franchise 90 jours.", descInv: "16 000 €/an.", descDeces: "Capital décès 30 000 €.", invaliditeAnnuelleProp: false, invaliditeBaseAnnuelle: null }
    ],
    garanties: {
      IJ: { desc: "Montant selon classe. Franchise 90 jours." },
      Invalidite: { desc: "Pension selon taux et classe." },
      Deces: { desc: "Capital décès, rente éducation." }
    }
  },
  CNBF: {
    description: "Caisse des avocats. Structure spécifique : 0-90j via LPA/AON, >90j via CNBF.",
    classes: null,
    garanties: {
      IJ: { desc: "0-90 jours : prise en charge par La Prévoyance des Avocats (LPA) ou AON (Barreau Paris). >90 jours : CNBF verse allocations journalières. Franchise 90 jours. Durée max 3 ans (1095 jours)." },
      Invalidite: { desc: "Pension invalidité CNBF : 50% de la retraite de base forfaitaire (< 20 ans ancienneté) ou 50% de la retraite proportionnelle (≥ 20 ans ancienneté). Versée jusqu'à 62 ans." },
      Deces: { desc: "Capital décès 50 000 € (2025). Versé au conjoint, sinon enfants < 21 ans (ou < 25 ans si études). Pas de doublement accident." }
    }
  },
  ENIM: {
    description: "Caisse des marins et pêcheurs. Garanties variables selon statut et ancienneté.",
    classes: null,
    garanties: {
      IJ: { desc: "Montants variables selon statut et ancienneté (voir ENIM)." },
      Invalidite: { desc: "Pension selon taux et ancienneté (voir ENIM)." },
      Deces: { desc: "Aide obsèques 1 100 € (2025), autres prestations selon situation." }
    }
  }
}

// ============================================================================
// FORMULES DE CALCUL 2025 - Mises à jour selon sources officielles
// ============================================================================
const FORMULAS: Record<string, {
  ij: { fixed?: number; rate?: number; divisor?: number; max?: number; min?: number }
  invalidite: { fixed?: number; rate?: number; min?: number; max?: number; cat1Rate?: number; cat1Max?: number; cat2Rate?: number; cat2Max?: number; plancherPassRate?: number; baseMaxPassMultiplier?: number; capPassRate?: number }
  deces: { fixed?: number; celibataire?: number; autre?: number }
}> = {
  MSA: {
    ij: { fixed: MSA_2025.ij.montantJours29Plus },
    invalidite: { rate: 0.40, plancherPassRate: 0.30, baseMaxPassMultiplier: 1.5, capPassRate: 0.50 },
    deces: { fixed: MSA_2025.deces.capitalForfaitaire }
  },
  SSI: {
    ij: { rate: 1.0, divisor: 730, max: SSI_2025.ij.max },
    invalidite: { cat1Rate: SSI_2025.invalidite.categorie1.taux, cat1Max: 1177.50, cat2Rate: SSI_2025.invalidite.categorie2.taux, cat2Max: 1962.50 },
    deces: { fixed: SSI_2025.deces.capitalBase }
  },
  CIPAV: {
    ij: { rate: 1.0, divisor: 730, min: CPAM_2025.ijMin, max: CPAM_2025.ijMax },
    invalidite: { rate: 0.4, min: 8975.0, max: 35457.0 },
    deces: { celibataire: 26926.55, autre: 106372.77 }
  },
  CAVEC: {
    ij: { fixed: CAVEC_2025.ij.montantJour },
    invalidite: { rate: 0.5, min: 0, max: PASS_2025 * 3 },
    deces: { fixed: 30000.0 }
  },
  CNBF: {
    ij: { fixed: 0 },
    invalidite: { fixed: 9482 }, // 50% retraite base forfaitaire 2025 (< 20 ans ancienneté) — source barème CNBF 2025
    deces: { fixed: 50000.0 }
  },
  ENIM: {
    ij: { fixed: 0 },
    invalidite: { rate: 0, min: 0, max: 0 },
    deces: { fixed: 1100 }
  }
}

// ============================================================================
// PROFESSIONS (groupées par secteur)
// ============================================================================
const PROFESSIONS = [
  {
    secteur: "Santé",
    professions: [
      { value: "medecin_generaliste", text: "Médecin généraliste", caisses: ["CARMF"] },
      { value: "medecin_specialiste", text: "Médecin spécialiste", caisses: ["CARMF"] },
      { value: "chirurgien_dentiste", text: "Chirurgien-dentiste", caisses: ["CARCDSF"] },
      { value: "sage_femme", text: "Sage-femme", caisses: ["CARCDSF"] },
      { value: "pharmacien", text: "Pharmacien", caisses: ["CAVP"] },
      { value: "infirmier", text: "Infirmier(e)", caisses: ["CARPIMKO"] },
      { value: "kinesitherapeute", text: "Masseur-kinésithérapeute", caisses: ["CARPIMKO"] },
      { value: "orthophoniste", text: "Orthophoniste", caisses: ["CARPIMKO"] },
      { value: "pedicure_podologue", text: "Pédicure-podologue", caisses: ["CARPIMKO"] },
      { value: "orthoptiste", text: "Orthoptiste", caisses: ["CARPIMKO"] },
      { value: "veterinaire", text: "Vétérinaire", caisses: ["CARPV"] }
    ]
  },
  {
    secteur: "Juridique",
    professions: [
      { value: "avocat", text: "Avocat", caisses: ["CNBF"] },
      { value: "notaire", text: "Notaire", caisses: ["CPRN"] },
      { value: "huissier", text: "Huissier de justice", caisses: ["CAVOM"] },
      { value: "commissaire_priseur", text: "Commissaire-priseur", caisses: ["CAVOM"] }
    ]
  },
  {
    secteur: "Technique & Conseil",
    professions: [
      { value: "architecte", text: "Architecte", caisses: ["CIPAV"] },
      { value: "expert_comptable", text: "Expert-comptable", caisses: ["CAVEC"] },
      { value: "commissaire_comptes", text: "Commissaire aux comptes", caisses: ["CAVEC"] },
      { value: "ingenieur_conseil", text: "Ingénieur conseil", caisses: ["CIPAV"] },
      { value: "consultant", text: "Consultant", caisses: ["CIPAV"] },
      { value: "agent_assurance", text: "Agent général d'assurance", caisses: ["CAVAMAC"] }
    ]
  },
  {
    secteur: "Artisans & Commerçants",
    professions: [
      { value: "artisan", text: "Artisan", caisses: ["SSI"] },
      { value: "commercant", text: "Commerçant", caisses: ["SSI"] },
      { value: "auto_entrepreneur", text: "Auto-entrepreneur / Micro-entrepreneur", caisses: ["SSI"] },
      { value: "chef_entreprise", text: "Chef d'entreprise (gérant majoritaire)", caisses: ["SSI"] }
    ]
  },
  {
    secteur: "Agriculture & Maritime",
    professions: [
      { value: "agriculteur", text: "Agriculteur / Exploitant agricole", caisses: ["MSA"] },
      { value: "viticulteur", text: "Viticulteur", caisses: ["MSA"] },
      { value: "marin_pecheur", text: "Marin / Pêcheur", caisses: ["ENIM"] }
    ]
  },
  {
    secteur: "Autres professions libérales",
    professions: [
      { value: "autre_liberal", text: "Autre profession libérale", caisses: ["CIPAV"] }
    ]
  }
]

// ============================================================================
// FONCTIONS DE CALCUL - Utilisant les paramètres centralisés 2025
// ============================================================================

/**
 * Calcule les IJ du régime commun CNAVPL versées par la CPAM
 * Utilise les paramètres centralisés de parameters-prevoyance-2025.ts
 */
function calculerIJ_CPAM(revenuAn: number): {
  montantIJ_CPAM: number
  periode: string
  carence: number
  dureeMax: number
  description: string
} {
  // Utilise la fonction utilitaire du fichier de paramètres
  const result = calculerIJ_CPAM_Utils(revenuAn)
  
  return {
    montantIJ_CPAM: result.montantJour,
    periode: `Jour ${CPAM_2025.debutVersement} à ${CPAM_2025.finVersement}`,
    carence: CPAM_2025.carenceJours,
    dureeMax: CPAM_2025.dureeMaxJours,
    description: `Régime CNAVPL (CPAM) : ${result.montantJour} €/jour du ${CPAM_2025.debutVersement}e au ${CPAM_2025.finVersement}e jour. Carence ${CPAM_2025.carenceJours} jours.${result.isMinimum ? ' (montant minimum)' : ''}${result.isMaximum ? ' (montant maximum)' : ''}`
  }
}

function calculerGarantiesBase(codeCaisse: string, classeIndex: number | null, revenuAn: number, situation: string): {
  montantIJ_base: number
  montantInvaliditeMensuel_base: number
  montantDecesCapital_base: number
  tauxCouverture_base: number
  nomClasse: string | null
  descIj: string
  descInv: string
  descDeces: string
  descriptions: { IJ: { desc: string }; Invalidite: { desc: string }; Deces: { desc: string } }
} {
  const caisse = CAISSES_RULES[codeCaisse]
  const formula = FORMULAS[codeCaisse]
  
  let montantIJ = 0
  let montantInvaliditeAnnuel = 0
  let montantDeces = 0
  let nomClasse: string | null = null
  let descIj = caisse?.garanties?.IJ?.desc || ""
  let descInv = caisse?.garanties?.Invalidite?.desc || ""
  let descDeces = caisse?.garanties?.Deces?.desc || ""

  // Si la caisse a des classes et qu'une classe est sélectionnée
  if (caisse?.classes && classeIndex !== null && classeIndex >= 0 && classeIndex < caisse.classes.length) {
    const classe = caisse.classes[classeIndex]
    nomClasse = `Classe ${classe.classe}`
    descIj = classe.descIj
    descInv = classe.descInv
    descDeces = classe.descDeces

    // IJ : Si ij = 0, c'est une classe PROPORTIONNELLE (ex: CARMF Classe B)
    // Formule : 1/730e du revenu annuel
    if (classe.ij === 0) {
      // Calcul proportionnel pour CARMF Classe B et similaires
      montantIJ = revenuAn / 730
      // Plafonner à 193,56€ (max 3 PASS / 730)
      montantIJ = Math.min(montantIJ, 193.56)
    } else {
      montantIJ = classe.ij
    }

    // Invalidité : si proportionnelle, calculer selon revenu
    if (classe.invaliditeAnnuelleProp) {
      if (classe.invaliditeBaseAnnuelle) {
        montantInvaliditeAnnuel = classe.invaliditeBaseAnnuelle
      } else {
        // Pour CARMF Classe B : invalidité proportionnelle aux revenus
        // Formule approximative : entre 23198€ (classe A) et 30930€ (classe C)
        // Interpolation linéaire basée sur le revenu
        const seuilMin = PASS_2025  // 1 PASS
        const seuilMax = PASS_2025 * 3 // 3 PASS
        const invMin = CARMF_2025.classeA.invaliditeAnnuelle
        const invMax = CARMF_2025.classeC.invaliditeAnnuelle
        if (revenuAn <= seuilMin) {
          montantInvaliditeAnnuel = invMin
        } else if (revenuAn >= seuilMax) {
          montantInvaliditeAnnuel = invMax
        } else {
          // Interpolation linéaire
          const ratio = (revenuAn - seuilMin) / (seuilMax - seuilMin)
          montantInvaliditeAnnuel = invMin + (ratio * (invMax - invMin))
        }
      }
    } else if (classe.invalidite) {
      montantInvaliditeAnnuel = classe.invalidite
    }
    
    montantDeces = classe.deces
  } 
  // Sinon, calcul selon formules
  else if (formula) {
    // IJ
    if (formula.ij.fixed !== undefined) {
      montantIJ = formula.ij.fixed
    } else if (formula.ij.rate !== undefined && formula.ij.divisor !== undefined) {
      montantIJ = (revenuAn * formula.ij.rate) / formula.ij.divisor
      if (formula.ij.max !== undefined) {
        montantIJ = Math.min(montantIJ, formula.ij.max)
      }
    }

    // Invalidité
    if (formula.invalidite.fixed !== undefined) {
      // Montant annuel fixe (ex: CNBF forfaitaire)
      montantInvaliditeAnnuel = formula.invalidite.fixed
    } else if (formula.invalidite.cat2Max !== undefined) {
      // SSI style
      montantInvaliditeAnnuel = formula.invalidite.cat2Max * 12
    } else if (formula.invalidite.rate !== undefined) {
      montantInvaliditeAnnuel = revenuAn * formula.invalidite.rate
      if (formula.invalidite.min !== undefined) {
        montantInvaliditeAnnuel = Math.max(montantInvaliditeAnnuel, formula.invalidite.min)
      }
      if (formula.invalidite.max !== undefined) {
        montantInvaliditeAnnuel = Math.min(montantInvaliditeAnnuel, formula.invalidite.max)
      }
    }

    // Décès
    if (formula.deces.fixed !== undefined) {
      montantDeces = formula.deces.fixed
    } else if (formula.deces.celibataire !== undefined) {
      montantDeces = situation === 'celibataire' ? formula.deces.celibataire : (formula.deces.autre || 0)
    }
  }

  const montantInvaliditeMensuel = montantInvaliditeAnnuel / 12
  const revenuMensuel = revenuAn / 12
  const couvertureMensuelle = (montantIJ * 30) + montantInvaliditeMensuel
  const tauxCouverture = revenuMensuel > 0 ? Math.min(100, (couvertureMensuelle / revenuMensuel) * 100) : 0

  return {
    montantIJ_base: Math.round(montantIJ * 100) / 100,
    montantInvaliditeMensuel_base: Math.round(montantInvaliditeMensuel),
    montantDecesCapital_base: Math.round(montantDeces),
    tauxCouverture_base: Math.round(tauxCouverture),
    nomClasse,
    descIj,
    descInv,
    descDeces,
    descriptions: {
      IJ: { desc: descIj },
      Invalidite: { desc: descInv },
      Deces: { desc: descDeces }
    }
  }
}

function calculerCouvertureIdeale(revenuAn: number, chargePerso: number, chargePro: number, situation: string, nbEnfants: number): {
  chargesTotalesMensuelles: number
  revenuMensuelNetCible: number
  ijConseille: number
  invaliditeConseille: number
  capitalConseille: number
  detailsCapitalIdeal: {
    capitalRemplacementRevenu: number
    capitalLiquidationChargesPro: number
    capitalEducation: number
    capitalConjoint: number
  }
} {
  const revenuMensuel = revenuAn / 12
  
  // Validation: les charges mensuelles ne peuvent pas être supérieures à 10x le revenu mensuel
  const chargePersoValide = Math.min(Math.abs(chargePerso), revenuMensuel * 3)
  const chargeProValide = Math.min(Math.abs(chargePro), revenuMensuel * 3)
  const chargesTotales = chargePersoValide + chargeProValide
  
  // Besoin mensuel cible = max(70% du revenu mensuel, charges totales + marge 10%)
  // Mais plafonné à 150% du revenu mensuel pour éviter les aberrations
  const revenuCibleBrut = Math.max(revenuMensuel * 0.7, chargesTotales * 1.1)
  const revenuCible = Math.min(revenuCibleBrut, revenuMensuel * 1.5)
  
  // IJ conseillée = besoin journalier pour maintenir le niveau de vie (revenu cible / 30)
  const ijConseille = Math.round(revenuCible / 30)
  
  // Invalidité conseillée = maintien du revenu cible mensuel
  const invaliditeConseille = Math.round(revenuCible)
  
  // Capital décès : décomposition détaillée
  // 1. Remplacement revenu : 24 mois de revenus pour transition
  const capitalRemplacementRevenu = Math.round(revenuMensuel * 24)
  
  // 2. Liquidation charges pro : 12 mois de charges pro
  const capitalLiquidationChargesPro = Math.round(chargeProValide * 12)
  
  // 3. Éducation enfants : 50 000 € par enfant
  const capitalEducation = nbEnfants > 0 ? Math.round(nbEnfants * 50000) : 0
  
  // 4. Conjoint : 12 mois supplémentaires si en couple
  const capitalConjoint = situation !== 'celibataire' ? Math.round(revenuMensuel * 12) : 0
  
  // Total capital décès conseillé
  const capitalConseille = capitalRemplacementRevenu + capitalLiquidationChargesPro + capitalEducation + capitalConjoint
  
  return {
    chargesTotalesMensuelles: Math.round(chargesTotales),
    revenuMensuelNetCible: Math.round(revenuCible),
    ijConseille,
    invaliditeConseille,
    capitalConseille,
    detailsCapitalIdeal: {
      capitalRemplacementRevenu,
      capitalLiquidationChargesPro,
      capitalEducation,
      capitalConjoint
    }
  }
}

// ============================================================================
// FONCTIONS DE CALCUL DES SECTIONS (IJ, INVALIDITÉ, DÉCÈS, SYNTHÈSE)
// ============================================================================

interface SectionIJParams {
  codeCaisse: string
  revenuAn: number
  revenuMensuel: number
  chargesTotal: number
  hasCPAM: boolean
  cpamGuarantees: any
  isCNBF: boolean
  cnbfGuarantees: any
  baseGuarantees: any
}

interface SectionIJResult {
  // Montants
  ijJour: number
  ijMensuel: number
  ijJourPhase2: number // Après J90
  ijMensuelPhase2: number
  // Régime
  regime: 'CPAM' | 'LPA' | 'CAISSE' | 'SSI' | 'MSA'
  phase1: { debut: number; fin: number; source: string; ijJour: number; carence: number }
  phase2: { debut: number; fin: number | null; source: string; ijJour: number } | null
  franchise: number
  dureeMax: string
  // Couverture
  tauxCouverture: number // % du revenu mensuel
  ecart: number // Manque à gagner mensuel
  objectif: number // 100% du revenu mensuel
  // Alertes
  alertes: Array<{ type: 'danger' | 'warning' | 'info' | 'success'; titre: string; message: string; icon: string }>
  // Pédagogie
  explication: string
  conseils: string[]
  // Simulation dynamique (mois par mois)
  simulation: Array<{
    mois: number
    joursArret: number
    joursTravailles: number
    ijTotal: number
    revenuTravail: number
    totalMois: number
    source: string
    perte: number
    tauxMaintien: number
  }>
}

function calculerSectionIJ(params: SectionIJParams): SectionIJResult {
  const { codeCaisse, revenuAn, revenuMensuel, chargesTotal, hasCPAM, cpamGuarantees, isCNBF, cnbfGuarantees, baseGuarantees } = params
  
  let ijJour = 0
  let ijJourPhase2 = 0
  let franchise = 0
  let regime: 'CPAM' | 'LPA' | 'CAISSE' | 'SSI' | 'MSA' = 'CAISSE'
  let phase1: SectionIJResult['phase1']
  let phase2: SectionIJResult['phase2'] = null
  let dureeMax = '3 ans'
  let explication = ''
  
  // Déterminer le régime et les montants
  if (isCNBF && cnbfGuarantees) {
    // AVOCATS : LPA/AON J1-90, CNBF J91+
    regime = 'LPA'
    ijJour = cnbfGuarantees.ijLPA
    ijJourPhase2 = cnbfGuarantees.ijCNBF
    franchise = 0 // Pas de carence pour LPA
    phase1 = { debut: 1, fin: 90, source: 'LPA/AON (assureur privé)', ijJour: cnbfGuarantees.ijLPA, carence: 0 }
    phase2 = { debut: 91, fin: null, source: 'CNBF (invalidité temporaire)', ijJour: cnbfGuarantees.ijCNBF }
    dureeMax = '3 ans max'
    explication = `En tant qu'avocat, vous bénéficiez d'un régime spécifique en 2 temps : LPA/AON (assureur privé de votre barreau) couvre les 90 premiers jours SANS CARENCE, puis la CNBF prend le relais avec une allocation d'invalidité temporaire.`
  } else if (hasCPAM && cpamGuarantees) {
    // PROFESSIONS LIBÉRALES CNAVPL : CPAM J4-90, Caisse J91+
    regime = 'CPAM'
    ijJour = cpamGuarantees.montantIJ_CPAM
    ijJourPhase2 = baseGuarantees.montantIJ_base
    franchise = 3 // Carence CPAM
    phase1 = { debut: 4, fin: 90, source: 'CPAM (régime CNAVPL)', ijJour: cpamGuarantees.montantIJ_CPAM, carence: 3 }
    phase2 = { debut: 91, fin: null, source: `${codeCaisse} (caisse de retraite)`, ijJour: baseGuarantees.montantIJ_base }
    explication = `Votre régime de base fonctionne en 2 temps : la CPAM vous verse des IJ du 4e au 90e jour (après 3 jours de carence), puis votre caisse ${codeCaisse} prend le relais à partir du 91e jour.`
  } else if (codeCaisse === 'SSI') {
    // SSI : Régime propre
    regime = 'SSI'
    ijJour = baseGuarantees.montantIJ_base
    ijJourPhase2 = baseGuarantees.montantIJ_base
    franchise = 3
    phase1 = { debut: 4, fin: 360, source: 'SSI (Sécurité Sociale Indépendants)', ijJour: baseGuarantees.montantIJ_base, carence: 3 }
    phase2 = null
    dureeMax = '360 jours sur 3 ans'
    explication = `En tant qu'artisan/commerçant affilié au SSI, vous bénéficiez d'IJ du 4e jour (après 3 jours de carence) jusqu'à 360 jours sur 3 ans.`
  } else if (codeCaisse === 'MSA') {
    // MSA : Régime agricole
    regime = 'MSA'
    ijJour = baseGuarantees.montantIJ_base
    ijJourPhase2 = baseGuarantees.montantIJ_base
    franchise = 4 // MSA : 4 jours depuis fév 2024
    phase1 = { debut: 5, fin: 365, source: 'MSA (AMEXA)', ijJour: baseGuarantees.montantIJ_base, carence: 4 }
    phase2 = null
    dureeMax = '365 jours'
    explication = `En tant qu'exploitant agricole affilié à la MSA, vous bénéficiez d'IJ AMEXA à partir du 5e jour (carence de 4 jours depuis février 2024).`
  } else {
    // Autres caisses : franchise longue généralement
    regime = 'CAISSE'
    ijJour = baseGuarantees.montantIJ_base
    ijJourPhase2 = baseGuarantees.montantIJ_base
    franchise = 90
    phase1 = { debut: 91, fin: null, source: `${codeCaisse}`, ijJour: baseGuarantees.montantIJ_base, carence: 90 }
    phase2 = null
    explication = `Votre caisse ${codeCaisse} a une franchise de 90 jours : aucune indemnité pendant les 3 premiers mois. C'est un risque majeur de trésorerie.`
  }
  
  const ijMensuel = Math.round(ijJour * 30)
  const ijMensuelPhase2 = Math.round(ijJourPhase2 * 30)
  const objectif = revenuMensuel
  const tauxCouverture = objectif > 0 ? Math.min(100, Math.round((ijMensuel / objectif) * 100)) : 0
  const ecart = Math.max(0, objectif - ijMensuel)
  
  // Alertes
  const alertes: SectionIJResult['alertes'] = []
  
  if (franchise >= 90 && regime !== 'LPA') {
    alertes.push({
      type: 'danger',
      titre: 'Franchise longue',
      message: `${franchise} jours sans indemnité = perte de ${Math.round(revenuMensuel * (franchise / 30)).toLocaleString('fr-FR')} €`,
      icon: '⏳'
    })
  } else if (franchise > 0 && franchise < 90) {
    alertes.push({
      type: 'info',
      titre: `Carence ${franchise} jours`,
      message: `Pas d'indemnité les ${franchise} premiers jours. Perte : ~${Math.round(revenuMensuel / 30 * franchise).toLocaleString('fr-FR')} €`,
      icon: '⏰'
    })
  }
  
  if (ijMensuel < chargesTotal) {
    alertes.push({
      type: 'danger',
      titre: 'IJ insuffisantes',
      message: `Vos IJ (${ijMensuel.toLocaleString('fr-FR')} €) ne couvrent pas vos charges (${chargesTotal.toLocaleString('fr-FR')} €). Déficit : ${(chargesTotal - ijMensuel).toLocaleString('fr-FR')} €/mois`,
      icon: '💸'
    })
  }
  
  if (tauxCouverture < 50) {
    alertes.push({
      type: 'warning',
      titre: 'Couverture très faible',
      message: `Vous ne maintiendrez que ${tauxCouverture}% de vos revenus. Risque de difficultés financières important.`,
      icon: '⚠️'
    })
  }
  
  if (regime === 'LPA') {
    alertes.push({
      type: 'success',
      titre: 'Couverture dès J1',
      message: 'Avantage avocat : LPA/AON vous couvre dès le 1er jour sans carence.',
      icon: '⚖️'
    })
  }
  
  // Conseils
  const conseils: string[] = []
  if (franchise >= 90) {
    conseils.push('Constituez une épargne de précaution de 3 mois de charges minimum')
    conseils.push('Une prévoyance complémentaire avec franchise courte est recommandée')
  }
  if (tauxCouverture < 70) {
    conseils.push('Envisagez une garantie IJ complémentaire pour atteindre 70-80% de maintien')
  }
  if (ijMensuel < chargesTotal) {
    conseils.push('Priorité absolue : couvrir au minimum vos charges fixes')
  }
  
  // Simulation mois par mois (36 mois = 3 ans)
  const simulation: SectionIJResult['simulation'] = []
  for (let mois = 1; mois <= 36; mois++) {
    const jourDebut = (mois - 1) * 30 + 1
    const jourFin = mois * 30
    let ijTotal = 0
    let source = ''
    
    // Calculer les IJ pour ce mois
    for (let d = jourDebut; d <= jourFin; d++) {
      if (isCNBF) {
        // CNBF : LPA J1-90, CNBF J91+
        if (d <= 90) {
          ijTotal += cnbfGuarantees?.ijLPA || 0
          source = 'LPA/AON'
        } else {
          ijTotal += cnbfGuarantees?.ijCNBF || 0
          source = 'CNBF'
        }
      } else if (hasCPAM) {
        // CPAM : carence 3j, CPAM J4-90, Caisse J91+
        if (d <= 3) {
          // Carence
        } else if (d <= 90) {
          ijTotal += cpamGuarantees?.montantIJ_CPAM || 0
          source = 'CPAM'
        } else {
          ijTotal += baseGuarantees?.montantIJ_base || 0
          source = codeCaisse
        }
      } else if (codeCaisse === 'SSI' || codeCaisse === 'MSA') {
        const carenceJours = codeCaisse === 'MSA' ? 4 : 3
        if (d <= carenceJours) {
          // Carence
        } else {
          ijTotal += baseGuarantees?.montantIJ_base || 0
          source = codeCaisse
        }
      } else {
        // Franchise 90 jours
        if (d > 90) {
          ijTotal += baseGuarantees?.montantIJ_base || 0
          source = codeCaisse
        }
      }
    }
    
    const totalMois = Math.round(ijTotal)
    const perte = revenuMensuel - totalMois
    const tauxMaintien = revenuMensuel > 0 ? Math.round((totalMois / revenuMensuel) * 100) : 0
    
    simulation.push({
      mois,
      joursArret: 30,
      joursTravailles: 0,
      ijTotal: totalMois,
      revenuTravail: 0,
      totalMois,
      source: source || 'Aucune',
      perte,
      tauxMaintien
    })
  }
  
  return {
    ijJour: Math.round(ijJour * 100) / 100,
    ijMensuel,
    ijJourPhase2: Math.round(ijJourPhase2 * 100) / 100,
    ijMensuelPhase2,
    regime,
    phase1,
    phase2,
    franchise,
    dureeMax,
    tauxCouverture,
    ecart,
    objectif,
    alertes,
    explication,
    conseils,
    simulation
  }
}

interface SectionInvaliditeParams {
  codeCaisse: string
  revenuAn: number
  revenuMensuel: number
  chargesTotal: number
  baseGuarantees: any
  idealCoverage: any
}

interface SectionInvaliditeResult {
  // Montants
  renteMensuelle: number
  renteAnnuelle: number
  // Couverture
  tauxCouverture: number
  ecart: number
  objectif: number
  // Types
  invaliditePartielle: boolean
  invaliditeTotale: boolean
  conditionsObtention: string
  // Alertes
  alertes: Array<{ type: 'danger' | 'warning' | 'info' | 'success'; titre: string; message: string; icon: string }>
  // Pédagogie
  explication: string
  conseils: string[]
  // Détails
  details: {
    categoriesExistantes: Array<{ nom: string; taux: string; montant: number }>
    delaiCarence: string
    duree: string
  }
}

function calculerSectionInvalidite(params: SectionInvaliditeParams): SectionInvaliditeResult {
  const { codeCaisse, revenuAn, revenuMensuel, chargesTotal, baseGuarantees, idealCoverage } = params
  
  const renteMensuelle = baseGuarantees.montantInvaliditeMensuel_base || 0
  const renteAnnuelle = renteMensuelle * 12
  const objectif = revenuMensuel
  const tauxCouverture = objectif > 0 ? Math.min(100, Math.round((renteMensuelle / objectif) * 100)) : 0
  const ecart = Math.max(0, objectif - renteMensuelle)
  
  // Alertes
  const alertes: SectionInvaliditeResult['alertes'] = []
  
  if (renteMensuelle < chargesTotal) {
    alertes.push({
      type: 'danger',
      titre: 'Rente insuffisante',
      message: `Votre rente (${renteMensuelle.toLocaleString('fr-FR')} €) ne couvre pas vos charges (${chargesTotal.toLocaleString('fr-FR')} €). Déficit : ${(chargesTotal - renteMensuelle).toLocaleString('fr-FR')} €/mois`,
      icon: '💸'
    })
  }
  
  if (tauxCouverture < 50) {
    alertes.push({
      type: 'warning',
      titre: 'Protection très faible',
      message: `En cas d'invalidité, vous ne toucherez que ${tauxCouverture}% de vos revenus actuels. C'est le risque le plus lourd financièrement.`,
      icon: '⚠️'
    })
  }
  
  // Explications selon la caisse
  let explication = ''
  let conditionsObtention = ''
  let delaiCarence = ''
  let duree = ''
  const categories: Array<{ nom: string; taux: string; montant: number }> = []
  
  if (codeCaisse === 'SSI') {
    explication = `L'invalidité SSI distingue 2 catégories : partielle (30% du RAAM) si vous pouvez exercer une activité réduite, totale (50% du RAAM) si vous ne pouvez plus travailler.`
    conditionsObtention = 'Incapacité réduisant de 2/3 la capacité de travail ou de gain'
    delaiCarence = '6 mois d\'affiliation minimum'
    duree = 'Jusqu\'à l\'âge de la retraite'
    categories.push({ nom: 'Invalidité partielle', taux: '30%', montant: Math.round(renteMensuelle * 0.6) })
    categories.push({ nom: 'Invalidité totale', taux: '50%', montant: renteMensuelle })
  } else if (codeCaisse === 'CNBF') {
    explication = `La CNBF verse une pension d'invalidité permanente **forfaitaire** (indépendante de votre revenu). Pour moins de 20 ans d'ancienneté : 50% de la retraite de base forfaitaire entière (18 964 €/an en 2025) = 9 482 €/an = 790 €/mois. Au-delà de 20 ans, le calcul devient proportionnel aux points acquis. Cette pension prend le relais après épuisement des IJ (3 ans) et est versée jusqu'à 62 ans. La CNBF ne couvre PAS l'invalidité partielle — seule l'invalidité totale (> 66%) est indemnisée.`
    conditionsObtention = 'Invalidité totale (> 66%) — incapacité d\'exercer la profession d\'avocat'
    delaiCarence = 'Après épuisement des IJ (max 3 ans = 1095 jours)'
    duree = 'Jusqu\'à 62 ans'
    categories.push({ nom: 'Invalidité partielle', taux: 'Non couvert', montant: 0 })
    categories.push({ nom: 'Invalidité totale (< 20 ans)', taux: '50% forfait base', montant: 790 })
  } else {
    explication = `Votre caisse ${codeCaisse} verse une rente d'invalidité en cas d'incapacité permanente d'exercer votre profession. Le montant dépend de votre classe de cotisation et de vos revenus antérieurs.`
    conditionsObtention = 'Incapacité permanente d\'exercer la profession'
    delaiCarence = 'Variable selon la caisse'
    duree = 'Jusqu\'à l\'âge de la retraite'
  }
  
  // Conseils
  const conseils: string[] = []
  if (tauxCouverture < 70) {
    conseils.push('L\'invalidité est le risque le plus coûteux : une prévoyance complémentaire est fortement recommandée')
  }
  if (renteMensuelle < chargesTotal) {
    conseils.push('Priorité : garantir au minimum le paiement de vos charges fixes en cas d\'invalidité')
  }
  conseils.push('Vérifiez les exclusions (affections psychiatriques, dos) dans votre contrat')
  
  return {
    renteMensuelle,
    renteAnnuelle,
    tauxCouverture,
    ecart,
    objectif,
    invaliditePartielle: true,
    invaliditeTotale: true,
    conditionsObtention,
    alertes,
    explication,
    conseils,
    details: {
      categoriesExistantes: categories,
      delaiCarence,
      duree
    }
  }
}

interface SectionDecesParams {
  codeCaisse: string
  revenuAn: number
  revenuMensuel: number
  chargesTotal: number
  situation: string
  nbEnfants: number
  baseGuarantees: any
  idealCoverage: any
}

interface SectionDecesResult {
  // Montants
  capitalBase: number
  capitalDoubleAccident: boolean
  // Couverture
  tauxCouverture: number
  ecart: number
  objectif: number
  moisDeRevenus: number
  // Bénéficiaires
  beneficiaires: string
  // Alertes
  alertes: Array<{ type: 'danger' | 'warning' | 'info' | 'success'; titre: string; message: string; icon: string }>
  // Pédagogie
  explication: string
  conseils: string[]
  // Détails du besoin idéal
  detailObjectif: {
    remplacementRevenu: number
    liquidationPro: number
    educationEnfants: number
    conjoint: number
    total: number
  }
}

function calculerSectionDeces(params: SectionDecesParams): SectionDecesResult {
  const { codeCaisse, revenuMensuel, chargesTotal, situation, nbEnfants, baseGuarantees, idealCoverage } = params
  
  const capitalBase = baseGuarantees.montantDecesCapital_base || 0
  const capitalDoubleAccident = codeCaisse !== 'CARMF' // CARMF n'a plus le doublement
  const objectif = idealCoverage.capitalConseille
  const tauxCouverture = objectif > 0 ? Math.min(100, Math.round((capitalBase / objectif) * 100)) : 0
  const ecart = Math.max(0, objectif - capitalBase)
  const moisDeRevenus = revenuMensuel > 0 ? Math.round((capitalBase / revenuMensuel) * 10) / 10 : 0
  
  // Alertes
  const alertes: SectionDecesResult['alertes'] = []
  
  if (situation !== 'celibataire' || nbEnfants > 0) {
    if (tauxCouverture < 50) {
      alertes.push({
        type: 'danger',
        titre: 'Protection famille insuffisante',
        message: `Le capital (${capitalBase.toLocaleString('fr-FR')} €) ne représente que ${moisDeRevenus} mois de revenus. Vos proches seraient en grande difficulté.`,
        icon: '👨‍👩‍👧'
      })
    }
    
    if (nbEnfants > 0) {
      const capitalEducation = nbEnfants * 50000
      if (capitalBase < capitalEducation) {
        alertes.push({
          type: 'warning',
          titre: 'Éducation des enfants',
          message: `Pour ${nbEnfants} enfant(s), prévoyez ~${capitalEducation.toLocaleString('fr-FR')} € pour leur éducation.`,
          icon: '🎓'
        })
      }
    }
  } else {
    alertes.push({
      type: 'info',
      titre: 'Situation célibataire',
      message: 'Le capital décès est moins critique si vous n\'avez pas de personnes à charge.',
      icon: 'ℹ️'
    })
  }
  
  if (capitalDoubleAccident) {
    alertes.push({
      type: 'success',
      titre: 'Doublement accident',
      message: `Capital doublé (${(capitalBase * 2).toLocaleString('fr-FR')} €) en cas de décès par accident.`,
      icon: '✅'
    })
  }
  
  // Explication
  let explication = `Le capital décès est la somme versée à vos bénéficiaires (conjoint, enfants) en cas de décès. `
  if (situation === 'celibataire' && nbEnfants === 0) {
    explication += `Étant célibataire sans enfant, ce risque est moins prioritaire, sauf si vous avez des dettes professionnelles.`
  } else {
    explication += `Avec ${situation === 'celibataire' ? '' : 'un conjoint'}${nbEnfants > 0 ? ` et ${nbEnfants} enfant(s)` : ''}, ce capital doit permettre à votre famille de maintenir son niveau de vie.`
  }
  
  // Conseils
  const conseils: string[] = []
  if (tauxCouverture < 50 && (situation !== 'celibataire' || nbEnfants > 0)) {
    conseils.push('Envisagez une assurance décès complémentaire pour protéger votre famille')
  }
  conseils.push('Désignez clairement vos bénéficiaires et mettez à jour la clause régulièrement')
  if (chargesTotal > 0) {
    conseils.push('Pensez à couvrir vos dettes professionnelles (crédit, bail, etc.)')
  }
  
  // Bénéficiaires selon situation
  let beneficiaires = 'Conjoint et/ou enfants désignés'
  if (situation === 'celibataire') {
    beneficiaires = 'Héritiers légaux ou bénéficiaires désignés'
  }
  
  return {
    capitalBase,
    capitalDoubleAccident,
    tauxCouverture,
    ecart,
    objectif,
    moisDeRevenus,
    beneficiaires,
    alertes,
    explication,
    conseils,
    detailObjectif: {
      remplacementRevenu: idealCoverage.detailsCapitalIdeal.capitalRemplacementRevenu,
      liquidationPro: idealCoverage.detailsCapitalIdeal.capitalLiquidationChargesPro,
      educationEnfants: idealCoverage.detailsCapitalIdeal.capitalEducation,
      conjoint: idealCoverage.detailsCapitalIdeal.capitalConjoint,
      total: idealCoverage.capitalConseille
    }
  }
}

interface SyntheseParams {
  sectionIJ: SectionIJResult
  sectionInvalidite: SectionInvaliditeResult
  sectionDeces: SectionDecesResult
  revenuMensuel: number
  chargesTotal: number
  situation: string
  nbEnfants: number
  codeCaisse: string
}

interface SyntheseResult {
  // Score global
  scoreGlobal: number // 0-100
  niveau: 'critique' | 'insuffisant' | 'moyen' | 'bon' | 'excellent'
  couleur: string
  // Résumé
  resume: string
  // Priorités (ordonnées)
  priorites: Array<{
    rang: number
    domaine: 'IJ' | 'Invalidité' | 'Décès'
    urgence: 'haute' | 'moyenne' | 'basse'
    action: string
    impact: string
  }>
  // Perte maximale potentielle
  perteMaximale: {
    mensuelle: number
    annuelle: number
    description: string
  }
  // Recommandation principale
  recommandationPrincipale: string
  // Points forts
  pointsForts: string[]
  // Points faibles
  pointsFaibles: string[]
}

function calculerSyntheseGlobale(params: SyntheseParams): SyntheseResult {
  const { sectionIJ, sectionInvalidite, sectionDeces, revenuMensuel, chargesTotal, situation, nbEnfants, codeCaisse } = params
  
  // Score pondéré : IJ (40%), Invalidité (40%), Décès (20%)
  // Ajustement selon situation familiale
  let poidsIJ = 40
  let poidsInv = 40
  let poidsDec = 20
  
  if (situation !== 'celibataire' || nbEnfants > 0) {
    // Famille : décès plus important
    poidsIJ = 35
    poidsInv = 35
    poidsDec = 30
  }
  
  const scoreIJ = sectionIJ.tauxCouverture
  const scoreInv = sectionInvalidite.tauxCouverture
  const scoreDec = sectionDeces.tauxCouverture
  
  const scoreGlobal = Math.round((scoreIJ * poidsIJ + scoreInv * poidsInv + scoreDec * poidsDec) / 100)
  
  // Niveau
  let niveau: SyntheseResult['niveau']
  let couleur: string
  if (scoreGlobal < 25) {
    niveau = 'critique'
    couleur = '#dc2626'
  } else if (scoreGlobal < 50) {
    niveau = 'insuffisant'
    couleur = '#ea580c'
  } else if (scoreGlobal < 70) {
    niveau = 'moyen'
    couleur = '#ca8a04'
  } else if (scoreGlobal < 90) {
    niveau = 'bon'
    couleur = '#16a34a'
  } else {
    niveau = 'excellent'
    couleur = '#059669'
  }
  
  // Priorités
  const priorites: SyntheseResult['priorites'] = []
  
  // Trier par urgence
  const scores = [
    { domaine: 'IJ' as const, score: scoreIJ, section: sectionIJ },
    { domaine: 'Invalidité' as const, score: scoreInv, section: sectionInvalidite },
    { domaine: 'Décès' as const, score: scoreDec, section: sectionDeces }
  ].sort((a, b) => a.score - b.score)
  
  scores.forEach((s, i) => {
    let urgence: 'haute' | 'moyenne' | 'basse' = 'basse'
    let action = ''
    let impact = ''
    
    if (s.score < 50) {
      urgence = 'haute'
    } else if (s.score < 70) {
      urgence = 'moyenne'
    }
    
    if (s.domaine === 'IJ') {
      action = s.score < 50 ? 'Souscrire une garantie IJ complémentaire immédiatement' : 'Vérifier les exclusions de votre contrat'
      impact = `Couverture actuelle : ${s.score}% de vos revenus`
    } else if (s.domaine === 'Invalidité') {
      action = s.score < 50 ? 'Priorité absolue : garantie invalidité complémentaire' : 'Optimiser le montant de la rente'
      impact = `Rente actuelle : ${sectionInvalidite.renteMensuelle.toLocaleString('fr-FR')} €/mois`
    } else {
      action = s.score < 50 && (situation !== 'celibataire' || nbEnfants > 0) ? 'Souscrire une assurance décès pour protéger votre famille' : 'Vérifier la clause bénéficiaire'
      impact = `Capital actuel : ${sectionDeces.capitalBase.toLocaleString('fr-FR')} € (${sectionDeces.moisDeRevenus} mois)`
    }
    
    priorites.push({ rang: i + 1, domaine: s.domaine, urgence, action, impact })
  })
  
  // Perte maximale
  const perteMensuelle = revenuMensuel - Math.min(sectionIJ.ijMensuel, sectionInvalidite.renteMensuelle)
  const perteMaximale = {
    mensuelle: perteMensuelle,
    annuelle: perteMensuelle * 12,
    description: `En cas d'arrêt prolongé, vous pourriez perdre jusqu'à ${perteMensuelle.toLocaleString('fr-FR')} €/mois (${Math.round((perteMensuelle / revenuMensuel) * 100)}% de vos revenus)`
  }
  
  // Résumé
  let resume = ''
  if (niveau === 'critique') {
    resume = `⚠️ ALERTE : Votre protection est critique (${scoreGlobal}%). Un arrêt de travail pourrait vous mettre en grande difficulté financière. Action urgente requise.`
  } else if (niveau === 'insuffisant') {
    resume = `⚠️ Attention : Votre protection est insuffisante (${scoreGlobal}%). Des lacunes importantes existent dans votre couverture.`
  } else if (niveau === 'moyen') {
    resume = `📊 Votre protection est moyenne (${scoreGlobal}%). Des améliorations sont possibles pour sécuriser votre situation.`
  } else if (niveau === 'bon') {
    resume = `✅ Votre protection est bonne (${scoreGlobal}%). Quelques optimisations peuvent être envisagées.`
  } else {
    resume = `🎯 Excellent ! Votre protection est optimale (${scoreGlobal}%). Maintenez ce niveau et révisez annuellement.`
  }
  
  // Recommandation principale
  let recommandationPrincipale = ''
  if (scoreIJ < 50 && sectionIJ.franchise >= 90) {
    recommandationPrincipale = `Priorité n°1 : Souscrire une prévoyance avec franchise courte (15-30 jours) pour combler les 90 jours sans indemnité de votre caisse ${codeCaisse}.`
  } else if (scoreInv < 50) {
    recommandationPrincipale = `Priorité n°1 : L'invalidité est votre risque majeur. Une garantie complémentaire est indispensable pour couvrir vos ${chargesTotal.toLocaleString('fr-FR')} € de charges mensuelles.`
  } else if (scoreDec < 50 && (situation !== 'celibataire' || nbEnfants > 0)) {
    recommandationPrincipale = `Priorité n°1 : Protégez votre famille avec une assurance décès complémentaire de ${sectionDeces.ecart.toLocaleString('fr-FR')} € minimum.`
  } else {
    recommandationPrincipale = `Votre couverture de base est correcte. Vérifiez les exclusions (dos, psy) et optimisez les garanties complémentaires si besoin.`
  }
  
  // Points forts
  const pointsForts: string[] = []
  if (sectionIJ.regime === 'LPA') pointsForts.push('Couverture LPA dès le 1er jour (pas de carence)')
  if (scoreIJ >= 70) pointsForts.push(`IJ couvrant ${scoreIJ}% des revenus`)
  if (scoreInv >= 70) pointsForts.push(`Invalidité couvrant ${scoreInv}% des revenus`)
  if (scoreDec >= 70) pointsForts.push(`Capital décès représentant ${sectionDeces.moisDeRevenus} mois de revenus`)
  if (sectionDeces.capitalDoubleAccident) pointsForts.push('Doublement du capital en cas d\'accident')
  
  // Points faibles
  const pointsFaibles: string[] = []
  if (sectionIJ.franchise >= 90) pointsFaibles.push(`Franchise longue de ${sectionIJ.franchise} jours`)
  if (scoreIJ < 50) pointsFaibles.push(`IJ ne couvrant que ${scoreIJ}% des revenus`)
  if (scoreInv < 50) pointsFaibles.push(`Invalidité ne couvrant que ${scoreInv}% des revenus`)
  if (scoreDec < 50 && (situation !== 'celibataire' || nbEnfants > 0)) pointsFaibles.push('Capital décès insuffisant pour la famille')
  if (sectionIJ.ijMensuel < chargesTotal) pointsFaibles.push('IJ inférieures aux charges mensuelles')
  
  return {
    scoreGlobal,
    niveau,
    couleur,
    resume,
    priorites,
    perteMaximale,
    recommandationPrincipale,
    pointsForts,
    pointsFaibles
  }
}

// ============================================================================
// ROUTES API
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // GET /api/.../prevoyance-tns?action=classes&caisse=CARMF
    if (action === 'classes') {
      const caisse = searchParams.get('caisse')
      if (!caisse || !CAISSES_RULES[caisse]) {
        return NextResponse.json({ success: false, error: 'Caisse non trouvée' }, { status: 400 })
      }
      const caisseData = CAISSES_RULES[caisse]
      
      // Transformer les classes pour le frontend avec valeurs explicites
      let classesForFrontend: Array<{
        classe: string
        ij: number | string
        invalidite: number | null
        deces: number
        descIj: string
        descInv: string
        descDeces: string
        isProportionnel?: boolean
        exempleIJ?: string
      }> = []
      
      if (caisseData.classes) {
        classesForFrontend = caisseData.classes.map((c, index) => {
          // CARMF Classe B : IJ proportionnelle (1/730e du revenu)
          if (caisse === 'CARMF' && c.classe === 'B') {
            return {
              ...c,
              ij: 'proportionnel',
              isProportionnel: true,
              exempleIJ: '1/730e du revenu N-2 (ex: 100€/j pour 73k€ de revenus)',
              descIj: 'IJ proportionnelle : 1/730e du revenu N-2. Ex: 73 000€ → 100€/jour. Franchise 90 jours.'
            }
          }
          return c
        })
      }
      
      return NextResponse.json({
        success: true,
        classes: classesForFrontend,
        description: caisseData.description,
        garanties: caisseData.garanties
      })
    }

    // GET /api/.../prevoyance-tns (config complète avec paramètres 2025)
    return NextResponse.json({
      success: true,
      data: {
        professions: PROFESSIONS,
        caisses: Object.entries(CAISSES_RULES).map(([code, data]) => ({
          code,
          description: data.description,
          hasClasses: data.classes !== null,
          classesCount: data.classes?.length || 0
        })),
        // Paramètres 2025 exportés pour le frontend
        annee: ANNEE_PARAMS,
        pass: PASS_2025,
        cpam: {
          ijMin: CPAM_2025.ijMin,
          ijMax: CPAM_2025.ijMax,
          seuilMinPass: CPAM_2025.seuilMinPass,
          seuilMaxPass: CPAM_2025.seuilMaxPass,
          carenceJours: CPAM_2025.carenceJours,
          debutVersement: CPAM_2025.debutVersement,
          finVersement: CPAM_2025.finVersement,
          dureeMaxJours: CPAM_2025.dureeMaxJours,
          formule: CPAM_2025.formule,
        },
        caissesAvecCPAM: CAISSES_AVEC_CPAM,
        caissesRegimeSpecifique: CAISSES_REGIME_SPECIFIQUE,
        // SSI spécifique
        ssi: {
          ijMax: SSI_2025.ij.max,
          ijConjoint: SSI_2025.ij.conjointCollaborateur,
          capitalDeces: SSI_2025.deces.capitalBase,
        },
      }
    })
  } catch (error: any) {
    logger.error('[API Prevoyance TNS] GET Error:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ success: false, error: 'Erreur serveur interne' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      profession, 
      codeCaisse, 
      classeValue, 
      situation = 'celibataire'
    } = body

    // Parse et valide toutes les valeurs numériques
    const revenuAn = Math.max(0, parseFloat(body.revenuAn) || 0)
    const age = Math.max(18, Math.min(70, parseInt(body.age) || 35))
    const nbEnfants = Math.max(0, Math.min(10, parseInt(body.nbEnfants) || 0))
    const chargePerso = Math.max(0, parseFloat(body.chargePerso) || 0)
    const chargePro = Math.max(0, parseFloat(body.chargePro) || 0)

    // Validation
    if (!codeCaisse || revenuAn <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Caisse et revenu annuel sont obligatoires'
      }, { status: 400 })
    }

    if (!CAISSES_RULES[codeCaisse]) {
      return NextResponse.json({
        success: false,
        error: 'Caisse non reconnue'
      }, { status: 400 })
    }

    // Parse classe index - Détermination automatique selon la caisse
    let classeIndex: number | null = null
    
    // Si une classe est explicitement sélectionnée, l'utiliser
    if (classeValue !== '' && classeValue !== undefined && classeValue !== null) {
      classeIndex = parseInt(classeValue, 10)
    } else {
      // Détermination automatique selon la caisse et le revenu
      if (codeCaisse === 'CARMF') {
        // CARMF : Classe déterminée par le revenu N-2
        if (revenuAn <= 47100) classeIndex = 0 // Classe A
        else if (revenuAn >= 141300) classeIndex = 2 // Classe C
        else classeIndex = 1 // Classe B (proportionnelle)
      } else if (codeCaisse === 'CARPIMKO') {
        // CARPIMKO : Libre choix mais on recommande selon le revenu
        if (revenuAn < 30000) classeIndex = 0 // Classe 1
        else if (revenuAn < 60000) classeIndex = 1 // Classe 2
        else if (revenuAn < 90000) classeIndex = 2 // Classe 3
        else classeIndex = 3 // Classe 4
      } else if (codeCaisse === 'CARCDSF') {
        // CARCDSF : Classe selon profession (CD=0, SF=1)
        // Par défaut dentiste (classe 0)
        if (profession === 'sage_femme') classeIndex = 1
        else classeIndex = 0
      } else if (codeCaisse === 'CARPV') {
        // CARPV Vétérinaires : 3 classes selon revenu
        if (revenuAn < 50000) classeIndex = 0 // Classe 1
        else if (revenuAn < 100000) classeIndex = 1 // Classe 2
        else classeIndex = 2 // Classe 3
      } else if (codeCaisse === 'CAVAMAC' || codeCaisse === 'CAVOM' || codeCaisse === 'CPRN') {
        // CAVAMAC, CAVOM, CPRN : 2 classes A/B selon revenu
        if (revenuAn < 80000) classeIndex = 0 // Classe A
        else classeIndex = 1 // Classe B
      }
    }

    // Calcul des garanties de base (caisse spécifique)
    const baseGuarantees = calculerGarantiesBase(codeCaisse, classeIndex, revenuAn, situation)

    // Calcul des IJ CPAM (régime commun CNAVPL) si la caisse est concernée
    const hasCPAM = CAISSES_AVEC_CPAM.includes(codeCaisse)
    const cpamGuarantees = hasCPAM ? calculerIJ_CPAM(revenuAn) : null

    // Calcul spécifique CNBF (avocats) : LPA/AON (J1-90) + CNBF (J91+)
    const isCNBF = codeCaisse === 'CNBF'
    const cnbfGuarantees = isCNBF ? calculerIJ_CNBF(revenuAn) : null

    // Calcul de la couverture idéale
    const idealCoverage = calculerCouvertureIdeale(revenuAn, chargePerso, chargePro, situation, nbEnfants)

    // Données du formulaire pour référence
    const formData = {
      profession,
      codeCaisse,
      classeValue,
      revenuAn,
      age,
      situation,
      nbEnfants,
      chargePerso,
      chargePro
    }

    // =========================================================================
    // CALCULS COMPLETS CÔTÉ SERVEUR - Structure détaillée pour le frontend
    // =========================================================================
    const revenuMensuel = Math.round(revenuAn / 12)
    const chargesTotal = chargePerso + chargePro

    // --- SECTION 1: ARRÊT MALADIE (IJ) ---
    const sectionIJ = calculerSectionIJ({
      codeCaisse,
      revenuAn,
      revenuMensuel,
      chargesTotal,
      hasCPAM,
      cpamGuarantees,
      isCNBF,
      cnbfGuarantees,
      baseGuarantees
    })

    // --- SECTION 2: INVALIDITÉ ---
    const sectionInvalidite = calculerSectionInvalidite({
      codeCaisse,
      revenuAn,
      revenuMensuel,
      chargesTotal,
      baseGuarantees,
      idealCoverage
    })

    // --- SECTION 3: DÉCÈS ---
    const sectionDeces = calculerSectionDeces({
      codeCaisse,
      revenuAn,
      revenuMensuel,
      chargesTotal,
      situation,
      nbEnfants,
      baseGuarantees,
      idealCoverage
    })

    // --- SYNTHÈSE GLOBALE ---
    const synthese = calculerSyntheseGlobale({
      sectionIJ,
      sectionInvalidite,
      sectionDeces,
      revenuMensuel,
      chargesTotal,
      situation,
      nbEnfants,
      codeCaisse
    })

    return NextResponse.json({
      success: true,
      formData,
      // Paramètres 2025 pour référence
      params2025: {
        annee: ANNEE_PARAMS,
        pass: PASS_2025,
        cpam: CPAM_2025,
      },
      // Données brutes (compatibilité)
      cpamGuarantees,
      hasCPAM,
      cnbfGuarantees,
      isCNBF,
      baseGuarantees,
      idealCoverage,
      caisseInfo: {
        code: codeCaisse,
        description: CAISSES_RULES[codeCaisse].description,
        garanties: CAISSES_RULES[codeCaisse].garanties
      },
      // =========================================
      // NOUVELLES SECTIONS PRÉ-CALCULÉES
      // =========================================
      sections: {
        ij: sectionIJ,
        invalidite: sectionInvalidite,
        deces: sectionDeces
      },
      synthese,
      // =========================================
      // FISCALITÉ MADELIN
      // =========================================
      madelin: {
        plafondDeductible: calculPlafondMadelinPrevoyance(revenuAn),
        revenuBase: revenuAn,
      }
    })
  } catch (error: any) {
    logger.error('[Prevoyance TNS] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({
      success: false,
      error: error.message || 'Erreur lors de la simulation'
    }, { status: 500 })
  }
}
