import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { OpportuniteService } from '@/app/_common/lib/services/opportunite-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'

/**
 * GET /api/opportunites/pipeline
 * Vue pipeline commercial (opportunités groupées par statut)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new OpportuniteService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const pipeline = await service.getPipeline()

    return createSuccessResponse(pipeline)
  } catch (error) {
    console.error('Error in GET /api/opportunites/pipeline:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
