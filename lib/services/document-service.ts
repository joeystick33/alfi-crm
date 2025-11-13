import { getPrismaClient, setRLSContext } from '../prisma'
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
}

export interface UpdateDocumentInput {
  name?: string
  description?: string
  type?: DocumentType
  category?: DocumentCategory
  tags?: string[]
  isConfidential?: boolean
  accessLevel?: string
}

export interface LinkDocumentInput {
  documentId: string
  entityType: 'client' | 'actif' | 'passif' | 'contrat' | 'projet' | 'tache'
  entityId: string
}

/**
 * Service de gestion des documents
 * Gère l'upload, le versioning et les liens multi-entités
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
   * Crée un nouveau document
   */
  async createDocument(data: CreateDocumentInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const document = await this.prisma.document.create({
      data: {
        cabinetId: this.cabinetId,
        uploadedById: this.userId,
        ...data,
        version: 1,
        uploadedAt: new Date(),
      },
    })

    return document
  }

  /**
   * Crée un document et le lie directement à une entité
   */
  async createAndLinkDocument(
    documentData: CreateDocumentInput,
    linkData: LinkDocumentInput
  ) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

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
   * Récupère un document par ID
   */
  async getDocumentById(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const document = await this.prisma.document.findUnique({
      where: { id },
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
      },
    })

    return document
  }

  /**
   * Liste les documents avec filtres
   */
  async listDocuments(filters?: {
    type?: DocumentType
    category?: DocumentCategory
    isConfidential?: boolean
    uploadedById?: string
    search?: string
    tags?: string[]
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {}

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.category) {
      where.category = filters.category
    }

    if (filters?.isConfidential !== undefined) {
      where.isConfidential = filters.isConfidential
    }

    if (filters?.uploadedById) {
      where.uploadedById = filters.uploadedById
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Note: Tag filtering requires custom logic or full-text search
    // For now, we skip this filter in the where clause
    // TODO: Implement proper tag filtering

    const documents = await this.prisma.document.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
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
   * Met à jour un document
   */
  async updateDocument(id: string, data: UpdateDocumentInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const document = await this.prisma.document.update({
      where: { id },
      data,
    })

    return document
  }

  /**
   * Supprime un document
   */
  async deleteDocument(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // TODO: Supprimer le fichier du stockage (S3, etc.)
    
    await this.prisma.document.delete({
      where: { id },
    })

    return { success: true }
  }

  /**
   * Crée une nouvelle version d'un document
   */
  async createNewVersion(
    parentDocumentId: string,
    newFileUrl: string,
    newFileSize: number
  ) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Récupérer le document parent
    const parent = await this.prisma.document.findUnique({
      where: { id: parentDocumentId },
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
   * Récupère l'historique des versions d'un document
   */
  async getDocumentVersions(documentId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Récupérer le document
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
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
        const parent = await this.prisma.document.findUnique({
          where: { id: current.parentVersion },
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
          { id: rootId },
          { parentVersion: rootId },
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
   * Lie un document à une entité
   */
  async linkDocument(data: LinkDocumentInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que le document existe
    const document = await this.prisma.document.findUnique({
      where: { id: data.documentId },
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
   * Retire le lien entre un document et une entité
   */
  async unlinkDocument(data: LinkDocumentInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

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
   * Récupère les documents d'un client
   */
  async getClientDocuments(clientId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

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
   * Recherche de documents par tags
   */
  async searchByTags(tags: string[]) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Get all documents and filter in memory
    // TODO: Implement proper JSON array search when Prisma supports it better
    const allDocuments = await this.prisma.document.findMany({
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
   * Récupère les statistiques des documents
   */
  async getDocumentStats() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const documents = await this.prisma.document.findMany()

    const totalSize = documents.reduce((sum, d) => sum + d.fileSize, 0)

    const byType = documents.reduce((acc, d) => {
      const type = d.type
      if (!acc[type]) {
        acc[type] = 0
      }
      acc[type]++
      return acc
    }, {} as Record<string, number>)

    const byCategory = documents.reduce((acc, d) => {
      const category = d.category || 'AUTRE'
      if (!acc[category]) {
        acc[category] = 0
      }
      acc[category]++
      return acc
    }, {} as Record<string, number>)

    const confidential = documents.filter(d => d.isConfidential).length

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
   * Récupère les documents récents
   */
  async getRecentDocuments(limit: number = 20) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const documents = await this.prisma.document.findMany({
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
   * Marque un document comme signé
   */
  async markAsSigned(
    id: string,
    signatureProvider: string,
    signedBy: any
  ) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const document = await this.prisma.document.update({
      where: { id },
      data: {
        signatureStatus: 'SIGNED',
        signatureProvider,
        signedAt: new Date(),
        signedBy,
      },
    })

    return document
  }
}
