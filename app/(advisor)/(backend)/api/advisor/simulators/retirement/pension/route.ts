 
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  type RegimeComplementaire,
  type SituationComplementaire,
  simulerRetraiteComplementaire,
  determinerRegimeComplementaire,
  REGIME_PARAMS_2025,
  calculerCoefficientSolidariteAgircArrco
} from '@/lib/retirement/complementary-pension'
import { logger } from '@/app/_common/lib/logger'
import {
  PLAFONDS
} from '@/lib/retirement/config/parameters'

/**
 * Estimateur de Pension de Retraite Française
 * 
 * Corrections appliquées :
 * - Trimestres requis dynamiques selon l'année de naissance (réforme 2023)
 * - Ajout du régime 'multiple' pour les poly-pensionnés
 * - Pension complémentaire calculée avec le module détaillé (tous les régimes)
 * - SAM basé sur les 25 meilleures années (documentation)
 */

const pensionEstimationSchema = z.object({
    regime: z.enum(['general', 'independent', 'public', 'agricultural', 'multiple']),
    yearsWorked: z.number().int().min(0).max(60),
    averageSalary: z.number().positive('Le salaire moyen doit être positif'),
    currentAge: z.number().int().min(18).max(100),
    retirementAge: z.number().int().min(50).max(75),
    fullRateAge: z.number().int().min(60).max(75),
    
    // ===== DONNÉES DÉTAILLÉES TRIMESTRES (optionnel) =====
    detailedQuarters: z.object({
      // Trimestres cotisés
      cotises: z.object({
        salarie: z.number().int().min(0).default(0),
        independant: z.number().int().min(0).default(0),
        fonctionPublique: z.number().int().min(0).default(0),
        apprentissage: z.number().int().min(0).default(0),
      }).optional(),
      
      // Trimestres assimilés
      assimiles: z.object({
        chomageIndemnise: z.number().int().min(0).default(0), // Illimité
        chomageNonIndemnise: z.number().int().min(0).default(0), // Max 6 puis 4
        maladie: z.number().int().min(0).default(0), // 1 par 60 jours
        accidentTravail: z.number().int().min(0).default(0),
        invalidite: z.number().int().min(0).default(0),
        maternite: z.number().int().min(0).default(0), // 1 par accouchement
        congeParental: z.number().int().min(0).default(0), // 1 par 90 jours
        serviceMilitaire: z.number().int().min(0).default(0), // 1 par 90 jours
        serviceCivique: z.number().int().min(0).default(0),
      }).optional(),
      
      // Situation familiale
      enfants: z.object({
        nombre: z.number().int().min(0).default(0),
        enfantHandicape: z.boolean().default(false),
        aAdopte: z.boolean().default(false),
      }).optional(),
      
      // Situations spéciales
      handicap: z.object({
        tauxIncapacite: z.number().min(0).max(100).default(0), // >= 80% donne des droits
        aeeh: z.boolean().default(false), // Allocation éducation enfant handicapé
      }).optional(),
      
      // Périodes rachetables
      rachetables: z.object({
        anneesEtudesSuperieures: z.number().int().min(0).max(12).default(0),
        anneesIncompletes: z.number().int().min(0).default(0), // Années < 4 trimestres
        stagesNonValides: z.number().int().min(0).default(0), // Stages > 2 mois
        apprentissageAncien: z.number().int().min(0).default(0), // Avant 2014
      }).optional(),
      
      // Pour carrière longue
      carriereLangue: z.object({
        aCommenceAvant20Ans: z.boolean().default(false),
        aCommenceAvant18Ans: z.boolean().default(false),
        aCommenceAvant16Ans: z.boolean().default(false),
        trimestresAvant20Ans: z.number().int().min(0).default(0),
      }).optional(),
      
      // Aidant familial
      aidantFamilial: z.object({
        estAidant: z.boolean().default(false),
        anneesAidant: z.number().int().min(0).default(0),
      }).optional(),
      
    }).optional(),
    
    // ===== DONNÉES RETRAITE COMPLÉMENTAIRE (optionnel) =====
    complementary: z.object({
      // Régime complémentaire spécifique
      regime: z.enum([
        'AGIRC_ARRCO',      // Salariés privé
        'RAFP',             // Fonctionnaires titulaires
        'IRCANTEC',         // Contractuels public
        'SSI',              // Artisans/Commerçants
        'CIPAV',            // Professions libérales
        'CARMF_COMPLEMENTAIRE',    // Médecins
        'CARPIMKO_COMPLEMENTAIRE', // Paramédicaux
        'CNBF_COMPLEMENTAIRE',     // Avocats
        'CRPCEN_COMPLEMENTAIRE',   // Notaires
        'AUCUN'
      ]).optional(),
      
      // Points déjà acquis (relevé individuel de situation)
      pointsExistants: z.number().min(0).default(0),
      
      // Assiette de cotisation annuelle (pour projection)
      assietteCotisation: z.number().min(0).optional(),
      
      // Classe de cotisation (pour régimes par classes: CARMF, CIPAV, etc.)
      classeCotisation: z.string().optional(),
      
      // Profession (pour déterminer automatiquement le régime)
      profession: z.string().optional(),
      
      // Nombre d'enfants (pour majoration famille)
      nombreEnfants: z.number().int().min(0).default(0),
      
      // Report ou anticipation du départ
      reportAnnees: z.number().min(0).max(5).default(0), // Années de report après taux plein
      departAnticipe: z.boolean().default(false), // Carrière longue, handicap, etc.
      
      // Périodes assimilées complémentaires
      periodesAssimilees: z.object({
        chomageIndemnise: z.object({ trimestres: z.number().int().min(0).default(0) }).optional(),
        maladie: z.object({ trimestres: z.number().int().min(0).default(0) }).optional(),
        maternite: z.object({ trimestres: z.number().int().min(0).default(0) }).optional(),
        invalidite: z.object({ trimestres: z.number().int().min(0).default(0) }).optional(),
        serviceMilitaire: z.object({ jours: z.number().int().min(0).default(0) }).optional(),
      }).optional(),
    }).optional(),
})

