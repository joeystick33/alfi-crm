/**
 * Module de calcul des retraites complémentaires françaises
 * 
 * Couvre tous les régimes complémentaires :
 * - AGIRC-ARRCO (salariés du privé)
 * - RAFP (fonctionnaires titulaires)
 * - IRCANTEC (contractuels du public)
 * - SSI (artisans/commerçants)
 * - CIPAV (professions libérales)
 * - CARMF (médecins)
 * - CARPIMKO (paramédicaux)
 * - CNBF (avocats)
 * - CRPCEN (notaires)
 * 
 * ⚠️ MAINTENANCE : Les paramètres sont centralisés dans :
 *    /lib/retirement/config/parameters.ts
 */

import {
  PLAFONDS,
  AGIRC_ARRCO,
  PRELEVEMENTS,
} from './config/parameters'

// Constante locale pour compatibilité
const PASS_2025 = PLAFONDS.PASS
const TAUX_CSG_CRDS = PRELEVEMENTS.TAUX_TOTAL_STANDARD

// =====================================================
// TYPES
// =====================================================

export type RegimeComplementaire =
  | 'AGIRC_ARRCO'
  | 'RAFP'
  | 'IRCANTEC'
  | 'SSI'
  | 'CIPAV'
  | 'CARMF_COMPLEMENTAIRE'
  | 'CARPIMKO_COMPLEMENTAIRE'
  | 'CNBF_COMPLEMENTAIRE'
  | 'CRPCEN_COMPLEMENTAIRE'
  | 'AUCUN'

export interface RegimeParams {
  regime: RegimeComplementaire
  nom: string
  description: string
  valeurPointAnnuelle: number      // valeur de service du point (€/an)
  prixAchatPoint?: number          // prix d'achat / valeur d'acquisition du point (€/point)
  tauxAcquisition?: number         // taux de la cotisation génératrice de points
  tauxCotisation?: number          // taux global de cotisation
  plafondAssiette?: number         // plafond de l'assiette de cotisation
  plafondAnnuelPoints?: number     // plafond annuel de points acquis
  gestionParClasses?: boolean      // si géré par classes de cotisation
  classes?: ClasseCotisation[]     // définition des classes si applicable
}

export interface ClasseCotisation {
  classe: string
  pointsParAn: number
  cotisationAnnuelle: number
}

export interface SituationComplementaire {
  regime: RegimeComplementaire
  pointsExistants: number          // points déjà acquis (relevé individuel)
  
  // Hypothèses futures
  assietteCotisation?: number      // salaire brut / revenu pro soumis à cotisation
  anneesProjetees?: number         // nombre d'années supplémentaires à simuler
  classeCotisation?: string        // pour les régimes par classes (ex: "M" pour CARMF)
  
  // Coefficients de liquidation
  coefficientSolidarite?: number   // ex: 0.90 si malus -10% (Agirc-Arrco)
  coefficientMajorationFamille?: number // ex: 1.10 si +10% pour 3 enfants
  coefficientSurcote?: number      // ex: 1.05 si +5% pour départ différé
  coefficientDecote?: number       // ex: 0.95 si -5% pour départ anticipé
  
  // Points gratuits (périodes assimilées)
  periodesAssimilees?: PeriodesAssimilees
}

export interface PeriodesAssimilees {
  chomageIndemnise?: { trimestres: number }
  maladie?: { trimestres: number }
  maternite?: { trimestres: number }
  invalidite?: { trimestres: number }
  serviceMilitaire?: { jours: number }
  accidentTravail?: { trimestres: number }
}

export interface ResultatComplementaire {
  regime: RegimeComplementaire
  nomRegime: string
  pointsExistants: number
  pointsProjetes: number
  pointsGratuits: number
  pointsTotaux: number
  valeurPoint: number
  
  // Coefficients appliqués
  coefficients: {
    solidarite: number
    majorationFamille: number
    surcote: number
    decote: number
    total: number
  }
  
  // Pension calculée
  pensionAnnuelleBrute: number
  pensionMensuelleBrute: number
  pensionAnnuelleNette: number    // après CSG/CRDS (~9.1%)
  pensionMensuelleNette: number
  
  // Détails du calcul
  detailCalcul: {
    formule: string
    etapes: string[]
  }
  
  // Informations sur le régime
  infoRegime: {
    description: string
    tauxCotisation?: string
    plafond?: string
    particularites?: string[]
  }
}

// =====================================================
// PARAMÈTRES 2025 PAR RÉGIME
// =====================================================

