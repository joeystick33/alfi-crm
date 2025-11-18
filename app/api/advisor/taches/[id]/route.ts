import { NextRequest } from 'next/server'
import {
  normalizeTacheUpdatePayload,
} from '../utils'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { TacheService } from '@/lib/services/tache-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/taches/[id]
 * Récupérer une tâche par ID
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

    const service = new TacheService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const tache = await service.getTacheById(params.id)

    if (!tache) {
      return createErrorResponse('Tâche not found', 404)
    }

    return createSuccessResponse(tache)
  } catch (error: any) {
    console.error('Error in GET /api/taches/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/taches/[id]
 * Modifier une tâche
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const payload = normalizeTacheUpdatePayload(body)

    const service = new TacheService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const tache = await service.updateTache(params.id, payload)

    return createSuccessResponse(tache)
  } catch (error: any) {
    console.error('Error in PATCH /api/taches/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Tâche not found', 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/taches/[id]
 * Supprimer une tâche
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new TacheService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    await service.deleteTache(params.id)

    return createSuccessResponse({ message: 'Tâche deleted successfully' })
  } catch (error: any) {
    console.error('Error in DELETE /api/taches/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Tâche not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
