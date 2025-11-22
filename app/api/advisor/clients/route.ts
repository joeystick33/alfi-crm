import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers'
import { ClientService } from '@/lib/services/client-service'
import { isRegularUser } from '@/lib/auth-types'
import { parseClientFilters } from './utils'

/**
 * GET /api/clients
 * Liste les clients avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const filters = parseClientFilters(searchParams)

    const clientService = new ClientService(
      user.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const clients = await clientService.listClients(filters)

    return createSuccessResponse(clients)
  } catch (error: any) {
    console.error('List clients error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/clients
 * Crée un nouveau client
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const { normalizeClientCreatePayload } = await import('./utils')
    const payload = normalizeClientCreatePayload(body)

    const clientService = new ClientService(
      user.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const client = await clientService.createClient(payload)

    return createSuccessResponse(client, 201)
  } catch (error: any) {
    console.error('Create client error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
