 
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  requireClientPortalAccess,
  logClientPortalAccess,
  extractClientId,
} from '@/app/_common/lib/client-permissions';
import { PatrimoineService } from '@/app/_common/lib/services/patrimoine-service';
import { prisma } from '@/app/_common/lib/prisma';

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
    await logClientPortalAccess(validatedClientId, 'CONSULTATION', 'PATRIMOINE');

    // Get client info for cabinetId
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

    const service = new PatrimoineService(cabinetId, userId, userRole);
    const patrimoine = await service.getClientPatrimoine(validatedClientId);

    // Format response to match expected structure
    // The service returns { actifs, passifs, contrats, wealth }
    // The original route returned { summary, actifs, passifs, contrats } with specific grouping

    // We can reuse the service's wealth calculation for summary
    const { wealth, actifs, passifs, contrats } = patrimoine;

    return NextResponse.json({
      summary: {
        totalActifs: wealth.totalActifs,
        totalPassifs: wealth.totalPassifs,
        netWealth: wealth.netWealth,
        evolution: (wealth as any).evolution || null, // Service might not return evolution in wealth object yet
        lastCalculated: wealth.lastCalculated,
      },
      actifs: {
        total: wealth.totalActifs,
        count: actifs.length,
        byCategory: Object.entries(wealth.actifsByCategory).map(([category, value]) => ({
          category,
          total: value,
          count: 0, // Service doesn't return count by category directly, but we can compute if needed or omit
          percentage: wealth.totalActifs > 0 ? (value / wealth.totalActifs) * 100 : 0,
          items: actifs.filter(a => a.category === category),
        })),
      },
      passifs: {
        total: wealth.totalPassifs,
        count: passifs.length,
        byType: Object.entries(wealth.passifsByType).map(([type, value]) => ({
          type,
          total: value,
          count: 0,
          items: passifs.filter(p => p.type === type),
        })),
      },
      contrats: {
        count: contrats.length,
        byType: [], // We can implement grouping if needed, or frontend can handle it
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
