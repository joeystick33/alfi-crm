import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { OutlookService } from '@/lib/services/email-sync/outlook-service'

/**
 * GET /api/email/outlook/connect
 * Get Outlook OAuth authorization URL
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)

    // Generate state with userId for callback
    const state = Buffer.from(
      JSON.stringify({
        userId: context.user.id,
        cabinetId: context.cabinetId,
      })
    ).toString('base64')

    const authUrl = OutlookService.getAuthUrl(state)

    return NextResponse.json({ authUrl })
  } catch (error: any) {
    console.error('Error generating Outlook auth URL:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
