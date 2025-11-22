import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers'
import { DocumentService } from '@/lib/services/document-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/documents/[id]/versions
 * Récupérer l'historique des versions d'un document
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

    const versions = await service.getDocumentVersions(params.id)

    return createSuccessResponse(versions)
  } catch (error: any) {
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
