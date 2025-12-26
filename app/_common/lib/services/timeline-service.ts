import { getPrismaClient } from '@/app/_common/lib/prisma'
import { TimelineEventType } from '@prisma/client'
import type { TimelineEventWhereClause } from '@/app/_common/types/prisma-helpers.types'

export class TimelineService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Créer un événement timeline
   */
  async createEvent(data: {
    clientId: string
    type: TimelineEventType
    title: string
    description?: string
    relatedEntityType?: string
    relatedEntityId?: string
  }) {
    // Vérifier que le client existe
    const client = await this.prisma.client.findFirst({
      where: { id: data.clientId },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    return this.prisma.timelineEvent.create({
      data: {
        clientId: data.clientId,
        type: data.type,
        title: data.title,
        description: data.description,
        relatedEntityType: data.relatedEntityType,
        relatedEntityId: data.relatedEntityId,
        createdBy: this.userId,
      },
    })
  }

  /**
   * Récupérer la timeline d'un client
   */
  async getClientTimeline(
    clientId: string,
    filters?: {
      type?: TimelineEventType
      startDate?: Date
      endDate?: Date
      limit?: number
      offset?: number
    }
  ) {
    const where: TimelineEventWhereClause = { clientId }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    const [events, total] = await Promise.all([
      this.prisma.timelineEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.timelineEvent.count({ where }),
    ])

    return {
      events,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    }
  }

  /**
   * Récupérer les événements par type
   */
  async getEventsByType(clientId: string, type: TimelineEventType) {
    return this.prisma.timelineEvent.findMany({
      where: {
        clientId,
        type,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Récupérer les événements liés à une entité
   */
  async getRelatedEvents(entityType: string, entityId: string) {
    return this.prisma.timelineEvent.findMany({
      where: {
        relatedEntityType: entityType,
        relatedEntityId: entityId,
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Supprimer un événement timeline
   */
  async deleteEvent(id: string) {
    const { count } = await this.prisma.timelineEvent.deleteMany({
      where: { id },
    })

    if (count === 0) {
      throw new Error('TimelineEvent not found or access denied')
    }

    return { success: true }
  }

  /**
   * Statistiques de la timeline d'un client
   */
  async getClientStatistics(clientId: string) {
    const total = await this.prisma.timelineEvent.count({
      where: { clientId },
    })

    const byType = await this.prisma.timelineEvent.groupBy({
      by: ['type'],
      where: { clientId },
      _count: true,
      orderBy: {
        _count: {
          type: 'desc',
        },
      },
    })

    // Événements récents (30 derniers jours)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentEvents = await this.prisma.timelineEvent.count({
      where: {
        clientId,
        createdAt: { gte: thirtyDaysAgo },
      },
    })

    return {
      total,
      recentEvents,
      byType: byType.map((item: { type: string; _count: number }) => ({
        type: item.type,
        count: item._count,
      })),
    }
  }

  /**
   * Exporter la timeline d'un client
   */
  async exportClientTimeline(clientId: string) {
    const events = await this.prisma.timelineEvent.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    })

    return events
  }

  /**
   * Helpers pour créer des événements spécifiques
   */

  async createClientCreatedEvent(clientId: string, clientName: string) {
    return this.createEvent({
      clientId,
      type: 'CLIENT_CREATED',
      title: 'Client créé',
      description: `Client ${clientName} créé dans le système`,
    })
  }

  async createMeetingEvent(clientId: string, meetingTitle: string, rendezVousId: string) {
    return this.createEvent({
      clientId,
      type: 'MEETING_HELD',
      title: 'Rendez-vous',
      description: meetingTitle,
      relatedEntityType: 'RendezVous',
      relatedEntityId: rendezVousId,
    })
  }

  async createDocumentSignedEvent(clientId: string, documentName: string, documentId: string) {
    return this.createEvent({
      clientId,
      type: 'DOCUMENT_SIGNED',
      title: 'Document signé',
      description: `Document "${documentName}" signé`,
      relatedEntityType: 'Document',
      relatedEntityId: documentId,
    })
  }

  async createAssetAddedEvent(clientId: string, assetName: string, actifId: string) {
    return this.createEvent({
      clientId,
      type: 'ASSET_ADDED',
      title: 'Actif ajouté',
      description: `Actif "${assetName}" ajouté au patrimoine`,
      relatedEntityType: 'Actif',
      relatedEntityId: actifId,
    })
  }

  async createGoalAchievedEvent(clientId: string, goalName: string, objectifId: string) {
    return this.createEvent({
      clientId,
      type: 'GOAL_ACHIEVED',
      title: 'Objectif atteint',
      description: `Objectif "${goalName}" atteint`,
      relatedEntityType: 'Objectif',
      relatedEntityId: objectifId,
    })
  }

  async createContractSignedEvent(clientId: string, contractName: string, contratId: string) {
    return this.createEvent({
      clientId,
      type: 'CONTRACT_SIGNED',
      title: 'Contrat signé',
      description: `Contrat "${contractName}" signé`,
      relatedEntityType: 'Contrat',
      relatedEntityId: contratId,
    })
  }

  async createKYCUpdatedEvent(clientId: string) {
    return this.createEvent({
      clientId,
      type: 'KYC_UPDATED',
      title: 'KYC mis à jour',
      description: 'Documents KYC mis à jour',
    })
  }

  async createSimulationSharedEvent(
    clientId: string,
    simulationName: string,
    simulationId: string
  ) {
    return this.createEvent({
      clientId,
      type: 'SIMULATION_SHARED',
      title: 'Simulation partagée',
      description: `Simulation "${simulationName}" partagée avec le client`,
      relatedEntityType: 'Simulation',
      relatedEntityId: simulationId,
    })
  }

  async createEmailSentEvent(clientId: string, emailSubject: string, emailId: string) {
    return this.createEvent({
      clientId,
      type: 'EMAIL_SENT',
      title: 'Email envoyé',
      description: `Email: ${emailSubject}`,
      relatedEntityType: 'Email',
      relatedEntityId: emailId,
    })
  }

  async createOpportunityConvertedEvent(
    clientId: string,
    opportunityName: string,
    opportuniteId: string
  ) {
    return this.createEvent({
      clientId,
      type: 'OPPORTUNITY_CONVERTED',
      title: 'Opportunité convertie',
      description: `Opportunité "${opportunityName}" convertie`,
      relatedEntityType: 'Opportunite',
      relatedEntityId: opportuniteId,
    })
  }

  async createOtherEvent(clientId: string, title: string, description?: string) {
    return this.createEvent({
      clientId,
      type: 'OTHER',
      title,
      description,
    })
  }
  /**
   * Récupérer l'activité récente du cabinet avec filtres avancés
   */
  async getRecentActivity(filters?: {
    limit?: number
    offset?: number
    type?: TimelineEventType | TimelineEventType[]
    startDate?: Date
    endDate?: Date
    createdBy?: string
    sortBy?: 'createdAt' | 'type' | 'impact'
    sortOrder?: 'asc' | 'desc'
  }) {
    const where: TimelineEventWhereClause = {
      cabinetId: this.cabinetId,
    }

    // Filtre par type d'événement
    if (filters?.type) {
      if (Array.isArray(filters.type)) {
        where.type = { in: filters.type }
      } else {
        where.type = filters.type
      }
    }

    // Filtre par période
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
      }
    }

    // Filtre par conseiller créateur
    if (filters?.createdBy) {
      where.createdBy = filters.createdBy
    }

    // Déterminer le tri
    let orderBy: { createdAt?: 'asc' | 'desc'; type?: 'asc' | 'desc' } = { createdAt: filters?.sortOrder || 'desc' }
    
    if (filters?.sortBy === 'type') {
      orderBy = { type: filters.sortOrder || 'asc' }
    } else if (filters?.sortBy === 'impact') {
      // Pour "impact", on trie par type avec un ordre de priorité
      // Types à fort impact: OPPORTUNITY_CONVERTED, CONTRACT_SIGNED, GOAL_ACHIEVED
      // On garde le tri par date mais on peut ajouter une logique métier plus tard
      orderBy = { createdAt: filters.sortOrder || 'desc' }
    }

    const [events, total] = await Promise.all([
      this.prisma.timelineEvent.findMany({
        where,
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy,
        take: filters?.limit || 10,
        skip: filters?.offset || 0,
      }),
      this.prisma.timelineEvent.count({ where }),
    ])

    // Charger les conseillers liés aux événements (si nécessaire)
    const creatorIds = Array.from(
      new Set(events.map((event) => event.createdBy).filter((id): id is string => Boolean(id)))
    )

    const creators = creatorIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: creatorIds } },
          select: { id: true, firstName: true, lastName: true, email: true },
        })
      : []

    const creatorsMap = new Map<string, typeof creators[number]>(
      creators.map((user) => [user.id, user])
    )

    return {
      activities: events.map((event) => ({
        id: event.id,
        type: event.type,
        title: event.title,
        description: event.description,
        createdAt: event.createdAt,
        clientId: event.clientId,
        clientName: event.client
          ? `${event.client.firstName} ${event.client.lastName}`
          : null,
        createdBy: event.createdBy,
        createdByName: event.createdBy
          ? creatorsMap.get(event.createdBy)
            ? `${creatorsMap.get(event.createdBy)?.firstName} ${creatorsMap.get(event.createdBy)?.lastName}`
            : null
          : null,
        createdByEmail: event.createdBy ? creatorsMap.get(event.createdBy)?.email || null : null,
        relatedEntityType: event.relatedEntityType,
        relatedEntityId: event.relatedEntityId,
      })),
      total,
      limit: filters?.limit || 10,
      offset: filters?.offset || 0,
    }
  }
}
