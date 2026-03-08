 
/**
 * API Route: /api/advisor/clients/[id]/budget
 * Gestion du budget client (CRUD)
 * Next.js 14 App Router - Route Handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { clientBudgetSchema } from '@/app/_common/lib/validation-schemas'
import { calculateBudgetMetrics } from '@/app/_common/lib/services/budget-service'
import { ZodError } from 'zod'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// GET /api/advisor/clients/[id]/budget
// Récupère le budget d'un client
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
      select: { id: true },
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

    // Si pas de budget, retourner null (pas d'erreur)
    if (!budget) {
      return NextResponse.json({ data: null }, { status: 200 })
    }

    return NextResponse.json({ data: budget }, { status: 200 })
  } catch (error: any) {
    logger.error('GET /api/advisor/clients/[id]/budget error:', { error: error instanceof Error ? error.message : String(error) })

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

// ============================================================================
// POST /api/advisor/clients/[id]/budget
// Crée le budget d'un client (si n'existe pas déjà)
// ============================================================================

export async function POST(
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
      select: { id: true },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found', code: 'CLIENT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Vérifier que le budget n'existe pas déjà
    const existingBudget = await prisma.clientBudget.findUnique({
      where: { clientId: id },
    })

    if (existingBudget) {
      return NextResponse.json(
        {
          error: 'Budget already exists for this client',
          code: 'BUDGET_ALREADY_EXISTS',
        },
        { status: 409 }
      )
    }

    // Parser et valider le body
    const body = await request.json()
    const validated = clientBudgetSchema.parse(body)

    // Calculer les métriques automatiquement
    const metrics = calculateBudgetMetrics({
      id: '',
      clientId: id,
      ...validated,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Créer le budget
    const budget = await prisma.clientBudget.create({
      data: {
        clientId: id,
        professionalIncome: validated.professionalIncome || null,
        assetIncome: validated.assetIncome || null,
        spouseIncome: validated.spouseIncome || null,
        retirementPensions: validated.retirementPensions || null,
        allowances: validated.allowances || null,
        monthlyExpenses: validated.monthlyExpenses || null,
        totalRevenue: metrics.revenusAnnuels,
        totalExpenses: metrics.chargesAnnuelles,
        savingsCapacity: metrics.capaciteEpargneAnnuelle,
        savingsRate: metrics.tauxEpargne,
      },
    })

    return NextResponse.json({ data: budget }, { status: 201 })
  } catch (error: any) {
    logger.error('POST /api/advisor/clients/[id]/budget error:', { error: error instanceof Error ? error.message : String(error) })

    // Erreur de validation Zod
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.issues,
        },
        { status: 400 }
      )
    }

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

// ============================================================================
// PATCH /api/advisor/clients/[id]/budget
// Met à jour le budget d'un client (upsert)
// ============================================================================

export async function PATCH(
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
      select: { id: true },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found', code: 'CLIENT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Parser et valider le body
    const body = await request.json()
    const validated = clientBudgetSchema.parse(body)

    // Calculer les métriques automatiquement
    const metrics = calculateBudgetMetrics({
      id: '',
      clientId: id,
      ...validated,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Upsert (créer ou mettre à jour)
    const budget = await prisma.clientBudget.upsert({
      where: { clientId: id },
      create: {
        clientId: id,
        professionalIncome: validated.professionalIncome || null,
        assetIncome: validated.assetIncome || null,
        spouseIncome: validated.spouseIncome || null,
        retirementPensions: validated.retirementPensions || null,
        allowances: validated.allowances || null,
        monthlyExpenses: validated.monthlyExpenses || null,
        totalRevenue: metrics.revenusAnnuels,
        totalExpenses: metrics.chargesAnnuelles,
        savingsCapacity: metrics.capaciteEpargneAnnuelle,
        savingsRate: metrics.tauxEpargne,
      },
      update: {
        professionalIncome: validated.professionalIncome || null,
        assetIncome: validated.assetIncome || null,
        spouseIncome: validated.spouseIncome || null,
        retirementPensions: validated.retirementPensions || null,
        allowances: validated.allowances || null,
        monthlyExpenses: validated.monthlyExpenses || null,
        totalRevenue: metrics.revenusAnnuels,
        totalExpenses: metrics.chargesAnnuelles,
        savingsCapacity: metrics.capaciteEpargneAnnuelle,
        savingsRate: metrics.tauxEpargne,
      },
    })

    return NextResponse.json({ data: budget }, { status: 200 })
  } catch (error: any) {
    logger.error('PATCH /api/advisor/clients/[id]/budget error:', { error: error instanceof Error ? error.message : String(error) })

    // Erreur de validation Zod
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.issues,
        },
        { status: 400 }
      )
    }

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

// ============================================================================
// DELETE /api/advisor/clients/[id]/budget
// Supprime le budget d'un client
// ============================================================================

export async function DELETE(
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
      select: { id: true },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found', code: 'CLIENT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Supprimer le budget (si existe)
    try {
      await prisma.clientBudget.delete({
        where: { clientId: id },
      })

      return NextResponse.json(
        { message: 'Budget deleted successfully' },
        { status: 200 }
      )
    } catch (error: any) {
      // Si le budget n'existe pas
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Budget not found', code: 'BUDGET_NOT_FOUND' },
          { status: 404 }
        )
      }
      throw error
    }
  } catch (error: any) {
    logger.error('DELETE /api/advisor/clients/[id]/budget error:', { error: error instanceof Error ? error.message : String(error) })

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
