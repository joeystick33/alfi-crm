/**
 * PARAMÈTRES PRÉVOYANCE TNS 2025
 * 
 * Sources officielles :
 * - CARMF : https://www.gpm.fr/uri-carmf-reforme-2025-cotisations-prestations/
 * - CAVEC : https://www.cavec.fr/votre-prevoyance/
 * - CARCDSF : https://www.carcdsf.fr/prevoyance/indemnites-journalieres
 * - CARPIMKO : https://www.gpm.fr/carpimko-evolution-2024-cotisations-et-prestations/
 * - CNBF : https://www.cnbf.fr/espace-avocats/les-droits/linvalidite-deces/
 * - MSA : https://www.msa.fr/lfp/en/sante/ij-amexa
 * - SSI : https://www.toutsurmesfinances.com/argent/a/indemnites-journalieres-montants-calcul-plafond-duree-et-versement
 * - CARPV : https://www.metlife.fr/assurance-prevoyance-professionnels/travailleurs-non-salaries/regime-tns/carpv/
 * - CAVP : https://www.difiplus.fr/cavp-assurance-vieillesse-pharmacien/
 * 
 * Mis à jour : Décembre 2025
 */

// ============================================================================
// PLAFOND SÉCURITÉ SOCIALE 2025
// ============================================================================
export const PASS_2025 = 47100
export const PASS_MENSUEL_2025 = 3925
export const PASS_JOURNALIER_2025 = 183

// ============================================================================
// RÉGIME IJ MALADIE - Tous les TNS ont des IJ après carence
// 
// PROFESSIONS LIBÉRALES CNAVPL : IJ CPAM (jours 4-90) puis caisse spécifique (jour 91+)
// SSI (artisans/commerçants) : IJ CPAM (jour 4+, max 360j/3ans)
// MSA (agriculteurs) : IJ MSA (jour 5+, max 36 mois) - carence 4 jours
// CNBF (avocats) : Régime spécifique LPA/AON puis CNBF
// ============================================================================
export const CPAM_2025 = {
  ijMin: 25.80,           // Minimum si revenus < 40% PASS
  ijMax: 193.56,          // Maximum si revenus ≥ 3 PASS
  seuilMinPass: 0.40,     // 40% PASS = 18 840 €
  seuilMaxPass: 3.0,      // 3 PASS = 141 300 €
  carenceJours: 3,        // Carence 3 jours
  debutVersement: 4,      // Versement à partir du jour 4
  finVersement: 90,       // Jusqu'au jour 90
  dureeMaxJours: 87,      // 87 jours de versement
  formule: '1/730e du RAAM (3 dernières années)',
}

// Caisses bénéficiant du régime CPAM (IJ versées après carence 3j)
// TOUTES les caisses ont des IJ après carence - SSI et MSA inclus
export const CAISSES_AVEC_CPAM = [
  'CIPAV', 'CARMF', 'CARPIMKO', 'CAVEC', 'CAVP', 
  'CARCDSF', 'CARPV', 'CAVAMAC', 'CAVOM', 'CPRN',
  'SSI', 'MSA' // SSI et MSA ont aussi des IJ CPAM/MSA après carence
]

// Caisses avec régime spécifique (pas le régime commun CNAVPL)
// Mais elles ont quand même des IJ après carence
export const CAISSES_REGIME_SPECIFIQUE = ['CNBF', 'ENIM']

// ============================================================================
// SSI - Sécurité Sociale des Indépendants (Artisans/Commerçants)
// ============================================================================
export const SSI_2025 = {
  ij: {
    formule: '1/730e du RAAM (3 dernières années)',
    plafondRevenu: PASS_2025,  // Plafond 1 PASS
    max: 64.52,               // 1 PASS / 730 = 64,52 €
    conjointCollaborateur: 31.75,  // 50% du max
    carenceJours: 3,
    dureeMaxJours: 360,       // 360 jours sur 3 ans
    periodeTroisAns: true,
  },
  invalidite: {
    categorie1: {
      taux: 0.30,              // 30% du RAAM
      description: 'Invalidité partielle - capacité de travail réduite',
    },
    categorie2: {
      taux: 0.50,              // 50% du RAAM
      plafondAnnuel: 23550,    // 50% PASS
      description: 'Invalidité totale - incapacité d\'exercer toute activité',
    },
  },
  deces: {
    capitalBase: 8798,         // ~20% PASS (8 240 € + revalorisation)
    description: 'Capital versé au conjoint ou ayants droit',
  },
}

