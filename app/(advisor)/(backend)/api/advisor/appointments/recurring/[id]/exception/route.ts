import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { RendezVousService } from '@/app/_common/lib/services/rendez-vous-service'
import { logger } from '@/app/_common/lib/logger'
const exceptionSchema = z.object({
  occurrenceDate: z.string().transform(val => new Date(val)),
})

/**
 * POST /api/advisor/appointments/recurring/[id]/exception
 * Ajouter une exception (supprimer une occurrence d'une série récurrente)
 */
export async function POST(
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

    const body = await request.json()
    const data = exceptionSchema.parse(body)

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

    // Ajouter l'exception
    const updated = await service.addRecurrenceException(
      seriesId,
      data.occurrenceDate
    )

    return createSuccessResponse({
      parentAppointment: {
        ...updated,
        startTime: updated.startDate,
        endTime: updated.endDate,
      },
      message: 'Occurrence supprimée de la série récurrente',
      exceptionDate: data.occurrenceDate.toISOString(),
    })
  } catch (error) {
    logger.error('Error adding recurrence exception:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides', 400)
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    if (error instanceof Error && error.message === 'Rendez-vous récurrent parent non trouvé') {
      return createErrorResponse(error.message, 404)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
