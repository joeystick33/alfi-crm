import { NextRequest } from 'next/server';
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/lib/supabase/auth-helpers';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Mock notifications for now as we might not have a Notification model
    // Or check if Notification model exists
    
    return createSuccessResponse({
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 20
      }
    });

  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return createErrorResponse('Internal server error', 500);
  }
}
