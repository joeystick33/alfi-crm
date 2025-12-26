// FILE: lib/queues/workers/patrimoine.worker.ts

import { Worker, Job } from 'bullmq'
import { QUEUE_NAMES } from '../index'
import { PatrimoineSnapshotJobData, PatrimoineUpdateJobData, JobResult } from '../types'
import { prisma } from '@/lib/prisma'
import { 
  createPatrimoineSnapshot, 
  createSnapshotsForCabinet, 
  createSnapshotsForAllClients 
} from '@/lib/services/patrimoine-snapshot.service'
import { invalidateClientCache } from '@/lib/redis/cache'

// ===========================================
// CONFIGURATION
// ===========================================

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
}

// ===========================================
// PATRIMOINE SNAPSHOT WORKER
// ===========================================

export const patrimoineSnapshotWorker = new Worker<PatrimoineSnapshotJobData, JobResult>(
  QUEUE_NAMES.PATRIMOINE_SNAPSHOT,
  async (job: Job<PatrimoineSnapshotJobData>) => {
    const { type, clientId, cabinetId, notes } = job.data

    console.log(`[Worker] Processing patrimoine snapshot job: ${job.id}`, { type, clientId, cabinetId })

    try {
      let result: JobResult

      switch (type) {
        case 'single':
          if (!clientId) {
            throw new Error('clientId is required for single snapshot')
          }
          
          await job.updateProgress({ percentage: 10, stage: 'Calculating patrimoine...' })
          
          const snapshot = await createPatrimoineSnapshot(clientId, notes)
          
          await job.updateProgress({ percentage: 90, stage: 'Invalidating cache...' })
          await invalidateClientCache(clientId)
          
          result = {
            success: true,
            message: `Snapshot created for client ${clientId}`,
            data: { snapshotId: snapshot.snapshotId },
            stats: { processed: 1, succeeded: 1, failed: 0, skipped: 0 },
          }
          break

        case 'cabinet':
          if (!cabinetId) {
            throw new Error('cabinetId is required for cabinet snapshot')
          }
          
          await job.updateProgress({ percentage: 10, stage: 'Processing cabinet clients...' })
          
          const cabinetResult = await createSnapshotsForCabinet(cabinetId)
          
          result = {
            success: true,
            message: `Snapshots created for cabinet ${cabinetId}`,
            stats: {
              processed: cabinetResult.success + cabinetResult.errors,
              succeeded: cabinetResult.success,
              failed: cabinetResult.errors,
              skipped: 0,
            },
          }
          break

        case 'all':
          await job.updateProgress({ percentage: 10, stage: 'Processing all clients...' })
          
          const allResult = await createSnapshotsForAllClients()
          
          result = {
            success: true,
            message: 'Snapshots created for all clients',
            stats: {
              processed: allResult.total,
              succeeded: allResult.success,
              failed: allResult.errors,
              skipped: 0,
            },
          }
          break

        default:
          throw new Error(`Unknown snapshot type: ${type}`)
      }

      await job.updateProgress({ percentage: 100, stage: 'Completed' })
      
      console.log(`[Worker] Patrimoine snapshot job completed: ${job.id}`, result)
      return result

    } catch (error) {
      console.error(`[Worker] Patrimoine snapshot job failed: ${job.id}`, error)
      throw error
    }
  },
  {
    connection,
    concurrency: 2,
    limiter: {
      max: 10,
      duration: 60000, // 10 jobs par minute max
    },
  }
)

// ===========================================
// PATRIMOINE UPDATE WORKER
// ===========================================

export const patrimoineUpdateWorker = new Worker<PatrimoineUpdateJobData, JobResult>(
  QUEUE_NAMES.PATRIMOINE_UPDATE,
  async (job: Job<PatrimoineUpdateJobData>) => {
    const { clientId, cabinetId, updateType, entityId } = job.data

    console.log(`[Worker] Processing patrimoine update job: ${job.id}`, { clientId, updateType })

    try {
      await job.updateProgress({ percentage: 10, stage: 'Recalculating...' })

      // Recalculer le snapshot après modification
      const snapshot = await createPatrimoineSnapshot(
        clientId,
        `Auto-update after ${updateType} change${entityId ? ` (${entityId})` : ''}`
      )

      await job.updateProgress({ percentage: 80, stage: 'Invalidating cache...' })
      
      // Invalider le cache
      await invalidateClientCache(clientId)

      await job.updateProgress({ percentage: 100, stage: 'Completed' })

      return {
        success: true,
        message: `Patrimoine updated for client ${clientId}`,
        data: { snapshotId: snapshot.snapshotId },
        stats: { processed: 1, succeeded: 1, failed: 0, skipped: 0 },
      }
    } catch (error) {
      console.error(`[Worker] Patrimoine update job failed: ${job.id}`, error)
      throw error
    }
  },
  {
    connection,
    concurrency: 5,
  }
)

// ===========================================
// EVENT HANDLERS
// ===========================================

patrimoineSnapshotWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed`)
})

patrimoineSnapshotWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err.message)
})

patrimoineUpdateWorker.on('completed', (job) => {
  console.log(`[Worker] Patrimoine update ${job.id} completed`)
})

patrimoineUpdateWorker.on('failed', (job, err) => {
  console.error(`[Worker] Patrimoine update ${job?.id} failed:`, err.message)
})

// ===========================================
// EXPORTS
// ===========================================

export default {
  patrimoineSnapshotWorker,
  patrimoineUpdateWorker,
}
