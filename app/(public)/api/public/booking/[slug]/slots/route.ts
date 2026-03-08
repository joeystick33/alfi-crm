/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * GET /api/public/booking/[slug]/slots?date=2026-03-15&appointmentTypeId=xxx
 * Retourne les créneaux disponibles pour une date donnée (accès public)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date')
    const appointmentTypeId = searchParams.get('appointmentTypeId')

    if (!dateStr) return Response.json({ error: 'Paramètre date requis' }, { status: 400 })

    const cabinet = await prisma.cabinet.findUnique({ where: { slug }, select: { id: true } })
    if (!cabinet) return Response.json({ error: 'Cabinet non trouvé' }, { status: 404 })

    // Récupérer le type de RDV
    let duration = 60
    let bufferAfter = 15
    let advisorId: string | null = null

    if (appointmentTypeId) {
      const aptType = await prisma.appointmentType.findFirst({
        where: { id: appointmentTypeId, cabinetId: cabinet.id, isActive: true, isPublic: true },
      })
      if (aptType) {
        duration = aptType.duration
        bufferAfter = aptType.bufferAfter
        advisorId = aptType.userId
      }
    }

    // Si pas d'advisorId, prendre le premier conseiller actif
    if (!advisorId) {
      const advisor = await prisma.user.findFirst({
        where: { cabinetId: cabinet.id, isActive: true, role: 'ADVISOR' },
        select: { id: true },
      })
      if (!advisor) return Response.json({ data: { slots: [] } })
      advisorId = advisor.id
    }

    const targetDate = new Date(dateStr)
    const dayOfWeek = targetDate.getDay()

    // Disponibilités pour ce jour
    const availabilities = await prisma.availability.findMany({
      where: { userId: advisorId, dayOfWeek, isActive: true },
      orderBy: { startTime: 'asc' },
    })

    if (availabilities.length === 0) {
      return Response.json({ data: { slots: [], message: 'Aucune disponibilité ce jour' } })
    }

    // Événements existants ce jour
    const dayStart = new Date(targetDate)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(targetDate)
    dayEnd.setHours(23, 59, 59, 999)

    const existingEvents = await prisma.event.findMany({
      where: {
        userId: advisorId,
        status: { not: 'CANCELLED' },
        startDate: { gte: dayStart },
        endDate: { lte: dayEnd },
      },
      select: { startDate: true, endDate: true },
    })

    // Créneaux bloqués
    const blockedSlots = await prisma.blockedSlot.findMany({
      where: {
        userId: advisorId,
        startDate: { lte: dayEnd },
        endDate: { gte: dayStart },
      },
    })

    if (blockedSlots.length > 0) {
      return Response.json({ data: { slots: [], message: 'Journée indisponible' } })
    }

    // Calculer les créneaux
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

        const isOccupied = existingEvents.some(evt => {
          const evtStart = new Date(evt.startDate).getTime()
          const evtEnd = new Date(evt.endDate).getTime()
          return slotStart.getTime() < evtEnd && slotEnd.getTime() > evtStart
        })

        const isInPast = slotStart.getTime() < Date.now()

        if (!isOccupied && !isInPast) {
          slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString(), available: true })
        }

        currentMinutes += duration + bufferAfter
      }
    }

    return Response.json({ data: { date: dateStr, duration, slots } })
  } catch (error: any) {
    console.error('Erreur GET public/booking/slots:', error)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
