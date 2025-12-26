import { getPrismaClient } from '../prisma'
import {
  KYCDocumentType,
  KYCCheckType,
  KYCDocStatus,
  KYCStatus,
  KYCCheckStatus,
  KYCCheckPriority,
  Prisma
} from '@prisma/client'

export interface CreateKYCDocumentInput {
  cabinetId: string
  clientId: string
  type: KYCDocumentType
  documentId?: string
  fileName?: string
  fileUrl?: string
  expiresAt?: Date
  notes?: string
}

export interface UpdateKYCDocumentInput {
  fileName?: string
  fileUrl?: string
  expiresAt?: Date
  notes?: string
}

export interface ValidateKYCDocumentInput {
  kycDocumentId: string
  status: KYCDocStatus
  validatedById: string
  rejectionReason?: string
}

export interface KYCCheckResult {
  isComplete: boolean
  missingDocuments: KYCDocumentType[]
  expiredDocuments: KYCDocumentType[]
  pendingDocuments: KYCDocumentType[]
  completionPercentage: number
}

export interface CreateKYCCheckInput {
  cabinetId: string
  clientId: string
  type: KYCCheckType
  priority?: KYCCheckPriority
  assignedToId?: string
  description?: string
  dueDate?: Date
  isACPRMandatory?: boolean
  acprReference?: string
}

export interface UpdateKYCCheckInput {
  status?: KYCCheckStatus
  priority?: KYCCheckPriority
  assignedToId?: string
  description?: string
  findings?: string
  recommendations?: string
  dueDate?: Date
  score?: number
  riskLevel?: string
}

export interface CompleteKYCCheckInput {
  kycCheckId: string
  completedById: string
  findings: string
  recommendations?: string
  score?: number
  riskLevel?: string
}

export interface KYCDocumentFilters {
  clientId?: string
  status?: KYCDocStatus
  type?: KYCDocumentType
  expiresAfter?: Date
  expiresBefore?: Date
}

export interface KYCCheckFilters {
  clientId?: string
  status?: KYCCheckStatus
  type?: KYCCheckType
  priority?: KYCCheckPriority
  assignedToId?: string
  isACPRMandatory?: boolean
  dueBefore?: Date
  dueAfter?: Date
}

/**
 * Service de gestion KYC (Know Your Customer)
 * Gère la vérification d'identité et la conformité réglementaire
 */
export class KYCService {
  private prisma

