import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers';
import { DashboardService } from '@/app/_common/lib/services/dashboard-service';
import { isRegularUser } from '@/app/_common/lib/auth-types';
import { prisma } from '@/app/_common/lib/prisma';
import { logger } from '@/app/_common/lib/logger'
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context;

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    // Get advisorId filter from query params (for admin filtering)
    const { searchParams } = new URL(request.url);
    const advisorId = searchParams.get('advisorId') || undefined;

    // For assistants, find their linked advisor
    let linkedAdvisorId: string | undefined;
    if (user.role === 'ASSISTANT') {
      const assignment = await prisma.assistantAssignment.findFirst({
        where: { assistantId: user.id },
        select: { advisorId: true }
      });
      linkedAdvisorId = assignment?.advisorId;
    }

    const service = new DashboardService(
      context.cabinetId, 
      user.id, 
      context.isSuperAdmin,
      user.role as 'ADMIN' | 'ADVISOR' | 'ASSISTANT',
      linkedAdvisorId
    );
    const counters = await service.getCounters(advisorId);

    return NextResponse.json({
      ...counters,
      userRole: user.role,
      isAdmin: user.role === 'ADMIN',
    });
  } catch (error) {
    logger.error('Error fetching dashboard counters:', { error: error instanceof Error ? error.message : String(error) });
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401);
    }
    return createErrorResponse('Failed to fetch dashboard counters', 500);
  }
}
