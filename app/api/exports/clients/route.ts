import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  createErrorResponse,
} from '@/lib/auth-helpers';
import { isRegularUser } from '@/lib/auth-types';
import {
  exportClients,
  toCSV,
  generateFilename,
} from '@/lib/services/export-service';
import { AuditService } from '@/lib/services/audit-service';

/**
 * GET /api/exports/clients
 * Exporte la liste des clients en CSV
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request);

    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400);
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const clientType = searchParams.get('clientType');
    const status = searchParams.get('status');

    // Construire les filtres
    const filters: any = {};
    if (clientType) {
      filters.clientType = clientType;
    }
    if (status) {
      filters.status = status;
    }

    // Exporter les clients
    const clients = await exportClients(context.user.cabinetId, filters);

    // Audit log
    const auditService = new AuditService(
      context.user.cabinetId,
      context.user.id,
      false
    );

    await auditService.createAuditLog({
      action: 'EXPORT',
      entityType: 'Client',
      entityId: 'bulk',
      changes: {
        format,
        filters,
        count: clients.length,
      },
    });

    if (format === 'csv') {
      const csv = toCSV(clients);
      const filename = generateFilename('clients', '', 'csv');

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    // Pour les autres formats (Excel, PDF), retourner les données JSON
    // qui seront traitées côté client
    return NextResponse.json({
      data: clients,
      filename: generateFilename(
        'clients',
        '',
        format as 'csv' | 'xlsx' | 'pdf'
      ),
    });
  } catch (error: any) {
    console.error('Erreur export clients:', error);
    return createErrorResponse(
      error.message || 'Erreur lors de l\'export des clients',
      500
    );
  }
}
