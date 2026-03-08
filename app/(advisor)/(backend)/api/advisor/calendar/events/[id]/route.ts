/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'

const eventUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  allDay: z.boolean().optional(),
  location: z.string().optional(),
  type: z.enum(['MEETING', 'CALL', 'REMINDER', 'APPOINTMENT']).optional(),
  status: z.enum(['CONFIRMED', 'TENTATIVE', 'CANCELLED']).optional(),
  clientId: z.string().nullable().optional(),
  videoLink: z.string().url().nullable().optional(),
  bookingNotes: z.string().nullable().optional(),
})

/**
 * GET /api/advisor/calendar/events/[id]
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Non autorisé', 403)
    const { id } = await params

    const event = await prisma.event.findFirst({
      where: { id, cabinetId: context.cabinetId, userId: user.id },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
        appointmentType: true,
      },
    })

    if (!event) return createErrorResponse('Événement non trouvé', 404)
    return createSuccessResponse({ event })
  } catch (error: any) {
    return createErrorResponse(error.message || 'Erreur serveur', 500)
  }
}

/**
 * PATCH /api/advisor/calendar/events/[id]
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Non autorisé', 403)
    const { id } = await params

    const existing = await prisma.event.findFirst({
      where: { id, cabinetId: context.cabinetId, userId: user.id },
    })
    if (!existing) return createErrorResponse('Événement non trouvé', 404)

    const body = await request.json()
    const data = eventUpdateSchema.parse(body)

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.description !== undefined) updateData.description = data.description
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate)
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate)
    if (data.allDay !== undefined) updateData.allDay = data.allDay
    if (data.location !== undefined) updateData.location = data.location
    if (data.type !== undefined) updateData.type = data.type
    if (data.status !== undefined) updateData.status = data.status
    if (data.clientId !== undefined) updateData.clientId = data.clientId
    if (data.videoLink !== undefined) updateData.videoLink = data.videoLink
    if (data.bookingNotes !== undefined) updateData.bookingNotes = data.bookingNotes

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        appointmentType: { select: { id: true, name: true, duration: true, color: true } },
      },
    })

    return createSuccessResponse({ event })
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return createErrorResponse(`Données invalides : ${error.errors.map((e: any) => e.message).join(', ')}`, 400)
    }
    return createErrorResponse(error.message || 'Erreur serveur', 500)
  }
}

/**
 * DELETE /api/advisor/calendar/events/[id]
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Non autorisé', 403)
    const { id } = await params

    const existing = await prisma.event.findFirst({
      where: { id, cabinetId: context.cabinetId, userId: user.id },
    })
    if (!existing) return createErrorResponse('Événement non trouvé', 404)

    await prisma.event.delete({ where: { id } })
    return createSuccessResponse({ deleted: true })
  } catch (error: any) {
    return createErrorResponse(error.message || 'Erreur serveur', 500)
  }
}
