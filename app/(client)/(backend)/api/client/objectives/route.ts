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

import { ObjectifStatus } from '@prisma/client';

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
      status: status as ObjectifStatus | undefined,
    });

    // Get projects
    const projets = await projetService.getProjets({
      clientId: validatedClientId,
    });

    // Calculate statistics
    const objectifsArray = objectifs as Array<{ status: string; targetAmount?: number | string; currentAmount?: number | string; type: string }>;
    const activeObjectifs = objectifsArray.filter((o) => o.status === 'ACTIF');
    const achievedObjectifs = objectifsArray.filter((o) => o.status === 'ATTEINT');

    const totalTargetAmount = activeObjectifs.reduce(
      (sum: number, o) => sum + Number(o.targetAmount),
      0
    );

    const totalCurrentAmount = activeObjectifs.reduce(
      (sum: number, o) => sum + Number(o.currentAmount || 0),
      0
    );

    const overallProgress = totalTargetAmount > 0
      ? (totalCurrentAmount / totalTargetAmount) * 100
      : 0;

    // Group objectives by type
    const objectifsByType = objectifsArray.reduce((acc: Record<string, typeof objectifsArray>, obj) => {
      if (!acc[obj.type]) {
        acc[obj.type] = [];
      }
      acc[obj.type].push(obj);
      return acc;
    }, {} as Record<string, typeof objectifsArray>);

    // Group projects by status
    const projetsArray = projets as Array<{ status: string }>;
    const projetsByStatus = projetsArray.reduce((acc: Record<string, typeof projetsArray>, proj) => {
      if (!acc[proj.status]) {
        acc[proj.status] = [];
      }
      acc[proj.status].push(proj);
      return acc;
    }, {} as Record<string, typeof projetsArray>);

    return NextResponse.json({
      objectifs,
      projets,
      stats: {
        objectifs: {
          total: objectifsArray.length,
          active: activeObjectifs.length,
          achieved: achievedObjectifs.length,
          totalTargetAmount,
          totalCurrentAmount,
          overallProgress,
        },
        projets: {
          total: projetsArray.length,
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
