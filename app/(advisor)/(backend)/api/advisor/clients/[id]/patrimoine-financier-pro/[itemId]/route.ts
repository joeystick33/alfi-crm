/**
 * API Route: /api/advisor/clients/[id]/patrimoine-financier-pro/[itemId]
 * GET, PUT, DELETE - Gestion individuelle d'un placement
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { TypePlacementPro } from '@prisma/client'

const updateSchema = z.object({
  type: z.nativeEnum(TypePlacementPro).optional(),
  libelle: z.string().min(1).optional(),
  etablissement: z.string().optional().nullable(),
  numeroContrat: z.string().optional().nullable(),
  montantInvesti: z.number().min(0).optional(),
  valeurActuelle: z.number().min(0).optional(),
  dateOuverture: z.string().optional().nullable(),
  dateEcheance: z.string().optional().nullable(),
  tauxRendement: z.number().optional().nullable(),
  plusValueLatente: z.number().optional().nullable(),
  disponible: z.boolean().optional(),
  preavisSortie: z.number().optional().nullable(),
  regimeFiscal: z.string().optional().nullable(),
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

    const item = await prisma.patrimoineFinancierPro.findFirst({
      where: { id: itemId, clientId, cabinetId: context.cabinetId },
    })

    if (!item) {
      return createErrorResponse('Placement not found', 404)
    }

    return createSuccessResponse({ patrimoineFinancierPro: item })
  } catch (error: any) {
    console.error('Error getting patrimoine financier pro:', error)
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

    const existing = await prisma.patrimoineFinancierPro.findFirst({
      where: { id: itemId, clientId, cabinetId: context.cabinetId },
    })

    if (!existing) {
      return createErrorResponse('Placement not found', 404)
    }

    const updated = await prisma.patrimoineFinancierPro.update({
      where: { id: itemId },
      data: {
        ...validatedData,
        dateOuverture: validatedData.dateOuverture ? new Date(validatedData.dateOuverture) : undefined,
        dateEcheance: validatedData.dateEcheance ? new Date(validatedData.dateEcheance) : undefined,
      },
    })

    return createSuccessResponse({ patrimoineFinancierPro: updated, message: 'Mis à jour avec succès' })
  } catch (error: any) {
    console.error('Error updating patrimoine financier pro:', error)
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

    const existing = await prisma.patrimoineFinancierPro.findFirst({
      where: { id: itemId, clientId, cabinetId: context.cabinetId },
    })

    if (!existing) {
      return createErrorResponse('Placement not found', 404)
    }

    await prisma.patrimoineFinancierPro.update({
      where: { id: itemId },
      data: { isActive: false },
    })

    return createSuccessResponse({ success: true, message: 'Supprimé avec succès' })
  } catch (error: any) {
    console.error('Error deleting patrimoine financier pro:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
