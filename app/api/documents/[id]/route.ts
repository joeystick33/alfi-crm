import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { DocumentService } from '@/lib/services/document-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/documents/[id]
 * Récupérer les métadonnées d'un document
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new DocumentService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const document = await service.getDocumentById(params.id)

    if (!document) {
      return createErrorResponse('Document not found', 404)
    }

    return createSuccessResponse(document)
  } catch (error) {
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
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()

    const service = new DocumentService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const document = await service.updateDocument(params.id, body)

    return createSuccessResponse(document)
  } catch (error) {
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
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new DocumentService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    await service.deleteDocument(params.id)

    return createSuccessResponse({ message: 'Document deleted successfully' })
  } catch (error) {
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