// =====================================================
// TRIMESTRES REQUIS SELON L'ANNÉE DE NAISSANCE
// Basé sur la réforme des retraites 2023
// =====================================================
const QUARTERS_REQUIRED_MAP: { [year: number]: number } = {
  1953: 165, 1954: 165,
  1955: 166, 1956: 166, 1957: 166,
  1958: 167, 1959: 167, 1960: 167,
  1961: 168, 1962: 168, 1963: 168,
  1964: 169, 1965: 169, 1966: 169,
  1967: 170, 1968: 170, 1969: 170,
  1970: 171, 1971: 171, 1972: 171,
  1973: 172, // 43 ans - Après 1973, reste 172 (43 ans)
}

// Âge légal de départ selon l'année de naissance (réforme 2023)
const LEGAL_AGE_MAP: { [year: number]: number } = {
  1961: 62, // 62 ans
  1962: 62.5, // 62 ans et 6 mois
  1963: 63, // 63 ans
  1964: 63.5, // 63 ans et 6 mois
  1965: 64, // 64 ans (génération pivot)
  // Après 1965 : 64 ans
}

// Plafond Annuel Sécurité Sociale - Centralisé dans /lib/retirement/config/parameters.ts
const PASS_2024 = PLAFONDS.PASS  // 47100€ en 2025

// =====================================================
// FONCTION DE CALCUL DÉTAILLÉ DES TRIMESTRES
// =====================================================
interface DetailedQuartersResult {
  // Section 1: Trimestres déjà validés
  validated: {
    cotises: {
      total: number
      detail: { source: string; trimestres: number }[]
    }
    assimiles: {
      total: number
      detail: { source: string; trimestres: number; limite?: string }[]
    }
    majorations: {
      total: number
      detail: { source: string; trimestres: number; conditions?: string }[]
    }
    totalValides: number
  }
  
  // Section 2: Trimestres supplémentaires gratuits possibles
  supplementairesGratuits: {
    total: number
    detail: { source: string; trimestres: number; conditions: string; demarche: string }[]
  }
  
  // Section 3: Trimestres rachetables
  rachetables: {
    total: number
    detail: { source: string; trimestres: number; coutEstime?: string; interet: string }[]
  }
  
  // Section 4: Carrière longue
  carriereLongue: {
    eligible: boolean
    ageDepart: number | null
    conditions: string[]
    trimestresComptant: number
  }
  
  // Synthèse
  synthese: {
    totalActuel: number
    totalPotentiel: number // Avec rachat et majorations
    manquantsTauxPlein: number
    conseilsPrioritaires: string[]
  }
}