export const REGIME_PARAMS_2025: Record<RegimeComplementaire, RegimeParams> = {
  // ─────────────────────────────────────────────────────
  // 1. AGIRC-ARRCO (salariés du privé)
  // Sources : agirc-arrco.fr, valeurs 2025
  // ─────────────────────────────────────────────────────
  AGIRC_ARRCO: {
    regime: 'AGIRC_ARRCO',
    nom: 'AGIRC-ARRCO',
    description: 'Régime complémentaire obligatoire des salariés du secteur privé',
    valeurPointAnnuelle: 1.4386,    // valeur de service du point 2025
    prixAchatPoint: 20.1877,        // prix d'achat du point 2025
    tauxAcquisition: 0.0620,        // 6,20% pour la part génératrice de droits
    tauxCotisation: 0.0787,         // taux global T1 (tranche 1 : jusqu'à 1 PASS)
    plafondAnnuelPoints: undefined  // pas de plafond de points
  },

  // ─────────────────────────────────────────────────────
  // 2. RAFP (fonctionnaires titulaires)
  // Sources : rafp.fr, valeurs 2025
  // ─────────────────────────────────────────────────────
  RAFP: {
    regime: 'RAFP',
    nom: 'RAFP',
    description: 'Retraite Additionnelle de la Fonction Publique (titulaires)',
    valeurPointAnnuelle: 0.05593,   // valeur de service du point 2025
    prixAchatPoint: 1.4394,         // valeur d'acquisition du point 2025
    tauxCotisation: 0.10,           // 10% de l'assiette (5% salarié + 5% employeur)
    plafondAssiette: 0.20           // assiette plafonnée à 20% du traitement indiciaire
  },

  // ─────────────────────────────────────────────────────
  // 3. IRCANTEC (contractuels du public)
  // Sources : ircantec.retraites.fr, valeurs 2025
  // ─────────────────────────────────────────────────────
  IRCANTEC: {
    regime: 'IRCANTEC',
    nom: 'IRCANTEC',
    description: 'Institution de Retraite Complémentaire des Agents Non Titulaires de l\'État',
    valeurPointAnnuelle: 0.55553,   // valeur du point 2025
    prixAchatPoint: 4.0172,         // salaire de référence 2025
    tauxAcquisition: 0.0496,        // taux d'acquisition tranche A (4,96%)
    tauxCotisation: 0.0578          // taux global tranche A
  },

  // ─────────────────────────────────────────────────────
  // 4. SSI (artisans/commerçants)
  // Sources : secu-independants.fr, valeurs 2025
  // ─────────────────────────────────────────────────────
  SSI: {
    regime: 'SSI',
    nom: 'SSI (ex-RSI)',
    description: 'Régime complémentaire des artisans et commerçants',
    valeurPointAnnuelle: 1.280,     // valeur de service du point 2025
    prixAchatPoint: 19.394,         // coût d'acquisition du point 2025
    tauxAcquisition: 0.07,          // 7% du revenu professionnel
    tauxCotisation: 0.07,           // taux de cotisation complémentaire
    plafondAssiette: 43992          // 4 PASS pour le plafond (environ)
  },

  // ─────────────────────────────────────────────────────
  // 5. CIPAV (professions libérales)
  // Sources : cipav.fr, valeurs 2025
  // ─────────────────────────────────────────────────────
  CIPAV: {
    regime: 'CIPAV',
    nom: 'CIPAV',
    description: 'Caisse Interprofessionnelle de Prévoyance et d\'Assurance Vieillesse',
    valeurPointAnnuelle: 2.89,      // valeur de service du point 2025
    prixAchatPoint: 47.40,          // prix d'achat du point 2025
    tauxAcquisition: 0.09,          // taux de cotisation génératrice (environ 9%)
    gestionParClasses: true,
    classes: [
      { classe: 'A', pointsParAn: 36, cotisationAnnuelle: 1706 },
      { classe: 'B', pointsParAn: 72, cotisationAnnuelle: 3413 },
      { classe: 'C', pointsParAn: 108, cotisationAnnuelle: 5120 },
      { classe: 'D', pointsParAn: 144, cotisationAnnuelle: 8532 },
      { classe: 'E', pointsParAn: 216, cotisationAnnuelle: 14219 },
      { classe: 'F', pointsParAn: 288, cotisationAnnuelle: 15666 },
      { classe: 'G', pointsParAn: 360, cotisationAnnuelle: 17066 },
      { classe: 'H', pointsParAn: 432, cotisationAnnuelle: 18466 }
    ]
  },

  // ─────────────────────────────────────────────────────
  // 6. CARMF complémentaire (médecins)
  // Sources : carmf.fr, valeurs 2025
  // ─────────────────────────────────────────────────────
  CARMF_COMPLEMENTAIRE: {
    regime: 'CARMF_COMPLEMENTAIRE',
    nom: 'CARMF Complémentaire',
    description: 'Régime complémentaire des médecins libéraux',
    valeurPointAnnuelle: 76.15,     // valeur de service du point 2025
    gestionParClasses: true,
    classes: [
      { classe: 'M', pointsParAn: 10, cotisationAnnuelle: 3103 },    // Classe minimale
      { classe: 'B', pointsParAn: 30, cotisationAnnuelle: 9309 },
      { classe: 'C', pointsParAn: 40, cotisationAnnuelle: 12412 },
      { classe: 'D', pointsParAn: 50, cotisationAnnuelle: 15515 },
      { classe: 'E', pointsParAn: 60, cotisationAnnuelle: 18618 },
      { classe: 'F', pointsParAn: 80, cotisationAnnuelle: 24824 },
      { classe: 'G', pointsParAn: 100, cotisationAnnuelle: 31030 }
    ]
  },

  // ─────────────────────────────────────────────────────
  // 7. CARPIMKO complémentaire (paramédicaux)
  // Sources : carpimko.com, valeurs 2025
  // ─────────────────────────────────────────────────────
  CARPIMKO_COMPLEMENTAIRE: {
    regime: 'CARPIMKO_COMPLEMENTAIRE',
    nom: 'CARPIMKO Complémentaire',
    description: 'Régime complémentaire des auxiliaires médicaux (infirmiers, kinés, etc.)',
    valeurPointAnnuelle: 21.28,     // valeur de service du point 2025
    gestionParClasses: true,
    classes: [
      { classe: '1', pointsParAn: 32, cotisationAnnuelle: 1944 },
      { classe: '2', pointsParAn: 64, cotisationAnnuelle: 3888 },
      { classe: '3', pointsParAn: 96, cotisationAnnuelle: 5832 },
      { classe: '4', pointsParAn: 128, cotisationAnnuelle: 7776 },
      { classe: '5', pointsParAn: 160, cotisationAnnuelle: 9720 }
    ]
  },

  // ─────────────────────────────────────────────────────
  // 8. CNBF complémentaire (avocats)
  // Sources : cnbf.fr, valeurs 2025
  // ─────────────────────────────────────────────────────
  CNBF_COMPLEMENTAIRE: {
    regime: 'CNBF_COMPLEMENTAIRE',
    nom: 'CNBF Complémentaire',
    description: 'Caisse Nationale des Barreaux Français - régime complémentaire',
    valeurPointAnnuelle: 1.0111,    // valeur de service du point 2025
    prixAchatPoint: 12.0529,        // coût d'acquisition du point 2025
    tauxAcquisition: 0.032,         // taux de cotisation proportionnelle 3,20%
    tauxCotisation: 0.032,
    gestionParClasses: true,
    classes: [
      { classe: '1', pointsParAn: 264, cotisationAnnuelle: 318 },   // forfait minimal
      { classe: '2', pointsParAn: 528, cotisationAnnuelle: 6367 },
      { classe: '3', pointsParAn: 792, cotisationAnnuelle: 9551 },
      { classe: '4', pointsParAn: 1056, cotisationAnnuelle: 12735 },
      { classe: '5', pointsParAn: 1320, cotisationAnnuelle: 15918 }
    ]
  },

  // ─────────────────────────────────────────────────────
  // 9. CRPCEN complémentaire (notaires)
  // Sources : crpcen.fr, valeurs 2025
  // ─────────────────────────────────────────────────────
  CRPCEN_COMPLEMENTAIRE: {
    regime: 'CRPCEN_COMPLEMENTAIRE',
    nom: 'CRPCEN',
    description: 'Caisse de Retraite et de Prévoyance des Clercs et Employés de Notaires',
    valeurPointAnnuelle: 15.78,     // valeur du point notarial 2025
    tauxAcquisition: 0.0875,        // taux de cotisation section B (8,75%)
    tauxCotisation: 0.0875,
    gestionParClasses: true,
    classes: [
      { classe: 'B1', pointsParAn: 60, cotisationAnnuelle: 2400 },
      { classe: 'B2', pointsParAn: 120, cotisationAnnuelle: 4800 },
      { classe: 'C', pointsParAn: 180, cotisationAnnuelle: 7200 }
    ]
  },

  // Pas de régime complémentaire
  AUCUN: {
    regime: 'AUCUN',
    nom: 'Aucun régime complémentaire',
    description: 'Pas de régime complémentaire applicable',
    valeurPointAnnuelle: 0
  }
}

