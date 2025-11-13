import { getPrismaClient, setRLSContext } from '@/lib/prisma'
import { ObjectifType, ObjectifStatus, ObjectifPriority } from '@prisma/client'

export class ObjectifService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Créer un objectif
   */
  async createObjectif(data: {
    clientId: string
    type: ObjectifType
    name: string
    description?: string
    targetAmount: number
    currentAmount?: number
    targetDate: Date
    priority: ObjectifPriority
    monthlyContribution?: number
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: data.clientId },
    })

    if (!client) {
      throw new Error('Client not found')
    }

    // Créer l'objectif
    const objectif = await this.prisma.objectif.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        type: data.type,
        name: data.name,
        description: data.description,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount || 0,
        targetDate: data.targetDate,
        priority: data.priority,
        monthlyContribution: data.monthlyContribution,
        status: 'IN_PROGRESS',
        progress: 0,
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        clientId: data.clientId,
        type: 'OTHER',
        title: 'Objectif créé',
        description: `Objectif "${data.name}" créé`,
        relatedEntityType: 'Objectif',
        relatedEntityId: objectif.id,
        createdBy: this.userId,
      },
    })

    return objectif
  }

  /**
   * Récupérer les objectifs avec filtres
   */
  async getObjectifs(filters?: {
    clientId?: string
    type?: ObjectifType
    status?: ObjectifStatus
    priority?: ObjectifPriority
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

    if (filters?.priority) {
      where.priority = filters.priority
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    return this.prisma.objectif.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ priority: 'asc' }, { targetDate: 'asc' }],
    })
  }

  /**
   * Récupérer un objectif par ID
   */
  async getObjectifById(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.objectif.findUnique({
      where: { id },
      include: {
        client: true,
      },
    })
  }

  /**
   * Mettre à jour un objectif
   */
  async updateObjectif(
    id: string,
    data: {
      name?: string
      description?: string
      targetAmount?: number
      currentAmount?: number
      targetDate?: Date
      priority?: ObjectifPriority
      monthlyContribution?: number
      status?: ObjectifStatus
    }
  ) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.objectif.update({
      where: { id },
      data,
    })
  }

  /**
   * Mettre à jour la progression d'un objectif
   */
  async updateProgress(id: string, currentAmount: number) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const objectif = await this.prisma.objectif.findUnique({
      where: { id },
    })

    if (!objectif) {
      throw new Error('Objectif not found')
    }

    // Calculer la progression en pourcentage
    const progress = Math.min(
      100,
      Math.round((currentAmount / objectif.targetAmount.toNumber()) * 100)
    )

    // Déterminer le statut
    let status = objectif.status
    if (progress >= 100) {
      status = 'ACHIEVED'
    } else if (new Date() > objectif.targetDate && progress < 100) {
      status = 'DELAYED'
    }

    const updated = await this.prisma.objectif.update({
      where: { id },
      data: {
        currentAmount,
        progress,
        status,
        achievedAt: progress >= 100 ? new Date() : null,
      },
    })

    // Créer un événement timeline si objectif atteint
    if (progress >= 100 && objectif.progress < 100) {
      await this.prisma.timelineEvent.create({
        data: {
          clientId: objectif.clientId,
          type: 'GOAL_ACHIEVED',
          title: 'Objectif atteint',
          description: `Objectif "${objectif.name}" atteint`,
          relatedEntityType: 'Objectif',
          relatedEntityId: objectif.id,
          createdBy: this.userId,
        },
      })
    }

    return updated
  }

  /**
   * Calculer les recommandations de versement mensuel
   */
  async calculateMonthlyRecommendation(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const objectif = await this.prisma.objectif.findUnique({
      where: { id },
    })

    if (!objectif) {
      throw new Error('Objectif not found')
    }

    const remaining = objectif.targetAmount.toNumber() - objectif.currentAmount.toNumber()
    const today = new Date()
    const monthsRemaining = Math.max(
      1,
      Math.ceil(
        (objectif.targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
    )

    const recommendedMonthly = Math.ceil(remaining / monthsRemaining)

    return {
      remaining,
      monthsRemaining,
      recommendedMonthly,
      currentMonthly: objectif.monthlyContribution?.toNumber() || 0,
      isOnTrack:
        objectif.monthlyContribution &&
        objectif.monthlyContribution.toNumber() >= recommendedMonthly,
    }
  }

  /**
   * Supprimer un objectif
   */
  async deleteObjectif(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.objectif.delete({
      where: { id },
    })
  }

  /**
   * Récupérer les objectifs en retard
   */
  async getDelayedObjectifs() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const today = new Date()

    return this.prisma.objectif.findMany({
      where: {
        targetDate: { lt: today },
        status: { in: ['IN_PROGRESS', 'DELAYED'] },
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
   * Statistiques des objectifs par cabinet
   */
  async getStatistics() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const [total, achieved, inProgress, delayed, cancelled] = await Promise.all([
      this.prisma.objectif.count(),
      this.prisma.objectif.count({ where: { status: 'ACHIEVED' } }),
      this.prisma.objectif.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.objectif.count({ where: { status: 'DELAYED' } }),
      this.prisma.objectif.count({ where: { status: 'CANCELLED' } }),
    ])

    const avgProgress = await this.prisma.objectif.aggregate({
      _avg: { progress: true },
      where: { status: { in: ['IN_PROGRESS', 'DELAYED'] } },
    })

    return {
      total,
      achieved,
      inProgress,
      delayed,
      cancelled,
      avgProgress: avgProgress._avg.progress || 0,
      achievementRate: total > 0 ? Math.round((achieved / total) * 100) : 0,
    }
  }
}
