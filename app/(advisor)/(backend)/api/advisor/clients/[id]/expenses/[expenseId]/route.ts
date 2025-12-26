import { NextRequest } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { mapExpenseCategory } from '@/app/_common/lib/enum-mappings'

// ============================================
// Routes pour une charge spécifique
// Les valeurs sont uniformes: Frontend = Prisma = Supabase
// ============================================

// Multiplicateurs pour calcul du montant annuel
const FREQUENCE_MULTIPLIER: Record<string, number> = {
  MENSUEL: 12,
  BIMESTRIEL: 6,
  TRIMESTRIEL: 4,
  SEMESTRIEL: 2,
  ANNUEL: 1,
  PONCTUEL: 1,
}

// Helper: Mapper les données Prisma vers frontend
function mapDbToFrontend(expense: any): any {
  return expense
}

// ============================================
// GET /api/advisor/clients/[id]/expenses/[expenseId]
// ============================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId, expenseId } = await params

    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        clientId,
        cabinetId,
      },
    })

    if (!expense) {
      return createErrorResponse('Expense not found', 404)
    }

    return createSuccessResponse(mapDbToFrontend(expense))
  } catch (error: any) {
    console.error('Error fetching expense:', error)
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to fetch expense', 500)
  }
}

// ============================================
// PUT /api/advisor/clients/[id]/expenses/[expenseId]
// ============================================
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId, expenseId } = await params
    const data = await req.json()

    // Vérifier que la charge existe
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        clientId,
        cabinetId,
      },
    })

    if (!existingExpense) {
      return createErrorResponse('Expense not found', 404)
    }

    // Extraire les valeurs (uniforme frontend/backend)
    const montant = Number(data.montant) || Number(existingExpense.montant)
    const frequence = data.frequence || existingExpense.frequence
    const multiplier = FREQUENCE_MULTIPLIER[frequence] || 12
    const montantAnnuel = montant * multiplier

    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(data.libelle !== undefined && { libelle: data.libelle }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.categorie !== undefined && {
          categorie: mapExpenseCategory(data.categorie) as any,
        }),
        ...(data.montant !== undefined && { montant: Number(data.montant) }),
        ...(data.frequence !== undefined && { frequence: data.frequence }),
        ...(data.estFixe !== undefined && { estFixe: data.estFixe }),
        ...(data.estEssentiel !== undefined && { estEssentiel: data.estEssentiel }),
        ...(data.estDeductible !== undefined && { estDeductible: data.estDeductible }),
        ...(data.tauxDeductibilite !== undefined && { tauxDeductibilite: data.tauxDeductibilite }),
        ...(data.dateDebut !== undefined && {
          dateDebut: data.dateDebut ? new Date(data.dateDebut) : null,
        }),
        ...(data.dateFin !== undefined && {
          dateFin: data.dateFin ? new Date(data.dateFin) : null,
        }),
        ...(data.beneficiaire !== undefined && { beneficiaire: data.beneficiaire }),
        ...(data.notes !== undefined && { notes: data.notes }),
        montantAnnuel,
      },
    })

    return createSuccessResponse(mapDbToFrontend(updatedExpense))
  } catch (error: any) {
    console.error('Error updating expense:', error)
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to update expense', 500)
  }
}

// ============================================
// DELETE /api/advisor/clients/[id]/expenses/[expenseId]
// ============================================
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; expenseId: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId, expenseId } = await params

    // Vérifier que la charge existe
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        clientId,
        cabinetId,
      },
    })

    if (!existingExpense) {
      return createErrorResponse('Expense not found', 404)
    }

    // Soft delete
    const deletedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: { isActive: false },
    })

    return createSuccessResponse({ message: 'Expense deleted successfully', id: deletedExpense.id })
  } catch (error: any) {
    console.error('Error deleting expense:', error)
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to delete expense', 500)
  }
}
