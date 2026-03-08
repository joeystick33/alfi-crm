import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { RendezVousService } from '@/app/_common/lib/services/rendez-vous-service'
import { logger } from '@/app/_common/lib/logger'
/**
 * DELETE /api/advisor/appointments/recurring/[id]
 * Supprimer toute une série récurrente (parent + toutes instances modifiées)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: seriesId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new RendezVousService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    // Vérifier que le rendez-vous existe et est récurrent
    const parent = await service.getRendezVousById(seriesId)
    if (!parent) {
      return createErrorResponse('Rendez-vous non trouvé', 404)
    }

    if (!parent.isRecurring) {
      return createErrorResponse('Ce rendez-vous n\'est pas récurrent. Utilisez DELETE /api/advisor/appointments/[id] pour supprimer un rendez-vous simple.', 400)
    }

    // Supprimer la série complète
    await service.deleteRecurrenceSeries(seriesId)

    return createSuccessResponse({
      message: 'Série récurrente supprimée avec succès',
      deletedSeriesId: seriesId,
    })
  } catch (error) {
    logger.error('Error deleting recurrence series:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    if (error.message === 'Rendez-vous récurrent parent non trouvé') {
      return createErrorResponse(error.message, 404)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
