/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/calendar/slots?date=2026-03-15&appointmentTypeId=xxx
 * Retourne les créneaux disponibles pour une date donnée
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Non autorisé', 403)

    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    const appointmentTypeId = searchParams.get('appointmentTypeId')

    if (!dateStr) return createErrorResponse('Paramètre date requis (YYYY-MM-DD)', 400)

    const targetDate = new Date(dateStr)
    const dayOfWeek = targetDate.getDay() // 0=Dimanche

    // 1. Récupérer les disponibilités pour ce jour
    const availabilities = await prisma.availability.findMany({
      where: { userId: user.id, dayOfWeek, isActive: true },
      orderBy: { startTime: 'asc' },
    })

    if (availabilities.length === 0) {
      return createSuccessResponse({ slots: [], message: 'Aucune disponibilité ce jour' })
    }

    // 2. Récupérer le type de RDV pour la durée
    let duration = 60 // Par défaut 1h
    let bufferAfter = 15
    if (appointmentTypeId) {
      const aptType = await prisma.appointmentType.findUnique({ where: { id: appointmentTypeId } })
      if (aptType) {
        duration = aptType.duration
        bufferAfter = aptType.bufferAfter
      }
    }

    // 3. Récupérer les événements existants ce jour
    const dayStart = new Date(targetDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(targetDate)
    dayEnd.setHours(23, 59, 59, 999)

    const existingEvents = await prisma.event.findMany({
      where: {
        userId: user.id,
        status: { not: 'CANCELLED' },
        startDate: { gte: dayStart },
        endDate: { lte: dayEnd },
      },
      select: { startDate: true, endDate: true },
    })

    // 4. Vérifier les créneaux bloqués
    const blockedSlots = await prisma.blockedSlot.findMany({
      where: {
        userId: user.id,
        startDate: { lte: dayEnd },
        endDate: { gte: dayStart },
      },
    })

    const isDayBlocked = blockedSlots.length > 0

    if (isDayBlocked) {
      return createSuccessResponse({ slots: [], message: 'Journée bloquée (indisponibilité)' })
    }

    // 5. Calculer les créneaux disponibles
    const slots: Array<{ start: string; end: string; available: boolean }> = []

    for (const avail of availabilities) {
      const [startH, startM] = avail.startTime.split(':').map(Number)
      const [endH, endM] = avail.endTime.split(':').map(Number)

      let currentMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM

      while (currentMinutes + duration <= endMinutes) {
        const slotStart = new Date(targetDate)
        slotStart.setHours(Math.floor(currentMinutes / 60), currentMinutes % 60, 0, 0)

        const slotEnd = new Date(targetDate)
        slotEnd.setHours(Math.floor((currentMinutes + duration) / 60), (currentMinutes + duration) % 60, 0, 0)

        // Vérifier si le créneau est libre
        const isOccupied = existingEvents.some(evt => {
          const evtStart = new Date(evt.startDate).getTime()
          const evtEnd = new Date(evt.endDate).getTime()
          return slotStart.getTime() < evtEnd && slotEnd.getTime() > evtStart
        })

        // Ne pas proposer de créneaux dans le passé
        const isInPast = slotStart.getTime() < Date.now()

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: !isOccupied && !isInPast,
        })

        currentMinutes += duration + bufferAfter
      }
    }

    return createSuccessResponse({
      date: dateStr,
      duration,
      slots: slots.filter(s => s.available),
      allSlots: slots,
    })
  } catch (error: any) {
    logger.error('Erreur GET calendar/slots:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse(error.message || 'Erreur serveur', 500)
  }
}
