import { getPrismaClient, setRLSContext } from '@/lib/prisma'
import { ProjetType, ProjetStatus } from '@prisma/client'

export class ProjetService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Créer un projet
   */
  async createProjet(data: {
    clientId: string
    type: ProjetType
    name: string
    description?: string
    estimatedBudget?: number
    startDate?: Date
    endDate?: Date
    priority?: string
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: data.clientId },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    // Créer le projet
    const projet = await this.prisma.projet.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        type: data.type,
        name: data.name,
        description: data.description,
        estimatedBudget: data.estimatedBudget,
        actualBudget: 0,
        startDate: data.startDate,
        targetDate: data.endDate,
        status: 'PLANNED',
        progress: 0,
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        clientId: data.clientId,
        type: 'OTHER',
        title: 'Projet créé',
        description: `Projet "${data.name}" créé`,
        relatedEntityType: 'Projet',
        relatedEntityId: projet.id,
        createdBy: this.userId,
      },
    })

    return projet
  }

  /**
   * Récupérer les projets avec filtres
   */
  async getProjets(filters?: {
    clientId?: string
    type?: ProjetType
    status?: ProjetStatus
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

    return this.prisma.projet.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            taches: true,
            documents: true,
          },
        },
      },
      orderBy: [{ startDate: 'desc' }],
    })
  }

  /**
   * Récupérer un projet par ID
   */
  async getProjetById(id: string, includeRelations: boolean = false) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.projet.findUnique({
      where: { id },
      include: includeRelations
        ? {
            client: true,
            taches: {
              orderBy: { dueDate: 'asc' },
            },
            documents: {
              include: {
                document: true,
              },
            },
          }
        : {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
    })
  }

  /**
   * Mettre à jour un projet
   */
  async updateProjet(
    id: string,
    data: {
      name?: string
      description?: string
      estimatedBudget?: number
      actualBudget?: number
      startDate?: Date
      targetDate?: Date
      status?: ProjetStatus
      progress?: number
    }
  ) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const projet = await this.prisma.projet.findUnique({
      where: { id },
    })

    if (!projet) {
      throw new Error('Projet not found')
    }

    // Si le statut change à COMPLETED, mettre à jour endDate
    const updateData: any = { ...data }
    if (data.status === 'COMPLETED' && projet.status !== 'COMPLETED') {
      updateData.endDate = new Date()
      updateData.progress = 100
    }

    return this.prisma.projet.update({
      where: { id },
      data: updateData,
    })
  }

  /**
   * Mettre à jour la progression d'un projet
   */
  async updateProgress(id: string, progress: number) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const projet = await this.prisma.projet.findUnique({
      where: { id },
    })

    if (!projet) {
      throw new Error('Projet not found')
    }

    // Valider la progression (0-100)
    const validProgress = Math.max(0, Math.min(100, progress))

    // Déterminer le statut
    let status = projet.status
    if (validProgress === 0 && projet.status === 'PLANNED') {
      status = 'PLANNED'
    } else if (validProgress > 0 && validProgress < 100) {
      status = 'IN_PROGRESS'
    } else if (validProgress === 100) {
      status = 'COMPLETED'
    }

    const updated = await this.prisma.projet.update({
      where: { id },
      data: {
        progress: validProgress,
        status,
        endDate: validProgress === 100 ? new Date() : projet.endDate,
      },
    })

    // Créer un événement timeline si projet terminé
    if (validProgress === 100 && projet.progress < 100) {
      await this.prisma.timelineEvent.create({
        data: {
          clientId: projet.clientId,
          type: 'OTHER',
          title: 'Projet terminé',
          description: `Projet "${projet.name}" terminé`,
          relatedEntityType: 'Projet',
          relatedEntityId: projet.id,
          createdBy: this.userId,
        },
      })
    }

    return updated
  }

  /**
   * Calculer automatiquement la progression basée sur les tâches
   */
  async calculateProgressFromTasks(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const projet = await this.prisma.projet.findUnique({
      where: { id },
      include: {
        taches: true,
      },
    })

    if (!projet) {
      throw new Error('Projet not found')
    }

    if (!projet.taches || projet.taches.length === 0) {
      return projet
    }

    const completedTasks = projet.taches.filter((t) => t.status === 'COMPLETED').length
    const totalTasks = projet.taches.length
    const progress = Math.round((completedTasks / totalTasks) * 100)

    return this.updateProgress(id, progress)
  }

  /**
   * Supprimer un projet
   */
  async deleteProjet(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.projet.delete({
      where: { id },
    })
  }

  /**
   * Récupérer les projets en retard
   */
  async getDelayedProjets() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const today = new Date()

    return this.prisma.projet.findMany({
      where: {
        targetDate: { lt: today },
        status: { in: ['PLANNED', 'IN_PROGRESS'] },
        progress: { lt: 100 },
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
      },
      orderBy: { targetDate: 'asc' },
    })
  }

  /**
   * Analyse du budget
   */
  async getBudgetAnalysis(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const projet = await this.prisma.projet.findUnique({
      where: { id },
    })

    if (!projet) {
      throw new Error('Projet not found')
    }

    const estimated = projet.estimatedBudget?.toNumber() || 0
    const actual = projet.actualBudget?.toNumber() || 0
    const remaining = estimated - actual
    const overBudget = actual > estimated

    return {
      estimatedBudget: estimated,
      actualBudget: actual,
      remaining,
      overBudget,
      budgetUsagePercent: estimated > 0 ? Math.round((actual / estimated) * 100) : 0,
    }
  }

  /**
   * Statistiques des projets par cabinet
   */
  async getStatistics() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const [total, planned, inProgress, completed, onHold, cancelled] = await Promise.all([
      this.prisma.projet.count(),
      this.prisma.projet.count({ where: { status: 'PLANNED' } }),
      this.prisma.projet.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.projet.count({ where: { status: 'COMPLETED' } }),
      this.prisma.projet.count({ where: { status: 'ON_HOLD' } }),
      this.prisma.projet.count({ where: { status: 'CANCELLED' } }),
    ])

    const avgProgress = await this.prisma.projet.aggregate({
      _avg: { progress: true },
      where: { status: { in: ['IN_PROGRESS'] } },
    })

    const budgetStats = await this.prisma.projet.aggregate({
      _sum: {
        estimatedBudget: true,
        actualBudget: true,
      },
    })

    return {
      total,
      planned,
      inProgress,
      completed,
      onHold,
      cancelled,
      avgProgress: avgProgress._avg.progress || 0,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalEstimatedBudget: budgetStats._sum.estimatedBudget?.toNumber() || 0,
      totalActualBudget: budgetStats._sum.actualBudget?.toNumber() || 0,
    }
  }
}
