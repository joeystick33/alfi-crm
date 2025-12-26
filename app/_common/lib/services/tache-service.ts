
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { TacheStatus, TachePriority, TacheType } from '@prisma/client'

export interface CreateTacheInput {
  type: TacheType
  title: string
  description?: string
  assignedToId: string
  clientId?: string
  projetId?: string
  dueDate?: Date
  priority: TachePriority
  reminderDate?: Date
}

export interface UpdateTacheInput extends Partial<CreateTacheInput> {
  status?: TacheStatus
}

export class TacheService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  private formatTache(tache: Record<string, unknown> | null) {
    if (!tache) {
      return null
    }

    return {
      ...tache,
      dueDate: tache.dueDate ?? null,
      reminderDate: tache.reminderDate ?? null,
      completedAt: tache.completedAt ?? null,
    }
  }

  /**
   * Créer une tâche
   */
  async createTache(data: CreateTacheInput) {
    // Vérifier que l'utilisateur assigné existe
    const user = await this.prisma.user.findFirst({
      where: {
        id: data.assignedToId,
        cabinetId: this.cabinetId,
      },
    })

    if (!user) {
      throw new Error('Assigned user not found')
    }

    // Vérifier que le client existe si fourni
    if (data.clientId) {
      const client = await this.prisma.client.findFirst({
        where: {
          id: data.clientId,
          cabinetId: this.cabinetId,
        },
      })

      if (!client) {
        throw new Error('Client not found')
      }
    }

    // Créer la tâche
    const tache = await this.prisma.tache.create({
      data: {
        cabinetId: this.cabinetId,
        type: data.type,
        title: data.title,
        description: data.description,
        assignedToId: data.assignedToId,
        clientId: data.clientId,
        projetId: data.projetId,
        dueDate: data.dueDate,
        priority: data.priority,
        reminderDate: data.reminderDate,
        status: 'A_FAIRE',
        createdById: this.userId,
      },
    })

    // Créer un événement timeline si lié à un client
    if (data.clientId) {
      await this.prisma.timelineEvent.create({
        data: {
          cabinetId: this.cabinetId,
          clientId: data.clientId,
          type: 'AUTRE',
          title: 'Tâche créée',
          description: `Tâche "${data.title}" créée`,
          relatedEntityType: 'Tache',
          relatedEntityId: tache.id,
          createdBy: this.userId,
        },
      })
    }

    return this.getTacheById(tache.id)
  }

  /**
   * Récupérer les tâches avec filtres
   */
  async getTaches(filters?: {
    assignedToId?: string
    clientId?: string
    projetId?: string
    type?: TacheType
    status?: TacheStatus
    statusIn?: TacheStatus[]
    priority?: TachePriority
    dueBefore?: Date
    search?: string
    limit?: number
    sort?: string[]
  }) {
    const where: Record<string, unknown> = {
      cabinetId: this.cabinetId,
    }

    if (filters?.assignedToId) {
      where.assignedToId = filters.assignedToId
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId
    }

    if (filters?.projetId) {
      where.projetId = filters.projetId
    }

    if (filters?.type) {
      where.type = filters.type
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.statusIn && filters.statusIn.length > 0) {
      where.status = { in: filters.statusIn }
    }

    if (filters?.priority) {
      where.priority = filters.priority
    }

    if (filters?.dueBefore) {
      where.dueDate = { lte: filters.dueBefore }
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const orderBy: Record<string, 'asc' | 'desc'>[] = []

    if (filters?.sort && filters.sort.length > 0) {
      for (const field of filters.sort) {
        if (field === 'priority') {
          orderBy.push({ priority: 'asc' })
          continue
        }
        if (field === 'dueDate') {
          orderBy.push({ dueDate: 'asc' })
          continue
        }
        if (field === 'createdAt') {
          orderBy.push({ createdAt: 'desc' })
          continue
        }

        throw new Error(`Invalid sort field: ${field}`)
      }
    }

    if (orderBy.length === 0) {
      orderBy.push({ priority: 'asc' }, { dueDate: 'asc' })
    }

    const take = filters?.limit ? Math.min(filters.limit, 200) : undefined

    const taches = await this.prisma.tache.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        projet: {
          select: {
            id: true,
            name: true,
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
      orderBy,
      take,
    })

    return taches.map(tache => this.formatTache(tache))
  }

  /**
   * Récupérer une tâche par ID
   */
  async getTacheById(id: string) {
    const tache = await this.prisma.tache.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      include: {
        assignedTo: true,
        client: true,
        projet: true,
        createdBy: true,
        documents: {
          include: {
            document: true,
          },
        },
      },
    })

    return this.formatTache(tache)
  }

  /**
   * Mettre à jour une tâche
   */
  async updateTache(id: string, data: UpdateTacheInput) {
    if (data.assignedToId) {
      const user = await this.prisma.user.findFirst({
        where: {
          id: data.assignedToId,
          cabinetId: this.cabinetId,
        },
      })

      if (!user) {
        throw new Error('Assigned user not found')
      }
    }

    if (data.clientId) {
      const client = await this.prisma.client.findFirst({
        where: {
          id: data.clientId,
          cabinetId: this.cabinetId,
        },
      })

      if (!client) {
        throw new Error('Client not found')
      }
    }

    const { count } = await this.prisma.tache.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data,
    })

    if (count === 0) {
      throw new Error('Tache not found or access denied')
    }

    return this.getTacheById(id)
  }

  /**
   * Marquer une tâche comme terminée
   */
  async completeTache(id: string) {
    const tache = await this.prisma.tache.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!tache) {
      throw new Error('Tache not found')
    }

    const { count } = await this.prisma.tache.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: {
        status: 'TERMINE',
        completedAt: new Date(),
      },
    })

    if (count === 0) {
      throw new Error('Tache not found or access denied')
    }

    // Créer un événement timeline si lié à un client
    if (tache.clientId) {
      await this.prisma.timelineEvent.create({
        data: {
          cabinetId: this.cabinetId,
          clientId: tache.clientId,
          type: 'AUTRE',
          title: 'Tâche terminée',
          description: `Tâche "${tache.title}" terminée`,
          relatedEntityType: 'Tache',
          relatedEntityId: tache.id,
          createdBy: this.userId,
        },
      })
    }

    return this.getTacheById(id)
  }

  /**
   * Réassigner une tâche
   */
  async reassignTache(id: string, newAssignedToId: string) {
    // Vérifier que le nouvel utilisateur existe
    const user = await this.prisma.user.findFirst({
      where: {
        id: newAssignedToId,
        cabinetId: this.cabinetId,
      },
    })

    if (!user) {
      throw new Error('New assigned user not found')
    }

    const { count } = await this.prisma.tache.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: {
        assignedToId: newAssignedToId,
      },
    })

    if (count === 0) {
      throw new Error('Tache not found or access denied')
    }

    return this.getTacheById(id)
  }

  /**
   * Supprimer une tâche
   */
  async deleteTache(id: string) {
    const { count } = await this.prisma.tache.deleteMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (count === 0) {
      throw new Error('Tache not found or access denied')
    }

    return { success: true }
  }

  /**
   * Récupérer mes tâches (pour l'utilisateur connecté)
   */
  async getMyTaches(status?: TacheStatus) {
    const where: Record<string, unknown> = {
      assignedToId: this.userId,
      cabinetId: this.cabinetId,
    }

    if (status) {
      where.status = status
    }

    const taches = await this.prisma.tache.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        projet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    })

    return taches.map(tache => this.formatTache(tache))
  }

  /**
   * Récupérer les tâches en retard
   */
  async getOverdueTaches() {
    const today = new Date()

    const taches = await this.prisma.tache.findMany({
      where: {
        cabinetId: this.cabinetId,
        dueDate: { lt: today },
        status: { in: ['A_FAIRE', 'EN_COURS'] },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    return taches.map(tache => this.formatTache(tache))
  }

  /**
   * Récupérer les tâches avec rappel aujourd'hui
   */
  async getTachesWithReminderToday() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const taches = await this.prisma.tache.findMany({
      where: {
        cabinetId: this.cabinetId,
        reminderDate: {
          gte: today,
          lt: tomorrow,
        },
        status: { in: ['A_FAIRE', 'EN_COURS'] },
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return taches.map(tache => this.formatTache(tache))
  }

  /**
   * Statistiques des tâches par utilisateur
   */
  async getUserStatistics(userId: string) {
    const [total, todo, inProgress, completed, cancelled] = await Promise.all([
      this.prisma.tache.count({ where: { assignedToId: userId, cabinetId: this.cabinetId } }),
      this.prisma.tache.count({ where: { assignedToId: userId, cabinetId: this.cabinetId, status: 'A_FAIRE' } }),
      this.prisma.tache.count({ where: { assignedToId: userId, cabinetId: this.cabinetId, status: 'EN_COURS' } }),
      this.prisma.tache.count({ where: { assignedToId: userId, cabinetId: this.cabinetId, status: 'TERMINE' } }),
      this.prisma.tache.count({ where: { assignedToId: userId, cabinetId: this.cabinetId, status: 'ANNULE' } }),
    ])

    const today = new Date()
    const overdue = await this.prisma.tache.count({
      where: {
        assignedToId: userId,
        cabinetId: this.cabinetId,
        dueDate: { lt: today },
        status: { in: ['A_FAIRE', 'EN_COURS'] },
      },
    })

    return {
      total,
      todo,
      inProgress,
      completed,
      cancelled,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }

  /**
   * Statistiques globales des tâches
   */
  async getStatistics() {
    const [total, todo, inProgress, completed, cancelled] = await Promise.all([
      this.prisma.tache.count({ where: { cabinetId: this.cabinetId } }),
      this.prisma.tache.count({ where: { cabinetId: this.cabinetId, status: 'A_FAIRE' } }),
      this.prisma.tache.count({ where: { cabinetId: this.cabinetId, status: 'EN_COURS' } }),
      this.prisma.tache.count({ where: { cabinetId: this.cabinetId, status: 'TERMINE' } }),
      this.prisma.tache.count({ where: { cabinetId: this.cabinetId, status: 'ANNULE' } }),
    ])

    const today = new Date()
    const overdue = await this.prisma.tache.count({
      where: {
        cabinetId: this.cabinetId,
        dueDate: { lt: today },
        status: { in: ['A_FAIRE', 'EN_COURS'] },
      },
    })

    return {
      total,
      todo,
      inProgress,
      completed,
      cancelled,
      overdue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }
}
