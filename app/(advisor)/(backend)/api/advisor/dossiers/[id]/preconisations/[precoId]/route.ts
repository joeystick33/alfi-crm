import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
const updatePreconisationSchema = z.object({
  titre: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  argumentaire: z.string().optional().nullable(),
  produitId: z.string().optional().nullable(),
  montant: z.number().optional().nullable(),
  priorite: z.number().optional(),
  ordre: z.number().optional(),
  statut: z.enum(['PROPOSEE', 'ACCEPTEE', 'REFUSEE', 'EN_COURS', 'REALISEE']).optional(),
})

/**
 * PUT /api/advisor/dossiers/[id]/preconisations/[precoId]
 * Mettre à jour une préconisation
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; precoId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: dossierId, precoId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    
    let validated
    try {
      validated = updatePreconisationSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        return createErrorResponse(`Validation échouée: ${messages}`, 400)
      }
      throw error
    }

    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, cabinetId: context.cabinetId }
    })

    if (!dossier) {
      return createErrorResponse('Dossier non trouvé', 404)
    }

    const preconisation = await prisma.dossierPreconisation.update({
      where: { id: precoId, dossierId },
      data: validated
    })

    return createSuccessResponse(preconisation)
  } catch (error) {
    logger.error('Error in PUT /api/advisor/dossiers/[id]/preconisations/[precoId]:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/advisor/dossiers/[id]/preconisations/[precoId]
 * Supprimer une préconisation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; precoId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: dossierId, precoId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, cabinetId: context.cabinetId }
    })

    if (!dossier) {
      return createErrorResponse('Dossier non trouvé', 404)
    }

    await prisma.dossierPreconisation.delete({
      where: { id: precoId, dossierId }
    })

    return createSuccessResponse({ success: true })
  } catch (error) {
    logger.error('Error in DELETE /api/advisor/dossiers/[id]/preconisations/[precoId]:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
