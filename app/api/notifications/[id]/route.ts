import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { NotificationService } from '@/lib/services/notification-service'

/**
 * PATCH /api/notifications/[id]
 * Mark notification as read
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)

    const notificationService = new NotificationService(
      context.cabinetId,
      context.userId,
      context.isSuperAdmin
    )

    await notificationService.markAsRead(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)

    const notificationService = new NotificationService(
      context.cabinetId,
      context.userId,
      context.isSuperAdmin
    )

    await notificationService.deleteNotification(params.id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting notification:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
