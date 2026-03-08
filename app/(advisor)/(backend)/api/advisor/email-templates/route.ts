 
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { EmailTemplateService } from '@/app/_common/lib/services/email-template-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
// Schéma validation création template
const CreateEmailTemplateSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200, 'Le nom est trop long'),
  description: z.string().max(2000, 'La description est trop longue').optional(),
  category: z.string().max(100, 'La catégorie est trop longue').optional(),
  subject: z.string().min(1, 'Le sujet est requis').max(200, 'Le sujet est trop long'),
  previewText: z.string().max(200, 'Le texte de preview est trop long').optional(),
  htmlContent: z.string().min(1, 'Le contenu HTML est requis'),
  plainContent: z.string().optional(),
  variables: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isSystem: z.boolean().optional(),
})

// Schéma validation filtres
const EmailTemplateFiltersSchema = z.object({
  category: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  isArchived: z.coerce.boolean().optional(),
  isSystem: z.coerce.boolean().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sortBy: z.enum(['createdAt', 'name', 'category', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
})

/**
 * GET /api/advisor/email-templates
 * Liste des templates email avec filtres
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

    if (searchParams.get('category')) filters.category = searchParams.get('category')
    if (searchParams.get('isActive')) filters.isActive = searchParams.get('isActive')
    if (searchParams.get('isArchived')) filters.isArchived = searchParams.get('isArchived')
    if (searchParams.get('isSystem')) filters.isSystem = searchParams.get('isSystem')
    if (searchParams.get('search')) filters.search = searchParams.get('search')
    if (searchParams.get('tags')) {
      filters.tags = searchParams.get('tags')!.split(',')
    }
    if (searchParams.get('limit')) filters.limit = searchParams.get('limit')
    if (searchParams.get('offset')) filters.offset = searchParams.get('offset')
    if (searchParams.get('sortBy')) filters.sortBy = searchParams.get('sortBy')
    if (searchParams.get('sortOrder')) filters.sortOrder = searchParams.get('sortOrder')

    // Validation
    const validatedFilters = EmailTemplateFiltersSchema.parse(filters)

    const service = new EmailTemplateService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const result = await service.listTemplates(validatedFilters)

    return NextResponse.json(result)
  } catch (error: any) {
    logger.error('Erreur GET /api/advisor/email-templates:', { error: error instanceof Error ? error.message : String(error) })

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
 * POST /api/advisor/email-templates
 * Créer un nouveau template email
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
    const validated = CreateEmailTemplateSchema.parse(body)

    const service = new EmailTemplateService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const template = await service.createTemplate(validated)

    return NextResponse.json(template, { status: 201 })
  } catch (error: any) {
    logger.error('Erreur POST /api/advisor/email-templates:', { error: error instanceof Error ? error.message : String(error) })

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
