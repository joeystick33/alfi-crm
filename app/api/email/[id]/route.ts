import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { EmailSyncService } from '@/lib/services/email-sync-service'

/**
 * PATCH /api/email/[id]
 * Update email (mark as read, link to client)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    const body = await request.json()

    const emailSyncService = new EmailSyncService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    if (body.isRead !== undefined) {
      await emailSyncService.markAsRead(params.id)
    }

    if (body.clientId) {
      await emailSyncService.linkToClient(params.id, body.clientId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating email:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
