import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  requireClientPortalAccess,
  logClientPortalAccess,
  extractClientId,
} from '@/lib/client-permissions';

const querySchema = z.object({
  clientId: z.string().min(1),
  status: z.string().optional(),
});

/**
 * GET /api/client/objectives?clientId=xxx&status=ACTIVE
 * Get objectives for client portal
 * READ-ONLY access with strict client isolation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = extractClientId(request);
    const status = searchParams.get('status');

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    const { clientId: validatedClientId } = querySchema.parse({
      clientId,
      status: status || undefined,
    });

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, validatedClientId);
    if (accessDenied) return accessDenied;

    // Log access for audit
    await logClientPortalAccess(validatedClientId, 'VIEW', 'OBJECTIVES');

    // Build where clause
    const whereClause: any = {
      clientId: validatedClientId,
    };

    if (status) {
      whereClause.status = status;
    }

    // Get objectives
    const objectifs = await prisma.objectif.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        targetAmount: true,
        targetDate: true,
        currentAmount: true,
        progress: true,
        priority: true,
        monthlyContribution: true,
        recommendations: true,
        status: true,
        createdAt: true,
        achievedAt: true,
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { targetDate: 'asc' },
      ],
    });

    // Get projects
    const projets = await prisma.projet.findMany({
      where: {
        clientId: validatedClientId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        estimatedBudget: true,
        actualBudget: true,
        startDate: true,
        targetDate: true,
        endDate: true,
        progress: true,
        status: true,
        createdAt: true,
      },
      orderBy: [
        { status: 'asc' },
        { targetDate: 'asc' },
      ],
    });

    // Calculate statistics
    const activeObjectifs = objectifs.filter(o => o.status === 'ACTIVE');
    const achievedObjectifs = objectifs.filter(o => o.status === 'ACHIEVED');
    
    const totalTargetAmount = activeObjectifs.reduce(
      (sum, o) => sum + Number(o.targetAmount),
      0
    );
    
    const totalCurrentAmount = activeObjectifs.reduce(
      (sum, o) => sum + Number(o.currentAmount || 0),
      0
    );

    const overallProgress = totalTargetAmount > 0
      ? (totalCurrentAmount / totalTargetAmount) * 100
      : 0;

    // Group objectives by type
    const objectifsByType = objectifs.reduce((acc, obj) => {
      if (!acc[obj.type]) {
        acc[obj.type] = [];
      }
      acc[obj.type].push(obj);
      return acc;
    }, {} as Record<string, typeof objectifs>);

    // Group projects by status
    const projetsByStatus = projets.reduce((acc, proj) => {
      if (!acc[proj.status]) {
        acc[proj.status] = [];
      }
      acc[proj.status].push(proj);
      return acc;
    }, {} as Record<string, typeof projets>);

    return NextResponse.json({
      objectifs,
      projets,
      stats: {
        objectifs: {
          total: objectifs.length,
          active: activeObjectifs.length,
          achieved: achievedObjectifs.length,
          totalTargetAmount,
          totalCurrentAmount,
          overallProgress,
        },
        projets: {
          total: projets.length,
          byStatus: Object.entries(projetsByStatus).map(([status, items]) => ({
            status,
            count: items.length,
          })),
        },
      },
      groupedData: {
        objectifsByType: Object.entries(objectifsByType).map(([type, items]) => ({
          type,
          count: items.length,
          items,
        })),
        projetsByStatus: Object.entries(projetsByStatus).map(([status, items]) => ({
          status,
          count: items.length,
          items,
        })),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Objectives Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
