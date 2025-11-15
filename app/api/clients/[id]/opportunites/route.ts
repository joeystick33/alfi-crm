import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { OpportuniteService } from '@/lib/services/opportunite-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/clients/[id]/opportunites
 * Récupérer toutes les opportunités d'un client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context)) {
      return createErrorResponse('Unauthorized', 401)
    }

    const service = new OpportuniteService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const opportunites = await service.getOpportunites({
      clientId: params.id
    })

    return createSuccessResponse(opportunites)
  } catch (error) {
    console.error('Error in GET /api/clients/[id]/opportunites:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Failed to fetch opportunities', 500)
  }
}

/**
 * POST /api/clients/[id]/opportunites
 * Créer une nouvelle opportunité pour un client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context)) {
      return createErrorResponse('Unauthorized', 401)
    }

    const body = await request.json()

    const service = new OpportuniteService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const opportunite = await service.createOpportunite({
      clientId: params.id,
      conseillerId: body.conseillerId || context.user.id,
      type: body.type,
      name: body.name,
      description: body.description,
      estimatedValue: body.estimatedValue,
      confidence: body.confidence,
      priority: body.priority,
      detectedAt: body.detectedAt ? new Date(body.detectedAt) : undefined
    })

    return createSuccessResponse(opportunite, 201)
  } catch (error) {
    console.error('Error in POST /api/clients/[id]/opportunites:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Client not found', 404)
    }
    
    return createErrorResponse('Failed to create opportunity', 500)
  }
}
