 
import { NextRequest } from 'next/server'
import {
  normalizeTacheUpdatePayload,
} from '../utils'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { TacheService } from '@/app/_common/lib/services/tache-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/taches/[id]
 * Récupérer une tâche par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: tacheId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new TacheService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const tache = await service.getTacheById(tacheId)

    if (!tache) {
      return createErrorResponse('Tâche not found', 404)
    }

    return createSuccessResponse(tache)
  } catch (error: any) {
    logger.error('Error in GET /api/taches/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: tacheId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const payload = normalizeTacheUpdatePayload(body)

    const service = new TacheService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const tache = await service.updateTache(tacheId, payload)

    return createSuccessResponse(tache)
  } catch (error: any) {
    logger.error('Error in PATCH /api/taches/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: tacheId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new TacheService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    await service.deleteTache(tacheId)

    return createSuccessResponse({ message: 'Tâche deleted successfully' })
  } catch (error: any) {
    logger.error('Error in DELETE /api/taches/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Tâche not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
