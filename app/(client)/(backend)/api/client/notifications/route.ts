 
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  requireClientPortalAccess,
  logClientPortalAccess,
  extractClientId,
} from '@/app/_common/lib/client-permissions';
import { prisma } from '@/app/_common/lib/prisma';

// Map notification types for frontend display
function mapNotificationType(type: string): string {
  const mapping: Record<string, string> = {
    'DOCUMENT_TELEVERSE': 'DOCUMENT',
    'MESSAGE_CLIENT': 'MESSAGE',
    'RAPPEL_RDV': 'RENDEZ_VOUS',
    'RENOUVELLEMENT_CONTRAT': 'REMINDER',
    'SYSTEME': 'SYSTEME',
    'AUTRE': 'SYSTEME',
  };
  return mapping[type] || 'SYSTEME';
}

const querySchema = z.object({
  clientId: z.string().min(1),
  unreadOnly: z.coerce.boolean().optional().default(false),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

const markReadSchema = z.object({
  clientId: z.string().min(1),
  notificationIds: z.array(z.string()).min(1).optional(),
  markAllRead: z.boolean().optional(),
});

/**
 * GET /api/client/notifications?clientId=xxx
 * Get notifications for client portal
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = extractClientId(request);

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    const params = querySchema.parse({
      clientId,
      unreadOnly: searchParams.get('unreadOnly') === 'true',
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, params.clientId);
    if (accessDenied) return accessDenied;

    // Log access for audit
    await logClientPortalAccess(params.clientId, 'CONSULTATION', 'NOTIFICATIONS');

    const skip = (params.page - 1) * params.limit;

    // Build where clause - notifications for client
    const where: any = {
      clientId: params.clientId,
      // Only show notifications meant for clients (portal notifications)
      type: {
        in: [
          'DOCUMENT_TELEVERSE',
          'MESSAGE_CLIENT', 
          'RAPPEL_RDV',
          'RENOUVELLEMENT_CONTRAT',
          'SYSTEME',
          'AUTRE',
        ],
      },
    };

    if (params.unreadOnly) {
      where.isRead = false;
    }

    // Get notifications with pagination
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: params.limit,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          actionUrl: true,
          isRead: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          ...where,
          isRead: false,
        },
      }),
    ]);

    // Format notifications for response
    const formattedNotifications = notifications.map((notif: any) => ({
      id: notif.id,
      type: mapNotificationType(notif.type),
      title: notif.title,
      message: notif.message,
      priority: 'NORMAL', // Default since not in model
      link: notif.actionUrl,
      isRead: notif.isRead,
      createdAt: notif.createdAt,
      readAt: notif.readAt,
    }));

    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount,
      pagination: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Notifications Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/client/notifications
 * Mark notifications as read
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const data = markReadSchema.parse(body);

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, data.clientId);
    if (accessDenied) return accessDenied;

    const now = new Date();

    if (data.markAllRead) {
      // Mark all unread notifications as read
      await prisma.notification.updateMany({
        where: {
          clientId: data.clientId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: now,
        },
      });

      await logClientPortalAccess(data.clientId, 'MODIFICATION', 'NOTIFICATIONS', undefined, {
        action: 'mark_all_read',
      });
    } else if (data.notificationIds && data.notificationIds.length > 0) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: data.notificationIds },
          clientId: data.clientId, // Ensure ownership
        },
        data: {
          isRead: true,
          readAt: now,
        },
      });

      await logClientPortalAccess(data.clientId, 'MODIFICATION', 'NOTIFICATIONS', undefined, {
        action: 'mark_read',
        notificationIds: data.notificationIds,
      });
    }

    // Get updated unread count
    const unreadCount = await prisma.notification.count({
      where: {
        clientId: data.clientId,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      unreadCount,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Notifications Update Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
