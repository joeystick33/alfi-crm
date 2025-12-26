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
  category: z.string().optional(),
  type: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

/**
 * GET /api/client/documents?clientId=xxx
 * Get documents for client portal
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
      category: searchParams.get('category') || undefined,
      type: searchParams.get('type') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    });

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, params.clientId);
    if (accessDenied) return accessDenied;

    // Log access for audit
    await logClientPortalAccess(params.clientId, 'CONSULTATION', 'DOCUMENTS');

    // Build where clause
     
    const where: any = {
      clientId: params.clientId,
      document: {
        isConfidential: false, // Only non-confidential documents
      },
    };

    if (params.category) {
      where.document = { ...where.document, category: params.category };
    }

    if (params.type) {
      where.document = { ...where.document, type: params.type };
    }

    if (params.search) {
      where.document = {
        ...where.document,
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    const skip = (params.page - 1) * params.limit;

    // Get documents with pagination
    const [clientDocuments, total] = await Promise.all([
      prisma.clientDocument.findMany({
        where,
        include: {
          document: {
            select: {
              id: true,
              name: true,
              description: true,
              type: true,
              category: true,
              mimeType: true,
              fileSize: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: params.limit,
      }),
      prisma.clientDocument.count({ where }),
    ]);

    // Get unique categories and types from already fetched documents
    const categoryMap = new Map<string, number>();
    const typeMap = new Map<string, number>();
    
    clientDocuments.forEach((cd) => {
      if (cd.document.category) {
        categoryMap.set(cd.document.category, (categoryMap.get(cd.document.category) || 0) + 1);
      }
      if (cd.document.type) {
        typeMap.set(cd.document.type, (typeMap.get(cd.document.type) || 0) + 1);
      }
    });

    const categories = Array.from(categoryMap.entries()).map(([category, count]) => ({
      category,
      _count: count,
    }));

    const types = Array.from(typeMap.entries()).map(([type, count]) => ({
      type,
      _count: count,
    }));

    // Format documents for response
    const documents = clientDocuments.map((cd) => ({
      id: cd.document.id,
      name: cd.document.name,
      description: cd.document.description,
      type: cd.document.type,
      category: cd.document.category,
      mimeType: cd.document.mimeType,
      size: cd.document.fileSize,
      createdAt: cd.document.createdAt,
      updatedAt: cd.document.updatedAt,
      sharedAt: cd.createdAt,
    }));

    return NextResponse.json({
      documents,
      pagination: {
        total,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(total / params.limit),
      },
      filters: {
        categories: categories.map((c) => ({
          value: c.category,
          count: c._count,
        })),
        types: types.map((t) => ({
          value: t.type,
          count: t._count,
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

    console.error('[Client Documents Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
