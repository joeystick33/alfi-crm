 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { OpportuniteService } from '@/app/_common/lib/services/opportunite-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { normalizeOpportuniteUpdatePayload } from '../utils'

/**
 * GET /api/opportunites/[id]
 * Récupérer une opportunité par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: opportuniteId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new OpportuniteService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const opportunite = await service.getOpportuniteById(opportuniteId)

    if (!opportunite) {
      return createErrorResponse('Opportunité not found', 404)
    }

    return createSuccessResponse(opportunite)
  } catch (error: any) {
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: opportuniteId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse and validate payload
    const body = await request.json()
    const payload = normalizeOpportuniteUpdatePayload(body)

    // Instantiate service
    const service = new OpportuniteService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    // Update entity
    const opportunite = await service.updateOpportunite(opportuniteId, payload)

    // Return formatted response
    return createSuccessResponse(opportunite)
  } catch (error: any) {
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: opportuniteId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Instantiate service
    const service = new OpportuniteService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    // Delete entity
    await service.deleteOpportunite(opportuniteId)

    // Return success response
    return createSuccessResponse({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/opportunites/[id]:', error)
    
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
