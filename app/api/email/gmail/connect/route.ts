import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { GmailService } from '@/lib/services/email-sync/gmail-service'

/**
 * GET /api/email/gmail/connect
 * Get Gmail OAuth authorization URL
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)

    // Generate state with userId for callback
    const state = Buffer.from(
      JSON.stringify({
        userId: context.userId,
        cabinetId: context.cabinetId,
      })
    ).toString('base64')

    const authUrl = GmailService.getAuthUrl(state)

    return NextResponse.json({ authUrl })
  } catch (error: any) {
    console.error('Error generating Gmail auth URL:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
