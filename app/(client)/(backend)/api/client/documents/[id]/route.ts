 
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  requireClientPortalAccess,
  logClientPortalAccess,
  extractClientId,
  verifyResourceOwnership,
} from '@/app/_common/lib/client-permissions';
import { prisma } from '@/app/_common/lib/prisma';

const paramsSchema = z.object({
  id: z.string().min(1),
});

/**
 * GET /api/client/documents/[id]?clientId=xxx
 * Download a specific document
 * READ-ONLY access with strict client isolation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = paramsSchema.parse(await params);
    const clientId = extractClientId(request);

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    // Verify client portal access
    const accessDenied = await requireClientPortalAccess(request, clientId);
    if (accessDenied) return accessDenied;

    // Verify document ownership
    const hasOwnership = await verifyResourceOwnership('document', documentId, clientId);
    if (!hasOwnership) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    // Get document details
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        category: true,
        mimeType: true,
        fileSize: true,
        fileUrl: true,
        isConfidential: true,
        createdAt: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if document is confidential
    if (document.isConfidential) {
      return NextResponse.json(
        { error: 'This document is not accessible' },
        { status: 403 }
      );
    }

    // Log access for audit
    await logClientPortalAccess(clientId, 'CONSULTATION', 'DOCUMENT', documentId);

    // If requesting download (with download query param)
    const { searchParams } = new URL(request.url);
    const isDownload = searchParams.get('download') === 'true';

    if (isDownload) {
      // Log download action
      await logClientPortalAccess(clientId, 'EXPORT', 'DOCUMENT', documentId, {
        action: 'download',
      });

      // Return document metadata with download URL
      // In production, you would generate a signed URL or stream the file
      return NextResponse.json({
        id: document.id,
        name: document.name,
        mimeType: document.mimeType,
        size: document.fileSize,
        downloadUrl: document.fileUrl,
      });
    }

    // Return document metadata for preview
    return NextResponse.json({
      id: document.id,
      name: document.name,
      description: document.description,
      type: document.type,
      category: document.category,
      mimeType: document.mimeType,
      size: document.fileSize,
      previewUrl: document.fileUrl || null,
      createdAt: document.createdAt,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('[Client Document Download Error]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
