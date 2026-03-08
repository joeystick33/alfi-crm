 
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { EmailTemplateService } from '@/app/_common/lib/services/email-template-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
// Schéma validation preview
const PreviewTemplateSchema = z.object({
  testData: z.record(z.string(), z.any()).optional(),
})

/**
 * POST /api/advisor/email-templates/[id]/preview
 * Prévisualiser un template avec des données de test
 */
export async function POST(
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

    const body = await request.json().catch(() => ({}))
    const { testData } = PreviewTemplateSchema.parse(body)

    const service = new EmailTemplateService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const preview = await service.previewTemplate(templateId, testData)

    return NextResponse.json(preview)
  } catch (error: any) {
    logger.error(`Erreur POST /api/advisor/email-templates/${templateId}/preview:`, { error: error instanceof Error ? error.message : String(error) })

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
