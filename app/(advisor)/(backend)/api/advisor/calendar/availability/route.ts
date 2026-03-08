/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'

const availabilitySchema = z.object({
  slots: z.array(z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    isActive: z.boolean().optional().default(true),
  })),
})

const blockedSlotSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
  allDay: z.boolean().optional().default(true),
})

/**
 * GET /api/advisor/calendar/availability
 * Retourne les disponibilités hebdomadaires + les créneaux bloqués
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Non autorisé', 403)

    const [availabilities, blockedSlots] = await Promise.all([
      prisma.availability.findMany({
        where: { userId: user.id },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      }),
      prisma.blockedSlot.findMany({
        where: { userId: user.id, endDate: { gte: new Date() } },
        orderBy: { startDate: 'asc' },
      }),
    ])

    return createSuccessResponse({ availabilities, blockedSlots })
  } catch (error: any) {
    return createErrorResponse(error.message || 'Erreur serveur', 500)
  }
}

/**
 * PUT /api/advisor/calendar/availability
 * Met à jour les disponibilités hebdomadaires (remplacement complet)
 */
export async function PUT(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Non autorisé', 403)

    const body = await request.json()
    const data = availabilitySchema.parse(body)

    // Supprimer les anciennes disponibilités
    await prisma.availability.deleteMany({ where: { userId: user.id } })

    // Créer les nouvelles
    const created = await prisma.availability.createMany({
      data: data.slots.map(s => ({
        userId: user.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        isActive: s.isActive,
      })),
    })

    const availabilities = await prisma.availability.findMany({
      where: { userId: user.id },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    })

    return createSuccessResponse({ availabilities, count: created.count })
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return createErrorResponse(`Données invalides : ${error.errors.map((e: any) => e.message).join(', ')}`, 400)
    }
    return createErrorResponse(error.message || 'Erreur serveur', 500)
  }
}

/**
 * POST /api/advisor/calendar/availability
 * Ajouter un créneau bloqué (vacances, formation, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Non autorisé', 403)

    const body = await request.json()
    const data = blockedSlotSchema.parse(body)

    const blocked = await prisma.blockedSlot.create({
      data: {
        userId: user.id,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        reason: data.reason,
        allDay: data.allDay,
      },
    })

    return createSuccessResponse({ blockedSlot: blocked })
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return createErrorResponse(`Données invalides : ${error.errors.map((e: any) => e.message).join(', ')}`, 400)
    }
    return createErrorResponse(error.message || 'Erreur serveur', 500)
  }
}
