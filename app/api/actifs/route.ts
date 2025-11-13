import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ActifService } from '@/lib/services/actif-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/actifs
 * Liste les actifs avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    
    const filters = {
      type: searchParams.get('type') as any,
      category: searchParams.get('category') as any,
      isActive: searchParams.get('isActive') === 'true',
      search: searchParams.get('search') || undefined,
      minValue: searchParams.get('minValue') ? parseFloat(searchParams.get('minValue')!) : undefined,
      maxValue: searchParams.get('maxValue') ? parseFloat(searchParams.get('maxValue')!) : undefined,
    }

    const actifService = new ActifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const actifs = await actifService.listActifs(filters)

    return createSuccessResponse(actifs)
  } catch (error) {
    console.error('List actifs error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/actifs
 * Crée un nouvel actif
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()

    const actifService = new ActifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    // Si clientId est fourni, créer et lier directement
    if (body.clientId) {
      const { clientId, ownershipPercentage, ownershipType, ...actifData } = body
      
      const actif = await actifService.createActifForClient(
        clientId,
        actifData,
        ownershipPercentage || 100,
        ownershipType
      )

      return createSuccessResponse(actif, 201)
    }

    // Sinon, créer juste l'actif
    const actif = await actifService.createActif(body)

    return createSuccessResponse(actif, 201)
  } catch (error) {
    console.error('Create actif error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