  // Documents KYC requis pour un client particulier
  private readonly REQUIRED_DOCUMENTS: KYCDocumentType[] = [
    'IDENTITE',
    'JUSTIFICATIF_DOMICILE',
    'AVIS_IMPOSITION',
    'RIB_BANCAIRE',
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
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        type: data.type,
        documentId: data.documentId,
        status: 'EN_ATTENTE',
        expiresAt: data.expiresAt,
        notes: data.notes,
      },
    })

    // Mettre à jour le statut KYC du client
    await this.updateClientKYCStatus(data.clientId)

    return kycDocument
  }

  /**
   * Liste les documents KYC avec filtres
   */
  async listKYCDocuments(filters?: KYCDocumentFilters) {
    const where: Prisma.KYCDocumentWhereInput = {
      cabinetId: this.cabinetId,
    }

    if (filters) {
      if (filters.clientId) where.clientId = filters.clientId
      if (filters.status) where.status = filters.status
      if (filters.type) where.type = filters.type

      if (filters.expiresBefore || filters.expiresAfter) {
        where.expiresAt = {}
        if (filters.expiresBefore) where.expiresAt.lte = filters.expiresBefore
        if (filters.expiresAfter) where.expiresAt.gte = filters.expiresAfter
      }
    }

    const kycDocuments = await this.prisma.kYCDocument.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            kycStatus: true,
          },
        },
        validatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return kycDocuments
  }

  /**
   * Valide ou rejette un document KYC
   */
  async validateKYCDocument(data: ValidateKYCDocumentInput) {
    const kycDocument = await this.prisma.kYCDocument.update({
      where: { id: data.kycDocumentId },
      data: {
        status: data.status,
        validatedAt: data.status === 'VALIDE' ? new Date() : null,
        validatedById: data.validatedById,
        rejectionReason: data.rejectionReason,
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
        title: `Document KYC ${data.status === 'VALIDE' ? 'validé' : 'rejeté'}`,
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
    const latestByType = kycDocuments.reduce((acc: Record<string, typeof kycDocuments[0]>, doc) => {
      if (!acc[doc.type] || doc.createdAt > acc[doc.type].createdAt) {
        acc[doc.type] = doc
      }
      return acc
    }, {} as Record<string, { type: KYCDocumentType; createdAt: Date; status: KYCDocStatus }>)

    const missingDocuments: KYCDocumentType[] = []
    const expiredDocuments: KYCDocumentType[] = []
    const pendingDocuments: KYCDocumentType[] = []
    let validatedCount = 0

    for (const requiredType of this.REQUIRED_DOCUMENTS) {
      const doc = latestByType[requiredType]

      if (!doc) {
        missingDocuments.push(requiredType)
      } else if (doc.status === 'EN_ATTENTE') {
        pendingDocuments.push(requiredType)
      } else if (doc.status === 'EXPIRE' || (doc.expiresAt && doc.expiresAt < now)) {
        expiredDocuments.push(requiredType)
      } else if (doc.status === 'VALIDE') {
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
      kycStatus = 'COMPLET'
      kycCompletedAt = new Date()

      // Prochaine revue dans 1 an
      kycNextReviewDate = new Date()
      kycNextReviewDate.setFullYear(kycNextReviewDate.getFullYear() + 1)
    } else if (kycCheck.pendingDocuments.length > 0) {
      kycStatus = 'EN_COURS'
    } else if (kycCheck.expiredDocuments.length > 0) {
      kycStatus = 'EXPIRE'
    } else {
      kycStatus = 'EN_ATTENTE'
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
          in: ['EN_ATTENTE', 'EN_COURS'],
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
        kycStatus: 'EXPIRE',
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
        kycStatus: 'TERMINE',
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
        status: 'VALIDE',
        expiresAt: {
          lt: now,
        },
      },
    })

    // Mettre à jour le statut
    for (const doc of expiredDocuments) {
      await this.prisma.kYCDocument.update({
        where: { id: doc.id },
        data: { status: 'EXPIRE' },
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

    const byStatus = clients.reduce((acc: Record<string, number>, c) => {
      const status = c.kycStatus as string
      if (!acc[status]) {
        acc[status] = 0
      }
      acc[status]++
      return acc
    }, {} as Record<string, number>)

    const total = clients.length
    const completed = byStatus['TERMINE'] || 0
    const pending = byStatus['EN_ATTENTE'] || 0
    const inProgress = byStatus['EN_COURS'] || 0
    const expired = byStatus['EXPIRE'] || 0
    const rejected = byStatus['REJETEE'] || 0

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
        kycStatus: 'EN_COURS',
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

  /**
   * Envoie une relance KYC par email
   */
  async sendKYCReminder(clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: this.cabinetId,
      },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    const kycCheck = await this.checkClientKYC(clientId)

    // TODO: Intégrer avec le service d'email (BullMQ)
    // Pour l'instant on simule l'envoi mais on enregistre l'événement

    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId,
        type: 'KYC_UPDATED',
        title: 'Relance KYC envoyée',
        description: `Documents manquants: ${kycCheck.missingDocuments.join(', ')}`,
        createdBy: this.userId,
      },
    })

    // Mettre à jour la date de dernière relance sur les documents
    await this.prisma.kYCDocument.updateMany({
      where: {
        clientId,
        cabinetId: this.cabinetId,
        status: 'EN_ATTENTE',
      },
      data: {
        reminderSentAt: new Date(),
      },
    })

    return { success: true }
  }

  // ============================================
  // KYC CHECKS (Contrôles ACPR)
  // ============================================

  /**
   * Crée un contrôle KYC (ex: vérification ACPR)
   */
  async createKYCCheck(data: CreateKYCCheckInput) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: data.clientId,
        cabinetId: this.cabinetId,
      },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    const kycCheck = await this.prisma.kYCCheck.create({
      data: {
        cabinetId: data.cabinetId,
        clientId: data.clientId,
        type: data.type,
        priority: data.priority || 'MOYENNE',
        assignedToId: data.assignedToId,
        description: data.description,
        dueDate: data.dueDate,
        isACPRMandatory: data.isACPRMandatory || false,
        acprReference: data.acprReference,
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return kycCheck
  }

  /**
   * Met à jour un contrôle KYC
   */
  async updateKYCCheck(kycCheckId: string, data: UpdateKYCCheckInput) {
    const kycCheck = await this.prisma.kYCCheck.findFirst({
      where: {
        id: kycCheckId,
        cabinetId: this.cabinetId,
      },
    })

    if (!kycCheck) {
      throw new Error('KYC check not found')
    }

    const updated = await this.prisma.kYCCheck.update({
      where: { id: kycCheckId },
      data,
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return updated
  }

  /**
   * Complète un contrôle KYC
   */
  async completeKYCCheck(data: CompleteKYCCheckInput) {
    const kycCheck = await this.prisma.kYCCheck.findFirst({
      where: {
        id: data.kycCheckId,
        cabinetId: this.cabinetId,
      },
    })

    if (!kycCheck) {
      throw new Error('KYC check not found')
    }

    const updated = await this.prisma.kYCCheck.update({
      where: { id: data.kycCheckId },
      data: {
        status: 'TERMINE',
        completedAt: new Date(),
        completedById: data.completedById,
        findings: data.findings,
        recommendations: data.recommendations,
        score: data.score,
        riskLevel: data.riskLevel,
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        completedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: kycCheck.clientId,
        type: 'KYC_UPDATED',
        title: `Contrôle KYC complété: ${kycCheck.type}`,
        description: data.findings,
        relatedEntityType: 'KYCCheck',
        relatedEntityId: kycCheck.id,
        createdBy: data.completedById,
      },
    })

    return updated
  }

  /**
   * Récupère un contrôle KYC par ID
   */
  async getKYCCheck(kycCheckId: string) {
    const kycCheck = await this.prisma.kYCCheck.findFirst({
      where: {
        id: kycCheckId,
        cabinetId: this.cabinetId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            kycStatus: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!kycCheck) {
      throw new Error('KYC check not found')
    }

    return kycCheck
  }

  /**
   * Supprime un document KYC
   */
  async deleteKYCDocument(kycDocumentId: string) {
    const kycDocument = await this.prisma.kYCDocument.findFirst({
      where: {
        id: kycDocumentId,
        cabinetId: this.cabinetId,
      },
    })

    if (!kycDocument) {
      throw new Error('KYC document not found')
    }

    await this.prisma.kYCDocument.delete({
      where: { id: kycDocumentId },
    })

    // Mettre à jour le statut KYC du client
    await this.updateClientKYCStatus(kycDocument.clientId)

    return { success: true }
  }

  /**
   * Liste les contrôles KYC avec filtres
   */
  async listKYCChecks(filters?: KYCCheckFilters) {
    const where: {
      cabinetId: string
      clientId?: string
      status?: KYCCheckStatus
      type?: KYCCheckType
      priority?: KYCCheckPriority
      assignedToId?: string
      isACPRMandatory?: boolean
      dueDate?: { gte?: Date; lte?: Date }
    } = {
      cabinetId: this.cabinetId,
    }

    if (filters) {
      if (filters.clientId) where.clientId = filters.clientId
      if (filters.status) where.status = filters.status
      if (filters.type) where.type = filters.type
      if (filters.priority) where.priority = filters.priority
      if (filters.assignedToId) where.assignedToId = filters.assignedToId
      if (filters.isACPRMandatory !== undefined) where.isACPRMandatory = filters.isACPRMandatory

      if (filters.dueBefore || filters.dueAfter) {
        where.dueDate = {}
        if (filters.dueBefore) where.dueDate.lte = filters.dueBefore
        if (filters.dueAfter) where.dueDate.gte = filters.dueAfter
      }
    }

    const kycChecks = await this.prisma.kYCCheck.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            kycStatus: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return kycChecks
  }

  /**
   * Supprime un contrôle KYC
   */
  async deleteKYCCheck(kycCheckId: string) {
    const kycCheck = await this.prisma.kYCCheck.findFirst({
      where: {
        id: kycCheckId,
        cabinetId: this.cabinetId,
      },
    })

    if (!kycCheck) {
      throw new Error('KYC check not found')
    }

    await this.prisma.kYCCheck.delete({
      where: { id: kycCheckId },
    })

    return { success: true }
  }

  /**
   * Récupère les contrôles KYC en retard
   */
  async getOverdueKYCChecks() {
    const now = new Date()

    const overdueChecks = await this.prisma.kYCCheck.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: {
          in: ['EN_ATTENTE', 'EN_COURS'],
        },
        dueDate: {
          lt: now,
        },
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    return overdueChecks
  }

  /**
   * Récupère les contrôles ACPR obligatoires
   */
  async getACPRMandatoryChecks(status?: KYCCheckStatus) {
    const where: Record<string, unknown> = {
      cabinetId: this.cabinetId,
      isACPRMandatory: true,
    }

    if (status) {
      where.status = status
    }

    const checks = await this.prisma.kYCCheck.findMany({
      where,
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            kycStatus: true,
          },
        },
        assignedTo: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    })

    return checks
  }

  /**
   * Statistiques des contrôles KYC
   */
  async getKYCCheckStats() {
    const checks = await this.prisma.kYCCheck.findMany({
      where: {
        cabinetId: this.cabinetId,
      },
      select: {
        status: true,
        priority: true,
        type: true,
        isACPRMandatory: true,
        dueDate: true,
      },
    })

    const byStatus = checks.reduce((acc: Record<string, number>, c) => {
      if (!acc[c.status]) acc[c.status] = 0
      acc[c.status]++
      return acc
    }, {} as Record<string, number>)

    const byPriority = checks.reduce((acc: Record<string, number>, c) => {
      if (!acc[c.priority]) acc[c.priority] = 0
      acc[c.priority]++
      return acc
    }, {} as Record<string, number>)

    const byType = checks.reduce((acc: Record<string, number>, c) => {
      if (!acc[c.type]) acc[c.type] = 0
      acc[c.type]++
      return acc
    }, {} as Record<string, number>)

    const now = new Date()
    const overdue = checks.filter(c =>
      c.dueDate && c.dueDate < now &&
      (c.status === 'EN_ATTENTE' || c.status === 'EN_COURS')
    ).length

    const acprMandatory = checks.filter(c => c.isACPRMandatory).length

    return {
      total: checks.length,
      byStatus,
      byPriority,
      byType,
      overdue,
      acprMandatory,
    }
  }
}
