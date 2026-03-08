 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { RendezVousService } from '@/app/_common/lib/services/rendez-vous-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/rendez-vous/[id]
 * Récupérer un rendez-vous par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: rdvId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new RendezVousService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const rendezvous = await service.getRendezVousById(rdvId)

    if (!rendezvous) {
      return createErrorResponse('Rendez-vous not found', 404)
    }

    return createSuccessResponse(rendezvous)
  } catch (error: any) {
    logger.error('Error in GET /api/rendez-vous/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/rendez-vous/[id]
 * Modifier un rendez-vous
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: rdvId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const { normalizeRendezVousUpdatePayload } = await import('../utils')
    const payload = normalizeRendezVousUpdatePayload(body)

    const service = new RendezVousService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const rendezvous = await service.updateRendezVous(rdvId, payload)

    return createSuccessResponse(rendezvous)
  } catch (error: any) {
    logger.error('Error in PATCH /api/rendez-vous/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Rendez-vous not found', 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/rendez-vous/[id]
 * Annuler un rendez-vous
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: rdvId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new RendezVousService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    await service.cancelRendezVous(rdvId)

    return createSuccessResponse({ message: 'Rendez-vous cancelled successfully' })
  } catch (error: any) {
    logger.error('Error in DELETE /api/rendez-vous/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Rendez-vous not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
