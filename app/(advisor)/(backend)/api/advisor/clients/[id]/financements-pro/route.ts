/**
 * API Route: /api/advisor/clients/[id]/financements-pro
 * GET - Liste les financements pro d'un client
 * POST - Crée un nouveau financement pro
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { TypeFinancementPro } from '@prisma/client'

const createFinancementProSchema = z.object({
  type: z.nativeEnum(TypeFinancementPro),
  libelle: z.string().min(1),
  organisme: z.string().optional().nullable(),
  numeroContrat: z.string().optional().nullable(),
  montantInitial: z.number().min(0),
  capitalRestantDu: z.number().min(0),
  tauxInteret: z.number().optional().nullable(),
  mensualite: z.number().optional().nullable(),
  dateDebut: z.string().optional().nullable(),
  dateFin: z.string().optional().nullable(),
  dureeInitialeMois: z.number().optional().nullable(),
  garanties: z.any().optional(),
  objet: z.string().optional().nullable(),
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

    const financementsPro = await prisma.financementPro.findMany({
      where: { clientId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    const totalCapitalRestant = financementsPro.reduce(
      (sum, f) => sum + Number(f.capitalRestantDu), 0
    )
    const totalMensualites = financementsPro.reduce(
      (sum, f) => sum + Number(f.mensualite || 0), 0
    )

    return createSuccessResponse({
      financementsPro,
      count: financementsPro.length,
      totals: { totalCapitalRestant, totalMensualites },
    })
  } catch (error: any) {
    console.error('Error getting financements pro:', error)

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
    const validatedData = createFinancementProSchema.parse(body)

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId: context.cabinetId },
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    const financementPro = await prisma.financementPro.create({
      data: {
        cabinetId: context.cabinetId,
        clientId,
        ...validatedData,
        dateDebut: validatedData.dateDebut ? new Date(validatedData.dateDebut) : null,
        dateFin: validatedData.dateFin ? new Date(validatedData.dateFin) : null,
      },
    })

    return createSuccessResponse({
      financementPro,
      message: 'Financement pro créé avec succès',
    }, 201)
  } catch (error: any) {
    console.error('Error creating financement pro:', error)

    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error: ' + error.message, 400)
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
