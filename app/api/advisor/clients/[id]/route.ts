import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers'
import { ClientService } from '@/lib/services/client-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/clients/[id]
 * Récupère un client par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const includeRelations = searchParams.get('include') === 'true' || searchParams.get('include') === 'all'

    const clientService = new ClientService(
      user.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const client = await clientService.getClientById(id, includeRelations)

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    return createSuccessResponse(client)
  } catch (error: any) {
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id } = await params
    const body = await request.json()
    const { normalizeClientUpdatePayload } = await import('../utils')
    const payload = normalizeClientUpdatePayload(body)

    const clientService = new ClientService(
      user.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const client = await clientService.updateClient(id, payload)

    return createSuccessResponse(client)
  } catch (error: any) {
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id } = await params

    const clientService = new ClientService(
      user.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    await clientService.archiveClient(id)

    return createSuccessResponse({ message: 'Client archived successfully' })
  } catch (error: any) {
    console.error('Archive client error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
