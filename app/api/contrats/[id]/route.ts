import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ContratService } from '@/lib/services/contrat-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/contrats/[id]
 * Récupérer un contrat par ID
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

    const service = new ContratService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const contrat = await service.getContratById(params.id)

    if (!contrat) {
      return createErrorResponse('Contrat not found', 404)
    }

    return createSuccessResponse(contrat)
  } catch (error) {
    console.error('Error in GET /api/contrats/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/contrats/[id]
 * Modifier un contrat
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

    const service = new ContratService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const contrat = await service.updateContrat(params.id, body)

    return createSuccessResponse(contrat)
  } catch (error) {
    console.error('Error in PATCH /api/contrats/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Contrat not found', 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/contrats/[id]
 * Supprimer un contrat
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

    const service = new ContratService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    await service.deleteContrat(params.id)

    return createSuccessResponse({ message: 'Contrat deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/contrats/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Contrat not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
