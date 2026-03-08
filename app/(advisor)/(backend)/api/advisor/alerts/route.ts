import { NextRequest } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers';
import { isRegularUser } from '@/app/_common/lib/auth-types';
import { DashboardService } from '@/app/_common/lib/services/dashboard-service';
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/alerts
 * Agrège les alertes critiques pour le conseiller à partir de tâches, KYC et contrats.
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context;

    if (!isRegularUser(user) || !context.cabinetId) {
      return createErrorResponse('Invalid user type', 400);
    }

    const { searchParams } = new URL(request.url);
    const urgentOnly = searchParams.get('urgent') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const service = new DashboardService(context.cabinetId, user.id, context.isSuperAdmin);
    const alertsData = await service.getAdvisorAlerts(user.id, limit, urgentOnly);

    return createSuccessResponse(alertsData);
  } catch (error) {
    logger.error('Error fetching alerts:', { error: error instanceof Error ? error.message : String(error) });

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }

    return createErrorResponse('Internal server error', 500);
  }
}
