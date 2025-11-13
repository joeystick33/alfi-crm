import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { OpportuniteService } from '@/lib/services/opportunite-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * POST /api/opportunites/[id]/convert
 * Convertir une opportunité en projet
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
    const { projectData } = body

    const service = new OpportuniteService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const projet = await service.convertToProjet(params.id, projectData)

    return createSuccessResponse(projet)
  } catch (error) {
    console.error('Error in POST /api/opportunites/[id]/convert:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Opportunité not found', 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