// =====================================================
// CONSTANTES RÉEXPORTÉES DEPUIS CONFIG
// =====================================================

// Coefficient de malus/bonus AGIRC-ARRCO selon l'âge de départ
export const COEFFICIENTS_AGIRC_ARRCO = {
  malusTauxPlein: AGIRC_ARRCO.COEF_SOLIDARITE_MALUS,
  bonus1An: AGIRC_ARRCO.BONUS_REPORT_1AN,
  bonus2Ans: AGIRC_ARRCO.BONUS_REPORT_2ANS,
  bonus3Ans: AGIRC_ARRCO.BONUS_REPORT_3ANS,
  bonus4Ans: AGIRC_ARRCO.BONUS_REPORT_3ANS  // max plafonné à 3 ans
}

// Majoration pour enfants selon les régimes
export const MAJORATION_ENFANTS = {
  AGIRC_ARRCO: {
    pourTroisEnfantsOuPlus: 0.10,  // +10% si 3 enfants ou plus (plafonné à 2000€/an)
    plafondAnnuel: 2000
  },
  RAFP: {
    pourTroisEnfantsOuPlus: 0.10   // +10% si 3 enfants
  },
  IRCANTEC: {
    pourTroisEnfantsOuPlus: 0.10   // +10% si 3 enfants
  },
  SSI: {
    pourTroisEnfantsOuPlus: 0.10   // +10% si 3 enfants
  }
}

