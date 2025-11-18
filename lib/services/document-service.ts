import { getPrismaClient } from '../prisma'
import { DocumentType, DocumentCategory, SignatureStatus } from '@prisma/client'

export interface CreateDocumentInput {
  name: string
  description?: string
  fileUrl: string
  fileSize: number
  mimeType: string
  type: DocumentType
  category?: DocumentCategory
  tags?: string[]
  isConfidential?: boolean
  accessLevel?: string
  signatureStatus?: SignatureStatus
  clientId?: string
  projetId?: string
  tacheId?: string
}

export interface UpdateDocumentInput {
  name?: string
  description?: string
  type?: DocumentType
  category?: DocumentCategory
  tags?: string[]
  isConfidential?: boolean
  accessLevel?: string
  signatureStatus?: SignatureStatus
  signatureProvider?: string
  signedAt?: Date
  signedBy?: any
}

export interface LinkDocumentInput {
  documentId: string
  entityType: 'client' | 'actif' | 'passif' | 'contrat' | 'projet' | 'tache'
  entityId: string
}

/**
 * Document Service
 * 
 * Manages document entities with tenant isolation.
 * Provides CRUD operations, versioning, multi-entity linking, and signature tracking.
 * 
 * Features:
 * - Document upload and storage management
 * - Version control for document revisions
 * - Multi-entity linking (clients, actifs, passifs, contrats, projets, taches)
 * - Signature status tracking
 * - Timeline event creation for document actions
 * - Tag-based search and filtering
 * 
 * @example
 * const service = new DocumentService(cabinetId, userId, isSuperAdmin)
 * const document = await service.createDocument({
 *   name: 'Contract.pdf',
 *   fileUrl: 'https://...',
 *   fileSize: 1024000,
 *   mimeType: 'application/pdf',
 *   type: 'CONTRACT',
 *   clientId: 'client-123'
 * })
 */
export class DocumentService {
  private prisma
  
  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Converts Decimal or numeric values to JavaScript number
   * 
   * Handles Prisma Decimal types and converts them to native JavaScript numbers
   * for API responses. Returns null for null/undefined values.
   * 
   * @param value - The value to convert (Decimal, number, or null/undefined)
   * @returns The numeric value or null
   */
  private toNumber(value: any): number | null {
    if (value === null || value === undefined) {
      return null
    }

    if (typeof value === 'object' && typeof value?.toNumber === 'function') {
      return value.toNumber()
    }

    return value
  }

  /**
   * Formats a document entity with nested relations
   * 
   * Converts Prisma raw data to clean API response format:
   * - Converts Decimal fileSize to number
   * - Formats nested user, client, and entity relations
   * - Removes Prisma internal metadata
   * 
   * @param document - Raw document entity from Prisma
   * @returns Formatted document object or null
   */
  private formatDocument(document: any): any {
    if (!document) {
      return null
    }

    return {
      ...document,
      fileSize: this.toNumber(document.fileSize),
      uploadedBy: document.uploadedBy ? {
        id: document.uploadedBy.id,
        firstName: document.uploadedBy.firstName,
        lastName: document.uploadedBy.lastName,
        email: document.uploadedBy.email,
      } : undefined,
      clients: document.clients?.map((cd: any) => ({
        ...cd,
        client: cd.client ? {
          id: cd.client.id,
          firstName: cd.client.firstName,
          lastName: cd.client.lastName,
        } : undefined,
      })),
      actifs: document.actifs?.map((ad: any) => ({
        ...ad,
        actif: ad.actif ? {
          id: ad.actif.id,
          name: ad.actif.name,
          type: ad.actif.type,
        } : undefined,
      })),
      passifs: document.passifs?.map((pd: any) => ({
        ...pd,
        passif: pd.passif ? {
          id: pd.passif.id,
          name: pd.passif.name,
          type: pd.passif.type,
        } : undefined,
      })),
      contrats: document.contrats?.map((cd: any) => ({
        ...cd,
        contrat: cd.contrat ? {
          id: cd.contrat.id,
          name: cd.contrat.name,
          type: cd.contrat.type,
        } : undefined,
      })),
      projets: document.projets?.map((pd: any) => ({
        ...pd,
        projet: pd.projet ? {
          id: pd.projet.id,
          name: pd.projet.name,
        } : undefined,
      })),
      taches: document.taches?.map((td: any) => ({
        ...td,
        tache: td.tache ? {
          id: td.tache.id,
          title: td.tache.title,
        } : undefined,
      })),
    }
  }

