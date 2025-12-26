import { getPrismaClient } from '@/app/_common/lib/prisma'
import { AuditAction } from '@prisma/client'

// Type helper pour les clauses where Prisma avec filtres de date
interface PrismaWhereWithDates {
  cabinetId?: string
  userId?: string
  action?: string
  entityType?: string
  entityId?: string
  createdAt?: { gte?: Date; lte?: Date }
  [key: string]: unknown
}

export class AuditService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Créer un log d'audit
   */
  async createAuditLog(data: {
    action: AuditAction
    entityType: string
    entityId: string
    changes?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
  }) {
    return this.prisma.auditLog.create({
      data: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        changes: data.changes,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })
  }

  /**
   * Récupérer les logs d'audit avec filtres
   */
  async getAuditLogs(filters?: {
    userId?: string
    action?: AuditAction
    entityType?: string
    entityId?: string
    startDate?: Date
    endDate?: Date
    limit?: number
    offset?: number
  }) {
     
    const where: PrismaWhereWithDates = {}

    if (filters?.userId) {
      where.userId = filters.userId
    }

    if (filters?.action) {
      where.action = filters.action
    }

    if (filters?.entityType) {
      where.entityType = filters.entityType
    }

    if (filters?.entityId) {
      where.entityId = filters.entityId
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
        skip: filters?.offset || 0,
      }),
      this.prisma.auditLog.count({ where }),
    ])

    return {
      logs,
      total,
      limit: filters?.limit || 50,
      offset: filters?.offset || 0,
    }
  }

  /**
   * Récupérer l'historique d'une entité spécifique
   */
  async getEntityHistory(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Récupérer les actions d'un utilisateur
   */
  async getUserActions(userId: string, limit: number = 50) {
    return this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Statistiques d'audit
   */
  async getStatistics(startDate?: Date, endDate?: Date) {
     
    const where: PrismaWhereWithDates = {}

    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: startDate } : {}),
        ...(endDate ? { lte: endDate } : {}),
      }
    }

    const [
      total,
      creates,
      updates,
      deletes,
      views,
      exports,
      shares,
      signs,
      approves,
      rejects,
    ] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.count({ where: { ...where, action: 'CREATION' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'MODIFICATION' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'SUPPRESSION' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'CONSULTATION' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'EXPORT' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'PARTAGE' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'SIGNATURE' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'APPROBATION' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'REJET' } }),
    ])

    // Actions par type d'entité
    const byEntityType = await this.prisma.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: true,
      orderBy: {
        _count: {
          entityType: 'desc',
        },
      },
      take: 10,
    })

    // Utilisateurs les plus actifs
    const topUsers = await this.prisma.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: true,
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    })

    return {
      total,
      byAction: {
        creates,
        updates,
        deletes,
        views,
        exports,
        shares,
        signs,
        approves,
        rejects,
      },
      byEntityType: byEntityType.map((item: { entityType: string; _count: number }) => ({
        entityType: item.entityType,
        count: item._count,
      })),
      topUsers: topUsers.map((item: { userId: string; _count: number }) => ({
        userId: item.userId,
        count: item._count,
      })),
    }
  }

  /**
   * Exporter les logs d'audit
   */
  async exportAuditLogs(filters?: {
    startDate?: Date
    endDate?: Date
    userId?: string
    action?: AuditAction
    entityType?: string
  }) {
     
    const where: PrismaWhereWithDates = {}

    if (filters?.userId) {
      where.userId = filters.userId
    }

    if (filters?.action) {
      where.action = filters.action
    }

    if (filters?.entityType) {
      where.entityType = filters.entityType
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {
        ...(filters.startDate ? { gte: filters.startDate } : {}),
        ...(filters.endDate ? { lte: filters.endDate } : {}),
      }
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return logs
  }

  /**
   * Nettoyer les anciens logs d'audit (pour maintenance)
   */
  async cleanOldLogs(olderThanDays: number = 365) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    })

    return {
      deleted: result.count,
      cutoffDate,
    }
  }
}