// =====================================================
// FONCTIONS DE CALCUL
// =====================================================

/**
 * Calcule les points acquis sur une année pour les régimes par points classiques
 */
export function calculerPointsCotisesAnnuels(
  regime: RegimeComplementaire,
  assietteCotisation: number
): { points: number; cotisation: number; details: string } {
  const params = REGIME_PARAMS_2025[regime]
  
  if (regime === 'AUCUN') {
    return { points: 0, cotisation: 0, details: 'Aucun régime complémentaire' }
  }
  
  // Cas des régimes gérés par classes
  if (params.gestionParClasses) {
    return {
      points: 0,
      cotisation: 0,
      details: 'Régime géré par classes de cotisation - utiliser calculerPointsParClasse()'
    }
  }
  
  if (!params.prixAchatPoint || !params.tauxAcquisition) {
    return { points: 0, cotisation: 0, details: 'Paramètres insuffisants pour ce régime' }
  }

  // Calcul spécifique par régime
  let assietteEffective = assietteCotisation
  let details = ''
  
  switch (regime) {
    case 'AGIRC_ARRCO':
      // Tranche 1 : jusqu'à 1 PASS
      // Tranche 2 : de 1 PASS à 8 PASS
      const t1 = Math.min(assietteCotisation, PASS_2025)
      const t2 = Math.max(0, Math.min(assietteCotisation - PASS_2025, 7 * PASS_2025))
      
      const pointsT1 = (t1 * 0.0620) / params.prixAchatPoint
      const pointsT2 = (t2 * 0.1700) / params.prixAchatPoint  // 17% pour tranche 2
      
      const cotisationT1 = t1 * 0.0787
      const cotisationT2 = t2 * 0.2159
      
      return {
        points: pointsT1 + pointsT2,
        cotisation: cotisationT1 + cotisationT2,
        details: `T1: ${pointsT1.toFixed(2)} pts (${t1.toFixed(0)}€ × 6.20%), T2: ${pointsT2.toFixed(2)} pts (${t2.toFixed(0)}€ × 17%)`
      }
      
    case 'RAFP':
      // Assiette = primes et indemnités, plafonnée à 20% du traitement indiciaire
      assietteEffective = assietteCotisation * (params.plafondAssiette || 0.20)
      const cotisationRafp = assietteEffective * 0.10
      const pointsRafp = cotisationRafp / params.prixAchatPoint!
      details = `Assiette effective: ${assietteEffective.toFixed(0)}€ (20% du traitement)`
      return { points: pointsRafp, cotisation: cotisationRafp, details }
      
    case 'IRCANTEC':
      // Tranche A : jusqu'à 1 PASS
      const trancheA = Math.min(assietteCotisation, PASS_2025)
      const pointsIrcantec = (trancheA * params.tauxAcquisition!) / params.prixAchatPoint!
      const cotisationIrcantec = trancheA * 0.0578
      details = `Tranche A: ${trancheA.toFixed(0)}€ × ${(params.tauxAcquisition! * 100).toFixed(2)}%`
      return { points: pointsIrcantec, cotisation: cotisationIrcantec, details }
      
    case 'SSI':
      // Revenu professionnel plafonné à 4 PASS
      assietteEffective = Math.min(assietteCotisation, 4 * PASS_2025)
      const cotisationSsi = assietteEffective * 0.07
      const pointsSsi = cotisationSsi / params.prixAchatPoint!
      details = `Assiette: ${assietteEffective.toFixed(0)}€ × 7%`
      return { points: pointsSsi, cotisation: cotisationSsi, details }
      
    case 'CNBF_COMPLEMENTAIRE':
      // Cotisation proportionnelle 3,20% du revenu
      const cotisationCnbf = assietteCotisation * 0.032
      const pointsCnbf = cotisationCnbf / params.prixAchatPoint!
      details = `Revenu: ${assietteCotisation.toFixed(0)}€ × 3.20%`
      return { points: pointsCnbf, cotisation: cotisationCnbf, details }
      
    default:
      const cotisationDefault = assietteCotisation * params.tauxAcquisition!
      const pointsDefault = cotisationDefault / params.prixAchatPoint!
      return { points: pointsDefault, cotisation: cotisationDefault, details: 'Calcul standard' }
  }
}

