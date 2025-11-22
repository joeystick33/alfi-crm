import { getPrismaClient } from '@/lib/prisma'
import { ObjectifType, ObjectifStatus, ObjectifPriority } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

/**
 * Objectif Service
 * 
 * Manages objectif (goal) entities with tenant isolation.
 * Provides CRUD operations, progress tracking, and monthly contribution recommendations.
 * 
 * Features:
 * - Goal lifecycle management (active, achieved, on hold, cancelled)
 * - Progress calculation based on current vs target amount
 * - Monthly contribution recommendations
 * - Timeline event creation for goal achievements
 * - Delayed goal detection
 * 
 * @example
 * const service = new ObjectifService(cabinetId, userId, isSuperAdmin)
 * const objectif = await service.createObjectif({
 *   clientId: 'client-123',
 *   type: 'RETIREMENT',
 *   name: 'Retirement Fund',
 *   targetAmount: 500000,
 *   targetDate: new Date('2040-01-01')
 * })
 */
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
   * Converts Decimal or numeric values to JavaScript number
   * 
   * Handles Prisma Decimal types for amount fields and converts them to native
   * JavaScript numbers for API responses.
   * 
   * @param value - The value to convert (Decimal, number, or null/undefined)
   * @returns The numeric value or null
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
   * Formats an objectif entity with nested relations
   * 
   * Converts Prisma raw data to clean API response format:
   * - Converts Decimal amount fields to numbers
   * - Formats nested client relation
   * - Removes Prisma internal metadata
   * 
   * @param objectif - Raw objectif entity from Prisma
   * @returns Formatted objectif object or null
   */
  private formatObjectif(objectif: any): any {
    if (!objectif) {
      return null
    }

    return {
      ...objectif,
      targetAmount: this.toNumber(objectif.targetAmount),
      currentAmount: this.toNumber(objectif.currentAmount),
      monthlyContribution: this.toNumber(objectif.monthlyContribution),
      client: objectif.client ? {
        ...objectif.client,
      } : undefined,
    }
  }

  /**
   * Creates a new objectif
   * 
   * Validates client existence, creates the objectif with initial status ACTIVE,
   * and generates a timeline event.
   * 
   * @param data - Objectif creation data including client ID, type, name, target amount and date
   * @returns Formatted objectif entity
   * @throws Error if client not found
   */
  async createObjectif(data: {
    clientId: string
    type: ObjectifType
    name: string
    description?: string
    targetAmount: number
    currentAmount?: number
    targetDate: Date
    priority?: ObjectifPriority
    monthlyContribution?: number
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

    // Créer l'objectif
    const objectif = await this.prisma.objectif.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        type: data.type,
        name: data.name,
        description: data.description,
        targetAmount: new Decimal(data.targetAmount),
        currentAmount: data.currentAmount !== undefined ? new Decimal(data.currentAmount) : new Decimal(0),
        targetDate: data.targetDate,
        priority: data.priority || 'MEDIUM',
        monthlyContribution: data.monthlyContribution !== undefined ? new Decimal(data.monthlyContribution) : undefined,
        status: 'ACTIVE',
        progress: 0,
      },
    })

    // Créer un événement timeline
    await this.prisma.timelineEvent.create({
      data: {
        cabinetId: this.cabinetId,
        clientId: data.clientId,
        type: 'OTHER',
        title: 'Objectif créé',
        description: `Objectif "${data.name}" créé`,
        relatedEntityType: 'Objectif',
        relatedEntityId: objectif.id,
        createdBy: this.userId,
      },
    })

    // Return formatted entity
    return this.getObjectifById(objectif.id)
  }

  /**
   * Retrieves objectifs with filtering
   * 
   * Supports filtering by client, type, status, priority, date ranges, amount ranges,
   * and search terms. Results ordered by priority and target date.
   * 
   * @param filters - Optional filter criteria
   * @returns Array of formatted objectif entities
   */
  async getObjectifs(filters?: {
    clientId?: string
    type?: ObjectifType
    status?: ObjectifStatus
    priority?: ObjectifPriority
    targetDateAfter?: Date
    targetDateBefore?: Date
    targetAmountMin?: number
    targetAmountMax?: number
    search?: string
  }) {
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

    if (filters?.targetDateAfter || filters?.targetDateBefore) {
      where.targetDate = {}
      if (filters.targetDateAfter) {
        where.targetDate.gte = filters.targetDateAfter
      }
      if (filters.targetDateBefore) {
        where.targetDate.lte = filters.targetDateBefore
      }
    }

    if (filters?.targetAmountMin !== undefined || filters?.targetAmountMax !== undefined) {
      where.targetAmount = {}
      if (filters.targetAmountMin !== undefined) {
        where.targetAmount.gte = new Decimal(filters.targetAmountMin)
      }
      if (filters.targetAmountMax !== undefined) {
        where.targetAmount.lte = new Decimal(filters.targetAmountMax)
      }
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ]
    }

    const objectifs = await this.prisma.objectif.findMany({
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

    return objectifs.map(objectif => this.formatObjectif(objectif))
  }

  /**
   * Retrieves an objectif by ID
   * 
   * Includes client information. Enforces tenant isolation.
   * 
   * @param id - Objectif ID
   * @returns Formatted objectif entity or null if not found
   */
  async getObjectifById(id: string) {
    const objectif = await this.prisma.objectif.findFirst({
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
      },
    })

    return this.formatObjectif(objectif)
  }

  /**
   * Updates an objectif
   * 
   * Supports partial updates of any objectif field.
   * 
   * @param id - Objectif ID
   * @param data - Partial update data
   * @returns Formatted updated objectif entity
   * @throws Error if objectif not found or access denied
   */
  async updateObjectif(
    id: string,
    data: {
      name?: string
      description?: string
      type?: ObjectifType
      targetAmount?: number
      currentAmount?: number
      targetDate?: Date
      priority?: ObjectifPriority
      monthlyContribution?: number
      status?: ObjectifStatus
    }
  ) {
    const updateData: any = {}
    
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.type !== undefined) updateData.type = data.type
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.status !== undefined) updateData.status = data.status
    if (data.targetDate !== undefined) updateData.targetDate = data.targetDate
    
    if (data.targetAmount !== undefined) {
      updateData.targetAmount = new Decimal(data.targetAmount)
    }
    if (data.currentAmount !== undefined) {
      updateData.currentAmount = new Decimal(data.currentAmount)
    }
    if (data.monthlyContribution !== undefined) {
      updateData.monthlyContribution = new Decimal(data.monthlyContribution)
    }

    const { count } = await this.prisma.objectif.updateMany({
      where: { 
        id,
        cabinetId: this.cabinetId,
      },
      data: updateData,
    })

    if (count === 0) {
      throw new Error('Objectif not found or access denied')
    }

    return this.getObjectifById(id)
  }

  /**
   * Updates objectif progress
   * 
   * Calculates progress percentage based on current vs target amount.
   * Automatically sets status to ACHIEVED when progress reaches 100%.
   * Creates timeline event for goal achievement.
   * 
   * @param id - Objectif ID
   * @param currentAmount - Current amount saved/achieved
   * @returns Formatted updated objectif entity
   * @throws Error if objectif not found
   */
  async updateProgress(id: string, currentAmount: number) {
    const objectif = await this.prisma.objectif.findFirst({
      where: { 
        id,
        cabinetId: this.cabinetId,
      },
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
    }

    const { count } = await this.prisma.objectif.updateMany({
      where: { 
        id,
        cabinetId: this.cabinetId,
      },
      data: {
        currentAmount: new Decimal(currentAmount),
        progress,
        status,
        achievedAt: progress >= 100 ? new Date() : null,
      },
    })

    if (count === 0) {
      throw new Error('Objectif not found or access denied')
    }

    const updated = await this.getObjectifById(id)

    // Créer un événement timeline si objectif atteint
    if (progress >= 100 && (objectif.progress ?? 0) < 100) {
      await this.prisma.timelineEvent.create({
        data: {
          cabinetId: this.cabinetId,
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
   * Calculates monthly contribution recommendation
   * 
   * Determines recommended monthly contribution to reach target amount by target date.
   * Compares with current monthly contribution to assess if on track.
   * 
   * @param id - Objectif ID
   * @returns Recommendation object with remaining amount, months, and recommended monthly contribution
   * @throws Error if objectif not found
   */
  async calculateMonthlyRecommendation(id: string) {
    const objectif = await this.prisma.objectif.findFirst({
      where: { 
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (!objectif) {
      throw new Error('Objectif not found')
    }

    const targetAmount = this.toNumber(objectif.targetAmount) ?? 0
    const currentAmount = this.toNumber(objectif.currentAmount) ?? 0
    const remaining = targetAmount - currentAmount
    const today = new Date()
    const monthsRemaining = Math.max(
      1,
      Math.ceil(
        (objectif.targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)
      )
    )

    const recommendedMonthly = Math.ceil(remaining / monthsRemaining)
    const currentMonthly = this.toNumber(objectif.monthlyContribution) ?? 0

    return {
      remaining,
      monthsRemaining,
      recommendedMonthly,
      currentMonthly,
      isOnTrack: currentMonthly >= recommendedMonthly,
    }
  }

  /**
   * Deletes an objectif
   * 
   * @param id - Objectif ID
   * @returns Success indicator
   * @throws Error if objectif not found or access denied
   */
  async deleteObjectif(id: string) {
    const { count } = await this.prisma.objectif.deleteMany({
      where: { 
        id,
        cabinetId: this.cabinetId,
      },
    })

    if (count === 0) {
      throw new Error('Objectif not found or access denied')
    }

    return { success: true }
  }

  /**
   * Retrieves delayed objectifs
   * 
   * Finds active objectifs past their target date that haven't reached 100% progress.
   * Ordered by target date (oldest first).
   * 
   * @returns Array of formatted delayed objectif entities
   */
  async getDelayedObjectifs() {
    const today = new Date()

    const objectifs = await this.prisma.objectif.findMany({
      where: {
        targetDate: { lt: today },
        status: { in: ['ACTIVE'] },
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

    return objectifs.map(objectif => this.formatObjectif(objectif))
  }

  /**
   * Retrieves objectif statistics for the cabinet
   * 
   * Calculates aggregate statistics including counts by status, average progress,
   * and achievement rate.
   * 
   * @returns Statistics object with counts, rates, and averages
   */
  async getStatistics() {
    const [total, achieved, active, onHold, cancelled] = await Promise.all([
      this.prisma.objectif.count(),
      this.prisma.objectif.count({ where: { status: 'ACHIEVED' } }),
      this.prisma.objectif.count({ where: { status: 'ACTIVE' } }),
      this.prisma.objectif.count({ where: { status: 'ON_HOLD' } }),
      this.prisma.objectif.count({ where: { status: 'CANCELLED' } }),
    ])

    const avgProgress = await this.prisma.objectif.aggregate({
      _avg: { progress: true },
      where: { status: { in: ['ACTIVE'] } },
    })

    return {
      total,
      achieved,
      active,
      onHold,
      cancelled,
      avgProgress: avgProgress._avg.progress || 0,
      achievementRate: total > 0 ? Math.round((achieved / total) * 100) : 0,
    }
  }
}
