import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { DocumentService } from '@/lib/services/document-service'
import { isRegularUser } from '@/lib/auth-types'

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
    
    const filters = {
      type: searchParams.get('type') as any,
      category: searchParams.get('category') as any,
      isConfidential: searchParams.get('isConfidential') === 'true',
      uploadedById: searchParams.get('uploadedById') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const documentService = new DocumentService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    const documents = await documentService.listDocuments(filters)

    return createSuccessResponse(documents)
  } catch (error) {
    console.error('List documents error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
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

    const body = await request.json()

    const documentService = new DocumentService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    // Si linkTo est fourni, créer et lier directement
    if (body.linkTo) {
      const { linkTo, ...documentData } = body
      
      const document = await documentService.createAndLinkDocument(
        documentData,
        linkTo
      )

      return createSuccessResponse(document, 201)
    }

    // Sinon, créer juste le document
    const document = await documentService.createDocument(body)

    return createSuccessResponse(document, 201)
  } catch (error) {
    console.error('Create document error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
