import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ObjectifService } from '@/lib/services/objectif-service'
import { isRegularUser } from '@/lib/auth-types'
import { ObjectifStatus, ObjectifPriority } from '@prisma/client'

/**
 * GET /api/objectifs/[id]
 * Récupère un objectif par ID
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

    const objectif = await objectifService.getObjectifById(params.id)

    if (!objectif) {
      return createErrorResponse('Objectif not found', 404)
    }

    return createSuccessResponse(objectif)
  } catch (error) {
    console.error('Get objectif error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/objectifs/[id]
 * Met à jour un objectif
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()

    const objectifService = new ObjectifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    // Préparer les données de mise à jour
    const updateData: any = {}
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.targetAmount !== undefined) updateData.targetAmount = parseFloat(body.targetAmount)
    if (body.currentAmount !== undefined) updateData.currentAmount = parseFloat(body.currentAmount)
    if (body.targetDate !== undefined) updateData.targetDate = new Date(body.targetDate)
    if (body.priority !== undefined) updateData.priority = body.priority as ObjectifPriority
    if (body.monthlyContribution !== undefined) updateData.monthlyContribution = parseFloat(body.monthlyContribution)
    if (body.status !== undefined) updateData.status = body.status as ObjectifStatus

    const objectif = await objectifService.updateObjectif(params.id, updateData)

    return createSuccessResponse(objectif)
  } catch (error) {
    console.error('Update objectif error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/objectifs/[id]
 * Supprime un objectif
 */
export async function DELETE(
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

    await objectifService.deleteObjectif(params.id)

    return createSuccessResponse({ message: 'Objectif deleted successfully' })
  } catch (error) {
    console.error('Delete objectif error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
