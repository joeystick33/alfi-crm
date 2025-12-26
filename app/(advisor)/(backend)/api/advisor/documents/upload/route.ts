import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse, checkPermission } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { StorageService } from '@/app/_common/lib/services/storage-service'

/**
 * POST /api/advisor/documents/upload
 * Upload brut d'un fichier vers le stockage GED
 *
 * - Attend un multipart/form-data avec le champ `file`
 * - Retourne les métadonnées nécessaires pour créer ensuite un Document via POST /advisor/documents
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Check permission for document upload
    if (!checkPermission(context, 'canManageDocuments')) {
      return createErrorResponse('Permission denied: canManageDocuments', 403)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return createErrorResponse('File is required', 400)
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const provider = process.env.DOCUMENT_STORAGE_PROVIDER || 'LOCAL'
    const storageService = new StorageService(context.cabinetId, provider)

    const uploadResult = await storageService.uploadFile(
      {
        buffer,
        originalname: file.name,
        mimetype: file.type || 'application/octet-stream',
        size: file.size,
      },
      'documents'
    )

    return createSuccessResponse(
      {
        fileUrl: uploadResult.url,
        fileSize: uploadResult.size,
        mimeType: file.type || 'application/octet-stream',
        checksum: uploadResult.checksum,
        storageProvider: uploadResult.provider,
        storageKey: uploadResult.key,
        storageBucket: uploadResult.bucket,
        storageRegion: uploadResult.region,
      },
      201
    )
  } catch (error) {
    console.error('Error in POST /api/advisor/documents/upload:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