  /**
   * Creates a new document with relationship validation
   * 
   * Validates that related entities (client, projet, tache) exist before creation.
   * Creates relationship links and timeline events automatically.
   * 
   * @param data - Document creation data including file info and optional relationships
   * @returns Formatted document entity with all relations
   * @throws Error if related entities are not found
   */
  async createDocument(data: CreateDocumentInput) {
    // Validate client relationship if provided
    if (data.clientId) {
      const client = await this.prisma.client.findFirst({
        where: {
          id: data.clientId,
          cabinetId: this.cabinetId,
        },
      })

      if (!client) {
        throw new Error('Client not found')
      }
    }

    // Validate projet relationship if provided
    if (data.projetId) {
      const projet = await this.prisma.projet.findFirst({
        where: {
          id: data.projetId,
          cabinetId: this.cabinetId,
        },
      })

      if (!projet) {
        throw new Error('Projet not found')
      }
    }

    // Validate tache relationship if provided
    if (data.tacheId) {
      const tache = await this.prisma.tache.findFirst({
        where: {
          id: data.tacheId,
          cabinetId: this.cabinetId,
        },
      })

      if (!tache) {
        throw new Error('Tache not found')
      }
    }

    // Extract relationship IDs
    const { clientId, projetId, tacheId, ...documentData } = data

    // Create the document
    const document = await this.prisma.document.create({
      data: {
        cabinetId: this.cabinetId,
        uploadedById: this.userId,
        ...documentData,
        version: 1,
        uploadedAt: new Date(),
      },
    })

    // Create relationships if provided
    if (clientId) {
      await this.prisma.clientDocument.create({
        data: {
          clientId,
          documentId: document.id,
        },
      })
    }

    if (projetId) {
      await this.prisma.projetDocument.create({
        data: {
          projetId,
          documentId: document.id,
        },
      })
    }

    if (tacheId) {
      await this.prisma.tacheDocument.create({
        data: {
          tacheId,
          documentId: document.id,
        },
      })
    }

    // Create timeline event for document upload
    if (clientId) {
      await this.prisma.timelineEvent.create({
        data: {
          cabinetId: this.cabinetId,
          clientId,
          type: 'OTHER',
          title: 'Document uploadé',
          description: `${document.name} (${document.type})`,
          relatedEntityType: 'Document',
          relatedEntityId: document.id,
          createdBy: this.userId,
        },
      })
    }

    // Return formatted document
    return this.getDocumentById(document.id)
  }

  /**
   * Creates a document and links it directly to an entity
   * 
   * Convenience method that combines document creation and entity linking in one operation.
   * 
   * @param documentData - Document creation data
   * @param linkData - Entity linking information (type and ID)
   * @returns Formatted document entity
   */
  async createAndLinkDocument(
    documentData: CreateDocumentInput,
    linkData: LinkDocumentInput
  ) {
    // Créer le document
    const document = await this.createDocument(documentData)

    // Lier à l'entité
    await this.linkDocument({
      documentId: document.id,
      entityType: linkData.entityType,
      entityId: linkData.entityId,
    })

    return document
  }

