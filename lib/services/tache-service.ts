import { getPrismaClient, setRLSContext } from '@/lib/prisma'
import { TacheType, TacheStatus, TachePriority } from '@prisma/client'

export class TacheService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Créer une tâche
   */
  async createTache(data: {
    type: TacheType
    title: string
    description?: string
    assignedToId: string
    clientId?: string
    projetId?: string
    dueDate?: Date
    priority: TachePriority
    reminderDate?: Date
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que l'utilisateur assigné existe
    const user = await this.prisma.user.findUnique({
      where: { id: data.assignedToId },
    })

    if (!user) {
      throw new Error('Assigned user not found')
    }

    // Vérifier que le client existe si fourni
    if (data.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: data.clientId },
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
        status: 'TODO',
        createdById: this.userId,
      },
    })

    // Créer un événement timeline si lié à un client
    if (data.clientId) {
      await this.prisma.timelineEvent.create({
        data: {
          clientId: data.clientId,
          type: 'OTHER',
          title: 'Tâche créée',
          description: `Tâche "${data.title}" créée`,
          relatedEntityType: 'Tache',
          relatedEntityId: tache.id,
          createdBy: this.userId,
        },
      })
    }

    return tache
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
    priority?: TachePriority
    dueBefore?: Date
    search?: string
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {}

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

    return this.prisma.tache.findMany({
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
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    })
  }

  /**
   * Récupérer une tâche par ID
   */
  async getTacheById(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.tache.findUnique({
      where: { id },
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
  }

  /**
   * Mettre à jour une tâche
   */
  async updateTache(
    id: string,
    data: {
      title?: string
      description?: string
      assignedToId?: string
      dueDate?: Date
      priority?: TachePriority
      status?: TacheStatus
      reminderDate?: Date
    }
  ) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.tache.update({
      where: { id },
      data,
    })
  }

  /**
   * Marquer une tâche comme terminée
   */
  async completeTache(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const tache = await this.prisma.tache.findUnique({
      where: { id },
    })

    if (!tache) {
      throw new Error('Tache not found')
    }

    const updated = await this.prisma.tache.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    })

    // Créer un événement timeline si lié à un client
    if (tache.clientId) {
      await this.prisma.timelineEvent.create({
        data: {
          clientId: tache.clientId,
          type: 'OTHER',
          title: 'Tâche terminée',
          description: `Tâche "${tache.title}" terminée`,
          relatedEntityType: 'Tache',
          relatedEntityId: tache.id,
          createdBy: this.userId,
        },
      })
    }

    return updated
  }

  /**
   * Réassigner une tâche
   */
  async reassignTache(id: string, newAssignedToId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que le nouvel utilisateur existe
    const user = await this.prisma.user.findUnique({
      where: { id: newAssignedToId },
    })

    if (!user) {
      throw new Error('New assigned user not found')
    }

    return this.prisma.tache.update({
      where: { id },
      data: {
        assignedToId: newAssignedToId,
      },
    })
  }

  /**
   * Supprimer une tâche
   */
  async deleteTache(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.tache.delete({
      where: { id },
    })
  }

  /**
   * Récupérer mes tâches (pour l'utilisateur connecté)
   */
  async getMyTaches(status?: TacheStatus) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {
      assignedToId: this.userId,
    }

    if (status) {
      where.status = status
    }

    return this.prisma.tache.findMany({
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
  }

  /**
   * Récupérer les tâches en retard
   */
  async getOverdueTaches() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const today = new Date()

    return this.prisma.tache.findMany({
      where: {
        dueDate: { lt: today },
        status: { in: ['TODO', 'IN_PROGRESS'] },
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
  }

  /**
   * Récupérer les tâches avec rappel aujourd'hui
   */
  async getTachesWithReminderToday() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return this.prisma.tache.findMany({
      where: {
        reminderDate: {
          gte: today,
          lt: tomorrow,
        },
        status: { in: ['TODO', 'IN_PROGRESS'] },
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
  }

  /**
   * Statistiques des tâches par utilisateur
   */
  async getUserStatistics(userId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const [total, todo, inProgress, completed, cancelled] = await Promise.all([
      this.prisma.tache.count({ where: { assignedToId: userId } }),
      this.prisma.tache.count({ where: { assignedToId: userId, status: 'TODO' } }),
      this.prisma.tache.count({ where: { assignedToId: userId, status: 'IN_PROGRESS' } }),
      this.prisma.tache.count({ where: { assignedToId: userId, status: 'COMPLETED' } }),
      this.prisma.tache.count({ where: { assignedToId: userId, status: 'CANCELLED' } }),
    ])

    const today = new Date()
    const overdue = await this.prisma.tache.count({
      where: {
        assignedToId: userId,
        dueDate: { lt: today },
        status: { in: ['TODO', 'IN_PROGRESS'] },
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
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const [total, todo, inProgress, completed, cancelled] = await Promise.all([
      this.prisma.tache.count(),
      this.prisma.tache.count({ where: { status: 'TODO' } }),
      this.prisma.tache.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.tache.count({ where: { status: 'COMPLETED' } }),
      this.prisma.tache.count({ where: { status: 'CANCELLED' } }),
    ])

    const today = new Date()
    const overdue = await this.prisma.tache.count({
      where: {
        dueDate: { lt: today },
        status: { in: ['TODO', 'IN_PROGRESS'] },
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
