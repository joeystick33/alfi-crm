/**
 * API Route: /api/advisor/clients/[id]/taxation/data
 * Returns complete FiscaliteData for Client360 TabFiscalite
 * Next.js 15 App Router - Route Handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { buildFiscaliteData } from '@/app/_common/lib/services/taxation-data-service'
import type { TaxSimulation } from '@/app/_common/types/client360'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// GET /api/advisor/clients/[id]/taxation/data
// Returns complete FiscaliteData for Client360 TabFiscalite
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

    // Fetch client with all related data
    const client = await prisma.client.findFirst({
      where: {
        id,
        cabinetId: context.cabinetId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        maritalStatus: true,
        numberOfChildren: true,
        annualIncome: true,
        taxBracket: true,
        ifiSubject: true,
        ifiAmount: true,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found', code: 'CLIENT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Fetch budget data
    const budget = await prisma.clientBudget.findUnique({
      where: { clientId: id },
      select: {
        professionalIncome: true,
        assetIncome: true,
        spouseIncome: true,
        retirementPensions: true,
        allowances: true,
      },
    })

    // Fetch taxation data
    const taxation = await prisma.clientTaxation.findUnique({
      where: { clientId: id },
      select: {
        anneeFiscale: true,
        incomeTax: true,
        ifi: true,
        socialContributions: true,
      },
    })

    // Fetch real estate assets for IFI calculation
    const clientActifs = await prisma.clientActif.findMany({
      where: { clientId: id },
      include: {
        actif: {
          select: {
            id: true,
            name: true,
            category: true,
            value: true,
            fiscalPropertyType: true,
            fiscalRpAbatement: true,
            fiscalManualDiscount: true,
            fiscalIfiValue: true,
          },
        },
      },
    })

    // Fetch tax optimizations
    const optimizations = await prisma.taxOptimization.findMany({
      where: { clientId: id },
      select: {
        id: true,
        category: true,
        title: true,
        description: true,
        potentialSavings: true,
        status: true,
      },
    })

    // Transform data for the service
    const rawClient = {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      maritalStatus: client.maritalStatus || undefined,
      numberOfChildren: client.numberOfChildren || undefined,
      annualIncome: client.annualIncome ? Number(client.annualIncome) : undefined,
      taxBracket: client.taxBracket || undefined,
      ifiSubject: client.ifiSubject,
      ifiAmount: client.ifiAmount ? Number(client.ifiAmount) : undefined,
    }

    const rawBudget = budget ? {
      professionalIncome: budget.professionalIncome as Record<string, unknown>,
      assetIncome: budget.assetIncome as Record<string, unknown>,
      spouseIncome: budget.spouseIncome as Record<string, unknown>,
      retirementPensions: budget.retirementPensions as Record<string, unknown>,
      allowances: budget.allowances as Record<string, unknown>,
    } : null

    const rawTaxation = taxation ? {
      anneeFiscale: taxation.anneeFiscale,
      incomeTax: taxation.incomeTax as Record<string, unknown>,
      ifi: taxation.ifi as Record<string, unknown>,
      socialContributions: taxation.socialContributions as Record<string, unknown>,
    } : null

    const rawAssets = clientActifs.map(ca => ({
      id: ca.actif.id,
      name: ca.actif.name,
      category: ca.actif.category,
      value: Number(ca.actif.value),
      fiscalPropertyType: ca.actif.fiscalPropertyType,
      fiscalRpAbatement: ca.actif.fiscalRpAbatement,
      fiscalManualDiscount: ca.actif.fiscalManualDiscount ? Number(ca.actif.fiscalManualDiscount) : null,
      fiscalIfiValue: ca.actif.fiscalIfiValue ? Number(ca.actif.fiscalIfiValue) : null,
    }))

    const rawOptimizations = optimizations.map(opt => ({
      id: opt.id,
      category: opt.category,
      title: opt.title,
      description: opt.description,
      potentialSavings: opt.potentialSavings ? Number(opt.potentialSavings) : null,
      status: opt.status,
    }))

    // Build simulations (empty for now - can be extended)
    const simulations: TaxSimulation[] = []

    // Build complete FiscaliteData
    const fiscaliteData = buildFiscaliteData(
      rawClient,
      rawBudget,
      rawTaxation,
      rawAssets,
      rawOptimizations,
      simulations
    )

    return NextResponse.json({ data: fiscaliteData }, { status: 200 })
  } catch (error: any) {
    logger.error('GET /api/advisor/clients/[id]/taxation/data error:', { error: error instanceof Error ? error.message : String(error) })

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/advisor/clients/[id]/taxation/data
// Updates taxation data for a client (IR, IFI, social contributions)
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id } = await params
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Vérifier que le client existe
    const client = await prisma.client.findFirst({
      where: {
        id,
        cabinetId: context.cabinetId,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found', code: 'CLIENT_NOT_FOUND' },
        { status: 404 }
      )
    }

    const body = await request.json()

    // Upsert ClientTaxation
    const taxation = await prisma.clientTaxation.upsert({
      where: { clientId: id },
      update: {
        anneeFiscale: body.anneeFiscale || new Date().getFullYear(),
        incomeTax: body.ir || body.incomeTax || {},
        ifi: body.ifi || {},
        socialContributions: body.socialContributions || {},
      },
      create: {
        clientId: id,
        anneeFiscale: body.anneeFiscale || new Date().getFullYear(),
        incomeTax: body.ir || body.incomeTax || {},
        ifi: body.ifi || {},
        socialContributions: body.socialContributions || {},
      },
    })

    // Mettre à jour les champs client si fournis
    if (body.taxBracket !== undefined || body.ifiSubject !== undefined || body.ifiAmount !== undefined) {
      await prisma.client.update({
        where: { id },
        data: {
          ...(body.taxBracket !== undefined && { taxBracket: body.taxBracket }),
          ...(body.ifiSubject !== undefined && { ifiSubject: body.ifiSubject }),
          ...(body.ifiAmount !== undefined && { ifiAmount: body.ifiAmount }),
        },
      })
    }

    return NextResponse.json({
      data: taxation,
      message: 'Données fiscales mises à jour',
    }, { status: 200 })
  } catch (error: any) {
    logger.error('PUT /api/advisor/clients/[id]/taxation/data error:', { error: error instanceof Error ? error.message : String(error) })

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
