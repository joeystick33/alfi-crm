import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/advisor/clients/[id]/documents/ged
 * Récupère la bibliothèque GED (documents externes disponibles)
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

    // TODO: Implémenter l'intégration avec un système GED externe
    // Pour l'instant, retourner une liste vide
    const documents: any[] = []

    return createSuccessResponse({
      documents,
      total: documents.length,
    })
  } catch (error) {
    console.error('Get GED library error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
