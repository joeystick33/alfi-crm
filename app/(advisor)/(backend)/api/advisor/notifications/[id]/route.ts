import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { NotificationService } from '@/app/_common/lib/services/notification-service'
import { normalizeNotificationUpdatePayload } from '../utils'

/**
 * GET /api/advisor/notifications/[id]
 * Get a specific notification by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (!id) {
      return createErrorResponse('Missing notification ID', 400)
    }

    // Instantiate service
    const service = new NotificationService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    // Get notification
    const notification = await service.getNotificationById(id)

    if (!notification) {
      return createErrorResponse('Notification not found', 404)
    }

    return createSuccessResponse(notification)
  } catch (error) {
    console.error('Error in GET /api/advisor/notifications/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/advisor/notifications/[id]
 * Update a specific notification (mark as read/unread)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (!id) {
      return createErrorResponse('Missing notification ID', 400)
    }

    // Parse and validate payload
    const body = await request.json()
    const payload = normalizeNotificationUpdatePayload(body)

    // Instantiate service
    const service = new NotificationService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    // Update notification
    const notification = await service.updateNotification(id, payload)

    return createSuccessResponse(notification)
  } catch (error) {
    console.error('Error in PATCH /api/advisor/notifications/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse(error.message, 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/advisor/notifications/[id]
 * Delete a specific notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (!id) {
      return createErrorResponse('Missing notification ID', 400)
    }

    // Instantiate service
    const service = new NotificationService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    // Delete notification
    await service.deleteNotification(id)

    return createSuccessResponse({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/advisor/notifications/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse(error.message, 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
