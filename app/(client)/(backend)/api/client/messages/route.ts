 
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  requireClientPortalAccess,
  logClientPortalAccess,
  extractClientId,
  getClientAllowedOperations,
} from '@/app/_common/lib/client-permissions';
import { prisma } from '@/app/_common/lib/prisma';

const querySchema = z.object({
  clientId: z.string().min(1),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

const createMessageSchema = z.object({
  clientId: z.string().min(1),
  subject: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
});

/**
 * GET /api/client/messages?clientId=xxx
 * Get messages for client portal using Notification model with type MESSAGE
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
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, params.clientId);
    if (accessDenied) return accessDenied;

    // Log access for audit
    await logClientPortalAccess(params.clientId, 'CONSULTATION', 'MESSAGES');

    const skip = (params.page - 1) * params.limit;

    // Get client's advisor info
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
      select: {
        conseillerId: true,
        cabinetId: true,
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get messages using Notification model with type MESSAGE
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: {
          clientId: params.clientId,
          type: 'MESSAGE_CLIENT',
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: params.limit,
        select: {
          id: true,
          title: true,
          message: true,
          userId: true,
          isRead: true,
          readAt: true,
          createdAt: true,
        },
      }),
      prisma.notification.count({
        where: {
          clientId: params.clientId,
          type: 'MESSAGE_CLIENT',
        },
      }),
      prisma.notification.count({
        where: {
          clientId: params.clientId,
          type: 'MESSAGE_CLIENT',
          userId: { not: null }, // Messages from advisor
          isRead: false,
        },
      }),
    ]);

    // Format messages for response
    const formattedMessages = notifications.map((notif: any) => ({
      id: notif.id,
      subject: notif.title,
      content: notif.message,
      isFromClient: notif.userId === null, // Client messages have no userId
      isRead: notif.isRead,
      createdAt: notif.createdAt,
      readAt: notif.readAt,
    }));

    return NextResponse.json({
      messages: formattedMessages,
      advisor: client.conseiller,
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

    console.error('[Client Messages Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/client/messages
 * Send a new message to advisor using Notification model
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createMessageSchema.parse(body);

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, data.clientId);
    if (accessDenied) return accessDenied;

    // Check if client can send messages
    const permissions = getClientAllowedOperations('message');
    if (!permissions.canCreate) {
      return NextResponse.json(
        { error: 'Sending messages is not allowed' },
        { status: 403 }
      );
    }

    // Get client info
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        conseillerId: true,
        cabinetId: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Create client message as Notification (userId = null indicates from client)
    const clientMessage = await prisma.notification.create({
      data: {
        cabinetId: client.cabinetId,
        clientId: data.clientId,
        userId: null, // null = message from client
        type: 'MESSAGE_CLIENT',
        title: data.subject,
        message: data.content,
      },
      select: {
        id: true,
        title: true,
        message: true,
        createdAt: true,
      },
    });

    // Log action for audit
    await logClientPortalAccess(data.clientId, 'CREATION', 'MESSAGE', clientMessage.id, {
      subject: data.subject,
    });

    // Create notification for advisor
    await prisma.notification.create({
      data: {
        cabinetId: client.cabinetId,
        userId: client.conseillerId,
        clientId: data.clientId,
        type: 'MESSAGE_CLIENT',
        title: 'Nouveau message client',
        message: `${client.firstName} ${client.lastName} vous a envoyé un message: ${data.subject}`,
        actionUrl: `/dashboard/clients/${data.clientId}/messages`,
      },
    });

    return NextResponse.json({
      message: {
        id: clientMessage.id,
        subject: clientMessage.title,
        content: clientMessage.message,
        isFromClient: true,
        createdAt: clientMessage.createdAt,
      },
      success: true,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Send Message Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
