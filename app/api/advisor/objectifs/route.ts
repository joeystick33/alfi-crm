import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ObjectifService } from '@/lib/services/objectif-service'
import { isRegularUser } from '@/lib/auth-types'
import { parseObjectifFilters } from './utils'

/**
 * GET /api/objectifs
 * Liste des objectifs avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse and validate filters
    const { searchParams } = new URL(request.url)
    const filters = parseObjectifFilters(searchParams)

    const service = new ObjectifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const objectifs = await service.getObjectifs(filters)

    return createSuccessResponse(objectifs)
  } catch (error: any) {
    console.error('Error in GET /api/objectifs:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/objectifs
 * Créer un nouvel objectif
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse and validate payload
    const body = await request.json()
    const { normalizeObjectifCreatePayload } = await import('./utils')
    const payload = normalizeObjectifCreatePayload(body)

    const service = new ObjectifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const objectif = await service.createObjectif(payload)

    return createSuccessResponse(objectif, 201)
  } catch (error: any) {
    console.error('Error in POST /api/objectifs:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
