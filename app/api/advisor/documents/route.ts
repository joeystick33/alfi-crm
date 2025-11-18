import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse, checkPermission } from '@/lib/auth-helpers'
import { DocumentService } from '@/lib/services/document-service'
import { isRegularUser } from '@/lib/auth-types'
import { parseDocumentFilters, normalizeDocumentCreatePayload } from './utils'

/**
 * GET /api/documents
 * Liste les documents avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const filters = parseDocumentFilters(searchParams)

    const documentService = new DocumentService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const documents = await documentService.listDocuments(filters)

    return createSuccessResponse(documents)
  } catch (error: any) {
    console.error('Error in GET /api/documents:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/documents
 * Crée un nouveau document
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Check permission for document upload
    if (!checkPermission(context, 'canManageDocuments')) {
      return createErrorResponse('Permission denied: canManageDocuments', 403)
    }

    const body = await request.json()
    const payload = normalizeDocumentCreatePayload(body)

    const documentService = new DocumentService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    // Si linkTo est fourni, créer et lier directement (legacy support)
    if ((body as any).linkTo) {
      const { linkTo, ...documentData } = body
      
      const document = await documentService.createAndLinkDocument(
        documentData,
        linkTo
      )

      return createSuccessResponse(document, 201)
    }

    // Créer le document avec les relations
    const document = await documentService.createDocument(payload)

    return createSuccessResponse(document, 201)
  } catch (error: any) {
    console.error('Error in POST /api/documents:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