// ============================================================================
// MSA - Mutualité Sociale Agricole (AMEXA)
// Source : https://www.lafranceagricole.fr - Revalorisation 1er avril 2025
// ============================================================================
export const MSA_2025 = {
  anneeReference: 'N-1',
  revalorisation: '2025-04-01', // Revalorisation annuelle au 1er avril
  
  ij: {
    // CORRECTION 2025 : Montants différenciés selon la durée
    montantJours1_28: 25.79,    // Jours 1-28 (ancien : 24,24 €)
    montantJours29Plus: 34.39,  // À partir du jour 29 (ancien : 32,32 €)
    carenceJours: 4,            // CHANGEMENT 2024 : 4 jours (avant : 7 jours)
    carenceHospitalisation: 3,  // 3 jours si hospitalisation
    dureeMaxMois: 36,           // 3 ans pour ALD ou arrêt > 6 mois
    dureeMaxJours: 360,         // 360 jours sur 3 ans pour arrêts < 6 mois
  },
  invalidite: {
    description: 'Pension AMEXA proportionnelle aux revenus antérieurs',
  },
  deces: {
    capitalForfaitaire: 3539,
    description: 'Capital décès forfaitaire',
  },
}

// ============================================================================
// CIPAV - Professions libérales non réglementées
// ATTENTION : Pas d'IJ CIPAV après 90 jours ! Uniquement régime CPAM 4-90j
// ============================================================================
export const CIPAV_2025 = {
  ij: {
    apres90Jours: false,       // PAS d'IJ CIPAV après 90 jours
    uniquementCPAM: true,      // Uniquement régime commun CPAM 4-90j
  },
  invalidite: {
    reforme2023: true,         // Réforme 2023 : classes supprimées
    proportionnelRevenus: true,
    description: 'Prestations proportionnelles aux revenus (plus de classes depuis 2023)',
  },
  deces: {
    reforme2023: true,
    proportionnelRevenus: true,
    description: 'Capital selon revenus cotisés et situation familiale',
  },
}

// ============================================================================
// CARMF - Médecins (RÉFORME 2025)
// Source : https://www.gpm.fr/uri-carmf-reforme-2025-cotisations-prestations/
// Année de référence : N-2 (revenu 2023 pour 2025)
// ============================================================================
export const CARMF_2025 = {
  reforme2025: true,
  anneeReference: 'N-2',
  franchiseJours: 90,
  dureeMaxAns: 3,
  
  // POINT CLÉ : Seuil d'équivalence 2024/2025 = 82 200 €
  // Si revenu < 82 200 € : IJ 2025 BAISSE vs 2024
  // Si revenu > 82 200 € : IJ 2025 HAUSSE vs 2024
  seuilEquivalence2024_2025: 82200,
  
  // Classe A : revenus ≤ 1 PASS (47 100 €)
  classeA: {
    seuilRevenuMax: PASS_2025,
    ijJour: 64.52,
    cotisationAnnuelle: 623,
    invaliditeAnnuelle: 23198,
    deces: 60000,
    description: 'Revenus ≤ 47 100 € (1 PASS)',
  },
  
  // Classe B : revenus entre 1 et 3 PASS (NOUVEAU 2025 : PROPORTIONNEL)
  classeB: {
    seuilRevenuMin: PASS_2025,
    seuilRevenuMax: PASS_2025 * 3,
    ijFormule: '1/730e du revenu N-2',
    cotisationFormule: '434 € + 0,4% du revenu',
    cotisationFixe: 434,
    cotisationTaux: 0.004,
    invaliditeProportionnelle: true,
    deces: 60000,
    description: 'Revenus entre 47 100 € et 141 300 € (1-3 PASS) - IJ proportionnelle',
  },
  
  // Classe C : revenus ≥ 3 PASS (141 300 €)
  classeC: {
    seuilRevenuMin: PASS_2025 * 3,
    ijJour: 193.56,
    cotisationAnnuelle: 999,
    invaliditeAnnuelle: 30930,
    deces: 60000,
    description: 'Revenus ≥ 141 300 € (3 PASS)',
  },
  
  // Classe D SUPPRIMÉE en 2025
  classeD: null,
  
  // Capital décès : pas de doublement accident depuis réforme
  decesDoublementAccident: false,
}

