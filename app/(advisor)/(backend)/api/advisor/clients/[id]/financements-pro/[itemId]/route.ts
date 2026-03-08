/**
 * API Route: /api/advisor/clients/[id]/financements-pro/[itemId]
 * GET, PUT, DELETE - Gestion individuelle d'un financement pro
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { TypeFinancementPro } from '@prisma/client'
import { logger } from '@/app/_common/lib/logger'
const updateSchema = z.object({
  type: z.nativeEnum(TypeFinancementPro).optional(),
  libelle: z.string().min(1).optional(),
  organisme: z.string().optional().nullable(),
  numeroContrat: z.string().optional().nullable(),
  montantInitial: z.number().min(0).optional(),
  capitalRestantDu: z.number().min(0).optional(),
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
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId, itemId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const item = await prisma.financementPro.findFirst({
      where: { id: itemId, clientId, cabinetId: context.cabinetId },
    })

    if (!item) {
      return createErrorResponse('Financement pro not found', 404)
    }

    return createSuccessResponse({ financementPro: item })
  } catch (error: any) {
    logger.error('Error getting financement pro:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId, itemId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const existing = await prisma.financementPro.findFirst({
      where: { id: itemId, clientId, cabinetId: context.cabinetId },
    })

    if (!existing) {
      return createErrorResponse('Financement pro not found', 404)
    }

    const updated = await prisma.financementPro.update({
      where: { id: itemId },
      data: {
        ...validatedData,
        dateDebut: validatedData.dateDebut ? new Date(validatedData.dateDebut) : undefined,
        dateFin: validatedData.dateFin ? new Date(validatedData.dateFin) : undefined,
      },
    })

    return createSuccessResponse({ financementPro: updated, message: 'Mis à jour avec succès' })
  } catch (error: any) {
    logger.error('Error updating financement pro:', { error: error instanceof Error ? error.message : String(error) })
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
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId, itemId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const existing = await prisma.financementPro.findFirst({
      where: { id: itemId, clientId, cabinetId: context.cabinetId },
    })

    if (!existing) {
      return createErrorResponse('Financement pro not found', 404)
    }

    await prisma.financementPro.update({
      where: { id: itemId },
      data: { isActive: false },
    })

    return createSuccessResponse({ success: true, message: 'Supprimé avec succès' })
  } catch (error: any) {
    logger.error('Error deleting financement pro:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
