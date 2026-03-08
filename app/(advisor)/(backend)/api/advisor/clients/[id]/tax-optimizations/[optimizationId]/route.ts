 
/**
 * API Route: /api/advisor/clients/[id]/tax-optimizations/[optimizationId]
 * Gestion individuelle d'une optimisation fiscale (GET, PATCH, DELETE)
 * Next.js 14 App Router - Route Handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import { taxOptimizationSchema } from '@/app/_common/lib/validation-schemas'
import { ZodError } from 'zod'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// GET /api/advisor/clients/[id]/tax-optimizations/[optimizationId]
// Récupère une optimisation fiscale spécifique
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optimizationId: string }> }
) {
  try {
    const { id: clientId, optimizationId } = await params
    // Authentification requise
    const context = await requireAuth()

    // Récupérer l'optimisation
    const optimization = await prisma.taxOptimization.findFirst({
      where: {
        id: optimizationId,
        clientId,
        client: {
          cabinetId: context.cabinetId,
        },
      },
    })

    if (!optimization) {
      return NextResponse.json(
        {
          error: 'Tax optimization not found',
          code: 'OPTIMIZATION_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: optimization }, { status: 200 })
  } catch (error: any) {
    logger.error(
      'GET /api/advisor/clients/[id]/tax-optimizations/[optimizationId] error:',
      error
    )

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
// PATCH /api/advisor/clients/[id]/tax-optimizations/[optimizationId]
// Met à jour une optimisation fiscale (changer statut, reviewer, etc.)
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optimizationId: string }> }
) {
  try {
    const { id: clientId, optimizationId } = await params
    // Authentification requise
    const context = await requireAuth()

    // Vérifier que l'optimisation existe et appartient au client
    const existing = await prisma.taxOptimization.findFirst({
      where: {
        id: optimizationId,
        clientId,
        client: {
          cabinetId: context.cabinetId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        {
          error: 'Tax optimization not found',
          code: 'OPTIMIZATION_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // Parser et valider le body
    const body = await request.json()
    const validated = taxOptimizationSchema.parse(body)

    // Préparer les données de mise à jour
    const updateData: any = {
      priority: validated.priority,
      category: validated.category,
      title: validated.title,
      description: validated.description,
      potentialSavings: validated.potentialSavings,
      recommendation: validated.recommendation,
      status: validated.status,
      reviewedBy: validated.reviewedBy,
      dismissReason: validated.dismissReason,
    }

    // Gérer les dates selon le statut
    if (validated.status === 'DETECTEE' && !existing.reviewedAt) {
      updateData.reviewedAt = new Date()
    }
    if (validated.status === 'APPLIQUEE' && !existing.completedAt) {
      updateData.completedAt = new Date()
    }
    if (validated.status === 'REJETEE' && !existing.dismissedAt) {
      updateData.dismissedAt = new Date()
    }

    // Mettre à jour l'optimisation
    const optimization = await prisma.taxOptimization.update({
      where: { id: optimizationId },
      data: updateData,
    })

    return NextResponse.json({ data: optimization }, { status: 200 })
  } catch (error: any) {
    logger.error(
      'PATCH /api/advisor/clients/[id]/tax-optimizations/[optimizationId] error:',
      error
    )

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
// DELETE /api/advisor/clients/[id]/tax-optimizations/[optimizationId]
// Supprime une optimisation fiscale
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; optimizationId: string }> }
) {
  try {
    const { id: clientId, optimizationId } = await params
    // Authentification requise
    const context = await requireAuth()

    // Vérifier que l'optimisation existe et appartient au client
    const existing = await prisma.taxOptimization.findFirst({
      where: {
        id: optimizationId,
        clientId,
        client: {
          cabinetId: context.cabinetId,
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        {
          error: 'Tax optimization not found',
          code: 'OPTIMIZATION_NOT_FOUND',
        },
        { status: 404 }
      )
    }

    // Supprimer l'optimisation
    await prisma.taxOptimization.delete({
      where: { id: optimizationId },
    })

    return NextResponse.json(
      { message: 'Tax optimization deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    logger.error(
      'DELETE /api/advisor/clients/[id]/tax-optimizations/[optimizationId] error:',
      error
    )

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
