// FILE: lib/queues/workers/cleanup.worker.ts

import { Worker, Job } from 'bullmq'
import { QUEUE_NAMES } from '../index'
import { CleanupJobData, AuditLogJobData, JobResult } from '../types'
import { prisma } from '@/lib/prisma'

// ===========================================
// CONFIGURATION
// ===========================================

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
}

// ===========================================
// CLEANUP WORKER
// ===========================================

export const cleanupWorker = new Worker<CleanupJobData, JobResult>(
  QUEUE_NAMES.CLEANUP,
  async (job: Job<CleanupJobData>) => {
    const { type, olderThanDays = 90, cabinetId } = job.data

    console.log(`[Worker] Processing cleanup job: ${job.id}`, { type, olderThanDays })

    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

      const stats = {
        processed: 0,
        succeeded: 0,
        failed: 0,
        skipped: 0,
      }

      const results: Record<string, number> = {}

      // Cleanup basé sur le type
      const typesToClean = type === 'all' 
        ? ['audit_logs', 'notifications', 'sessions', 'snapshots', 'exports']
        : [type]

      for (const cleanupType of typesToClean) {
        await job.updateProgress({
          percentage: Math.round((typesToClean.indexOf(cleanupType) / typesToClean.length) * 100),
          stage: `Cleaning ${cleanupType}...`,
        })

        try {
          switch (cleanupType) {
            case 'audit_logs':
              const auditResult = await prisma.auditLog.deleteMany({
                where: {
                  createdAt: { lt: cutoffDate },
                  ...(cabinetId ? { cabinetId } : {}),
                },
              })
              results.audit_logs = auditResult.count
              stats.succeeded += auditResult.count
              break

            case 'notifications':
              const notifResult = await prisma.notification.deleteMany({
                where: {
                  isRead: true,
                  readAt: { lt: cutoffDate },
                  ...(cabinetId ? { cabinetId } : {}),
                },
              })
              results.notifications = notifResult.count
              stats.succeeded += notifResult.count
              break

            case 'sessions':
              const sessionResult = await prisma.userSession.deleteMany({
                where: {
                  OR: [
                    { expiresAt: { lt: new Date() } },
                    { isActive: false, updatedAt: { lt: cutoffDate } },
                  ],
                },
              })
              results.sessions = sessionResult.count
              stats.succeeded += sessionResult.count
              break

            case 'snapshots':
              const snapshotCutoff = new Date()
              snapshotCutoff.setMonth(snapshotCutoff.getMonth() - 24) // 24 mois
              
              const snapshotResult = await prisma.patrimoineSnapshot.deleteMany({
                where: {
                  date: { lt: snapshotCutoff },
                },
              })
              results.snapshots = snapshotResult.count
              stats.succeeded += snapshotResult.count
              break

            case 'exports':
              // Nettoyer les fichiers d'export temporaires
              // TODO: Implémenter avec Supabase Storage ou système de fichiers
              results.exports = 0
              break
          }

          stats.processed++
        } catch (error) {
          console.error(`Failed to cleanup ${cleanupType}:`, error)
          stats.failed++
        }
      }

      await job.updateProgress({ percentage: 100, stage: 'Completed' })

      return {
        success: stats.failed === 0,
        message: `Cleanup completed: ${JSON.stringify(results)}`,
        data: { results },
        stats,
      }
    } catch (error) {
      console.error(`[Worker] Cleanup job failed: ${job.id}`, error)
      throw error
    }
  },
  {
    connection,
    concurrency: 1, // Un seul cleanup à la fois
  }
)

// ===========================================
// AUDIT LOG WORKER
// ===========================================

export const auditLogWorker = new Worker<AuditLogJobData, JobResult>(
  QUEUE_NAMES.AUDIT_LOG,
  async (job: Job<AuditLogJobData>) => {
    const { cabinetId, userId, superAdminId, action, entityType, entityId, changes, ipAddress, userAgent } = job.data

    console.log(`[Worker] Processing audit log job: ${job.id}`, { action, entityType, entityId })

    try {
      await prisma.auditLog.create({
        data: {
          cabinetId,
          userId,
          superAdminId,
          action: action as never,
          entityType,
          entityId,
          changes: changes as never,
          ipAddress,
          userAgent,
        },
      })

      return {
        success: true,
        message: `Audit log created for ${action} on ${entityType}:${entityId}`,
        stats: { processed: 1, succeeded: 1, failed: 0, skipped: 0 },
      }
    } catch (error) {
      console.error(`[Worker] Audit log job failed: ${job.id}`, error)
      throw error
    }
  },
  {
    connection,
    concurrency: 10,
  }
)

// ===========================================
// EVENT HANDLERS
// ===========================================

cleanupWorker.on('completed', (job) => {
  console.log(`[Worker] Cleanup job ${job.id} completed`)
})

cleanupWorker.on('failed', (job, err) => {
  console.error(`[Worker] Cleanup job ${job?.id} failed:`, err.message)
})

auditLogWorker.on('completed', (job) => {
  console.log(`[Worker] Audit log ${job.id} completed`)
})

auditLogWorker.on('failed', (job, err) => {
  console.error(`[Worker] Audit log ${job?.id} failed:`, err.message)
})

// ===========================================
// EXPORTS
// ===========================================

export default {
  cleanupWorker,
  auditLogWorker,
}
