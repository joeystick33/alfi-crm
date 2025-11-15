import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { EmailSyncService } from '@/lib/services/email-sync-service'

/**
 * GET /api/email
 * Get synced emails with filters
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const searchParams = request.nextUrl.searchParams

    const filters = {
      clientId: searchParams.get('clientId') || undefined,
      isRead: searchParams.get('isRead') === 'true' ? true : searchParams.get('isRead') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    }

    const emailSyncService = new EmailSyncService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const result = await emailSyncService.getSyncedEmails(filters)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching emails:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/email
 * Disconnect email integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const context = await requireAuth(request)

    const emailSyncService = new EmailSyncService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    await emailSyncService.disconnect()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error disconnecting email:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
