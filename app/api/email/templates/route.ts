import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { EmailTemplateService } from '@/lib/services/email-sync-service'

/**
 * GET /api/email/templates
 * Get all email templates
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const searchParams = request.nextUrl.searchParams

    const filters = {
      category: searchParams.get('category') || undefined,
      isActive: searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined,
    }

    const templateService = new EmailTemplateService(
      context.cabinetId,
      context.userId,
      context.isSuperAdmin
    )

    const templates = await templateService.getTemplates(filters)

    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error('Error fetching templates:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/email/templates
 * Create a new email template
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const body = await request.json()

    const { name, subject, body: templateBody, bodyHtml, category, variables } = body

    if (!name) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 })
    }

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }

    if (!templateBody) {
      return NextResponse.json({ error: 'Template body is required' }, { status: 400 })
    }

    const templateService = new EmailTemplateService(
      context.cabinetId,
      context.userId,
      context.isSuperAdmin
    )

    const template = await templateService.createTemplate({
      name,
      subject,
      body: templateBody,
      bodyHtml,
      category,
      variables,
    })

    return NextResponse.json(template)
  } catch (error: any) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
