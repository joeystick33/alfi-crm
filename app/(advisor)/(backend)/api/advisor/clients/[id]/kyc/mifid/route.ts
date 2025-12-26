/**
 * API Route: /api/advisor/clients/[id]/kyc/mifid
 * PUT - Met à jour le profil MiFID II d'un client
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'

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

    // Mettre à jour les champs MiFID II
    const updated = await prisma.client.update({
      where: { id: clientId },
      data: {
        riskProfile: body.riskProfile,
        investmentHorizon: body.investmentHorizon,
        investmentGoals: body.investmentGoals,
        investmentKnowledge: body.investmentKnowledge,
        investmentExperience: body.investmentExperience,
        kycNextReviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
      select: {
        id: true,
        riskProfile: true,
        investmentHorizon: true,
        investmentGoals: true,
        investmentKnowledge: true,
        investmentExperience: true,
        kycNextReviewDate: true,
      },
    })

    return createSuccessResponse({
      mifid: updated,
      message: 'Profil MiFID II mis à jour',
    })
  } catch (error: any) {
    console.error('Error updating MiFID profile:', error)

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
        riskProfile: true,
        investmentHorizon: true,
        investmentGoals: true,
        investmentKnowledge: true,
        investmentExperience: true,
        kycNextReviewDate: true,
      },
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    return createSuccessResponse({ mifid: client })
  } catch (error: any) {
    console.error('Error getting MiFID profile:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
