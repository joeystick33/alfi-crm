/**
 * Service de gestion du questionnaire MiFID II
 * 
 * Ce service gère le questionnaire investisseur MiFID II:
 * - Démarrage et gestion du questionnaire
 * - Sauvegarde des réponses
 * - Calcul du profil de risque et horizon d'investissement
 * - Génération de recommandations
 * 
 * @module lib/compliance/services/mifid-service
 * @requirements 9.1-9.7
 */

import { prisma } from '@/app/_common/lib/prisma'
import {
  type MiFIDRiskProfile,
  type MiFIDInvestmentHorizon,
  type MiFIDQuestionnaireSection,
  type MiFIDQuestion,
  type MiFIDAnswer,
  type MiFIDQuestionnaireResult,
  MIFID_RISK_PROFILE_LABELS,
  MIFID_INVESTMENT_HORIZON_LABELS,
} from '../../documents/types'
import {
  saveMifidAnswersSchema,
  type SaveMiFIDAnswersInput,
} from '../../documents/schemas'

// ============================================================================
// Types
// ============================================================================

export interface MiFIDServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface MiFIDQuestionnaire {
  sections: MiFIDQuestionnaireSection[]
  totalQuestions: number
  estimatedTime: string
}

export interface MiFIDProfileSummary {
  clientId: string
  riskProfile: MiFIDRiskProfile
  investmentHorizon: MiFIDInvestmentHorizon
  totalScore: number
  maxScore: number
  completedAt: Date | null
  isOutdated: boolean
  recommendations: string[]
}

// ============================================================================
// MiFID Questionnaire Configuration
// ============================================================================

/**
 * Configuration du questionnaire MiFID II
 * 
 * @requirements 9.1 - THE MiFID_Questionnaire SHALL include sections for: knowledge/experience, financial situation, investment objectives, risk tolerance
 */
