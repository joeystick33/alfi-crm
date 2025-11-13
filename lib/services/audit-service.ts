import { getPrismaClient, setRLSContext } from '@/lib/prisma'
import { AuditAction } from '@prisma/client'

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
    changes?: any
    ipAddress?: string
    userAgent?: string
  }) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

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
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {}

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
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
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
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

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
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

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
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {}

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = startDate
      }
      if (endDate) {
        where.createdAt.lte = endDate
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
      this.prisma.auditLog.count({ where: { ...where, action: 'CREATE' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'UPDATE' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'DELETE' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'VIEW' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'EXPORT' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'SHARE' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'SIGN' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'APPROVE' } }),
      this.prisma.auditLog.count({ where: { ...where, action: 'REJECT' } }),
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
      byEntityType: byEntityType.map((item) => ({
        entityType: item.entityType,
        count: item._count,
      })),
      topUsers: topUsers.map((item) => ({
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
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const where: any = {}

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
      where.createdAt = {}
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate
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
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

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
