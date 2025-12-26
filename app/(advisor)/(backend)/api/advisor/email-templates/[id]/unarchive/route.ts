import { NextRequest, NextResponse } from 'next/server'
import { EmailTemplateService } from '@/app/_common/lib/services/email-template-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'

/**
 * POST /api/advisor/email-templates/[id]/unarchive
 * Restaurer un template archivé
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
    const template = await service.unarchiveTemplate(templateId)

    return NextResponse.json(template)
  } catch (error) {
    console.error(`Erreur POST /api/advisor/email-templates/${templateId}/unarchive:`, error)

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