/**
 * Calcule les points pour les régimes gérés par classes de cotisation
 */
export function calculerPointsParClasse(
  regime: RegimeComplementaire,
  classeCotisation: string
): { pointsParAn: number; cotisationAnnuelle: number; details: string } | null {
  const params = REGIME_PARAMS_2025[regime]
  
  if (!params.gestionParClasses || !params.classes) {
    return null
  }
  
  const classe = params.classes.find(c => c.classe === classeCotisation)
  if (!classe) {
    return {
      pointsParAn: 0,
      cotisationAnnuelle: 0,
      details: `Classe "${classeCotisation}" non trouvée. Classes disponibles: ${params.classes.map(c => c.classe).join(', ')}`
    }
  }
  
  return {
    pointsParAn: classe.pointsParAn,
    cotisationAnnuelle: classe.cotisationAnnuelle,
    details: `Classe ${classe.classe}: ${classe.pointsParAn} points/an pour ${classe.cotisationAnnuelle}€/an de cotisation`
  }
}

/**
 * Calcule les points gratuits pour les périodes assimilées
 */
export function calculerPointsGratuits(
  regime: RegimeComplementaire,
  periodesAssimilees: PeriodesAssimilees
): { points: number; details: string[] } {
  const params = REGIME_PARAMS_2025[regime]
  let pointsGratuits = 0
  const details: string[] = []
  
  if (regime === 'AUCUN') {
    return { points: 0, details: [] }
  }
  
  // Chômage indemnisé
  if (periodesAssimilees.chomageIndemnise?.trimestres) {
    // Environ 0.25 points par jour indemnisé pour AGIRC-ARRCO
    // Simplification : 50 points par trimestre de chômage indemnisé
    let pointsChomage = 0
    
    switch (regime) {
      case 'AGIRC_ARRCO':
        pointsChomage = periodesAssimilees.chomageIndemnise.trimestres * 50
        break
      case 'IRCANTEC':
        pointsChomage = periodesAssimilees.chomageIndemnise.trimestres * 30
        break
      default:
        pointsChomage = periodesAssimilees.chomageIndemnise.trimestres * 20
    }
    
    pointsGratuits += pointsChomage
    details.push(`Chômage indemnisé: +${pointsChomage.toFixed(0)} points (${periodesAssimilees.chomageIndemnise.trimestres} trimestres)`)
  }
  
  // Maladie
  if (periodesAssimilees.maladie?.trimestres) {
    const pointsMaladie = periodesAssimilees.maladie.trimestres * 40
    pointsGratuits += pointsMaladie
    details.push(`Maladie/AT: +${pointsMaladie.toFixed(0)} points (${periodesAssimilees.maladie.trimestres} trimestres)`)
  }
  
  // Maternité
  if (periodesAssimilees.maternite?.trimestres) {
    const pointsMaternite = periodesAssimilees.maternite.trimestres * 50
    pointsGratuits += pointsMaternite
    details.push(`Maternité: +${pointsMaternite.toFixed(0)} points (${periodesAssimilees.maternite.trimestres} trimestres)`)
  }
  
  // Invalidité
  if (periodesAssimilees.invalidite?.trimestres) {
    const pointsInvalidite = periodesAssimilees.invalidite.trimestres * 60
    pointsGratuits += pointsInvalidite
    details.push(`Invalidité: +${pointsInvalidite.toFixed(0)} points (${periodesAssimilees.invalidite.trimestres} trimestres)`)
  }
  
  // Service militaire
  if (periodesAssimilees.serviceMilitaire?.jours) {
    const trimestres = Math.floor(periodesAssimilees.serviceMilitaire.jours / 90)
    const pointsMilitaire = trimestres * 30
    pointsGratuits += pointsMilitaire
    details.push(`Service militaire: +${pointsMilitaire.toFixed(0)} points (${periodesAssimilees.serviceMilitaire.jours} jours)`)
  }
  
  return { points: pointsGratuits, details }
}

