 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { ApporteurService } from '@/app/_common/lib/services/apporteur-service'
import { ApporteurType } from '@prisma/client'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/apporteurs/[id]
 * Récupérer un apporteur par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse("Type d'utilisateur invalide", 400)
    }

    const apporteurService = new ApporteurService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const apporteur = await apporteurService.getApporteurById(id)

    return createSuccessResponse(apporteur)
  } catch (error: any) {
    logger.error(`Erreur GET /api/advisor/apporteurs/${id}:`, { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Non autorisé', 401)
    }

    if (error instanceof Error && error.message === 'Apporteur non trouvé') {
      return createErrorResponse('Apporteur non trouvé', 404)
    }

    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }

    return createErrorResponse('Erreur lors du chargement de l\'apporteur', 500)
  }
}

/**
 * PATCH /api/advisor/apporteurs/[id]
 * Mettre à jour un apporteur
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse("Type d'utilisateur invalide", 400)
    }

    const body = await request.json()

    // Validation du type si fourni
    if (body.type) {
      const validTypes: ApporteurType[] = ['NOTAIRE', 'EXPERT_COMPTABLE', 'BANQUIER', 'COURTIER', 'AUTRE']
      if (!validTypes.includes(body.type)) {
        return createErrorResponse('Type d\'apporteur invalide', 400)
      }
    }

    // Validation de l'email si fourni
    if (body.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        return createErrorResponse('Email invalide', 400)
      }
    }

    // Validation du taux de commission si fourni
    if (body.commissionRate !== undefined && body.commissionRate !== null) {
      const rate = Number(body.commissionRate)
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return createErrorResponse('Taux de commission invalide (doit être entre 0 et 100)', 400)
      }
      body.commissionRate = rate
    }

    const apporteurService = new ApporteurService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const apporteur = await apporteurService.updateApporteur(id, body)

    return createSuccessResponse(apporteur)
  } catch (error: any) {
    logger.error(`Erreur PATCH /api/advisor/apporteurs/${id}:`, { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Non autorisé', 401)
    }

    if (error instanceof Error && error.message === 'Apporteur non trouvé') {
      return createErrorResponse('Apporteur non trouvé', 404)
    }

    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }

    return createErrorResponse('Erreur lors de la mise à jour de l\'apporteur', 500)
  }
}

/**
 * DELETE /api/advisor/apporteurs/[id]
 * Supprimer ou désactiver un apporteur
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse("Type d'utilisateur invalide", 400)
    }

    const apporteurService = new ApporteurService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const result = await apporteurService.deleteApporteur(id)

    return createSuccessResponse(result)
  } catch (error: any) {
    logger.error(`Erreur DELETE /api/advisor/apporteurs/${id}:`, { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Non autorisé', 401)
    }

    if (error instanceof Error && error.message === 'Apporteur non trouvé') {
      return createErrorResponse('Apporteur non trouvé', 404)
    }

    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }

    return createErrorResponse('Erreur lors de la suppression de l\'apporteur', 500)
  }
}