// ============================================================================
// CAVEC - Experts-comptables (8 CLASSES A-H)
// Source : https://www.cavec.fr/votre-prevoyance/
// Année de référence : N-1 (revenu 2024 pour 2025)
// ============================================================================
export const CAVEC_2025 = {
  anneeReference: 'N-1',
  
  // IJ : Taux unique APRÈS jour 90 (CPAM couvre jours 4-90)
  ij: {
    montantJour: 125,          // 125 € bruts/jour (taux unique)
    debutVersement: 91,        // À partir du 91e jour
    dureeMaxMois: 36,          // 36 mois ou 1095 jours cumulés
    dureeMaxJours: 1095,
    cpamAvant: true,           // Jours 4-90 = CPAM (régime commun)
  },
  
  // 8 CLASSES selon le revenu N-1
  classes: [
    { classe: 'A', seuilRevenuMax: 16190, cotisation: 782, pointsRetraite: 48, description: 'Revenus ≤ 16 190 €' },
    { classe: 'B', seuilRevenuMax: 32350, cotisation: 2934, pointsRetraite: 180, description: 'Revenus ≤ 32 350 €' },
    { classe: 'C', seuilRevenuMax: 44790, cotisation: 4629, pointsRetraite: 284, description: 'Revenus ≤ 44 790 €' },
    { classe: 'D', seuilRevenuMax: 61560, cotisation: 6324, pointsRetraite: 388, description: 'Revenus ≤ 61 560 €' },
    { classe: 'E', seuilRevenuMax: 79245, cotisation: 7965, pointsRetraite: 488, description: 'Revenus ≤ 79 245 €' },
    { classe: 'F', seuilRevenuMax: 99270, cotisation: 9858, pointsRetraite: 605, description: 'Revenus ≤ 99 270 €' },
    { classe: 'G', seuilRevenuMax: 116340, cotisation: 11532, pointsRetraite: 708, description: 'Revenus ≤ 116 340 €' },
    { classe: 'H', seuilRevenuMax: Infinity, cotisation: 24450, pointsRetraite: 1500, description: 'Revenus > 132 780 €' },
  ],
  
  invalidite: {
    commissionInaptitude: true,
    proportionnelCotisations: true,
  },
  deces: {
    selonClasse: true,
    renteEducation: true,
  },
}

// ============================================================================
// CARPIMKO - Paramédicaux (RÉFORME 2025 - LIBRE CHOIX)
// Source : https://laruche.cbainfo.fr/actualites/nouveautes-carpimko/
// Année de référence : N-1 (revenu 2024 pour 2025)
// PARTICULARITÉ : Libre choix de la classe (non basé sur revenu)
// ============================================================================
export const CARPIMKO_2025 = {
  reforme2025: true,
  anneeReference: 'N-1',
  libreChoix: true,            // Le professionnel CHOISIT sa classe
  franchiseJours: 90,           // À partir du 91e jour
  dureeMaxAns: 3,
  
  // 4 CLASSES AU CHOIX (cotisation identique pour toutes)
  classes: [
    { classe: '1', ijJour: 33.50, invaliditeAnnuelle: 8000, deces: 30000, cotisation: 1022, recommandePour: 'Revenus < 30 000 €' },
    { classe: '2', ijJour: 67.00, invaliditeAnnuelle: 16000, deces: 30000, cotisation: 1022, recommandePour: 'Revenus 30 000 - 60 000 €' },
    { classe: '3', ijJour: 100.50, invaliditeAnnuelle: 24000, deces: 30000, cotisation: 1022, recommandePour: 'Revenus 60 000 - 90 000 €' },
    { classe: '4', ijJour: 134.00, invaliditeAnnuelle: 32000, deces: 30000, cotisation: 1022, recommandePour: 'Revenus > 90 000 €' },
  ],
  
  // MAJORATIONS 2025 (réductions appliquées)
  majorations2025: {
    conjoint: {
      supprimee: true,         // ❌ SUPPRIMÉE en 2025
      ancienMontant: null,
    },
    enfant: {
      montantJour: 8.06,       // Réduit de 50% (était 16,63 €)
      parEnfant: true,
      description: '+8,06 €/jour par enfant à charge',
    },
    tiercePersonne: {
      montantJour: 20.16,      // ~20 €/jour
      montantAnnuel: 7358,     // Annualisé
      description: '+20,16 €/jour si besoin tierce personne',
    },
  },
  
  // PACS reconnu depuis juillet 2024
  pacsReconnu: true,
  pacsReconnuDepuis: '2024-07-01',
}

// ============================================================================
// CARCDSF - Chirurgiens-dentistes et Sages-femmes (PAS DE CLASSES)
// Source : https://www.carcdsf.fr/prevoyance/indemnites-journalieres
// Année de référence : N-1 (revenu 2024 pour 2025)
// PARTICULARITÉ : Forfaitaire par profession (pas de classes)
// ============================================================================
export const CARCDSF_2025 = {
  anneeReference: 'N-1',
  tauxUniques: true,           // Pas de classes = montants forfaitaires
  franchiseJours: 90,
  dureeMaxAns: 3,
  
  // DENTISTES : Montants forfaitaires
  chirurgiensDentistes: {
    code: 'CD',
    profession: 'Chirurgien-dentiste',
    ijJour: 111.00,
    invaliditeAnnuelle: 31824.20,
    cotisationID: 409.80,      // Cotisation Invalidité-Décès
    description: 'Forfait unique pour tous les dentistes',
  },
  
  // SAGES-FEMMES : Montants forfaitaires
  sagesFemmes: {
    code: 'SF',
    profession: 'Sage-femme',
    ijJour: 48.73,
    invaliditeAnnuelle: 13460,
    cotisationID: 380.00,      // Cotisation Invalidité-Décès
    description: 'Forfait unique pour toutes les sages-femmes',
  },
  
  invalidite: {
    commissionInaptitude: true,
    exonerationCotisations: true, // Possible > 6 mois
  },
  
  deces: {
    selonSituation: true,
    rentesConjointEducation: true,
  },
}

