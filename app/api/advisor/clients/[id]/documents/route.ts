import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { DocumentService } from '@/lib/services/document-service'
import { isRegularUser } from '@/lib/auth-types'
import { calculateDocumentCompleteness } from '@/lib/utils/document-categories'

/**
 * GET /api/advisor/clients/[id]/documents
 * Récupère tous les documents d'un client avec statistiques de complétude
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

    const documentService = new DocumentService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    // Récupérer les documents du client
    const documents = await documentService.getClientDocuments(params.id)

    // Calculer la complétude (nécessite le patrimoine du client)
    // TODO: Récupérer le patrimoine du client pour le calcul
    const clientPatrimoine = 0 // Placeholder

    const completeness = calculateDocumentCompleteness(documents, clientPatrimoine)

    // Vérifier s'il y a des sources externes (GED)
    // Pour l'instant, on retourne null - à implémenter plus tard
    const externalSources = null

    return createSuccessResponse({
      documents,
      completeness,
      externalSources,
    })
  } catch (error) {
    console.error('Get client documents error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/clients/[id]/documents
 * Upload un nouveau document pour un client
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

    // Parse multipart/form-data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string

    if (!file || !type) {
      return createErrorResponse('File and type are required', 400)
    }

    // TODO: Upload file to storage (S3, Supabase Storage, etc.)
    // For now, we'll create a placeholder URL
    const fileUrl = `/uploads/${file.name}`
    const fileSize = file.size
    const mimeType = file.type

    const documentService = new DocumentService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    // Créer le document et le lier au client
    const document = await documentService.createAndLinkDocument(
      {
        name: name || file.name,
        description: description || '',
        fileUrl,
        fileSize,
        mimeType,
        type: type as any,
      },
      {
        documentId: '', // Will be set by createAndLinkDocument
        entityType: 'client',
        entityId: params.id,
      }
    )

    return createSuccessResponse(document, 201)
  } catch (error) {
    console.error('Upload client document error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
