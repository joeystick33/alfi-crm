/**
 * Service de gestion des documents KYC
 * 
 * Ce service gère le cycle de vie complet des documents KYC:
 * - Création de documents avec calcul automatique de la date d'expiration
 * - Validation et rejet de documents
 * - Mise à jour automatique du statut EXPIRE
 * - Récupération des documents par client avec filtres
 * 
 * @module lib/compliance/services/document-service
 * @requirements 2.2-2.6
 */

import { prisma } from '@/app/_common/lib/prisma'
import {
  calculateDocumentExpiration,
  type KYCDocumentType,
  type KYCDocumentStatus,
  KYC_DOCUMENT_TYPE_LABELS,
} from '../types'
import {
  createKYCDocumentSchema,
  validateKYCDocumentSchema,
  rejectKYCDocumentSchema,
  documentFiltersSchema,
  paginationSchema,
  type CreateKYCDocumentInput,
  type ValidateKYCDocumentInput,
  type RejectKYCDocumentInput,
  type DocumentFiltersInput,
  type PaginationInput,
  type PaginatedResult,
} from '../schemas'

// ============================================================================
// Types
// ============================================================================

export interface DocumentServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface KYCDocumentWithClient {
  id: string
  cabinetId: string
  clientId: string
  type: string
  fileName: string | null
  fileUrl: string | null
  status: string
  validatedAt: Date | null
  validatedById: string | null
  rejectionReason: string | null
  expiresAt: Date | null
  reminderSentAt: Date | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
  client: {
    id: string
    firstName: string
    lastName: string
    email: string | null
  }
}

// ============================================================================
// Document Service
// ============================================================================

/**
 * Crée un nouveau document KYC
 * 
 * @requirements 2.2 - WHEN a document is uploaded, THE Document_Manager SHALL set its status to "En attente de validation"
 * @requirements 2.6 - THE Document_Manager SHALL calculate and display document expiration dates based on document type
 */