function calculateDetailedQuarters(
  yearsWorked: number,
  currentAge: number,
  retirementAge: number,
  quartersRequired: number,
  detailedQuarters?: any
): DetailedQuartersResult {
  
  const result: DetailedQuartersResult = {
    validated: {
      cotises: { total: 0, detail: [] },
      assimiles: { total: 0, detail: [] },
      majorations: { total: 0, detail: [] },
      totalValides: 0
    },
    supplementairesGratuits: { total: 0, detail: [] },
    rachetables: { total: 0, detail: [] },
    carriereLongue: { eligible: false, ageDepart: null, conditions: [], trimestresComptant: 0 },
    synthese: { totalActuel: 0, totalPotentiel: 0, manquantsTauxPlein: 0, conseilsPrioritaires: [] }
  }
  
  // Si pas de détails, calcul simplifié
  if (!detailedQuarters) {
    result.validated.cotises.total = yearsWorked * 4
    result.validated.cotises.detail.push({ source: 'Travail (estimation)', trimestres: yearsWorked * 4 })
    result.validated.totalValides = yearsWorked * 4
    result.synthese.totalActuel = yearsWorked * 4
    result.synthese.totalPotentiel = yearsWorked * 4
    result.synthese.manquantsTauxPlein = Math.max(0, quartersRequired - result.synthese.totalActuel)
    return result
  }
  
  // ===== SECTION 1: TRIMESTRES VALIDÉS =====
  
  // 1.1 Trimestres cotisés
  if (detailedQuarters.cotises) {
    const c = detailedQuarters.cotises
    if (c.salarie > 0) result.validated.cotises.detail.push({ source: 'Salarié privé', trimestres: c.salarie })
    if (c.independant > 0) result.validated.cotises.detail.push({ source: 'Indépendant/TNS', trimestres: c.independant })
    if (c.fonctionPublique > 0) result.validated.cotises.detail.push({ source: 'Fonction publique', trimestres: c.fonctionPublique })
    if (c.apprentissage > 0) result.validated.cotises.detail.push({ source: 'Apprentissage', trimestres: c.apprentissage })
    result.validated.cotises.total = (c.salarie || 0) + (c.independant || 0) + (c.fonctionPublique || 0) + (c.apprentissage || 0)
  } else {
    // Fallback sur yearsWorked
    result.validated.cotises.total = yearsWorked * 4
    result.validated.cotises.detail.push({ source: 'Travail (estimation)', trimestres: yearsWorked * 4 })
  }
  
  // 1.2 Trimestres assimilés
  if (detailedQuarters.assimiles) {
    const a = detailedQuarters.assimiles
    if (a.chomageIndemnise > 0) {
      result.validated.assimiles.detail.push({ source: 'Chômage indemnisé', trimestres: a.chomageIndemnise })
    }
    if (a.chomageNonIndemnise > 0) {
      const limite = Math.min(a.chomageNonIndemnise, 6) // Première période max 6
      result.validated.assimiles.detail.push({ 
        source: 'Chômage non indemnisé', 
        trimestres: limite,
        limite: 'Max 6 trimestres (1ère période), 4 ensuite'
      })
    }
    if (a.maladie > 0) {
      result.validated.assimiles.detail.push({ source: 'Maladie', trimestres: a.maladie })
    }
    if (a.accidentTravail > 0) {
      result.validated.assimiles.detail.push({ source: 'Accident du travail', trimestres: a.accidentTravail })
    }
    if (a.invalidite > 0) {
      result.validated.assimiles.detail.push({ source: 'Invalidité', trimestres: a.invalidite })
    }
    if (a.maternite > 0) {
      result.validated.assimiles.detail.push({ source: 'Maternité', trimestres: a.maternite })
    }
    if (a.congeParental > 0) {
      result.validated.assimiles.detail.push({ 
        source: 'Congé parental', 
        trimestres: a.congeParental,
        limite: '1 trimestre par 90 jours'
      })
    }
    if (a.serviceMilitaire > 0) {
      result.validated.assimiles.detail.push({ 
        source: 'Service militaire', 
        trimestres: a.serviceMilitaire,
        limite: '1 trimestre par 90 jours'
      })
    }
    if (a.serviceCivique > 0) {
      result.validated.assimiles.detail.push({ source: 'Service civique', trimestres: a.serviceCivique })
    }
    result.validated.assimiles.total = result.validated.assimiles.detail.reduce((sum, d) => sum + d.trimestres, 0)
  }
  
  // 1.3 Majorations enfants
  if (detailedQuarters.enfants) {
    const e = detailedQuarters.enfants
    if (e.nombre > 0) {
      // +4 trimestres maternité/adoption par enfant
      const majMaternite = e.nombre * 4
      result.validated.majorations.detail.push({ 
        source: 'Maternité/Adoption', 
        trimestres: majMaternite,
        conditions: '4 trimestres par enfant'
      })
      
      // +4 trimestres éducation par enfant (si mère ou père au choix)
      const majEducation = e.nombre * 4
      result.validated.majorations.detail.push({ 
        source: 'Éducation', 
        trimestres: majEducation,
        conditions: '4 trimestres par enfant (à répartir entre parents)'
      })
    }
    
    if (e.enfantHandicape) {
      // Jusqu'à 8 trimestres supplémentaires
      result.validated.majorations.detail.push({ 
        source: 'Enfant handicapé', 
        trimestres: 8,
        conditions: 'Jusqu\'à 8 trimestres si enfant handicapé'
      })
    }
    
    result.validated.majorations.total = result.validated.majorations.detail.reduce((sum, d) => sum + d.trimestres, 0)
  }
  
  // Total validés
  result.validated.totalValides = result.validated.cotises.total + result.validated.assimiles.total + result.validated.majorations.total
  
  // ===== SECTION 2: TRIMESTRES SUPPLÉMENTAIRES GRATUITS POSSIBLES =====
  
  // Handicap >= 80%
  if (detailedQuarters.handicap?.tauxIncapacite >= 80) {
    result.supplementairesGratuits.detail.push({
      source: 'Handicap (incapacité ≥ 80%)',
      trimestres: 8,
      conditions: 'Taux d\'incapacité permanente ≥ 80%',
      demarche: 'Fournir attestation MDPH à la CARSAT'
    })
  }
  
  // AEEH (Allocation éducation enfant handicapé)
  if (detailedQuarters.handicap?.aeeh) {
    result.supplementairesGratuits.detail.push({
      source: 'Perception AEEH',
      trimestres: 4,
      conditions: 'Avoir perçu l\'AEEH',
      demarche: 'Attestation CAF à fournir'
    })
  }
  
  // Aidant familial
  if (detailedQuarters.aidantFamilial?.estAidant) {
    const trimAidant = Math.min(detailedQuarters.aidantFamilial.anneesAidant * 4, 32) // Max 8 ans = 32 trimestres
    result.supplementairesGratuits.detail.push({
      source: 'Aidant familial',
      trimestres: trimAidant,
      conditions: 'Aide régulière à un proche dépendant',
      demarche: 'Demande d\'affiliation gratuite à l\'assurance vieillesse'
    })
  }
  
  // Majoration 3 enfants (+10% pension)
  if (detailedQuarters.enfants?.nombre >= 3) {
    result.supplementairesGratuits.detail.push({
      source: 'Majoration 3+ enfants',
      trimestres: 0, // C'est une majoration de pension, pas de trimestres
      conditions: 'Avoir élevé 3 enfants ou plus',
      demarche: 'Automatique avec justificatifs enfants - Majoration de 10% sur la pension'
    })
  }
  
  result.supplementairesGratuits.total = result.supplementairesGratuits.detail.reduce((sum, d) => sum + d.trimestres, 0)
  
  // ===== SECTION 3: TRIMESTRES RACHETABLES =====
  
  if (detailedQuarters.rachetables) {
    const r = detailedQuarters.rachetables
    
    if (r.anneesEtudesSuperieures > 0) {
      const trimEtudes = Math.min(r.anneesEtudesSuperieures * 4, 12) // Max 12 trimestres
      result.rachetables.detail.push({
        source: 'Études supérieures',
        trimestres: trimEtudes,
        coutEstime: `~${(trimEtudes * 4000).toLocaleString('fr-FR')} € (variable selon âge/revenus)`,
        interet: 'Réduire la décote ou atteindre le taux plein plus tôt'
      })
    }
    
    if (r.anneesIncompletes > 0) {
      const trimIncompletes = r.anneesIncompletes * 2 // Estimation 2 trimestres par année incomplète
      result.rachetables.detail.push({
        source: 'Années incomplètes',
        trimestres: trimIncompletes,
        coutEstime: `~${(trimIncompletes * 3500).toLocaleString('fr-FR')} €`,
        interet: 'Compléter les années avec moins de 4 trimestres'
      })
    }
    
    if (r.stagesNonValides > 0) {
      result.rachetables.detail.push({
        source: 'Stages non validés (> 2 mois)',
        trimestres: r.stagesNonValides,
        coutEstime: `~${(r.stagesNonValides * 3000).toLocaleString('fr-FR')} €`,
        interet: 'Stages effectués après 2015 de plus de 2 mois'
      })
    }
    
    if (r.apprentissageAncien > 0) {
      result.rachetables.detail.push({
        source: 'Apprentissage ancien régime',
        trimestres: r.apprentissageAncien,
        coutEstime: `~${(r.apprentissageAncien * 2500).toLocaleString('fr-FR')} €`,
        interet: 'Contrats d\'apprentissage avant 2014 mal validés'
      })
    }
  }
  
  result.rachetables.total = result.rachetables.detail.reduce((sum, d) => sum + d.trimestres, 0)
  
  // ===== SECTION 4: CARRIÈRE LONGUE =====
  
  if (detailedQuarters.carriereLangue) {
    const cl = detailedQuarters.carriereLangue
    
    // Trimestres "cotisés" (hors assimilés pour certaines périodes)
    const trimCotisesPourCL = result.validated.cotises.total
    
    if (cl.aCommenceAvant16Ans && trimCotisesPourCL >= 4) {
      result.carriereLongue.eligible = true
      result.carriereLongue.ageDepart = 58
      result.carriereLongue.conditions.push('Début d\'activité avant 16 ans')
      result.carriereLongue.conditions.push(`${quartersRequired} trimestres cotisés requis`)
    } else if (cl.aCommenceAvant18Ans && trimCotisesPourCL >= 4) {
      result.carriereLongue.eligible = true
      result.carriereLongue.ageDepart = 60
      result.carriereLongue.conditions.push('Début d\'activité avant 18 ans')
      result.carriereLongue.conditions.push(`${quartersRequired} trimestres cotisés requis`)
    } else if (cl.aCommenceAvant20Ans && cl.trimestresAvant20Ans >= 5) {
      result.carriereLongue.eligible = true
      result.carriereLongue.ageDepart = 62
      result.carriereLongue.conditions.push('Début d\'activité avant 20 ans')
      result.carriereLongue.conditions.push('Au moins 5 trimestres avant fin année des 20 ans')
      result.carriereLongue.conditions.push(`${quartersRequired} trimestres cotisés requis`)
    }
    
    result.carriereLongue.trimestresComptant = trimCotisesPourCL
  }
  
  // ===== SYNTHÈSE =====
  
  result.synthese.totalActuel = result.validated.totalValides
  result.synthese.totalPotentiel = result.validated.totalValides + result.supplementairesGratuits.total + result.rachetables.total
  result.synthese.manquantsTauxPlein = Math.max(0, quartersRequired - result.synthese.totalActuel)
  
  // Conseils prioritaires
  if (result.synthese.manquantsTauxPlein > 0) {
    if (result.supplementairesGratuits.total > 0) {
      result.synthese.conseilsPrioritaires.push(
        `Demandez vos ${result.supplementairesGratuits.total} trimestres gratuits (majorations enfants, handicap, aidant...)`
      )
    }
    
    if (result.rachetables.total > 0 && result.synthese.manquantsTauxPlein <= result.rachetables.total) {
      result.synthese.conseilsPrioritaires.push(
        `Le rachat de ${Math.min(result.rachetables.total, result.synthese.manquantsTauxPlein)} trimestres vous permettrait d'atteindre le taux plein`
      )
    }
    
    if (result.carriereLongue.eligible) {
      result.synthese.conseilsPrioritaires.push(
        `Vous êtes éligible au départ anticipé carrière longue à ${result.carriereLongue.ageDepart} ans`
      )
    }
    
    result.synthese.conseilsPrioritaires.push(
      'Vérifiez votre relevé de carrière sur info-retraite.fr pour les périodes oubliées'
    )
  } else {
    result.synthese.conseilsPrioritaires.push('Vous avez suffisamment de trimestres pour le taux plein')
  }
  
  return result
}

