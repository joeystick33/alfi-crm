/**
 * API Route: /api/advisor/clients/[id]/immobilier-pro
 * GET - Liste l'immobilier pro d'un client
 * POST - Crée un nouvel immobilier pro
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { TypeImmobilierPro, ModeDetentionPro } from '@prisma/client'
import { logger } from '@/app/_common/lib/logger'
const createImmobilierProSchema = z.object({
  type: z.nativeEnum(TypeImmobilierPro),
  libelle: z.string().min(1),
  adresse: z.any().optional(),
  surface: z.number().optional().nullable(),
  valeurAcquisition: z.number().min(0),
  dateAcquisition: z.string().optional().nullable(),
  valeurActuelle: z.number().min(0),
  modeDetention: z.nativeEnum(ModeDetentionPro).default('PLEINE_PROPRIETE'),
  quotiteDetention: z.number().min(0).max(100).default(100),
  loyerMensuel: z.number().optional().nullable(),
  chargesAnnuelles: z.number().optional().nullable(),
  taxeFonciere: z.number().optional().nullable(),
  locataire: z.string().optional().nullable(),
  bailType: z.string().optional().nullable(),
  bailEcheance: z.string().optional().nullable(),
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

    const immobilierPro = await prisma.immobilierPro.findMany({
      where: { clientId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    const totalValeurActuelle = immobilierPro.reduce(
      (sum, i) => sum + Number(i.valeurActuelle) * Number(i.quotiteDetention) / 100, 0
    )
    const totalLoyersMensuels = immobilierPro.reduce(
      (sum, i) => sum + Number(i.loyerMensuel || 0), 0
    )

    return createSuccessResponse({
      immobilierPro,
      count: immobilierPro.length,
      totals: { totalValeurActuelle, totalLoyersMensuels, totalLoyersAnnuels: totalLoyersMensuels * 12 },
    })
  } catch (error: any) {
    logger.error('Error getting immobilier pro:', { error: error instanceof Error ? error.message : String(error) })

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
    const validatedData = createImmobilierProSchema.parse(body)

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId: context.cabinetId },
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    const immobilierPro = await prisma.immobilierPro.create({
      data: {
        cabinetId: context.cabinetId,
        clientId,
        ...validatedData,
        dateAcquisition: validatedData.dateAcquisition ? new Date(validatedData.dateAcquisition) : null,
        bailEcheance: validatedData.bailEcheance ? new Date(validatedData.bailEcheance) : null,
      },
    })

    return createSuccessResponse({
      immobilierPro,
      message: 'Immobilier pro créé avec succès',
    }, 201)
  } catch (error: any) {
    logger.error('Error creating immobilier pro:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error: ' + error.message, 400)
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
