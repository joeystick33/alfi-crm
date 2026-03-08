/**
 * API Route: /api/advisor/clients/[id]/kyc/lcbft
 * PUT - Met à jour les données LCB-FT d'un client
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Vérifier que le client existe et appartient au cabinet
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: context.cabinetId,
      },
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    // Mettre à jour les champs LCB-FT
    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        isPEP: body.isPEP ?? false,
        originOfFunds: body.originOfFunds,
        kycNextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      select: {
        id: true,
        isPEP: true,
        originOfFunds: true,
        kycNextReviewDate: true,
      },
    })

    return createSuccessResponse({
      lcbft: updated,
      message: 'Données LCB-FT mises à jour',
    })
  } catch (error: any) {
    logger.error('Error updating LCB-FT data:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: context.cabinetId,
      },
      select: {
        id: true,
        isPEP: true,
        originOfFunds: true,
        kycNextReviewDate: true,
      },
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    return createSuccessResponse({ lcbft: client })
  } catch (error: any) {
    logger.error('Error getting LCB-FT data:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
