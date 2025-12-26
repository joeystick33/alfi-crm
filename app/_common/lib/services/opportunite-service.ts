import { getPrismaClient } from '@/app/_common/lib/prisma'
import { OpportuniteStatus, OpportuniteType, OpportunitePriority, type Prisma } from '@prisma/client'
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
  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null
    }

    if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof (value as { toNumber: () => number }).toNumber === 'function') {
      return (value as { toNumber: () => number }).toNumber()
    }

    return value as number
  }

  /**
   * Formats an opportunite entity with nested relations
   */
  private formatOpportunite(opportunite: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!opportunite) {
      return null
    }

    type RelationItem = Record<string, unknown>
    return {
      ...opportunite,
      estimatedValue: this.toNumber(opportunite.estimatedValue),
      confidence: this.toNumber(opportunite.confidence),
      client: opportunite.client ? {
        id: (opportunite.client as RelationItem).id,
        firstName: (opportunite.client as RelationItem).firstName,
        lastName: (opportunite.client as RelationItem).lastName,
        email: (opportunite.client as RelationItem).email,
      } : undefined,
      conseiller: opportunite.conseiller ? {
        id: (opportunite.conseiller as RelationItem).id,
        firstName: (opportunite.conseiller as RelationItem).firstName,
        lastName: (opportunite.conseiller as RelationItem).lastName,
        email: (opportunite.conseiller as RelationItem).email,
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
    confidence?: number
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
    const confidence = data.confidence ?? data.probability
    const opportunite = await this.prisma.opportunite.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        conseillerId: data.conseillerId,
        type: data.type,
        name: data.name,
        description: data.description,
        estimatedValue: data.estimatedValue !== undefined ? new Decimal(data.estimatedValue) : undefined,
        confidence: confidence !== undefined ? new Decimal(confidence) : undefined,
        priority: data.priority || 'MOYENNE',
        status: data.status || 'DETECTEE',
        actionDeadline: data.expectedCloseDate,
        notes: data.notes,
        detectedAt: new Date(),
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        type: 'AUTRE',
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
    const where: Prisma.OpportuniteWhereInput = { cabinetId: this.cabinetId }

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
      const detectedAtFilter: Prisma.DateTimeFilter = {}
      if (filters.detectedAfter) detectedAtFilter.gte = filters.detectedAfter
      if (filters.detectedBefore) detectedAtFilter.lte = filters.detectedBefore
      where.detectedAt = detectedAtFilter
    }

    if (filters?.expectedCloseDateAfter || filters?.expectedCloseDateBefore) {
      const actionDeadlineFilter: Prisma.DateTimeNullableFilter = {}
      if (filters.expectedCloseDateAfter) actionDeadlineFilter.gte = filters.expectedCloseDateAfter
      if (filters.expectedCloseDateBefore) actionDeadlineFilter.lte = filters.expectedCloseDateBefore
      where.actionDeadline = actionDeadlineFilter
    }

    // Value range filters
    if (filters?.minEstimatedValue !== undefined || filters?.maxEstimatedValue !== undefined) {
      const estimatedValueFilter: Prisma.DecimalNullableFilter = {}
      if (filters.minEstimatedValue !== undefined) {
        estimatedValueFilter.gte = new Decimal(filters.minEstimatedValue)
      }
      if (filters.maxEstimatedValue !== undefined) {
        estimatedValueFilter.lte = new Decimal(filters.maxEstimatedValue)
      }
      where.estimatedValue = estimatedValueFilter
    }

    // Probability range filters
    if (filters?.minProbability !== undefined || filters?.maxProbability !== undefined) {
      const confidenceFilter: Prisma.DecimalNullableFilter = {}
      if (filters.minProbability !== undefined) {
        confidenceFilter.gte = new Decimal(filters.minProbability)
      }
      if (filters.maxProbability !== undefined) {
        confidenceFilter.lte = new Decimal(filters.maxProbability)
      }
      where.confidence = confidenceFilter
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
      confidence?: number
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
    const updateData: Record<string, unknown> = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.status !== undefined) updateData.status = data.status
    if (data.notes !== undefined) updateData.notes = data.notes
    if (data.rejectionReason !== undefined) updateData.rejectionReason = data.rejectionReason
    if (data.convertedToProjetId !== undefined) updateData.convertedToProjetId = data.convertedToProjetId

    if (data.estimatedValue !== undefined) {
      updateData.estimatedValue = new Decimal(data.estimatedValue)
    }
    const confidence = data.confidence ?? data.probability
    if (confidence !== undefined) {
      updateData.confidence = new Decimal(confidence)
    }

    if (data.expectedCloseDate !== undefined) {
      updateData.actionDeadline = data.expectedCloseDate
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
        DETECTEE: 'détectée',
        QUALIFIEE: 'qualifiée',
        CONTACTEE: 'contactée',
        PRESENTEE: 'présentée',
        ACCEPTEE: 'acceptée',
        CONVERTIE: 'convertie',
        REJETEE: 'rejetée',
        PERDUE: 'perdue',
      }

      if (['CONVERTIE', 'REJETEE', 'PERDUE'].includes(data.status)) {
        await this.prisma.timelineEvent.create({
          data: {
            cabinetId: this.cabinetId,
            clientId: existing.clientId,
            type: data.status === 'CONVERTIE' ? 'OPPORTUNITY_CONVERTED' : 'AUTRE',
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

    const updateData: Record<string, unknown> = { status }

    // Mettre à jour les dates selon le statut (aligné avec le schéma)
    if (status === 'CONTACTEE' && !opportunite.contactedAt) {
      updateData.contactedAt = new Date()
    } else if (status === 'QUALIFIEE' && !opportunite.qualifiedAt) {
      updateData.qualifiedAt = new Date()
    } else if (status === 'PRESENTEE' && !opportunite.presentedAt) {
      updateData.presentedAt = new Date()
    } else if (status === 'ACCEPTEE' && !opportunite.acceptedAt) {
      updateData.acceptedAt = new Date()
    } else if (status === 'CONVERTIE' && !opportunite.convertedAt) {
      updateData.convertedAt = new Date()
    } else if (status === 'REJETEE' && !opportunite.rejectedAt) {
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
    if (status === 'CONVERTIE') {
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
        status: 'CONVERTIE',
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
      DETECTED: formattedOpportunites.filter((o) => o?.status === 'DETECTEE'),
      CONTACTED: formattedOpportunites.filter((o) => o?.status === 'CONTACTEE'),
      QUALIFIED: formattedOpportunites.filter((o) => o?.status === 'QUALIFIEE'),
      PRESENTED: formattedOpportunites.filter((o) => o?.status === 'PRESENTEE'),
      ACCEPTED: formattedOpportunites.filter((o) => o?.status === 'ACCEPTEE'),
      CONVERTED: formattedOpportunites.filter((o) => o?.status === 'CONVERTIE'),
      REJECTED: formattedOpportunites.filter((o) => o?.status === 'REJETEE'),
      LOST: formattedOpportunites.filter((o) => o?.status === 'PERDUE'),
    }

    // Calculer les valeurs totales par étape
    type OppRecord = Record<string, unknown> | null
    const values = {
      DETECTED: pipeline.DETECTED.reduce((sum: number, o: OppRecord) => sum + (Number(o?.estimatedValue) || 0), 0),
      CONTACTED: pipeline.CONTACTED.reduce((sum: number, o: OppRecord) => sum + (Number(o?.estimatedValue) || 0), 0),
      QUALIFIED: pipeline.QUALIFIED.reduce((sum: number, o: OppRecord) => sum + (Number(o?.estimatedValue) || 0), 0),
      PRESENTED: pipeline.PRESENTED.reduce((sum: number, o: OppRecord) => sum + (Number(o?.estimatedValue) || 0), 0),
      ACCEPTED: pipeline.ACCEPTED.reduce((sum: number, o: OppRecord) => sum + (Number(o?.estimatedValue) || 0), 0),
      CONVERTED: pipeline.CONVERTED.reduce((sum: number, o: OppRecord) => sum + (Number(o?.estimatedValue) || 0), 0),
      REJECTED: pipeline.REJECTED.reduce((sum: number, o: OppRecord) => sum + (Number(o?.estimatedValue) || 0), 0),
      LOST: pipeline.LOST.reduce((sum: number, o: OppRecord) => sum + (Number(o?.estimatedValue) || 0), 0),
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
      this.prisma.opportunite.count({ where: { ...where, status: 'DETECTEE' } }),
      this.prisma.opportunite.count({ where: { ...where, status: 'CONTACTEE' } }),
      this.prisma.opportunite.count({ where: { ...where, status: 'QUALIFIEE' } }),
      this.prisma.opportunite.count({ where: { ...where, status: 'CONVERTIE' } }),
      this.prisma.opportunite.count({ where: { ...where, status: 'PERDUE' } }),
    ])

    const valueStats = await this.prisma.opportunite.aggregate({
      _sum: { estimatedValue: true },
      _avg: { confidence: true },
      where,
    })

    const wonValue = await this.prisma.opportunite.aggregate({
      _sum: { estimatedValue: true },
      where: { ...where, status: 'CONVERTIE' },
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
      avgProbability: this.toNumber(valueStats._avg.confidence) || 0,
    }
  }
}
