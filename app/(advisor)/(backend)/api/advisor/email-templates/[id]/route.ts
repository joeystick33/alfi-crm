 
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { EmailTemplateService } from '@/app/_common/lib/services/email-template-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
// Schéma validation mise à jour
const UpdateEmailTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  category: z.string().max(100).optional(),
  subject: z.string().min(1).max(200).optional(),
  previewText: z.string().max(200).optional(),
  htmlContent: z.string().min(1).optional(),
  plainContent: z.string().optional(),
  variables: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
})

/**
 * GET /api/advisor/email-templates/[id]
 * Obtenir un template par ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let templateId = ''
  try {
    const { user, cabinet } = await requireAuth(request)
    const { id } = await params
    templateId = id

    if (!user || !cabinet) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const service = new EmailTemplateService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const template = await service.getTemplateById(templateId)

    return NextResponse.json(template)
  } catch (error: any) {
    logger.error(`Erreur GET /api/advisor/email-templates/${templateId}:`, { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Template non trouvé') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/advisor/email-templates/[id]
 * Mettre à jour un template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let templateId = ''
  try {
    const { user, cabinet } = await requireAuth(request)
    const { id } = await params
    templateId = id

    if (!user || !cabinet) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = UpdateEmailTemplateSchema.parse(body)

    const service = new EmailTemplateService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const template = await service.updateTemplate(templateId, validated)

    return NextResponse.json(template)
  } catch (error: any) {
    logger.error(`Erreur PATCH /api/advisor/email-templates/${templateId}:`, { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    if (error.message === 'Template non trouvé') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 400 }
    )
  }
}

/**
 * DELETE /api/advisor/email-templates/[id]
 * Supprimer un template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let templateId = ''
  try {
    const { user, cabinet } = await requireAuth(request)
    const { id } = await params
    templateId = id

    if (!user || !cabinet) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    const service = new EmailTemplateService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    await service.deleteTemplate(templateId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error(`Erreur DELETE /api/advisor/email-templates/${templateId}:`, { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Template non trouvé') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 400 }
    )
  }
}