// ============================================================================
// CARPV - Vétérinaires (données 2025 vérifiées MetLife)
// ============================================================================
export const CARPV_2025 = {
  // PAS d'IJ CARPV après 90 jours ! Uniquement CPAM 4-90j
  ijApres90Jours: false,
  
  invalidite: {
    partielle: {
      minimum: 8240,
      medium: 16480,
      maximum: 24720,
    },
    totale: {
      minimum: 12875,
      medium: 25750,
      maximum: 38625,
    },
  },
  
  deces: {
    capital: {
      minimum: 36565,
      medium: 73130,
      maximum: 109695,
    },
    renteSurvie: {
      minimum: 4635,
      medium: 9270,
      maximum: 13905,
    },
    renteEducation: {
      minimum: 4120,
      medium: 8240,
      maximum: 12360,
      jusquA: 21,              // ou 25 ans si études
    },
  },
}

// ============================================================================
// CAVP - Pharmaciens (CLASSES 3 à 7+)
// Source : https://www.difiplus.fr/cavp-assurance-vieillesse-pharmacien/
// Année de référence : N-2 (revenu 2023 pour 2025)
// ============================================================================
export const CAVP_2025 = {
  anneeReference: 'N-2',
  cotisationInvaliditeDeces: 689, // Forfaitaire 2025
  
  // CLASSES selon le revenu N-2
  classes: [
    { classe: '3', seuilRevenuMax: 74559, cotisation: 8400, description: 'Revenus ≤ 74 559 €' },
    { classe: '4', seuilRevenuMin: 74559, seuilRevenuMax: 103680, cotisation: 11200, description: 'Revenus 74 559 - 103 680 €' },
    { classe: '5', seuilRevenuMin: 103680, seuilRevenuMax: 149370, cotisation: 14000, description: 'Revenus 103 680 - 149 370 €' },
    { classe: '6', seuilRevenuMin: 149370, seuilRevenuMax: 211800, cotisation: 16800, description: 'Revenus 149 370 - 211 800 €' },
    { classe: '7+', seuilRevenuMin: 211800, cotisation: 21000, description: 'Revenus > 211 800 €' },
  ],
  
  ij: {
    formule: '50% de la moyenne des revenus (3 ans)',
    plafondRevenu: PASS_2025 * 3, // 3 PASS = 141 300 €
    cpamAvant: true,             // Jours 4-90 = CPAM
  },
  
  invalidite: {
    montantAnnuel: 16705,      // Forfaitaire
    montantMensuel: 1392,      // €/mois jusqu'à retraite
    enfants: {
      montant: 1218,
      jusquA: 21,              // ou 25 ans si études
    },
  },
  
  deces: {
    capital: true,
    allocationConjoint: true,  // Mensuelle jusqu'à pension réversion 60 ans
    renteEducation: true,
    renteTemporaire: true,     // 2% du plan capitalisation
  },
}

// ============================================================================
// CNBF - Avocats (structure spécifique)
// Source: LPA (La Prévoyance des Avocats) + CNBF
// ============================================================================
export const CNBF_2025 = {
  // Structure en 2 temps DIFFÉRENTE des autres caisses
  structure: {
    jour0_90: {
      organisme: 'LPA ou AON',
      lpa: 'La Prévoyance des Avocats',
      aon: 'AON HEWITT (Barreau de Paris)',
      carenceJours: 0,  // Pas de carence comme CPAM - couverture dès J1
    },
    jour91Plus: {
      organisme: 'CNBF',
      dureeMaxJours: 1095,     // 3 ans
    },
  },
  
  // IJ LPA/AON (J1-90) - Estimation basée sur les contrats types LPA
  // Source: Baremes LPA 2024-2025
  // La LPA verse des IJ basées sur une formule proportionnelle au revenu
  ijLPA: {
    formule: '1/730e du revenu annuel',
    tauxRevenu: 1/730,           // 1/730e du revenu annuel par jour
    plafondRevenu: 4 * 46368,    // 4 PASS = 185 472 €
    ijMin: 30,                   // Minimum garanti ~30€/jour
    ijMax: 254,                  // Maximum ~254€/jour (4 PASS / 730)
    debutJour: 1,                // Dès le 1er jour (pas de carence)
    finJour: 90,
  },
  
  // IJ CNBF (J91+) - Invalidité temporaire
  // La CNBF ne verse pas d'IJ classiques mais une allocation d'invalidité temporaire
  ijCNBF: {
    formule: 'Allocation invalidité temporaire',
    // Basée sur points acquis - estimation moyenne
    estimationMoyenne: 40,      // ~40€/jour en moyenne selon ancienneté
    debutJour: 91,
    dureeMaxJours: 1095,        // 3 ans max
  },
  
  invalidite: {
    temporaire: {
      dureeMaxJours: 1095,     // Jusqu'à 3 ans puis permanente
    },
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
    beneficiaires: [
      'Conjoint survivant',
      'Enfants < 21 ans',
      'Enfants < 25 ans si études',
      'Enfants handicapés (sans limite)',
    ],
  },
}

