import { NextRequest, NextResponse } from 'next/server'
import { EmailSyncService } from '@/lib/services/email-sync-service'

/**
 * GET /api/email/gmail/callback
 * Gmail OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/settings/integrations?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings/integrations?error=missing_parameters', request.url)
      )
    }

    // Decode state to get user info
    const { userId, cabinetId } = JSON.parse(Buffer.from(state, 'base64').toString())

    // Connect Gmail
    const emailSyncService = new EmailSyncService(cabinetId, userId, false)
    await emailSyncService.connectGmail(code)

    // Trigger initial sync
    await emailSyncService.syncEmails()

    return NextResponse.redirect(
      new URL('/settings/integrations?success=gmail_connected', request.url)
    )
  } catch (error: any) {
    console.error('Error in Gmail callback:', error)
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }
}
