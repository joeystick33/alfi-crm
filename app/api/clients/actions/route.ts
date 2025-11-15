import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'

const createActionSchema = z.object({
  title: z.string().min(1),
  objective: z.string().optional(),
  segmentKey: z.string().optional(),
  segmentLabel: z.string().optional(),
  channels: z.array(z.string()).optional(),
  scheduledAt: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const cabinetId = context.cabinetId

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = { cabinetId }
    if (status) {
      where.status = status
    }

    const actions = await prisma.commercialAction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return createSuccessResponse(actions)
  } catch (error) {
    console.error('Error fetching commercial actions:', error)
    return createErrorResponse('Erreur lors de la récupération des actions', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const userId = context.user.id
    const cabinetId = context.cabinetId

    const body = await request.json()
    const data = createActionSchema.parse(body)

    const action = await prisma.commercialAction.create({
      data: {
        ...data,
        cabinetId,
        createdBy: userId,
        status: 'DRAFT',
      },
    })

    return createSuccessResponse(action, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides', 400)
    }
    console.error('Error creating commercial action:', error)
    return createErrorResponse('Erreur lors de la création de l\'action', 500)
  }
}
