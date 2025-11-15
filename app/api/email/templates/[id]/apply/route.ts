import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { EmailTemplateService } from '@/lib/services/email-sync-service'

/**
 * POST /api/email/templates/[id]/apply
 * Apply a template with variables
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    const body = await request.json()

    const { variables } = body

    if (!variables || typeof variables !== 'object') {
      return NextResponse.json({ error: 'Variables object is required' }, { status: 400 })
    }

    const templateService = new EmailTemplateService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const template = await templateService.getTemplateById(params.id)

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const result = templateService.applyTemplate(template, variables)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error applying template:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
