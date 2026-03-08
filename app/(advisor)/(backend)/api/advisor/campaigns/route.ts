 
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CampaignService } from '@/app/_common/lib/services/campaign-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
// Schéma validation création campagne
const CreateCampaignSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200, 'Le nom est trop long'),
  description: z.string().max(2000, 'La description est trop longue').optional(),
  type: z.enum(['EMAIL', 'SMS', 'POSTAL', 'MULTI_CANAL']).optional(),
  subject: z.string().max(200, 'Le sujet est trop long').optional(),
  previewText: z.string().max(200, 'Le texte de preview est trop long').optional(),
  htmlContent: z.string().optional(),
  plainContent: z.string().optional(),
  emailTemplateId: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
  targetSegment: z.any().optional(),
  targetClientIds: z.array(z.string()).optional(),
  excludeClientIds: z.array(z.string()).optional(),
  fromName: z.string().max(100, 'Le nom expéditeur est trop long').optional(),
  fromEmail: z.string().email('Email invalide').optional(),
  replyTo: z.string().email('Email de réponse invalide').optional(),
  trackOpens: z.boolean().optional(),
  trackClicks: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

// Schéma validation filtres
const CampaignFiltersSchema = z.object({
  status: z.enum(['BROUILLON', 'PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE', 'PAUSE']).optional(),
  type: z.enum(['EMAIL', 'SMS', 'POSTAL', 'MULTI_CANAL']).optional(),
  createdBy: z.string().optional(),
  search: z.string().optional(),
  scheduledFrom: z.string().datetime().optional(),
  scheduledTo: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(['createdAt', 'scheduledAt', 'sentAt', 'name']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

/**
 * GET /api/advisor/campaigns
 * Liste des campagnes avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const { user, cabinet } = await requireAuth(request)

    if (!user || !cabinet) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    // Parser query params
    const { searchParams } = new URL(request.url)
    const filters: any = {}

    if (searchParams.get('status')) filters.status = searchParams.get('status')
    if (searchParams.get('type')) filters.type = searchParams.get('type')
    if (searchParams.get('createdBy')) filters.createdBy = searchParams.get('createdBy')
    if (searchParams.get('search')) filters.search = searchParams.get('search')
    if (searchParams.get('scheduledFrom')) filters.scheduledFrom = searchParams.get('scheduledFrom')
    if (searchParams.get('scheduledTo')) filters.scheduledTo = searchParams.get('scheduledTo')
    if (searchParams.get('tags')) {
      filters.tags = searchParams.get('tags')!.split(',')
    }
    if (searchParams.get('limit')) filters.limit = searchParams.get('limit')
    if (searchParams.get('offset')) filters.offset = searchParams.get('offset')
    if (searchParams.get('sortBy')) filters.sortBy = searchParams.get('sortBy')
    if (searchParams.get('sortOrder')) filters.sortOrder = searchParams.get('sortOrder')

    // Validation
    const validatedFilters = CampaignFiltersSchema.parse(filters)

    // Build properly typed filters with date conversion
    const serviceFilters = {
      ...validatedFilters,
      scheduledFrom: validatedFilters.scheduledFrom ? new Date(validatedFilters.scheduledFrom) : undefined,
      scheduledTo: validatedFilters.scheduledTo ? new Date(validatedFilters.scheduledTo) : undefined,
    }

    const service = new CampaignService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const result = await service.listCampaigns(serviceFilters)

    return NextResponse.json(result)
  } catch (error: any) {
    logger.error('Erreur GET /api/advisor/campaigns:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/advisor/campaigns
 * Créer une nouvelle campagne
 */
export async function POST(request: NextRequest) {
  try {
    const { user, cabinet } = await requireAuth(request)

    if (!user || !cabinet) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = CreateCampaignSchema.parse(body)

    // Conversion date scheduledAt
    const input: any = { ...validated }
    if (input.scheduledAt) {
      input.scheduledAt = new Date(input.scheduledAt)
    }

    const service = new CampaignService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const campaign = await service.createCampaign(input)

    return NextResponse.json(campaign, { status: 201 })
  } catch (error: any) {
    logger.error('Erreur POST /api/advisor/campaigns:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
