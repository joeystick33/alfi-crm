import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { NotificationService } from '@/lib/services/notification-service'

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)

    const notificationService = new NotificationService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const count = await notificationService.getUnreadCount()

    return NextResponse.json({ count })
  } catch (error: any) {
    console.error('Error getting unread count:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
