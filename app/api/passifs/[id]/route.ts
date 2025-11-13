import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { PassifService } from '@/lib/services/passif-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/passifs/[id]
 * Récupérer un passif par ID
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

    const service = new PassifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const passif = await service.getPassifById(params.id)

    if (!passif) {
      return createErrorResponse('Passif not found', 404)
    }

    return createSuccessResponse(passif)
  } catch (error) {
    console.error('Error in GET /api/passifs/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/passifs/[id]
 * Modifier un passif
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

    const service = new PassifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const passif = await service.updatePassif(params.id, body)

    return createSuccessResponse(passif)
  } catch (error) {
    console.error('Error in PATCH /api/passifs/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Passif not found', 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/passifs/[id]
 * Supprimer un passif
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

    const service = new PassifService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    await service.deletePassif(params.id)

    return createSuccessResponse({ message: 'Passif deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/passifs/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Passif not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
