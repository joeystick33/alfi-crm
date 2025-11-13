/**
 * API Routes - Notification individuelle
 * PATCH /api/notifications/[id] - Marquer comme lue
 * DELETE /api/notifications/[id] - Supprimer
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { markAsRead, deleteNotification } from '@/lib/services/notification-service';
import prisma from '@/lib/prisma';

/**
 * PATCH /api/notifications/[id]
 * Marquer une notification comme lue
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request);
    const { id } = params;

    // Vérifier que la notification appartient à l'utilisateur
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.userId !== context.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await markAsRead(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark notification as read' },
      { status: error.status || 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Supprimer une notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request);
    const { id } = params;

    // Vérifier que la notification appartient à l'utilisateur
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.userId !== context.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await deleteNotification(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete notification' },
      { status: error.status || 500 }
    );
  }
}
