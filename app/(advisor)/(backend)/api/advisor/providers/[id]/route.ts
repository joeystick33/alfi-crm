/**
 * API Route: /api/advisor/providers/[id]
 * GET - Récupère un fournisseur par ID
 * PUT - Met à jour un fournisseur
 * DELETE - Supprime un fournisseur
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { ProviderService } from '@/app/_common/lib/services/provider-service'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
const updateProviderSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['ASSUREUR', 'SOCIETE_GESTION', 'BANQUE', 'PLATEFORME']).optional(),
  siren: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  commercialContact: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional().nullable(),
  backOfficeContact: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional().nullable(),
  extranetUrl: z.string().url().optional().or(z.literal('')).nullable(),
  extranetNotes: z.string().optional().nullable(),
  commissionGridUrl: z.string().url().optional().or(z.literal('')).nullable(),
  conventionStatus: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED', 'TERMINATED']).optional(),
  isFavorite: z.boolean().optional(),
  notes: z.string().optional().nullable(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new ProviderService(context.cabinetId, user.id, context.isSuperAdmin)
    const provider = await service.getProvider(id)

    return createSuccessResponse(provider)
  } catch (error: any) {
    logger.error('Error fetching provider:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message === 'Provider not found') {
      return createErrorResponse('Provider not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const validation = updateProviderSchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse(validation.error.issues?.[0]?.message ?? 'Données invalides', 400)
    }

    const service = new ProviderService(context.cabinetId, user.id, context.isSuperAdmin)
    const provider = await service.updateProvider(id, validation.data)

    return createSuccessResponse(provider)
  } catch (error: any) {
    logger.error('Error updating provider:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message === 'Provider not found') {
      return createErrorResponse('Provider not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new ProviderService(context.cabinetId, user.id, context.isSuperAdmin)
    await service.deleteProvider(id)

    return createSuccessResponse({ success: true })
  } catch (error: any) {
    logger.error('Error deleting provider:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message === 'Provider not found') {
      return createErrorResponse('Provider not found', 404)
    }
    
    if (error instanceof Error && error.message.includes('existing affaires')) {
      return createErrorResponse('Cannot delete provider with existing affaires', 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
