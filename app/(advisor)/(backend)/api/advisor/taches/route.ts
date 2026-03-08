 
import { NextRequest } from 'next/server'
import {
  parseTacheFilters,
  normalizeTacheCreatePayload,
} from './utils'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { TacheService } from '@/app/_common/lib/services/tache-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/taches
 * Liste des tâches avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const filters = parseTacheFilters(searchParams)

    const service = new TacheService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const taches = await service.getTaches(filters)

    return createSuccessResponse(taches)
  } catch (error: any) {
    logger.error('Error in GET /api/taches:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/taches
 * Créer une nouvelle tâche
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const rawBody = (body && typeof body === 'object') ? (body as Record<string, unknown>) : {}
    if (!rawBody.assignedToId) {
      rawBody.assignedToId = user.id
    }
    const payload = normalizeTacheCreatePayload(rawBody)

    const service = new TacheService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const tache = await service.createTache(payload)

    return createSuccessResponse(tache, 201)
  } catch (error: any) {
    logger.error('Error in POST /api/taches:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
