 
import { PrismaClient, ScenarioStatus, ScenarioTrigger } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/app/_common/lib/prisma'

export interface CreateScenarioInput {
  name: string
  description?: string
  trigger: ScenarioTrigger
  triggerData?: Record<string, unknown> // Configuration JSON du trigger
  emailTemplateId?: string
  delayHours?: number
  conditions?: Record<string, unknown> // Conditions JSON
  fromName?: string
  fromEmail?: string
  replyTo?: string
  tags?: string[]
  notes?: string
}

export interface UpdateScenarioInput {
  name?: string
  description?: string
  trigger?: ScenarioTrigger
  triggerData?: Record<string, unknown>
  emailTemplateId?: string
  delayHours?: number
  conditions?: Record<string, unknown>
  fromName?: string
  fromEmail?: string
  replyTo?: string
  tags?: string[]
  notes?: string
}

export interface ScenarioFilters {
  status?: ScenarioStatus
  trigger?: ScenarioTrigger
  createdBy?: string
  search?: string
  tags?: string[]
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'name' | 'executionCount' | 'lastExecutedAt'
  sortOrder?: 'asc' | 'desc'
}

export class ScenarioService {
  private prisma: PrismaClient
  private cabinetId: string
  private userId: string
  private isSuperAdmin: boolean

  constructor(cabinetId: string, userId: string, isSuperAdmin: boolean = false) {
    this.prisma = prisma
    this.cabinetId = cabinetId
    this.userId = userId
    this.isSuperAdmin = isSuperAdmin
  }

