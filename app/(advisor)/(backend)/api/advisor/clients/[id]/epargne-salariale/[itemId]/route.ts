/**
 * API Route: /api/advisor/clients/[id]/epargne-salariale/[itemId]
 * GET, PUT, DELETE - Gestion individuelle d'une épargne salariale
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { TypeEpargneSalariale } from '@prisma/client'

const updateSchema = z.object({
  type: z.nativeEnum(TypeEpargneSalariale).optional(),
  libelle: z.string().min(1).optional(),
  organisme: z.string().optional().nullable(),
  employeur: z.string().optional().nullable(),
  montantVerse: z.number().min(0).optional(),
  montantActuel: z.number().min(0).optional(),
  montantAbonde: z.number().optional().nullable(),
  dateOuverture: z.string().optional().nullable(),
  dateDisponibilite: z.string().optional().nullable(),
  supports: z.any().optional(),
  performanceYTD: z.number().optional().nullable(),
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

    const item = await prisma.epargneSalariale.findFirst({
      where: { id: itemId, clientId, cabinetId: context.cabinetId },
    })

    if (!item) {
      return createErrorResponse('Épargne salariale not found', 404)
    }

    return createSuccessResponse({ epargneSalariale: item })
  } catch (error: any) {
    console.error('Error getting epargne salariale:', error)
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

    const existing = await prisma.epargneSalariale.findFirst({
      where: { id: itemId, clientId, cabinetId: context.cabinetId },
    })

    if (!existing) {
      return createErrorResponse('Épargne salariale not found', 404)
    }

    const updated = await prisma.epargneSalariale.update({
      where: { id: itemId },
      data: {
        ...validatedData,
        dateOuverture: validatedData.dateOuverture ? new Date(validatedData.dateOuverture) : undefined,
        dateDisponibilite: validatedData.dateDisponibilite ? new Date(validatedData.dateDisponibilite) : undefined,
      },
    })

    return createSuccessResponse({ epargneSalariale: updated, message: 'Mis à jour avec succès' })
  } catch (error: any) {
    console.error('Error updating epargne salariale:', error)
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

    const existing = await prisma.epargneSalariale.findFirst({
      where: { id: itemId, clientId, cabinetId: context.cabinetId },
    })

    if (!existing) {
      return createErrorResponse('Épargne salariale not found', 404)
    }

    await prisma.epargneSalariale.update({
      where: { id: itemId },
      data: { isActive: false },
    })

    return createSuccessResponse({ success: true, message: 'Supprimé avec succès' })
  } catch (error: any) {
    console.error('Error deleting epargne salariale:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
