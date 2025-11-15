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
});

/**
 * GET /api/client/dashboard?clientId=xxx
 * Get dashboard data for client portal
 * READ-ONLY access with strict client isolation
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = extractClientId(request);

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    const { clientId: validatedClientId } = querySchema.parse({ clientId });

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, validatedClientId);
    if (accessDenied) return accessDenied;

    // Log access for audit
    await logClientPortalAccess(validatedClientId, 'VIEW_DASHBOARD');

    // Get client info
    const client = await prisma.client.findUnique({
      where: { id: validatedClientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        wealth: true,
      },
    });

    // Get wealth summary
    const [actifs, passifs] = await Promise.all([
      prisma.clientActif.findMany({
        where: { clientId: validatedClientId },
        include: {
          actif: {
            select: {
              id: true,
              name: true,
              type: true,
              category: true,
              value: true,
              annualIncome: true,
            },
          },
        },
      }),
      prisma.passif.findMany({
        where: { clientId: validatedClientId },
        select: {
          id: true,
          name: true,
          type: true,
          remainingAmount: true,
          monthlyPayment: true,
        },
      }),
    ]);

    // Calculate wealth
    const totalActifs = actifs.reduce((sum, ca) => {
      const value = Number(ca.actif.value);
      const percentage = Number(ca.ownershipPercentage) / 100;
      return sum + value * percentage;
    }, 0);

    const totalPassifs = passifs.reduce((sum, p) => {
      return sum + Number(p.remainingAmount);
    }, 0);

    const netWealth = totalActifs - totalPassifs;

    // Group actifs by category
    const actifsByCategory = actifs.reduce((acc, ca) => {
      const category = ca.actif.category;
      const value = Number(ca.actif.value) * (Number(ca.ownershipPercentage) / 100);
      
      if (!acc[category]) {
        acc[category] = { total: 0, items: [] };
      }
      
      acc[category].total += value;
      acc[category].items.push({
        id: ca.actif.id,
        name: ca.actif.name,
        type: ca.actif.type,
        value: value,
      });
      
      return acc;
    }, {} as Record<string, { total: number; items: any[] }>);

    // Get recent documents count
    const documentsCount = await prisma.clientDocument.count({
      where: { clientId: validatedClientId },
    });

    // Get recent documents (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentDocuments = await prisma.clientDocument.count({
      where: {
        clientId: validatedClientId,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get next appointment
    const nextAppointment = await prisma.rendezVous.findFirst({
      where: {
        clientId: validatedClientId,
        startDate: {
          gte: new Date(),
        },
        status: {
          in: ['SCHEDULED', 'CONFIRMED'],
        },
      },
      orderBy: {
        startDate: 'asc',
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        type: true,
        location: true,
        isVirtual: true,
        meetingUrl: true,
      },
    });

    // Get active objectives
    const objectifs = await prisma.objectif.findMany({
      where: {
        clientId: validatedClientId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        type: true,
        targetAmount: true,
        currentAmount: true,
        progress: true,
        targetDate: true,
      },
      orderBy: {
        targetDate: 'asc',
      },
      take: 5,
    });

    const totalObjectifs = objectifs.length;
    const achievedObjectifs = objectifs.filter(o => (o.progress || 0) >= 100).length;

    // Get recent activity (timeline events)
    const recentActivity = await prisma.timelineEvent.findMany({
      where: {
        clientId: validatedClientId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        type: true,
        title: true,
        description: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      client: {
        firstName: client.firstName,
        lastName: client.lastName,
      },
      wealth: {
        total: netWealth,
        actifs: totalActifs,
        passifs: totalPassifs,
        evolution: client.wealth ? (client.wealth as any).evolution : null,
        byCategory: Object.entries(actifsByCategory).map(([category, data]) => ({
          category,
          total: data.total,
          percentage: totalActifs > 0 ? (data.total / totalActifs) * 100 : 0,
          items: data.items,
        })),
      },
      stats: {
        documents: {
          total: documentsCount,
          recent: recentDocuments,
        },
        nextAppointment,
        objectifs: {
          total: totalObjectifs,
          achieved: achievedObjectifs,
          inProgress: totalObjectifs - achievedObjectifs,
        },
      },
      objectifs,
      recentActivity,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('[Client Dashboard Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
