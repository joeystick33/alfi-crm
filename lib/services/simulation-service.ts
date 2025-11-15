import { getPrismaClient, setRLSContext } from '@/lib/prisma'
import { SimulationType, SimulationStatus } from '@prisma/client'

export class SimulationService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Créer une simulation
   */
  async createSimulation(data: {
    clientId: string
    type: SimulationType
    name: string
    description?: string
    parameters: any
    results: any
    recommendations?: any
    feasibilityScore?: number
    sharedWithClient?: boolean
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: data.clientId },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    // Créer la simulation
    const simulation = await this.prisma.simulation.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        createdById: this.userId,
        type: data.type,
        name: data.name,
        description: data.description,
        parameters: data.parameters,
        results: data.results,
        recommendations: data.recommendations,
        feasibilityScore: data.feasibilityScore,
        status: 'COMPLETED',
        sharedWithClient: data.sharedWithClient || false,
        sharedAt: data.sharedWithClient ? new Date() : null,
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        clientId: data.clientId,
        type: 'SIMULATION_SHARED',
        title: 'Simulation créée',
        description: `Simulation "${data.name}" créée`,
        relatedEntityType: 'Simulation',
        relatedEntityId: simulation.id,
        createdBy: this.userId,
      },
    })

    return simulation
  }

  /**
   * Récupérer les simulations avec filtres
   */
  async getSimulations(filters?: {
    clientId?: string
    type?: SimulationType
    status?: SimulationStatus
    search?: string
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {}

    if (filters?.clientId) {
      where.clientId = filters.clientId
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    return this.prisma.simulation.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Récupérer une simulation par ID
   */
  async getSimulationById(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.simulation.findUnique({
      where: { id },
      include: {
        client: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })
  }

  /**
   * Mettre à jour une simulation
   */
  async updateSimulation(
    id: string,
    data: {
      name?: string
      description?: string
      parameters?: any
      results?: any
      recommendations?: any
      feasibilityScore?: number
      status?: SimulationStatus
      sharedWithClient?: boolean
    }
  ) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const updateData: any = { ...data }

    // Si on partage avec le client, mettre à jour sharedAt
    if (data.sharedWithClient === true) {
      const existing = await this.prisma.simulation.findUnique({
        where: { id },
        select: { sharedAt: true },
      })

      if (!existing?.sharedAt) {
        updateData.sharedAt = new Date()
      }
    }

    return this.prisma.simulation.update({
      where: { id },
      data: updateData,
    })
  }

  /**
   * Supprimer une simulation
   */
  async deleteSimulation(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.simulation.delete({
      where: { id },
    })
  }

  /**
   * Archiver une simulation
   */
  async archiveSimulation(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.simulation.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    })
  }

  /**
   * Partager une simulation avec le client
   */
  async shareWithClient(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const simulation = await this.prisma.simulation.findUnique({
      where: { id },
      include: { client: true },
    })

    if (!simulation) {
      throw new Error('Simulation not found')
    }

    const updated = await this.prisma.simulation.update({
      where: { id },
      data: {
        sharedWithClient: true,
        sharedAt: new Date(),
      },
    })

    // Créer une notification pour le client
    await this.prisma.notification.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: simulation.clientId,
        type: 'OTHER',
        title: 'Nouvelle simulation disponible',
        message: `Votre conseiller a partagé une simulation "${simulation.name}" avec vous`,
        actionUrl: `/client/simulations/${id}`,
      },
    })

    return updated
  }

  /**
   * Récupérer l'historique des simulations d'un client
   */
  async getClientSimulationHistory(clientId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.simulation.findMany({
      where: { clientId },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Statistiques des simulations par cabinet
   */
  async getStatistics() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const [total, completed, shared, archived] = await Promise.all([
      this.prisma.simulation.count(),
      this.prisma.simulation.count({ where: { status: 'COMPLETED' } }),
      this.prisma.simulation.count({ where: { sharedWithClient: true } }),
      this.prisma.simulation.count({ where: { status: 'ARCHIVED' } }),
    ])

    // Compter par type
    const byType = await this.prisma.simulation.groupBy({
      by: ['type'],
      _count: true,
    })

    return {
      total,
      completed,
      shared,
      archived,
      byType: byType.reduce((acc: Record<string, number>, item: any) => {
        acc[item.type] = item._count
        return acc
      }, {} as Record<string, number>),
    }
  }

  /**
   * Récupérer les simulations récentes
   */
  async getRecentSimulations(limit: number = 10) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.simulation.findMany({
      take: limit,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }
}
