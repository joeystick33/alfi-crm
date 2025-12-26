import { getPrismaClient } from '../prisma'
import { ReclamationStatus, Priority, SLAEventType } from '@prisma/client'
import type { ReclamationType } from '@/app/_common/lib/constants/reference-types'

export interface CreateReclamationInput {
  cabinetId: string
  clientId: string
  subject: string
  description: string
  type: ReclamationType
  severity?: SLASeverity
  assignedToId?: string
  receivedAt?: Date
}

export interface UpdateReclamationInput {
  subject?: string
  description?: string
  type?: ReclamationType
  status?: ReclamationStatus
  severity?: SLASeverity
  assignedToId?: string
  responseText?: string
  internalNotes?: string
}

export interface ResolveReclamationInput {
  reclamationId: string
  responseText: string
  internalNotes?: string
}

export interface EscalateReclamationInput {
  reclamationId: string
  mediatorReference?: string
  reason: string
}

export interface ReclamationFilters {
  clientId?: string
  status?: ReclamationStatus
  type?: ReclamationType
  severity?: SLASeverity
  assignedToId?: string
  slaBreach?: boolean
  escalatedToMediator?: boolean
  search?: string
  deadlineAfter?: Date
  deadlineBefore?: Date
}

/**
 * Service de gestion des réclamations clients
 * Gère le suivi des plaintes, SLA, escalades et résolutions
 */
export class ReclamationService {
  private prisma
  
  // Délais SLA par gravité (en heures)
  private readonly SLA_DEADLINES = {
    LOW: 120, // 5 jours
    MEDIUM: 72, // 3 jours
    HIGH: 48, // 2 jours
    CRITICAL: 24, // 1 jour
  }

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Génère une référence unique pour la réclamation
   */
  private async generateReference(): Promise<string> {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    
    const count = await this.prisma.reclamation.count({
      where: {
        cabinetId: this.cabinetId,
        createdAt: {
          gte: new Date(year, 0, 1),
        },
      },
    })

    const sequence = String(count + 1).padStart(4, '0')
    return `REC-${year}${month}-${sequence}`
  }

  /**
   * Calcule la deadline SLA en fonction de la gravité
   */
  private calculateSLADeadline(receivedAt: Date, severity: SLASeverity): Date {
    const deadline = new Date(receivedAt)
    const hours = this.SLA_DEADLINES[severity]
    deadline.setHours(deadline.getHours() + hours)
    return deadline
  }

