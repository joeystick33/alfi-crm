import { NextRequest } from 'next/server'
import {
  parseTacheFilters,
  normalizeTacheCreatePayload,
} from './utils'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers'
import { TacheService } from '@/lib/services/tache-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/taches
 * Liste des tâches avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const filters = parseTacheFilters(searchParams)

    const service = new TacheService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const taches = await service.getTaches(filters)

    return createSuccessResponse(taches)
  } catch (error: any) {
    console.error('Error in GET /api/taches:', error)
    
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
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const payload = normalizeTacheCreatePayload(body)

    const service = new TacheService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const tache = await service.createTache(payload)

    return createSuccessResponse(tache, 201)
  } catch (error: any) {
    console.error('Error in POST /api/taches:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
