 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { OpportuniteService } from '@/app/_common/lib/services/opportunite-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { parseOpportuniteFilters, normalizeOpportuniteCreatePayload } from './utils'

/**
 * GET /api/opportunites
 * Liste des opportunités avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse and validate filters
    const { searchParams } = new URL(request.url)
    const filters = parseOpportuniteFilters(searchParams)

    // Instantiate service
    const service = new OpportuniteService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    // Execute query
    const opportunites = await service.getOpportunites(filters)

    // Return formatted response
    return createSuccessResponse(opportunites)
  } catch (error: any) {
    console.error('Error in GET /api/opportunites:', error)
    
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
 * POST /api/opportunites
 * Créer une nouvelle opportunité
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse and validate payload
    const body = await request.json()
    const payload = normalizeOpportuniteCreatePayload(body)

    // Instantiate service
    const service = new OpportuniteService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    // Create entity
    const opportunite = await service.createOpportunite(payload)

    // Return formatted response with 201 status
    return createSuccessResponse(opportunite, 201)
  } catch (error: any) {
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
