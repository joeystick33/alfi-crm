import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ClientService } from '@/lib/services/client-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/clients
 * Liste les clients avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    
    const filters = {
      status: searchParams.get('status') as any,
      clientType: searchParams.get('clientType') as any,
      conseillerId: searchParams.get('conseillerId') || undefined,
      search: searchParams.get('search') || undefined,
      kycStatus: searchParams.get('kycStatus') as any,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    }

    const clientService = new ClientService(
      context.cabinetId,
      context.user.id,
      context.user.role,
      context.isSuperAdmin
    )

    const clients = await clientService.listClients(filters)

    return createSuccessResponse(clients)
  } catch (error) {
    console.error('List clients error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
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

    const client = await clientService.createClient(body)

    return createSuccessResponse(client, 201)
  } catch (error) {
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
