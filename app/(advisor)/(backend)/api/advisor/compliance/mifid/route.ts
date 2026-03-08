import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { mifidService } from '@/app/_common/lib/services/mifid-service'

const questionnaireSchema = z.object({
  clientId: z.string().min(1),
  answers: z.object({
    q1_financialEducation: z.enum(['NONE', 'BASIC', 'PROFESSIONAL', 'EXPERT']),
    q2_investmentKnowledge: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
    q3_marketUnderstanding: z.boolean(),
    q4_riskUnderstanding: z.boolean(),
    q5_yearsInvesting: z.number().min(0),
    q6_frequencyTrading: z.enum(['NEVER', 'RARELY', 'OCCASIONALLY', 'REGULARLY']),
    q7_productTypes: z.array(z.string()),
    q8_largestInvestment: z.number().min(0),
    q9_annualIncome: z.number().min(0),
    q10_liquidAssets: z.number().min(0),
    q11_totalWealth: z.number().min(0),
    q12_monthlyExpenses: z.number().min(0),
    q13_debts: z.number().min(0),
    q14_incomeSource: z.string(),
    q15_primaryGoal: z.enum(['CAPITAL_PRESERVATION', 'INCOME', 'GROWTH', 'SPECULATION']),
    q16_investmentHorizon: z.enum(['COURT', 'MOYENNE', 'LONG', 'VERY_LONG']),
    q17_maxLoss: z.number().min(0).max(100),
    q18_reactionToLoss: z.enum(['SELL', 'HOLD', 'BUY_MORE']),
    q19_esgPreference: z.boolean(),
    q20_liquidityNeeds: z.enum(['HAUTE', 'MOYENNE', 'BASSE']),
  }),
})

/**
 * POST /api/advisor/compliance/mifid
 * Soumet un questionnaire MiFID II et persiste le résultat
 */
export async function POST(request: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(request)
    if (!cabinetId) return createErrorResponse('Cabinet non trouvé', 403)

    const body = await request.json()
    const parsed = questionnaireSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse('Données invalides: ' + parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '), 400)
    }

    const result = await mifidService.saveQuestionnaire({
      cabinetId,
      clientId: parsed.data.clientId,
      validatedBy: user.id,
      answers: parsed.data.answers as any,
    })

    return createSuccessResponse(result)
  } catch (error: any) {
    return createErrorResponse(error.message || 'Erreur questionnaire MiFID', 500)
  }
}

/**
 * GET /api/advisor/compliance/mifid?clientId=xxx
 * Récupère le dernier questionnaire MiFID + vérifie renouvellement
 * GET /api/advisor/compliance/mifid?clientId=xxx&history=true
 * Historique complet des questionnaires
 */
export async function GET(request: NextRequest) {
  try {
    const { cabinetId } = await requireAuth(request)
    if (!cabinetId) return createErrorResponse('Cabinet non trouvé', 403)

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const history = searchParams.get('history')

    if (!clientId) {
      return createErrorResponse('Paramètre clientId requis', 400)
    }

    if (history === 'true') {
      const questionnaires = await mifidService.getHistory(clientId, cabinetId)
      return createSuccessResponse(questionnaires)
    }

    const latest = await mifidService.getLatestQuestionnaire(clientId, cabinetId)
    const needsRenewal = await mifidService.needsRenewal(clientId, cabinetId)

    return createSuccessResponse({ questionnaire: latest, needsRenewal })
  } catch (error: any) {
    return createErrorResponse(error.message || 'Erreur récupération MiFID', 500)
  }
}
