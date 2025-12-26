import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { TacheService } from '@/app/_common/lib/services/tache-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'

/**
 * POST /api/taches/[id]/complete
 * Marquer une tâche comme terminée
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: tacheId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new TacheService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const tache = await service.completeTache(tacheId)

    return createSuccessResponse(tache)
  } catch (error) {
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
