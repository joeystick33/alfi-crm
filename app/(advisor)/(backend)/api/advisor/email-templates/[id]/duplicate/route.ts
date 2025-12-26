import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { EmailTemplateService } from '@/app/_common/lib/services/email-template-service'
import { requireAuth } from '@/app/_common/lib/auth-helpers'

// Schéma validation duplication
const DuplicateTemplateSchema = z.object({
  newName: z.string().min(1).max(200).optional(),
})

/**
 * POST /api/advisor/email-templates/[id]/duplicate
 * Dupliquer un template
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
    const { newName } = DuplicateTemplateSchema.parse(body)

    const service = new EmailTemplateService(cabinet.id, user.id, user.role === 'SUPER_ADMIN')
    const template = await service.duplicateTemplate(templateId, newName)

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error(`Erreur POST /api/advisor/email-templates/${templateId}/duplicate:`, error)

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
