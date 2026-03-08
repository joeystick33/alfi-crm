 
import { NextRequest } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers';
import { isRegularUser } from '@/app/_common/lib/auth-types';
import { OpportuniteService } from '@/app/_common/lib/services/opportunite-service';
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/opportunities
 * Fetch opportunities for the advisor with aggregated statistics
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context;
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Use OpportuniteService to fetch opportunities
    const service = new OpportuniteService(
      context.cabinetId!, // Assert cabinetId is present for regular users
      user.id,
      user.role,
      context.isSuperAdmin
    );

    // Build filters - don't pass status filter if it's "active" (not a real status)
    const filters: any = {};
    if (statusParam && statusParam !== 'active') {
      filters.status = statusParam.toUpperCase();
    }

    // Fetch opportunities
    let opportunities = await service.getOpportunites(filters);
    
    // If "active" was requested, filter to active statuses
    if (statusParam === 'active') {
      opportunities = opportunities.filter((opp: any) => 
        ['DETECTEE', 'CONTACTEE', 'QUALIFIEE', 'PRESENTEE', 'ACCEPTEE'].includes(opp.status)
      );
    }
    
    // Apply limit
    if (limit) {
      opportunities = opportunities.slice(0, limit);
    }

    // Calculate statistics
    const totalPipelineValue = opportunities.reduce((sum, opp) => {
      return sum + (opp.estimatedValue || 0) * ((opp.probability || 0) / 100);
    }, 0);

    const activeCount = opportunities.filter(opp => 
      ['IDENTIFIED', 'QUALIFIEE', 'PROPOSITION', 'NEGOTIATION'].includes(opp.status)
    ).length;

    const avgProbability = opportunities.length > 0
      ? opportunities.reduce((sum, opp) => sum + (opp.probability || 0), 0) / opportunities.length
      : 0;

    const requiresAction = opportunities.filter(opp => 
      opp.priority === 'URGENTE' || opp.priority === 'HAUTE'
    ).length;

    return createSuccessResponse({
      opportunities,
      total: opportunities.length,
      totalPipelineValue,
      stats: {
        active: activeCount,
        avgScore: Math.round(avgProbability),
      },
      requiresAction,
    });
  } catch (error) {
    logger.error('Error fetching opportunities:', { error: error instanceof Error ? error.message : String(error) });
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }
    
    return createErrorResponse('Internal server error', 500);
  }
}
