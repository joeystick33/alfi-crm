import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { NotificationService } from '@/lib/services/notification-service'

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)

    const notificationService = new NotificationService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    await notificationService.markAllAsRead()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error marking all as read:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
