import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse, checkPermission } from '@/lib/supabase/auth-helpers'
import { OpportuniteService } from '@/lib/services/opportunite-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * POST /api/opportunites/[id]/convert
 * Convert an opportunité to a projet
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Check permission for converting opportunités
    if (!checkPermission(context, 'canConvertOpportunities')) {
      return createErrorResponse('Permission denied: canConvertOpportunities', 403)
    }

    // Parse request body to get projetId
    const body = await request.json()
    const projetId = body.projetId

    if (!projetId || typeof projetId !== 'string') {
      return createErrorResponse('Missing or invalid projetId', 400)
    }

    // Instantiate service
    const service = new OpportuniteService(
      user.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    // Convert opportunité to projet
    const opportunite = await service.convertToProjet(params.id, projetId)

    // Return formatted response
    return createSuccessResponse(opportunite)
  } catch (error: any) {
    console.error('Error in POST /api/opportunites/[id]/convert:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse(error.message, 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
