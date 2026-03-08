import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
const createSimulationSchema = z.object({
  simulateurType: z.string(),
  nom: z.string().min(1),
  parametres: z.record(z.string(), z.unknown()),
  resultats: z.record(z.string(), z.unknown()),
  selectionne: z.boolean().optional().default(false),
})

/**
 * GET /api/advisor/dossiers/[id]/simulations
 * Lister les simulations d'un dossier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: dossierId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Vérifier que le dossier appartient au cabinet
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, cabinetId: context.cabinetId }
    })

    if (!dossier) {
      return createErrorResponse('Dossier non trouvé', 404)
    }

    const simulations = await prisma.dossierSimulation.findMany({
      where: { dossierId },
      orderBy: { ordre: 'asc' }
    })

    return createSuccessResponse(simulations)
  } catch (error) {
    logger.error('Error in GET /api/advisor/dossiers/[id]/simulations:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/dossiers/[id]/simulations
 * Créer une simulation dans un dossier
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: dossierId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    
    let validated
    try {
      validated = createSimulationSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        return createErrorResponse(`Validation échouée: ${messages}`, 400)
      }
      throw error
    }

    // Vérifier que le dossier appartient au cabinet
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, cabinetId: context.cabinetId }
    })

    if (!dossier) {
      return createErrorResponse('Dossier non trouvé', 404)
    }

    // Compter les simulations existantes pour l'ordre
    const count = await prisma.dossierSimulation.count({ where: { dossierId } })

    const simulation = await prisma.dossierSimulation.create({
      data: {
        dossierId,
        simulateurType: validated.simulateurType as never,
        nom: validated.nom,
        parametres: validated.parametres,
        resultats: validated.resultats,
        selectionne: validated.selectionne,
        ordre: count,
      }
    })

    return createSuccessResponse(simulation, 201)
  } catch (error) {
    logger.error('Error in POST /api/advisor/dossiers/[id]/simulations:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
