import { getPrismaClient, setRLSContext } from '@/lib/prisma'
import { OpportuniteType, OpportuniteStatus, OpportunitePriority } from '@prisma/client'

export class OpportuniteService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
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
    priority: OpportunitePriority
    detectedAt?: Date
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: data.clientId },
    })

    if (!client) {
      throw new Error('Client not found')
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
        estimatedValue: data.estimatedValue,
        confidence: data.confidence || 50,
        priority: data.priority,
        status: 'DETECTED',
        detectedAt: data.detectedAt || new Date(),
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        clientId: data.clientId,
        type: 'OPPORTUNITY_CONVERTED',
        title: 'Opportunité détectée',
        description: `Opportunité "${data.name}" détectée`,
        relatedEntityType: 'Opportunite',
        relatedEntityId: opportunite.id,
        createdBy: this.userId,
      },
    })

    return opportunite
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
    minConfidence?: number
    search?: string
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {}

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

    if (filters?.minConfidence) {
      where.confidence = { gte: filters.minConfidence }
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    return this.prisma.opportunite.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ priority: 'asc' }, { confidence: 'desc' }, { detectedAt: 'desc' }],
    })
  }

  /**
   * Récupérer une opportunité par ID
   */
  async getOpportuniteById(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.opportunite.findUnique({
      where: { id },
      include: {
        client: true,
        conseiller: true,
      },
    })
  }

  /**
   * Mettre à jour une opportunité
   */
  async updateOpportunite(
    id: string,
    data: {
      name?: string
      description?: string
      estimatedValue?: number
      confidence?: number
      priority?: OpportunitePriority
      status?: OpportuniteStatus
      actionsTaken?: any
    }
  ) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.opportunite.update({
      where: { id },
      data,
    })
  }

  /**
   * Changer le statut d'une opportunité
   */
  async changeStatus(id: string, status: OpportuniteStatus) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const opportunite = await this.prisma.opportunite.findUnique({
      where: { id },
    })

    if (!opportunite) {
      throw new Error('Opportunite not found')
    }

    const updateData: any = { status }

    // Mettre à jour les dates selon le statut
    if (status === 'CONTACTED' && !opportunite.contactedAt) {
      updateData.contactedAt = new Date()
    } else if (status === 'QUALIFIED' && !opportunite.qualifiedAt) {
      updateData.qualifiedAt = new Date()
    } else if (status === 'PROPOSAL_SENT' && !opportunite.proposalSentAt) {
      updateData.proposalSentAt = new Date()
    } else if (status === 'WON' && !opportunite.wonAt) {
      updateData.wonAt = new Date()
    } else if (status === 'LOST' && !opportunite.lostAt) {
      updateData.lostAt = new Date()
    }

    const updated = await this.prisma.opportunite.update({
      where: { id },
      data: updateData,
    })

    // Créer un événement timeline pour les statuts importants
    if (status === 'WON') {
      await this.prisma.timelineEvent.create({
        data: {
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
  async convertToProjet(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const opportunite = await this.prisma.opportunite.findUnique({
      where: { id },
    })

    if (!opportunite) {
      throw new Error('Opportunite not found')
    }

    // Créer le projet
    const projet = await this.prisma.projet.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: opportunite.clientId,
        type: 'OTHER',
        name: opportunite.name,
        description: opportunite.description,
        estimatedBudget: opportunite.estimatedValue,
        priority: opportunite.priority as any,
        status: 'PLANNED',
      },
    })

    // Mettre à jour l'opportunité
    await this.prisma.opportunite.update({
      where: { id },
      data: {
        status: 'WON',
        wonAt: new Date(),
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        clientId: opportunite.clientId,
        type: 'OPPORTUNITY_CONVERTED',
        title: 'Opportunité convertie en projet',
        description: `Opportunité "${opportunite.name}" convertie en projet`,
        relatedEntityType: 'Projet',
        relatedEntityId: projet.id,
        createdBy: this.userId,
      },
    })

    return { opportunite, projet }
  }

  /**
   * Supprimer une opportunité
   */
  async deleteOpportunite(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.opportunite.delete({
      where: { id },
    })
  }

  /**
   * Vue pipeline commercial
   */
  async getPipeline() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const opportunites = await this.prisma.opportunite.findMany({
      where: {
        status: {
          in: ['DETECTED', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION'],
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Grouper par statut
    const pipeline = {
      DETECTED: opportunites.filter((o) => o.status === 'DETECTED'),
      CONTACTED: opportunites.filter((o) => o.status === 'CONTACTED'),
      QUALIFIED: opportunites.filter((o) => o.status === 'QUALIFIED'),
      PROPOSAL_SENT: opportunites.filter((o) => o.status === 'PROPOSAL_SENT'),
      NEGOTIATION: opportunites.filter((o) => o.status === 'NEGOTIATION'),
    }

    // Calculer les valeurs totales par étape
    const values = {
      DETECTED: pipeline.DETECTED.reduce(
        (sum, o) => sum + (o.estimatedValue?.toNumber() || 0),
        0
      ),
      CONTACTED: pipeline.CONTACTED.reduce(
        (sum, o) => sum + (o.estimatedValue?.toNumber() || 0),
        0
      ),
      QUALIFIED: pipeline.QUALIFIED.reduce(
        (sum, o) => sum + (o.estimatedValue?.toNumber() || 0),
        0
      ),
      PROPOSAL_SENT: pipeline.PROPOSAL_SENT.reduce(
        (sum, o) => sum + (o.estimatedValue?.toNumber() || 0),
        0
      ),
      NEGOTIATION: pipeline.NEGOTIATION.reduce(
        (sum, o) => sum + (o.estimatedValue?.toNumber() || 0),
        0
      ),
    }

    return {
      pipeline,
      values,
      totalValue: Object.values(values).reduce((sum, v) => sum + v, 0),
      totalCount: opportunites.length,
    }
  }

  /**
   * Statistiques des opportunités
   */
  async getStatistics() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const [total, detected, contacted, qualified, won, lost] = await Promise.all([
      this.prisma.opportunite.count(),
      this.prisma.opportunite.count({ where: { status: 'DETECTED' } }),
      this.prisma.opportunite.count({ where: { status: 'CONTACTED' } }),
      this.prisma.opportunite.count({ where: { status: 'QUALIFIED' } }),
      this.prisma.opportunite.count({ where: { status: 'WON' } }),
      this.prisma.opportunite.count({ where: { status: 'LOST' } }),
    ])

    const valueStats = await this.prisma.opportunite.aggregate({
      _sum: { estimatedValue: true },
      _avg: { confidence: true },
    })

    const wonValue = await this.prisma.opportunite.aggregate({
      _sum: { estimatedValue: true },
      where: { status: 'WON' },
    })

    return {
      total,
      detected,
      contacted,
      qualified,
      won,
      lost,
      conversionRate: total > 0 ? Math.round((won / total) * 100) : 0,
      totalValue: valueStats._sum.estimatedValue?.toNumber() || 0,
      wonValue: wonValue._sum.estimatedValue?.toNumber() || 0,
      avgConfidence: valueStats._avg.confidence || 0,
    }
  }
}
