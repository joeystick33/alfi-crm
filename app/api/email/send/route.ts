import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { EmailAdvancedService } from '@/lib/services/email-advanced-service'

/**
 * POST /api/email/send
 * Send an email via Gmail or Outlook
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const body = await request.json()

    const { to, subject, body: emailBody, cc, bcc, replyToEmailId } = body

    if (!to || !Array.isArray(to) || to.length === 0) {
      return NextResponse.json({ error: 'Recipients (to) are required' }, { status: 400 })
    }

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    }

    if (!emailBody) {
      return NextResponse.json({ error: 'Email body is required' }, { status: 400 })
    }

    const emailAdvancedService = new EmailAdvancedService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const result = await emailAdvancedService.sendEmail({
      to,
      subject,
      body: emailBody,
      cc,
      bcc,
      replyToEmailId,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
