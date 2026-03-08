/**
 * API Route for Affaires En Cours
 * 
 * GET /api/v1/operations/affaires/en-cours - Get affaires that need attention
 * 
 * @requirements 20.1-20.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import { checkAffaireBlocking } from '@/lib/operations/services/operation-blocking-service'
import {
  AFFAIRE_EN_COURS_STATUSES,
  getAffaireInactivityCategory,
  type InactivityCategory,
  type ProductType,
} from '@/lib/operations/types'

/**
 * GET /api/v1/operations/affaires/en-cours
 * Get affaires that are inactive or need attention
 * 
 * @requirements 20.1 - THE Operations_Manager SHALL automatically categorize an Affaire Nouvelle as "En Cours"
 * @requirements 20.2 - THE Operations_Manager SHALL display "Affaires En Cours" in a dedicated dashboard section
 */
export async function GET(request: NextRequest) {
  try {
    const { cabinetId } = await requireAuth(request)

    if (!cabinetId) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 400 }
      )
    }

    // Parse optional filters
    const { searchParams } = new URL(request.url)

    const clientId = searchParams.get('clientId') || undefined
    const providerId = searchParams.get('providerId') || undefined
    const productType = searchParams.getAll('productType') as ProductType[]
    const inactivityCategory = searchParams.getAll('inactivityCategory') as InactivityCategory[]

    const daysInactiveParam = searchParams.get('daysInactive')
    const daysInactive = daysInactiveParam ? parseInt(daysInactiveParam, 10) : 0

    if (isNaN(daysInactive) || daysInactive < 0) {
      return NextResponse.json(
        { error: 'Le paramètre daysInactive doit être un nombre positif' },
        { status: 400 }
      )
    }

    const affaires = await prisma.affaireNouvelle.findMany({
      where: {
        cabinetId,
        status: { in: [...AFFAIRE_EN_COURS_STATUSES] as any },
        ...(clientId ? { clientId } : {}),
        ...(providerId ? { providerId } : {}),
        ...(productType.length > 0 ? { productType: { in: productType as any } } : {}),
      },
      orderBy: { lastActivityAt: 'asc' },
    })

    const now = new Date()

    const toNumber = (value: unknown): number | null => {
      if (value === null || value === undefined) return null
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const n = Number(value)
        return Number.isFinite(n) ? n : null
      }
      const anyVal = value as any
      if (typeof anyVal?.toNumber === 'function') {
        try {
          return anyVal.toNumber()
        } catch {
          return null
        }
      }
      const n = Number(value)
      return Number.isFinite(n) ? n : null
    }

    const enriched = await Promise.all(
      affaires.map(async (a) => {
        const daysSinceActivity = Math.floor(
          (now.getTime() - new Date(a.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24)
        )

        const computedCategory = getAffaireInactivityCategory(new Date(a.lastActivityAt), now)

        const blockingResult = await checkAffaireBlocking(
          cabinetId,
          a.clientId,
          a.productType as any,
          a.id
        )

        const blockingIssues = blockingResult.data?.blockingReasons?.map((r) => r.description) ?? []
        const missingDocumentsCount = blockingResult.data?.missingDocuments?.length ?? 0

        return {
          ...a,
          estimatedAmount: toNumber((a as any).estimatedAmount) ?? 0,
          actualAmount: toNumber((a as any).actualAmount),
          entryFees: toNumber((a as any).entryFees),
          managementFees: toNumber((a as any).managementFees),
          expectedCommission: toNumber((a as any).expectedCommission),
          daysSinceActivity,
          inactivityCategory: computedCategory,
          missingDocumentsCount,
          blockingIssues,
        }
      })
    )

    const filtered = enriched
      .filter((a) => (daysInactive > 0 ? a.daysSinceActivity >= daysInactive : true))
      .filter((a) => (inactivityCategory.length > 0 ? inactivityCategory.includes(a.inactivityCategory) : true))

    return NextResponse.json({ data: filtered })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
