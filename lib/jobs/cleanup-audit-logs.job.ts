// FILE: lib/jobs/cleanup-audit-logs.job.ts

import { prisma } from '@/lib/prisma'

// ===========================================
// CLEANUP AUDIT LOGS JOB
// ===========================================

export interface CleanupAuditLogsJobResult {
  success: boolean
  message: string
  stats: {
    deletedLogs: number
    deletedNotifications: number
    deletedSessions: number
  }
  executionTime: number
}

/**
 * Job CRON pour nettoyer les données anciennes
 * - Supprime les audit logs > 12 mois
 * - Supprime les notifications lues > 3 mois
 * - Supprime les sessions expirées
 * 
 * Exécuté hebdomadairement le dimanche à 4h du matin
 */
export async function runCleanupAuditLogsJob(): Promise<CleanupAuditLogsJobResult> {
  const startTime = Date.now()

  console.log('🚀 Starting Cleanup Audit Logs Job...')

  let deletedLogs = 0
  let deletedNotifications = 0
  let deletedSessions = 0

  try {
    const now = new Date()

    // 1. Supprimer les audit logs > 12 mois
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

    const logsResult = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: twelveMonthsAgo },
      },
    })
    deletedLogs = logsResult.count

    console.log(`📋 Deleted audit logs: ${deletedLogs}`)

    // 2. Supprimer les notifications lues > 3 mois
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const notificationsResult = await prisma.notification.deleteMany({
      where: {
        isRead: true,
        readAt: { lt: threeMonthsAgo },
      },
    })
    deletedNotifications = notificationsResult.count

    console.log(`🔔 Deleted notifications: ${deletedNotifications}`)

    // 3. Supprimer les sessions expirées
    const sessionsResult = await prisma.userSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { isActive: false },
        ],
      },
    })
    deletedSessions = sessionsResult.count

    console.log(`🔐 Deleted sessions: ${deletedSessions}`)

    const executionTime = Date.now() - startTime

    console.log(`✅ Cleanup Audit Logs Job completed in ${executionTime}ms`)

    return {
      success: true,
      message: `Job completed. ${deletedLogs} logs, ${deletedNotifications} notifications, ${deletedSessions} sessions deleted.`,
      stats: {
        deletedLogs,
        deletedNotifications,
        deletedSessions,
      },
      executionTime,
    }
  } catch (error) {
    const executionTime = Date.now() - startTime

    console.error('❌ Cleanup Audit Logs Job failed:', error)

    return {
      success: false,
      message: `Job failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      stats: {
        deletedLogs,
        deletedNotifications,
        deletedSessions,
      },
      executionTime,
    }
  }
}