export async function createDocument(
  input: CreateKYCDocumentInput
): Promise<DocumentServiceResult<KYCDocumentWithClient>> {
  try {
    // Validate input
    const validatedInput = createKYCDocumentSchema.parse(input)

    // Calculate expiration date based on document type
    const expiresAt = calculateDocumentExpiration(
      validatedInput.type as KYCDocumentType,
      new Date()
    )

    // Create document with status EN_ATTENTE (as per requirement 2.2)
    const document = await prisma.kYCDocument.create({
      data: {
        cabinetId: validatedInput.cabinetId,
        clientId: validatedInput.clientId,
        type: validatedInput.type,
        fileName: validatedInput.fileName ?? null,
        fileUrl: validatedInput.fileUrl ?? null,
        status: 'EN_ATTENTE',
        expiresAt,
        notes: validatedInput.notes ?? null,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return {
      success: true,
      data: document as KYCDocumentWithClient,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la création du document'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Valide un document KYC
 * 
 * @requirements 2.3 - WHEN a CGP validates a document, THE Document_Manager SHALL update status to "Validé" and record validation date and validator
 */
export async function validateDocument(
  input: ValidateKYCDocumentInput
): Promise<DocumentServiceResult<KYCDocumentWithClient>> {
  try {
    // Validate input
    const validatedInput = validateKYCDocumentSchema.parse(input)

    // Check if document exists and is in a valid state for validation
    const existingDocument = await prisma.kYCDocument.findUnique({
      where: { id: validatedInput.documentId },
    })

    if (!existingDocument) {
      return {
        success: false,
        error: 'Document non trouvé',
      }
    }

    // Only documents in EN_ATTENTE status can be validated
    if (existingDocument.status !== 'EN_ATTENTE') {
      return {
        success: false,
        error: `Impossible de valider un document avec le statut "${existingDocument.status}"`,
      }
    }

    // Update document status to VALIDE
    const document = await prisma.kYCDocument.update({
      where: { id: validatedInput.documentId },
      data: {
        status: 'VALIDE',
        validatedAt: new Date(),
        validatedById: validatedInput.validatedById,
        notes: validatedInput.notes ?? existingDocument.notes,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return {
      success: true,
      data: document as KYCDocumentWithClient,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la validation du document'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Rejette un document KYC
 * 
 * @requirements 2.4 - WHEN a CGP rejects a document, THE Document_Manager SHALL require a rejection reason and update status to "Rejeté"
 */
export async function rejectDocument(
  input: RejectKYCDocumentInput
): Promise<DocumentServiceResult<KYCDocumentWithClient>> {
  try {
    // Validate input - rejection reason is required by schema
    const validatedInput = rejectKYCDocumentSchema.parse(input)

    // Check if document exists and is in a valid state for rejection
    const existingDocument = await prisma.kYCDocument.findUnique({
      where: { id: validatedInput.documentId },
    })

    if (!existingDocument) {
      return {
        success: false,
        error: 'Document non trouvé',
      }
    }

    // Only documents in EN_ATTENTE status can be rejected
    if (existingDocument.status !== 'EN_ATTENTE') {
      return {
        success: false,
        error: `Impossible de rejeter un document avec le statut "${existingDocument.status}"`,
      }
    }

    // Update document status to REJETE with rejection reason
    const document = await prisma.kYCDocument.update({
      where: { id: validatedInput.documentId },
      data: {
        status: 'REJETE',
        validatedAt: new Date(),
        validatedById: validatedInput.validatedById,
        rejectionReason: validatedInput.rejectionReason,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return {
      success: true,
      data: document as KYCDocumentWithClient,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du rejet du document'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les documents KYC d'un client avec filtres optionnels
 * 
 * @requirements 2.7 - WHEN filtering documents, THE Document_Manager SHALL support filters by: status, type, client, expiration date range
 * @requirements 2.8 - THE Document_Manager SHALL display documents in a sortable table
 */
export async function getDocumentsByClient(
  cabinetId: string,
  clientId: string,
  filters?: DocumentFiltersInput
): Promise<DocumentServiceResult<KYCDocumentWithClient[]>> {
  try {
    // Build where clause
    const where: Record<string, unknown> = {
      cabinetId,
      clientId,
    }

    if (filters) {
      // Validate filters
      const validatedFilters = documentFiltersSchema.parse(filters)

      if (validatedFilters.status && validatedFilters.status.length > 0) {
        where.status = { in: validatedFilters.status }
      }

      if (validatedFilters.type && validatedFilters.type.length > 0) {
        where.type = { in: validatedFilters.type }
      }

      if (validatedFilters.expirationDateFrom || validatedFilters.expirationDateTo) {
        where.expiresAt = {}
        if (validatedFilters.expirationDateFrom) {
          (where.expiresAt as Record<string, Date>).gte = validatedFilters.expirationDateFrom
        }
        if (validatedFilters.expirationDateTo) {
          (where.expiresAt as Record<string, Date>).lte = validatedFilters.expirationDateTo
        }
      }
    }

    const documents = await prisma.kYCDocument.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { expiresAt: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return {
      success: true,
      data: documents as KYCDocumentWithClient[],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des documents'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère tous les documents KYC d'un cabinet avec filtres optionnels et pagination
 * 
 * @requirements 2.8 - THE Document_Manager SHALL display documents in a sortable table with pagination
 */
export async function getDocumentsByCabinet(
  cabinetId: string,
  filters?: DocumentFiltersInput,
  pagination?: PaginationInput
): Promise<DocumentServiceResult<PaginatedResult<KYCDocumentWithClient>>> {
  try {
    // Build where clause
    const where: Record<string, unknown> = {
      cabinetId,
    }

    if (filters) {
      // Validate filters
      const validatedFilters = documentFiltersSchema.parse(filters)

      if (validatedFilters.clientId) {
        where.clientId = validatedFilters.clientId
      }

      if (validatedFilters.status && validatedFilters.status.length > 0) {
        where.status = { in: validatedFilters.status }
      }

      if (validatedFilters.type && validatedFilters.type.length > 0) {
        where.type = { in: validatedFilters.type }
      }

      if (validatedFilters.expirationDateFrom || validatedFilters.expirationDateTo) {
        where.expiresAt = {}
        if (validatedFilters.expirationDateFrom) {
          (where.expiresAt as Record<string, Date>).gte = validatedFilters.expirationDateFrom
        }
        if (validatedFilters.expirationDateTo) {
          (where.expiresAt as Record<string, Date>).lte = validatedFilters.expirationDateTo
        }
      }
    }

    // Parse pagination with defaults
    const paginationParams = paginationSchema.parse(pagination || {})
    const { page, limit, sortBy, sortOrder } = paginationParams
    const skip = (page - 1) * limit

    // Build orderBy clause
    const orderBy: Record<string, string>[] = []
    if (sortBy) {
      orderBy.push({ [sortBy]: sortOrder })
    } else {
      // Default sorting: expiring soon first, then by creation date
      orderBy.push({ expiresAt: 'asc' })
      orderBy.push({ createdAt: 'desc' })
    }

    // Execute count and find in parallel for better performance
    const [total, documents] = await Promise.all([
      prisma.kYCDocument.count({ where }),
      prisma.kYCDocument.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ])

    const totalPages = Math.ceil(total / limit)

    return {
      success: true,
      data: {
        data: documents as KYCDocumentWithClient[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasMore: page < totalPages,
        },
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des documents'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Met à jour automatiquement le statut des documents expirés
 * 
 * @requirements 2.5 - WHEN a document expiration date is reached, THE Document_Manager SHALL automatically update status to "Expiré"
 */
export async function updateExpiredDocuments(
  cabinetId: string
): Promise<DocumentServiceResult<{ updatedCount: number }>> {
  try {
    const now = new Date()

    // Find all documents that are expired but not yet marked as EXPIRE
    // Only VALIDE documents can become EXPIRE (not EN_ATTENTE or REJETE)
    const result = await prisma.kYCDocument.updateMany({
      where: {
        cabinetId,
        status: 'VALIDE',
        expiresAt: {
          lte: now,
        },
      },
      data: {
        status: 'EXPIRE',
      },
    })

    return {
      success: true,
      data: { updatedCount: result.count },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour des documents expirés'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les documents qui expirent bientôt (dans les X jours)
 */
export async function getExpiringDocuments(
  cabinetId: string,
  daysUntilExpiration: number = 30
): Promise<DocumentServiceResult<KYCDocumentWithClient[]>> {
  try {
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysUntilExpiration)

    const documents = await prisma.kYCDocument.findMany({
      where: {
        cabinetId,
        status: 'VALIDE',
        expiresAt: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        expiresAt: 'asc',
      },
    })

    return {
      success: true,
      data: documents as KYCDocumentWithClient[],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des documents expirants'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère un document par son ID
 */
export async function getDocumentById(
  documentId: string
): Promise<DocumentServiceResult<KYCDocumentWithClient>> {
  try {
    const document = await prisma.kYCDocument.findUnique({
      where: { id: documentId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!document) {
      return {
        success: false,
        error: 'Document non trouvé',
      }
    }

    return {
      success: true,
      data: document as KYCDocumentWithClient,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération du document'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Enregistre l'envoi d'une relance pour un document
 */
export async function recordReminderSent(
  documentId: string
): Promise<DocumentServiceResult<KYCDocumentWithClient>> {
  try {
    const document = await prisma.kYCDocument.update({
      where: { id: documentId },
      data: {
        reminderSentAt: new Date(),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return {
      success: true,
      data: document as KYCDocumentWithClient,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement de la relance'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Obtient le label français d'un type de document
 */
export function getDocumentTypeLabel(type: KYCDocumentType): string {
  return KYC_DOCUMENT_TYPE_LABELS[type]
}

/**
 * Vérifie si un document est expiré
 */
export function isDocumentExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return false
  return new Date() > expiresAt
}

/**
 * Calcule le nombre de jours avant expiration
 * Retourne null si le document n'expire pas
 * Retourne un nombre négatif si le document est déjà expiré
 */
export function getDaysUntilExpiration(expiresAt: Date | null): number | null {
  if (!expiresAt) return null
  const now = new Date()
  const diffMs = expiresAt.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}
