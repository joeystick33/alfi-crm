
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { RendezVousService } from '@/app/_common/lib/services/rendez-vous-service'
import { logger } from '@/app/_common/lib/logger'
const rescheduleSchema = z.object({
  newStartDate: z.string().transform(val => new Date(val)),
  newEndDate: z.string().transform(val => new Date(val)),
  notifyParticipants: z.boolean().optional().default(true),
})

/**
 * POST /api/advisor/appointments/[id]/reschedule
 * Replanifier un rendez-vous avec détection de conflits
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: appointmentId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const data = rescheduleSchema.parse(body)

    // Valider que newEndDate > newStartDate
    if (data.newEndDate <= data.newStartDate) {
      return createErrorResponse('La date de fin doit être après la date de début', 400)
    }

    const service = new RendezVousService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    // Vérifier que le rendez-vous existe
    const existing = await service.getRendezVousById(appointmentId)
    if (!existing) {
      return createErrorResponse('Rendez-vous non trouvé', 404)
    }

    try {
      const rescheduled = await service.rescheduleRendezVous(
        appointmentId,
        data.newStartDate,
        data.newEndDate,
        data.notifyParticipants
      )

      return createSuccessResponse({
        appointment: {
          ...rescheduled,
          startTime: rescheduled.startDate,
          endTime: rescheduled.endDate,
        },
        message: 'Rendez-vous replanifié avec succès',
        previousStart: existing.startDate,
        newStart: data.newStartDate,
        rescheduledCount: rescheduled.rescheduledCount,
      })
    } catch (serviceError: any) {
      if (serviceError.message === 'Time slot conflict detected') {
        // Proposer des créneaux alternatifs
        const durationMs = data.newEndDate.getTime() - data.newStartDate.getTime()
        const durationMinutes = Math.floor(durationMs / 60000)

        const availableSlots = await service.findAvailableSlots(
          data.newStartDate,
          durationMinutes,
          (existing.conseiller as { id: string })?.id || user.id,
          appointmentId
        )

        return new Response(
          JSON.stringify({
            success: false,
            error: 'Conflit de rendez-vous détecté sur ce créneau',
            conflictDetails: serviceError.message,
            suggestedSlots: availableSlots.slice(0, 5).map(slot => ({
              start: slot.start.toISOString(),
              end: slot.end.toISOString(),
            })),
          }),
          {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      if (serviceError.message === 'Impossible de replanifier dans le passé') {
        return createErrorResponse(serviceError.message, 400)
      }

      throw serviceError
    }
  } catch (error: any) {
    logger.error('Error rescheduling appointment:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides: ' + error.message, 400)
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