/**
 * Calcule le coefficient de solidarité AGIRC-ARRCO
 */
export function calculerCoefficientSolidariteAgircArrco(
  ageDepart: number,
  ageTauxPlein: number,
  departAnticipe: boolean = false
): { coefficient: number; duree: number; explication: string } {
  // Pas de malus si départ anticipé (carrière longue, handicap, etc.)
  if (departAnticipe) {
    return {
      coefficient: 1,
      duree: 0,
      explication: 'Pas de malus pour départ anticipé (carrière longue, handicap, etc.)'
    }
  }
  
  // Malus si départ à l'âge du taux plein sans attendre 1 an
  if (ageDepart === ageTauxPlein) {
    return {
      coefficient: 0.90,
      duree: 3,
      explication: 'Malus de -10% pendant 3 ans (départ immédiat au taux plein)'
    }
  }
  
  // Bonus si report après taux plein
  const anneesReport = ageDepart - ageTauxPlein
  if (anneesReport >= 1 && anneesReport < 2) {
    return {
      coefficient: 1.10,
      duree: 0,
      explication: 'Bonus de +10% définitif (report de 1 an)'
    }
  }
  if (anneesReport >= 2 && anneesReport < 3) {
    return {
      coefficient: 1.20,
      duree: 0,
      explication: 'Bonus de +20% définitif (report de 2 ans)'
    }
  }
  if (anneesReport >= 3) {
    return {
      coefficient: 1.30,
      duree: 0,
      explication: 'Bonus de +30% définitif (report de 3+ ans)'
    }
  }
  
  // Décote si départ avant taux plein
  return {
    coefficient: 1,
    duree: 0,
    explication: 'Coefficient standard'
  }
}

/**
 * Calcule la majoration pour enfants
 */
export function calculerMajorationEnfants(
  regime: RegimeComplementaire,
  nombreEnfants: number,
  pensionAnnuelleBrute: number
): { coefficient: number; majoration: number; plafonne: boolean; explication: string } {
  if (nombreEnfants < 3) {
    return {
      coefficient: 1,
      majoration: 0,
      plafonne: false,
      explication: 'Pas de majoration (moins de 3 enfants)'
    }
  }
  
  let tauxMajoration = 0.10  // 10% par défaut
  let plafond: number | null = null
  
  switch (regime) {
    case 'AGIRC_ARRCO':
      tauxMajoration = 0.10
      plafond = 2000  // plafonné à 2000€/an
      break
    case 'RAFP':
    case 'IRCANTEC':
    case 'SSI':
      tauxMajoration = 0.10
      break
    default:
      tauxMajoration = 0.10
  }
  
  let majoration = pensionAnnuelleBrute * tauxMajoration
  let plafonne = false
  
  if (plafond && majoration > plafond) {
    majoration = plafond
    plafonne = true
  }
  
  return {
    coefficient: 1 + (majoration / pensionAnnuelleBrute),
    majoration,
    plafonne,
    explication: plafonne 
      ? `+10% pour 3+ enfants, plafonné à ${plafond}€/an`
      : `+10% pour 3+ enfants (+${majoration.toFixed(0)}€/an)`
  }
}

/**
 * Calcule la pension annuelle brute
 */
export function calculerPensionAnnuelleBrute(
  regime: RegimeComplementaire,
  pointsTotaux: number,
  coefficients: {
    solidarite?: number
    majorationFamille?: number
    surcote?: number
    decote?: number
  } = {}
): { pension: number; coefficientTotal: number; details: string[] } {
  const params = REGIME_PARAMS_2025[regime]
  const valeurPoint = params.valeurPointAnnuelle
  
  const coefSolidarite = coefficients.solidarite ?? 1
  const coefMajoration = coefficients.majorationFamille ?? 1
  const coefSurcote = coefficients.surcote ?? 1
  const coefDecote = coefficients.decote ?? 1
  
  const coefficientTotal = coefSolidarite * coefMajoration * coefSurcote * coefDecote
  
  const pensionBase = pointsTotaux * valeurPoint
  const pensionFinale = pensionBase * coefficientTotal
  
  const details: string[] = [
    `Points × Valeur = ${pointsTotaux.toFixed(0)} × ${valeurPoint.toFixed(4)}€ = ${pensionBase.toFixed(2)}€`,
  ]
  
  if (coefSolidarite !== 1) {
    details.push(`Coefficient solidarité: ×${coefSolidarite.toFixed(2)}`)
  }
  if (coefMajoration !== 1) {
    details.push(`Majoration famille: ×${coefMajoration.toFixed(2)}`)
  }
  if (coefSurcote !== 1) {
    details.push(`Surcote: ×${coefSurcote.toFixed(2)}`)
  }
  if (coefDecote !== 1) {
    details.push(`Décote: ×${coefDecote.toFixed(2)}`)
  }
  
  details.push(`Pension finale: ${pensionFinale.toFixed(2)}€/an`)
  
  return {
    pension: pensionFinale,
    coefficientTotal,
    details
  }
}

