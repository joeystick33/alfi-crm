/**
 * API Route: /api/advisor/clients/[id]/budget/data
 * Returns complete budget data for TabBudget component
 * 
 * Implements Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { 
  calculateBudgetData,
  generateBudgetEvolution 
} from '@/app/_common/lib/services/budget-data-service'
import type { ClientBudget } from '@/app/_common/lib/api-types'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// GET /api/advisor/clients/[id]/budget/data
// Returns complete budget data for TabBudget
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentification requise
    const context = await requireAuth(request)
    const { id } = await params
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Vérifier que le client existe et appartient au cabinet
    const client = await prisma.client.findFirst({
      where: {
        id,
        cabinetId: context.cabinetId,
      },
      select: { 
        id: true,
        annualIncome: true,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found', code: 'CLIENT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Récupérer le budget
    const budget = await prisma.clientBudget.findUnique({
      where: { clientId: id },
    })

    // Transform Prisma budget to ClientBudget type
    const clientBudget: ClientBudget | null = budget ? {
      id: budget.id,
      clientId: budget.clientId,
      professionalIncome: budget.professionalIncome as unknown as ClientBudget['professionalIncome'],
      assetIncome: budget.assetIncome as unknown as ClientBudget['assetIncome'],
      spouseIncome: budget.spouseIncome as unknown as ClientBudget['spouseIncome'],
      retirementPensions: budget.retirementPensions as unknown as ClientBudget['retirementPensions'],
      allowances: budget.allowances as unknown as ClientBudget['allowances'],
      monthlyExpenses: budget.monthlyExpenses as unknown as ClientBudget['monthlyExpenses'],
      totalRevenue: budget.totalRevenue ? Number(budget.totalRevenue) : undefined,
      totalExpenses: budget.totalExpenses ? Number(budget.totalExpenses) : undefined,
      savingsCapacity: budget.savingsCapacity ? Number(budget.savingsCapacity) : undefined,
      savingsRate: budget.savingsRate ? Number(budget.savingsRate) : undefined,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    } : null

    // Calculate complete budget data
    const budgetData = calculateBudgetData(clientBudget)
    
    // Generate evolution data
    const evolution = clientBudget 
      ? generateBudgetEvolution(budgetData.revenues, budgetData.expenses)
      : []

    return NextResponse.json({
      data: {
        ...budgetData,
        evolution
      }
    }, { status: 200 })

  } catch (error) {
    logger.error('GET /api/advisor/clients/[id]/budget/data error:', { error: error instanceof Error ? error.message : String(error) })

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