const MIFID_QUESTIONNAIRE_SECTIONS: MiFIDQuestionnaireSection[] = [
  {
    id: 'knowledge',
    title: 'Connaissances et Expérience',
    questions: [
      {
        id: 'knowledge_1',
        text: 'Quel est votre niveau de connaissance des marchés financiers ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'none', label: 'Aucune connaissance', score: 0 },
          { value: 'basic', label: 'Connaissances de base', score: 5 },
          { value: 'intermediate', label: 'Connaissances intermédiaires', score: 10 },
          { value: 'advanced', label: 'Connaissances avancées', score: 15 },
          { value: 'expert', label: 'Expert', score: 20 },
        ],
        required: true,
      },
      {
        id: 'knowledge_2',
        text: 'Avez-vous déjà investi dans des produits financiers ?',
        type: 'MULTIPLE_CHOICE',
        options: [
          { value: 'savings', label: 'Livrets d\'épargne', score: 2 },
          { value: 'life_insurance', label: 'Assurance-vie fonds euros', score: 3 },
          { value: 'unit_linked', label: 'Assurance-vie unités de compte', score: 5 },
          { value: 'stocks', label: 'Actions', score: 7 },
          { value: 'bonds', label: 'Obligations', score: 5 },
          { value: 'funds', label: 'OPCVM / Fonds', score: 6 },
          { value: 'derivatives', label: 'Produits dérivés', score: 10 },
          { value: 'none', label: 'Aucun', score: 0 },
        ],
        required: true,
      },
      {
        id: 'knowledge_3',
        text: 'Depuis combien de temps investissez-vous ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'never', label: 'Jamais investi', score: 0 },
          { value: 'less_2', label: 'Moins de 2 ans', score: 3 },
          { value: '2_5', label: '2 à 5 ans', score: 6 },
          { value: '5_10', label: '5 à 10 ans', score: 9 },
          { value: 'more_10', label: 'Plus de 10 ans', score: 12 },
        ],
        required: true,
      },
    ],
  },
  {
    id: 'financial_situation',
    title: 'Situation Financière',
    questions: [
      {
        id: 'financial_1',
        text: 'Quelle part de votre patrimoine total représente cet investissement ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'less_10', label: 'Moins de 10%', score: 15 },
          { value: '10_25', label: '10% à 25%', score: 12 },
          { value: '25_50', label: '25% à 50%', score: 8 },
          { value: '50_75', label: '50% à 75%', score: 4 },
          { value: 'more_75', label: 'Plus de 75%', score: 0 },
        ],
        required: true,
      },
      {
        id: 'financial_2',
        text: 'Disposez-vous d\'une épargne de précaution (3 à 6 mois de revenus) ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'yes_more', label: 'Oui, plus de 6 mois', score: 15 },
          { value: 'yes_3_6', label: 'Oui, 3 à 6 mois', score: 10 },
          { value: 'yes_less', label: 'Oui, moins de 3 mois', score: 5 },
          { value: 'no', label: 'Non', score: 0 },
        ],
        required: true,
      },
      {
        id: 'financial_3',
        text: 'Quelle est votre capacité d\'épargne mensuelle ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'none', label: 'Aucune', score: 0 },
          { value: 'less_500', label: 'Moins de 500€', score: 3 },
          { value: '500_1000', label: '500€ à 1000€', score: 6 },
          { value: '1000_2000', label: '1000€ à 2000€', score: 9 },
          { value: 'more_2000', label: 'Plus de 2000€', score: 12 },
        ],
        required: true,
      },
    ],
  },
  {
    id: 'objectives',
    title: 'Objectifs d\'Investissement',
    questions: [
      {
        id: 'objectives_1',
        text: 'Quel est votre objectif principal pour cet investissement ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'capital_preservation', label: 'Préserver mon capital', score: 0 },
          { value: 'regular_income', label: 'Générer des revenus réguliers', score: 5 },
          { value: 'balanced_growth', label: 'Croissance équilibrée', score: 10 },
          { value: 'capital_growth', label: 'Faire croître mon capital', score: 15 },
          { value: 'aggressive_growth', label: 'Maximiser la performance', score: 20 },
        ],
        required: true,
      },
      {
        id: 'objectives_2',
        text: 'Sur quelle durée envisagez-vous cet investissement ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'less_1', label: 'Moins d\'1 an', score: 0 },
          { value: '1_3', label: '1 à 3 ans', score: 5 },
          { value: '3_5', label: '3 à 5 ans', score: 10 },
          { value: '5_8', label: '5 à 8 ans', score: 15 },
          { value: 'more_8', label: 'Plus de 8 ans', score: 20 },
        ],
        required: true,
      },
      {
        id: 'objectives_3',
        text: 'Avez-vous besoin de pouvoir récupérer votre investissement rapidement ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'yes_anytime', label: 'Oui, à tout moment', score: 0 },
          { value: 'yes_6months', label: 'Oui, sous 6 mois', score: 5 },
          { value: 'no_planned', label: 'Non, sauf imprévu', score: 10 },
          { value: 'no_long_term', label: 'Non, investissement long terme', score: 15 },
        ],
        required: true,
      },
    ],
  },
  {
    id: 'risk_tolerance',
    title: 'Tolérance au Risque',
    questions: [
      {
        id: 'risk_1',
        text: 'Comment réagiriez-vous si votre investissement perdait 10% de sa valeur en un mois ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'sell_all', label: 'Je vendrais tout immédiatement', score: 0 },
          { value: 'sell_part', label: 'Je vendrais une partie', score: 5 },
          { value: 'wait', label: 'J\'attendrais que ça remonte', score: 10 },
          { value: 'buy_more', label: 'J\'en profiterais pour investir plus', score: 15 },
        ],
        required: true,
      },
      {
        id: 'risk_2',
        text: 'Quelle perte maximale seriez-vous prêt à accepter sur une année ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'none', label: 'Aucune perte', score: 0 },
          { value: 'max_5', label: 'Jusqu\'à 5%', score: 5 },
          { value: 'max_10', label: 'Jusqu\'à 10%', score: 10 },
          { value: 'max_20', label: 'Jusqu\'à 20%', score: 15 },
          { value: 'max_30', label: 'Jusqu\'à 30% ou plus', score: 20 },
        ],
        required: true,
      },
      {
        id: 'risk_3',
        text: 'Quel couple rendement/risque préférez-vous ?',
        type: 'SINGLE_CHOICE',
        options: [
          { value: 'safe', label: 'Rendement faible, risque très faible', score: 0 },
          { value: 'prudent', label: 'Rendement modéré, risque faible', score: 5 },
          { value: 'balanced', label: 'Rendement moyen, risque modéré', score: 10 },
          { value: 'dynamic', label: 'Rendement élevé, risque élevé', score: 15 },
          { value: 'aggressive', label: 'Rendement maximum, risque maximum', score: 20 },
        ],
        required: true,
      },
    ],
  },
]