  /**
   * Crée une nouvelle réclamation
   */
  async createReclamation(data: CreateReclamationInput) {
    const client = await this.prisma.client.findFirst({
      where: {
        id: data.clientId,
        cabinetId: this.cabinetId,
      },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    const reference = await this.generateReference()
    const receivedAt = data.receivedAt || new Date()
    const severity = data.severity || 'MOYENNE'
    const slaDeadline = this.calculateSLADeadline(receivedAt, severity)
    
    // Deadline métier (en jours ouvrés)
    const deadline = new Date(receivedAt)
    deadline.setDate(deadline.getDate() + 10) // 10 jours ouvrés

    const reclamation = await this.prisma.reclamation.create({
      data: {
        cabinetId: data.cabinetId,
        clientId: data.clientId,
        reference,
        subject: data.subject,
        description: data.description,
        type: data.type,
        status: 'RECUE',
        severity,
        assignedToId: data.assignedToId,
        receivedAt,
        deadline,
        slaDeadline,
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

    // Créer l'événement SLA initial
    await this.createSLAEvent({
      reclamationId: reclamation.id,
      type: 'CREE',
      description: `Réclamation créée: ${data.subject}`,
      metadata: {
        reference,
        type: data.type,
        severity,
      },
    })

    // Si assignée, créer événement d'assignation
    if (data.assignedToId) {
      await this.createSLAEvent({
        reclamationId: reclamation.id,
        type: 'ASSIGNE',
        description: `Réclamation assignée`,
        userId: data.assignedToId,
      })
    }

    // Créer événement timeline client
    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        type: 'COMPLAINT_CREATED',
        title: 'Réclamation enregistrée',
        description: data.subject,
        relatedEntityType: 'Reclamation',
        relatedEntityId: reclamation.id,
        createdBy: this.userId,
      },
    })

    return reclamation
  }

  /**
   * Met à jour une réclamation
   */
  async updateReclamation(reclamationId: string, data: UpdateReclamationInput) {
    const existing = await this.prisma.reclamation.findFirst({
      where: {
        id: reclamationId,
        cabinetId: this.cabinetId,
      },
    })

    if (!existing) {
      throw new Error('Reclamation not found')
    }

    // Si changement de statut, créer événement SLA
    if (data.status && data.status !== existing.status) {
      await this.createSLAEvent({
        reclamationId,
        type: 'STATUT_MODIFIE',
        description: `Statut changé: ${existing.status} → ${data.status}`,
        metadata: {
          oldStatus: existing.status,
          newStatus: data.status,
        },
      })
    }

    // Si changement d'assignation, créer événement
    if (data.assignedToId && data.assignedToId !== existing.assignedToId) {
      await this.createSLAEvent({
        reclamationId,
        type: 'ASSIGNE',
        description: 'Réclamation réassignée',
        userId: data.assignedToId,
      })
    }

    const reclamation = await this.prisma.reclamation.update({
      where: { id: reclamationId },
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

    return reclamation
  }

  /**
   * Résout une réclamation
   */
  async resolveReclamation(data: ResolveReclamationInput) {
    const reclamation = await this.prisma.reclamation.findFirst({
      where: {
        id: data.reclamationId,
        cabinetId: this.cabinetId,
      },
    })

    if (!reclamation) {
      throw new Error('Reclamation not found')
    }

    const resolutionDate = new Date()
    const updated = await this.prisma.reclamation.update({
      where: { id: data.reclamationId },
      data: {
        status: 'RESOLUE',
        responseText: data.responseText,
        internalNotes: data.internalNotes,
        resolutionDate,
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

    // Créer événement SLA
    await this.createSLAEvent({
      reclamationId: data.reclamationId,
      type: 'RESOLU',
      description: 'Réclamation résolue',
      metadata: {
        resolutionDate,
        resolutionTime: resolutionDate.getTime() - reclamation.receivedAt.getTime(),
      },
    })

    // Créer événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: reclamation.clientId,
        type: 'COMPLAINT_RESOLVED',
        title: 'Réclamation résolue',
        description: data.responseText,
        relatedEntityType: 'Reclamation',
        relatedEntityId: reclamation.id,
        createdBy: this.userId,
      },
    })

    return updated
  }

  /**
   * Escale une réclamation vers un médiateur
   */
  async escalateReclamation(data: EscalateReclamationInput) {
    const reclamation = await this.prisma.reclamation.findFirst({
      where: {
        id: data.reclamationId,
        cabinetId: this.cabinetId,
      },
    })

    if (!reclamation) {
      throw new Error('Reclamation not found')
    }

    const escalatedAt = new Date()
    const updated = await this.prisma.reclamation.update({
      where: { id: data.reclamationId },
      data: {
        status: 'ESCALADEE',
        escalatedToMediator: true,
        escalatedAt,
        mediatorReference: data.mediatorReference,
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Créer événement SLA
    await this.createSLAEvent({
      reclamationId: data.reclamationId,
      type: 'ESCALADE',
      description: `Réclamation escaladée au médiateur: ${data.reason}`,
      metadata: {
        escalatedAt,
        mediatorReference: data.mediatorReference,
        reason: data.reason,
      },
    })

    return updated
  }

  /**
   * Récupère une réclamation par ID
   */
  async getReclamation(reclamationId: string) {
    const reclamation = await this.prisma.reclamation.findFirst({
      where: {
        id: reclamationId,
        cabinetId: this.cabinetId,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
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
        slaEvents: {
          orderBy: {
            timestamp: 'desc',
          },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!reclamation) {
      throw new Error('Reclamation not found')
    }

    return reclamation
  }

  /**
   * Liste les réclamations avec filtres
   */
  async listReclamations(filters?: ReclamationFilters) {
    const where: Record<string, unknown> = {
      cabinetId: this.cabinetId,
    }

    if (filters) {
      if (filters.clientId) where.clientId = filters.clientId
      if (filters.status) where.status = filters.status
      if (filters.type) where.type = filters.type
      if (filters.severity) where.severity = filters.severity
      if (filters.assignedToId) where.assignedToId = filters.assignedToId
      if (filters.slaBreach !== undefined) where.slaBreach = filters.slaBreach
      if (filters.escalatedToMediator !== undefined) where.escalatedToMediator = filters.escalatedToMediator

      if (filters.search) {
        where.OR = [
          { reference: { contains: filters.search, mode: 'insensitive' } },
          { subject: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ]
      }

      if (filters.deadlineAfter || filters.deadlineBefore) {
        where.deadline = {
          ...(filters.deadlineAfter ? { gte: filters.deadlineAfter } : {}),
          ...(filters.deadlineBefore ? { lte: filters.deadlineBefore } : {}),
        }
      }
    }

    const reclamations = await this.prisma.reclamation.findMany({
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
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            slaEvents: true,
          },
        },
      },
      orderBy: [
        { slaBreach: 'desc' },
        { severity: 'desc' },
        { deadline: 'asc' },
        { receivedAt: 'desc' },
      ],
    })

    return reclamations
  }

  /**
   * Supprime une réclamation
   */
  async deleteReclamation(reclamationId: string) {
    const reclamation = await this.prisma.reclamation.findFirst({
      where: {
        id: reclamationId,
        cabinetId: this.cabinetId,
      },
    })

    if (!reclamation) {
      throw new Error('Reclamation not found')
    }

    await this.prisma.reclamation.delete({
      where: { id: reclamationId },
    })

    return { success: true }
  }

  /**
   * Crée un événement SLA
   */
  private async createSLAEvent(data: {
    reclamationId: string
    type: SLAEventType
    description: string
    userId?: string
    metadata?: Record<string, unknown>
  }) {
    return await this.prisma.sLAEvent.create({
      data: {
        reclamationId: data.reclamationId,
        type: data.type,
        description: data.description,
        userId: data.userId || this.userId,
        metadata: data.metadata,
        isSystemGenerated: !data.userId,
      },
    })
  }

  /**
   * Vérifie les breaches SLA
   */
  async checkSLABreaches() {
    const now = new Date()

    const breachedReclamations = await this.prisma.reclamation.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: {
          in: ['RECUE', 'EN_COURS'],
        },
        slaBreach: false,
        slaDeadline: {
          lt: now,
        },
      },
    })

    for (const reclamation of breachedReclamations) {
      await this.prisma.reclamation.update({
        where: { id: reclamation.id },
        data: {
          slaBreach: true,
          slaBreachAt: now,
        },
      })

      await this.createSLAEvent({
        reclamationId: reclamation.id,
        type: 'ECHEANCE_DEPASSEE',
        description: 'Dépassement du délai SLA',
        metadata: {
          slaDeadline: reclamation.slaDeadline,
          breachTime: now.getTime() - reclamation.slaDeadline.getTime(),
        },
      })
    }

    return {
      count: breachedReclamations.length,
      reclamations: breachedReclamations,
    }
  }

  /**
   * Récupère les réclamations avec SLA bientôt dépassé
   */
  async getSLAApproachingDeadline(hoursBeforeDeadline: number = 6) {
    const now = new Date()
    const threshold = new Date(now)
    threshold.setHours(threshold.getHours() + hoursBeforeDeadline)

    const reclamations = await this.prisma.reclamation.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: {
          in: ['RECUE', 'EN_COURS'],
        },
        slaBreach: false,
        slaDeadline: {
          gte: now,
          lte: threshold,
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
        slaDeadline: 'asc',
      },
    })

    return reclamations
  }

  /**
   * Récupère les statistiques des réclamations
   */
  async getReclamationStats() {
    const reclamations = await this.prisma.reclamation.findMany({
      where: {
        cabinetId: this.cabinetId,
      },
      select: {
        status: true,
        type: true,
        severity: true,
        slaBreach: true,
        escalatedToMediator: true,
        receivedAt: true,
        resolutionDate: true,
      },
    })

    const byStatus = reclamations.reduce((acc: Record<string, number>, r) => {
      if (!acc[r.status]) acc[r.status] = 0
      acc[r.status]++
      return acc
    }, {} as Record<string, number>)

    const byType = reclamations.reduce((acc: Record<string, number>, r) => {
      if (!acc[r.type]) acc[r.type] = 0
      acc[r.type]++
      return acc
    }, {} as Record<string, number>)

    const bySeverity = reclamations.reduce((acc: Record<string, number>, r) => {
      if (!acc[r.severity]) acc[r.severity] = 0
      acc[r.severity]++
      return acc
    }, {} as Record<string, number>)

    const slaBreaches = reclamations.filter(r => r.slaBreach).length
    const escalated = reclamations.filter(r => r.escalatedToMediator).length

    // Calcul du délai moyen de résolution
    const resolved = reclamations.filter(r => r.resolutionDate)
    const avgResolutionTime = resolved.length > 0
      ? resolved.reduce((sum, r) => {
          const time = r.resolutionDate!.getTime() - r.receivedAt.getTime()
          return sum + time
        }, 0) / resolved.length
      : 0

    const avgResolutionDays = Math.round(avgResolutionTime / (1000 * 60 * 60 * 24))

    return {
      total: reclamations.length,
      byStatus,
      byType,
      bySeverity,
      slaBreaches,
      slaBreachRate: reclamations.length > 0 ? (slaBreaches / reclamations.length) * 100 : 0,
      escalated,
      avgResolutionDays,
    }
  }

  /**
   * Enregistre la satisfaction client
   */
  async recordClientSatisfaction(
    reclamationId: string,
    satisfaction: number,
    comment?: string
  ) {
    const reclamation = await this.prisma.reclamation.findFirst({
      where: {
        id: reclamationId,
        cabinetId: this.cabinetId,
      },
    })

    if (!reclamation) {
      throw new Error('Reclamation not found')
    }

    const updated = await this.prisma.reclamation.update({
      where: { id: reclamationId },
      data: {
        clientSatisfaction: satisfaction,
        satisfactionComment: comment,
      },
    })

    await this.createSLAEvent({
      reclamationId,
      type: 'RETOUR_CLIENT',
      description: `Satisfaction client enregistrée: ${satisfaction}/5`,
      metadata: {
        satisfaction,
        comment,
      },
    })

    return updated
  }
}
