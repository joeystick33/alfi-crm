import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ActifService } from '@/lib/services/actif-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * POST /api/actifs/[id]/share
 * Partage un actif avec un autre client (indivision)
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
    const { clientId, ownershipPercentage, ownershipType } = body

    if (!clientId || !ownershipPercentage) {
      return createErrorResponse('clientId and ownershipPercentage are required', 400)
    }

    const actifService = new ActifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const result = await actifService.shareActif({
      actifId: params.id,
      clientId,
      ownershipPercentage,
      ownershipType,
    })

    return createSuccessResponse({
      ...result,
      message: 'Actif shared successfully',
    })
  } catch (error) {
    console.error('Share actif error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      if (error.message.includes('exceed 100%')) {
        return createErrorResponse(error.message, 400)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * GET /api/actifs/[id]/share
 * Récupère les propriétaires d'un actif
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

    const actifService = new ActifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const owners = await actifService.getActifOwners(params.id)

    return createSuccessResponse(owners)
  } catch (error) {
    console.error('Get actif owners error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
