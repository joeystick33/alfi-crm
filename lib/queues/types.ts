// FILE: lib/queues/types.ts

// ===========================================
// TYPES DE JOBS - PATRIMOINE
// ===========================================

export interface PatrimoineSnapshotJobData {
  type: 'single' | 'cabinet' | 'all'
  clientId?: string
  cabinetId?: string
  triggeredBy?: string
  notes?: string
}

export interface PatrimoineUpdateJobData {
  clientId: string
  cabinetId: string
  updateType: 'actif' | 'passif' | 'budget' | 'full'
  entityId?: string
  triggeredBy?: string
}

// ===========================================
// TYPES DE JOBS - KYC
// ===========================================

export interface KYCExpirationJobData {
  type: 'check' | 'expire' | 'notify'
  clientId?: string
  cabinetId?: string
  documentId?: string
}

export interface KYCReminderJobData {
  clientId: string
  cabinetId: string
  documentId: string
  documentType: string
  expiresAt: Date
  daysUntilExpiration: number
}

// ===========================================
// TYPES DE JOBS - TÂCHES
// ===========================================

export interface TaskReminderJobData {
  taskId: string
  cabinetId: string
  assignedToId: string
  clientId?: string
  title: string
  dueDate: Date
  reminderType: 'today' | 'tomorrow' | 'overdue'
}

export interface TaskOverdueJobData {
  type: 'mark' | 'notify' | 'escalate'
  taskId?: string
  cabinetId?: string
}

// ===========================================
// TYPES DE JOBS - NOTIFICATIONS
// ===========================================

export interface NotificationSendJobData {
  cabinetId: string
  userId?: string
  clientId?: string
  type: string
  title: string
  message: string
  actionUrl?: string
  channels?: ('app' | 'email' | 'push')[]
  metadata?: Record<string, unknown>
}

export interface NotificationEmailJobData {
  to: string
  subject: string
  template: string
  variables: Record<string, unknown>
  cabinetId: string
  userId?: string
  clientId?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

// ===========================================
// TYPES DE JOBS - DOCUMENTS
// ===========================================

export interface DocumentProcessJobData {
  documentId: string
  cabinetId: string
  processType: 'ocr' | 'classification' | 'extraction' | 'thumbnail'
  options?: Record<string, unknown>
}

export interface DocumentSignatureJobData {
  documentId: string
  cabinetId: string
  signatureWorkflowId: string
  action: 'initiate' | 'remind' | 'complete' | 'expire'
  signerEmail?: string
}

// ===========================================
// TYPES DE JOBS - EMAILS
// ===========================================

export interface EmailSendJobData {
  to: string | string[]
  cc?: string | string[]
  bcc?: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  cabinetId: string
  userId?: string
  clientId?: string
  messageId?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

export interface EmailCampaignJobData {
  campaignId: string
  cabinetId: string
  action: 'send' | 'schedule' | 'pause' | 'resume' | 'complete'
  recipientIds?: string[]
  batchSize?: number
  batchIndex?: number
}

export interface EmailSyncJobData {
  userId: string
  cabinetId: string
  provider: 'gmail' | 'outlook'
  syncType: 'full' | 'incremental'
  since?: Date
}

// ===========================================
// TYPES DE JOBS - AUDIT
// ===========================================

export interface AuditLogJobData {
  cabinetId?: string
  userId?: string
  superAdminId?: string
  action: string
  entityType: string
  entityId: string
  changes?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

export interface CleanupJobData {
  type: 'audit_logs' | 'notifications' | 'sessions' | 'snapshots' | 'exports' | 'all'
  olderThanDays?: number
  cabinetId?: string
}

// ===========================================
// TYPES DE JOBS - RAPPORTS
// ===========================================

export interface ReportGenerateJobData {
  reportType: 'patrimoine' | 'performance' | 'kyc' | 'activity' | 'billing'
  format: 'pdf' | 'excel' | 'csv'
  cabinetId: string
  userId: string
  clientId?: string
  dateFrom?: Date
  dateTo?: Date
  options?: Record<string, unknown>
}

// ===========================================
// TYPES DE JOBS - WEBHOOKS
// ===========================================

export interface WebhookSendJobData {
  webhookId: string
  url: string
  secret: string
  event: string
  payload: Record<string, unknown>
  cabinetId?: string
}

// ===========================================
// TYPES DE JOBS - IMPORT/EXPORT
// ===========================================

export interface ImportDataJobData {
  importType: 'clients' | 'actifs' | 'passifs' | 'contrats' | 'full'
  fileUrl: string
  cabinetId: string
  userId: string
  options?: {
    skipDuplicates?: boolean
    updateExisting?: boolean
    dryRun?: boolean
  }
}

export interface ExportDataJobData {
  exportType: 'clients' | 'actifs' | 'passifs' | 'contrats' | 'patrimoine' | 'full'
  format: 'csv' | 'excel' | 'json' | 'pdf'
  cabinetId: string
  userId: string
  filters?: Record<string, unknown>
  clientIds?: string[]
}

// ===========================================
// JOB RESULT TYPES
// ===========================================

export interface JobResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
  errors?: string[]
  stats?: {
    processed: number
    succeeded: number
    failed: number
    skipped: number
  }
}

// ===========================================
// JOB PROGRESS
// ===========================================

export interface JobProgress {
  percentage: number
  stage: string
  details?: string
  currentItem?: number
  totalItems?: number
}