/**
 * Calcule les IJ pour les avocats (CNBF)
 * J1-90: LPA/AON (assureur privé)
 * J91+: CNBF (invalidité temporaire)
 */
export function calculerIJ_CNBF(revenuAn: number): {
  ijLPA: number        // IJ/jour période J1-90
  ijCNBF: number       // IJ/jour période J91+
  periodeLPA: string
  periodeCNBF: string
  description: string
} {
  // IJ LPA (J1-90) : 1/730e du revenu, plafonné
  const revenuPlafonne = Math.min(revenuAn, CNBF_2025.ijLPA.plafondRevenu)
  let ijLPA = revenuPlafonne * CNBF_2025.ijLPA.tauxRevenu
  ijLPA = Math.max(CNBF_2025.ijLPA.ijMin, Math.min(ijLPA, CNBF_2025.ijLPA.ijMax))
  ijLPA = Math.round(ijLPA * 100) / 100
  
  // IJ CNBF (J91+) : estimation moyenne invalidité temporaire
  const ijCNBF = CNBF_2025.ijCNBF.estimationMoyenne
  
  return {
    ijLPA,
    ijCNBF,
    periodeLPA: 'Jour 1 à 90 (LPA/AON)',
    periodeCNBF: 'Jour 91+ (CNBF)',
    description: `Avocats : J1-90 via LPA/AON (${ijLPA}€/jour), J91+ via CNBF (~${ijCNBF}€/jour).`
  }
}

// ============================================================================
// CAVAMAC - Agents généraux d'assurance
// Source : MetLife 2025
// ============================================================================
export const CAVAMAC_2025 = {
  anneeReference: 'N-1',
  franchiseJours: 90,
  
  // CORRECTION 2025 : Montants révisés (source MetLife)
  classes: [
    { classe: 'A', ijJour: 55.44, invaliditeAnnuelle: 13310, deces: 44370, description: 'Classe A - Base' },
    { classe: 'B', ijJour: 110.88, invaliditeAnnuelle: 26620, deces: 88740, description: 'Classe B - Renforcée' },
  ],
}

// ============================================================================
// CAVOM - Officiers ministériels (huissiers, commissaires-priseurs...)
// Source : MetLife 2025
// ============================================================================
export const CAVOM_2025 = {
  anneeReference: 'N-1',
  franchiseJours: 90,
  
  // CORRECTION 2025 : Montants révisés (source MetLife)
  classes: [
    { classe: 'A', ijJour: 55.44, invaliditeAnnuelle: 13310, deces: 44370, description: 'Classe A - Base' },
    { classe: 'B', ijJour: 110.88, invaliditeAnnuelle: 26620, deces: 88740, description: 'Classe B - Renforcée' },
  ],
}

// ============================================================================
// CPRN - Notaires (SECTION B + SECTION C)
// Source : https://www.cprn.org/
// Année de référence : Moyenne 3 ans (2022+2023+2024)
// PARTICULARITÉ : Système à 2 sections combinées
// ============================================================================
export const CPRN_2025 = {
  anneeReference: 'moyenne-3-ans',
  franchiseJours: 90,
  
  // SECTION B : Classes forfaitaires (1 à 4)
  sectionB: {
    description: 'Classes forfaitaires - cotisation fixe',
    classes: [
      { classe: 1, cotisation: 2758.10, points: 10, description: 'Classe 1' },
      { classe: 2, cotisation: 5516.20, points: 20, description: 'Classe 2' },
      { classe: 3, cotisation: 8274.30, points: 30, description: 'Classe 3' },
      { classe: 4, cotisation: 11032.40, points: 40, description: 'Classe 4' },
    ],
  },
  
  // SECTION C : Cotisation proportionnelle
  sectionC: {
    description: 'Cotisation proportionnelle aux revenus',
    tauxCotisation: 0.041,     // 4,10% de la moyenne 3 ans
    valeurPoint: 0.9283,
  },
  
  // Les notaires paient SECTION B + SECTION C
  cumul: true,
}

