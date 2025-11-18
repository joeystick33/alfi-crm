import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ObjectifService } from '@/lib/services/objectif-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * POST /api/objectifs/[id]/update-progress
 * Mettre à jour la progression d'un objectif
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
    const { currentAmount } = body

    if (currentAmount === undefined || currentAmount < 0) {
      return createErrorResponse('Invalid current amount', 400)
    }

    const service = new ObjectifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const objectif = await service.updateProgress(params.id, currentAmount)

    return createSuccessResponse(objectif)
  } catch (error: any) {
    console.error('Error in POST /api/objectifs/[id]/update-progress:', error)
    
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
