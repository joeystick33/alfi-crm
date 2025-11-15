import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { ContratService } from '@/lib/services/contrat-service'
import { isRegularUser } from '@/lib/auth-types'
import { ContratType, ContratStatus } from '@prisma/client'

/**
 * GET /api/contrats
 * Liste des contrats avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    
    const typeParam = searchParams.get('type');
    const statusParam = searchParams.get('status');
    
    const filters = {
      type: typeParam ? (typeParam as ContratType) : undefined,
      status: statusParam ? (statusParam as ContratStatus) : undefined,
      clientId: searchParams.get('clientId') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const service = new ContratService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const contrats = await service.listContratsWithClients(filters)

    return createSuccessResponse(contrats)
  } catch (error) {
    console.error('Error in GET /api/contrats:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/contrats
 * Créer un nouveau contrat
 */
export async function POST(request: NextRequest) {
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

    const contrat = await service.createContrat(body)

    return createSuccessResponse(contrat, 201)
  } catch (error) {
    console.error('Error in POST /api/contrats:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
