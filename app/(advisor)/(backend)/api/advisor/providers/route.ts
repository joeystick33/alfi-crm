/**
 * API Route: /api/advisor/providers
 * GET - Liste les fournisseurs (assureurs, sociétés de gestion)
 * POST - Crée un nouveau fournisseur
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { ProviderService } from '@/app/_common/lib/services/provider-service'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
const createProviderSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  type: z.enum(['ASSUREUR', 'SOCIETE_GESTION', 'BANQUE', 'PLATEFORME']),
  siren: z.string().optional(),
  address: z.string().optional(),
  commercialContact: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional(),
  backOfficeContact: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).optional(),
  extranetUrl: z.string().url().optional().or(z.literal('')),
  extranetNotes: z.string().optional(),
  commissionGridUrl: z.string().url().optional().or(z.literal('')),
  conventionStatus: z.enum(['ACTIVE', 'PENDING', 'SUSPENDED', 'TERMINATED']).optional(),
  isFavorite: z.boolean().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    
    const filters = {
      type: searchParams.get('type')?.split(',').filter(Boolean),
      conventionStatus: searchParams.get('conventionStatus')?.split(',').filter(Boolean),
      isFavorite: searchParams.get('isFavorite') === 'true' ? true : undefined,
      search: searchParams.get('search') || undefined,
    }

    const service = new ProviderService(context.cabinetId, user.id, context.isSuperAdmin)
    const providers = await service.getProviders(filters)

    return createSuccessResponse(providers)
  } catch (error: any) {
    logger.error('Error fetching providers:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const validation = createProviderSchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse(validation.error.issues?.[0]?.message ?? 'Données invalides', 400)
    }

    const service = new ProviderService(context.cabinetId, user.id, context.isSuperAdmin)
    const provider = await service.createProvider(validation.data)

    return createSuccessResponse(provider, 201)
  } catch (error: any) {
    logger.error('Error creating provider:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
