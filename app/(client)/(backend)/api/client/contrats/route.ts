 
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  requireClientPortalAccess,
  logClientPortalAccess,
  extractClientId,
} from '@/app/_common/lib/client-permissions';
import { prisma } from '@/app/_common/lib/prisma';

const querySchema = z.object({
  clientId: z.string().min(1),
  type: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

/**
 * GET /api/client/contrats?clientId=xxx
 * Get contracts for client portal
 * READ-ONLY access with strict client isolation
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = extractClientId(request);

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    const params = querySchema.parse({
      clientId,
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, params.clientId);
    if (accessDenied) return accessDenied;

    // Log access for audit
    await logClientPortalAccess(params.clientId, 'CONSULTATION', 'CONTRATS');

    const skip = (params.page - 1) * params.limit;

    // Build where clause
    const where: any = {
      clientId: params.clientId,
    };

    if (params.type) {
      where.type = params.type;
    }

    if (params.status) {
      where.status = params.status;
    }

    // Get contracts with pagination
    const [contrats, total] = await Promise.all([
      prisma.contrat.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: params.limit,
        select: {
          id: true,
          contractNumber: true,
          type: true,
          status: true,
          provider: true,
          name: true,
          value: true,
          premium: true,
          startDate: true,
          endDate: true,
          nextRenewalDate: true,
          coverage: true,
          beneficiaries: true,
          details: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.contrat.count({ where }),
    ]);

    // Get contract types for filters
    const types = await prisma.contrat.groupBy({
      by: ['type'],
      where: { clientId: params.clientId },
      _count: true,
    });

    // Get contract status for filters
    const statuses = await prisma.contrat.groupBy({
      by: ['status'],
      where: { clientId: params.clientId },
      _count: true,
    });

    // Calculate total portfolio value
    const portfolioValue = contrats.reduce((sum, c) => {
      return sum + (c.value ? Number(c.value) : 0);
    }, 0);

    // Get upcoming renewals (contracts expiring in next 3 months)
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const upcomingRenewals = await prisma.contrat.findMany({
      where: {
        clientId: params.clientId,
        endDate: {
          gte: new Date(),
          lte: threeMonthsFromNow,
        },
        status: { not: 'EXPIRE' },
      },
      orderBy: { endDate: 'asc' },
      take: 5,
      select: {
        id: true,
        contractNumber: true,
        type: true,
        provider: true,
        endDate: true,
      },
    });

    return NextResponse.json({
      contrats: contrats.map((c) => ({
        ...c,
        value: c.value ? Number(c.value) : null,
        premium: c.premium ? Number(c.premium) : null,
        coverage: c.coverage ? Number(c.coverage) : null,
      })),
      upcomingRenewals,
      stats: {
        total,
        portfolioValue,
        byType: types.map((t) => ({
          type: t.type,
          count: t._count,
        })),
        byStatus: statuses.map((s) => ({
          status: s.status,
          count: s._count,
        })),
      },
      filters: {
        types: types.map((t) => ({
          value: t.type,
          count: t._count,
        })),
        statuses: statuses.map((s) => ({
          value: s.status,
          count: s._count,
        })),
      },
      pagination: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Contrats Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
