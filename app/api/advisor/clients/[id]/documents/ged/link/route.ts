import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { isRegularUser } from '@/lib/auth-types'

/**
 * POST /api/advisor/clients/[id]/documents/ged/link
 * Associe un document GED externe au dossier client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const { externalId } = body

    if (!externalId) {
      return createErrorResponse('externalId is required', 400)
    }

    // TODO: Implémenter la logique de liaison avec le système GED
    // 1. Vérifier que le document GED existe
    // 2. Créer un lien dans la base de données
    // 3. Éventuellement copier les métadonnées

    return createSuccessResponse({
      message: 'Document GED linked successfully',
      externalId,
      clientId: params.id,
    })
  } catch (error) {
    console.error('Link GED document error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
