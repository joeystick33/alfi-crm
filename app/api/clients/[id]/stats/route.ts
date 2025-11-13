import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ClientService } from '@/lib/services/client-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/clients/[id]/stats
 * Récupérer les statistiques d'un client
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

    const service = new ClientService(
      context.cabinetId,
      context.user.id,
      context.user.role,
      context.isSuperAdmin
    )

    const stats = await service.getClientStats(params.id)

    return createSuccessResponse(stats)
  } catch (error) {
    console.error('Error in GET /api/clients/[id]/stats:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Client not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
