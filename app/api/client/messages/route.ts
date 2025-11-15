import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  requireClientPortalAccess,
  logClientPortalAccess,
  extractClientId,
  getClientAllowedOperations,
} from '@/lib/client-permissions';

const querySchema = z.object({
  clientId: z.string().min(1),
});

const createMessageSchema = z.object({
  clientId: z.string().min(1),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

/**
 * GET /api/client/messages?clientId=xxx
 * Get message history between client and advisor
 * READ-ONLY access to messages
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = extractClientId(request);

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    const { clientId: validatedClientId } = querySchema.parse({ clientId });

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, validatedClientId);
    if (accessDenied) return accessDenied;

    // Log access for audit
    await logClientPortalAccess(validatedClientId, 'VIEW_MESSAGES');

    // Get client and advisor info
    const client = await prisma.client.findUnique({
      where: { id: validatedClientId },
      select: {
        id: true,
        conseillerId: true,
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

    // Get emails between client and advisor
    const emails = await prisma.email.findMany({
      where: {
        clientId: validatedClientId,
        status: {
          in: ['SENT', 'DELIVERED', 'OPENED'],
        },
      },
      select: {
        id: true,
        subject: true,
        body: true,
        sentAt: true,
        openedAt: true,
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        attachments: true,
      },
      orderBy: {
        sentAt: 'desc',
      },
      take: 50,
    });

    // Get synced emails (from Gmail/Outlook integration)
    const syncedEmails = await prisma.syncedEmail.findMany({
      where: {
        clientId: validatedClientId,
      },
      select: {
        id: true,
        subject: true,
        body: true,
        snippet: true,
        from: true,
        sentAt: true,
        receivedAt: true,
        direction: true,
        hasAttachments: true,
        attachments: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            size: true,
            url: true,
          },
        },
      },
      orderBy: {
        receivedAt: 'desc',
      },
      take: 50,
    });

    // Combine and sort all messages
    const allMessages = [
      ...emails.map(e => ({
        id: e.id,
        type: 'email' as const,
        subject: e.subject,
        body: e.body,
        from: {
          id: e.sender.id,
          name: `${e.sender.firstName} ${e.sender.lastName}`,
          isAdvisor: true,
        },
        timestamp: e.sentAt || new Date(),
        hasAttachments: e.attachments ? (e.attachments as any[]).length > 0 : false,
        attachments: e.attachments || [],
      })),
      ...syncedEmails.map(se => ({
        id: se.id,
        type: 'synced_email' as const,
        subject: se.subject,
        body: se.body || se.snippet,
        from: {
          email: se.from,
          isAdvisor: se.direction === 'OUTBOUND',
        },
        timestamp: se.direction === 'OUTBOUND' ? se.sentAt : se.receivedAt,
        hasAttachments: se.hasAttachments,
        attachments: se.attachments,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json({
      advisor: client.conseiller,
      messages: allMessages,
      stats: {
        total: allMessages.length,
        unread: 0, // TODO: Implement unread tracking
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Messages GET Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/client/messages
 * Send a message from client to advisor
 * Clients CAN create messages (exception to read-only rule)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, subject, message } = createMessageSchema.parse(body);

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, clientId);
    if (accessDenied) return accessDenied;

    // Verify client can create messages
    const permissions = getClientAllowedOperations('message');
    if (!permissions.canCreate) {
      return NextResponse.json(
        { error: 'Operation not allowed' },
        { status: 403 }
      );
    }

    // Get client info
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        conseillerId: true,
        cabinetId: true,
        conseiller: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create notification for advisor
    await prisma.notification.create({
      data: {
        cabinetId: client.cabinetId,
        userId: client.conseillerId,
        clientId: client.id,
        type: 'CLIENT_MESSAGE',
        title: `Nouveau message de ${client.firstName} ${client.lastName}`,
        message: `Sujet: ${subject}`,
        actionUrl: `/dashboard/clients/${client.id}`,
      },
    });

    // Create timeline event
    await prisma.timelineEvent.create({
      data: {
        clientId: client.id,
        type: 'EMAIL_SENT',
        title: 'Message envoyé au conseiller',
        description: subject,
        createdBy: client.id,
      },
    });

    // Log message creation for audit
    await logClientPortalAccess(
      clientId,
      'SEND_MESSAGE',
      'MESSAGE',
      undefined,
      { subject }
    );

    // TODO: Send actual email notification to advisor
    // This would integrate with email service (SendGrid, etc.)

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Messages POST Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
