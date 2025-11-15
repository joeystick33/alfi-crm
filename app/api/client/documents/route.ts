import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import {
  requireClientPortalAccess,
  logClientPortalAccess,
  extractClientId,
  filterConfidentialData,
} from '@/lib/client-permissions';

const querySchema = z.object({
  clientId: z.string().min(1),
  type: z.string().optional(),
  category: z.string().optional(),
});

/**
 * GET /api/client/documents?clientId=xxx&type=xxx&category=xxx
 * Get documents for client portal
 * READ-ONLY access - excludes confidential documents
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = extractClientId(request);
    const type = searchParams.get('type');
    const category = searchParams.get('category');

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    const { clientId: validatedClientId } = querySchema.parse({
      clientId,
      type: type || undefined,
      category: category || undefined,
    });

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, validatedClientId);
    if (accessDenied) return accessDenied;

    // Log access for audit
    await logClientPortalAccess(
      validatedClientId,
      'VIEW_DOCUMENTS',
      'DOCUMENT',
      undefined,
      { type, category }
    );

    // Build where clause for filters
    const whereClause: any = {
      clientId: validatedClientId,
      document: {
        // Exclude confidential documents from client portal
        isConfidential: false,
      },
    };

    if (type) {
      whereClause.document.type = type;
    }

    if (category) {
      whereClause.document.category = category;
    }

    // Get documents
    const clientDocuments = await prisma.clientDocument.findMany({
      where: whereClause,
      include: {
        document: {
          select: {
            id: true,
            name: true,
            description: true,
            fileUrl: true,
            fileSize: true,
            mimeType: true,
            type: true,
            category: true,
            tags: true,
            version: true,
            uploadedAt: true,
            uploadedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        document: {
          uploadedAt: 'desc',
        },
      },
    });

    // Get document counts by type
    const documentsByType = await prisma.clientDocument.groupBy({
      by: ['documentId'],
      where: {
        clientId: validatedClientId,
        document: {
          isConfidential: false,
        },
      },
      _count: true,
    });

    // Get unique types and categories
    const allDocs = await prisma.clientDocument.findMany({
      where: {
        clientId: validatedClientId,
        document: {
          isConfidential: false,
        },
      },
      include: {
        document: {
          select: {
            type: true,
            category: true,
          },
        },
      },
    });

    const types = [...new Set(allDocs.map(d => d.document.type))];
    const categories = [...new Set(allDocs.map(d => d.document.category).filter(Boolean))];

    // Count new documents (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newDocumentsCount = await prisma.clientDocument.count({
      where: {
        clientId: validatedClientId,
        createdAt: {
          gte: sevenDaysAgo,
        },
        document: {
          isConfidential: false,
        },
      },
    });

    // Format documents for response
    const documents = clientDocuments.map(cd => ({
      id: cd.document.id,
      name: cd.document.name,
      description: cd.document.description,
      fileUrl: cd.document.fileUrl,
      fileSize: cd.document.fileSize,
      mimeType: cd.document.mimeType,
      type: cd.document.type,
      category: cd.document.category,
      tags: cd.document.tags,
      version: cd.document.version,
      uploadedAt: cd.document.uploadedAt,
      uploadedBy: `${cd.document.uploadedBy.firstName} ${cd.document.uploadedBy.lastName}`,
      isNew: cd.createdAt >= sevenDaysAgo,
    }));

    return NextResponse.json({
      documents,
      stats: {
        total: documents.length,
        new: newDocumentsCount,
      },
      filters: {
        types,
        categories,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Documents Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
