/**
 * API Route: /api/advisor/clients/[id]/protection-sociale-pro/[itemId]
 * GET, PUT, DELETE - Gestion individuelle d'une protection sociale pro
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { TypeProtectionSocialePro } from '@prisma/client'

const updateSchema = z.object({
  type: z.nativeEnum(TypeProtectionSocialePro).optional(),
  libelle: z.string().min(1).optional(),
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

    const item = await prisma.protectionSocialePro.findFirst({
      where: { id: itemId, clientId, cabinetId: context.cabinetId },
    })

    if (!item) {
      return createErrorResponse('Protection sociale not found', 404)
    }

    return createSuccessResponse({ protectionSocialePro: item })
  } catch (error: any) {
    console.error('Error getting protection sociale pro:', error)
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

    const existing = await prisma.protectionSocialePro.findFirst({
      where: { id: itemId, clientId, cabinetId: context.cabinetId },
    })

    if (!existing) {
      return createErrorResponse('Protection sociale not found', 404)
    }

    const updated = await prisma.protectionSocialePro.update({
      where: { id: itemId },
      data: {
        ...validatedData,
        dateEffet: validatedData.dateEffet ? new Date(validatedData.dateEffet) : undefined,
        dateEcheance: validatedData.dateEcheance ? new Date(validatedData.dateEcheance) : undefined,
      },
    })

    return createSuccessResponse({ protectionSocialePro: updated, message: 'Mis à jour avec succès' })
  } catch (error: any) {
    console.error('Error updating protection sociale pro:', error)
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

    const existing = await prisma.protectionSocialePro.findFirst({
      where: { id: itemId, clientId, cabinetId: context.cabinetId },
    })

    if (!existing) {
      return createErrorResponse('Protection sociale not found', 404)
    }

    await prisma.protectionSocialePro.update({
      where: { id: itemId },
      data: { isActive: false },
    })

    return createSuccessResponse({ success: true, message: 'Supprimé avec succès' })
  } catch (error: any) {
    console.error('Error deleting protection sociale pro:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
