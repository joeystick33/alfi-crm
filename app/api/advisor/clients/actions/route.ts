import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/prisma'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers'
import { isRegularUser } from '@/lib/auth-types'

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
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const cabinetId = user.cabinetId
    const prisma = getPrismaClient(cabinetId, context.isSuperAdmin)

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
  } catch (error: any) {
    console.error('Error fetching commercial actions:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Erreur lors de la récupération des actions', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const userId = user.id
    const cabinetId = user.cabinetId
    const prisma = getPrismaClient(cabinetId, context.isSuperAdmin)

    const body = await request.json()
    const data: any = createActionSchema.parse(body)

    const action = await prisma.commercialAction.create({
      data: {
        ...data,
        cabinetId,
        createdBy: userId,
        status: 'DRAFT',
      },
    })

    return createSuccessResponse(action, 201)
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides', 400)
    }
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    console.error('Error creating commercial action:', error)
    return createErrorResponse('Erreur lors de la création de l\'action', 500)
  }
}
