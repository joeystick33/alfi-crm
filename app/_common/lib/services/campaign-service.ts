
import { PrismaClient, CampaignStatus, CampaignType } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/app/_common/lib/prisma'

export interface CreateCampaignInput {
  name: string
  description?: string
  type?: CampaignType
  subject?: string
  previewText?: string
  htmlContent?: string
  plainContent?: string
  emailTemplateId?: string
  scheduledAt?: Date
  targetSegment?: Record<string, unknown> // Critères JSON
  targetClientIds?: string[]
  excludeClientIds?: string[]
  fromName?: string
  fromEmail?: string
  replyTo?: string
  trackOpens?: boolean
  trackClicks?: boolean
  tags?: string[]
  notes?: string
}

export interface UpdateCampaignInput {
  name?: string
  description?: string
  type?: CampaignType
  subject?: string
  previewText?: string
  htmlContent?: string
  plainContent?: string
  emailTemplateId?: string
  scheduledAt?: Date
  targetSegment?: Record<string, unknown>
  targetClientIds?: string[]
  excludeClientIds?: string[]
  fromName?: string
  fromEmail?: string
  replyTo?: string
  trackOpens?: boolean
  trackClicks?: boolean
  tags?: string[]
  notes?: string
}

export interface CampaignFilters {
  status?: CampaignStatus
  type?: CampaignType
  createdBy?: string
  search?: string
  scheduledFrom?: Date
  scheduledTo?: Date
  tags?: string[]
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'scheduledAt' | 'sentAt' | 'name'
  sortOrder?: 'asc' | 'desc'
}

export class CampaignService {
  private prisma: PrismaClient
  private cabinetId: string
  private userId: string
  private isSuperAdmin: boolean

  constructor(cabinetId: string, userId: string, isSuperAdmin: boolean = false) {
    this.prisma = prisma
    this.cabinetId = cabinetId
    this.userId = userId
    this.isSuperAdmin = isSuperAdmin
  }

