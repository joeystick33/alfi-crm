 
import { NextRequest } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { mapRevenueCategory } from '@/app/_common/lib/enum-mappings'
import { logger } from '@/app/_common/lib/logger'
// ============================================
// Routes pour un revenu spécifique
// Les valeurs sont uniformes: Frontend = Prisma = Supabase
// ============================================

// Multiplicateurs pour calcul du montant annuel
const FREQUENCE_MULTIPLIER: Record<string, number> = {
  MENSUEL: 12,
  TRIMESTRIEL: 4,
  SEMESTRIEL: 2,
  ANNUEL: 1,
  PONCTUEL: 1,
}

// Helper: Mapper les données Prisma vers frontend (alias)
function mapDbToFrontend(revenue: any): any {
  return {
    ...revenue,
    montantBrut: revenue.montant,
    montantNet: revenue.montant,
    sourceRevenu: revenue.sourceOrganisme,
  }
}

// GET /api/advisor/clients/[id]/revenues/[revenueId] - Récupérer un revenu spécifique
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; revenueId: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId, revenueId } = await params

    const revenue = await prisma.revenue.findFirst({
      where: {
        id: revenueId,
        clientId,
        cabinetId,
      },
    })

    if (!revenue) {
      return createErrorResponse('Revenue not found', 404)
    }

    return createSuccessResponse(mapDbToFrontend(revenue))
  } catch (error: any) {
    logger.error('Error fetching revenue:', { error: error instanceof Error ? error.message : String(error) })
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to fetch revenue', 500)
  }
}

// PUT /api/advisor/clients/[id]/revenues/[revenueId] - Mettre à jour un revenu
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; revenueId: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId, revenueId } = await params
    const data = await req.json()

    // Vérifier que le revenu existe et appartient au bon client/cabinet
    const existingRevenue = await prisma.revenue.findFirst({
      where: {
        id: revenueId,
        clientId,
        cabinetId,
      },
    })

    if (!existingRevenue) {
      return createErrorResponse('Revenue not found', 404)
    }

    // Extraire les valeurs (uniforme frontend/backend)
    const montant = data.montant ?? data.montantNet ?? data.montantBrut ?? existingRevenue.montant
    const frequence = data.frequence || existingRevenue.frequence
    const multiplier = FREQUENCE_MULTIPLIER[frequence] || 12
    const montantAnnuel = Number(montant) * multiplier

    const updatedRevenue = await prisma.revenue.update({
      where: { id: revenueId },
      data: {
        ...(data.libelle !== undefined && { libelle: data.libelle }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.categorie !== undefined && { categorie: mapRevenueCategory(data.categorie) as any }),
        ...(montant !== existingRevenue.montant && { montant: Number(montant) }),
        ...(data.frequence !== undefined && { frequence: data.frequence }),
        ...(data.fiscalite !== undefined && { fiscalite: data.fiscalite }),
        ...(data.tauxImposition !== undefined && { tauxImposition: data.tauxImposition }),
        ...(data.dateDebut !== undefined && { dateDebut: data.dateDebut ? new Date(data.dateDebut) : null }),
        ...(data.dateFin !== undefined && { dateFin: data.dateFin ? new Date(data.dateFin) : null }),
        ...(data.estRecurrent !== undefined && { estRecurrent: data.estRecurrent }),
        ...(data.sourceRevenu !== undefined && { sourceOrganisme: data.sourceRevenu }),
        ...(data.notes !== undefined && { notes: data.notes }),
        montantAnnuel,
      },
    })

    return createSuccessResponse(mapDbToFrontend(updatedRevenue))
  } catch (error: any) {
    logger.error('Error updating revenue:', { error: error instanceof Error ? error.message : String(error) })
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to update revenue', 500)
  }
}

// DELETE /api/advisor/clients/[id]/revenues/[revenueId] - Supprimer un revenu (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; revenueId: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId, revenueId } = await params

    // Vérifier que le revenu existe et appartient au bon client/cabinet
    const existingRevenue = await prisma.revenue.findFirst({
      where: {
        id: revenueId,
        clientId,
        cabinetId,
      },
    })

    if (!existingRevenue) {
      return createErrorResponse('Revenue not found', 404)
    }

    // Soft delete - mettre isActive à false
    const deletedRevenue = await prisma.revenue.update({
      where: { id: revenueId },
      data: { isActive: false },
    })

    return createSuccessResponse({ message: 'Revenue deleted successfully', id: deletedRevenue.id })
  } catch (error: any) {
    logger.error('Error deleting revenue:', { error: error instanceof Error ? error.message : String(error) })
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to delete revenue', 500)
  }
}
