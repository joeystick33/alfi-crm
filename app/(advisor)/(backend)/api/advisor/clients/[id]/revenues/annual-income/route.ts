import { NextRequest } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
// Multiplicateurs pour calcul du montant annuel
const FREQUENCE_MULTIPLIER: Record<string, number> = {
  MENSUEL: 12,
  TRIMESTRIEL: 4,
  SEMESTRIEL: 2,
  ANNUEL: 1,
  PONCTUEL: 1,
}

// GET /api/advisor/clients/[id]/revenues/annual-income
// Calcule le revenu annuel total d'un client
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId } = await params

    // Récupérer tous les revenus actifs du client
    const revenues = await prisma.revenue.findMany({
      where: {
        clientId,
        cabinetId,
        isActive: true,
      },
    })

    // Calculer le total annuel
    let totalAnnuel = 0
    const details: Array<{
      id: string
      libelle: string
      categorie: string
      montant: number
      frequence: string
      montantAnnuel: number
    }> = []

    for (const revenue of revenues) {
      const montant = Number(revenue.montant) || 0
      const frequence = revenue.frequence || 'MENSUEL'
      const multiplier = FREQUENCE_MULTIPLIER[frequence] || 12
      const montantAnnuel = revenue.montantAnnuel ? Number(revenue.montantAnnuel) : montant * multiplier

      totalAnnuel += montantAnnuel
      details.push({
        id: revenue.id,
        libelle: revenue.libelle,
        categorie: revenue.categorie,
        montant,
        frequence,
        montantAnnuel,
      })
    }

    return createSuccessResponse({
      clientId,
      totalAnnuel,
      totalMensuel: totalAnnuel / 12,
      nombreRevenus: revenues.length,
      details,
    })
  } catch (error: unknown) {
    logger.error('Error calculating annual income:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to calculate annual income', 500)
  }
}
