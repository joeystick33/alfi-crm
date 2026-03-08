/**
 * API Route: /api/advisor/providers/[id]/products
 * GET - Liste les produits d'un fournisseur
 * POST - Crée un nouveau produit pour un fournisseur
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { ProviderService } from '@/app/_common/lib/services/provider-service'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
const createProductSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  code: z.string().min(1, 'Le code est requis'),
  type: z.enum([
    'ASSURANCE_VIE',
    'PER_INDIVIDUEL',
    'PER_ENTREPRISE',
    'COMPTE_TITRES',
    'PEA',
    'PEA_PME',
    'SCPI',
    'OPCI',
    'CAPITALISATION',
    'FCPR',
    'FCPI',
    'FIP',
    'IMMOBILIER_DIRECT',
    'CREDIT_IMMOBILIER',
  ]),
  characteristics: z.object({
    entryFees: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      default: z.number().optional(),
    }).optional(),
    managementFees: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
      default: z.number().optional(),
    }).optional(),
    exitFees: z.number().optional(),
    options: z.array(z.string()).optional(),
  }).optional(),
  availableFunds: z.array(z.object({
    id: z.string().optional(),
    isin: z.string().optional(),
    name: z.string(),
    category: z.string().optional(),
    riskLevel: z.number().optional(),
    ongoingCharges: z.number().optional(),
  })).optional(),
  minimumInvestment: z.number().optional(),
  documentTemplates: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
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

    const { searchParams } = new URL(request.url)
    
    const filters = {
      providerId: id,
      type: searchParams.get('type')?.split(',').filter(Boolean),
      isActive: searchParams.get('isActive') === 'true' ? true : 
                searchParams.get('isActive') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
    }

    const service = new ProviderService(context.cabinetId, user.id, context.isSuperAdmin)
    const products = await service.getProducts(filters)

    return createSuccessResponse(products)
  } catch (error: any) {
    logger.error('Error fetching products:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message === 'Provider not found') {
      return createErrorResponse('Provider not found', 404)
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
    const { id } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const validation = createProductSchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse(validation.error.issues?.[0]?.message ?? 'Données invalides', 400)
    }

    const service = new ProviderService(context.cabinetId, user.id, context.isSuperAdmin)
    const product = await service.createProduct({
      ...validation.data,
      providerId: id,
    })

    return createSuccessResponse(product, 201)
  } catch (error: any) {
    logger.error('Error creating product:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message === 'Provider not found') {
      return createErrorResponse('Provider not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
