/**
 * API Route: /api/advisor/clients/[id]/epargne-salariale
 * GET - Liste l'épargne salariale d'un client
 * POST - Crée une nouvelle épargne salariale
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { TypeEpargneSalariale } from '@prisma/client'

const createEpargneSalarialeSchema = z.object({
  type: z.nativeEnum(TypeEpargneSalariale),
  libelle: z.string().min(1),
  organisme: z.string().optional().nullable(),
  employeur: z.string().optional().nullable(),
  montantVerse: z.number().min(0),
  montantActuel: z.number().min(0),
  montantAbonde: z.number().optional().nullable(),
  dateOuverture: z.string().optional().nullable(),
  dateDisponibilite: z.string().optional().nullable(),
  supports: z.any().optional(),
  performanceYTD: z.number().optional().nullable(),
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

    const epargneSalariale = await prisma.epargneSalariale.findMany({
      where: { clientId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    // Calculer les totaux
    const totalVerse = epargneSalariale.reduce((sum, e) => sum + Number(e.montantVerse), 0)
    const totalActuel = epargneSalariale.reduce((sum, e) => sum + Number(e.montantActuel), 0)

    return createSuccessResponse({
      epargneSalariale,
      count: epargneSalariale.length,
      totals: { totalVerse, totalActuel, plusValue: totalActuel - totalVerse },
    })
  } catch (error: any) {
    console.error('Error getting epargne salariale:', error)

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
    const validatedData = createEpargneSalarialeSchema.parse(body)

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId: context.cabinetId },
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    const epargneSalariale = await prisma.epargneSalariale.create({
      data: {
        cabinetId: context.cabinetId,
        clientId,
        ...validatedData,
        dateOuverture: validatedData.dateOuverture ? new Date(validatedData.dateOuverture) : null,
        dateDisponibilite: validatedData.dateDisponibilite ? new Date(validatedData.dateDisponibilite) : null,
      },
    })

    return createSuccessResponse({
      epargneSalariale,
      message: 'Épargne salariale créée avec succès',
    }, 201)
  } catch (error: any) {
    console.error('Error creating epargne salariale:', error)

    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error: ' + error.message, 400)
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
