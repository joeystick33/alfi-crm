import { getPrismaClient } from '../prisma'
import { KYCDocumentType, KYCDocStatus, KYCStatus } from '@prisma/client'

export interface CreateKYCDocumentInput {
  clientId: string
  type: KYCDocumentType
  documentId?: string
  expiresAt?: Date
}

export interface ValidateKYCDocumentInput {
  kycDocumentId: string
  status: KYCDocStatus
  validatedBy: string
}

export interface KYCCheckResult {
  isComplete: boolean
  missingDocuments: KYCDocumentType[]
  expiredDocuments: KYCDocumentType[]
  pendingDocuments: KYCDocumentType[]
  completionPercentage: number
}

/**
 * Service de gestion KYC (Know Your Customer)
 * Gère la vérification d'identité et la conformité réglementaire
 */
export class KYCService {
  private prisma
  
  // Documents KYC requis pour un client particulier
  private readonly REQUIRED_DOCUMENTS: KYCDocumentType[] = [
    'IDENTITY',
    'PROOF_OF_ADDRESS',
    'TAX_NOTICE',
    'BANK_RIB',
  ]

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Ajoute un document KYC pour un client
   */
  async addKYCDocument(data: CreateKYCDocumentInput) {
    // Vérifier que le client existe
    const client = await this.prisma.client.findFirst({
      where: {
        id: data.clientId,
        cabinetId: this.cabinetId,
      },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    // Si documentId fourni, vérifier qu'il existe
    if (data.documentId) {
      const document = await this.prisma.document.findFirst({
        where: {
          id: data.documentId,
          cabinetId: this.cabinetId,
        },
      })

      if (!document) {
        throw new Error('Document not found')
      }
    }

    const kycDocument = await this.prisma.kYCDocument.create({
      data: {
        clientId: data.clientId,
        type: data.type,
        documentId: data.documentId,
        status: 'PENDING',
        expiresAt: data.expiresAt,
      },
    })

    // Mettre à jour le statut KYC du client
    await this.updateClientKYCStatus(data.clientId)

    return kycDocument
  }

  /**
   * Valide ou rejette un document KYC
   */
  async validateKYCDocument(data: ValidateKYCDocumentInput) {
    const kycDocument = await this.prisma.kYCDocument.update({
      where: { id: data.kycDocumentId },
      data: {
        status: data.status,
        validatedAt: data.status === 'VALIDATED' ? new Date() : null,
        validatedBy: data.validatedBy,
      },
    })

    // Mettre à jour le statut KYC du client
    await this.updateClientKYCStatus(kycDocument.clientId)

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: kycDocument.clientId,
        type: 'KYC_UPDATED',
        title: `Document KYC ${data.status === 'VALIDATED' ? 'validé' : 'rejeté'}`,
        description: `Type: ${kycDocument.type}`,
        relatedEntityType: 'KYCDocument',
        relatedEntityId: kycDocument.id,
        createdBy: this.userId,
      },
    })

