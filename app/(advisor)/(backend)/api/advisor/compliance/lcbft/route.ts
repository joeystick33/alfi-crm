import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { LCBFTScoringService } from '@/app/_common/lib/services/lcbft-scoring-service'

const assessSchema = z.object({
  clientId: z.string().min(1),
})

/**
 * POST /api/advisor/compliance/lcbft
 * Évalue le risque LCB-FT d'un client
 */
export async function POST(request: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(request)
    if (!cabinetId) return createErrorResponse('Cabinet non trouvé', 403)

    const body = await request.json()
    const parsed = assessSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse('Données invalides: ' + parsed.error.issues.map(i => i.message).join(', '), 400)
    }

    const result = await LCBFTScoringService.assessClient({
      clientId: parsed.data.clientId,
      cabinetId,
      assessedBy: user.id,
    })

    return createSuccessResponse(result)
  } catch (error: any) {
    return createErrorResponse(error.message || 'Erreur évaluation LCB-FT', 500)
  }
}

/**
 * GET /api/advisor/compliance/lcbft?clientId=xxx
 * Récupère la dernière évaluation d'un client
 * GET /api/advisor/compliance/lcbft?needsReview=true
 * Liste les clients nécessitant une réévaluation
 */
export async function GET(request: NextRequest) {
  try {
    const { cabinetId } = await requireAuth(request)
    if (!cabinetId) return createErrorResponse('Cabinet non trouvé', 403)

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const needsReview = searchParams.get('needsReview')

    if (needsReview === 'true') {
      const clients = await LCBFTScoringService.getClientsNeedingReview(cabinetId)
      return createSuccessResponse(clients)
    }

    if (clientId) {
      const assessment = await LCBFTScoringService.getLatestAssessment(clientId, cabinetId)
      return createSuccessResponse(assessment)
    }

    return createErrorResponse('Paramètre clientId ou needsReview requis', 400)
  } catch (error: any) {
    return createErrorResponse(error.message || 'Erreur récupération LCB-FT', 500)
  }
}
