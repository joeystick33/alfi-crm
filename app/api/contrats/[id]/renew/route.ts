import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ContratService } from '@/lib/services/contrat-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * POST /api/contrats/[id]/renew
 * Renouveler un contrat
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
    const { newEndDate, newPremium, newCoverage } = body

    const service = new ContratService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const contrat = await service.renewContrat(params.id, {
      newEndDate: newEndDate ? new Date(newEndDate) : undefined,
      newPremium,
      newCoverage,
    })

    return createSuccessResponse(contrat)
  } catch (error) {
    console.error('Error in POST /api/contrats/[id]/renew:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Contrat not found', 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
