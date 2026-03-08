/**
 * API Route: Operations Stats
 * 
 * GET /api/v1/operations/stats
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

const AFFAIRE_STATUSES = [
  'PROSPECT',
  'QUALIFICATION',
  'CONSTITUTION',
  'SIGNATURE',
  'ENVOYE',
  'EN_TRAITEMENT',
  'VALIDE',
  'REJETE',
  'ANNULE',
] as const

const AFFAIRE_EN_COURS_STATUSES = ['QUALIFICATION', 'CONSTITUTION', 'SIGNATURE'] as const

const OPERATION_GESTION_STATUSES = [
  'BROUILLON',
  'EN_ATTENTE_SIGNATURE',
  'ENVOYE',
  'EN_TRAITEMENT',
  'EXECUTE',
  'REJETE',
] as const

const PRODUCT_TYPES = [
  'ASSURANCE_VIE',
  'PER_INDIVIDUEL',
  'PER_ENTREPRISE',
  'SCPI',
  'OPCI',
  'COMPTE_TITRES',
  'PEA',
  'PEA_PME',
  'CAPITALISATION',
  'FCPR',
  'FCPI',
  'FIP',
  'IMMOBILIER_DIRECT',
  'CREDIT_IMMOBILIER',
] as const

function initRecord<const T extends readonly string[]>(keys: T): Record<T[number], number> {
  return Object.fromEntries(keys.map((k) => [k, 0])) as Record<T[number], number>
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  // Prisma Decimal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyVal = value as any
  if (typeof anyVal?.toNumber === 'function') return anyVal.toNumber()
  return Number(value)
}

export async function GET(request: NextRequest) {
  try {
    const { cabinetId } = await requireAuth(request)

    if (!cabinetId) {
      return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 400 })
    }

    const [
      affairesByStatusRaw,
      operationsByStatusRaw,
      affairesEnCoursCount,
      pipelineSum,
      pipelineByProductTypeRaw,
    ] = await Promise.all([
      prisma.affaireNouvelle.groupBy({
        by: ['status'],
        where: { cabinetId },
        _count: true,
      }),
      prisma.operationGestion.groupBy({
        by: ['status'],
        where: { cabinetId },
        _count: true,
      }),
      prisma.affaireNouvelle.count({
        where: {
          cabinetId,
          status: { in: [...AFFAIRE_EN_COURS_STATUSES] as any },
        },
      }),
      prisma.affaireNouvelle.aggregate({
        where: {
          cabinetId,
          status: {
            in: [
              'PROSPECT',
              'QUALIFICATION',
              'CONSTITUTION',
              'SIGNATURE',
              'ENVOYE',
              'EN_TRAITEMENT',
            ] as any,
          },
        },
        _sum: { estimatedAmount: true },
      }),
      prisma.affaireNouvelle.groupBy({
        by: ['productType'],
        where: {
          cabinetId,
          status: {
            in: [
              'PROSPECT',
              'QUALIFICATION',
              'CONSTITUTION',
              'SIGNATURE',
              'ENVOYE',
              'EN_TRAITEMENT',
            ] as any,
          },
        },
        _sum: { estimatedAmount: true },
      }),
    ])

    const affairesNouvellesByStatus = initRecord(AFFAIRE_STATUSES)
    for (const row of affairesByStatusRaw) {
      const key = row.status as (typeof AFFAIRE_STATUSES)[number]
      if (key in affairesNouvellesByStatus) {
        affairesNouvellesByStatus[key] = row._count
      }
    }

    const operationsGestionByStatus = initRecord(OPERATION_GESTION_STATUSES)
    for (const row of operationsByStatusRaw) {
      const key = row.status as (typeof OPERATION_GESTION_STATUSES)[number]
      if (key in operationsGestionByStatus) {
        operationsGestionByStatus[key] = row._count
      }
    }

    const pipelineByProductType = initRecord(PRODUCT_TYPES)
    for (const row of pipelineByProductTypeRaw) {
      const key = row.productType as (typeof PRODUCT_TYPES)[number]
      if (key in pipelineByProductType) {
        pipelineByProductType[key] = toNumber(row._sum.estimatedAmount)
      }
    }

    const response = {
      affairesNouvellesByStatus,
      affairesEnCoursCount,
      operationsGestionByStatus,
      totalPipelineValue: toNumber(pipelineSum._sum.estimatedAmount),
      pipelineByProductType,
    }

    return NextResponse.json({ data: response })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
