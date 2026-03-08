import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { ApporteurService } from '@/app/_common/lib/services/apporteur-service'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/apporteurs/stats
 * Récupérer les statistiques globales des apporteurs
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse("Type d'utilisateur invalide", 400)
    }

    const apporteurService = new ApporteurService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const stats = await apporteurService.getApporteursStats()

    return createSuccessResponse(stats)
  } catch (error) {
    logger.error('Erreur GET /api/advisor/apporteurs/stats:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Non autorisé', 401)
    }

    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }

    return createErrorResponse('Erreur lors du chargement des statistiques', 500)
  }
}
