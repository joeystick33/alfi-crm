import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers'
import { DocumentService } from '@/lib/services/document-service'
import { isRegularUser } from '@/lib/auth-types'
import { calculateDocumentCompleteness } from '@/lib/utils/document-categories'
import { ClientService } from '@/lib/services/client-service'

/**
 * GET /api/clients/[id]/documents
 * Récupère tous les documents d'un client avec statistiques de complétude
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

    const documentService = new DocumentService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const clientService = new ClientService(
      user.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    // Récupérer le client pour calculer la complétude
    const client = await clientService.getClientById(params.id, false)
    
    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    // Récupérer les documents du client
    const documents = await documentService.getClientDocuments(params.id)

    // Calculer la complétude documentaire
    const clientPatrimoine = (client.wealth as any)?.netWealth || 0
    const completeness = calculateDocumentCompleteness(documents, clientPatrimoine)

    return createSuccessResponse({
      documents,
      completeness,
      externalSources: null, // TODO: Implémenter GED si nécessaire
    })
  } catch (error: any) {
    console.error('Get client documents error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/clients/[id]/documents
 * Upload un nouveau document pour un client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth()
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Parse multipart/form-data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string

    if (!file || !type) {
      return createErrorResponse('File and type are required', 400)
    }

    // TODO: Upload file to storage (S3, Supabase Storage, etc.)
    // For now, we'll use a placeholder URL
    const fileUrl = `/uploads/${Date.now()}-${file.name}`
    const fileSize = file.size
    const mimeType = file.type

    const documentService = new DocumentService(
      user.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    // Créer le document et le lier au client
    const document = await documentService.createAndLinkDocument(
      {
        name: name || file.name,
        description: description || undefined,
        fileUrl,
        fileSize,
        mimeType,
        type: type as any,
        category: category as any,
      },
      {
        documentId: '', // Will be set by createAndLinkDocument
        entityType: 'client',
        entityId: params.id,
      }
    )

    return createSuccessResponse(document, 201)
  } catch (error: any) {
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
