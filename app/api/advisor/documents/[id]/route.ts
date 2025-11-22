import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse, checkPermission } from '@/lib/supabase/auth-helpers'
import { DocumentService } from '@/lib/services/document-service'
import { isRegularUser } from '@/lib/auth-types'
import { normalizeDocumentUpdatePayload } from '../utils'

/**
 * GET /api/documents/[id]
 * Récupérer les métadonnées d'un document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new DocumentService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const document = await service.getDocumentById(params.id)

    if (!document) {
      return createErrorResponse('Document not found', 404)
    }

    return createSuccessResponse(document)
  } catch (error: any) {
    console.error('Error in GET /api/documents/[id]:', error)
    
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
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const payload = normalizeDocumentUpdatePayload(body)

    // Check permission for signature operations
    if (payload.signatureStatus === 'SIGNED' && !checkPermission(context, 'canSignDocuments')) {
      return createErrorResponse('Permission denied: canSignDocuments', 403)
    }

    const service = new DocumentService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const document = await service.updateDocument(params.id, payload)

    return createSuccessResponse(document)
  } catch (error: any) {
    console.error('Error in PATCH /api/documents/[id]:', error)
    
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
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Check permission for document deletion
    if (!checkPermission(context, 'canDeleteDocuments')) {
      return createErrorResponse('Permission denied: canDeleteDocuments', 403)
    }

    const service = new DocumentService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    await service.deleteDocument(params.id)

    return createSuccessResponse({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/documents/[id]:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Document not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
