// FILE: lib/queues/helpers.ts

/**
 * Helpers pour ajouter facilement des jobs aux queues
 * Utilisable depuis les routes API et server actions
 */

import {
  patrimoineSnapshotQueue,
  patrimoineUpdateQueue,
  notificationSendQueue,
  emailSendQueue,
  emailCampaignQueue,
  auditLogQueue,
  cleanupQueue,
  reportGenerateQueue,
  documentProcessQueue,
  webhookSendQueue,
  importDataQueue,
  exportDataQueue,
} from './index'

import {
  PatrimoineSnapshotJobData,
  PatrimoineUpdateJobData,
  NotificationSendJobData,
  EmailSendJobData,
  EmailCampaignJobData,
  AuditLogJobData,
  CleanupJobData,
  ReportGenerateJobData,
  DocumentProcessJobData,
  WebhookSendJobData,
  ImportDataJobData,
  ExportDataJobData,
} from './types'

// ===========================================
// PATRIMOINE HELPERS
// ===========================================

/**
 * Crée un snapshot patrimoine pour un client
 */
export async function queuePatrimoineSnapshot(
  clientId: string,
  triggeredBy?: string,
  notes?: string
) {
  return patrimoineSnapshotQueue.add(
    `snapshot-client-${clientId}`,
    {
      type: 'single',
      clientId,
      triggeredBy,
      notes,
    } as PatrimoineSnapshotJobData,
    { priority: 2 }
  )
}

/**
 * Crée des snapshots patrimoine pour tout un cabinet
 */
export async function queueCabinetPatrimoineSnapshots(
  cabinetId: string,
  triggeredBy?: string
) {
  return patrimoineSnapshotQueue.add(
    `snapshot-cabinet-${cabinetId}`,
    {
      type: 'cabinet',
      cabinetId,
      triggeredBy,
    } as PatrimoineSnapshotJobData,
    { priority: 3 }
  )
}

/**
 * Met à jour le patrimoine après modification d'un actif/passif
 */
export async function queuePatrimoineUpdate(
  clientId: string,
  cabinetId: string,
  updateType: 'actif' | 'passif' | 'budget' | 'full',
  entityId?: string,
  triggeredBy?: string
) {
  return patrimoineUpdateQueue.add(
    `update-${clientId}-${updateType}`,
    {
      clientId,
      cabinetId,
      updateType,
      entityId,
      triggeredBy,
    } as PatrimoineUpdateJobData,
    {
      priority: 1,
      delay: 5000, // Attendre 5s pour regrouper les modifications
      deduplication: {
        id: `patrimoine-update-${clientId}`,
      },
    }
  )
}

// ===========================================
// NOTIFICATION HELPERS
// ===========================================

/**
 * Envoie une notification à un utilisateur
 */
export async function queueNotification(data: NotificationSendJobData) {
  return notificationSendQueue.add(
    `notif-${data.userId || data.clientId}-${Date.now()}`,
    data,
    { priority: 1 }
  )
}

/**
 * Envoie une notification à tous les utilisateurs d'un cabinet
 */
export async function queueCabinetNotification(
  cabinetId: string,
  type: string,
  title: string,
  message: string,
  actionUrl?: string
) {
  return notificationSendQueue.add(
    `notif-cabinet-${cabinetId}-${Date.now()}`,
    {
      cabinetId,
      type,
      title,
      message,
      actionUrl,
      channels: ['app'],
    } as NotificationSendJobData,
    { priority: 2 }
  )
}

// ===========================================
// EMAIL HELPERS
// ===========================================

/**
 * Envoie un email simple
 */
export async function queueEmail(data: EmailSendJobData) {
  return emailSendQueue.add(
    `email-${Date.now()}`,
    data,
    { priority: 2 }
  )
}

/**
 * Lance une campagne email
 */
export async function queueEmailCampaign(
  campaignId: string,
  cabinetId: string,
  action: 'send' | 'schedule' | 'pause' | 'resume' = 'send'
) {
  return emailCampaignQueue.add(
    `campaign-${campaignId}-${action}`,
    {
      campaignId,
      cabinetId,
      action,
    } as EmailCampaignJobData,
    { priority: 3 }
  )
}

// ===========================================
// AUDIT LOG HELPERS
// ===========================================

/**
 * Crée un log d'audit de manière asynchrone
 */
export async function queueAuditLog(data: AuditLogJobData) {
  return auditLogQueue.add(
    `audit-${data.entityType}-${data.entityId}`,
    data,
    { priority: 3 }
  )
}

/**
 * Helper pour créer un audit log facilement
 */
export async function logAudit(
  action: string,
  entityType: string,
  entityId: string,
  options?: {
    cabinetId?: string
    userId?: string
    superAdminId?: string
    changes?: Record<string, unknown>
    ipAddress?: string
    userAgent?: string
  }
) {
  return queueAuditLog({
    action,
    entityType,
    entityId,
    ...options,
  })
}

// ===========================================
// CLEANUP HELPERS
// ===========================================

/**
 * Lance un job de nettoyage
 */
export async function queueCleanup(data: CleanupJobData) {
  return cleanupQueue.add(
    `cleanup-${data.type}-${Date.now()}`,
    data,
    { priority: 5 }
  )
}

/**
 * Programme le nettoyage hebdomadaire
 */
export async function scheduleWeeklyCleanup() {
  return cleanupQueue.add(
    'weekly-cleanup',
    {
      type: 'all',
      olderThanDays: 90,
    } as CleanupJobData,
    {
      priority: 5,
      repeat: {
        pattern: '0 4 * * 0', // Dimanche à 4h
      },
    }
  )
}

// ===========================================
// REPORT HELPERS
// ===========================================

/**
 * Génère un rapport en arrière-plan
 */
export async function queueReportGeneration(data: ReportGenerateJobData) {
  return reportGenerateQueue.add(
    `report-${data.reportType}-${data.cabinetId}`,
    data,
    { priority: 3 }
  )
}

// ===========================================
// DOCUMENT HELPERS
// ===========================================

/**
 * Traite un document (OCR, classification, etc.)
 */
export async function queueDocumentProcessing(data: DocumentProcessJobData) {
  return documentProcessQueue.add(
    `doc-process-${data.documentId}`,
    data,
    { priority: 2 }
  )
}

// ===========================================
// WEBHOOK HELPERS
// ===========================================

/**
 * Envoie un webhook
 */
export async function queueWebhook(data: WebhookSendJobData) {
  return webhookSendQueue.add(
    `webhook-${data.webhookId}-${data.event}`,
    data,
    {
      priority: 1,
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    }
  )
}

// ===========================================
// IMPORT/EXPORT HELPERS
// ===========================================

/**
 * Lance un import de données
 */
export async function queueDataImport(data: ImportDataJobData) {
  return importDataQueue.add(
    `import-${data.importType}-${data.cabinetId}`,
    data,
    { priority: 3 }
  )
}

/**
 * Lance un export de données
 */
export async function queueDataExport(data: ExportDataJobData) {
  return exportDataQueue.add(
    `export-${data.exportType}-${data.cabinetId}`,
    data,
    { priority: 3 }
  )
}
