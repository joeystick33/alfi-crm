import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { DocumentService } from '@/app/_common/lib/services/document-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'

/**
 * GET /api/documents/[id]/versions
 * Récupérer l'historique des versions d'un document
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

    const versions = await service.getDocumentVersions(documentId)

    return createSuccessResponse(versions)
  } catch (error) {
    console.error('Error in GET /api/documents/[id]/versions:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Document not found', 404)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