// =====================================================
// SIMULATION COMPLÈTE
// =====================================================

/**
 * Simule la retraite complémentaire complète
 */
export function simulerRetraiteComplementaire(
  situation: SituationComplementaire
): ResultatComplementaire {
  const params = REGIME_PARAMS_2025[situation.regime]
  
  // Points existants
  const pointsExistants = situation.pointsExistants
  let pointsProjetes = 0
  let pointsGratuits = 0
  
  const etapesCalcul: string[] = []
  
  // ─────────────────────────────────────────────────────
  // 1. Projection des points futurs
  // ─────────────────────────────────────────────────────
  if (situation.anneesProjetees && situation.anneesProjetees > 0) {
    if (params.gestionParClasses && situation.classeCotisation) {
      // Régimes par classes
      const resultatClasse = calculerPointsParClasse(situation.regime, situation.classeCotisation)
      if (resultatClasse) {
        pointsProjetes = resultatClasse.pointsParAn * situation.anneesProjetees
        etapesCalcul.push(`Points projetés (classe ${situation.classeCotisation}): ${resultatClasse.pointsParAn} pts/an × ${situation.anneesProjetees} ans = ${pointsProjetes.toFixed(0)} pts`)
      }
    } else if (situation.assietteCotisation) {
      // Régimes par points classiques
      const resultatAnnuel = calculerPointsCotisesAnnuels(situation.regime, situation.assietteCotisation)
      pointsProjetes = resultatAnnuel.points * situation.anneesProjetees
      etapesCalcul.push(`Points projetés: ${resultatAnnuel.points.toFixed(2)} pts/an × ${situation.anneesProjetees} ans = ${pointsProjetes.toFixed(0)} pts`)
      etapesCalcul.push(`  └─ Détail: ${resultatAnnuel.details}`)
    }
  }
  
  // ─────────────────────────────────────────────────────
  // 2. Points gratuits (périodes assimilées)
  // ─────────────────────────────────────────────────────
  if (situation.periodesAssimilees) {
    const resultatGratuits = calculerPointsGratuits(situation.regime, situation.periodesAssimilees)
    pointsGratuits = resultatGratuits.points
    if (resultatGratuits.details.length > 0) {
      etapesCalcul.push(`Points gratuits: ${pointsGratuits.toFixed(0)} pts`)
      resultatGratuits.details.forEach(d => etapesCalcul.push(`  └─ ${d}`))
    }
  }
  
  // ─────────────────────────────────────────────────────
  // 3. Total des points
  // ─────────────────────────────────────────────────────
  const pointsTotaux = pointsExistants + pointsProjetes + pointsGratuits
  etapesCalcul.push(`Total points: ${pointsExistants} (existants) + ${pointsProjetes.toFixed(0)} (projetés) + ${pointsGratuits.toFixed(0)} (gratuits) = ${pointsTotaux.toFixed(0)} pts`)
  
  // ─────────────────────────────────────────────────────
  // 4. Coefficients de liquidation
  // ─────────────────────────────────────────────────────
  const coefSolidarite = situation.coefficientSolidarite ?? 1
  const coefMajoration = situation.coefficientMajorationFamille ?? 1
  const coefSurcote = situation.coefficientSurcote ?? 1
  const coefDecote = situation.coefficientDecote ?? 1
  const coefTotal = coefSolidarite * coefMajoration * coefSurcote * coefDecote
  
  // ─────────────────────────────────────────────────────
  // 5. Calcul de la pension
  // ─────────────────────────────────────────────────────
  const resultatPension = calculerPensionAnnuelleBrute(
    situation.regime,
    pointsTotaux,
    {
      solidarite: coefSolidarite,
      majorationFamille: coefMajoration,
      surcote: coefSurcote,
      decote: coefDecote
    }
  )
  
  const pensionAnnuelleBrute = resultatPension.pension
  const pensionMensuelleBrute = pensionAnnuelleBrute / 12
  const pensionAnnuelleNette = pensionAnnuelleBrute * (1 - TAUX_CSG_CRDS)
  const pensionMensuelleNette = pensionAnnuelleNette / 12
  
  etapesCalcul.push(...resultatPension.details)
  etapesCalcul.push(`Pension nette (après ${(TAUX_CSG_CRDS * 100).toFixed(1)}% prélèvements): ${pensionAnnuelleNette.toFixed(2)}€/an soit ${pensionMensuelleNette.toFixed(2)}€/mois`)
  
  // ─────────────────────────────────────────────────────
  // 6. Informations sur le régime
  // ─────────────────────────────────────────────────────
  const infoRegime: ResultatComplementaire['infoRegime'] = {
    description: params.description,
    particularites: []
  }
  
  if (params.tauxCotisation) {
    infoRegime.tauxCotisation = `${(params.tauxCotisation * 100).toFixed(2)}%`
  }
  
  if (params.plafondAssiette) {
    infoRegime.plafond = `Assiette plafonnée à ${(params.plafondAssiette * 100).toFixed(0)}% du traitement`
  }
  
  if (params.gestionParClasses) {
    infoRegime.particularites!.push('Cotisation par classes')
    if (params.classes) {
      infoRegime.particularites!.push(`Classes disponibles: ${params.classes.map(c => c.classe).join(', ')}`)
    }
  }
  
  // ─────────────────────────────────────────────────────
  // 7. Retour du résultat complet
  // ─────────────────────────────────────────────────────
  return {
    regime: situation.regime,
    nomRegime: params.nom,
    pointsExistants,
    pointsProjetes,
    pointsGratuits,
    pointsTotaux,
    valeurPoint: params.valeurPointAnnuelle,
    
    coefficients: {
      solidarite: coefSolidarite,
      majorationFamille: coefMajoration,
      surcote: coefSurcote,
      decote: coefDecote,
      total: coefTotal
    },
    
    pensionAnnuelleBrute,
    pensionMensuelleBrute,
    pensionAnnuelleNette,
    pensionMensuelleNette,
    
    detailCalcul: {
      formule: `Pension = Points × Valeur du point × Coefficients`,
      etapes: etapesCalcul
    },
    
    infoRegime
  }
}

