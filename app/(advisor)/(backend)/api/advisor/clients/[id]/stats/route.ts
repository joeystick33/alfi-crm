import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { ClientService } from '@/app/_common/lib/services/client-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/clients/[id]/stats
 * Récupérer les statistiques d'un client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: clientId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new ClientService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const stats = await service.getClientStats(clientId)

    return createSuccessResponse(stats)
  } catch (error) {
    logger.error('Error in GET /api/clients/[id]/stats:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Client not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
