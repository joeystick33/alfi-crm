import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ObjectifService } from '@/lib/services/objectif-service'
import { isRegularUser } from '@/lib/auth-types'
import { ObjectifType, ObjectifPriority } from '@prisma/client'

/**
 * GET /api/clients/[id]/objectifs
 * Récupère les objectifs d'un client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const objectifService = new ObjectifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const objectifs = await objectifService.getObjectifs({
      clientId: params.id,
    })

    return createSuccessResponse(objectifs)
  } catch (error: any) {
    console.error('Get objectifs error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/clients/[id]/objectifs
 * Crée un nouvel objectif pour un client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()

    // Validation
    if (!body.type || !body.name || !body.targetAmount || !body.targetDate) {
      return createErrorResponse('Missing required fields', 400)
    }

    const objectifService = new ObjectifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const objectif = await objectifService.createObjectif({
      clientId: params.id,
      type: body.type as ObjectifType,
      name: body.name,
      description: body.description,
      targetAmount: parseFloat(body.targetAmount),
      currentAmount: body.currentAmount ? parseFloat(body.currentAmount) : 0,
      targetDate: new Date(body.targetDate),
      priority: (body.priority as ObjectifPriority) || 'MEDIUM',
      monthlyContribution: body.monthlyContribution ? parseFloat(body.monthlyContribution) : undefined,
    })

    return createSuccessResponse(objectif, 201)
  } catch (error: any) {
    console.error('Create objectif error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
