import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ActifService } from '@/lib/services/actif-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * DELETE /api/actifs/[id]/share/[clientId]
 * Retirer un propriétaire d'un actif partagé
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; clientId: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new ActifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    await service.removeOwner(params.id, params.clientId)

    return createSuccessResponse({ message: 'Owner removed successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/actifs/[id]/share/[clientId]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Actif or client not found', 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
