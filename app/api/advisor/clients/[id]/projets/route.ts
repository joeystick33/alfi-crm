import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers'
import { ProjetService } from '@/lib/services/projet-service'
import { isRegularUser } from '@/lib/auth-types'
import { ProjetType } from '@prisma/client'

/**
 * GET /api/clients/[id]/projets
 * Récupère les projets d'un client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const projetService = new ProjetService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const projets = await projetService.getProjets({
      clientId: params.id,
    })

    return createSuccessResponse(projets)
  } catch (error: any) {
    console.error('Get projets error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/clients/[id]/projets
 * Crée un nouveau projet pour un client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()

    // Validation
    if (!body.type || !body.name) {
      return createErrorResponse('Missing required fields', 400)
    }

    const projetService = new ProjetService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const projet = await projetService.createProjet({
      clientId: params.id,
      type: body.type as ProjetType,
      name: body.name,
      description: body.description,
      estimatedBudget: body.estimatedBudget ? parseFloat(body.estimatedBudget) : undefined,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      priority: body.priority || 'MEDIUM',
    })

    return createSuccessResponse(projet, 201)
  } catch (error: any) {
    console.error('Create projet error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
