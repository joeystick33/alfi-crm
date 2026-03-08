/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
const eventCreateSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  allDay: z.boolean().optional().default(false),
  location: z.string().optional(),
  type: z.enum(['MEETING', 'CALL', 'REMINDER', 'APPOINTMENT']).optional().default('MEETING'),
  status: z.enum(['CONFIRMED', 'TENTATIVE', 'CANCELLED']).optional().default('CONFIRMED'),
  clientId: z.string().optional(),
  appointmentTypeId: z.string().optional(),
  videoLink: z.string().url().optional(),
  bookingNotes: z.string().optional(),
})

/**
 * GET /api/advisor/calendar/events
 * Liste les événements du conseiller avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Non autorisé', 403)

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const clientId = searchParams.get('clientId')
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    const where: any = {
      cabinetId: context.cabinetId,
      userId: user.id,
    }

    if (startDate && endDate) {
      where.startDate = { gte: new Date(startDate) }
      where.endDate = { lte: new Date(endDate) }
    } else if (startDate) {
      where.startDate = { gte: new Date(startDate) }
    }

    if (clientId) where.clientId = clientId
    if (type) where.type = type
    if (status) where.status = status

    const events = await prisma.event.findMany({
      where,
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        appointmentType: { select: { id: true, name: true, duration: true, color: true } },
      },
      orderBy: { startDate: 'asc' },
      take: 500,
    })

    return createSuccessResponse({ events, total: events.length })
  } catch (error: any) {
    logger.error('Erreur GET calendar/events:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse(error.message || 'Erreur serveur', 500)
  }
}

/**
 * POST /api/advisor/calendar/events
 * Créer un nouvel événement
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Non autorisé', 403)

    const body = await request.json()
    const data = eventCreateSchema.parse(body)

    // Vérifier conflit de créneau
    const conflict = await prisma.event.findFirst({
      where: {
        userId: user.id,
        status: { not: 'CANCELLED' },
        OR: [
          { startDate: { lt: new Date(data.endDate) }, endDate: { gt: new Date(data.startDate) } },
        ],
      },
    })

    const event = await prisma.event.create({
      data: {
        cabinetId: context.cabinetId,
        userId: user.id,
        title: data.title,
        description: data.description,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        allDay: data.allDay,
        location: data.location,
        type: data.type,
        status: data.status,
        clientId: data.clientId || undefined,
        appointmentTypeId: data.appointmentTypeId || undefined,
        videoLink: data.videoLink,
        bookingNotes: data.bookingNotes,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        appointmentType: { select: { id: true, name: true, duration: true, color: true } },
      },
    })

    return createSuccessResponse({
      event,
      warning: conflict ? 'Attention : un événement existe déjà sur ce créneau.' : undefined,
    })
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return createErrorResponse(`Données invalides : ${error.errors.map((e: any) => e.message).join(', ')}`, 400)
    }
    logger.error('Erreur POST calendar/events:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse(error.message || 'Erreur serveur', 500)
  }
}
