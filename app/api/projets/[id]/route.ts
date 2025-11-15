import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ProjetService } from '@/lib/services/projet-service'
import { isRegularUser } from '@/lib/auth-types'
import { ProjetStatus } from '@prisma/client'

/**
 * GET /api/projets/[id]
 * Récupère un projet par ID
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

    const { searchParams } = new URL(request.url)
    const includeRelations = searchParams.get('include') === 'true'

    const projetService = new ProjetService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const projet = await projetService.getProjetById(params.id, includeRelations)

    if (!projet) {
      return createErrorResponse('Projet not found', 404)
    }

    return createSuccessResponse(projet)
  } catch (error) {
    console.error('Get projet error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/projets/[id]
 * Met à jour un projet
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

    const projetService = new ProjetService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    // Préparer les données de mise à jour
    const updateData: any = {}
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.estimatedBudget !== undefined) updateData.estimatedBudget = parseFloat(body.estimatedBudget)
    if (body.actualBudget !== undefined) updateData.actualBudget = parseFloat(body.actualBudget)
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate)
    if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate)
    if (body.targetDate !== undefined) updateData.targetDate = new Date(body.targetDate)
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.status !== undefined) updateData.status = body.status as ProjetStatus
    if (body.progress !== undefined) updateData.progress = parseInt(body.progress)

    const projet = await projetService.updateProjet(params.id, updateData)

    return createSuccessResponse(projet)
  } catch (error) {
    console.error('Update projet error:', error)
    
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
 * DELETE /api/projets/[id]
 * Supprime un projet
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

    const projetService = new ProjetService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    await projetService.deleteProjet(params.id)

    return createSuccessResponse({ message: 'Projet deleted successfully' })
  } catch (error) {
    console.error('Delete projet error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
