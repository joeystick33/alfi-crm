import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { TacheService } from '@/lib/services/tache-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/taches
 * Liste des tâches avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    
    const filters = {
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      assignedToId: searchParams.get('assignedToId') || undefined,
      clientId: searchParams.get('clientId') || undefined,
      projetId: searchParams.get('projetId') || undefined,
    }

    const service = new TacheService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const taches = await service.listTaches(filters)

    return createSuccessResponse(taches)
  } catch (error) {
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
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()

    const service = new TacheService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const tache = await service.createTache(body)

    return createSuccessResponse(tache, 201)
  } catch (error) {
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
