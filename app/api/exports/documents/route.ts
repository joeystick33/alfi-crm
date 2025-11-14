import { NextRequest, NextResponse } from 'next/server';
import {
  requireAuth,
  createErrorResponse,
} from '@/lib/auth-helpers';
import { isRegularUser } from '@/lib/auth-types';
import {
  exportDocuments,
  toCSV,
  generateFilename,
} from '@/lib/services/export-service';
import { prisma } from '@/lib/prisma';
import { AuditService } from '@/lib/services/audit-service';

/**
 * GET /api/exports/documents?clientId=xxx
 * Exporte la liste des documents d'un client
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

    // Exporter les documents
    const documents = await exportDocuments(clientId);

    // Audit log
    const auditService = new AuditService(
      context.user.cabinetId,
      context.user.id,
      false
    );

    await auditService.createAuditLog({
      action: 'EXPORT',
      entityType: 'Document',
      entityId: clientId,
      changes: {
        format,
        clientName: `${client.firstName} ${client.lastName}`,
        count: documents.length,
      },
    });

    if (format === 'csv') {
      const csv = toCSV(documents);
      const filename = generateFilename(
        `documents_${client.firstName}_${client.lastName}`,
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
      data: documents,
      client: {
        firstName: client.firstName,
        lastName: client.lastName,
      },
      filename: generateFilename(
        `documents_${client.firstName}_${client.lastName}`,
        '',
        format as 'csv' | 'xlsx' | 'pdf'
      ),
    });
  } catch (error: any) {
    console.error('Erreur export documents:', error);
    return createErrorResponse(
      error.message || 'Erreur lors de l\'export des documents',
      500
    );
  }
}
