import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
const updateSimulationSchema = z.object({
  nom: z.string().min(1).optional(),
  parametres: z.record(z.string(), z.unknown()).optional(),
  resultats: z.record(z.string(), z.unknown()).optional(),
  selectionne: z.boolean().optional(),
  ordre: z.number().optional(),
})

/**
 * PATCH /api/advisor/dossiers/[id]/simulations/[simulationId]
 * Mettre à jour une simulation
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; simulationId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: dossierId, simulationId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    
    let validated
    try {
      validated = updateSimulationSchema.parse(body)
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

    const simulation = await prisma.dossierSimulation.update({
      where: { id: simulationId, dossierId },
      data: validated
    })

    return createSuccessResponse(simulation)
  } catch (error) {
    logger.error('Error in PATCH /api/advisor/dossiers/[id]/simulations/[simulationId]:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/advisor/dossiers/[id]/simulations/[simulationId]
 * Supprimer une simulation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; simulationId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: dossierId, simulationId } = await params
    
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

    await prisma.dossierSimulation.delete({
      where: { id: simulationId, dossierId }
    })

    return createSuccessResponse({ success: true })
  } catch (error) {
    logger.error('Error in DELETE /api/advisor/dossiers/[id]/simulations/[simulationId]:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
