/**
 * Documents Data Service
 * 
 * Pure functions for document data processing and validation.
 * Used by Client 360 Documents tab.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import type { 
  Document, 
  DocumentCategory, 
  DocumentStatus 
} from '@/app/_common/types/client360'

// ============================================================================
// CONSTANTS
// ============================================================================

export const VALID_DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'IDENTITE',
  'PATRIMONY', 
  'RISK_PROFILE',
  'COMPLIANCE'
]

export const VALID_DOCUMENT_STATUSES: DocumentStatus[] = [
  'VALID',
  'EXPIRE',
  'MISSING'
]

// Default expiration alert threshold in days
export const DEFAULT_EXPIRATION_ALERT_DAYS = 30

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates if a category is a valid document category
 */
export function isValidDocumentCategory(category: string): category is DocumentCategory {
  return VALID_DOCUMENT_CATEGORIES.includes(category as DocumentCategory)
}

/**
 * Validates if a status is a valid document status
 */
export function isValidDocumentStatus(status: string): status is DocumentStatus {
  return VALID_DOCUMENT_STATUSES.includes(status as DocumentStatus)
}

/**
 * Validates document completeness - checks all required fields are present
 */
export function validateDocumentCompleteness(document: Partial<Document>): {
  isComplete: boolean
  missingFields: string[]
} {
  const requiredFields = ['id', 'category', 'type', 'name', 'status', 'uploadDate']
  const missingFields: string[] = []

  for (const field of requiredFields) {
    const value = document[field as keyof Document]
    if (value === undefined || value === null || value === '') {
      missingFields.push(field)
    }
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields
  }
}

// ============================================================================
// EXPIRATION ALERT FUNCTIONS
// ============================================================================

/**
 * Calculates days until expiration from a date string
 * 
 * @param expirationDate - ISO date string of expiration
 * @param currentDate - Current date (defaults to now)
 * @returns Number of days until expiration (negative if expired)
 */
