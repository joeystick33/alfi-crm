import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ProjetService } from '@/lib/services/projet-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * POST /api/projets/[id]/update-progress
 * Mettre à jour la progression d'un projet
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

    const body = await request.json()
    const { progressPercentage, actualBudget } = body

    if (progressPercentage !== undefined && (progressPercentage < 0 || progressPercentage > 100)) {
      return createErrorResponse('Progress percentage must be between 0 and 100', 400)
    }

    const service = new ProjetService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const projet = await service.updateProgress(params.id, progressPercentage)

    return createSuccessResponse(projet)
  } catch (error: any) {
    console.error('Error in POST /api/projets/[id]/update-progress:', error)
    
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
