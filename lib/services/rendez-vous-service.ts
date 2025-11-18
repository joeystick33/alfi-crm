import { getPrismaClient } from '@/lib/prisma'
import { RendezVousType, RendezVousStatus } from '@prisma/client'

/**
 * RendezVous Service
 * 
 * Manages rendez-vous entities with tenant isolation.
 * Provides CRUD operations and domain-specific business logic.
 * 
 * @example
 * const service = new RendezVousService(cabinetId, userId, isSuperAdmin)
 * const rendezvous = await service.createRendezVous(data)
 */
export class RendezVousService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Format a rendez-vous entity with nested relations
   */
  private formatRendezVous(rendezvous: any): any {
    if (!rendezvous) {
      return null
    }

    return {
      ...rendezvous,
      conseiller: rendezvous.conseiller ? this.formatUser(rendezvous.conseiller) : null,
      client: rendezvous.client ? this.formatClient(rendezvous.client) : null,
    }
  }

  /**
   * Format a user entity
   */
  private formatUser(user: any): any {
    if (!user) {
      return null
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    }
  }

  /**
   * Format a client entity
   */
  private formatClient(client: any): any {
    if (!client) {
      return null
    }

    return {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
    }
  }

  /**
   * Créer un rendez-vous
   */
  async createRendezVous(data: {
    type: RendezVousType
    title: string
    description?: string
    startDate: Date
    endDate: Date
    location?: string
    meetingUrl?: string
    isVirtual?: boolean
    conseillerId: string
    clientId?: string
  }) {
    // Vérifier que le conseiller existe
    const conseiller = await this.prisma.user.findFirst({
      where: {
        id: data.conseillerId,
        cabinetId: this.cabinetId,
      },
    })

    if (!conseiller) {
      throw new Error('Conseiller not found')
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

    // Vérifier qu'il n'y a pas de conflit d'horaire
    const conflicts = await this.prisma.rendezVous.findMany({
      where: {
        conseillerId: data.conseillerId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        OR: [
          {
            AND: [
              { startDate: { lte: data.startDate } },
              { endDate: { gt: data.startDate } },
            ],
          },
          {
            AND: [{ startDate: { lt: data.endDate } }, { endDate: { gte: data.endDate } }],
          },
          {
            AND: [
              { startDate: { gte: data.startDate } },
              { endDate: { lte: data.endDate } },
            ],
          },
        ],
      },
    })

    if (conflicts.length > 0) {
      throw new Error('Time slot conflict detected')
    }

    // Créer le rendez-vous
    const rendezVous = await this.prisma.rendezVous.create({
      data: {
        cabinetId: this.cabinetId,
        type: data.type,
        title: data.title,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        location: data.location,
        meetingUrl: data.meetingUrl,
        isVirtual: data.isVirtual || false,
        conseillerId: data.conseillerId,
        clientId: data.clientId,
        status: 'SCHEDULED',
      },
    })

    // Créer un événement timeline si lié à un client
    if (data.clientId) {
      await this.prisma.timelineEvent.create({
        data: {
          cabinetId: this.cabinetId,
          clientId: data.clientId,
          type: 'MEETING_HELD',
          title: 'Rendez-vous planifié',
          description: `Rendez-vous "${data.title}" planifié`,
          relatedEntityType: 'RendezVous',
          relatedEntityId: rendezVous.id,
          createdBy: this.userId,
        },
      })
    }

    // Return formatted rendez-vous
    return this.getRendezVousById(rendezVous.id)
  }

  /**
   * Récupérer les rendez-vous avec filtres
   */
  async getRendezVous(filters?: {
    conseillerId?: string
    clientId?: string
    type?: RendezVousType
    status?: RendezVousStatus
    startDate?: Date
    endDate?: Date
    search?: string
  }) {
    const where: any = {
      cabinetId: this.cabinetId,
    }

    if (filters?.conseillerId) {
      where.conseillerId = filters.conseillerId
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

    if (filters?.startDate || filters?.endDate) {
      where.startDate = {}
      if (filters.startDate) {
        where.startDate.gte = filters.startDate
      }
      if (filters.endDate) {
        where.startDate.lte = filters.endDate
      }
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const rendezvousList = await this.prisma.rendezVous.findMany({
      where,
      include: {
        conseiller: {
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
            email: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    return rendezvousList.map(rv => this.formatRendezVous(rv))
  }

  /**
   * Récupérer un rendez-vous par ID
   */
  async getRendezVousById(id: string) {
    const rendezvous = await this.prisma.rendezVous.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      include: {
        conseiller: {
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
            email: true,
          },
        },
      },
    })

    return this.formatRendezVous(rendezvous)
  }

  /**
   * Mettre à jour un rendez-vous
   */
  async updateRendezVous(
    id: string,
    data: {
      title?: string
      description?: string
      startDate?: Date
      endDate?: Date
      location?: string
      meetingUrl?: string
      isVirtual?: boolean
      status?: RendezVousStatus
    }
  ) {
    // Si on modifie les dates, vérifier les conflits
    if (data.startDate || data.endDate) {
      const current = await this.prisma.rendezVous.findFirst({
        where: {
          id,
          cabinetId: this.cabinetId,
        },
      })

      if (!current) {
        throw new Error('RendezVous not found')
      }

      const newStart = data.startDate || current.startDate
      const newEnd = data.endDate || current.endDate

      const conflicts = await this.prisma.rendezVous.findMany({
        where: {
          id: { not: id },
          conseillerId: current.conseillerId,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          OR: [
            {
              AND: [{ startDate: { lte: newStart } }, { endDate: { gt: newStart } }],
            },
            {
              AND: [{ startDate: { lt: newEnd } }, { endDate: { gte: newEnd } }],
            },
            {
              AND: [{ startDate: { gte: newStart } }, { endDate: { lte: newEnd } }],
            },
          ],
        },
      })

      if (conflicts.length > 0) {
        throw new Error('Time slot conflict detected')
      }
    }

    const { count } = await this.prisma.rendezVous.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data,
    })

    if (count === 0) {
      throw new Error('RendezVous not found or access denied')
    }

    return this.getRendezVousById(id)
  }

  /**
   * Annuler un rendez-vous
   */
  async cancelRendezVous(id: string) {
    const rendezVous = await this.prisma.rendezVous.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!rendezVous) {
      throw new Error('RendezVous not found')
    }

    const { count } = await this.prisma.rendezVous.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    })

    if (count === 0) {
      throw new Error('RendezVous not found or access denied')
    }

    // Créer un événement timeline si lié à un client
    if (rendezVous.clientId) {
      await this.prisma.timelineEvent.create({
        data: {
          cabinetId: this.cabinetId,
          clientId: rendezVous.clientId,
          type: 'OTHER',
          title: 'Rendez-vous annulé',
          description: `Rendez-vous "${rendezVous.title}" annulé`,
          relatedEntityType: 'RendezVous',
          relatedEntityId: rendezVous.id,
          createdBy: this.userId,
        },
      })
    }

    return this.getRendezVousById(id)
  }

  /**
   * Marquer un rendez-vous comme terminé
   */
  async completeRendezVous(id: string, notes?: string) {
    const rendezVous = await this.prisma.rendezVous.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!rendezVous) {
      throw new Error('RendezVous not found')
    }

    const { count } = await this.prisma.rendezVous.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: {
        status: 'COMPLETED',
        notes,
      },
    })

    if (count === 0) {
      throw new Error('RendezVous not found or access denied')
    }

    // Créer un événement timeline si lié à un client
    if (rendezVous.clientId) {
      await this.prisma.timelineEvent.create({
        data: {
          cabinetId: this.cabinetId,
          clientId: rendezVous.clientId,
          type: 'MEETING_HELD',
          title: 'Rendez-vous terminé',
          description: `Rendez-vous "${rendezVous.title}" terminé`,
          relatedEntityType: 'RendezVous',
          relatedEntityId: rendezVous.id,
          createdBy: this.userId,
        },
      })
    }

    return this.getRendezVousById(id)
  }

  /**
   * Supprimer un rendez-vous
   */
  async deleteRendezVous(id: string) {
    const { count } = await this.prisma.rendezVous.deleteMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (count === 0) {
      throw new Error('RendezVous not found or access denied')
    }

    return { success: true }
  }

  /**
   * Vue calendrier pour un conseiller
   */
  async getCalendarView(conseillerId: string, startDate: Date, endDate: Date) {
    const rendezvousList = await this.prisma.rendezVous.findMany({
      where: {
        conseillerId,
        cabinetId: this.cabinetId,
        startDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'COMPLETED'] },
      },
      include: {
        conseiller: {
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
            email: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    return rendezvousList.map(rv => this.formatRendezVous(rv))
  }

  /**
   * Récupérer les rendez-vous avec rappel aujourd'hui
   */
  async getRendezVousWithReminderToday() {
    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const rendezvousList = await this.prisma.rendezVous.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        startDate: {
          gte: now,
          lte: endOfDay,
        },
      },
      include: {
        conseiller: {
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
            email: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    })

    return rendezvousList.map(rv => this.formatRendezVous(rv))
  }

  /**
   * Statistiques des rendez-vous par conseiller
   */
  async getConseillerStatistics(conseillerId: string) {
    const [total, scheduled, confirmed, completed, cancelled, noShow] = await Promise.all([
      this.prisma.rendezVous.count({ where: { conseillerId, cabinetId: this.cabinetId } }),
      this.prisma.rendezVous.count({ where: { conseillerId, cabinetId: this.cabinetId, status: 'SCHEDULED' } }),
      this.prisma.rendezVous.count({ where: { conseillerId, cabinetId: this.cabinetId, status: 'CONFIRMED' } }),
      this.prisma.rendezVous.count({ where: { conseillerId, cabinetId: this.cabinetId, status: 'COMPLETED' } }),
      this.prisma.rendezVous.count({ where: { conseillerId, cabinetId: this.cabinetId, status: 'CANCELLED' } }),
      this.prisma.rendezVous.count({ where: { conseillerId, cabinetId: this.cabinetId, status: 'NO_SHOW' } }),
    ])

    return {
      total,
      scheduled,
      confirmed,
      completed,
      cancelled,
      noShow,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      noShowRate: total > 0 ? Math.round((noShow / total) * 100) : 0,
    }
  }

  /**
   * Statistiques globales des rendez-vous
   */
  async getStatistics() {
    const [total, scheduled, confirmed, completed, cancelled, noShow] = await Promise.all([
      this.prisma.rendezVous.count({ where: { cabinetId: this.cabinetId } }),
      this.prisma.rendezVous.count({ where: { cabinetId: this.cabinetId, status: 'SCHEDULED' } }),
      this.prisma.rendezVous.count({ where: { cabinetId: this.cabinetId, status: 'CONFIRMED' } }),
      this.prisma.rendezVous.count({ where: { cabinetId: this.cabinetId, status: 'COMPLETED' } }),
      this.prisma.rendezVous.count({ where: { cabinetId: this.cabinetId, status: 'CANCELLED' } }),
      this.prisma.rendezVous.count({ where: { cabinetId: this.cabinetId, status: 'NO_SHOW' } }),
    ])

    return {
      total,
      scheduled,
      confirmed,
      completed,
      cancelled,
      noShow,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      noShowRate: total > 0 ? Math.round((noShow / total) * 100) : 0,
    }
  }
}
