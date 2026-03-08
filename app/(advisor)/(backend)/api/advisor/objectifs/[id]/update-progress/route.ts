import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { ObjectifService } from '@/app/_common/lib/services/objectif-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
/**
 * POST /api/objectifs/[id]/update-progress
 * Mettre à jour la progression d'un objectif
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: objectifId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const { currentAmount } = body

    if (currentAmount === undefined || currentAmount < 0) {
      return createErrorResponse('Invalid current amount', 400)
    }

    const service = new ObjectifService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const objectif = await service.updateProgress(objectifId, currentAmount)

    return createSuccessResponse(objectif)
  } catch (error) {
    logger.error('Error in POST /api/objectifs/[id]/update-progress:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Objectif not found', 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
