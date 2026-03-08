import { NextRequest, NextResponse } from 'next/server'
import { EmailTemplateService } from '@/app/_common/lib/services/email-template-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
/**
 * POST /api/advisor/email-templates/[id]/archive
 * Archiver un template
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

    const service = new EmailTemplateService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const template = await service.archiveTemplate(templateId)

    return NextResponse.json(template)
  } catch (error) {
    logger.error(`Erreur POST /api/advisor/email-templates/${templateId}/archive:`, { error: error instanceof Error ? error.message : String(error) })

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
