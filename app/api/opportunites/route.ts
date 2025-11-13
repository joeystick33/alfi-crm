import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { OpportuniteService } from '@/lib/services/opportunite-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/opportunites
 * Liste des opportunités avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    
    const filters = {
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      conseillerId: searchParams.get('conseillerId') || undefined,
    }

    const service = new OpportuniteService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const opportunites = await service.getOpportunites(filters)

    return createSuccessResponse(opportunites)
  } catch (error) {
    console.error('Error in GET /api/opportunites:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/opportunites
 * Créer une nouvelle opportunité
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()

    const service = new OpportuniteService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const opportunite = await service.createOpportunite(body)

    return createSuccessResponse(opportunite, 201)
  } catch (error) {
    console.error('Error in POST /api/opportunites:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
