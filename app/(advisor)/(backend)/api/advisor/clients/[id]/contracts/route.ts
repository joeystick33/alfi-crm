 
/**
 * API Route: /api/advisor/clients/[id]/contracts
 * Gestion des contrats client (GET, POST, PUT, DELETE)
 * Next.js 14 App Router
 * 
 * Requirements: 9.1, 9.4, 9.6
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
// Beneficiary schema
const beneficiarySchema = z.object({
  name: z.string().min(1),
  percentage: z.number().min(0).max(100),
  clause: z.string().optional().default('')
})

// Fees schema
const feesSchema = z.object({
  entryFee: z.number().min(0).optional().default(0),
  managementFee: z.number().min(0).optional().default(0),
  arbitrageFee: z.number().min(0).optional().default(0)
})

// Versement schema
const versementSchema = z.object({
  date: z.string(),
  amount: z.number().min(0),
  type: z.enum(['INITIAL', 'PLANIFIE', 'EXCEPTIONAL']).default('EXCEPTIONAL')
})

const contractSchema = z.object({
  type: z.enum(['ASSURANCE_VIE', 'MUTUELLE', 'ASSURANCE_HABITATION', 'ASSURANCE_AUTO', 
                'ASSURANCE_PRO', 'ASSURANCE_DECES', 'PREVOYANCE', 
                'EPARGNE_RETRAITE', 'AUTRE']),
  name: z.string().min(1),
  provider: z.string().min(1),
  contractNumber: z.string().optional(),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  value: z.number().optional().default(0),
  premium: z.number().optional(),
  coverage: z.number().optional(),
  beneficiaries: z.array(beneficiarySchema).optional().default([]),
  fees: feesSchema.optional(),
  versements: z.array(versementSchema).optional().default([]),
  isManaged: z.boolean().default(false),
  status: z.enum(['ACTIF', 'SUSPENDU', 'RESILIE', 'EXPIRE']).default('ACTIF'),
  details: z.any().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: clientId } = await params
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId: context.cabinetId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé', code: 'NOT_FOUND' }, { status: 404 })
    }

    const contracts = await prisma.contrat.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    })

    // Transform contracts for Client 360 format
    const transformedContracts = contracts.map(c => {
      const details = (c.details || {}) as Record<string, any>
      return {
        id: c.id,
        type: c.type,
        provider: c.provider,
        name: c.name,
        contractNumber: c.contractNumber,
        value: c.value ? Number(c.value) : 0,
        premium: c.premium ? Number(c.premium) : null,
        coverage: c.coverage ? Number(c.coverage) : null,
        beneficiaries: c.beneficiaries || [],
        fees: details.fees || { entryFee: 0, managementFee: 0, arbitrageFee: 0 },
        performance: details.performance || 0,
        versements: details.versements || [],
        status: c.status,
        isManaged: details.isManaged ?? false,
        openDate: c.startDate?.toISOString() || '',
        endDate: c.endDate?.toISOString() || null,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }
    })

    // Calculate stats by type
    const byType = {
      LIFE_INSURANCE: { count: 0, totalValue: 0 },
      RETIREMENT_SAVINGS: { count: 0, totalValue: 0 },
      HEALTH_INSURANCE: { count: 0, totalValue: 0 },
      DEATH_INSURANCE: { count: 0, totalValue: 0 },
      DISABILITY_INSURANCE: { count: 0, totalValue: 0 },
      OTHER: { count: 0, totalValue: 0 }
    }

    for (const c of transformedContracts) {
      const typeKey = c.type as keyof typeof byType
      if (byType[typeKey]) {
        byType[typeKey].count++
        byType[typeKey].totalValue += c.value
      } else {
        byType.OTHER.count++
        byType.OTHER.totalValue += c.value
      }
    }

    const stats = {
      total: contracts.length,
      managed: transformedContracts.filter(c => c.isManaged).length,
      nonManaged: transformedContracts.filter(c => !c.isManaged).length,
      byType,
      totalValue: transformedContracts.reduce((s, c) => s + c.value, 0),
    }

    return NextResponse.json({
      success: true,
      data: transformedContracts,
      stats,
    })

  } catch (error) {
    logger.error('Erreur GET /contracts:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: clientId } = await params
    const body = await request.json()
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const validation = contractSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        error: 'Données invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.flatten().fieldErrors,
      }, { status: 400 })
    }

    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId: context.cabinetId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé', code: 'NOT_FOUND' }, { status: 404 })
    }

    const { beneficiaries, fees, versements, ...contractData } = validation.data

    const contract = await prisma.contrat.create({
      data: {
        client: { connect: { id: clientId } },
        cabinet: { connect: { id: context.cabinetId } },
        type: contractData.type,
        name: contractData.name,
        provider: contractData.provider,
        contractNumber: contractData.contractNumber,
        startDate: contractData.startDate,
        endDate: contractData.endDate,
        premium: contractData.premium,
        coverage: contractData.coverage,
        value: contractData.value,
        status: contractData.status,
        beneficiaries: beneficiaries || [],
        details: {
          fees: fees || { entryFee: 0, managementFee: 0, arbitrageFee: 0 },
          versements: versements || [],
          performance: 0
        }
      },
    })

    return NextResponse.json({
      success: true,
      data: contract,
      message: 'Contrat créé avec succès',
    }, { status: 201 })

  } catch (error) {
    logger.error('Erreur POST /contracts:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: clientId } = await params
    const body = await request.json()
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const { contractId, ...updateData } = body

    if (!contractId) {
      return NextResponse.json({
        error: 'ID du contrat requis',
        code: 'VALIDATION_ERROR',
      }, { status: 400 })
    }

    // Verify client exists
    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId: context.cabinetId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé', code: 'NOT_FOUND' }, { status: 404 })
    }

    // Verify contract exists and belongs to client
    const existingContract = await prisma.contrat.findFirst({
      where: { id: contractId, clientId, cabinetId: context.cabinetId },
    })

    if (!existingContract) {
      return NextResponse.json({ error: 'Contrat non trouvé', code: 'NOT_FOUND' }, { status: 404 })
    }

    const { beneficiaries, fees, versements, ...contractData } = updateData

    // Build update data
    const updatePayload: any = { ...contractData }
    
    if (beneficiaries !== undefined) {
      updatePayload.beneficiaries = beneficiaries
    }
    
    if (fees !== undefined || versements !== undefined) {
      const existingDetails = (existingContract.details || {}) as Record<string, any>
      updatePayload.details = {
        ...existingDetails,
        ...(fees !== undefined && { fees }),
        ...(versements !== undefined && { versements })
      }
    }

    const contract = await prisma.contrat.update({
      where: { id: contractId },
      data: updatePayload,
    })

    return NextResponse.json({
      success: true,
      data: contract,
      message: 'Contrat mis à jour avec succès',
    })

  } catch (error) {
    logger.error('Erreur PUT /contracts:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: clientId } = await params
    const { searchParams } = new URL(request.url)
    const contractId = searchParams.get('contractId')
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    if (!contractId) {
      return NextResponse.json({
        error: 'ID du contrat requis',
        code: 'VALIDATION_ERROR',
      }, { status: 400 })
    }

    // Verify client exists
    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId: context.cabinetId },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé', code: 'NOT_FOUND' }, { status: 404 })
    }

    // Verify contract exists and belongs to client
    const existingContract = await prisma.contrat.findFirst({
      where: { id: contractId, clientId, cabinetId: context.cabinetId },
    })

    if (!existingContract) {
      return NextResponse.json({ error: 'Contrat non trouvé', code: 'NOT_FOUND' }, { status: 404 })
    }

    await prisma.contrat.delete({
      where: { id: contractId },
    })

    return NextResponse.json({
      success: true,
      message: 'Contrat supprimé avec succès',
    })

  } catch (error) {
    logger.error('Erreur DELETE /contracts:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json({ error: 'Erreur serveur', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
