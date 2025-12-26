import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  requireClientPortalAccess,
  logClientPortalAccess,
  extractClientId,
} from '@/app/_common/lib/client-permissions';
import { ObjectifService } from '@/app/_common/lib/services/objectif-service';
import { ProjetService } from '@/app/_common/lib/services/projet-service';
import { prisma } from '@/app/_common/lib/prisma'; // For cabinetId lookup

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
    await logClientPortalAccess(validatedClientId, 'CONSULTATION', 'OBJECTIVES');

    // Get cabinetId
    const clientRaw = await prisma.client.findUnique({
      where: { id: validatedClientId },
      select: { cabinetId: true }
    });

    if (!clientRaw) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const cabinetId = clientRaw.cabinetId;
    const userId = validatedClientId;
    const userRole = 'CLIENT';

    const objectifService = new ObjectifService(cabinetId, userId, false);
    const projetService = new ProjetService(cabinetId, userId, userRole, false);

    // Get objectives
    const objectifs = await objectifService.getObjectifs({
      clientId: validatedClientId,
      status: status as string | undefined,
    });

    // Get projects
    const projets = await projetService.getProjets({
      clientId: validatedClientId,
    });

    // Calculate statistics
    const activeObjectifs = objectifs.filter((o: { status: string }) => o.status === 'ACTIF');
    const achievedObjectifs = objectifs.filter((o: { status: string }) => o.status === 'ATTEINT');

    const totalTargetAmount = activeObjectifs.reduce(
      (sum: number, o: { targetAmount?: number | string }) => sum + Number(o.targetAmount),
      0
    );

    const totalCurrentAmount = activeObjectifs.reduce(
      (sum: number, o: { currentAmount?: number | string }) => sum + Number(o.currentAmount || 0),
      0
    );

    const overallProgress = totalTargetAmount > 0
      ? (totalCurrentAmount / totalTargetAmount) * 100
      : 0;

    // Group objectives by type
    const objectifsByType = objectifs.reduce((acc: Record<string, typeof objectifs>, obj: { type: string }) => {
      if (!acc[obj.type]) {
        acc[obj.type] = [];
      }
      acc[obj.type].push(obj);
      return acc;
    }, {} as Record<string, typeof objectifs>);

    // Group projects by status
    const projetsByStatus = projets.reduce((acc: Record<string, typeof projets>, proj: { status: string }) => {
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
  } catch (error: unknown) {
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
