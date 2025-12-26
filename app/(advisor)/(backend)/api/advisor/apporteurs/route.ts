 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { ApporteurService } from '@/app/_common/lib/services/apporteur-service'
import { ApporteurType } from '@prisma/client'

/**
 * GET /api/advisor/apporteurs
 * Liste des apporteurs d'affaires avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse("Type d'utilisateur invalide", 400)
    }

    const { searchParams } = new URL(request.url)

    const filters: any = {}

    if (searchParams.get('search')) {
      filters.search = searchParams.get('search')!
    }

    if (searchParams.get('type')) {
      filters.type = searchParams.get('type') as ApporteurType
    }

    if (searchParams.get('isActive')) {
      filters.isActive = searchParams.get('isActive') === 'true'
    }

    const prismaUserId = (user as any)?.prismaUserId || user.id

    const apporteurService = new ApporteurService(
      context.cabinetId,
      prismaUserId,
      context.isSuperAdmin
    )

    const apporteurs = await apporteurService.listApporteurs(filters)

    return createSuccessResponse({ data: apporteurs })
  } catch (error: any) {
    console.error('Erreur GET /api/advisor/apporteurs:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Non autorisé', 401)
    }

    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }

    return createErrorResponse('Erreur lors du chargement des apporteurs', 500)
  }
}

/**
 * POST /api/advisor/apporteurs
 * Créer un nouvel apporteur d'affaires
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse("Type d'utilisateur invalide", 400)
    }

    const body = await request.json()

    // Validation des champs obligatoires
    if (!body.type || !body.firstName || !body.lastName || !body.email) {
      return createErrorResponse('Champs obligatoires manquants (type, firstName, lastName, email)', 400)
    }

    // Validation du type
    const validTypes: ApporteurType[] = ['NOTAIRE', 'EXPERT_COMPTABLE', 'BANQUIER', 'COURTIER', 'AUTRE']
    if (!validTypes.includes(body.type)) {
      return createErrorResponse('Type d\'apporteur invalide', 400)
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return createErrorResponse('Email invalide', 400)
    }

    // Validation du taux de commission
    if (body.commissionRate !== undefined && body.commissionRate !== null) {
      const rate = Number(body.commissionRate)
      if (isNaN(rate) || rate < 0 || rate > 100) {
        return createErrorResponse('Taux de commission invalide (doit être entre 0 et 100)', 400)
      }
      body.commissionRate = rate
    }

    const prismaUserId = (user as any)?.prismaUserId || user.id

    const apporteurService = new ApporteurService(
      context.cabinetId,
      prismaUserId,
      context.isSuperAdmin
    )

    const apporteur = await apporteurService.createApporteur(body)

    return createSuccessResponse(apporteur, 201)
  } catch (error: any) {
    console.error('Erreur POST /api/advisor/apporteurs:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Non autorisé', 401)
    }

    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }

    return createErrorResponse('Erreur lors de la création de l\'apporteur', 500)
  }
}
