import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers'
import { OpportuniteService } from '@/lib/services/opportunite-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/opportunites/pipeline
 * Vue pipeline commercial (opportunités groupées par statut)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new OpportuniteService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const pipeline = await service.getPipeline()

    return createSuccessResponse(pipeline)
  } catch (error: any) {
    console.error('Error in GET /api/opportunites/pipeline:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
