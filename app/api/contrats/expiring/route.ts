import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ContratService } from '@/lib/services/contrat-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/contrats/expiring
 * Récupérer les contrats arrivant à échéance
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const daysAhead = searchParams.get('daysAhead') 
      ? parseInt(searchParams.get('daysAhead')!) 
      : 90 // Par défaut 90 jours

    const service = new ContratService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const contrats = await service.getExpiringContrats(daysAhead)

    return createSuccessResponse(contrats)
  } catch (error) {
    console.error('Error in GET /api/contrats/expiring:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
