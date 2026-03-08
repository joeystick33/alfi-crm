import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { RendezVousService } from '@/app/_common/lib/services/rendez-vous-service'
import { logger } from '@/app/_common/lib/logger'
const updateInstanceSchema = z.object({
  occurrenceDate: z.string().transform(val => new Date(val)),
  updates: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    startDate: z.string().transform(val => new Date(val)).optional(),
    endDate: z.string().transform(val => new Date(val)).optional(),
    location: z.string().optional(),
    status: z.enum(['PLANIFIE', 'CONFIRME', 'TERMINE', 'ANNULE', 'ABSENT']).optional(),
  }),
  applyToAllFuture: z.boolean().optional().default(false),
})

/**
 * PUT /api/advisor/appointments/recurring/[id]/instance
 * Mettre à jour une occurrence spécifique d'une série récurrente
 * Peut s'appliquer à une seule occurrence ou à toutes les occurrences futures
 */
export async function PUT(
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
    const data = updateInstanceSchema.parse(body)

    // Valider dates si fournies
    if (data.updates.startDate && data.updates.endDate) {
      if (data.updates.endDate <= data.updates.startDate) {
        return createErrorResponse('La date de fin doit être après la date de début', 400)
      }
    }

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

    // Mettre à jour l'instance
    const updated = await service.updateRecurrenceInstance(
      seriesId,
      data.occurrenceDate,
      data.updates,
      data.applyToAllFuture
    )

    return createSuccessResponse({
      appointment: {
        ...updated,
        startTime: updated.startDate,
        endTime: updated.endDate,
      },
      message: data.applyToAllFuture
        ? 'Série récurrente mise à jour à partir de cette occurrence'
        : 'Occurrence mise à jour',
      applyToAllFuture: data.applyToAllFuture,
      occurrenceDate: data.occurrenceDate.toISOString(),
    })
  } catch (error) {
    logger.error('Error updating recurrence instance:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides', 400)
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    if (error.message === 'Rendez-vous récurrent parent non trouvé') {
      return createErrorResponse(error.message, 404)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
