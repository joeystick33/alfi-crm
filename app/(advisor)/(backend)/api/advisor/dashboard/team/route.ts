import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers';
import { DashboardService } from '@/app/_common/lib/services/dashboard-service';
import { isRegularUser } from '@/app/_common/lib/auth-types';
import { logger } from '@/app/_common/lib/logger'
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request);
    const { user } = context;

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    // Only admins can access team stats
    if (user.role !== 'ADMIN') {
      return createErrorResponse('Accès réservé aux administrateurs', 403);
    }

    const service = new DashboardService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin,
      'ADMIN'
    );

    const teamStats = await service.getTeamStats();

    return NextResponse.json(teamStats);
  } catch (error) {
    logger.error('Error fetching team stats:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Failed to fetch team stats', 500);
  }
}
