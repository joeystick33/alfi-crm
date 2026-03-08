
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse, checkPermission } from '@/app/_common/lib/auth-helpers'
import { DocumentService } from '@/app/_common/lib/services/document-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { normalizeDocumentUpdatePayload } from '../utils'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/documents/[id]
 * Récupérer les métadonnées d'un document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: documentId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new DocumentService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const document = await service.getDocumentById(documentId)

    if (!document) {
      return createErrorResponse('Document not found', 404)
    }

    return createSuccessResponse(document)
  } catch (error: any) {
    logger.error('Error in GET /api/documents/[id]:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/documents/[id]
 * Modifier les métadonnées d'un document
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: documentId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const payload = normalizeDocumentUpdatePayload(body)

    // Check permission for signature operations
    if (payload.signatureStatus === 'SIGNE' && !checkPermission(context, 'canSignDocuments')) {
      return createErrorResponse('Permission denied: canSignDocuments', 403)
    }

    const service = new DocumentService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const document = await service.updateDocument(documentId, payload as any)

    return createSuccessResponse(document)
  } catch (error: any) {
    logger.error('Error in PATCH /api/documents/[id]:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Document not found', 404)
    }

    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/documents/[id]
 * Supprimer un document
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request); const { user } = context
    const { id: documentId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Check permission for document deletion
    if (!checkPermission(context, 'canDeleteDocuments')) {
      return createErrorResponse('Permission denied: canDeleteDocuments', 403)
    }

    const service = new DocumentService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    await service.deleteDocument(documentId)

    return createSuccessResponse({ success: true })
  } catch (error: any) {
    logger.error('Error in DELETE /api/documents/[id]:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Document not found', 404)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