// =====================================================
// HELPERS POUR LE FRONTEND
// =====================================================

/**
 * Retourne la liste des régimes disponibles pour le frontend
 */
export function getRegimesDisponibles(): Array<{
  value: RegimeComplementaire
  label: string
  description: string
  gestionParClasses: boolean
  classes?: Array<{ classe: string; label: string }>
}> {
  return Object.entries(REGIME_PARAMS_2025)
    .filter(([key]) => key !== 'AUCUN')
    .map(([key, params]) => ({
      value: key as RegimeComplementaire,
      label: params.nom,
      description: params.description,
      gestionParClasses: params.gestionParClasses || false,
      classes: params.classes?.map(c => ({
        classe: c.classe,
        label: `Classe ${c.classe} - ${c.pointsParAn} pts/an (${c.cotisationAnnuelle}€/an)`
      }))
    }))
}

/**
 * Détermine automatiquement le régime complémentaire selon le régime de base
 */
export function determinerRegimeComplementaire(
  regimeBase: string,
  profession?: string
): RegimeComplementaire {
  switch (regimeBase.toLowerCase()) {
    case 'general':
    case 'salarie':
    case 'prive':
      return 'AGIRC_ARRCO'
      
    case 'fonctionnaire':
    case 'fonction_publique':
      return 'RAFP'
      
    case 'contractuel':
    case 'agent_public':
      return 'IRCANTEC'
      
    case 'independant':
    case 'artisan':
    case 'commercant':
    case 'tns':
      return 'SSI'
      
    case 'liberal':
    case 'profession_liberale':
      // Selon la profession
      if (profession) {
        const profLower = profession.toLowerCase()
        if (profLower.includes('médecin') || profLower.includes('medecin')) return 'CARMF_COMPLEMENTAIRE'
        if (profLower.includes('infirmier') || profLower.includes('kiné') || profLower.includes('kine')) return 'CARPIMKO_COMPLEMENTAIRE'
        if (profLower.includes('avocat')) return 'CNBF_COMPLEMENTAIRE'
        if (profLower.includes('notaire')) return 'CRPCEN_COMPLEMENTAIRE'
      }
      return 'CIPAV'
      
    case 'multiple':
      return 'AGIRC_ARRCO'  // Par défaut le plus courant
      
    default:
      return 'AUCUN'
  }
}
