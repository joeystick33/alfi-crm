/**
 * API Route: /api/advisor/clients/[id]/protection-sociale-pro
 * GET - Liste la protection sociale pro d'un client
 * POST - Crée une nouvelle protection sociale pro
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { TypeProtectionSocialePro } from '@prisma/client'
import { logger } from '@/app/_common/lib/logger'
const createProtectionSocialeProSchema = z.object({
  type: z.nativeEnum(TypeProtectionSocialePro),
  libelle: z.string().min(1),
  assureur: z.string().optional().nullable(),
  numeroContrat: z.string().optional().nullable(),
  cotisationAnnuelle: z.number().optional().nullable(),
  partPatronale: z.number().optional().nullable(),
  partSalariale: z.number().optional().nullable(),
  garanties: z.any().optional(),
  beneficiaires: z.any().optional(),
  dateEffet: z.string().optional().nullable(),
  dateEcheance: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

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
      where: { id: clientId, cabinetId: context.cabinetId },
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    const protectionSocialePro = await prisma.protectionSocialePro.findMany({
      where: { clientId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    const totalCotisations = protectionSocialePro.reduce(
      (sum, p) => sum + Number(p.cotisationAnnuelle || 0), 0
    )

    return createSuccessResponse({
      protectionSocialePro,
      count: protectionSocialePro.length,
      totalCotisations,
    })
  } catch (error: any) {
    logger.error('Error getting protection sociale pro:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

export async function POST(
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
    const validatedData = createProtectionSocialeProSchema.parse(body)

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId: context.cabinetId },
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    const protectionSocialePro = await prisma.protectionSocialePro.create({
      data: {
        cabinetId: context.cabinetId,
        clientId,
        ...validatedData,
        dateEffet: validatedData.dateEffet ? new Date(validatedData.dateEffet) : null,
        dateEcheance: validatedData.dateEcheance ? new Date(validatedData.dateEcheance) : null,
      },
    })

    return createSuccessResponse({
      protectionSocialePro,
      message: 'Protection sociale créée avec succès',
    }, 201)
  } catch (error: any) {
    logger.error('Error creating protection sociale pro:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error: ' + error.message, 400)
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