  /**
   * Créer une nouvelle campagne
   */
  async createCampaign(input: CreateCampaignInput) {
    // Vérifier template si fourni
    if (input.emailTemplateId) {
      const template = await this.prisma.emailTemplate.findFirst({
        where: {
          id: input.emailTemplateId,
          cabinetId: this.cabinetId,
          isActive: true,
        },
      })

      if (!template) {
        throw new Error('Template email non trouvé ou inactif')
      }

      // Si pas de contenu fourni, utiliser le template
      if (!input.htmlContent) {
        input.htmlContent = template.htmlContent
      }
      if (!input.plainContent) {
        input.plainContent = template.plainContent || undefined
      }
      if (!input.subject) {
        input.subject = template.subject
      }
      if (!input.previewText) {
        input.previewText = template.previewText || undefined
      }
    }

    // Validation contenu
    if (!input.subject) {
      throw new Error('Le sujet de la campagne est requis')
    }
    if (!input.htmlContent && !input.plainContent) {
      throw new Error('Le contenu de la campagne est requis (HTML ou texte)')
    }

    const campaign = await this.prisma.campaign.create({
      data: {
        cabinetId: this.cabinetId,
        createdBy: this.userId,
        name: input.name,
        description: input.description,
        type: input.type || 'EMAIL',
        status: 'BROUILLON',
        subject: input.subject,
        previewText: input.previewText,
        htmlContent: input.htmlContent,
        plainContent: input.plainContent,
        emailTemplateId: input.emailTemplateId,
        scheduledAt: input.scheduledAt,
        targetSegment: input.targetSegment ? JSON.stringify(input.targetSegment) : undefined,
        targetClientIds: input.targetClientIds || [],
        excludeClientIds: input.excludeClientIds || [],
        fromName: input.fromName,
        fromEmail: input.fromEmail,
        replyTo: input.replyTo,
        trackOpens: input.trackOpens !== undefined ? input.trackOpens : true,
        trackClicks: input.trackClicks !== undefined ? input.trackClicks : true,
        tags: input.tags || [],
        notes: input.notes,
      },
      include: {
        emailTemplate: true,
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            recipients: true,
            messages: true,
          },
        },
      },
    })

    return campaign
  }

  /**
   * Lister les campagnes avec filtres
   */
  async listCampaigns(filters: CampaignFilters = {}) {
    const where: Prisma.CampaignWhereInput = {
      cabinetId: this.cabinetId,
    }

    if (filters.status) where.status = filters.status
    if (filters.type) where.type = filters.type
    if (filters.createdBy) where.createdBy = filters.createdBy

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { subject: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.scheduledFrom || filters.scheduledTo) {
      where.scheduledAt = {
        ...(filters.scheduledFrom ? { gte: filters.scheduledFrom } : {}),
        ...(filters.scheduledTo ? { lte: filters.scheduledTo } : {}),
      }
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      }
    }

    const orderBy: Record<string, string> = {}
    const sortBy = filters.sortBy || 'createdAt'
    const sortOrder = filters.sortOrder || 'desc'
    orderBy[sortBy] = sortOrder

    const limit = filters.limit || 50
    const offset = filters.offset || 0

    const [campaigns, total] = await Promise.all([
      this.prisma.campaign.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          emailTemplate: {
            select: {
              id: true,
              name: true,
            },
          },
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              recipients: true,
              messages: true,
            },
          },
        },
      }),
      this.prisma.campaign.count({ where }),
    ])

    return {
      data: campaigns,
      total,
      limit,
      offset,
    }
  }

  /**
   * Obtenir une campagne par ID
   */
  async getCampaignById(id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      include: {
        emailTemplate: true,
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        recipients: {
          take: 100, // Limiter pour performance
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
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            recipients: true,
            messages: true,
          },
        },
      },
    })

    if (!campaign) {
      throw new Error('Campagne non trouvée')
    }

    return campaign
  }

  /**
   * Mettre à jour une campagne
   */
  async updateCampaign(id: string, input: UpdateCampaignInput) {
    const existing = await this.prisma.campaign.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!existing) {
      throw new Error('Campagne non trouvée')
    }

    // Ne peut modifier que les brouillons
    if (existing.status !== 'BROUILLON') {
      throw new Error('Seules les campagnes en brouillon peuvent être modifiées')
    }

    const updateData: Record<string, unknown> = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.type !== undefined) updateData.type = input.type
    if (input.subject !== undefined) updateData.subject = input.subject
    if (input.previewText !== undefined) updateData.previewText = input.previewText
    if (input.htmlContent !== undefined) updateData.htmlContent = input.htmlContent
    if (input.plainContent !== undefined) updateData.plainContent = input.plainContent
    if (input.emailTemplateId !== undefined) updateData.emailTemplateId = input.emailTemplateId
    if (input.scheduledAt !== undefined) updateData.scheduledAt = input.scheduledAt
    if (input.targetSegment !== undefined) {
      updateData.targetSegment = input.targetSegment ? JSON.stringify(input.targetSegment) : null
    }
    if (input.targetClientIds !== undefined) updateData.targetClientIds = input.targetClientIds
    if (input.excludeClientIds !== undefined) updateData.excludeClientIds = input.excludeClientIds
    if (input.fromName !== undefined) updateData.fromName = input.fromName
    if (input.fromEmail !== undefined) updateData.fromEmail = input.fromEmail
    if (input.replyTo !== undefined) updateData.replyTo = input.replyTo
    if (input.trackOpens !== undefined) updateData.trackOpens = input.trackOpens
    if (input.trackClicks !== undefined) updateData.trackClicks = input.trackClicks
    if (input.tags !== undefined) updateData.tags = input.tags
    if (input.notes !== undefined) updateData.notes = input.notes

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: updateData,
      include: {
        emailTemplate: true,
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            recipients: true,
            messages: true,
          },
        },
      },
    })

    return updated
  }

  /**
   * Supprimer une campagne (BROUILLON only)
   */
  async deleteCampaign(id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!campaign) {
      throw new Error('Campagne non trouvée')
    }

    if (campaign.status !== 'BROUILLON') {
      throw new Error('Seules les campagnes en brouillon peuvent être supprimées')
    }

    await this.prisma.campaign.delete({
      where: { id },
    })

    return { success: true }
  }

  /**
   * Préparer les destinataires d'une campagne
   * Crée les CampaignRecipient selon ciblage
   */
  async prepareRecipients(campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
        cabinetId: this.cabinetId,
      },
    })

    if (!campaign) {
      throw new Error('Campagne non trouvée')
    }

    if (campaign.status !== 'BROUILLON') {
      throw new Error('Les destinataires ne peuvent être préparés que pour une campagne en brouillon')
    }

    // Construire query clients
    const clientWhere: Prisma.ClientWhereInput = {
      cabinetId: this.cabinetId,
      status: {
        notIn: ['ARCHIVE'],
      },
      email: {
        not: null,
      },
    }

    const idFilter: Prisma.StringFilter = {}

    // Ciblage manuel par IDs
    if (campaign.targetClientIds && campaign.targetClientIds.length > 0) {
      idFilter.in = campaign.targetClientIds
    }

    // Exclusions
    if (campaign.excludeClientIds && campaign.excludeClientIds.length > 0) {
      idFilter.notIn = campaign.excludeClientIds
    }

    if (Object.keys(idFilter).length > 0) {
      clientWhere.id = idFilter
    }

    // TODO: Implémenter ciblage segment JSON (filtres avancés)
    // if (campaign.targetSegment) {
    //   const segment = JSON.parse(campaign.targetSegment)
    //   // Appliquer filtres segment
    // }

    // Récupérer clients ciblés
    const clients = await this.prisma.client.findMany({
      where: clientWhere,
      select: {
        id: true,
        email: true,
      },
    })

    // Supprimer destinataires existants
    await this.prisma.campaignRecipient.deleteMany({
      where: { campaignId },
    })

    // Créer nouveaux destinataires
    const recipients = await Promise.all(
      clients.map((client) =>
        this.prisma.campaignRecipient.create({
          data: {
            campaignId,
            clientId: client.id,
            email: client.email!,
            status: 'EN_ATTENTE',
          },
        })
      )
    )

    // Mettre à jour compteur
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        recipientsTotal: recipients.length,
      },
    })

    return {
      total: recipients.length,
      recipients,
    }
  }

  /**
   * Planifier une campagne (BROUILLON → PLANIFIEE)
   */
  async scheduleCampaign(id: string, scheduledAt: Date) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!campaign) {
      throw new Error('Campagne non trouvée')
    }

    if (campaign.status !== 'BROUILLON') {
      throw new Error('Seules les campagnes en brouillon peuvent être planifiées')
    }

    // Vérifier qu'il y a des destinataires
    const recipientsCount = await this.prisma.campaignRecipient.count({
      where: { campaignId: id },
    })

    if (recipientsCount === 0) {
      throw new Error('La campagne doit avoir au moins un destinataire')
    }

    // Vérifier date future
    if (scheduledAt <= new Date()) {
      throw new Error('La date de planification doit être dans le futur')
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        status: 'PLANIFIEE',
        scheduledAt,
      },
      include: {
        emailTemplate: true,
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return updated
  }

  /**
   * Envoyer une campagne immédiatement (BROUILLON/PLANIFIEE → EN_COURS)
   * NOTE: L'envoi réel des emails nécessite intégration provider email
   */
  async sendCampaign(id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      include: {
        recipients: true,
      },
    })

    if (!campaign) {
      throw new Error('Campagne non trouvée')
    }

    if (campaign.status !== 'BROUILLON' && campaign.status !== 'PLANIFIEE') {
      throw new Error('La campagne ne peut pas être envoyée dans cet état')
    }

    if (campaign.recipients.length === 0) {
      throw new Error('La campagne doit avoir au moins un destinataire')
    }

    // Marquer campagne en cours
    await this.prisma.campaign.update({
      where: { id },
      data: {
        status: 'EN_COURS',
        sentAt: new Date(),
      },
    })

    // ⚠️ SIMULATION: L'envoi d'emails n'est pas connecté à un provider réel (SendGrid, Mailjet, etc.)
    // Les destinataires sont marqués comme envoyés mais aucun email n'est réellement transmis.
    // Pour connecter un provider: implémenter EmailProvider interface + injecter ici.
    // Ref audit S12: campagnes simulées — pas d'envoi réel.

    // Marquer tous comme envoyés (simulation — aucun email réellement envoyé)
    await this.prisma.campaignRecipient.updateMany({
      where: { campaignId: id },
      data: {
        status: 'ENVOYE',
        sentAt: new Date(),
      },
    })

    // Mettre à jour stats campagne
    await this.prisma.campaign.update({
      where: { id },
      data: {
        recipientsSent: campaign.recipients.length,
        status: 'TERMINEE',
        completedAt: new Date(),
      },
    })

    return this.getCampaignById(id)
  }

  /**
   * Annuler une campagne planifiée
   */
  async cancelCampaign(id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!campaign) {
      throw new Error('Campagne non trouvée')
    }

    if (campaign.status !== 'PLANIFIEE' && campaign.status !== 'EN_COURS') {
      throw new Error('Seules les campagnes planifiées ou en cours peuvent être annulées')
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        status: 'ANNULEE',
      },
      include: {
        createdByUser: true,
      },
    })

    return updated
  }

  /**
   * Mettre en pause une campagne en cours
   */
  async pauseCampaign(id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!campaign) {
      throw new Error('Campagne non trouvée')
    }

    if (campaign.status !== 'EN_COURS') {
      throw new Error('Seules les campagnes en cours peuvent être mises en pause')
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        status: 'PAUSE',
      },
      include: {
        createdByUser: true,
      },
    })

    return updated
  }

  /**
   * Reprendre une campagne en pause
   */
  async resumeCampaign(id: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!campaign) {
      throw new Error('Campagne non trouvée')
    }

    if (campaign.status !== 'PAUSE') {
      throw new Error('Seules les campagnes en pause peuvent être reprises')
    }

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: {
        status: 'EN_COURS',
      },
      include: {
        createdByUser: true,
      },
    })

    return updated
  }

  /**
   * Recalculer les statistiques d'une campagne
   */
  async recalculateStats(campaignId: string) {
    const [
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      error,
    ] = await Promise.all([
      this.prisma.campaignRecipient.count({
        where: { campaignId, status: { in: ['ENVOYE', 'DELIVRE', 'OUVERT', 'CLIQUE'] } },
      }),
      this.prisma.campaignRecipient.count({
        where: { campaignId, status: { in: ['DELIVRE', 'OUVERT', 'CLIQUE'] } },
      }),
      this.prisma.campaignRecipient.count({
        where: { campaignId, status: { in: ['OUVERT', 'CLIQUE'] } },
      }),
      this.prisma.campaignRecipient.count({
        where: { campaignId, status: 'CLIQUE' },
      }),
      this.prisma.campaignRecipient.count({
        where: { campaignId, status: 'REBOND' },
      }),
      this.prisma.campaignRecipient.count({
        where: { campaignId, status: 'ERREUR' },
      }),
    ])

    // Calculer taux
    const openRate = sent > 0 ? (opened / sent) * 100 : 0
    const clickRate = sent > 0 ? (clicked / sent) * 100 : 0
    const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        recipientsSent: sent,
        recipientsDelivré: delivered,
        recipientsOpened: opened,
        recipientsClicked: clicked,
        recipientsBounced: bounced,
        recipientsError: error,
        openRate,
        clickRate,
        bounceRate,
      },
    })

    return {
      sent,
      delivered,
      opened,
      clicked,
      bounced,
      error,
      openRate: Math.round(openRate * 100) / 100,
      clickRate: Math.round(clickRate * 100) / 100,
      bounceRate: Math.round(bounceRate * 100) / 100,
    }
  }

  /**
   * Obtenir les statistiques globales des campagnes
   */
  async getCampaignStats(filters: Partial<CampaignFilters> = {}) {
    const where: Record<string, unknown> = {
      cabinetId: this.cabinetId,
    }

    if (filters.type) where.type = filters.type
    if (filters.createdBy) where.createdBy = filters.createdBy

    const [
      total,
      brouillon,
      planifiee,
      enCours,
      terminee,
      annulee,
      pause,
      aggregates,
    ] = await Promise.all([
      this.prisma.campaign.count({ where }),
      this.prisma.campaign.count({ where: { ...where, status: 'BROUILLON' } }),
      this.prisma.campaign.count({ where: { ...where, status: 'PLANIFIEE' } }),
      this.prisma.campaign.count({ where: { ...where, status: 'EN_COURS' } }),
      this.prisma.campaign.count({ where: { ...where, status: 'TERMINEE' } }),
      this.prisma.campaign.count({ where: { ...where, status: 'ANNULEE' } }),
      this.prisma.campaign.count({ where: { ...where, status: 'PAUSE' } }),
      this.prisma.campaign.aggregate({
        where,
        _sum: {
          recipientsTotal: true,
          recipientsSent: true,
          recipientsDelivré: true,
          recipientsOpened: true,
          recipientsClicked: true,
          recipientsBounced: true,
        },
        _avg: {
          openRate: true,
          clickRate: true,
          bounceRate: true,
        },
      }),
    ])

    return {
      total,
      byStatus: {
        brouillon,
        planifiee,
        enCours,
        terminee,
        annulee,
        pause,
      },
      totals: {
        recipients: aggregates._sum.recipientsTotal || 0,
        sent: aggregates._sum.recipientsSent || 0,
        delivered: aggregates._sum.recipientsDelivré || 0,
        opened: aggregates._sum.recipientsOpened || 0,
        clicked: aggregates._sum.recipientsClicked || 0,
        bounced: aggregates._sum.recipientsBounced || 0,
      },
      averageRates: {
        openRate: Math.round(Number(aggregates._avg.openRate || 0) * 100) / 100,
        clickRate: Math.round(Number(aggregates._avg.clickRate || 0) * 100) / 100,
        bounceRate: Math.round(Number(aggregates._avg.bounceRate || 0) * 100) / 100,
      },
    }
  }
}