export function calculateDaysUntilExpiration(
  expirationDate: string,
  currentDate: Date = new Date()
): number {
  const expiry = new Date(expirationDate)
  const diffTime = expiry.getTime() - currentDate.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Determines if a document should generate an expiration alert
 * 
 * Property 12: Document expiration alerts
 * For any document with an expiration date within 30 days of current date,
 * an expiration alert SHALL be generated.
 * 
 * @param document - Document to check
 * @param alertThresholdDays - Number of days before expiration to alert (default: 30)
 * @param currentDate - Current date for comparison (defaults to now)
 * @returns true if document should generate an expiration alert
 */
export function shouldGenerateExpirationAlert(
  document: Document,
  alertThresholdDays: number = DEFAULT_EXPIRATION_ALERT_DAYS,
  currentDate: Date = new Date()
): boolean {
  // No expiration date means no alert needed
  if (!document.expirationDate) {
    return false
  }

  const daysUntilExpiration = calculateDaysUntilExpiration(
    document.expirationDate,
    currentDate
  )

  // Alert if within threshold (including already expired documents)
  return daysUntilExpiration <= alertThresholdDays
}

/**
 * Filters documents to get those requiring expiration alerts
 * 
 * Property 12: Document expiration alerts
 * For any document with an expiration date within 30 days of current date,
 * an expiration alert SHALL be generated.
 * 
 * @param documents - Array of documents to filter
 * @param alertThresholdDays - Number of days before expiration to alert (default: 30)
 * @param currentDate - Current date for comparison (defaults to now)
 * @returns Array of documents requiring expiration alerts
 */
export function getDocumentsRequiringExpirationAlerts(
  documents: Document[],
  alertThresholdDays: number = DEFAULT_EXPIRATION_ALERT_DAYS,
  currentDate: Date = new Date()
): Document[] {
  return documents.filter(doc => 
    shouldGenerateExpirationAlert(doc, alertThresholdDays, currentDate)
  )
}

/**
 * Generates expiration alert data for a document
 * 
 * @param document - Document to generate alert for
 * @param currentDate - Current date for comparison
 * @returns Alert data object or null if no alert needed
 */
export function generateExpirationAlertData(
  document: Document,
  currentDate: Date = new Date()
): {
  documentId: string
  documentName: string
  documentType: string
  expirationDate: string
  daysRemaining: number
  isExpired: boolean
  severity: 'CRITIQUE' | 'WARNING' | 'INFO'
} | null {
  if (!document.expirationDate) {
    return null
  }

  const daysRemaining = calculateDaysUntilExpiration(
    document.expirationDate,
    currentDate
  )

  // Only generate alert if within 30 days
  if (daysRemaining > DEFAULT_EXPIRATION_ALERT_DAYS) {
    return null
  }

  const isExpired = daysRemaining < 0

  // Determine severity based on days remaining
  let severity: 'CRITIQUE' | 'WARNING' | 'INFO'
  if (isExpired) {
    severity = 'CRITIQUE'
  } else if (daysRemaining <= 7) {
    severity = 'CRITIQUE'
  } else if (daysRemaining <= 14) {
    severity = 'WARNING'
  } else {
    severity = 'INFO'
  }

  return {
    documentId: document.id,
    documentName: document.name,
    documentType: document.type,
    expirationDate: document.expirationDate,
    daysRemaining,
    isExpired,
    severity
  }
}

/**
 * Validates that all documents with expiration dates within threshold have alerts
 * 
 * Property 12: Document expiration alerts
 * For any document with an expiration date within 30 days of current date,
 * an expiration alert SHALL be generated.
 * 
 * @param documents - Array of documents
 * @param alerts - Array of generated alerts
 * @param alertThresholdDays - Threshold in days
 * @param currentDate - Current date for comparison
 * @returns Validation result
 */
export function validateExpirationAlertsGenerated(
  documents: Document[],
  alerts: { documentId: string }[],
  alertThresholdDays: number = DEFAULT_EXPIRATION_ALERT_DAYS,
  currentDate: Date = new Date()
): {
  isValid: boolean
  missingAlerts: string[]
  extraAlerts: string[]
} {
  const alertDocumentIds = new Set(alerts.map(a => a.documentId))
  
  const documentsRequiringAlerts = getDocumentsRequiringExpirationAlerts(
    documents,
    alertThresholdDays,
    currentDate
  )
  
  const requiredAlertIds = new Set(documentsRequiringAlerts.map(d => d.id))
  
  const missingAlerts: string[] = []
  const extraAlerts: string[] = []
  
  // Check for missing alerts
  for (const docId of requiredAlertIds) {
    if (!alertDocumentIds.has(docId)) {
      missingAlerts.push(docId)
    }
  }
  
  // Check for extra alerts (alerts for documents that don't need them)
  for (const alertId of alertDocumentIds) {
    if (!requiredAlertIds.has(alertId)) {
      extraAlerts.push(alertId)
    }
  }
  
  return {
    isValid: missingAlerts.length === 0 && extraAlerts.length === 0,
    missingAlerts,
    extraAlerts
  }
}

// ============================================================================
// DOCUMENT STATUS FUNCTIONS
// ============================================================================

/**
 * Determines document status based on expiration date
 * 
 * @param expirationDate - Optional expiration date string
 * @param currentDate - Current date for comparison
 * @returns Document status
 */
export function determineDocumentStatus(
  expirationDate: string | undefined,
  currentDate: Date = new Date()
): DocumentStatus {
  if (!expirationDate) {
    return 'VALID'
  }

  const daysUntilExpiration = calculateDaysUntilExpiration(expirationDate, currentDate)
  
  if (daysUntilExpiration < 0) {
    return 'EXPIRE'
  }
  
  return 'VALID'
}

/**
 * Groups documents by category
 * 
 * @param documents - Array of documents
 * @returns Map of category to documents
 */
export function groupDocumentsByCategory(
  documents: Document[]
): Map<DocumentCategory, Document[]> {
  const grouped = new Map<DocumentCategory, Document[]>()
  
  for (const category of VALID_DOCUMENT_CATEGORIES) {
    grouped.set(category, [])
  }
  
  for (const doc of documents) {
    const categoryDocs = grouped.get(doc.category) || []
    categoryDocs.push(doc)
    grouped.set(doc.category, categoryDocs)
  }
  
  return grouped
}

/**
 * Counts documents by status
 * 
 * @param documents - Array of documents
 * @returns Object with counts per status
 */
export function countDocumentsByStatus(
  documents: Document[]
): Record<DocumentStatus, number> {
  const counts: Record<DocumentStatus, number> = {
    VALID: 0,
    EXPIRE: 0,
    MISSING: 0
  }
  
  for (const doc of documents) {
    if (counts[doc.status] !== undefined) {
      counts[doc.status]++
    }
  }
  
  return counts
}
