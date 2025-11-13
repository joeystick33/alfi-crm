/**
 * API Routes - Notifications
 * GET /api/notifications - Liste des notifications
 * POST /api/notifications/mark-all-read - Marquer toutes comme lues
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { getNotifications, markAllAsRead } from '@/lib/services/notification-service';

/**
 * GET /api/notifications
 * Récupérer les notifications de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    const result = await getNotifications(context.user.id, {
      unreadOnly,
      limit,
      skip
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: error.status || 500 }
    );
  }
}

/**
 * POST /api/notifications/mark-all-read
 * Marquer toutes les notifications comme lues
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request);

    const count = await markAllAsRead(context.user.id);

    return NextResponse.json({
      success: true,
      count
    });
  } catch (error: any) {
    console.error('Error marking notifications as read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark notifications as read' },
      { status: error.status || 500 }
    );
  }
}
