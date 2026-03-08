import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { RendezVousService } from '@/app/_common/lib/services/rendez-vous-service'
import { logger } from '@/app/_common/lib/logger'
const expandQuerySchema = z.object({
  viewStart: z.string().transform(val => new Date(val)),
  viewEnd: z.string().transform(val => new Date(val)),
})

/**
 * GET /api/advisor/appointments/recurring/[id]/expand?viewStart=...&viewEnd=...
 * Expand les occurrences d'un rendez-vous récurrent pour une plage de dates
 * Utilisé par le calendrier pour afficher toutes les instances
 */
export async function GET(
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

    const { searchParams } = new URL(request.url)
    const queryData = expandQuerySchema.parse({
      viewStart: searchParams.get('viewStart'),
      viewEnd: searchParams.get('viewEnd'),
    })

    const service = new RendezVousService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    // Vérifier que le rendez-vous parent existe et est récurrent
    const parent = await service.getRendezVousById(seriesId)
    if (!parent) {
      return createErrorResponse('Rendez-vous non trouvé', 404)
    }

    if (!parent.isRecurring) {
      return createErrorResponse('Ce rendez-vous n\'est pas récurrent', 400)
    }

    // Expand les occurrences
    const instances = await service.expandRecurrenceForView(
      seriesId,
      queryData.viewStart,
      queryData.viewEnd
    )

    return createSuccessResponse({
      parentId: seriesId,
      viewStart: queryData.viewStart.toISOString(),
      viewEnd: queryData.viewEnd.toISOString(),
      instances: instances.map(inst => ({
        id: inst.id,
        parentId: inst.parentId,
        title: inst.title,
        description: inst.description,
        startTime: inst.startDate,
        endTime: inst.endDate,
        type: inst.type,
        status: inst.status,
        isRecurringInstance: true,
        recurrenceOccurrenceDate: inst.recurrenceOccurrenceDate,
      })),
      count: instances.length,
    })
  } catch (error) {
    logger.error('Error expanding recurrence:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof z.ZodError) {
      return createErrorResponse('Paramètres invalides: viewStart et viewEnd requis au format ISO', 400)
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
