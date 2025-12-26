/**
 * API Route: /api/advisor/clients/[id]/immobilier-pro/[itemId]
 * GET, PUT, DELETE - Gestion individuelle d'un immobilier pro
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { TypeImmobilierPro, ModeDetentionPro } from '@prisma/client'

const updateSchema = z.object({
  type: z.nativeEnum(TypeImmobilierPro).optional(),
  libelle: z.string().min(1).optional(),
  adresse: z.any().optional(),
  surface: z.number().optional().nullable(),
  valeurAcquisition: z.number().min(0).optional(),
  dateAcquisition: z.string().optional().nullable(),
  valeurActuelle: z.number().min(0).optional(),
  modeDetention: z.nativeEnum(ModeDetentionPro).optional(),
  quotiteDetention: z.number().min(0).max(100).optional(),
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

    const item = await prisma.immobilierPro.findFirst({
      where: { id: itemId, clientId, cabinetId: context.cabinetId },
    })

    if (!item) {
      return createErrorResponse('Immobilier pro not found', 404)
    }

    return createSuccessResponse({ immobilierPro: item })
  } catch (error: any) {
    console.error('Error getting immobilier pro:', error)
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

    const existing = await prisma.immobilierPro.findFirst({
      where: { id: itemId, clientId, cabinetId: context.cabinetId },
    })

    if (!existing) {
      return createErrorResponse('Immobilier pro not found', 404)
    }

    const updated = await prisma.immobilierPro.update({
      where: { id: itemId },
      data: {
        ...validatedData,
        dateAcquisition: validatedData.dateAcquisition ? new Date(validatedData.dateAcquisition) : undefined,
        bailEcheance: validatedData.bailEcheance ? new Date(validatedData.bailEcheance) : undefined,
      },
    })

    return createSuccessResponse({ immobilierPro: updated, message: 'Mis à jour avec succès' })
  } catch (error: any) {
    console.error('Error updating immobilier pro:', error)
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

    const existing = await prisma.immobilierPro.findFirst({
      where: { id: itemId, clientId, cabinetId: context.cabinetId },
    })

    if (!existing) {
      return createErrorResponse('Immobilier pro not found', 404)
    }

    await prisma.immobilierPro.update({
      where: { id: itemId },
      data: { isActive: false },
    })

    return createSuccessResponse({ success: true, message: 'Supprimé avec succès' })
  } catch (error: any) {
    console.error('Error deleting immobilier pro:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
