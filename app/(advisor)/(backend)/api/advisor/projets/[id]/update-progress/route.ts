import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { ProjetService } from '@/app/_common/lib/services/projet-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
/**
 * POST /api/projets/[id]/update-progress
 * Mettre à jour la progression d'un projet
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: projetId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const { progressPercentage, actualBudget } = body

    if (progressPercentage !== undefined && (progressPercentage < 0 || progressPercentage > 100)) {
      return createErrorResponse('Progress percentage must be between 0 and 100', 400)
    }

    const service = new ProjetService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const projet = await service.updateProgress(projetId, progressPercentage)

    return createSuccessResponse(projet)
  } catch (error) {
    logger.error('Error in POST /api/projets/[id]/update-progress:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Projet not found', 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
