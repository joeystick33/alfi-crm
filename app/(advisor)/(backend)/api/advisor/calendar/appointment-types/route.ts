/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'

const appointmentTypeSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  duration: z.number().min(15).max(480),
  color: z.string().optional().default('#2B7A78'),
  location: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  isPublic: z.boolean().optional().default(true),
  price: z.number().min(0).optional(),
  requiresApproval: z.boolean().optional().default(false),
  bufferBefore: z.number().min(0).optional().default(0),
  bufferAfter: z.number().min(0).optional().default(15),
  maxPerDay: z.number().min(1).optional().default(8),
})

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * GET /api/advisor/calendar/appointment-types
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Non autorisé', 403)

    const types = await prisma.appointmentType.findMany({
      where: { cabinetId: context.cabinetId, userId: user.id },
      orderBy: { name: 'asc' },
      include: { _count: { select: { events: true } } },
    })

    return createSuccessResponse({ appointmentTypes: types })
  } catch (error: any) {
    return createErrorResponse(error.message || 'Erreur serveur', 500)
  }
}

/**
 * POST /api/advisor/calendar/appointment-types
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Non autorisé', 403)

    const body = await request.json()
    const data = appointmentTypeSchema.parse(body)

    let slug = slugify(data.name)
    // Ensure uniqueness
    const existing = await prisma.appointmentType.findUnique({ where: { userId_slug: { userId: user.id, slug } } })
    if (existing) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

    const type = await prisma.appointmentType.create({
      data: {
        cabinetId: context.cabinetId,
        userId: user.id,
        name: data.name,
        slug,
        description: data.description,
        duration: data.duration,
        color: data.color,
        location: data.location,
        isActive: data.isActive,
        isPublic: data.isPublic,
        price: data.price,
        requiresApproval: data.requiresApproval,
        bufferBefore: data.bufferBefore,
        bufferAfter: data.bufferAfter,
        maxPerDay: data.maxPerDay,
      },
    })

    return createSuccessResponse({ appointmentType: type })
  } catch (error: any) {
    if (error?.name === 'ZodError') {
      return createErrorResponse(`Données invalides : ${error.errors.map((e: any) => e.message).join(', ')}`, 400)
    }
    return createErrorResponse(error.message || 'Erreur serveur', 500)
  }
}
