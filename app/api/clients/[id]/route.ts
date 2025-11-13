import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ClientService } from '@/lib/services/client-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/clients/[id]
 * Récupère un client par ID
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

    const { searchParams } = new URL(request.url)
    const includeRelations = searchParams.get('include') === 'true'

    const clientService = new ClientService(
      context.cabinetId,
      context.user.id,
      context.user.role,
      context.isSuperAdmin
    )

    const client = await clientService.getClientById(params.id, includeRelations)

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    return createSuccessResponse(client)
  } catch (error) {
    console.error('Get client error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/clients/[id]
 * Met à jour un client
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

    const clientService = new ClientService(
      context.cabinetId,
      context.user.id,
      context.user.role,
      context.isSuperAdmin
    )

    const client = await clientService.updateClient(params.id, body)

    return createSuccessResponse(client)
  } catch (error) {
    console.error('Update client error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/clients/[id]
 * Archive un client
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

    const clientService = new ClientService(
      context.cabinetId,
      context.user.id,
      context.user.role,
      context.isSuperAdmin
    )

    await clientService.archiveClient(params.id)

    return createSuccessResponse({ message: 'Client archived successfully' })
  } catch (error) {
    console.error('Archive client error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
