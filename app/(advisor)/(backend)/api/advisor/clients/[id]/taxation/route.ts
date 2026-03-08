 
/**
 * API Route: /api/advisor/clients/[id]/taxation
 * Gestion de la fiscalité client (CRUD)
 * Next.js 15 App Router - Route Handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { clientTaxationSchema } from '@/app/_common/lib/validation-schemas'
import { ZodError } from 'zod'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// GET /api/advisor/clients/[id]/taxation
// Récupère la fiscalité d'un client
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

    // Récupérer la fiscalité
    const taxation = await prisma.clientTaxation.findUnique({
      where: { clientId: id },
    })

    // Si pas de fiscalité, retourner données par défaut
    if (!taxation) {
      return NextResponse.json({ 
        data: { 
          anneeFiscale: new Date().getFullYear(),
          incomeTax: null,
          ifi: null,
          socialContributions: null
        } 
      }, { status: 200 })
    }

    return NextResponse.json({ data: taxation }, { status: 200 })
  } catch (error: any) {
    logger.error('GET /api/advisor/clients/[id]/taxation error:', { error: error instanceof Error ? error.message : String(error) })

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
// POST /api/advisor/clients/[id]/taxation
// Crée la fiscalité d'un client (si n'existe pas déjà)
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

    // Vérifier que la fiscalité n'existe pas déjà
    const existingTaxation = await prisma.clientTaxation.findUnique({
      where: { clientId: id },
    })

    if (existingTaxation) {
      return NextResponse.json(
        {
          error: 'Taxation already exists for this client',
          code: 'TAXATION_ALREADY_EXISTS',
        },
        { status: 409 }
      )
    }

    // Parser et valider le body
    const body = await request.json()
    const validated = clientTaxationSchema.parse(body)

    // Créer la fiscalité
    const taxation = await prisma.clientTaxation.create({
      data: {
        clientId: id,
        anneeFiscale: validated.anneeFiscale,
        incomeTax: validated.incomeTax || null,
        ifi: validated.ifi || null,
        socialContributions: validated.socialContributions || null,
      },
    })

    return NextResponse.json({ data: taxation }, { status: 201 })
  } catch (error: any) {
    logger.error('POST /api/advisor/clients/[id]/taxation error:', { error: error instanceof Error ? error.message : String(error) })

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
// PATCH /api/advisor/clients/[id]/taxation
// Met à jour la fiscalité d'un client (upsert)
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
    const validated = clientTaxationSchema.parse(body)

    // Upsert (créer ou mettre à jour)
    const taxation = await prisma.clientTaxation.upsert({
      where: { clientId: id },
      create: {
        clientId: id,
        anneeFiscale: validated.anneeFiscale,
        incomeTax: validated.incomeTax || null,
        ifi: validated.ifi || null,
        socialContributions: validated.socialContributions || null,
      },
      update: {
        anneeFiscale: validated.anneeFiscale,
        incomeTax: validated.incomeTax || null,
        ifi: validated.ifi || null,
        socialContributions: validated.socialContributions || null,
      },
    })

    return NextResponse.json({ data: taxation }, { status: 200 })
  } catch (error: any) {
    logger.error('PATCH /api/advisor/clients/[id]/taxation error:', { error: error instanceof Error ? error.message : String(error) })

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
// DELETE /api/advisor/clients/[id]/taxation
// Supprime la fiscalité d'un client
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

    // Supprimer la fiscalité (si existe)
    try {
      await prisma.clientTaxation.delete({
        where: { clientId: id },
      })

      return NextResponse.json(
        { message: 'Taxation deleted successfully' },
        { status: 200 }
      )
    } catch (error: any) {
      // Si la fiscalité n'existe pas
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Taxation not found', code: 'TAXATION_NOT_FOUND' },
          { status: 404 }
        )
      }
      throw error
    }
  } catch (error: any) {
    logger.error('DELETE /api/advisor/clients/[id]/taxation error:', { error: error instanceof Error ? error.message : String(error) })

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
