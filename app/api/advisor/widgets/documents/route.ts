import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers'
import { DocumentService } from '@/lib/services/document-service'
import { isRegularUser } from '@/lib/auth-types'

/**
 * GET /api/advisor/widgets/documents
 * Récupère les documents récents pour le widget dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '5', 10)

    const documentService = new DocumentService(
      context.cabinetId,
      context.user.id,
      context.isSuperAdmin
    )

    // Récupérer les documents récents
    const documents = await documentService.getRecentDocuments(limit)

    // Calculer les statistiques
    const stats = await documentService.getDocumentStats()

    // Formater les documents pour le widget
    const formattedDocuments = documents.map((doc: any) => {
      // Calculer la date d'échéance si applicable
      let dueLabel = null
      if (doc.expiresAt) {
        const daysUntil = Math.ceil(
          (new Date(doc.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysUntil < 0) {
          dueLabel = `Expiré depuis ${Math.abs(daysUntil)} jour(s)`
        } else if (daysUntil === 0) {
          dueLabel = 'Expire aujourd\'hui'
        } else if (daysUntil <= 7) {
          dueLabel = `Expire dans ${daysUntil} jour(s)`
        }
      }

      return {
        id: doc.id,
        name: doc.name,
        type: doc.type,
        status: doc.signatureStatus || 'PENDING',
        priority: doc.isConfidential ? 'HAUTE' : 'NORMALE',
        requiresSignature: doc.signatureStatus === 'PENDING',
        dueLabel,
        uploadedAt: doc.uploadedAt,
      }
    })

    // Calculer les statistiques du widget
    const pendingSignatures = documents.filter(
      (d: any) => d.signatureStatus === 'PENDING'
    ).length

    const expiringSoon = documents.filter((d: any) => {
      if (!d.expiresAt) return false
      const daysUntil = Math.ceil(
        (new Date(d.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      )
      return daysUntil <= 7 && daysUntil >= 0
    }).length

    return createSuccessResponse({
      documents: formattedDocuments,
      total: stats.totalDocuments,
      stats: {
        totalDocuments: stats.totalDocuments,
        pendingSignatures,
        expiringSoon,
        storageUsed: Math.round(stats.totalSizeGB * 1024), // Convert to MB
        storageLimit: 1000, // 1GB default
      },
    })
  } catch (error) {
    console.error('Get documents widget error:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
