import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
const createPreconisationSchema = z.object({
  titre: z.string().min(1),
  description: z.string().min(1),
  argumentaire: z.string().optional().nullable(),
  produitId: z.string().optional().nullable(),
  montant: z.number().optional().nullable(),
  priorite: z.number().optional().default(1),
  ordre: z.number().optional(),
})

/**
 * GET /api/advisor/dossiers/[id]/preconisations
 * Lister les préconisations d'un dossier
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

    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, cabinetId: context.cabinetId }
    })

    if (!dossier) {
      return createErrorResponse('Dossier non trouvé', 404)
    }

    const preconisations = await prisma.dossierPreconisation.findMany({
      where: { dossierId },
      orderBy: { ordre: 'asc' }
    })

    return createSuccessResponse(preconisations)
  } catch (error) {
    logger.error('Error in GET /api/advisor/dossiers/[id]/preconisations:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/dossiers/[id]/preconisations
 * Créer une préconisation
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
      validated = createPreconisationSchema.parse(body)
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

    const count = await prisma.dossierPreconisation.count({ where: { dossierId } })

    const preconisation = await prisma.dossierPreconisation.create({
      data: {
        dossierId,
        titre: validated.titre,
        description: validated.description,
        argumentaire: validated.argumentaire,
        produitId: validated.produitId,
        montant: validated.montant,
        priorite: validated.priorite,
        ordre: validated.ordre ?? count,
        statut: 'PROPOSEE',
      }
    })

    return createSuccessResponse(preconisation, 201)
  } catch (error) {
    logger.error('Error in POST /api/advisor/dossiers/[id]/preconisations:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
