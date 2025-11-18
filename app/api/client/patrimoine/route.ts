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
 * GET /api/client/patrimoine?clientId=xxx
 * Get detailed wealth information for client portal
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
    await logClientPortalAccess(validatedClientId, 'VIEW', 'PATRIMOINE');

    // Get client wealth data
    const client = await prisma.client.findUnique({
      where: { id: validatedClientId },
      select: {
        id: true,
        wealth: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Get all actifs with ownership details
    const clientActifs = await prisma.clientActif.findMany({
      where: { clientId: validatedClientId },
      include: {
        actif: {
          select: {
            id: true,
            name: true,
            description: true,
            type: true,
            category: true,
            value: true,
            acquisitionDate: true,
            acquisitionValue: true,
            annualIncome: true,
            details: true,
            managedByFirm: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        actif: {
          value: 'desc',
        },
      },
    });

    // Get all passifs
    const passifs = await prisma.passif.findMany({
      where: {
        clientId: validatedClientId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        initialAmount: true,
        remainingAmount: true,
        interestRate: true,
        monthlyPayment: true,
        startDate: true,
        endDate: true,
        linkedActifId: true,
      },
      orderBy: {
        remainingAmount: 'desc',
      },
    });

    // Get all contrats
    const contrats = await prisma.contrat.findMany({
      where: {
        clientId: validatedClientId,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        name: true,
        type: true,
        provider: true,
        contractNumber: true,
        startDate: true,
        endDate: true,
        premium: true,
        coverage: true,
        value: true,
        nextRenewalDate: true,
      },
      orderBy: {
        value: 'desc',
      },
    });

    // Calculate totals
    const totalActifs = clientActifs.reduce((sum, ca) => {
      const value = Number(ca.actif.value);
      const percentage = Number(ca.ownershipPercentage) / 100;
      return sum + value * percentage;
    }, 0);

    const totalPassifs = passifs.reduce((sum, p) => {
      return sum + Number(p.remainingAmount);
    }, 0);

    const netWealth = totalActifs - totalPassifs;

    // Group actifs by category
    const actifsByCategory = clientActifs.reduce((acc, ca) => {
      const category = ca.actif.category;
      const value = Number(ca.actif.value) * (Number(ca.ownershipPercentage) / 100);
      
      if (!acc[category]) {
        acc[category] = {
          total: 0,
          count: 0,
          items: [],
        };
      }
      
      acc[category].total += value;
      acc[category].count += 1;
      acc[category].items.push({
        id: ca.actif.id,
        name: ca.actif.name,
        description: ca.actif.description,
        type: ca.actif.type,
        value: value,
        ownershipPercentage: ca.ownershipPercentage,
        acquisitionDate: ca.actif.acquisitionDate,
        annualIncome: ca.actif.annualIncome,
        managedByFirm: ca.actif.managedByFirm,
      });
      
      return acc;
    }, {} as Record<string, { total: number; count: number; items: any[] }>);

    // Group passifs by type
    const passifsByType = passifs.reduce((acc, p) => {
      const type = p.type;
      const value = Number(p.remainingAmount);
      
      if (!acc[type]) {
        acc[type] = {
          total: 0,
          count: 0,
          items: [],
        };
      }
      
      acc[type].total += value;
      acc[type].count += 1;
      acc[type].items.push({
        id: p.id,
        name: p.name,
        description: p.description,
        type: p.type,
        initialAmount: p.initialAmount,
        remainingAmount: p.remainingAmount,
        interestRate: p.interestRate,
        monthlyPayment: p.monthlyPayment,
        startDate: p.startDate,
        endDate: p.endDate,
      });
      
      return acc;
    }, {} as Record<string, { total: number; count: number; items: any[] }>);

    // Group contrats by type
    const contratsByType = contrats.reduce((acc, c) => {
      const type = c.type;
      
      if (!acc[type]) {
        acc[type] = {
          count: 0,
          items: [],
        };
      }
      
      acc[type].count += 1;
      acc[type].items.push({
        id: c.id,
        name: c.name,
        type: c.type,
        provider: c.provider,
        contractNumber: c.contractNumber,
        premium: c.premium,
        coverage: c.coverage,
        value: c.value,
        nextRenewalDate: c.nextRenewalDate,
      });
      
      return acc;
    }, {} as Record<string, { count: number; items: any[] }>);

    // Calculate evolution (if stored in wealth field)
    const evolution = client.wealth ? (client.wealth as any).evolution : null;

    return NextResponse.json({
      summary: {
        totalActifs,
        totalPassifs,
        netWealth,
        evolution,
        lastCalculated: client.wealth ? (client.wealth as any).lastCalculated : null,
      },
      actifs: {
        total: totalActifs,
        count: clientActifs.length,
        byCategory: Object.entries(actifsByCategory).map(([category, data]) => ({
          category,
          total: data.total,
          count: data.count,
          percentage: totalActifs > 0 ? (data.total / totalActifs) * 100 : 0,
          items: data.items,
        })),
      },
      passifs: {
        total: totalPassifs,
        count: passifs.length,
        byType: Object.entries(passifsByType).map(([type, data]) => ({
          type,
          total: data.total,
          count: data.count,
          items: data.items,
        })),
      },
      contrats: {
        count: contrats.length,
        byType: Object.entries(contratsByType).map(([type, data]) => ({
          type,
          count: data.count,
          items: data.items,
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

    console.error('[Client Patrimoine Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
