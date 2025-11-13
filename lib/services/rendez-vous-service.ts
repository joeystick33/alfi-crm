import { getPrismaClient, setRLSContext } from '@/lib/prisma'
import { RendezVousType, RendezVousStatus } from '@prisma/client'

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
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que le conseiller existe
    const conseiller = await this.prisma.user.findUnique({
      where: { id: data.conseillerId },
    })

    if (!conseiller) {
      throw new Error('Conseiller not found')
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

    return rendezVous
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
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {}

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

    return this.prisma.rendezVous.findMany({
      where,
      include: {
        conseiller: {
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
      },
      orderBy: { startDate: 'asc' },
    })
  }

  /**
   * Récupérer un rendez-vous par ID
   */
  async getRendezVousById(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.rendezVous.findUnique({
      where: { id },
      include: {
        conseiller: true,
        client: true,
      },
    })
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
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Si on modifie les dates, vérifier les conflits
    if (data.startDate || data.endDate) {
      const current = await this.prisma.rendezVous.findUnique({
        where: { id },
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

    return this.prisma.rendezVous.update({
      where: { id },
      data,
    })
  }

  /**
   * Annuler un rendez-vous
   */
  async cancelRendezVous(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const rendezVous = await this.prisma.rendezVous.findUnique({
      where: { id },
    })

    if (!rendezVous) {
      throw new Error('RendezVous not found')
    }

    const updated = await this.prisma.rendezVous.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    })

    // Créer un événement timeline si lié à un client
    if (rendezVous.clientId) {
      await this.prisma.timelineEvent.create({
        data: {
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

    return updated
  }

  /**
   * Marquer un rendez-vous comme terminé
   */
  async completeRendezVous(id: string, notes?: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const rendezVous = await this.prisma.rendezVous.findUnique({
      where: { id },
    })

    if (!rendezVous) {
      throw new Error('RendezVous not found')
    }

    const updated = await this.prisma.rendezVous.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        notes,
      },
    })

    // Créer un événement timeline si lié à un client
    if (rendezVous.clientId) {
      await this.prisma.timelineEvent.create({
        data: {
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

    return updated
  }

  /**
   * Supprimer un rendez-vous
   */
  async deleteRendezVous(id: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.rendezVous.delete({
      where: { id },
    })
  }

  /**
   * Vue calendrier pour un conseiller
   */
  async getCalendarView(conseillerId: string, startDate: Date, endDate: Date) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    return this.prisma.rendezVous.findMany({
      where: {
        conseillerId,
        startDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'COMPLETED'] },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { startDate: 'asc' },
    })
  }

  /**
   * Récupérer les rendez-vous avec rappel aujourd'hui
   */
  async getRendezVousWithReminderToday() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    return this.prisma.rendezVous.findMany({
      where: {
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
  }

  /**
   * Statistiques des rendez-vous par conseiller
   */
  async getConseillerStatistics(conseillerId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const [total, scheduled, confirmed, completed, cancelled, noShow] = await Promise.all([
      this.prisma.rendezVous.count({ where: { conseillerId } }),
      this.prisma.rendezVous.count({ where: { conseillerId, status: 'SCHEDULED' } }),
      this.prisma.rendezVous.count({ where: { conseillerId, status: 'CONFIRMED' } }),
      this.prisma.rendezVous.count({ where: { conseillerId, status: 'COMPLETED' } }),
      this.prisma.rendezVous.count({ where: { conseillerId, status: 'CANCELLED' } }),
      this.prisma.rendezVous.count({ where: { conseillerId, status: 'NO_SHOW' } }),
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
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const [total, scheduled, confirmed, completed, cancelled, noShow] = await Promise.all([
      this.prisma.rendezVous.count(),
      this.prisma.rendezVous.count({ where: { status: 'SCHEDULED' } }),
      this.prisma.rendezVous.count({ where: { status: 'CONFIRMED' } }),
      this.prisma.rendezVous.count({ where: { status: 'COMPLETED' } }),
      this.prisma.rendezVous.count({ where: { status: 'CANCELLED' } }),
      this.prisma.rendezVous.count({ where: { status: 'NO_SHOW' } }),
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
