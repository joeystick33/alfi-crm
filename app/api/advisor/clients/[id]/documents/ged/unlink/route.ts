import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { isRegularUser } from '@/lib/auth-types'

/**
 * POST /api/advisor/clients/[id]/documents/ged/unlink
 * Dissocie un document GED externe du dossier client
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

    // TODO: Implémenter la logique de dissociation avec le système GED
    // 1. Vérifier que le lien existe
    // 2. Supprimer le lien dans la base de données
    // 3. Ne pas supprimer le document GED lui-même

    return createSuccessResponse({
      message: 'Document GED unlinked successfully',
      externalId,
      clientId: params.id,
    })
  } catch (error) {
    console.error('Unlink GED document error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
