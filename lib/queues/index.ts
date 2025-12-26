// FILE: lib/queues/index.ts

import { Queue, QueueEvents, JobsOptions } from 'bullmq'
import { redis } from '../redis'

// ===========================================
// CONFIGURATION
// ===========================================

// Options de connexion pour BullMQ
const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
}

// Options par défaut pour les jobs
const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: {
    age: 24 * 3600, // 24 heures
    count: 1000,
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // 7 jours
  },
}

// ===========================================
// NOMS DES QUEUES
// ===========================================

export const QUEUE_NAMES = {
  // Patrimoine
  PATRIMOINE_SNAPSHOT: 'patrimoine-snapshot',
  PATRIMOINE_UPDATE: 'patrimoine-update',
  
  // KYC
  KYC_EXPIRATION: 'kyc-expiration',
  KYC_REMINDER: 'kyc-reminder',
  
  // Tâches et rappels
  TASK_REMINDER: 'task-reminder',
  TASK_OVERDUE: 'task-overdue',
  
  // Notifications
  NOTIFICATION_SEND: 'notification-send',
  NOTIFICATION_EMAIL: 'notification-email',
  NOTIFICATION_PUSH: 'notification-push',
  
  // Documents
  DOCUMENT_PROCESS: 'document-process',
  DOCUMENT_SIGNATURE: 'document-signature',
  
  // Emails
  EMAIL_SEND: 'email-send',
  EMAIL_CAMPAIGN: 'email-campaign',
  EMAIL_SYNC: 'email-sync',
  
  // Audit et cleanup
  AUDIT_LOG: 'audit-log',
  CLEANUP: 'cleanup',
  
  // Rapports
  REPORT_GENERATE: 'report-generate',
  
  // Webhooks
  WEBHOOK_SEND: 'webhook-send',
  
  // Import/Export
  IMPORT_DATA: 'import-data',
  EXPORT_DATA: 'export-data',
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

// ===========================================
// CRÉATION DES QUEUES
// ===========================================

const queues = new Map<QueueName, Queue>()

/**
 * Récupère ou crée une queue
 */
export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    const queue = new Queue(name, {
      connection,
      defaultJobOptions,
    })
    queues.set(name, queue)
  }
  return queues.get(name)!
}

/**
 * Récupère les événements d'une queue
 */
export function getQueueEvents(name: QueueName): QueueEvents {
  return new QueueEvents(name, { connection })
}

// ===========================================
// QUEUES PRÉ-CONFIGURÉES
// ===========================================

// Patrimoine
export const patrimoineSnapshotQueue = getQueue(QUEUE_NAMES.PATRIMOINE_SNAPSHOT)
export const patrimoineUpdateQueue = getQueue(QUEUE_NAMES.PATRIMOINE_UPDATE)

// KYC
export const kycExpirationQueue = getQueue(QUEUE_NAMES.KYC_EXPIRATION)
export const kycReminderQueue = getQueue(QUEUE_NAMES.KYC_REMINDER)

// Tâches
export const taskReminderQueue = getQueue(QUEUE_NAMES.TASK_REMINDER)
export const taskOverdueQueue = getQueue(QUEUE_NAMES.TASK_OVERDUE)

// Notifications
export const notificationSendQueue = getQueue(QUEUE_NAMES.NOTIFICATION_SEND)
export const notificationEmailQueue = getQueue(QUEUE_NAMES.NOTIFICATION_EMAIL)

// Documents
export const documentProcessQueue = getQueue(QUEUE_NAMES.DOCUMENT_PROCESS)
export const documentSignatureQueue = getQueue(QUEUE_NAMES.DOCUMENT_SIGNATURE)

// Emails
export const emailSendQueue = getQueue(QUEUE_NAMES.EMAIL_SEND)
export const emailCampaignQueue = getQueue(QUEUE_NAMES.EMAIL_CAMPAIGN)
export const emailSyncQueue = getQueue(QUEUE_NAMES.EMAIL_SYNC)

// Audit
export const auditLogQueue = getQueue(QUEUE_NAMES.AUDIT_LOG)
export const cleanupQueue = getQueue(QUEUE_NAMES.CLEANUP)

// Rapports
export const reportGenerateQueue = getQueue(QUEUE_NAMES.REPORT_GENERATE)

// Webhooks
export const webhookSendQueue = getQueue(QUEUE_NAMES.WEBHOOK_SEND)

// Import/Export
export const importDataQueue = getQueue(QUEUE_NAMES.IMPORT_DATA)
export const exportDataQueue = getQueue(QUEUE_NAMES.EXPORT_DATA)

// ===========================================
// UTILITAIRES
// ===========================================

/**
 * Ferme toutes les queues
 */
export async function closeAllQueues(): Promise<void> {
  const closePromises = Array.from(queues.values()).map((q) => q.close())
  await Promise.all(closePromises)
  queues.clear()
}

/**
 * Récupère les stats de toutes les queues
 */
export async function getAllQueuesStats(): Promise<
  Record<string, { waiting: number; active: number; completed: number; failed: number }>
> {
  const stats: Record<string, { waiting: number; active: number; completed: number; failed: number }> = {}

  for (const [name, queue] of queues) {
    const counts = await queue.getJobCounts()
    stats[name] = {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0,
    }
  }

  return stats
}

/**
 * Vide une queue spécifique
 */
export async function drainQueue(name: QueueName): Promise<void> {
  const queue = getQueue(name)
  await queue.drain()
}

/**
 * Pause une queue
 */
export async function pauseQueue(name: QueueName): Promise<void> {
  const queue = getQueue(name)
  await queue.pause()
}

/**
 * Reprend une queue
 */
export async function resumeQueue(name: QueueName): Promise<void> {
  const queue = getQueue(name)
  await queue.resume()
}
