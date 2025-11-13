import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { PassifService } from '@/lib/services/passif-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/passifs/[id]/amortization
 * Récupérer le tableau d'amortissement complet d'un passif
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new PassifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const amortization = await service.getAmortizationSchedule(params.id)

    return createSuccessResponse(amortization)
  } catch (error) {
    console.error('Error in GET /api/passifs/[id]/amortization:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Passif not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
