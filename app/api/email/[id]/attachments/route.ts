import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { EmailAdvancedService } from '@/lib/services/email-advanced-service'

/**
 * GET /api/email/[id]/attachments
 * Get attachments for an email
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)

    const emailAdvancedService = new EmailAdvancedService(
      context.cabinetId,
      context.userId,
      context.isSuperAdmin
    )

    const attachments = await emailAdvancedService.getAttachments(params.id)

    return NextResponse.json({ attachments })
  } catch (error: any) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