  /**
   * Retrieves a document by ID with formatting
   * 
   * Fetches document with all nested relations and applies formatting.
   * Enforces tenant isolation.
   * 
   * @param id - Document ID
   * @returns Formatted document entity or null if not found
   */
  async getDocumentById(id: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        clients: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        actifs: {
          include: {
            actif: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        passifs: {
          include: {
            passif: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        contrats: {
          include: {
            contrat: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        },
        projets: {
          include: {
            projet: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        taches: {
          include: {
            tache: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    return this.formatDocument(document)
  }

  /**
   * Lists documents with extended filtering
   * 
   * Supports filtering by type, category, signature status, related entities,
   * date ranges, search terms, and tags. Results are ordered by upload date (newest first).
   * 
   * @param filters - Optional filter criteria
   * @returns Array of formatted document entities
   */
  async listDocuments(filters?: {
    type?: DocumentType
    category?: DocumentCategory
    isConfidential?: boolean
    uploadedBy?: string
    signatureStatus?: SignatureStatus
    clientId?: string
    projetId?: string
    tacheId?: string
    uploadedAfter?: Date
    uploadedBefore?: Date
    search?: string
    tags?: string[]
  }) {
    const where: any = {
      cabinetId: this.cabinetId,
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.isConfidential !== undefined) {
      where.isConfidential = filters.isConfidential
    }

    if (filters?.uploadedBy) {
      where.uploadedById = filters.uploadedBy
    }

    if (filters?.signatureStatus) {
      where.signatureStatus = filters.signatureStatus
    }

    // Filter by related entities
    if (filters?.clientId) {
      where.clients = {
        some: {
          clientId: filters.clientId,
        },
      }
    }

    if (filters?.projetId) {
      where.projets = {
        some: {
          projetId: filters.projetId,
        },
      }
    }

    if (filters?.tacheId) {
      where.taches = {
        some: {
          tacheId: filters.tacheId,
        },
      }
    }

    // Date range filters
    if (filters?.uploadedAfter || filters?.uploadedBefore) {
      where.uploadedAt = {}
      if (filters.uploadedAfter) {
        where.uploadedAt.gte = filters.uploadedAfter
      }
      if (filters.uploadedBefore) {
        where.uploadedAt.lte = filters.uploadedBefore
      }
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const documents = await this.prisma.document.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            clients: true,
            actifs: true,
            passifs: true,
            contrats: true,
            projets: true,
            taches: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    })

    return documents.map(doc => this.formatDocument(doc))
  }

  /**
   * Updates a document with timeline event for signature
   * 
   * Automatically creates a timeline event when document signature status changes to SIGNED.
   * Enforces tenant isolation.
   * 
   * @param id - Document ID
   * @param data - Partial update data
   * @returns Formatted updated document entity
   * @throws Error if document not found or access denied
   */
  async updateDocument(id: string, data: UpdateDocumentInput) {
    // Get the document first to check for signature status change
    const existingDoc = await this.prisma.document.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      include: {
        clients: {
          select: {
            clientId: true,
          },
        },
      },
    })

    if (!existingDoc) {
      throw new Error('Document not found or access denied')
    }

    const { count } = await this.prisma.document.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data,
    })

    if (count === 0) {
      throw new Error('Document not found or access denied')
    }

    // Create timeline event if document was signed
    if (data.signatureStatus === 'SIGNED' && existingDoc.signatureStatus !== 'SIGNED') {
      const clientId = existingDoc.clients?.[0]?.clientId
      if (clientId) {
        await this.prisma.timelineEvent.create({
          data: {
            cabinetId: this.cabinetId,
            clientId,
            type: 'OTHER',
            title: 'Document signé',
            description: `${existingDoc.name} a été signé`,
            relatedEntityType: 'Document',
            relatedEntityId: id,
            createdBy: this.userId,
          },
        })
      }
    }

    return this.getDocumentById(id)
  }

  /**
   * Deletes a document
   * 
   * Note: This only deletes the database record. File storage cleanup (S3, etc.)
   * should be handled separately.
   * 
   * @param id - Document ID
   * @returns Success indicator
   * @throws Error if document not found or access denied
   */
  async deleteDocument(id: string) {
    // TODO: Supprimer le fichier du stockage (S3, etc.)
    const { count } = await this.prisma.document.deleteMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (count === 0) {
      throw new Error('Document not found or access denied')
    }

    return { success: true }
  }

  /**
   * Creates a new version of a document
   * 
   * Creates a new document entity linked to the parent document, incrementing
   * the version number and preserving metadata from the parent.
   * 
   * @param parentDocumentId - ID of the parent document
   * @param newFileUrl - URL of the new file version
   * @param newFileSize - Size of the new file in bytes
   * @returns New document version entity
   * @throws Error if parent document not found
   */
  async createNewVersion(
    parentDocumentId: string,
    newFileUrl: string,
    newFileSize: number
  ) {
    // Récupérer le document parent
    const parent = await this.prisma.document.findFirst({
      where: {
        id: parentDocumentId,
        cabinetId: this.cabinetId,
      },
    })

    if (!parent) {
      throw new Error('Parent document not found')
    }

    // Créer la nouvelle version
    const newVersion = await this.prisma.document.create({
      data: {
        cabinetId: this.cabinetId,
        uploadedById: this.userId,
        name: parent.name,
        description: parent.description,
        fileUrl: newFileUrl,
        fileSize: newFileSize,
        mimeType: parent.mimeType,
        type: parent.type,
        category: parent.category,
        tags: parent.tags as any,
        isConfidential: parent.isConfidential,
        accessLevel: parent.accessLevel,
        version: parent.version + 1,
        parentVersion: parentDocumentId,
        uploadedAt: new Date(),
      },
    })

    return newVersion
  }

  /**
   * Retrieves version history of a document
   * 
   * Finds the root document and returns all versions in chronological order.
   * Traverses parent relationships to find the original version.
   * 
   * @param documentId - ID of any version of the document
   * @returns Array of all document versions ordered by version number
   * @throws Error if document not found
   */
  async getDocumentVersions(documentId: string) {
    // Récupérer le document
    const document = await this.prisma.document.findFirst({
      where: {
        id: documentId,
        cabinetId: this.cabinetId,
      },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // Trouver la version racine
    let rootId = documentId
    if (document.parentVersion) {
      // Remonter jusqu'à la racine
      let current = document
      while (current.parentVersion) {
        const parent = await this.prisma.document.findFirst({
          where: {
            id: current.parentVersion,
            cabinetId: this.cabinetId,
          },
        })
        if (!parent) break
        current = parent
        rootId = parent.id
      }
    }

    // Récupérer toutes les versions
    const allVersions = await this.prisma.document.findMany({
      where: {
        OR: [
          { id: rootId, cabinetId: this.cabinetId },
          { parentVersion: rootId, cabinetId: this.cabinetId },
        ],
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        version: 'asc',
      },
    })

    return allVersions
  }

  /**
   * Links a document to an entity
   * 
   * Creates a relationship between a document and another entity (client, actif,
   * passif, contrat, projet, or tache). Validates document existence first.
   * 
   * @param data - Link information (document ID, entity type, entity ID)
   * @returns Success indicator
   * @throws Error if document not found or unknown entity type
   */
  async linkDocument(data: LinkDocumentInput) {
    // Vérifier que le document existe
    const document = await this.prisma.document.findFirst({
      where: {
        id: data.documentId,
        cabinetId: this.cabinetId,
      },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // Créer le lien selon le type d'entité
    switch (data.entityType) {
      case 'client':
        await this.prisma.clientDocument.create({
          data: {
            clientId: data.entityId,
            documentId: data.documentId,
          },
        })
        break

      case 'actif':
        await this.prisma.actifDocument.create({
          data: {
            actifId: data.entityId,
            documentId: data.documentId,
          },
        })
        break

      case 'passif':
        await this.prisma.passifDocument.create({
          data: {
            passifId: data.entityId,
            documentId: data.documentId,
          },
        })
        break

      case 'contrat':
        await this.prisma.contratDocument.create({
          data: {
            contratId: data.entityId,
            documentId: data.documentId,
          },
        })
        break

      case 'projet':
        await this.prisma.projetDocument.create({
          data: {
            projetId: data.entityId,
            documentId: data.documentId,
          },
        })
        break

      case 'tache':
        await this.prisma.tacheDocument.create({
          data: {
            tacheId: data.entityId,
            documentId: data.documentId,
          },
        })
        break

      default:
        throw new Error(`Unknown entity type: ${data.entityType}`)
    }

    return { success: true }
  }

  /**
   * Removes the link between a document and an entity
   * 
   * Deletes the relationship record without affecting the document or entity.
   * 
   * @param data - Link information (document ID, entity type, entity ID)
   * @returns Success indicator
   * @throws Error if unknown entity type or link not found
   */
  async unlinkDocument(data: LinkDocumentInput) {
    switch (data.entityType) {
      case 'client':
        await this.prisma.clientDocument.delete({
          where: {
            clientId_documentId: {
              clientId: data.entityId,
              documentId: data.documentId,
            },
          },
        })
        break

      case 'actif':
        await this.prisma.actifDocument.delete({
          where: {
            actifId_documentId: {
              actifId: data.entityId,
              documentId: data.documentId,
            },
          },
        })
        break

      case 'passif':
        await this.prisma.passifDocument.delete({
          where: {
            passifId_documentId: {
              passifId: data.entityId,
              documentId: data.documentId,
            },
          },
        })
        break

      case 'contrat':
        await this.prisma.contratDocument.delete({
          where: {
            contratId_documentId: {
              contratId: data.entityId,
              documentId: data.documentId,
            },
          },
        })
        break

      case 'projet':
        await this.prisma.projetDocument.delete({
          where: {
            projetId_documentId: {
              projetId: data.entityId,
              documentId: data.documentId,
            },
          },
        })
        break

      case 'tache':
        await this.prisma.tacheDocument.delete({
          where: {
            tacheId_documentId: {
              tacheId: data.entityId,
              documentId: data.documentId,
            },
          },
        })
        break

      default:
        throw new Error(`Unknown entity type: ${data.entityType}`)
    }

    return { success: true }
  }

  /**
   * Retrieves all documents for a client
   * 
   * Returns documents ordered by upload date (newest first).
   * 
   * @param clientId - Client ID
   * @returns Array of document entities
   */
  async getClientDocuments(clientId: string) {
    const clientDocuments = await this.prisma.clientDocument.findMany({
      where: { clientId },
      include: {
        document: {
          include: {
            uploadedBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        document: {
          uploadedAt: 'desc',
        },
      },
    })

    return clientDocuments.map(cd => cd.document)
  }

  /**
   * Searches documents by tags
   * 
   * Finds documents that contain any of the specified tags.
   * Note: Currently filters in memory due to Prisma JSON array limitations.
   * 
   * @param tags - Array of tag strings to search for
   * @returns Array of matching document entities
   */
  async searchByTags(tags: string[]) {
    // Get all documents and filter in memory
    // TODO: Implement proper JSON array search when Prisma supports it better
    const allDocuments = await this.prisma.document.findMany({
      where: { cabinetId: this.cabinetId },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    })

    // Filter by tags in memory
    const documents = allDocuments.filter(doc => {
      if (!doc.tags) return false
      const docTags = doc.tags as any
      if (!Array.isArray(docTags)) return false
      return tags.some(tag => docTags.includes(tag))
    })

    return documents
  }

  /**
   * Retrieves document statistics
   * 
   * Calculates aggregate statistics including total count, storage size,
   * distribution by type and category, and confidential document count.
   * 
   * @returns Statistics object with counts, sizes, and distributions
   */
  async getDocumentStats() {
    const documents = await this.prisma.document.findMany({
      where: { cabinetId: this.cabinetId },
    })

    const totalSize = documents.reduce((sum: any, d: any) => sum + d.fileSize, 0)

    const byType = documents.reduce((acc: any, d: any) => {
      const type = d.type
      if (!acc[type]) {
        acc[type] = 0
      }
      acc[type]++
      return acc
    }, {} as Record<string, number>)

    const byCategory = documents.reduce((acc: any, d: any) => {
      const category = d.category || 'AUTRE'
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category]++
      return acc
    }, {} as Record<string, number>)

    const confidential = documents.filter((d: any) => d.isConfidential).length

    return {
      totalDocuments: documents.length,
      totalSize,
      totalSizeGB: totalSize / (1024 * 1024 * 1024),
      byType,
      byCategory,
      confidential,
      averageSize: documents.length > 0 ? totalSize / documents.length : 0,
    }
  }

  /**
   * Retrieves recent documents
   * 
   * Returns the most recently uploaded documents, ordered by upload date.
   * 
   * @param limit - Maximum number of documents to return (default: 20)
   * @returns Array of recent document entities
   */
  async getRecentDocuments(limit: number = 20) {
    const documents = await this.prisma.document.findMany({
      where: { cabinetId: this.cabinetId },
      take: limit,
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    })

    return documents
  }

  /**
   * Marks a document as signed
   * 
   * Convenience method to update signature status and related fields.
   * Creates a timeline event automatically.
   * 
   * @param id - Document ID
   * @param signatureProvider - Name of the signature service provider
   * @param signedBy - Information about the signer
   * @returns Formatted updated document entity
   */
  async markAsSigned(
    id: string,
    signatureProvider: string,
    signedBy: any
  ) {
    return this.updateDocument(id, {
      signatureStatus: 'SIGNED',
      signatureProvider,
      signedAt: new Date(),
      signedBy,
    })
  }
}
