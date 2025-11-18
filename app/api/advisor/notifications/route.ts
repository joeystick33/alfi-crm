import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { isRegularUser } from '@/lib/auth-types'
import { NotificationService } from '@/lib/services/notification-service'
import { parseNotificationFilters, normalizeNotificationCreatePayload } from './utils'

/**
 * GET /api/notifications
 * Fetch notifications for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse and validate filters
    const { searchParams } = new URL(request.url)
    const filters = parseNotificationFilters(searchParams)

    // Instantiate service
    const service = new NotificationService(
      context.cabinetId,
      context.user.id,
      context.user.role,
      context.isSuperAdmin
    )

    // Get notifications and counts
    const [notifications, total, unreadCount] = await Promise.all([
      service.listNotifications(filters),
      service.getCount(filters),
      service.getUnreadCount(),
    ])

    // Calculate pagination
    const limit = filters.limit || 50
    const offset = filters.offset || 0
    const page = Math.floor(offset / limit) + 1
    const totalPages = Math.ceil(total / limit)

    return createSuccessResponse({
      data: notifications,
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages,
      },
      unreadCount,
    })
  } catch (error) {
    console.error('Error in GET /api/notifications:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/notifications
 * Create a new notification
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse and validate payload
    const body = await request.json()
    const payload = normalizeNotificationCreatePayload(body)

    // Instantiate service
    const service = new NotificationService(
      context.cabinetId,
      context.user.id,
      context.user.role,
      context.isSuperAdmin
    )

    // Create notification
    const notification = await service.createNotification(payload)

    return createSuccessResponse(notification, 201)
  } catch (error) {
    console.error('Error in POST /api/notifications:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/notifications
 * Bulk update notifications (mark as read/unread)
 */
export async function PATCH(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    
    // Check if this is a "mark all as read" request
    if (body.markAllAsRead === true) {
      const service = new NotificationService(
        context.cabinetId,
        context.user.id,
        context.user.role,
        context.isSuperAdmin
      )

      const result = await service.markAllAsRead()
      return createSuccessResponse(result)
    }

    // Otherwise, validate bulk update payload
    const { notificationIds, isRead } = body

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return createErrorResponse('notificationIds must be a non-empty array', 400)
    }

    if (typeof isRead !== 'boolean') {
      return createErrorResponse('isRead must be a boolean', 400)
    }

    // Instantiate service
    const service = new NotificationService(
      context.cabinetId,
      context.user.id,
      context.user.role,
      context.isSuperAdmin
    )

    // Bulk update notifications
    const result = await service.bulkUpdateNotifications(notificationIds, isRead)

    return createSuccessResponse(result)
  } catch (error) {
    console.error('Error in PATCH /api/notifications:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/notifications
 * Bulk delete notifications
 */
export async function DELETE(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const idsParam = searchParams.get('ids')
    
    if (!idsParam) {
      return createErrorResponse('Missing ids parameter', 400)
    }

    const notificationIds = idsParam.split(',').filter(id => id.trim())

    if (notificationIds.length === 0) {
      return createErrorResponse('No valid notification IDs provided', 400)
    }

    // Instantiate service
    const service = new NotificationService(
      context.cabinetId,
      context.user.id,
      context.user.role,
      context.isSuperAdmin
    )

    // Bulk delete notifications
    const result = await service.bulkDeleteNotifications(notificationIds)

    return createSuccessResponse(result)
  } catch (error) {
    console.error('Error in DELETE /api/notifications:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
