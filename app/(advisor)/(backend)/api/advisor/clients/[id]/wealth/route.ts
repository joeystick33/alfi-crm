import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { WealthCalculationService } from '@/app/_common/lib/services/wealth-calculation'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import type { WealthSummary } from '@/app/_common/lib/api-types'

/**
 * Transforms wealth data from service format to API response format
 */
interface WealthData {
  totalAssets: number
  totalLiabilities: number
  netWealth: number
  managedAssets: number
  unmanagedAssets: number
  breakdown?: { immobilier: number; financier: number; professionnel: number; autre: number }
  lastCalculated?: Date
}

interface ActifData {
  type: string
  value: number
}

function transformWealthToSummary(
  wealthData: WealthData,
  actifs: ActifData[],
  totalAssets: number
): WealthSummary {
  // Calculate debt ratio
  const debtRatio = totalAssets > 0
    ? (wealthData.totalLiabilities / totalAssets) * 100
    : 0

  // Build allocation by type from actifs
  const typeMap = new Map<string, number>()
  for (const actif of actifs) {
    const type = actif.type || 'AUTRE'
    const value = Number(actif.value) || 0
    typeMap.set(type, (typeMap.get(type) || 0) + value)
  }

  const allocationByType = Array.from(typeMap.entries()).map(([type, value]) => ({
    type: type as any,
    value,
    percentage: totalAssets > 0 ? (value / totalAssets) * 100 : 0
  }))

  // Build allocation by category from breakdown
  const breakdown = wealthData.breakdown || {
    immobilier: 0,
    financier: 0,
    professionnel: 0,
    autre: 0
  }

  const allocationByCategory = [
    { category: 'IMMOBILIER' as const, value: breakdown.immobilier, percentage: totalAssets > 0 ? (breakdown.immobilier / totalAssets) * 100 : 0 },
    { category: 'FINANCIER' as const, value: breakdown.financier, percentage: totalAssets > 0 ? (breakdown.financier / totalAssets) * 100 : 0 },
    { category: 'PROFESSIONNEL' as const, value: breakdown.professionnel, percentage: totalAssets > 0 ? (breakdown.professionnel / totalAssets) * 100 : 0 },
    { category: 'AUTRE' as const, value: breakdown.autre, percentage: totalAssets > 0 ? (breakdown.autre / totalAssets) * 100 : 0 }
  ].filter(item => item.value > 0)

  return {
    totalActifs: wealthData.totalAssets,
    totalPassifs: wealthData.totalLiabilities,
    patrimoineNet: wealthData.netWealth,
    patrimoineGere: wealthData.managedAssets,
    patrimoineNonGere: wealthData.unmanagedAssets,
    allocationByType,
    allocationByCategory,
    debtRatio,
    lastCalculated: wealthData.lastCalculated?.toISOString() || new Date().toISOString()
  }
}

/**
 * GET /api/advisor/clients/[id]/wealth
 * Récupère le patrimoine d'un client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id } = await params
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Get client with actifs for allocation calculation
    const client = await prisma.client.findFirst({
      where: { id, cabinetId: context.cabinetId },
      include: {
        actifs: {
          include: { actif: true }
        }
      }
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    const wealthService = new WealthCalculationService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const wealthData = await wealthService.calculateClientWealth(id)

    // Transform actifs for allocation calculation
    const actifs = client.actifs.map((ca: { actif: { type: string; value: { toNumber: () => number } }; ownershipPercentage: { toNumber: () => number } }) => ({
      type: ca.actif.type,
      value: ca.actif.value.toNumber() * (ca.ownershipPercentage.toNumber() / 100)
    }))

    const wealthSummary = transformWealthToSummary(
      wealthData,
      actifs,
      wealthData.totalAssets
    )

    return createSuccessResponse(wealthSummary)
  } catch (error: unknown) {
    console.error('Get client wealth error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/clients/[id]/wealth/recalculate
 * Recalcule le patrimoine d'un client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id } = await params
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Get client with actifs for allocation calculation
    const client = await prisma.client.findFirst({
      where: { id, cabinetId: context.cabinetId },
      include: {
        actifs: {
          include: { actif: true }
        }
      }
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    const wealthService = new WealthCalculationService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const wealthData = await wealthService.calculateClientWealth(id)

    // Transform actifs for allocation calculation
    const actifs = client.actifs.map((ca: { actif: { type: string; value: { toNumber: () => number } }; ownershipPercentage: { toNumber: () => number } }) => ({
      type: ca.actif.type,
      value: ca.actif.value.toNumber() * (ca.ownershipPercentage.toNumber() / 100)
    }))

    const wealthSummary = transformWealthToSummary(
      wealthData,
      actifs,
      wealthData.totalAssets
    )

    return createSuccessResponse({
      wealth: wealthSummary,
      message: 'Wealth recalculated successfully',
    })
  } catch (error: unknown) {
    console.error('Recalculate wealth error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
