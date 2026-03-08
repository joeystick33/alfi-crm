/**
 * API Route: /api/advisor/clients/[id]/interlocuteurs/[interlocuteurId]
 * GET - Récupère un interlocuteur spécifique
 * PUT - Met à jour un interlocuteur
 * DELETE - Supprime un interlocuteur
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { InterlocuteurRole } from '@prisma/client'
import { logger } from '@/app/_common/lib/logger'
const updateInterlocuteurSchema = z.object({
  nom: z.string().min(1).optional(),
  prenom: z.string().min(1).optional(),
  role: z.nativeEnum(InterlocuteurRole).optional(),
  fonction: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  telephone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  isPrincipal: z.boolean().optional(),
  notes: z.string().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; interlocuteurId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId, interlocuteurId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const interlocuteur = await prisma.interlocuteur.findFirst({
      where: {
        id: interlocuteurId,
        clientId,
        cabinetId: context.cabinetId,
      },
    })

    if (!interlocuteur) {
      return createErrorResponse('Interlocuteur not found', 404)
    }

    return createSuccessResponse({ interlocuteur })
  } catch (error: any) {
    logger.error('Error getting interlocuteur:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; interlocuteurId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId, interlocuteurId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const validatedData = updateInterlocuteurSchema.parse(body)

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Vérifier que l'interlocuteur existe
    const existing = await prisma.interlocuteur.findFirst({
      where: {
        id: interlocuteurId,
        clientId,
        cabinetId: context.cabinetId,
      },
    })

    if (!existing) {
      return createErrorResponse('Interlocuteur not found', 404)
    }

    // Si isPrincipal, retirer le statut principal des autres
    if (validatedData.isPrincipal) {
      await prisma.interlocuteur.updateMany({
        where: { clientId, isPrincipal: true, id: { not: interlocuteurId } },
        data: { isPrincipal: false },
      })
    }

    const interlocuteur = await prisma.interlocuteur.update({
      where: { id: interlocuteurId },
      data: validatedData,
    })

    return createSuccessResponse({
      interlocuteur,
      message: 'Interlocuteur mis à jour',
    })
  } catch (error: any) {
    logger.error('Error updating interlocuteur:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error: ' + error.message, 400)
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; interlocuteurId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId, interlocuteurId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Vérifier que l'interlocuteur existe
    const existing = await prisma.interlocuteur.findFirst({
      where: {
        id: interlocuteurId,
        clientId,
        cabinetId: context.cabinetId,
      },
    })

    if (!existing) {
      return createErrorResponse('Interlocuteur not found', 404)
    }

    // Soft delete
    await prisma.interlocuteur.update({
      where: { id: interlocuteurId },
      data: { isActive: false },
    })

    return createSuccessResponse({
      success: true,
      message: 'Interlocuteur supprimé',
    })
  } catch (error: any) {
    logger.error('Error deleting interlocuteur:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