// ============================================================================
// ENIM - Marins et pêcheurs
// ============================================================================
export const ENIM_2025 = {
  ijSelonStatut: true,
  invaliditeSelonAnciennete: true,
  deces: {
    aideObseques: 1100,
  },
}

// ============================================================================
// ANNÉES DE RÉFÉRENCE PAR CAISSE
// ============================================================================
export const ANNEES_REFERENCE_2025 = {
  'CARMF': { type: 'N-2', annee: 2023, description: 'Revenu 2023 pour cotisation 2025' },
  'CAVEC': { type: 'N-1', annee: 2024, description: 'Revenu 2024 pour cotisation 2025' },
  'CARCDSF': { type: 'N-1', annee: 2024, description: 'Revenu 2024 pour cotisation 2025' },
  'CARPIMKO': { type: 'N-1', annee: 2024, description: 'Revenu 2024 pour cotisation 2025' },
  'CAVP': { type: 'N-2', annee: 2023, description: 'Revenu 2023 pour cotisation 2025' },
  'CIPAV': { type: 'N-1', annee: 2024, description: 'Revenu 2024 pour cotisation 2025' },
  'CARPV': { type: 'N-1', annee: 2024, description: 'Revenu 2024 pour cotisation 2025' },
  'CPRN': { type: 'moyenne-3-ans', annees: [2022, 2023, 2024], description: 'Moyenne 2022+2023+2024' },
  'SSI': { type: 'moyenne-3-ans', annees: [2022, 2023, 2024], description: 'RAAM 3 dernières années' },
  'MSA': { type: 'N-1', annee: 2024, description: 'Revenu 2024 pour cotisation 2025' },
  'CNBF': { type: 'N-1', annee: 2024, description: 'Revenu 2024 pour cotisation 2025' },
} as const

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Calcule les IJ du régime commun CPAM pour une profession libérale CNAVPL
 */
export function calculerIJ_CPAM(revenuAnnuel: number): {
  montantJour: number
  isMinimum: boolean
  isMaximum: boolean
} {
  const revenuPlafonne = Math.min(revenuAnnuel, PASS_2025 * CPAM_2025.seuilMaxPass)
  let montantJour = revenuPlafonne / 730
  
  let isMinimum = false
  let isMaximum = false
  
  // Application du minimum si revenus < 40% PASS
  if (revenuAnnuel < PASS_2025 * CPAM_2025.seuilMinPass) {
    montantJour = CPAM_2025.ijMin
    isMinimum = true
  }
  
  // Application du maximum
  if (montantJour >= CPAM_2025.ijMax) {
    montantJour = CPAM_2025.ijMax
    isMaximum = true
  }
  
  return {
    montantJour: Math.round(montantJour * 100) / 100,
    isMinimum,
    isMaximum,
  }
}

/**
 * Calcule les IJ SSI pour artisans/commerçants
 */
export function calculerIJ_SSI(revenuAnnuelMoyen3ans: number): {
  montantJour: number
  isPlafonne: boolean
} {
  const montantJour = Math.min(
    revenuAnnuelMoyen3ans / 730,
    SSI_2025.ij.max
  )
  
  return {
    montantJour: Math.round(montantJour * 100) / 100,
    isPlafonne: montantJour >= SSI_2025.ij.max,
  }
}

/**
 * Calcule les IJ MSA pour exploitants agricoles
 * PARTICULARITÉ : Montants différenciés selon la durée d'arrêt
 * - Jours 1-28 : 25,79 €/jour
 * - À partir du jour 29 : 34,39 €/jour
 */
export function calculerIJ_MSA(jourArret: number): {
  montantJour: number
  periode: string
  totalCumule: number
} {
  const montantJour = jourArret <= 28 
    ? MSA_2025.ij.montantJours1_28 
    : MSA_2025.ij.montantJours29Plus
  
  // Calcul du cumul total selon le jour d'arrêt
  let totalCumule = 0
  if (jourArret <= 28) {
    totalCumule = jourArret * MSA_2025.ij.montantJours1_28
  } else {
    totalCumule = (28 * MSA_2025.ij.montantJours1_28) + ((jourArret - 28) * MSA_2025.ij.montantJours29Plus)
  }
  
  return {
    montantJour,
    periode: jourArret <= 28 ? 'Jours 1-28' : 'À partir du jour 29',
    totalCumule: Math.round(totalCumule * 100) / 100,
  }
}

