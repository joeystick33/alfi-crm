import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { RendezVousService } from '@/lib/services/rendez-vous-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/rendez-vous/[id]
 * Récupérer un rendez-vous par ID
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

    const service = new RendezVousService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const rendezvous = await service.getRendezVousById(params.id)

    if (!rendezvous) {
      return createErrorResponse('Rendez-vous not found', 404)
    }

    return createSuccessResponse(rendezvous)
  } catch (error: any) {
    console.error('Error in GET /api/rendez-vous/[id]:', error)
    
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
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const { normalizeRendezVousUpdatePayload } = await import('../utils')
    const payload = normalizeRendezVousUpdatePayload(body)

    const service = new RendezVousService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const rendezvous = await service.updateRendezVous(params.id, payload)

    return createSuccessResponse(rendezvous)
  } catch (error: any) {
    console.error('Error in PATCH /api/rendez-vous/[id]:', error)
    
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
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new RendezVousService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    await service.cancelRendezVous(params.id)

    return createSuccessResponse({ message: 'Rendez-vous cancelled successfully' })
  } catch (error: any) {
    console.error('Error in DELETE /api/rendez-vous/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Rendez-vous not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
