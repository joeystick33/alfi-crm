import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  createErrorResponse,
} from '@/lib/auth-helpers';
import { isRegularUser } from '@/lib/auth-types';
import {
  exportPatrimoine,
  toCSV,
  generateFilename,
} from '@/lib/services/export-service';
import { prisma } from '@/lib/prisma';
import { AuditService } from '@/lib/services/audit-service';

/**
 * GET /api/exports/patrimoine?clientId=xxx
 * Exporte le patrimoine complet d'un client (actifs, passifs, contrats)
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request);

    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const format = searchParams.get('format') || 'csv';

    if (!clientId) {
      return createErrorResponse('clientId requis', 400);
    }

    // Vérifier que le client appartient au cabinet de l'utilisateur
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: context.user.cabinetId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!client) {
      return createErrorResponse('Client non trouvé', 404);
    }

    // Exporter le patrimoine
    const patrimoine = await exportPatrimoine(clientId);

    // Audit log
    const auditService = new AuditService(
      context.user.cabinetId,
      context.user.id,
      false
    );

    await auditService.createAuditLog({
      action: 'EXPORT',
      entityType: 'Patrimoine',
      entityId: clientId,
      changes: {
        format,
        clientName: `${client.firstName} ${client.lastName}`,
      },
    });

    if (format === 'csv') {
      // Pour CSV, créer un fichier avec 3 sections
      const sections = [
        '=== ACTIFS ===',
        toCSV(patrimoine.actifs),
        '',
        '=== PASSIFS ===',
        toCSV(patrimoine.passifs),
        '',
        '=== CONTRATS ===',
        toCSV(patrimoine.contrats),
      ];

      const csv = sections.join('\n');
      const filename = generateFilename(
        `patrimoine_${client.firstName}_${client.lastName}`,
        '',
        'csv'
      );

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Pour les autres formats, retourner les données JSON
    return NextResponse.json({
      data: patrimoine,
      client: {
        firstName: client.firstName,
        lastName: client.lastName,
      },
      filename: generateFilename(
        `patrimoine_${client.firstName}_${client.lastName}`,
        '',
        format as 'csv' | 'xlsx' | 'pdf'
      ),
    });
  } catch (error: any) {
    console.error('Erreur export patrimoine:', error);
    return createErrorResponse(
      error.message || 'Erreur lors de l\'export du patrimoine',
      500
    );
  }
}