// ============================================================================
// MiFID Service
// ============================================================================

/**
 * Démarre un nouveau questionnaire MiFID
 * 
 * @requirements 9.2 - WHEN a CGP starts a MiFID questionnaire, THE MiFID_Questionnaire SHALL display questions in a step-by-step wizard format
 */
export async function startQuestionnaire(): Promise<MiFIDServiceResult<MiFIDQuestionnaire>> {
  try {
    const totalQuestions = MIFID_QUESTIONNAIRE_SECTIONS.reduce(
      (sum, section) => sum + section.questions.length,
      0
    )

    return {
      success: true,
      data: {
        sections: MIFID_QUESTIONNAIRE_SECTIONS,
        totalQuestions,
        estimatedTime: '10-15 minutes',
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du démarrage du questionnaire'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Sauvegarde les réponses du questionnaire MiFID
 * 
 * @requirements 9.5 - WHEN the questionnaire is completed, THE MiFID_Questionnaire SHALL save the results to the client profile
 */
export async function saveAnswers(
  input: SaveMiFIDAnswersInput
): Promise<MiFIDServiceResult<MiFIDQuestionnaireResult>> {
  try {
    // Validate input
    const validatedInput = saveMifidAnswersSchema.parse(input)

    // Calculate the profile - ensure all answers have values
    const answersWithValues = validatedInput.answers.filter(
      (a): a is MiFIDAnswer => a.value !== undefined
    )
    const profileResult = calculateProfile(answersWithValues)

    // Update the client profile with the MiFID results
    await prisma.client.update({
      where: { id: validatedInput.clientId },
      data: {
        riskProfile: profileResult.riskProfile,
        investmentHorizon: profileResult.investmentHorizon,
        investmentGoals: {
          mifidAnswers: validatedInput.answers,
          mifidScore: profileResult.totalScore,
          mifidCompletedAt: new Date().toISOString(),
          mifidCompletedBy: validatedInput.userId,
        },
      },
    })

    // Create a timeline event
    const clientData = await prisma.client.findUnique({
      where: { id: validatedInput.clientId },
      select: { cabinetId: true },
    })

    if (clientData) {
      await (prisma as unknown as { complianceTimelineEvent: { create: (args: unknown) => Promise<unknown> } }).complianceTimelineEvent.create({
        data: {
          cabinetId: clientData.cabinetId,
          clientId: validatedInput.clientId,
          type: 'QUESTIONNAIRE_COMPLETED',
          title: 'Questionnaire MiFID II complété',
          description: `Profil de risque: ${MIFID_RISK_PROFILE_LABELS[profileResult.riskProfile]}, Horizon: ${MIFID_INVESTMENT_HORIZON_LABELS[profileResult.investmentHorizon]}`,
          metadata: {
            riskProfile: profileResult.riskProfile,
            investmentHorizon: profileResult.investmentHorizon,
            totalScore: profileResult.totalScore,
          },
          userId: validatedInput.userId,
        },
      })
    }

    return {
      success: true,
      data: {
        clientId: validatedInput.clientId,
        completedAt: new Date(),
        answers: answersWithValues,
        riskProfile: profileResult.riskProfile,
        investmentHorizon: profileResult.investmentHorizon,
        totalScore: profileResult.totalScore,
        recommendations: profileResult.recommendations,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la sauvegarde des réponses'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Calcule le profil de risque et l'horizon d'investissement
 * 
 * @requirements 9.3 - WHEN all questions are answered, THE MiFID_Questionnaire SHALL calculate a risk profile score
 * @requirements 9.4 - THE MiFID_Questionnaire SHALL calculate an investment horizon recommendation
 */
export function calculateProfile(answers: MiFIDAnswer[]): {
  riskProfile: MiFIDRiskProfile
  investmentHorizon: MiFIDInvestmentHorizon
  totalScore: number
  recommendations: string[]
} {
  let totalScore = 0
  let horizonScore = 0

  // Calculate total score from answers
  for (const answer of answers) {
    const question = findQuestion(answer.questionId)
    if (!question || !question.options) continue

    if (Array.isArray(answer.value)) {
      // Multiple choice - sum all selected options
      for (const val of answer.value) {
        const option = question.options.find(o => o.value === val)
        if (option) {
          totalScore += option.score
        }
      }
    } else {
      // Single choice
      const option = question.options.find(o => o.value === answer.value)
      if (option) {
        totalScore += option.score

        // Track horizon-specific questions
        if (answer.questionId === 'objectives_2') {
          horizonScore = option.score
        }
      }
    }
  }

  // Calculate risk profile based on total score
  // Max possible score is approximately 200 (varies based on multiple choice selections)
  const riskProfile = calculateRiskProfileFromScore(totalScore)

  // Calculate investment horizon based on specific question
  const investmentHorizon = calculateInvestmentHorizonFromScore(horizonScore)

  // Generate recommendations
  const recommendations = generateRecommendations(riskProfile, investmentHorizon, totalScore)

  return {
    riskProfile,
    investmentHorizon,
    totalScore,
    recommendations,
  }
}

/**
 * Récupère le profil MiFID actuel d'un client
 * 
 * @requirements 9.6 - THE MiFID_Questionnaire SHALL display a summary of the client's investor profile with recommendations
 */
export async function getClientProfile(
  clientId: string
): Promise<MiFIDServiceResult<MiFIDProfileSummary>> {
  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        riskProfile: true,
        investmentHorizon: true,
        investmentGoals: true,
        updatedAt: true,
      },
    })

    if (!client) {
      return {
        success: false,
        error: 'Client non trouvé',
      }
    }

    // Check if MiFID profile exists
    if (!client.riskProfile || !client.investmentHorizon) {
      return {
        success: false,
        error: 'Questionnaire MiFID non complété',
      }
    }

    // Extract MiFID data from investmentGoals
    const goals = client.investmentGoals as Record<string, unknown> | null
    const mifidScore = (goals?.mifidScore as number) || 0
    const mifidCompletedAt = goals?.mifidCompletedAt 
      ? new Date(goals.mifidCompletedAt as string) 
      : null

    // Check if profile is outdated (>12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    const isOutdated = mifidCompletedAt ? mifidCompletedAt < twelveMonthsAgo : true

    // Generate recommendations
    const recommendations = generateRecommendations(
      client.riskProfile as MiFIDRiskProfile,
      client.investmentHorizon as MiFIDInvestmentHorizon,
      mifidScore
    )

    return {
      success: true,
      data: {
        clientId: client.id,
        riskProfile: client.riskProfile as MiFIDRiskProfile,
        investmentHorizon: client.investmentHorizon as MiFIDInvestmentHorizon,
        totalScore: mifidScore,
        maxScore: 200, // Approximate max score
        completedAt: mifidCompletedAt,
        isOutdated,
        recommendations,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération du profil'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Vérifie si le questionnaire MiFID doit être mis à jour
 * 
 * @requirements 9.7 - WHEN a client's profile changes significantly, THE Alert_Engine SHALL create an alert to review the MiFID questionnaire
 */
export async function checkMiFIDValidity(
  clientId: string
): Promise<MiFIDServiceResult<{ isValid: boolean; reason?: string }>> {
  try {
    const profileResult = await getClientProfile(clientId)

    if (!profileResult.success || !profileResult.data) {
      return {
        success: true,
        data: {
          isValid: false,
          reason: 'Questionnaire MiFID non complété',
        },
      }
    }

    if (profileResult.data.isOutdated) {
      return {
        success: true,
        data: {
          isValid: false,
          reason: 'Questionnaire MiFID obsolète (plus de 12 mois)',
        },
      }
    }

    return {
      success: true,
      data: {
        isValid: true,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la vérification'
    return {
      success: false,
      error: message,
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Trouve une question par son ID
 */
function findQuestion(questionId: string): MiFIDQuestion | undefined {
  for (const section of MIFID_QUESTIONNAIRE_SECTIONS) {
    const question = section.questions.find(q => q.id === questionId)
    if (question) return question
  }
  return undefined
}

/**
 * Calcule le profil de risque à partir du score total
 */
function calculateRiskProfileFromScore(score: number): MiFIDRiskProfile {
  // Score ranges (approximate, based on max ~200)
  if (score < 40) return 'CONSERVATEUR'
  if (score < 80) return 'PRUDENT'
  if (score < 120) return 'EQUILIBRE'
  if (score < 160) return 'DYNAMIQUE'
  return 'OFFENSIF'
}

/**
 * Calcule l'horizon d'investissement à partir du score de la question horizon
 */
function calculateInvestmentHorizonFromScore(horizonScore: number): MiFIDInvestmentHorizon {
  if (horizonScore <= 5) return 'COURT'
  if (horizonScore <= 10) return 'MOYEN'
  return 'LONG'
}

/**
 * Génère des recommandations basées sur le profil
 */
function generateRecommendations(
  riskProfile: MiFIDRiskProfile,
  investmentHorizon: MiFIDInvestmentHorizon,
  score: number
): string[] {
  const recommendations: string[] = []

  // Risk profile recommendations
  switch (riskProfile) {
    case 'CONSERVATEUR':
      recommendations.push('Privilégier les fonds euros et les placements garantis')
      recommendations.push('Limiter l\'exposition aux marchés actions à moins de 10%')
      recommendations.push('Favoriser les produits à capital garanti')
      break
    case 'PRUDENT':
      recommendations.push('Allocation recommandée: 70-80% fonds euros, 20-30% unités de compte')
      recommendations.push('Privilégier les fonds obligataires et diversifiés prudents')
      recommendations.push('Envisager une gestion pilotée prudente')
      break
    case 'EQUILIBRE':
      recommendations.push('Allocation recommandée: 50% fonds euros, 50% unités de compte')
      recommendations.push('Diversifier entre actions, obligations et immobilier')
      recommendations.push('Envisager une gestion pilotée équilibrée')
      break
    case 'DYNAMIQUE':
      recommendations.push('Allocation recommandée: 30% fonds euros, 70% unités de compte')
      recommendations.push('Exposition significative aux marchés actions possible')
      recommendations.push('Envisager des fonds thématiques ou sectoriels')
      break
    case 'OFFENSIF':
      recommendations.push('Allocation recommandée: 0-20% fonds euros, 80-100% unités de compte')
      recommendations.push('Exposition maximale aux marchés actions')
      recommendations.push('Possibilité d\'investir en Private Equity ou produits structurés')
      break
  }

  // Horizon recommendations
  switch (investmentHorizon) {
    case 'COURT':
      recommendations.push('Privilégier la liquidité et les placements court terme')
      recommendations.push('Éviter les produits avec pénalités de sortie')
      break
    case 'MOYEN':
      recommendations.push('Horizon adapté à l\'assurance-vie et au PER')
      recommendations.push('Possibilité de versements programmés')
      break
    case 'LONG':
      recommendations.push('Profiter de l\'effet de capitalisation sur le long terme')
      recommendations.push('Envisager des investissements moins liquides (SCPI, Private Equity)')
      break
  }

  return recommendations
}

/**
 * Obtient le label français d'un profil de risque
 */
export function getRiskProfileLabel(profile: MiFIDRiskProfile): string {
  return MIFID_RISK_PROFILE_LABELS[profile]
}

/**
 * Obtient le label français d'un horizon d'investissement
 */
export function getInvestmentHorizonLabel(horizon: MiFIDInvestmentHorizon): string {
  return MIFID_INVESTMENT_HORIZON_LABELS[horizon]
}
