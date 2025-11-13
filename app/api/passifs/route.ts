import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { PassifService } from '@/lib/services/passif-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/passifs
 * Liste des passifs avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    
    const filters = {
      type: searchParams.get('type') as any || undefined,
      clientId: searchParams.get('clientId') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const service = new PassifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const passifs = await service.listPassifs(filters)

    return createSuccessResponse(passifs)
  } catch (error) {
    console.error('Error in GET /api/passifs:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/passifs
 * Créer un nouveau passif
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()

    const service = new PassifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const passif = await service.createPassif(body)

    return createSuccessResponse(passif, 201)
  } catch (error) {
    console.error('Error in POST /api/passifs:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
