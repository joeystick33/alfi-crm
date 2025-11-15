import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { NotificationService } from '@/lib/services/notification-service'

/**
 * GET /api/notifications
 * Get all notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const searchParams = request.nextUrl.searchParams

    const filters = {
      unreadOnly: searchParams.get('unreadOnly') === 'true',
      type: searchParams.get('type') as any,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    }

    const notificationService = new NotificationService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const result = await notificationService.getNotifications(filters)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
