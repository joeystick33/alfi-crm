import { getPrismaClient } from '@/lib/prisma'
import { SimulationType, SimulationStatus } from '@prisma/client'

export class SimulationService {
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
   * Formats a simulation entity with nested relations
   */
  private formatSimulation(simulation: any): any {
    if (!simulation) {
      return null
    }

    return {
      ...simulation,
      feasibilityScore: this.toNumber(simulation.feasibilityScore),
      client: simulation.client ? {
        id: simulation.client.id,
        firstName: simulation.client.firstName,
        lastName: simulation.client.lastName,
        email: simulation.client.email,
      } : undefined,
      createdBy: simulation.createdBy ? {
        id: simulation.createdBy.id,
        firstName: simulation.createdBy.firstName,
        lastName: simulation.createdBy.lastName,
        email: simulation.createdBy.email,
      } : undefined,
    }
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
    status?: SimulationStatus
    sharedWithClient?: boolean
  }) {
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
        status: data.status || 'DRAFT',
        sharedWithClient: data.sharedWithClient || false,
        sharedAt: data.sharedWithClient ? new Date() : null,
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        type: 'SIMULATION_SHARED',
        title: 'Simulation créée',
        description: `Simulation "${data.name}" créée`,
        relatedEntityType: 'Simulation',
        relatedEntityId: simulation.id,
        createdBy: this.userId,
      },
    })

    return this.getSimulationById(simulation.id)
  }

  /**
   * Récupérer les simulations avec filtres
   */
  async getSimulations(filters?: {
    clientId?: string
    type?: SimulationType
    status?: SimulationStatus
    search?: string
    sharedWithClient?: boolean
    createdAfter?: Date
    createdBefore?: Date
    feasibilityScoreMin?: number
    feasibilityScoreMax?: number
  }) {
    const where: any = {
      cabinetId: this.cabinetId,
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.sharedWithClient !== undefined) {
      where.sharedWithClient = filters.sharedWithClient
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Date range filters
    if (filters?.createdAfter || filters?.createdBefore) {
      where.createdAt = {}
      if (filters.createdAfter) {
        where.createdAt.gte = filters.createdAfter
      }
      if (filters.createdBefore) {
        where.createdAt.lte = filters.createdBefore
      }
    }

    // Feasibility score range filters
    if (filters?.feasibilityScoreMin !== undefined || filters?.feasibilityScoreMax !== undefined) {
      where.feasibilityScore = {}
      if (filters.feasibilityScoreMin !== undefined) {
        where.feasibilityScore.gte = filters.feasibilityScoreMin
      }
      if (filters.feasibilityScoreMax !== undefined) {
        where.feasibilityScore.lte = filters.feasibilityScoreMax
      }
    }

    const simulations = await this.prisma.simulation.findMany({
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
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return simulations.map(simulation => this.formatSimulation(simulation))
  }

  /**
   * Récupérer une simulation par ID
   */
  async getSimulationById(id: string) {
    const simulation = await this.prisma.simulation.findFirst({
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

    return this.formatSimulation(simulation)
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
    // Check if simulation exists
    const existing = await this.prisma.simulation.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      select: {
        sharedAt: true,
        sharedWithClient: true,
        clientId: true,
        name: true,
      },
    })

    if (!existing) {
      throw new Error('Simulation not found or access denied')
    }

    const updateData: any = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.parameters !== undefined) updateData.parameters = data.parameters
    if (data.results !== undefined) updateData.results = data.results
    if (data.recommendations !== undefined) updateData.recommendations = data.recommendations
    if (data.feasibilityScore !== undefined) updateData.feasibilityScore = data.feasibilityScore
    if (data.status !== undefined) updateData.status = data.status

    // Si on partage avec le client pour la première fois, mettre à jour sharedAt
    if (data.sharedWithClient === true) {
      updateData.sharedWithClient = true
      if (!existing.sharedAt) {
        updateData.sharedAt = new Date()
        
        // Créer une notification pour le client
        await this.prisma.notification.create({
          data: {
            cabinetId: this.cabinetId,
            clientId: existing.clientId,
            type: 'OTHER',
            title: 'Nouvelle simulation disponible',
            message: `Votre conseiller a partagé une simulation "${existing.name}" avec vous`,
            actionUrl: `/client/simulations/${id}`,
          },
        })
      }
    } else if (data.sharedWithClient === false) {
      updateData.sharedWithClient = false
    }

    const { count } = await this.prisma.simulation.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: updateData,
    })

    if (count === 0) {
      throw new Error('Simulation not found or access denied')
    }

    return this.getSimulationById(id)
  }

  /**
   * Supprimer une simulation
   */
  async deleteSimulation(id: string) {
    const { count } = await this.prisma.simulation.deleteMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (count === 0) {
      throw new Error('Simulation not found or access denied')
    }

    return { success: true }
  }

  /**
   * Archiver une simulation
   */
  async archiveSimulation(id: string) {
    const { count } = await this.prisma.simulation.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: { status: 'ARCHIVED' },
    })

    if (count === 0) {
      throw new Error('Simulation not found or access denied')
    }

    return this.getSimulationById(id)
  }

  /**
   * Partager une simulation avec le client
   */
  async shareWithClient(id: string) {
    const simulation = await this.prisma.simulation.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      select: {
        id: true,
        name: true,
        clientId: true,
        sharedAt: true,
      },
    })

    if (!simulation) {
      throw new Error('Simulation not found')
    }

    const { count } = await this.prisma.simulation.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: {
        sharedWithClient: true,
        sharedAt: simulation.sharedAt || new Date(),
      },
    })

    if (count === 0) {
      throw new Error('Simulation not found or access denied')
    }

    // Créer une notification pour le client si pas déjà partagé
    if (!simulation.sharedAt) {
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
    }

    return this.getSimulationById(id)
  }

  /**
   * Récupérer l'historique des simulations d'un client
   */
  async getClientSimulationHistory(clientId: string) {
    const simulations = await this.prisma.simulation.findMany({
      where: {
        clientId,
        cabinetId: this.cabinetId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return simulations.map(simulation => this.formatSimulation(simulation))
  }

  /**
   * Statistiques des simulations par cabinet
   */
  async getStatistics() {
    const where = { cabinetId: this.cabinetId }

    const [total, completed, shared, archived] = await Promise.all([
      this.prisma.simulation.count({ where }),
      this.prisma.simulation.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.simulation.count({ where: { ...where, sharedWithClient: true } }),
      this.prisma.simulation.count({ where: { ...where, status: 'ARCHIVED' } }),
    ])

    // Compter par type
    const byType = await this.prisma.simulation.groupBy({
      by: ['type'],
      where,
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
    const simulations = await this.prisma.simulation.findMany({
      where: {
        cabinetId: this.cabinetId,
      },
      take: limit,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return simulations.map(simulation => this.formatSimulation(simulation))
  }
}
