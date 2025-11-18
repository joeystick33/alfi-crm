import { getPrismaClient } from '@/lib/prisma'
import { OpportuniteType, OpportuniteStatus, OpportunitePriority } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

export class OpportuniteService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private userRole?: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Converts Decimal or numeric values to JavaScript number
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
   * Formats an opportunite entity with nested relations
   */
  private formatOpportunite(opportunite: any): any {
    if (!opportunite) {
      return null
    }

    return {
      ...opportunite,
      estimatedValue: this.toNumber(opportunite.estimatedValue),
      confidence: this.toNumber(opportunite.confidence),
      client: opportunite.client ? {
        id: opportunite.client.id,
        firstName: opportunite.client.firstName,
        lastName: opportunite.client.lastName,
        email: opportunite.client.email,
      } : undefined,
      conseiller: opportunite.conseiller ? {
        id: opportunite.conseiller.id,
        firstName: opportunite.conseiller.firstName,
        lastName: opportunite.conseiller.lastName,
        email: opportunite.conseiller.email,
      } : undefined,
    }
  }

  /**
   * Créer une opportunité
   */
  async createOpportunite(data: {
    clientId: string
    conseillerId: string
    type: OpportuniteType
    name: string
    description?: string
    estimatedValue?: number
    probability?: number
    priority?: OpportunitePriority
    status?: OpportuniteStatus
    expectedCloseDate?: Date
    notes?: string
  }) {
    // Vérifier que le client existe et appartient au cabinet
    const client = await this.prisma.client.findFirst({
      where: {
        id: data.clientId,
        cabinetId: this.cabinetId,
      },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    // Vérifier que le conseiller existe et appartient au cabinet
    const conseiller = await this.prisma.user.findFirst({
      where: {
        id: data.conseillerId,
        cabinetId: this.cabinetId,
      },
    })

    if (!conseiller) {
      throw new Error('Conseiller not found')
    }

    // Créer l'opportunité
    const opportunite = await this.prisma.opportunite.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        conseillerId: data.conseillerId,
        type: data.type,
        name: data.name,
        description: data.description,
        estimatedValue: data.estimatedValue !== undefined ? new Decimal(data.estimatedValue) : undefined,
        probability: data.probability,
        priority: data.priority || 'MEDIUM',
        status: data.status || 'DETECTED',
        expectedCloseDate: data.expectedCloseDate,
        notes: data.notes,
        detectedAt: new Date(),
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        type: 'OTHER',
        title: 'Opportunité détectée',
        description: `Opportunité "${data.name}" détectée`,
        relatedEntityType: 'Opportunite',
        relatedEntityId: opportunite.id,
        createdBy: this.userId,
      },
    })

    // Return formatted opportunite
    return this.getOpportuniteById(opportunite.id)
  }

  /**
   * Récupérer les opportunités avec filtres
   */
  async getOpportunites(filters?: {
    clientId?: string
    conseillerId?: string
    type?: OpportuniteType
    status?: OpportuniteStatus
    priority?: OpportunitePriority
    detectedAfter?: Date
    detectedBefore?: Date
    expectedCloseDateAfter?: Date
    expectedCloseDateBefore?: Date
    minEstimatedValue?: number
    maxEstimatedValue?: number
    minProbability?: number
    maxProbability?: number
    search?: string
  }) {
    const where: any = {
      cabinetId: this.cabinetId,
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId
    }

    if (filters?.conseillerId) {
      where.conseillerId = filters.conseillerId
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.priority) {
      where.priority = filters.priority
    }

    // Date range filters
    if (filters?.detectedAfter || filters?.detectedBefore) {
      where.detectedAt = {}
      if (filters.detectedAfter) {
        where.detectedAt.gte = filters.detectedAfter
      }
      if (filters.detectedBefore) {
        where.detectedAt.lte = filters.detectedBefore
      }
    }

    if (filters?.expectedCloseDateAfter || filters?.expectedCloseDateBefore) {
      where.expectedCloseDate = {}
      if (filters.expectedCloseDateAfter) {
        where.expectedCloseDate.gte = filters.expectedCloseDateAfter
      }
      if (filters.expectedCloseDateBefore) {
        where.expectedCloseDate.lte = filters.expectedCloseDateBefore
      }
    }

    // Value range filters
    if (filters?.minEstimatedValue !== undefined || filters?.maxEstimatedValue !== undefined) {
      where.estimatedValue = {}
      if (filters.minEstimatedValue !== undefined) {
        where.estimatedValue.gte = new Decimal(filters.minEstimatedValue)
      }
      if (filters.maxEstimatedValue !== undefined) {
        where.estimatedValue.lte = new Decimal(filters.maxEstimatedValue)
      }
    }

    // Probability range filters
    if (filters?.minProbability !== undefined || filters?.maxProbability !== undefined) {
      where.probability = {}
      if (filters.minProbability !== undefined) {
        where.probability.gte = filters.minProbability
      }
      if (filters.maxProbability !== undefined) {
        where.probability.lte = filters.maxProbability
      }
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const opportunites = await this.prisma.opportunite.findMany({
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
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ priority: 'asc' }, { detectedAt: 'desc' }],
    })

    return opportunites.map(opp => this.formatOpportunite(opp))
  }

  /**
   * Récupérer une opportunité par ID
   */
  async getOpportuniteById(id: string) {
    const opportunite = await this.prisma.opportunite.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
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
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return this.formatOpportunite(opportunite)
  }

  /**
   * Mettre à jour une opportunité
   */
  async updateOpportunite(
    id: string,
    data: {
      name?: string
      description?: string
      type?: OpportuniteType
      estimatedValue?: number
      probability?: number
      priority?: OpportunitePriority
      status?: OpportuniteStatus
      expectedCloseDate?: Date
      notes?: string
      rejectionReason?: string
      convertedToProjetId?: string
    }
  ) {
    // Get existing opportunite to check status changes
    const existing = await this.prisma.opportunite.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      select: {
        status: true,
        clientId: true,
        name: true,
      },
    })

    if (!existing) {
      throw new Error('Opportunite not found or access denied')
    }

    // Prepare update data with Decimal conversions
    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.status !== undefined) updateData.status = data.status
    if (data.expectedCloseDate !== undefined) updateData.expectedCloseDate = data.expectedCloseDate
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason
    if (data.convertedToProjetId !== undefined) updateData.convertedToProjetId = data.convertedToProjetId

    if (data.estimatedValue !== undefined) {
      updateData.estimatedValue = new Decimal(data.estimatedValue)
    }
    if (data.probability !== undefined) {
      updateData.probability = data.probability
    }

    // Track status changes for timeline events
    const statusChanging = data.status !== undefined && data.status !== existing.status

    const { count } = await this.prisma.opportunite.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: updateData,
    })

    if (count === 0) {
      throw new Error('Opportunite not found or access denied')
    }

    // Create timeline event if status changed to important states
    if (statusChanging && data.status) {
      const statusLabels: Record<OpportuniteStatus, string> = {
        DETECTED: 'détectée',
        QUALIFIED: 'qualifiée',
        CONTACTED: 'contactée',
        PRESENTED: 'présentée',
        ACCEPTED: 'acceptée',
        CONVERTED: 'convertie',
        REJECTED: 'rejetée',
        LOST: 'perdue',
      }

      if (['CONVERTED', 'REJECTED', 'LOST'].includes(data.status)) {
        await this.prisma.timelineEvent.create({
          data: {
            cabinetId: this.cabinetId,
            clientId: existing.clientId,
            type: data.status === 'CONVERTED' ? 'OPPORTUNITY_CONVERTED' : 'OTHER',
            title: `Opportunité ${statusLabels[data.status]}`,
            description: `Opportunité "${existing.name}" ${statusLabels[data.status]}`,
            relatedEntityType: 'Opportunite',
            relatedEntityId: id,
            createdBy: this.userId,
          },
        })
      }
    }

    return this.getOpportuniteById(id)
  }

  /**
   * Changer le statut d'une opportunité
   */
  async changeStatus(id: string, status: OpportuniteStatus) {
    const opportunite = await this.prisma.opportunite.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!opportunite) {
      throw new Error('Opportunite not found')
    }

    const updateData: any = { status }

    // Mettre à jour les dates selon le statut (aligné avec le schéma)
    if (status === 'CONTACTED' && !opportunite.contactedAt) {
      updateData.contactedAt = new Date()
    } else if (status === 'QUALIFIED' && !opportunite.qualifiedAt) {
      updateData.qualifiedAt = new Date()
    } else if (status === 'PRESENTED' && !opportunite.presentedAt) {
      updateData.presentedAt = new Date()
    } else if (status === 'ACCEPTED' && !opportunite.acceptedAt) {
      updateData.acceptedAt = new Date()
    } else if (status === 'CONVERTED' && !opportunite.convertedAt) {
      updateData.convertedAt = new Date()
    } else if (status === 'REJECTED' && !opportunite.rejectedAt) {
      updateData.rejectedAt = new Date()
    }

    const { count } = await this.prisma.opportunite.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: updateData,
    })

    if (count === 0) {
      throw new Error('Opportunite not found or access denied')
    }

    const updated = await this.getOpportuniteById(id)

    // Créer un événement timeline pour les statuts importants
    if (status === 'CONVERTED') {
      await this.prisma.timelineEvent.create({
        data: {
          cabinetId: this.cabinetId,
          clientId: opportunite.clientId,
          type: 'OPPORTUNITY_CONVERTED',
          title: 'Opportunité gagnée',
          description: `Opportunité "${opportunite.name}" convertie`,
          relatedEntityType: 'Opportunite',
          relatedEntityId: opportunite.id,
          createdBy: this.userId,
        },
      })
    }

    return updated
  }

  /**
   * Convertir une opportunité en projet
   */
  async convertToProjet(id: string, projetId: string) {
    const opportunite = await this.prisma.opportunite.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!opportunite) {
      throw new Error('Opportunite not found')
    }

    // Validate that the target projet exists and belongs to the same cabinet
    const projet = await this.prisma.projet.findFirst({
      where: {
        id: projetId,
        cabinetId: this.cabinetId,
      },
    })

    if (!projet) {
      throw new Error('Projet not found')
    }

    // Validate that the projet belongs to the same client
    if (projet.clientId !== opportunite.clientId) {
      throw new Error('Projet must belong to the same client as the opportunite')
    }

    // Update opportunité status and set convertedToProjetId
    await this.prisma.opportunite.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: {
        status: 'CONVERTED',
        convertedAt: new Date(),
        convertedToProjetId: projetId,
      },
    })

    // Create timeline event for the conversion
    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: opportunite.clientId,
        type: 'OPPORTUNITY_CONVERTED',
        title: 'Opportunité convertie en projet',
        description: `Opportunité "${opportunite.name}" convertie en projet "${projet.name}"${opportunite.estimatedValue ? ` (valeur estimée: ${this.toNumber(opportunite.estimatedValue)}€)` : ''}`,
        relatedEntityType: 'Projet',
        relatedEntityId: projet.id,
        createdBy: this.userId,
      },
    })

    // Trigger patrimoine recalculation for the client
    const PatrimoineService = require('./patrimoine-service').PatrimoineService
    const patrimoineService = new PatrimoineService(
      this.cabinetId,
      this.userId,
      this.userRole || 'ADVISOR',
      this.isSuperAdmin
    )
    await patrimoineService.calculateAndUpdateClientWealth(opportunite.clientId)

    // Return updated opportunite
    return this.getOpportuniteById(id)
  }

  /**
   * Supprimer une opportunité
   */
  async deleteOpportunite(id: string) {
    const { count } = await this.prisma.opportunite.deleteMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (count === 0) {
      throw new Error('Opportunite not found or access denied')
    }

    return { success: true }
  }

  /**
   * Vue pipeline commercial
   */
  async getPipeline() {
    const opportunites = await this.prisma.opportunite.findMany({
      where: {
        cabinetId: this.cabinetId,
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
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ priority: 'asc' }, { detectedAt: 'desc' }],
    })

    // Format all opportunites
    const formattedOpportunites = opportunites.map(opp => this.formatOpportunite(opp))

    // Grouper par statut
    const pipeline = {
      DETECTED: formattedOpportunites.filter((o: any) => o.status === 'DETECTED'),
      CONTACTED: formattedOpportunites.filter((o: any) => o.status === 'CONTACTED'),
      QUALIFIED: formattedOpportunites.filter((o: any) => o.status === 'QUALIFIED'),
      PRESENTED: formattedOpportunites.filter((o: any) => o.status === 'PRESENTED'),
      ACCEPTED: formattedOpportunites.filter((o: any) => o.status === 'ACCEPTED'),
      CONVERTED: formattedOpportunites.filter((o: any) => o.status === 'CONVERTED'),
      REJECTED: formattedOpportunites.filter((o: any) => o.status === 'REJECTED'),
      LOST: formattedOpportunites.filter((o: any) => o.status === 'LOST'),
    }

    // Calculer les valeurs totales par étape
    const values = {
      DETECTED: pipeline.DETECTED.reduce((sum: number, o: any) => sum + (o.estimatedValue || 0), 0),
      CONTACTED: pipeline.CONTACTED.reduce((sum: number, o: any) => sum + (o.estimatedValue || 0), 0),
      QUALIFIED: pipeline.QUALIFIED.reduce((sum: number, o: any) => sum + (o.estimatedValue || 0), 0),
      PRESENTED: pipeline.PRESENTED.reduce((sum: number, o: any) => sum + (o.estimatedValue || 0), 0),
      ACCEPTED: pipeline.ACCEPTED.reduce((sum: number, o: any) => sum + (o.estimatedValue || 0), 0),
      CONVERTED: pipeline.CONVERTED.reduce((sum: number, o: any) => sum + (o.estimatedValue || 0), 0),
      REJECTED: pipeline.REJECTED.reduce((sum: number, o: any) => sum + (o.estimatedValue || 0), 0),
      LOST: pipeline.LOST.reduce((sum: number, o: any) => sum + (o.estimatedValue || 0), 0),
    }

    return {
      pipeline,
      values,
      totalValue: Object.values(values).reduce((sum, v) => sum + v, 0),
      totalCount: formattedOpportunites.length,
    }
  }

  /**
   * Statistiques des opportunités
   */
  async getStatistics() {
    const where = { cabinetId: this.cabinetId }

    const [total, detected, contacted, qualified, converted, lost] = await Promise.all([
      this.prisma.opportunite.count({ where }),
      this.prisma.opportunite.count({ where: { ...where, status: 'DETECTED' } }),
      this.prisma.opportunite.count({ where: { ...where, status: 'CONTACTED' } }),
      this.prisma.opportunite.count({ where: { ...where, status: 'QUALIFIED' } }),
      this.prisma.opportunite.count({ where: { ...where, status: 'CONVERTED' } }),
      this.prisma.opportunite.count({ where: { ...where, status: 'LOST' } }),
    ])

    const valueStats = await this.prisma.opportunite.aggregate({
      _sum: { estimatedValue: true },
      _avg: { probability: true },
      where,
    })

    const wonValue = await this.prisma.opportunite.aggregate({
      _sum: { estimatedValue: true },
      where: { ...where, status: 'CONVERTED' },
    })

    return {
      total,
      detected,
      contacted,
      qualified,
      converted,
      lost,
      conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
      totalValue: valueStats._sum.estimatedValue?.toNumber() || 0,
      wonValue: wonValue._sum.estimatedValue?.toNumber() || 0,
      avgProbability: valueStats._avg.probability || 0,
    }
  }
}
