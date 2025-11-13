import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { DocumentService } from '@/lib/services/document-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * POST /api/documents/[id]/link
 * Lier un document à une entité
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
    const { entityType, entityId } = body

    if (!entityType || !entityId) {
      return createErrorResponse('entityType and entityId are required', 400)
    }

    const service = new DocumentService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    await service.linkDocumentToEntity(params.id, entityType, entityId)

    return createSuccessResponse({ message: 'Document linked successfully' })
  } catch (error) {
    console.error('Error in POST /api/documents/[id]/link:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('not found')) {
      return createErrorResponse('Document or entity not found', 404)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * GET /api/documents/[id]/link
 * Récupérer les entités liées à un document
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

    const links = await service.getDocumentLinks(params.id)

    return createSuccessResponse(links)
  } catch (error) {
    console.error('Error in GET /api/documents/[id]/link:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
