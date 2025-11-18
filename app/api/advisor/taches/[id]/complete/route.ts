import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { TacheService } from '@/lib/services/tache-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * POST /api/taches/[id]/complete
 * Marquer une tâche comme terminée
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new TacheService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const tache = await service.completeTache(params.id)

    return createSuccessResponse(tache)
  } catch (error: any) {
    console.error('Error in POST /api/taches/[id]/complete:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Tâche not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
