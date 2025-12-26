// FILE: lib/queues/workers/index.ts

/**
 * Index des workers BullMQ
 * 
 * Ce fichier centralise tous les workers pour faciliter le démarrage
 * et l'arrêt groupé. À utiliser dans un processus dédié aux workers.
 */

import { patrimoineSnapshotWorker, patrimoineUpdateWorker } from './patrimoine.worker'
import { notificationSendWorker, notificationEmailWorker } from './notification.worker'
import { emailSendWorker, emailCampaignWorker } from './email.worker'
import { cleanupWorker, auditLogWorker } from './cleanup.worker'

// ===========================================
// LISTE DES WORKERS
// ===========================================

export const workers = {
  // Patrimoine
  patrimoineSnapshot: patrimoineSnapshotWorker,
  patrimoineUpdate: patrimoineUpdateWorker,
  
  // Notifications
  notificationSend: notificationSendWorker,
  notificationEmail: notificationEmailWorker,
  
  // Emails
  emailSend: emailSendWorker,
  emailCampaign: emailCampaignWorker,
  
  // Cleanup & Audit
  cleanup: cleanupWorker,
  auditLog: auditLogWorker,
}

export type WorkerName = keyof typeof workers

// ===========================================
// WORKER MANAGEMENT
// ===========================================

/**
 * Démarre tous les workers
 */
export async function startAllWorkers(): Promise<void> {
  console.log('🚀 Starting all workers...')
  
  for (const [name, worker] of Object.entries(workers)) {
    console.log(`  ✓ Started worker: ${name}`)
  }
  
  console.log(`✅ ${Object.keys(workers).length} workers started`)
}

/**
 * Arrête tous les workers proprement
 */
export async function stopAllWorkers(): Promise<void> {
  console.log('🛑 Stopping all workers...')
  
  const closePromises = Object.entries(workers).map(async ([name, worker]) => {
    try {
      await worker.close()
      console.log(`  ✓ Stopped worker: ${name}`)
    } catch (error) {
      console.error(`  ✗ Error stopping worker ${name}:`, error)
    }
  })
  
  await Promise.all(closePromises)
  console.log('✅ All workers stopped')
}

/**
 * Pause tous les workers
 */
export async function pauseAllWorkers(): Promise<void> {
  console.log('⏸️ Pausing all workers...')
  
  const pausePromises = Object.entries(workers).map(async ([name, worker]) => {
    try {
      await worker.pause()
      console.log(`  ✓ Paused worker: ${name}`)
    } catch (error) {
      console.error(`  ✗ Error pausing worker ${name}:`, error)
    }
  })
  
  await Promise.all(pausePromises)
}

/**
 * Reprend tous les workers
 */
export async function resumeAllWorkers(): Promise<void> {
  console.log('▶️ Resuming all workers...')
  
  const resumePromises = Object.entries(workers).map(async ([name, worker]) => {
    try {
      await worker.resume()
      console.log(`  ✓ Resumed worker: ${name}`)
    } catch (error) {
      console.error(`  ✗ Error resuming worker ${name}:`, error)
    }
  })
  
  await Promise.all(resumePromises)
}

/**
 * Récupère le statut de tous les workers
 */
export function getWorkersStatus(): Record<string, { running: boolean; paused: boolean }> {
  const status: Record<string, { running: boolean; paused: boolean }> = {}
  
  for (const [name, worker] of Object.entries(workers)) {
    status[name] = {
      running: worker.isRunning(),
      paused: worker.isPaused(),
    }
  }
  
  return status
}

// ===========================================
// EXPORTS
// ===========================================

export {
  patrimoineSnapshotWorker,
  patrimoineUpdateWorker,
  notificationSendWorker,
  notificationEmailWorker,
  emailSendWorker,
  emailCampaignWorker,
  cleanupWorker,
  auditLogWorker,
}