function getQuartersRequired(birthYear: number): number {
  // Trouver l'année correspondante dans la map (décroissant)
  const matchingYear = Object.keys(QUARTERS_REQUIRED_MAP)
    .map(Number)
    .sort((a, b) => b - a)
    .find(y => y <= birthYear)
  
  if (matchingYear) {
    return QUARTERS_REQUIRED_MAP[matchingYear]
  }
  
  // Par défaut : 172 trimestres (43 ans) pour les générations récentes
  return 172
}

function getLegalRetirementAge(birthYear: number): number {
  const matchingYear = Object.keys(LEGAL_AGE_MAP)
    .map(Number)
    .sort((a, b) => b - a)
    .find(y => y <= birthYear)
  
  if (matchingYear) {
    return LEGAL_AGE_MAP[matchingYear]
  }
  
  // Avant 1961 : 62 ans, après 1965 : 64 ans
  return birthYear < 1961 ? 62 : 64
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = pensionEstimationSchema.parse(body)
    const {
      regime,
      yearsWorked,
      averageSalary,
      currentAge,
      retirementAge,
      fullRateAge,
      detailedQuarters
    } = validatedData

    // =====================================================
    // CALCUL DE L'ANNÉE DE NAISSANCE ET TRIMESTRES REQUIS
    // =====================================================
    const currentYear = new Date().getFullYear()
    const birthYear = currentYear - currentAge
    const quartersRequired = getQuartersRequired(birthYear)
    const legalRetirementAge = getLegalRetirementAge(birthYear)
    
    // =====================================================
    // CALCUL DÉTAILLÉ DES TRIMESTRES (si données fournies)
    // =====================================================
    const detailedQuartersResult = calculateDetailedQuarters(
      yearsWorked,
      currentAge,
      retirementAge,
      quartersRequired,
      detailedQuarters
    )

    // =====================================================
    // TRIMESTRES - Projection jusqu'à la retraite
    // =====================================================
    // Trimestres déjà validés (passé)
    const quartersAlreadyValidated = yearsWorked * 4
    
    // Années restantes jusqu'à la retraite
    const yearsUntilRetirement = Math.max(0, retirementAge - currentAge)
    
    // Trimestres futurs (en supposant qu'on continue à travailler)
    const futureQuarters = yearsUntilRetirement * 4
    
    // Total des trimestres à la date de départ
    const quartersValidated = quartersAlreadyValidated + futureQuarters
    
    // Trimestres manquants par rapport au taux plein
    const missingQuarters = Math.max(0, quartersRequired - quartersValidated)

    // =====================================================
    // CALCUL DU TAUX DE LIQUIDATION
    // =====================================================
    let pensionRate = 0.5 // Taux plein = 50%

    // Décote si départ avant taux plein (0.625% par trimestre manquant, max 25%)
    const hasDiscount = retirementAge < fullRateAge && missingQuarters > 0
    const discountQuarters = hasDiscount ? Math.min(missingQuarters, 40) : 0 // Max 40 trimestres
    const discountRate = hasDiscount ? Math.min(0.25, discountQuarters * 0.00625) : 0

    // Surcote si travail au-delà du taux plein (1.25% par trimestre, pas de max)
    const hasBonus = retirementAge > fullRateAge && quartersValidated >= quartersRequired
    const bonusQuarters = hasBonus ? (retirementAge - fullRateAge) * 4 : 0
    const bonusRate = hasBonus ? bonusQuarters * 0.0125 : 0

    // Taux final
    pensionRate = pensionRate - discountRate + bonusRate

    // =====================================================
    // SALAIRE ANNUEL MOYEN (SAM) - 25 meilleures années
    // =====================================================
    // Note : Le SAM est la moyenne des 25 meilleures années
    // Si yearsWorked < 25, on prend toutes les années
    // Le salaire est plafonné au PASS chaque année
    const yearsForSAM = Math.min(yearsWorked, 25)
    
    // Plafonnement du salaire au PASS (simplification)
    const cappedSalary = Math.min(averageSalary, PASS_2024)
    const referenceSalary = cappedSalary
    
    // Indicateur si le salaire dépasse le PASS
    const salaryExceedsPASS = averageSalary > PASS_2024

    // =====================================================
    // CALCUL DES PENSIONS - Méthode corrigée
    // =====================================================
    
    // Coefficient de proratisation (durée cotisée / durée requise)
    const proratisationCoef = Math.min(1, quartersValidated / quartersRequired)
    
    // Pension de base annuelle
    const annualBasePension = referenceSalary * pensionRate * proratisationCoef
    const monthlyBasePension = annualBasePension / 12

    // =====================================================
    // PENSION COMPLÉMENTAIRE - CALCUL DÉTAILLÉ
    // Module couvrant tous les régimes français
    // =====================================================
    
    // Déterminer le régime complémentaire
    const complementaryData = validatedData.complementary
    let regimeComplementaire: RegimeComplementaire = 'AGIRC_ARRCO' // Par défaut salariés
    
    if (complementaryData?.regime) {
      regimeComplementaire = complementaryData.regime as RegimeComplementaire
    } else {
      // Détermination automatique selon le régime de base
      regimeComplementaire = determinerRegimeComplementaire(
        regime,
        complementaryData?.profession
      )
    }
    
    // Estimer les points si non fournis
    // Formule simplifiée : pour AGIRC-ARRCO, ~138 points/an pour 45k€ de salaire
    const pointsEstimeParAn = regimeComplementaire === 'AGIRC_ARRCO'
      ? (averageSalary * 0.0620) / 20.1877  // Calcul réel avec taux et prix d'achat
      : (averageSalary * 0.05) / (REGIME_PARAMS_2025[regimeComplementaire]?.prixAchatPoint || 15)
    
    const pointsExistants = complementaryData?.pointsExistants || (yearsWorked * pointsEstimeParAn)
    const anneesRestantes = Math.max(0, retirementAge - currentAge)
    
    // Calcul du coefficient de solidarité AGIRC-ARRCO
    let coeffSolidarite = 1
    let infoCoeffSolidarite = { coefficient: 1, duree: 0, explication: '' }
    
    if (regimeComplementaire === 'AGIRC_ARRCO') {
      infoCoeffSolidarite = calculerCoefficientSolidariteAgircArrco(
        retirementAge,
        fullRateAge,
        complementaryData?.departAnticipe || false
      )
      coeffSolidarite = infoCoeffSolidarite.coefficient
    }
    
    // Calcul de la majoration enfants
    const nombreEnfants = complementaryData?.nombreEnfants || detailedQuarters?.enfants?.nombre || 0
    
    // Préparation de la situation pour le calcul détaillé
    const situationComplementaire: SituationComplementaire = {
      regime: regimeComplementaire,
      pointsExistants: pointsExistants,
      assietteCotisation: complementaryData?.assietteCotisation || averageSalary,
      anneesProjetees: anneesRestantes,
      classeCotisation: complementaryData?.classeCotisation,
      coefficientSolidarite: coeffSolidarite,
      coefficientMajorationFamille: nombreEnfants >= 3 ? 1.10 : 1,
      coefficientSurcote: hasBonus ? 1 + bonusRate : 1,
      coefficientDecote: hasDiscount ? 1 - discountRate : 1,
      periodesAssimilees: complementaryData?.periodesAssimilees
    }
    
    // Calcul complet de la retraite complémentaire
    const resultatComplementaire = simulerRetraiteComplementaire(situationComplementaire)
    
    // Extraire les valeurs
    const monthlyComplementaryPension = resultatComplementaire.pensionMensuelleBrute
    const annualComplementaryPension = resultatComplementaire.pensionAnnuelleBrute

    // Totaux
    const monthlyPension = monthlyBasePension + monthlyComplementaryPension
    const annualPension = monthlyPension * 12

    // Taux de remplacement (par rapport au salaire brut)
    const replacementRate = averageSalary > 0 ? annualPension / averageSalary : 0

    // Répartition en pourcentage
    const basePercentage = monthlyPension > 0 ? (monthlyBasePension / monthlyPension) * 100 : 65
    const complementaryPercentage = monthlyPension > 0 ? (monthlyComplementaryPension / monthlyPension) * 100 : 35

    // =====================================================
    // PROJECTION DYNAMIQUE 62-70 ANS
    // =====================================================
    const projectionByAge: Array<{
      age: number
      quartersAtAge: number
      missingAtAge: number
      pensionRate: number
      hasDiscount: boolean
      discountPercent: number
      hasBonus: boolean
      bonusPercent: number
      monthlyPension: number
      annualPension: number
      replacementRatePercent: number
      vsBaseline: number // Différence vs l'âge choisi
    }> = []

    // Ratio complémentaire/base pour la projection (basé sur le calcul actuel)
    const ratioComplementaireBase = monthlyBasePension > 0 
      ? monthlyComplementaryPension / monthlyBasePension 
      : 0.538  // ~35/65 par défaut
    
    for (let projAge = 62; projAge <= 70; projAge++) {
      // Trimestres à cet âge
      const yearsUntilProjAge = Math.max(0, projAge - currentAge)
      const futureQtrAtAge = yearsUntilProjAge * 4
      const totalQtrAtAge = quartersAlreadyValidated + futureQtrAtAge
      const missingAtAge = Math.max(0, quartersRequired - totalQtrAtAge)
      
      // Décote/Surcote à cet âge
      const hasDiscountAtAge = projAge < fullRateAge && missingAtAge > 0
      const discountQtrAtAge = hasDiscountAtAge ? Math.min(missingAtAge, 40) : 0
      const discountRateAtAge = hasDiscountAtAge ? Math.min(0.25, discountQtrAtAge * 0.00625) : 0
      
      const hasBonusAtAge = projAge > fullRateAge && totalQtrAtAge >= quartersRequired
      const bonusQtrAtAge = hasBonusAtAge ? (projAge - fullRateAge) * 4 : 0
      const bonusRateAtAge = hasBonusAtAge ? bonusQtrAtAge * 0.0125 : 0
      
      // Taux de pension à cet âge
      const pensionRateAtAge = 0.5 - discountRateAtAge + bonusRateAtAge
      
      // Coefficient de proratisation
      const proratCoefAtAge = Math.min(1, totalQtrAtAge / quartersRequired)
      
      // Pension de base
      const annualBaseAtAge = referenceSalary * pensionRateAtAge * proratCoefAtAge
      const monthlyBaseAtAge = annualBaseAtAge / 12
      
      // Complémentaire avec simulation pour cet âge
      // Points estimés à cet âge
      const anneesJusquAge = Math.max(0, projAge - currentAge)
      const pointsAtAge = pointsExistants + (anneesJusquAge * pointsEstimeParAn)
      
      // Coefficient solidarité AGIRC-ARRCO selon l'âge de départ
      let coeffSolidariteAtAge = 1
      if (regimeComplementaire === 'AGIRC_ARRCO') {
        const infoCoefAtAge = calculerCoefficientSolidariteAgircArrco(
          projAge,
          fullRateAge,
          complementaryData?.departAnticipe || false
        )
        coeffSolidariteAtAge = infoCoefAtAge.coefficient
      }
      
      // Calcul complémentaire à cet âge
      const valeurPoint = REGIME_PARAMS_2025[regimeComplementaire]?.valeurPointAnnuelle || 1.4386
      const coefMajoFam = nombreEnfants >= 3 ? 1.10 : 1
      const coefSurcoteAtAge = hasBonusAtAge ? 1 + bonusRateAtAge : 1
      const coefDecoteAtAge = hasDiscountAtAge ? 1 - discountRateAtAge : 1
      const coefTotalAtAge = coeffSolidariteAtAge * coefMajoFam * coefSurcoteAtAge * coefDecoteAtAge
      
      const annualCompAtAge = pointsAtAge * valeurPoint * coefTotalAtAge
      const monthlyCompAtAge = annualCompAtAge / 12
      
      // Total
      const monthlyTotalAtAge = monthlyBaseAtAge + monthlyCompAtAge
      const annualTotalAtAge = monthlyTotalAtAge * 12
      
      // Taux de remplacement
      const replRateAtAge = averageSalary > 0 ? (annualTotalAtAge / averageSalary) * 100 : 0
      
      projectionByAge.push({
        age: projAge,
        quartersAtAge: totalQtrAtAge,
        missingAtAge,
        pensionRate: Math.round(pensionRateAtAge * 1000) / 1000,
        hasDiscount: hasDiscountAtAge,
        discountPercent: Math.round(discountRateAtAge * 100),
        hasBonus: hasBonusAtAge,
        bonusPercent: Math.round(bonusRateAtAge * 100),
        monthlyPension: Math.round(monthlyTotalAtAge),
        annualPension: Math.round(annualTotalAtAge),
        replacementRatePercent: Math.round(replRateAtAge),
        vsBaseline: Math.round(monthlyTotalAtAge - monthlyPension)
      })
    }

    // Trouver l'âge optimal (premier âge sans décote OU taux plein)
    const optimalAge = projectionByAge.find(p => p.missingAtAge === 0 && !p.hasDiscount)?.age 
      || projectionByAge.find(p => !p.hasDiscount)?.age 
      || fullRateAge

    // =====================================================
    // RECOMMANDATIONS ENRICHIES
    // =====================================================
    const recommendations: Array<{ priorite: 'haute' | 'moyenne' | 'basse', type: string, description: string }> = []
    
    // Trimestres manquants
    if (missingQuarters > 0) {
      const yearsNeeded = Math.ceil(missingQuarters / 4)
      recommendations.push({
        priorite: 'haute',
        type: 'trimestres',
        description: `À ${retirementAge} ans, vous aurez ${quartersValidated} trimestres (${quartersAlreadyValidated} déjà + ${futureQuarters} futurs). Il en manque ${missingQuarters} (${yearsNeeded} ans) sur les ${quartersRequired} requis.`
      })
      
      if (missingQuarters <= 12) {
        recommendations.push({
          priorite: 'moyenne',
          type: 'rachat',
          description: `Vous pouvez racheter jusqu'à 12 trimestres. Le coût varie selon votre âge et revenus (consultez l'Assurance Retraite).`
        })
      }
    }

    // Décote
    if (hasDiscount && discountRate > 0) {
      const decotePercent = Math.round(discountRate * 100)
      const gainIfWait = Math.round((monthlyPension / (1 - discountRate)) - monthlyPension)
      recommendations.push({
        priorite: 'haute',
        type: 'decote',
        description: `Décote de ${decotePercent}% appliquée. Reporter à ${fullRateAge} ans vous ferait gagner ~${gainIfWait} €/mois.`
      })
    }

    // Âge légal
    if (retirementAge < legalRetirementAge) {
      recommendations.push({
        priorite: 'haute',
        type: 'age_legal',
        description: `⚠️ L'âge légal pour votre génération (${birthYear}) est ${legalRetirementAge} ans. Départ à ${retirementAge} ans non possible sauf carrière longue.`
      })
    }

    // Taux de remplacement faible
    if (replacementRate < 0.5) {
      recommendations.push({
        priorite: 'haute',
        type: 'complement',
        description: `Taux de remplacement de ${Math.round(replacementRate * 100)}% (< 50%). Une épargne retraite complémentaire (PER, assurance-vie) est fortement recommandée.`
      })
    } else if (replacementRate < 0.7) {
      recommendations.push({
        priorite: 'moyenne',
        type: 'complement',
        description: `Taux de remplacement de ${Math.round(replacementRate * 100)}%. Envisagez un PER ou une assurance-vie pour sécuriser vos revenus.`
      })
    }

    // Salaire > PASS
    if (salaryExceedsPASS) {
      const nonCovered = averageSalary - PASS_2024
      recommendations.push({
        priorite: 'moyenne',
        type: 'plafond',
        description: `Votre salaire dépasse le PASS (${PASS_2024.toLocaleString('fr-FR')} €). ${nonCovered.toLocaleString('fr-FR')} €/an ne sont pas couverts par le régime de base.`
      })
    }

    // Surcote
    if (hasBonus) {
      recommendations.push({
        priorite: 'basse',
        type: 'surcote',
        description: `Surcote de ${Math.round(bonusRate * 100)}% (${bonusQuarters} trimestres au-delà du taux plein). Excellent !`
      })
    }

    // Situation favorable
    if (recommendations.length === 0) {
      recommendations.push({
        priorite: 'basse',
        type: 'info',
        description: 'Situation favorable. Vous bénéficiez du taux plein.'
      })
      recommendations.push({
        priorite: 'basse',
        type: 'suivi',
        description: 'Vérifiez régulièrement votre relevé de carrière sur info-retraite.fr'
      })
    }

    // Régime multiple
    if (regime === 'multiple') {
      recommendations.push({
        priorite: 'moyenne',
        type: 'regime',
        description: 'Carrière poly-pensionnée détectée. Les trimestres sont totalisés mais chaque régime verse sa part. Consultez chaque caisse.'
      })
    }

    // Recommandation sur la retraite complémentaire
    if (regimeComplementaire !== 'AUCUN') {
      const params = REGIME_PARAMS_2025[regimeComplementaire]
      
      // Malus AGIRC-ARRCO
      if (regimeComplementaire === 'AGIRC_ARRCO' && infoCoeffSolidarite.coefficient < 1) {
        recommendations.push({
          priorite: 'haute',
          type: 'complementaire',
          description: `⚠️ ${infoCoeffSolidarite.explication}. Envisagez de reporter d'1 an après le taux plein pour éviter ce malus.`
        })
      } else if (regimeComplementaire === 'AGIRC_ARRCO' && infoCoeffSolidarite.coefficient > 1) {
        recommendations.push({
          priorite: 'basse',
          type: 'complementaire',
          description: `✅ ${infoCoeffSolidarite.explication}. Excellente décision !`
        })
      }
      
      // Info sur les points
      recommendations.push({
        priorite: 'moyenne',
        type: 'complementaire_info',
        description: `Régime ${params.nom} : ${Math.round(resultatComplementaire.pointsTotaux)} points projetés × ${params.valeurPointAnnuelle.toFixed(4)}€ = ${Math.round(resultatComplementaire.pensionAnnuelleBrute)}€/an`
      })
      
      // Majoration enfants
      if (nombreEnfants >= 3) {
        recommendations.push({
          priorite: 'basse',
          type: 'majoration',
          description: `✅ Majoration famille +10% appliquée (${nombreEnfants} enfants)`
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        // Paramètres
        regime,
        birthYear,
        yearsWorked,
        currentAge,
        retirementAge,
        fullRateAge,
        legalRetirementAge,
        
        // Trimestres
        quartersAlreadyValidated,
        futureQuarters,
        quartersValidated, // Total à la retraite
        quartersRequired,
        missingQuarters,
        yearsUntilRetirement,
        proratisationCoef: Math.round(proratisationCoef * 1000) / 1000,
        
        // Taux
        pensionRate: Math.round(pensionRate * 1000) / 1000,
        hasDiscount,
        discountRate: Math.round(discountRate * 10000) / 10000,
        discountQuarters,
        hasBonus,
        bonusRate: Math.round(bonusRate * 10000) / 10000,
        bonusQuarters,
        
        // Salaires
        averageSalary: Math.round(averageSalary),
        referenceSalary: Math.round(referenceSalary),
        salaryExceedsPASS,
        passCurrent: PASS_2024,
        
        // Pensions
        monthlyBasePension: Math.round(monthlyBasePension),
        monthlyComplementaryPension: Math.round(monthlyComplementaryPension),
        monthlyPension: Math.round(monthlyPension),
        annualPension: Math.round(annualPension),
        
        // Répartition
        basePercentage: Math.round(basePercentage),
        complementaryPercentage: Math.round(complementaryPercentage),
        
        // ===== RETRAITE COMPLÉMENTAIRE DÉTAILLÉE =====
        complementaryDetails: {
          regime: resultatComplementaire.regime,
          nomRegime: resultatComplementaire.nomRegime,
          
          // Points
          points: {
            existants: Math.round(resultatComplementaire.pointsExistants),
            projetes: Math.round(resultatComplementaire.pointsProjetes),
            gratuits: Math.round(resultatComplementaire.pointsGratuits),
            total: Math.round(resultatComplementaire.pointsTotaux)
          },
          valeurPoint: resultatComplementaire.valeurPoint,
          
          // Coefficients appliqués
          coefficients: {
            solidarite: {
              valeur: resultatComplementaire.coefficients.solidarite,
              explication: infoCoeffSolidarite.explication,
              dureeAnnees: infoCoeffSolidarite.duree
            },
            majorationFamille: resultatComplementaire.coefficients.majorationFamille,
            surcote: resultatComplementaire.coefficients.surcote,
            decote: resultatComplementaire.coefficients.decote,
            total: resultatComplementaire.coefficients.total
          },
          
          // Montants
          pensionAnnuelleBrute: Math.round(resultatComplementaire.pensionAnnuelleBrute),
          pensionMensuelleBrute: Math.round(resultatComplementaire.pensionMensuelleBrute),
          pensionAnnuelleNette: Math.round(resultatComplementaire.pensionAnnuelleNette),
          pensionMensuelleNette: Math.round(resultatComplementaire.pensionMensuelleNette),
          
          // Détail du calcul
          detailCalcul: resultatComplementaire.detailCalcul,
          
          // Informations sur le régime
          infoRegime: resultatComplementaire.infoRegime
        },
        
        // Indicateurs
        replacementRate: Math.round(replacementRate * 1000) / 1000,
        replacementRatePercent: Math.round(replacementRate * 100),
        
        // Recommandations
        recommendations,
        
        // Projection dynamique par âge de départ
        projectionByAge,
        optimalAge,
        
        // Analyse détaillée des trimestres (4 sections)
        detailedQuartersAnalysis: detailedQuartersResult
      }
    })
  } catch (error: any) {
    logger.error('Error in pension estimation:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation error: ' + error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
