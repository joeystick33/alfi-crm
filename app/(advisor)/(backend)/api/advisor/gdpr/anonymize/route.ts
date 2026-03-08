// FILE: app/(advisor)/(backend)/api/advisor/gdpr/anonymize/route.ts

import { NextRequest } from 'next/server'
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { GDPRService } from '@/app/_common/lib/services/gdpr-service'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
const anonymizeSchema = z.object({
  clientId: z.string().min(1, 'clientId requis'),
  confirmPhrase: z.string().refine(
    (v) => v === 'CONFIRMER SUPPRESSION',
    'Vous devez saisir "CONFIRMER SUPPRESSION" pour confirmer l\'anonymisation'
  ),
  reason: z.string().min(10, 'La raison doit faire au moins 10 caractères'),
})

/**
 * POST /api/advisor/gdpr/anonymize
 * 
 * Anonymise les données personnelles d'un client (RGPD Art. 17 — Droit à l'effacement).
 * Requiert une double confirmation et une raison obligatoire.
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { cabinetId, user, isSuperAdmin } = context

    if (!cabinetId && !isSuperAdmin) {
      return createErrorResponse('Missing cabinet context', 400)
    }

    const body = await request.json()
    const parsed = anonymizeSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse(
        parsed.error.issues.map(i => i.message).join(', '),
        400
      )
    }

    const { clientId, reason } = parsed.data

    const service = new GDPRService(cabinetId, user.id)
    const result = await service.anonymizeClient(clientId)

    return createSuccessResponse({
      ...result,
      reason,
      requestedBy: user.id,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    if (error instanceof Error && error.message.includes('non trouvé')) {
      return createErrorResponse(error.message, 404)
    }
    logger.error('[GDPR Anonymize Error]:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Erreur lors de l\'anonymisation', 500)
  }
}
