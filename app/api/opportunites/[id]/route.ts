import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { OpportuniteService } from '@/lib/services/opportunite-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/opportunites/[id]
 * Récupérer une opportunité par ID
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

    const service = new OpportuniteService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const opportunite = await service.getOpportuniteById(params.id)

    if (!opportunite) {
      return createErrorResponse('Opportunité not found', 404)
    }

    return createSuccessResponse(opportunite)
  } catch (error) {
    console.error('Error in GET /api/opportunites/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/opportunites/[id]
 * Modifier une opportunité
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

    const service = new OpportuniteService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const opportunite = await service.updateOpportunite(params.id, body)

    return createSuccessResponse(opportunite)
  } catch (error) {
    console.error('Error in PATCH /api/opportunites/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Opportunité not found', 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/opportunites/[id]
 * Supprimer une opportunité
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

    const service = new OpportuniteService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    await service.deleteOpportunite(params.id)

    return createSuccessResponse({ message: 'Opportunité deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/opportunites/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Opportunité not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
