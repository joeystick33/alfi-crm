import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ActifService } from '@/lib/services/actif-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/actifs/[id]
 * Récupérer un actif par ID
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

    const service = new ActifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const actif = await service.getActifById(params.id)

    if (!actif) {
      return createErrorResponse('Actif not found', 404)
    }

    return createSuccessResponse(actif)
  } catch (error) {
    console.error('Error in GET /api/actifs/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/actifs/[id]
 * Modifier un actif
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

    const service = new ActifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const actif = await service.updateActif(params.id, body)

    return createSuccessResponse(actif)
  } catch (error) {
    console.error('Error in PATCH /api/actifs/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Actif not found', 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/actifs/[id]
 * Supprimer un actif
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

    const service = new ActifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    await service.deleteActif(params.id)

    return createSuccessResponse({ message: 'Actif deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/actifs/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Actif not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
