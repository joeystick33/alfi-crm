import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { EmailTemplateService } from '@/lib/services/email-sync-service'

/**
 * GET /api/email/templates/[id]
 * Get a template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)

    const templateService = new EmailTemplateService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const template = await templateService.getTemplateById(params.id)

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json(template)
  } catch (error: any) {
    console.error('Error fetching template:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/email/templates/[id]
 * Update a template
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    const body = await request.json()

    const templateService = new EmailTemplateService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const template = await templateService.updateTemplate(params.id, body)

    return NextResponse.json(template)
  } catch (error: any) {
    console.error('Error updating template:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/email/templates/[id]
 * Delete a template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)

    const templateService = new EmailTemplateService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    await templateService.deleteTemplate(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