    return kycDocument
  }

  /**
   * Récupère les documents KYC d'un client
   */
  async getClientKYCDocuments(clientId: string) {
    const kycDocuments = await this.prisma.kYCDocument.findMany({
      where: { clientId },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return kycDocuments
  }

  /**
   * Vérifie le statut KYC d'un client
   */
  async checkClientKYC(clientId: string): Promise<KYCCheckResult> {
    const kycDocuments = await this.prisma.kYCDocument.findMany({
      where: { clientId },
    })

    const now = new Date()

    // Grouper par type et garder le plus récent de chaque type
    const latestByType = kycDocuments.reduce((acc: any, doc: any) => {
      if (!acc[doc.type] || doc.createdAt > acc[doc.type].createdAt) {
        acc[doc.type] = doc
      }
      return acc
    }, {} as Record<string, any>)

    const missingDocuments: KYCDocumentType[] = []
    const expiredDocuments: KYCDocumentType[] = []
    const pendingDocuments: KYCDocumentType[] = []
    let validatedCount = 0

    for (const requiredType of this.REQUIRED_DOCUMENTS) {
      const doc = latestByType[requiredType]

      if (!doc) {
        missingDocuments.push(requiredType)
      } else if (doc.status === 'PENDING') {
        pendingDocuments.push(requiredType)
      } else if (doc.status === 'EXPIRED' || (doc.expiresAt && doc.expiresAt < now)) {
        expiredDocuments.push(requiredType)
      } else if (doc.status === 'VALIDATED') {
        validatedCount++
      }
    }

    const isComplete = 
      missingDocuments.length === 0 &&
      expiredDocuments.length === 0 &&
      pendingDocuments.length === 0

    const completionPercentage = 
      (validatedCount / this.REQUIRED_DOCUMENTS.length) * 100

    return {
      isComplete,
      missingDocuments,
      expiredDocuments,
      pendingDocuments,
      completionPercentage,
    }
  }

  /**
   * Met à jour le statut KYC global du client
   */
  async updateClientKYCStatus(clientId: string) {
    const kycCheck = await this.checkClientKYC(clientId)

    let kycStatus: KYCStatus
    let kycCompletedAt: Date | null = null
    let kycNextReviewDate: Date | null = null

    if (kycCheck.isComplete) {
      kycStatus = 'COMPLETED'
      kycCompletedAt = new Date()
      
      // Prochaine revue dans 1 an
      kycNextReviewDate = new Date()
      kycNextReviewDate.setFullYear(kycNextReviewDate.getFullYear() + 1)
    } else if (kycCheck.pendingDocuments.length > 0) {
      kycStatus = 'IN_PROGRESS'
    } else if (kycCheck.expiredDocuments.length > 0) {
      kycStatus = 'EXPIRED'
    } else {
      kycStatus = 'PENDING'
    }

    const { count } = await this.prisma.client.updateMany({
      where: {
        id: clientId,
        cabinetId: this.cabinetId,
      },
      data: {
        kycStatus,
        kycCompletedAt,
        kycNextReviewDate,
      },
    })

    if (count === 0) {
      throw new Error('Client not found or access denied')
    }

    return kycStatus
  }

  /**
   * Récupère les clients avec KYC incomplet
   */
  async getClientsWithIncompleteKYC() {
    const clients = await this.prisma.client.findMany({
      where: {
        kycStatus: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
        cabinetId: this.cabinetId,
      },
      include: {
        conseiller: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    return clients
  }

  /**
   * Récupère les clients avec KYC expiré
   */
  async getClientsWithExpiredKYC() {
    const clients = await this.prisma.client.findMany({
      where: {
        kycStatus: 'EXPIRED',
        cabinetId: this.cabinetId,
      },
      include: {
        conseiller: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        kycCompletedAt: 'asc',
      },
    })

    return clients
  }

  /**
   * Récupère les clients dont le KYC arrive à expiration
   */
  async getClientsWithKYCExpiringSoon(days: number = 30) {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const clients = await this.prisma.client.findMany({
      where: {
        kycStatus: 'COMPLETED',
        cabinetId: this.cabinetId,
        kycNextReviewDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        conseiller: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        kycNextReviewDate: 'asc',
      },
    })

    return clients
  }

  /**
   * Vérifie les documents KYC expirés et met à jour leur statut
   */
  async checkExpiredKYCDocuments() {
    const now = new Date()

    const expiredDocuments = await this.prisma.kYCDocument.findMany({
      where: {
        status: 'VALIDATED',
        expiresAt: {
          lt: now,
        },
      },
    })

    // Mettre à jour le statut
    for (const doc of expiredDocuments) {
      await this.prisma.kYCDocument.update({
        where: { id: doc.id },
        data: { status: 'EXPIRED' },
      })

      // Mettre à jour le statut KYC du client
      await this.updateClientKYCStatus(doc.clientId)
    }

    return {
      count: expiredDocuments.length,
      documents: expiredDocuments,
    }
  }

  /**
   * Récupère les statistiques KYC du cabinet
   */
  async getKYCStats() {
    const clients = await this.prisma.client.findMany({
      select: {
        kycStatus: true,
      },
      where: {
        cabinetId: this.cabinetId,
      },
    })

    const byStatus = clients.reduce((acc: any, c: any) => {
      const status = c.kycStatus
      if (!acc[status]) {
        acc[status] = 0
      }
      acc[status]++
      return acc
    }, {} as Record<string, number>)

    const total = clients.length
    const completed = byStatus['COMPLETED'] || 0
    const pending = byStatus['PENDING'] || 0
    const inProgress = byStatus['IN_PROGRESS'] || 0
    const expired = byStatus['EXPIRED'] || 0
    const rejected = byStatus['REJECTED'] || 0

    const completionRate = total > 0 ? (completed / total) * 100 : 0

    return {
      total,
      byStatus,
      completed,
      pending,
      inProgress,
      expired,
      rejected,
      completionRate,
    }
  }

  /**
   * Génère un rapport KYC pour un client
   */
  async generateKYCReport(clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: this.cabinetId,
      },
      include: {
        conseiller: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    const kycDocuments = await this.getClientKYCDocuments(clientId)
    const kycCheck = await this.checkClientKYC(clientId)

    return {
      client: {
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        kycStatus: client.kycStatus,
        kycCompletedAt: client.kycCompletedAt,
        kycNextReviewDate: client.kycNextReviewDate,
      },
      conseiller: client.conseiller,
      documents: kycDocuments,
      check: kycCheck,
      generatedAt: new Date(),
    }
  }

  /**
   * Demande une mise à jour KYC à un client
   */
  async requestKYCUpdate(clientId: string, reason?: string) {
    // Mettre à jour le statut
    const { count } = await this.prisma.client.updateMany({
      where: {
        id: clientId,
        cabinetId: this.cabinetId,
      },
      data: {
        kycStatus: 'IN_PROGRESS',
      },
    })

    if (count === 0) {
      throw new Error('Client not found or access denied')
    }

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId,
        type: 'KYC_UPDATED',
        title: 'Mise à jour KYC demandée',
        description: reason || 'Mise à jour des documents KYC requise',
        createdBy: this.userId,
      },
    })

    // TODO: Envoyer une notification au client
    // TODO: Créer une tâche pour le conseiller

    return { success: true }
  }
}
