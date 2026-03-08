import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { DossierService } from '@/app/_common/lib/services/dossier-service'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
const updateDossierSchema = z.object({
  nom: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.string().optional(),
  categorie: z.string().optional(),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).optional(),
  status: z.string().optional(),
  etapeActuelle: z.enum(['COLLECTE', 'ANALYSE', 'PRECONISATION', 'VALIDATION', 'CLOTURE']).optional(),
  clientDataSnapshot: z.record(z.string(), z.unknown()).optional(),
  dateCloturePrevu: z.string().optional().transform(val => val ? new Date(val) : undefined),
  dateClotureReelle: z.string().optional().transform(val => val ? new Date(val) : undefined),
  montantEstime: z.number().optional(),
  montantRealise: z.number().optional(),
  budgetAlloue: z.number().optional(),
  progressionPct: z.number().min(0).max(100).optional(),
  objetifs: z.string().optional(),
  risques: z.string().optional(),
  recommandations: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

/**
 * GET /api/advisor/dossiers/[id]
 * Obtenir un dossier par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (!id) {
      return createErrorResponse('Missing dossier ID', 400)
    }

    const service = new DossierService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const dossier = await service.getDossierById(id)

    return createSuccessResponse(dossier)
  } catch (error) {
    logger.error('Error in GET /api/advisor/dossiers/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('non trouvé')) {
      return createErrorResponse(error.message, 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/advisor/dossiers/[id]
 * Mettre à jour un dossier
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (!id) {
      return createErrorResponse('Missing dossier ID', 400)
    }

    const body = await request.json()
    
    let validated
    try {
      validated = updateDossierSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        return createErrorResponse(`Validation échouée: ${messages}`, 400)
      }
      throw error
    }

    const service = new DossierService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const updated = await service.updateDossier(id, validated)

    return createSuccessResponse(updated)
  } catch (error) {
    logger.error('Error in PATCH /api/advisor/dossiers/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
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
 * DELETE /api/advisor/dossiers/[id]
 * Supprimer un dossier (BROUILLON only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (!id) {
      return createErrorResponse('Missing dossier ID', 400)
    }

    const service = new DossierService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    await service.deleteDossier(id)

    return createSuccessResponse({
      success: true,
      message: 'Dossier supprimé avec succès',
    })
  } catch (error) {
    logger.error('Error in DELETE /api/advisor/dossiers/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
