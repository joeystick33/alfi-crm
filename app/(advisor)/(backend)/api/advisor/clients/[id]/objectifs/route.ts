 
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { ObjectifService } from '@/app/_common/lib/services/objectif-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { ObjectifType, ObjectifPriority } from '@prisma/client'

// Schéma de validation Zod pour création d'objectif
const createObjectifSchema = z.object({
  type: z.nativeEnum(ObjectifType),
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional(),
  targetAmount: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]),
  currentAmount: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  targetDate: z.string().min(1, 'La date cible est requise').transform(v => new Date(v)),
  priority: z.nativeEnum(ObjectifPriority).optional().default('MOYENNE'),
  monthlyContribution: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
})

/**
 * GET /api/clients/[id]/objectifs
 * Récupère les objectifs d'un client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: clientId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const objectifService = new ObjectifService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const objectifs = await objectifService.getObjectifs({
      clientId,
    })

    return createSuccessResponse(objectifs)
  } catch (error: any) {
    console.error('Get objectifs error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/clients/[id]/objectifs
 * Crée un nouvel objectif pour un client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: clientId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()

    // Validation avec Zod
    const data = createObjectifSchema.parse(body)

    const objectifService = new ObjectifService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const objectif = await objectifService.createObjectif({
      clientId,
      type: data.type,
      name: data.name,
      description: data.description,
      targetAmount: data.targetAmount,
      currentAmount: data.currentAmount || 0,
      targetDate: data.targetDate,
      priority: data.priority,
      monthlyContribution: data.monthlyContribution,
    })

    return createSuccessResponse(objectif, 201)
  } catch (error: any) {
    console.error('Create objectif error:', error)
    
    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides: ' + error.issues.map(e => e.message).join(', '), 400)
    }
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
