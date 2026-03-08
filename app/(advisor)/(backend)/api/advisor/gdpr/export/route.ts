// FILE: app/(advisor)/(backend)/api/advisor/gdpr/export/route.ts

import { NextRequest } from 'next/server'
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { GDPRService } from '@/app/_common/lib/services/gdpr-service'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/gdpr/export?clientId=xxx
 * 
 * Exporte les données personnelles d'un client (RGPD Art. 20 — Droit à la portabilité).
 * Retourne un JSON structuré avec toutes les données du client.
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { cabinetId, user, isSuperAdmin } = context

    if (!cabinetId && !isSuperAdmin) {
      return createErrorResponse('Missing cabinet context', 400)
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')

    if (!clientId) {
      return createErrorResponse('clientId requis', 400)
    }

    const service = new GDPRService(cabinetId, user.id)
    const result = await service.exportClientData(clientId)

    return createSuccessResponse(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    if (error instanceof Error && error.message.includes('non trouvé')) {
      return createErrorResponse(error.message, 404)
    }
    logger.error('[GDPR Export Error]:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Erreur lors de l\'export des données', 500)
  }
}
