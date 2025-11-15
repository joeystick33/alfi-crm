import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { EmailAdvancedService } from '@/lib/services/email-advanced-service'
import { EmailSyncService } from '@/lib/services/email-sync-service'

/**
 * POST /api/email/[id]/reply
 * Reply to an email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    const body = await request.json()

    const { body: replyBody, to, cc, bcc } = body

    if (!replyBody) {
      return NextResponse.json({ error: 'Reply body is required' }, { status: 400 })
    }

    const emailSyncService = new EmailSyncService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const emailAdvancedService = new EmailAdvancedService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    // Get original email to extract subject and recipients
    const { emails } = await emailSyncService.getSyncedEmails({ limit: 1, offset: 0 })
    const originalEmail = emails.find((e) => e.id === params.id)

    if (!originalEmail) {
      return NextResponse.json({ error: 'Original email not found' }, { status: 404 })
    }

    // Send reply
    const result = await emailAdvancedService.sendEmail({
      to: to || [originalEmail.from],
      subject: `Re: ${originalEmail.subject}`,
      body: replyBody,
      cc,
      bcc,
      replyToEmailId: params.id,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error replying to email:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/email/[id]/reply
 * Get all replies to an email
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)

    const emailAdvancedService = new EmailAdvancedService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const replies = await emailAdvancedService.getEmailReplies(params.id)

    return NextResponse.json({ replies })
  } catch (error: any) {
    console.error('Error fetching replies:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
