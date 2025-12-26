 
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { ProjetType, ProjetStatus } from '@prisma/client'
import type { Prisma } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import { PatrimoineService } from './patrimoine-service'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Projet Service
 * 
 * Manages projet (project) entities with tenant isolation.
 * Provides CRUD operations, progress tracking, budget analysis, and patrimoine integration.
 * 
 * Features:
 * - Project lifecycle management (planned, in progress, completed, cancelled, on hold)
 * - Budget tracking (estimated vs actual)
 * - Progress calculation from tasks
 * - Timeline event creation for status changes
 * - Automatic patrimoine recalculation when budgets change
 * - Delayed project detection
 * 
 * @example
 * const service = new ProjetService(cabinetId, userId, userRole, isSuperAdmin)
 * const projet = await service.createProjet({
 *   clientId: 'client-123',
 *   type: 'INVESTMENT',
 *   name: 'Portfolio Diversification',
 *   estimatedBudget: 50000
 * })
 */
export class ProjetService {
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
   * 
   * Handles Prisma Decimal types for budget fields and converts them to native
   * JavaScript numbers for API responses.
   * 
   * @param value - The value to convert (Decimal, number, or null/undefined)
   * @returns The numeric value or null
   */
  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null
    }

    if (value instanceof Decimal) {
      return value.toNumber()
    }

    if (isRecord(value) && typeof value.toNumber === 'function') {
      const n = (value.toNumber as () => unknown)()
      return typeof n === 'number' && Number.isFinite(n) ? n : null
    }

    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }

  /**
   * Formats a projet entity with nested relations
   * 
   * Converts Prisma raw data to clean API response format:
   * - Converts Decimal budget fields to numbers
   * - Formats nested client, taches, and documents relations
   * - Removes Prisma internal metadata
   * 
   * @param projet - Raw projet entity from Prisma
   * @returns Formatted projet object or null
   */
  private formatProjet(projet: Record<string, unknown> | null): Record<string, unknown> | null {
    if (!projet) {
      return null
    }

    const client = isRecord(projet.client) ? projet.client : null
    const taches = Array.isArray(projet.taches) ? (projet.taches as unknown[]) : undefined
    const documents = Array.isArray(projet.documents) ? (projet.documents as unknown[]) : undefined

    return {
      ...projet,
      estimatedBudget: this.toNumber(projet.estimatedBudget),
      actualBudget: this.toNumber(projet.actualBudget),
      client: client
        ? {
            id: typeof client.id === 'string' ? client.id : '',
            firstName: typeof client.firstName === 'string' ? client.firstName : '',
            lastName: typeof client.lastName === 'string' ? client.lastName : '',
            email: typeof client.email === 'string' ? client.email : null,
          }
        : undefined,
      taches: taches?.map((tache) => {
        const t = isRecord(tache) ? tache : {}
        const assignedTo = isRecord(t.assignedTo) ? t.assignedTo : null
        return {
          ...t,
          assignedTo: assignedTo
            ? {
                id: typeof assignedTo.id === 'string' ? assignedTo.id : '',
                firstName: typeof assignedTo.firstName === 'string' ? assignedTo.firstName : '',
                lastName: typeof assignedTo.lastName === 'string' ? assignedTo.lastName : '',
              }
            : undefined,
        }
      }),
      documents: documents?.map((pd) => {
        const p = isRecord(pd) ? pd : {}
        const document = isRecord(p.document) ? p.document : null
        return {
          ...p,
          document: document
            ? {
                id: typeof document.id === 'string' ? document.id : '',
                name: typeof document.name === 'string' ? document.name : '',
                type: typeof document.type === 'string' ? document.type : '',
                fileUrl: typeof document.fileUrl === 'string' ? document.fileUrl : '',
              }
            : undefined,
        }
      }),
    }
  }

  /**
   * Creates a new projet
   * 
   * Validates client existence, creates the projet, generates a timeline event,
   * and triggers patrimoine recalculation if budget is specified.
   * 
   * @param data - Projet creation data including client ID, type, name, and optional budget
   * @returns Formatted projet entity with all relations
   * @throws Error if client not found
   */
  async createProjet(data: {
    clientId: string
    type: ProjetType
    name: string
    description?: string
    estimatedBudget?: number
    actualBudget?: number
    startDate?: Date
    targetDate?: Date
    endDate?: Date
    status?: ProjetStatus
    progress?: number
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

    // Créer le projet
    const projet = await this.prisma.projet.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        type: data.type,
        name: data.name,
        description: data.description,
        estimatedBudget: data.estimatedBudget !== undefined ? new Decimal(data.estimatedBudget) : undefined,
        actualBudget: data.actualBudget !== undefined ? new Decimal(data.actualBudget) : new Decimal(0),
        startDate: data.startDate,
        targetDate: data.targetDate,
        endDate: data.endDate,
        status: data.status || 'PLANIFIE',
        progress: data.progress || 0,
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinet: { connect: { id: this.cabinetId } },
        clientId: data.clientId,
        type: 'AUTRE',
        title: 'Projet créé',
        description: `Projet "${data.name}" créé`,
        relatedEntityType: 'Projet',
        relatedEntityId: projet.id,
        createdBy: this.userId,
      },
    })

    // Trigger patrimoine recalculation if projet has financial impact
    if (data.estimatedBudget !== undefined || data.actualBudget !== undefined) {
      const patrimoineService = new PatrimoineService(
        this.cabinetId,
        this.userId,
        this.userRole || 'ADVISOR',
        this.isSuperAdmin
      )
      await patrimoineService.calculateAndUpdateClientWealth(data.clientId)
    }

    // Return formatted projet
    return this.getProjetById(projet.id)
  }

  /**
   * Retrieves projets with filtering
   * 
   * Supports filtering by client, type, status, search terms, date ranges,
   * and budget ranges. Results include task and document counts.
   * 
   * @param filters - Optional filter criteria
   * @returns Array of formatted projet entities
   */
  async getProjets(filters?: {
    clientId?: string
    type?: ProjetType
    status?: ProjetStatus
    search?: string
    startDateAfter?: Date
    startDateBefore?: Date
    targetDateAfter?: Date
    targetDateBefore?: Date
    estimatedBudgetMin?: number
    estimatedBudgetMax?: number
    actualBudgetMin?: number
    actualBudgetMax?: number
  }) {
    const where: Prisma.ProjetWhereInput = {
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

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    // Date range filters
    if (filters?.startDateAfter || filters?.startDateBefore) {
      const startDate: Prisma.DateTimeFilter = {}
      if (filters.startDateAfter) {
        startDate.gte = filters.startDateAfter
      }
      if (filters.startDateBefore) {
        startDate.lte = filters.startDateBefore
      }
      where.startDate = startDate
    }

    if (filters?.targetDateAfter || filters?.targetDateBefore) {
      const targetDate: Prisma.DateTimeFilter = {}
      if (filters.targetDateAfter) {
        targetDate.gte = filters.targetDateAfter
      }
      if (filters.targetDateBefore) {
        targetDate.lte = filters.targetDateBefore
      }
      where.targetDate = targetDate
    }

    // Budget range filters
    if (filters?.estimatedBudgetMin !== undefined || filters?.estimatedBudgetMax !== undefined) {
      const estimatedBudget: Prisma.DecimalFilter = {}
      if (filters.estimatedBudgetMin !== undefined) {
        estimatedBudget.gte = new Decimal(filters.estimatedBudgetMin)
      }
      if (filters.estimatedBudgetMax !== undefined) {
        estimatedBudget.lte = new Decimal(filters.estimatedBudgetMax)
      }
      where.estimatedBudget = estimatedBudget
    }

    if (filters?.actualBudgetMin !== undefined || filters?.actualBudgetMax !== undefined) {
      const actualBudget: Prisma.DecimalFilter = {}
      if (filters.actualBudgetMin !== undefined) {
        actualBudget.gte = new Decimal(filters.actualBudgetMin)
      }
      if (filters.actualBudgetMax !== undefined) {
        actualBudget.lte = new Decimal(filters.actualBudgetMax)
      }
      where.actualBudget = actualBudget
    }

    const projets = await this.prisma.projet.findMany({
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
        _count: {
          select: {
            taches: true,
            documents: true,
          },
        },
      },
      orderBy: [{ startDate: 'desc' }],
    })

    return projets.map(projet => this.formatProjet(projet))
  }

  /**
   * Retrieves a projet by ID
   * 
   * Optionally includes full nested relations (taches, documents).
   * Enforces tenant isolation.
   * 
   * @param id - Projet ID
   * @param includeRelations - Whether to include full nested relations (default: false)
   * @returns Formatted projet entity or null if not found
   */
  async getProjetById(id: string, includeRelations: boolean = false) {
    const projet = await this.prisma.projet.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      include: includeRelations
        ? {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            taches: {
              include: {
                assignedTo: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
              orderBy: { dueDate: 'asc' },
            },
            documents: {
              include: {
                document: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
                    fileUrl: true,
                    uploadedAt: true,
                  },
                },
              },
            },
          }
        : {
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

    return this.formatProjet(projet)
  }

  /**
   * Updates a projet
   * 
   * Creates timeline events for status changes. Automatically sets endDate and
   * progress to 100 when status changes to COMPLETED. Triggers patrimoine
   * recalculation if budget fields change.
   * 
   * @param id - Projet ID
   * @param data - Partial update data
   * @returns Formatted updated projet entity with relations
   * @throws Error if projet not found or access denied
   */
  async updateProjet(
    id: string,
    data: {
      name?: string
      description?: string
      type?: ProjetType
      estimatedBudget?: number
      actualBudget?: number
      startDate?: Date
      targetDate?: Date
      endDate?: Date
      status?: ProjetStatus
      progress?: number
    }
  ) {
    const projet = await this.prisma.projet.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      include: {
        client: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!projet) {
      throw new Error('Projet not found')
    }

    // Track if status is changing
    const statusChanging = data.status !== undefined && data.status !== projet.status
    const statusChangingToCompleted = data.status === 'TERMINE' && projet.status !== 'TERMINE'

    // Prepare update data with Decimal conversions
    const updateData: Prisma.ProjetUpdateManyMutationInput = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type
    if (data.startDate !== undefined) updateData.startDate = data.startDate
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate
    if (data.endDate !== undefined) updateData.endDate = data.endDate
    if (data.status !== undefined) updateData.status = data.status
    if (data.progress !== undefined) updateData.progress = data.progress

    if (data.estimatedBudget !== undefined) {
      updateData.estimatedBudget = new Decimal(data.estimatedBudget)
    }
    if (data.actualBudget !== undefined) {
      updateData.actualBudget = new Decimal(data.actualBudget)
    }

    // Si le statut change à COMPLETED, mettre à jour endDate et progress
    if (statusChangingToCompleted) {
      updateData.endDate = new Date()
      updateData.progress = 100
    }

    const { count } = await this.prisma.projet.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: updateData,
    })

    if (count === 0) {
      throw new Error('Projet not found or access denied')
    }

    // Create timeline event if status changed
    if (statusChanging) {
      const statusLabels: Record<ProjetStatus, string> = {
        PLANIFIE: 'planifié',
        EN_COURS: 'en cours',
        TERMINE: 'terminé',
        ANNULE: 'annulé',
        EN_PAUSE: 'en pause',
      }

      await this.prisma.timelineEvent.create({
        data: {
          cabinet: { connect: { id: this.cabinetId } },
          clientId: projet.client.id,
          type: 'AUTRE',
          title: `Projet ${statusLabels[data.status!]}`,
          description: `Projet "${projet.name}" passé à l'état ${statusLabels[data.status!]}`,
          relatedEntityType: 'Projet',
          relatedEntityId: projet.id,
          createdBy: this.userId,
        },
      })
    }

    // Trigger patrimoine recalculation if budget changed
    if (data.estimatedBudget !== undefined || data.actualBudget !== undefined) {
      const patrimoineService = new PatrimoineService(
        this.cabinetId,
        this.userId,
        this.userRole || 'ADVISOR',
        this.isSuperAdmin
      )
      await patrimoineService.calculateAndUpdateClientWealth(projet.client.id)
    }

    return this.getProjetById(id, true)
  }

  /**
   * Updates projet progress
   * 
   * Validates progress is between 0-100. Automatically updates status based on
   * progress value. Creates timeline event when projet reaches 100% completion.
   * 
   * @param id - Projet ID
   * @param progress - Progress percentage (0-100)
   * @returns Formatted updated projet entity with relations
   * @throws Error if projet not found
   */
  async updateProgress(id: string, progress: number) {
    const projet = await this.prisma.projet.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!projet) {
      throw new Error('Projet not found')
    }

    // Valider la progression (0-100)
    const validProgress = Math.max(0, Math.min(100, progress))

    // Déterminer le statut
    let status = projet.status
    if (validProgress === 0 && projet.status === 'PLANIFIE') {
      status = 'PLANIFIE'
    } else if (validProgress > 0 && validProgress < 100) {
      status = 'EN_COURS'
    } else if (validProgress === 100) {
      status = 'TERMINE'
    }

    const { count } = await this.prisma.projet.updateMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      data: {
        progress: validProgress,
        status,
        endDate: validProgress === 100 ? new Date() : projet.endDate,
      },
    })

    if (count === 0) {
      throw new Error('Projet not found or access denied')
    }

    // Créer un événement timeline si projet terminé
    if (validProgress === 100 && projet.progress < 100) {
      await this.prisma.timelineEvent.create({
        data: {
          cabinet: { connect: { id: this.cabinetId } },
          clientId: projet.clientId,
          type: 'AUTRE',
          title: 'Projet terminé',
          description: `Projet "${projet.name}" terminé`,
          relatedEntityType: 'Projet',
          relatedEntityId: projet.id,
          createdBy: this.userId,
        },
      })
    }

    return this.getProjetById(id, true)
  }

  /**
   * Calculates progress automatically based on tasks
   * 
   * Computes progress as percentage of completed tasks. Returns unchanged
   * projet if no tasks exist.
   * 
   * @param id - Projet ID
   * @returns Formatted updated projet entity
   * @throws Error if projet not found
   */
  async calculateProgressFromTasks(id: string) {
    const projet = await this.prisma.projet.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
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

    const completedTasks = projet.taches.filter((t) => t.status === 'TERMINE').length
    const totalTasks = projet.taches.length
    const progress = Math.round((completedTasks / totalTasks) * 100)

    return this.updateProgress(id, progress)
  }

  /**
   * Deletes a projet
   * 
   * Triggers patrimoine recalculation if projet had financial impact.
   * Cascading deletes are handled by database constraints.
   * 
   * @param id - Projet ID
   * @returns Success indicator
   * @throws Error if projet not found or access denied
   */
  async deleteProjet(id: string) {
    // Get projet first to access clientId for patrimoine recalculation
    const projet = await this.prisma.projet.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
      select: {
        clientId: true,
        estimatedBudget: true,
        actualBudget: true,
      },
    })

    if (!projet) {
      throw new Error('Projet not found or access denied')
    }

    const { count } = await this.prisma.projet.deleteMany({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (count === 0) {
      throw new Error('Projet not found or access denied')
    }

    // Trigger patrimoine recalculation if projet had financial impact
    if (projet.estimatedBudget || projet.actualBudget) {
      const patrimoineService = new PatrimoineService(
        this.cabinetId,
        this.userId,
        this.userRole || 'ADVISOR',
        this.isSuperAdmin
      )
      await patrimoineService.calculateAndUpdateClientWealth(projet.clientId)
    }

    return { success: true }
  }

  /**
   * Retrieves delayed projets
   * 
   * Finds projets past their target date that are still in progress or planned
   * and not yet completed. Ordered by target date (oldest first).
   * 
   * @returns Array of formatted delayed projet entities
   */
  async getDelayedProjets() {
    const today = new Date()

    const projets = await this.prisma.projet.findMany({
      where: {
        cabinetId: this.cabinetId,
        targetDate: { lt: today },
        status: { in: ['PLANIFIE', 'EN_COURS'] },
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

    return projets.map(projet => this.formatProjet(projet))
  }

  /**
   * Analyzes projet budget
   * 
   * Compares estimated vs actual budget, calculates remaining budget,
   * and determines if projet is over budget.
   * 
   * @param id - Projet ID
   * @returns Budget analysis object with usage percentages and status
   * @throws Error if projet not found
   */
  async getBudgetAnalysis(id: string) {
    const projet = await this.prisma.projet.findFirst({
      where: {
        id,
        cabinetId: this.cabinetId,
      },
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
   * Retrieves projet statistics for the cabinet
   * 
   * Calculates aggregate statistics including counts by status, average progress,
   * completion rate, and total budgets.
   * 
   * @returns Statistics object with counts, rates, and budget totals
   */
  async getStatistics() {
    const [total, planned, inProgress, completed, onHold, cancelled] = await Promise.all([
      this.prisma.projet.count({ where: { cabinetId: this.cabinetId } }),
      this.prisma.projet.count({ where: { cabinetId: this.cabinetId, status: 'PLANIFIE' } }),
      this.prisma.projet.count({ where: { cabinetId: this.cabinetId, status: 'EN_COURS' } }),
      this.prisma.projet.count({ where: { cabinetId: this.cabinetId, status: 'TERMINE' } }),
      this.prisma.projet.count({ where: { cabinetId: this.cabinetId, status: 'EN_PAUSE' } }),
      this.prisma.projet.count({ where: { cabinetId: this.cabinetId, status: 'ANNULE' } }),
    ])

    const avgProgress = await this.prisma.projet.aggregate({
      _avg: { progress: true },
      where: { cabinetId: this.cabinetId, status: { in: ['EN_COURS'] } },
    })

    const budgetStats = await this.prisma.projet.aggregate({
      _sum: {
        estimatedBudget: true,
        actualBudget: true,
      },
      where: { cabinetId: this.cabinetId },
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
