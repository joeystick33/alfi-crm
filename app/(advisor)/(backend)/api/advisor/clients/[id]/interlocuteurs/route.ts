/**
 * API Route: /api/advisor/clients/[id]/interlocuteurs
 * GET - Liste les interlocuteurs d'un client professionnel
 * POST - Crée un nouvel interlocuteur
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { InterlocuteurRole } from '@prisma/client'

const createInterlocuteurSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().min(1),
  role: z.nativeEnum(InterlocuteurRole).default('AUTRE'),
  fonction: z.string().optional(),
  email: z.string().email().optional().nullable(),
  telephone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  isPrincipal: z.boolean().default(false),
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

    // Vérifier que le client existe
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: context.cabinetId,
      },
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    // Récupérer les interlocuteurs
    const interlocuteurs = await prisma.interlocuteur.findMany({
      where: {
        clientId,
        isActive: true,
      },
      orderBy: [
        { isPrincipal: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return createSuccessResponse({
      interlocuteurs,
      count: interlocuteurs.length,
    })
  } catch (error: any) {
    console.error('Error getting interlocuteurs:', error)

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
    const validatedData = createInterlocuteurSchema.parse(body)

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Vérifier que le client existe
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: context.cabinetId,
      },
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    // Si isPrincipal, retirer le statut principal des autres
    if (validatedData.isPrincipal) {
      await prisma.interlocuteur.updateMany({
        where: { clientId, isPrincipal: true },
        data: { isPrincipal: false },
      })
    }

    // Créer l'interlocuteur
    const interlocuteur = await prisma.interlocuteur.create({
      data: {
        cabinetId: context.cabinetId,
        clientId,
        ...validatedData,
      },
    })

    return createSuccessResponse({
      interlocuteur,
      message: 'Interlocuteur créé avec succès',
    }, 201)
  } catch (error: any) {
    console.error('Error creating interlocuteur:', error)

    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error: ' + error.message, 400)
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
