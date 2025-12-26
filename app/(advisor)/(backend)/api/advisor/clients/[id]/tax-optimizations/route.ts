 
/**
 * API Route: /api/advisor/clients/[id]/tax-optimizations
 * Gestion des optimisations fiscales (CRUD)
 * Next.js 15 App Router - Route Handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { taxOptimizationSchema } from '@/app/_common/lib/validation-schemas'
import { ZodError } from 'zod'

// ============================================================================
// GET /api/advisor/clients/[id]/tax-optimizations
// Récupère toutes les optimisations fiscales d'un client
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

    // Récupérer les query params pour filtrage
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')

    // Construire le where clause
    const where: any = { clientId: id }
    if (status) {
      where.status = status
    }
    if (priority) {
      where.priority = priority
    }

    // Récupérer les optimisations
    const optimizations = await prisma.taxOptimization.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json({ data: optimizations }, { status: 200 })
  } catch (error: any) {
    console.error(
      'GET /api/advisor/clients/[id]/tax-optimizations error:',
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
// POST /api/advisor/clients/[id]/tax-optimizations
// Crée une optimisation fiscale pour un client
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

    // Parser et valider le body
    const body = await request.json()
    const validated = taxOptimizationSchema.parse(body)

    // Créer l'optimisation
    const optimization = await prisma.taxOptimization.create({
      data: {
        clientId: id,
        priority: validated.priority,
        category: validated.category,
        title: validated.title,
        description: validated.description,
        potentialSavings: validated.potentialSavings,
        recommendation: validated.recommendation,
        status: validated.status,
        reviewedBy: validated.reviewedBy,
        dismissReason: validated.dismissReason,
      },
    })

    return NextResponse.json({ data: optimization }, { status: 201 })
  } catch (error: any) {
    console.error(
      'POST /api/advisor/clients/[id]/tax-optimizations error:',
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