/**
 * Détermine la classe CARMF selon le revenu (post-réforme 2025)
 */
export function determinerClasseCARMF(revenuN2: number): 'A' | 'B' | 'C' {
  if (revenuN2 <= CARMF_2025.classeA.seuilRevenuMax) {
    return 'A'
  } else if (revenuN2 >= CARMF_2025.classeC.seuilRevenuMin) {
    return 'C'
  }
  return 'B' // Proportionnel
}

/**
 * Calcule les IJ CARMF selon la classe
 */
export function calculerIJ_CARMF(revenuN2: number): {
  classe: 'A' | 'B' | 'C'
  montantJour: number
  cotisation: number
  isProportionnel: boolean
} {
  const classe = determinerClasseCARMF(revenuN2)
  
  switch (classe) {
    case 'A':
      return {
        classe: 'A',
        montantJour: CARMF_2025.classeA.ijJour,
        cotisation: CARMF_2025.classeA.cotisationAnnuelle,
        isProportionnel: false,
      }
    case 'C':
      return {
        classe: 'C',
        montantJour: CARMF_2025.classeC.ijJour,
        cotisation: CARMF_2025.classeC.cotisationAnnuelle,
        isProportionnel: false,
      }
    case 'B':
    default:
      return {
        classe: 'B',
        montantJour: Math.round((revenuN2 / 730) * 100) / 100,
        cotisation: CARMF_2025.classeB.cotisationFixe + (revenuN2 * CARMF_2025.classeB.cotisationTaux),
        isProportionnel: true,
      }
  }
}

/**
 * Détermine la classe CAVEC selon le revenu N-1
 */
export function determinerClasseCAVEC(revenuN1: number): {
  classe: string
  cotisation: number
  pointsRetraite: number
  description: string
} {
  const classes = CAVEC_2025.classes
  for (const c of classes) {
    if (revenuN1 <= c.seuilRevenuMax) {
      return {
        classe: c.classe,
        cotisation: c.cotisation,
        pointsRetraite: c.pointsRetraite,
        description: c.description,
      }
    }
  }
  // Par défaut classe H
  const classeH = classes[classes.length - 1]
  return {
    classe: classeH.classe,
    cotisation: classeH.cotisation,
    pointsRetraite: classeH.pointsRetraite,
    description: classeH.description,
  }
}

/**
 * Détermine la classe CAVP selon le revenu N-2
 */
export function determinerClasseCAVP(revenuN2: number): {
  classe: string
  cotisation: number
  description: string
} {
  const classes = CAVP_2025.classes
  for (const c of classes) {
    if (c.seuilRevenuMax && revenuN2 <= c.seuilRevenuMax) {
      return {
        classe: c.classe,
        cotisation: c.cotisation,
        description: c.description,
      }
    }
  }
  // Par défaut classe 7+
  const classeMax = classes[classes.length - 1]
  return {
    classe: classeMax.classe,
    cotisation: classeMax.cotisation,
    description: classeMax.description,
  }
}

/**
 * FONCTION PRINCIPALE : Détermine la classe 2025 pour toutes les caisses
 * @param caisse Code de la caisse (CARMF, CAVEC, CARCDSF, etc.)
 * @param revenu Revenu de l'année de référence appropriée
 * @param options Options supplémentaires (profession pour CARCDSF, classe choisie pour CARPIMKO)
 */