  /**
   * Créer un nouveau scénario
   */
  async createScenario(input: CreateScenarioInput) {
    // Vérifier template si fourni
    if (input.emailTemplateId) {
      const template = await this.prisma.emailTemplate.findFirst({
        where: {
          id: input.emailTemplateId,
          cabinetId: this.cabinetId,
          isActive: true,
        },
      })

      if (!template) {
        throw new Error('Template email non trouvé ou inactif')
      }
    }

    const scenario = await this.prisma.scenario.create({
      data: {
        cabinetId: this.cabinetId,
        createdBy: this.userId,
        name: input.name,
        description: input.description,
        status: 'INACTIF', // Par défaut inactif
        trigger: input.trigger,
        triggerData: (input.triggerData || {}) as unknown as Prisma.InputJsonValue,
        emailTemplateId: input.emailTemplateId,
        delayHours: input.delayHours || 0,
        conditions: (input.conditions || {}) as unknown as Prisma.InputJsonValue,
        fromName: input.fromName,
        fromEmail: input.fromEmail,
        replyTo: input.replyTo,
        tags: input.tags || [],
        notes: input.notes,
        executionCount: 0,
      },
      include: {
        emailTemplate: {
          select: {
            id: true,
            name: true,
            subject: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    })

    return scenario
  }

  /**
   * Lister les scénarios avec filtres
   */
  async listScenarios(filters: ScenarioFilters = {}) {
    const where: Record<string, unknown> = {
      cabinetId: this.cabinetId,
    }

    if (filters.status) where.status = filters.status
    if (filters.trigger) where.trigger = filters.trigger
    if (filters.createdBy) where.createdBy = filters.createdBy

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      }
    }

    const orderBy: Record<string, string> = {}
    const sortBy = filters.sortBy || 'createdAt'
    const sortOrder = filters.sortOrder || 'desc'
    orderBy[sortBy] = sortOrder

    const limit = filters.limit || 50
    const offset = filters.offset || 0

    const [scenarios, total] = await Promise.all([
      this.prisma.scenario.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
        include: {
          emailTemplate: {
            select: {
              id: true,
              name: true,
            },
          },
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              messages: true,
            },
          },
        },
      }),
      this.prisma.scenario.count({ where }),
    ])

    return {
      data: scenarios,
      total,
      limit,
      offset,
    }
  }

  /**
   * Obtenir un scénario par ID
   */
  async getScenarioById(id: string) {
    const scenario = await this.prisma.scenario.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      include: {
        emailTemplate: true,
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        messages: {
          take: 50,
          orderBy: {
            createdAt: 'desc',
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
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    })

    if (!scenario) {
      throw new Error('Scénario non trouvé')
    }

    return scenario
  }

  /**
   * Mettre à jour un scénario
   */
  async updateScenario(id: string, input: UpdateScenarioInput) {
    const existing = await this.prisma.scenario.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!existing) {
      throw new Error('Scénario non trouvé')
    }

    // Vérifier template si fourni
    if (input.emailTemplateId) {
      const template = await this.prisma.emailTemplate.findFirst({
        where: {
          id: input.emailTemplateId,
          cabinetId: this.cabinetId,
          isActive: true,
        },
      })

      if (!template) {
        throw new Error('Template email non trouvé ou inactif')
      }
    }

    const updateData: any = {}
    if (input.name !== undefined) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.trigger !== undefined) updateData.trigger = input.trigger
    if (input.triggerData !== undefined) updateData.triggerData = input.triggerData
    if (input.emailTemplateId !== undefined) updateData.emailTemplateId = input.emailTemplateId
    if (input.delayHours !== undefined) updateData.delayHours = input.delayHours
    if (input.conditions !== undefined) updateData.conditions = input.conditions
    if (input.fromName !== undefined) updateData.fromName = input.fromName
    if (input.fromEmail !== undefined) updateData.fromEmail = input.fromEmail
    if (input.replyTo !== undefined) updateData.replyTo = input.replyTo
    if (input.tags !== undefined) updateData.tags = input.tags
    if (input.notes !== undefined) updateData.notes = input.notes

    const updated = await this.prisma.scenario.update({
      where: { id },
      data: updateData,
      include: {
        emailTemplate: true,
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    })

    return updated
  }

  /**
   * Supprimer un scénario
   */
  async deleteScenario(id: string) {
    const scenario = await this.prisma.scenario.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!scenario) {
      throw new Error('Scénario non trouvé')
    }

    // Ne peut supprimer que les scénarios inactifs
    if (scenario.status === 'ACTIF') {
      throw new Error('Les scénarios actifs doivent d\'abord être désactivés avant suppression')
    }

    await this.prisma.scenario.delete({
      where: { id },
    })

    return { success: true }
  }

  /**
   * Activer un scénario (INACTIF → ACTIF)
   */
  async activateScenario(id: string) {
    const scenario = await this.prisma.scenario.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      include: {
        emailTemplate: true,
      },
    })

    if (!scenario) {
      throw new Error('Scénario non trouvé')
    }

    if (scenario.status === 'ACTIF') {
      throw new Error('Le scénario est déjà actif')
    }

    // Vérifications avant activation
    if (!scenario.emailTemplateId || !scenario.emailTemplate) {
      throw new Error('Un template email est requis pour activer le scénario')
    }

    if (!scenario.emailTemplate.isActive) {
      throw new Error('Le template email associé est inactif')
    }

    const updated = await this.prisma.scenario.update({
      where: { id },
      data: {
        status: 'ACTIF',
      },
      include: {
        emailTemplate: true,
        createdByUser: true,
      },
    })

    return updated
  }

  /**
   * Désactiver un scénario (ACTIF → INACTIF)
   */
  async deactivateScenario(id: string) {
    const scenario = await this.prisma.scenario.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!scenario) {
      throw new Error('Scénario non trouvé')
    }

    if (scenario.status !== 'ACTIF') {
      throw new Error('Seuls les scénarios actifs peuvent être désactivés')
    }

    const updated = await this.prisma.scenario.update({
      where: { id },
      data: {
        status: 'INACTIF',
      },
      include: {
        emailTemplate: true,
        createdByUser: true,
      },
    })

    return updated
  }

  /**
   * Archiver un scénario (INACTIF → ARCHIVE)
   */
  async archiveScenario(id: string) {
    const scenario = await this.prisma.scenario.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!scenario) {
      throw new Error('Scénario non trouvé')
    }

    if (scenario.status === 'ACTIF') {
      throw new Error('Les scénarios actifs doivent être désactivés avant archivage')
    }

    const updated = await this.prisma.scenario.update({
      where: { id },
      data: {
        status: 'ARCHIVE',
      },
      include: {
        emailTemplate: true,
        createdByUser: true,
      },
    })

    return updated
  }

  /**
   * Exécuter manuellement un scénario pour un client spécifique
   */
  async executeScenarioForClient(scenarioId: string, clientId: string) {
    const scenario = await this.prisma.scenario.findFirst({
      where: {
        id: scenarioId,
        cabinetId: this.cabinetId,
      },
      include: {
        emailTemplate: true,
      },
    })

    if (!scenario) {
      throw new Error('Scénario non trouvé')
    }

    if (scenario.status !== 'ACTIF') {
      throw new Error('Seuls les scénarios actifs peuvent être exécutés')
    }

    // Vérifier client
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: this.cabinetId,
        status: 'ACTIF',
        email: {
          not: null,
        },
      },
    })

    if (!client || !client.email) {
      throw new Error('Client non trouvé, inactif ou sans email')
    }

    // Vérifier conditions du scénario (si définies)
    // TODO: Implémenter évaluation conditions JSON

    // Créer EmailMessage
    const message = await this.prisma.emailMessage.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: client.id,
        toEmail: client.email,
        toName: `${client.firstName} ${client.lastName}`,
        fromEmail: scenario.fromEmail || 'noreply@example.com',
        fromName: scenario.fromName || 'Mon Cabinet',
        replyTo: scenario.replyTo,
        subject: scenario.emailTemplate!.subject,
        htmlContent: scenario.emailTemplate!.htmlContent,
        plainContent: scenario.emailTemplate!.plainContent || '',
        scenarioId: scenario.id,
        emailTemplateId: scenario.emailTemplateId!,
        status: 'EN_ATTENTE',
        scheduledAt: scenario.delayHours > 0
          ? new Date(Date.now() + scenario.delayHours * 60 * 60 * 1000)
          : new Date(),
      },
    })

    // Mettre à jour compteur exécutions
    await this.prisma.scenario.update({
      where: { id: scenarioId },
      data: {
        executionCount: {
          increment: 1,
        },
        lastExecutedAt: new Date(),
      },
    })

    return message
  }

  /**
   * Exécuter un scénario pour plusieurs clients
   */
  async executeScenarioForClients(scenarioId: string, clientIds: string[]) {
    const results = []

    for (const clientId of clientIds) {
      try {
        const message = await this.executeScenarioForClient(scenarioId, clientId)
        results.push({
          clientId,
          success: true,
          messageId: message.id,
        })
      } catch (error) {
        results.push({
          clientId,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        })
      }
    }

    return {
      total: clientIds.length,
      success: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    }
  }

  /**
   * Obtenir les statistiques globales des scénarios
   */
  async getScenarioStats(filters: Partial<ScenarioFilters> = {}) {
    const where: any = {
      cabinetId: this.cabinetId,
    }

    if (filters.trigger) where.trigger = filters.trigger
    if (filters.createdBy) where.createdBy = filters.createdBy

    const [
      total,
      actif,
      inactif,
      archive,
      aggregates,
    ] = await Promise.all([
      this.prisma.scenario.count({ where }),
      this.prisma.scenario.count({ where: { ...where, status: 'ACTIF' } }),
      this.prisma.scenario.count({ where: { ...where, status: 'INACTIF' } }),
      this.prisma.scenario.count({ where: { ...where, status: 'ARCHIVE' } }),
      this.prisma.scenario.aggregate({
        where,
        _sum: {
          executionCount: true,
        },
      }),
    ])

    return {
      total,
      byStatus: {
        actif,
        inactif,
        archive,
      },
      totalExecutions: aggregates._sum.executionCount || 0,
    }
  }

  /**
   * Exécuter les scénarios automatiques (appelé par CRON)
   * Recherche les événements qui déclenchent les scénarios actifs
   */
  async processAutomaticScenarios() {
    const scenarios = await this.prisma.scenario.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: 'ACTIF',
      },
      include: {
        emailTemplate: true,
      },
    })

    const results = []

    for (const scenario of scenarios) {
      try {
        // Traiter selon le trigger
        switch (scenario.trigger) {
          case 'NOUVEAU_CLIENT':
            // Récupérer clients créés récemment (ex: dernières 24h)
            // et qui n'ont pas encore reçu l'email de bienvenue
            break

          case 'ANNIVERSAIRE':
            // Récupérer clients dont c'est l'anniversaire aujourd'hui
            break

          case 'DATE_ECHEANCE':
            // Récupérer clients avec échéance proche
            break

          case 'INACTIVITE':
            // Récupérer clients inactifs depuis X jours
            break

          // MANUEL et WEBHOOK ne sont pas traités automatiquement
          case 'MANUEL':
          case 'WEBHOOK':
          default:
            continue
        }

        // TODO: Implémenter logique de détection pour chaque trigger
        // et créer les EmailMessage correspondants

      } catch (error) {
        results.push({
          scenarioId: scenario.id,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur inconnue',
        })
      }
    }

    return {
      processed: results.length,
      results,
    }
  }
}
