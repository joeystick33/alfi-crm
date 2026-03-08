/**
 * API Route: /api/advisor/clients/[id]/budget/metrics
 * Calcul des métriques budgétaires + analyse + recommandations
 * Next.js 14 App Router - Route Handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
import {
  calculateBudgetMetrics,
  detectBudgetAnomalies,
  generateBudgetRecommendations,
} from '@/app/_common/lib/services/budget-service'

// ============================================================================
// GET /api/advisor/clients/[id]/budget/metrics
// Récupère métriques + alertes + recommandations
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
        taxBracket: true,
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

    // Si pas de budget, retourner des valeurs par défaut
    if (!budget) {
      return NextResponse.json(
        {
          data: {
            metrics: null,
            alerts: [],
            recommendations: [],
          },
        },
        { status: 200 }
      )
    }

    // Calculer les métriques
    const metrics = calculateBudgetMetrics({
      id: budget.id,
      clientId: budget.clientId,
      professionalIncome: budget.professionalIncome as any,
      assetIncome: budget.assetIncome as any,
      spouseIncome: budget.spouseIncome as any,
      retirementPensions: budget.retirementPensions as any,
      allowances: budget.allowances as any,
      monthlyExpenses: budget.monthlyExpenses as any,
      totalRevenue: budget.totalRevenue
        ? Number(budget.totalRevenue)
        : undefined,
      totalExpenses: budget.totalExpenses
        ? Number(budget.totalExpenses)
        : undefined,
      savingsCapacity: budget.savingsCapacity
        ? Number(budget.savingsCapacity)
        : undefined,
      savingsRate: budget.savingsRate ? Number(budget.savingsRate) : undefined,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    })

    // Détecter les anomalies
    const alerts = detectBudgetAnomalies(
      {
        id: budget.id,
        clientId: budget.clientId,
        professionalIncome: budget.professionalIncome as any,
        assetIncome: budget.assetIncome as any,
        spouseIncome: budget.spouseIncome as any,
        retirementPensions: budget.retirementPensions as any,
        allowances: budget.allowances as any,
        monthlyExpenses: budget.monthlyExpenses as any,
        totalRevenue: budget.totalRevenue
          ? Number(budget.totalRevenue)
          : undefined,
        totalExpenses: budget.totalExpenses
          ? Number(budget.totalExpenses)
          : undefined,
        savingsCapacity: budget.savingsCapacity
          ? Number(budget.savingsCapacity)
          : undefined,
        savingsRate: budget.savingsRate
          ? Number(budget.savingsRate)
          : undefined,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      },
      metrics
    )

    // Générer les recommandations
    const recommendations = generateBudgetRecommendations(
      {
        id: budget.id,
        clientId: budget.clientId,
        professionalIncome: budget.professionalIncome as any,
        assetIncome: budget.assetIncome as any,
        spouseIncome: budget.spouseIncome as any,
        retirementPensions: budget.retirementPensions as any,
        allowances: budget.allowances as any,
        monthlyExpenses: budget.monthlyExpenses as any,
        totalRevenue: budget.totalRevenue
          ? Number(budget.totalRevenue)
          : undefined,
        totalExpenses: budget.totalExpenses
          ? Number(budget.totalExpenses)
          : undefined,
        savingsCapacity: budget.savingsCapacity
          ? Number(budget.savingsCapacity)
          : undefined,
        savingsRate: budget.savingsRate
          ? Number(budget.savingsRate)
          : undefined,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
      },
      metrics,
      {
        annualIncome: client.annualIncome
          ? Number(client.annualIncome)
          : undefined,
        taxBracket: client.taxBracket
          ? parseInt(client.taxBracket)
          : undefined,
      }
    )

    return NextResponse.json(
      {
        data: {
          metrics,
          alerts,
          recommendations,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error(
      'GET /api/advisor/clients/[id]/budget/metrics error:',
      error
    )

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