export function determinerClasse_2025(
  caisse: string,
  revenu: number,
  options?: { profession?: 'dentiste' | 'sage-femme'; classeChoisie?: 1 | 2 | 3 | 4 }
): {
  caisse: string
  classe: string | null
  ijJour: number
  invalidite: number | null
  cotisation: number | null
  deces: number | null
  baseRevenu: string
  description: string
} {
  switch (caisse) {
    case 'CARMF': {
      const result = calculerIJ_CARMF(revenu)
      const classeData = result.classe === 'A' ? CARMF_2025.classeA 
        : result.classe === 'C' ? CARMF_2025.classeC : CARMF_2025.classeB
      return {
        caisse: 'CARMF',
        classe: result.classe,
        ijJour: result.montantJour,
        invalidite: result.classe === 'B' ? null : (classeData as any).invaliditeAnnuelle,
        cotisation: result.cotisation,
        deces: 60000,
        baseRevenu: 'N-2',
        description: result.isProportionnel 
          ? `Classe B proportionnelle : ${result.montantJour} €/jour (revenu/730)`
          : `Classe ${result.classe} : ${result.montantJour} €/jour (forfaitaire)`,
      }
    }
    
    case 'CAVEC': {
      const result = determinerClasseCAVEC(revenu)
      return {
        caisse: 'CAVEC',
        classe: result.classe,
        ijJour: CAVEC_2025.ij.montantJour,
        invalidite: null,
        cotisation: result.cotisation,
        deces: null,
        baseRevenu: 'N-1',
        description: `${result.description} - IJ : 125 €/jour à partir du 91e jour`,
      }
    }
    
    case 'CARCDSF': {
      const prof = options?.profession || 'dentiste'
      const data = prof === 'sage-femme' ? CARCDSF_2025.sagesFemmes : CARCDSF_2025.chirurgiensDentistes
      return {
        caisse: 'CARCDSF',
        classe: prof,
        ijJour: data.ijJour,
        invalidite: data.invaliditeAnnuelle,
        cotisation: data.cotisationID,
        deces: null,
        baseRevenu: 'N-1',
        description: `${data.profession} : ${data.ijJour} €/jour (forfaitaire)`,
      }
    }
    
    case 'CARPIMKO': {
      const classeIndex = (options?.classeChoisie || 1) - 1
      const classeData = CARPIMKO_2025.classes[classeIndex] || CARPIMKO_2025.classes[0]
      return {
        caisse: 'CARPIMKO',
        classe: classeData.classe,
        ijJour: classeData.ijJour,
        invalidite: classeData.invaliditeAnnuelle,
        cotisation: classeData.cotisation,
        deces: classeData.deces,
        baseRevenu: 'N-1 (libre choix)',
        description: `Classe ${classeData.classe} (libre choix) : ${classeData.ijJour} €/jour - ${classeData.recommandePour}`,
      }
    }
    
    case 'CAVP': {
      const result = determinerClasseCAVP(revenu)
      return {
        caisse: 'CAVP',
        classe: result.classe,
        ijJour: 0, // IJ via CPAM uniquement
        invalidite: CAVP_2025.invalidite.montantAnnuel,
        cotisation: result.cotisation,
        deces: null,
        baseRevenu: 'N-2',
        description: `${result.description} - IJ via régime CPAM uniquement`,
      }
    }
    
    case 'CIPAV':
    case 'CARPV': {
      const cpamResult = calculerIJ_CPAM(revenu)
      return {
        caisse,
        classe: null,
        ijJour: cpamResult.montantJour,
        invalidite: null,
        cotisation: null,
        deces: null,
        baseRevenu: 'N-1',
        description: `Régime CPAM uniquement : ${cpamResult.montantJour} €/jour (jours 4-90)`,
      }
    }
    
    case 'SSI': {
      const ssiResult = calculerIJ_SSI(revenu)
      return {
        caisse: 'SSI',
        classe: null,
        ijJour: ssiResult.montantJour,
        invalidite: null,
        cotisation: null,
        deces: SSI_2025.deces.capitalBase,
        baseRevenu: 'moyenne-3-ans',
        description: `IJ SSI : ${ssiResult.montantJour} €/jour (max 64,52 €)`,
      }
    }
    
    default:
      return {
        caisse,
        classe: null,
        ijJour: 0,
        invalidite: null,
        cotisation: null,
        deces: null,
        baseRevenu: 'inconnu',
        description: 'Caisse non reconnue',
      }
  }
}

// ============================================================================
// EXPORT PAR DÉFAUT - Configuration complète 2025
// ============================================================================
export const PREVOYANCE_TNS_2025 = {
  annee: 2025,
  pass: PASS_2025,
  passJournalier: PASS_JOURNALIER_2025,
  passMensuel: PASS_MENSUEL_2025,
  cpam: CPAM_2025,
  caissesAvecCPAM: CAISSES_AVEC_CPAM,
  caissesRegimeSpecifique: CAISSES_REGIME_SPECIFIQUE,
  anneesReference: ANNEES_REFERENCE_2025,
  
  caisses: {
    SSI: SSI_2025,
    MSA: MSA_2025,
    CIPAV: CIPAV_2025,
    CARMF: CARMF_2025,
    CAVEC: CAVEC_2025,
    CARPIMKO: CARPIMKO_2025,
    CARCDSF: CARCDSF_2025,
    CARPV: CARPV_2025,
    CAVP: CAVP_2025,
    CNBF: CNBF_2025,
    CAVAMAC: CAVAMAC_2025,
    CAVOM: CAVOM_2025,
    CPRN: CPRN_2025,
    ENIM: ENIM_2025,
  },
  
  utils: {
    calculerIJ_CPAM,
    calculerIJ_SSI,
    calculerIJ_MSA,
    determinerClasseCARMF,
    calculerIJ_CARMF,
    determinerClasseCAVEC,
    determinerClasseCAVP,
    determinerClasse_2025,
  },
}

export default PREVOYANCE_TNS_2025
