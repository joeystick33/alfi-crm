import { getPrismaClient } from '@/app/_common/lib/prisma'
import { RendezVousStatus, RendezVousType } from '@prisma/client'
import type { Prisma } from '@prisma/client'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

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
  private formatRendezVous(rendezvous: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!rendezvous) {
      return null
    }

    return {
      ...rendezvous,
      conseiller: isRecord(rendezvous.conseiller) ? this.formatUser(rendezvous.conseiller) : null,
      client: isRecord(rendezvous.client) ? this.formatClient(rendezvous.client) : null,
    }
  }

  /**
   * Format a user entity
   */
  private formatUser(user: Record<string, unknown> | null): Record<string, unknown> | null {
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
  private formatClient(client: Record<string, unknown> | null): Record<string, unknown> | null {
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
        status: { in: ['PLANIFIE', 'CONFIRME'] },
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
        status: 'PLANIFIE',
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
    const where: Prisma.RendezVousWhereInput = {
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
      where.startDate = {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
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
          status: { in: ['PLANIFIE', 'CONFIRME'] },
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
        status: 'ANNULE',
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
          type: 'AUTRE',
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
        status: 'TERMINE',
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
        status: { in: ['PLANIFIE', 'CONFIRME', 'TERMINE'] },
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
        status: { in: ['PLANIFIE', 'CONFIRME'] },
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
      this.prisma.rendezVous.count({ where: { conseillerId, cabinetId: this.cabinetId, status: 'PLANIFIE' } }),
      this.prisma.rendezVous.count({ where: { conseillerId, cabinetId: this.cabinetId, status: 'CONFIRME' } }),
      this.prisma.rendezVous.count({ where: { conseillerId, cabinetId: this.cabinetId, status: 'TERMINE' } }),
      this.prisma.rendezVous.count({ where: { conseillerId, cabinetId: this.cabinetId, status: 'ANNULE' } }),
      this.prisma.rendezVous.count({ where: { conseillerId, cabinetId: this.cabinetId, status: 'ABSENT' } }),
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
      this.prisma.rendezVous.count({ where: { cabinetId: this.cabinetId, status: 'PLANIFIE' } }),
      this.prisma.rendezVous.count({ where: { cabinetId: this.cabinetId, status: 'CONFIRME' } }),
      this.prisma.rendezVous.count({ where: { cabinetId: this.cabinetId, status: 'TERMINE' } }),
      this.prisma.rendezVous.count({ where: { cabinetId: this.cabinetId, status: 'ANNULE' } }),
      this.prisma.rendezVous.count({ where: { cabinetId: this.cabinetId, status: 'ABSENT' } }),
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

  // ============================================
  // RÉCURRENCES & REPLANIFICATION
  // ============================================

  /**
   * Créer un rendez-vous récurrent
   * Génère toutes les occurrences selon la RRULE et vérifie les conflits
   */
  async createRecurringRendezVous(data: {
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
    recurrenceRule: string
    recurrenceEndDate?: Date
  }) {
    // Import dynamique pour éviter circular dependencies
    const { expandRecurrence, validateRRule } = await import('./recurrence-helper')

    // Valider la RRULE
    const validation = validateRRule(data.recurrenceRule)
    if (!validation.valid) {
      throw new Error(`RRULE invalide: ${validation.error}`)
    }

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

    // Calculer la durée en minutes
    const durationMs = data.endDate.getTime() - data.startDate.getTime()
    const durationMinutes = Math.floor(durationMs / 60000)

    // Expand la récurrence pour générer toutes les occurrences
    // Limiter à 2 ans pour la détection de conflits
    const maxExpandDate = new Date(data.startDate)
    maxExpandDate.setFullYear(maxExpandDate.getFullYear() + 2)
    const effectiveMaxDate = data.recurrenceEndDate && data.recurrenceEndDate < maxExpandDate 
      ? data.recurrenceEndDate 
      : maxExpandDate

    const instances = expandRecurrence(
      data.recurrenceRule,
      data.startDate,
      durationMinutes,
      effectiveMaxDate,
      []
    )

    // Vérifier les conflits pour toutes les occurrences non-exception
    const validInstances = instances.filter(inst => !inst.isException)
    const conflicts: Array<{ date: Date; conflict: { id: string; startDate: Date; endDate: Date } }> = []

    for (const instance of validInstances) {
      const instanceStart = instance.date
      const instanceEnd = new Date(instanceStart.getTime() + durationMs)

      const existingConflicts = await this.prisma.rendezVous.findMany({
        where: {
          conseillerId: data.conseillerId,
          status: { in: ['PLANIFIE', 'CONFIRME'] },
          OR: [
            {
              AND: [
                { startDate: { lte: instanceStart } },
                { endDate: { gt: instanceStart } },
              ],
            },
            {
              AND: [
                { startDate: { lt: instanceEnd } },
                { endDate: { gte: instanceEnd } },
              ],
            },
            {
              AND: [
                { startDate: { gte: instanceStart } },
                { endDate: { lte: instanceEnd } },
              ],
            },
          ],
        },
        select: {
          id: true,
          title: true,
          startDate: true,
          endDate: true,
        },
      })

      if (existingConflicts.length > 0) {
        conflicts.push({
          date: instanceStart,
          conflict: existingConflicts[0],
        })
      }
    }

    // Si conflits détectés, renvoyer erreur détaillée
    if (conflicts.length > 0) {
      const conflictDates = conflicts.slice(0, 5).map(c => 
        c.date.toLocaleString('fr-FR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      ).join(', ')
      
      const more = conflicts.length > 5 ? ` et ${conflicts.length - 5} autre(s)` : ''
      throw new Error(`Conflits détectés aux dates: ${conflictDates}${more}`)
    }

    // Créer le rendez-vous parent récurrent
    const parentRendezVous = await this.prisma.rendezVous.create({
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
        status: 'PLANIFIE',
        isRecurring: true,
        recurrenceRule: data.recurrenceRule,
        recurrenceEndDate: data.recurrenceEndDate,
        recurrenceExceptions: null,
        originalStartDate: data.startDate,
      },
    })

    // Créer événement timeline si lié à un client
    if (data.clientId) {
      await this.prisma.timelineEvent.create({
        data: {
          cabinetId: this.cabinetId,
          clientId: data.clientId,
          type: 'MEETING_HELD',
          title: 'Rendez-vous récurrent créé',
          description: `Série de rendez-vous "${data.title}" créée (${validInstances.length} occurrences)`,
          relatedEntityType: 'RendezVous',
          relatedEntityId: parentRendezVous.id,
          createdBy: this.userId,
        },
      })
    }

    return this.getRendezVousById(parentRendezVous.id)
  }

  /**
   * Expand les occurrences d'un rendez-vous récurrent pour affichage calendrier
   */
  async expandRecurrenceForView(
    rendezVousId: string,
    viewStart: Date,
    viewEnd: Date
  ): Promise<Array<{
    id: string
    parentId: string
    title: string
    description?: string
    startDate: Date
    endDate: Date
    type: RendezVousType
    status: RendezVousStatus
    isRecurringInstance: true
    recurrenceOccurrenceDate: Date
  }>> {
    const { expandRecurrence } = await import('./recurrence-helper')

    const parent = await this.prisma.rendezVous.findFirst({
      where: {
        id: rendezVousId,
        cabinetId: this.cabinetId,
        isRecurring: true,
      },
    })

    if (!parent || !parent.recurrenceRule) {
      return []
    }

    // Parser les exceptions
    const exceptions: Date[] = parent.recurrenceExceptions
      ? JSON.parse(parent.recurrenceExceptions).map((d: string) => new Date(d))
      : []

    // Calculer durée
    const durationMs = parent.endDate.getTime() - parent.startDate.getTime()
    const durationMinutes = Math.floor(durationMs / 60000)

    // Expand occurrences
    const instances = expandRecurrence(
      parent.recurrenceRule,
      parent.startDate,
      durationMinutes,
      viewEnd,
      exceptions
    )

    // Filtrer pour ne garder que celles dans la vue + récupérer modifications
    const occurrencesInView = instances
      .filter(inst => 
        inst.date >= viewStart && 
        inst.date <= viewEnd && 
        !inst.isException
      )

    // Récupérer les instances modifiées
    const modifiedInstances = await this.prisma.rendezVous.findMany({
      where: {
        parentRecurrenceId: rendezVousId,
        cabinetId: this.cabinetId,
        recurrenceOccurrenceDate: {
          gte: viewStart,
          lte: viewEnd,
        },
      },
    })

    const modifiedMap = new Map<string, typeof modifiedInstances[0]>(
      modifiedInstances.map(inst => [
        inst.recurrenceOccurrenceDate!.toISOString().split('T')[0],
        inst,
      ])
    )

    // Construire résultat final
    return occurrencesInView.map(inst => {
      const dateKey = inst.date.toISOString().split('T')[0]
      const modified = modifiedMap.get(dateKey)

      if (modified) {
        // Utiliser instance modifiée
        return {
          id: modified.id,
          parentId: rendezVousId,
          title: modified.title,
          description: modified.description,
          startDate: modified.startDate,
          endDate: modified.endDate,
          type: modified.type,
          status: modified.status,
          isRecurringInstance: true as const,
          recurrenceOccurrenceDate: inst.date,
        }
      }

      // Utiliser instance par défaut
      const instanceEnd = new Date(inst.date.getTime() + durationMs)
      return {
        id: `${rendezVousId}-${inst.date.getTime()}`,
        parentId: rendezVousId,
        title: parent.title,
        description: parent.description,
        startDate: inst.date,
        endDate: instanceEnd,
        type: parent.type,
        status: parent.status,
        isRecurringInstance: true as const,
        recurrenceOccurrenceDate: inst.date,
      }
    })
  }

  /**
   * Ajouter une exception (supprimer une occurrence)
   */
  async addRecurrenceException(parentId: string, occurrenceDate: Date) {
    const parent = await this.prisma.rendezVous.findFirst({
      where: {
        id: parentId,
        cabinetId: this.cabinetId,
        isRecurring: true,
      },
    })

    if (!parent) {
      throw new Error('Rendez-vous récurrent parent non trouvé')
    }

    // Parser exceptions existantes
    const exceptions: string[] = parent.recurrenceExceptions
      ? JSON.parse(parent.recurrenceExceptions)
      : []

    // Ajouter nouvelle exception (format ISO date uniquement)
    const exceptionDateStr = occurrenceDate.toISOString().split('T')[0]
    if (!exceptions.includes(exceptionDateStr)) {
      exceptions.push(exceptionDateStr)
    }

    // Mettre à jour
    await this.prisma.rendezVous.update({
      where: { id: parentId },
      data: {
        recurrenceExceptions: JSON.stringify(exceptions),
      },
    })

    return this.getRendezVousById(parentId)
  }

  /**
   * Mettre à jour une occurrence spécifique d'une récurrence
   */
  async updateRecurrenceInstance(
    parentId: string,
    occurrenceDate: Date,
    updates: {
      title?: string
      description?: string
      startDate?: Date
      endDate?: Date
      location?: string
      status?: RendezVousStatus
    },
    applyToAllFuture: boolean = false
  ) {
    const parent = await this.prisma.rendezVous.findFirst({
      where: {
        id: parentId,
        cabinetId: this.cabinetId,
        isRecurring: true,
      },
    })

    if (!parent) {
      throw new Error('Rendez-vous récurrent parent non trouvé')
    }

    if (applyToAllFuture) {
      // Modifier la série à partir de cette occurrence
      // On met à jour le parent et on ajoute toutes les occurrences passées en exceptions
      const { expandRecurrence } = await import('./recurrence-helper')
      
      const durationMs = parent.endDate.getTime() - parent.startDate.getTime()
      const durationMinutes = Math.floor(durationMs / 60000)
      
      const allInstances = expandRecurrence(
        parent.recurrenceRule!,
        parent.startDate,
        durationMinutes,
        new Date(parent.recurrenceEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)),
        []
      )

      const pastInstances = allInstances
        .filter(inst => inst.date < occurrenceDate && !inst.isException)
        .map(inst => inst.date.toISOString().split('T')[0])

      // Mettre à jour le parent
      await this.prisma.rendezVous.update({
        where: { id: parentId },
        data: {
          ...updates,
          recurrenceExceptions: JSON.stringify(pastInstances),
        },
      })

      return this.getRendezVousById(parentId)
    } else {
      // Modifier seulement cette occurrence
      // Vérifier si instance modifiée existe déjà
      const existing = await this.prisma.rendezVous.findFirst({
        where: {
          parentRecurrenceId: parentId,
          recurrenceOccurrenceDate: occurrenceDate,
          cabinetId: this.cabinetId,
        },
      })

      if (existing) {
        // Mettre à jour instance existante
        await this.prisma.rendezVous.update({
          where: { id: existing.id },
          data: updates,
        })

        return this.getRendezVousById(existing.id)
      } else {
        // Créer nouvelle instance modifiée
        const newInstance = await this.prisma.rendezVous.create({
          data: {
            cabinetId: this.cabinetId,
            conseillerId: parent.conseillerId,
            clientId: parent.clientId,
            title: updates.title || parent.title,
            description: updates.description || parent.description,
            type: parent.type,
            startDate: updates.startDate || new Date(occurrenceDate),
            endDate: updates.endDate || new Date(occurrenceDate.getTime() + (parent.endDate.getTime() - parent.startDate.getTime())),
            location: updates.location || parent.location,
            meetingUrl: parent.meetingUrl,
            isVirtual: parent.isVirtual,
            status: updates.status || parent.status,
            parentRecurrenceId: parentId,
            recurrenceOccurrenceDate: occurrenceDate,
            originalStartDate: occurrenceDate,
          },
        })

        return this.getRendezVousById(newInstance.id)
      }
    }
  }

  /**
   * Supprimer toute une série récurrente
   */
  async deleteRecurrenceSeries(parentId: string) {
    const parent = await this.prisma.rendezVous.findFirst({
      where: {
        id: parentId,
        cabinetId: this.cabinetId,
        isRecurring: true,
      },
    })

    if (!parent) {
      throw new Error('Rendez-vous récurrent parent non trouvé')
    }

    // Supprimer toutes les instances modifiées
    await this.prisma.rendezVous.deleteMany({
      where: {
        parentRecurrenceId: parentId,
        cabinetId: this.cabinetId,
      },
    })

    // Supprimer le parent
    await this.prisma.rendezVous.delete({
      where: { id: parentId },
    })

    return { success: true }
  }

  /**
   * Replanifier un rendez-vous (détection conflits + historique)
   */
  async rescheduleRendezVous(
    id: string,
    newStartDate: Date,
    newEndDate: Date,
    notifyParticipants: boolean = true
  ) {
    const rendezVous = await this.prisma.rendezVous.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      include: {
        client: true,
      },
    })

    if (!rendezVous) {
      throw new Error('RendezVous not found')
    }

    // Vérifier que le rendez-vous n'est pas dans le passé (sauf si déjà completed)
    if (newStartDate < new Date() && rendezVous.status !== 'TERMINE') {
      throw new Error('Impossible de replanifier dans le passé')
    }

    // Vérifier conflits sur le nouveau créneau
    const conflicts = await this.prisma.rendezVous.findMany({
      where: {
        id: { not: id },
        conseillerId: rendezVous.conseillerId,
        status: { in: ['PLANIFIE', 'CONFIRME'] },
        OR: [
          {
            AND: [
              { startDate: { lte: newStartDate } },
              { endDate: { gt: newStartDate } },
            ],
          },
          {
            AND: [
              { startDate: { lt: newEndDate } },
              { endDate: { gte: newEndDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: newStartDate } },
              { endDate: { lte: newEndDate } },
            ],
          },
        ],
      },
    })

    if (conflicts.length > 0) {
      throw new Error('Time slot conflict detected')
    }

    // Sauvegarder originalStartDate si première replanification
    const originalStartDate = rendezVous.originalStartDate || rendezVous.startDate

    // Mettre à jour
    const updated = await this.prisma.rendezVous.update({
      where: { id },
      data: {
        startDate: newStartDate,
        endDate: newEndDate,
        originalStartDate,
        rescheduledAt: new Date(),
        rescheduledCount: { increment: 1 },
        rescheduledBy: this.userId,
      },
    })

    // Créer événement timeline
    if (rendezVous.clientId) {
      await this.prisma.timelineEvent.create({
        data: {
          cabinetId: this.cabinetId,
          clientId: rendezVous.clientId,
          type: 'AUTRE',
          title: 'Rendez-vous replanifié',
          description: `Rendez-vous "${rendezVous.title}" replanifié du ${rendezVous.startDate.toLocaleString('fr-FR')} au ${newStartDate.toLocaleString('fr-FR')}`,
          relatedEntityType: 'RendezVous',
          relatedEntityId: id,
          createdBy: this.userId,
        },
      })
    }

    return this.getRendezVousById(id)
  }

  /**
   * Trouver des créneaux disponibles
   */
  async findAvailableSlots(
    date: Date,
    durationMinutes: number,
    conseillerId: string,
    excludeId?: string
  ): Promise<Array<{ start: Date; end: Date }>> {
    // Définir plage horaire de travail (8h-19h par défaut)
    const workStart = new Date(date)
    workStart.setHours(8, 0, 0, 0)
    
    const workEnd = new Date(date)
    workEnd.setHours(19, 0, 0, 0)

    // Récupérer tous les rendez-vous du jour
    const existingAppointments = await this.prisma.rendezVous.findMany({
      where: {
        conseillerId,
        cabinetId: this.cabinetId,
        status: { in: ['PLANIFIE', 'CONFIRME'] },
        startDate: {
          gte: workStart,
          lte: workEnd,
        },
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      orderBy: { startDate: 'asc' },
    })

    // Trouver les trous dans l'agenda
    const slots: Array<{ start: Date; end: Date }> = []
    let currentTime = new Date(workStart)

    for (const appointment of existingAppointments) {
      // Si gap avant ce rendez-vous
      const gapMinutes = (appointment.startDate.getTime() - currentTime.getTime()) / 60000
      
      if (gapMinutes >= durationMinutes) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(currentTime.getTime() + durationMinutes * 60000),
        })
      }

      currentTime = new Date(appointment.endDate)
    }

    // Vérifier s'il reste du temps après le dernier rendez-vous
    const remainingMinutes = (workEnd.getTime() - currentTime.getTime()) / 60000
    if (remainingMinutes >= durationMinutes) {
      slots.push({
        start: new Date(currentTime),
        end: new Date(currentTime.getTime() + durationMinutes * 60000),
      })
    }

    return slots
  }
}
