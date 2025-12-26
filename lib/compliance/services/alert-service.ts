/**
 * Service de gestion des alertes de conformité
 * 
 * Ce service gère le cycle de vie des alertes de conformité:
 * - Création d'alertes avec différents niveaux de sévérité
 * - Acquittement et résolution des alertes
 * - Génération automatique d'alertes pour documents expirants
 * - Récupération des alertes par client avec filtres
 * 
 * @module lib/compliance/services/alert-service
 * @requirements 3.1-3.6
 */

import { prisma } from '@/app/_common/lib/prisma'
import {
  type AlertType,
  type AlertSeverity,
  ALERT_TYPE_LABELS,
  ALERT_SEVERITY_LABELS,
  DOCUMENT_ALERT_THRESHOLDS,
  getDocumentAlertSeverity,
  KYC_DOCUMENT_TYPE_LABELS,
  type KYCDocumentType,
} from '../types'
import {
  createAlertSchema,
  acknowledgeAlertSchema,
  alertFiltersSchema,
  type CreateAlertInput,
  type AcknowledgeAlertInput,
  type AlertFiltersInput,
} from '../schemas'

// ============================================================================
// Types
// ============================================================================

export interface AlertServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface ComplianceAlertWithRelations {
  id: string
  cabinetId: string
  clientId: string | null
  operationId: string | null
  type: string
  severity: string
  title: string
  description: string
  actionRequired: string
  actionUrl: string | null
  acknowledged: boolean
  acknowledgedAt: Date | null
  acknowledgedById: string | null
  resolved: boolean
  resolvedAt: Date | null
  createdAt: Date
  client?: {
    id: string
    firstName: string
    lastName: string
    email: string | null
  } | null
  acknowledgedBy?: {
    id: string
    firstName: string
    lastName: string
  } | null
}

// ============================================================================
// Alert Service
// ============================================================================

/**
 * Crée une nouvelle alerte de conformité
 * 
 * @requirements 3.1-3.3 - Création d'alertes avec différents niveaux de sévérité
 */
export async function createAlert(
  input: CreateAlertInput
): Promise<AlertServiceResult<ComplianceAlertWithRelations>> {
  try {
    // Validate input
    const validatedInput = createAlertSchema.parse(input)

    // Create alert
    const alert = await prisma.complianceAlert.create({
      data: {
        cabinetId: validatedInput.cabinetId,
        clientId: validatedInput.clientId ?? null,
        operationId: validatedInput.operationId ?? null,
        type: validatedInput.type,
        severity: validatedInput.severity,
        title: validatedInput.title,
        description: validatedInput.description,
        actionRequired: validatedInput.actionRequired,
        actionUrl: validatedInput.actionUrl ?? null,
        acknowledged: false,
        resolved: false,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    return {
      success: true,
      data: alert as ComplianceAlertWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur lors de la création de l'alerte"
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Acquitte une alerte (marque comme vue mais pas résolue)
 * 
 * @requirements 3.6 - WHEN an alert is acknowledged, THE Alert_Engine SHALL mark it as "acknowledged" but keep it visible until resolved
 */
export async function acknowledgeAlert(
  input: AcknowledgeAlertInput
): Promise<AlertServiceResult<ComplianceAlertWithRelations>> {
  try {
    // Validate input
    const validatedInput = acknowledgeAlertSchema.parse(input)

    // Check if alert exists
    const existingAlert = await prisma.complianceAlert.findUnique({
      where: { id: validatedInput.alertId },
    })

    if (!existingAlert) {
      return {
        success: false,
        error: 'Alerte non trouvée',
      }
    }

    // Update alert
    const alert = await prisma.complianceAlert.update({
      where: { id: validatedInput.alertId },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedById: validatedInput.acknowledgedById,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        acknowledgedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return {
      success: true,
      data: alert as ComplianceAlertWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur lors de l'acquittement de l'alerte"
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Résout une alerte (marque comme résolue)
 */
export async function resolveAlert(
  alertId: string
): Promise<AlertServiceResult<ComplianceAlertWithRelations>> {
  try {
    // Check if alert exists
    const existingAlert = await prisma.complianceAlert.findUnique({
      where: { id: alertId },
    })

    if (!existingAlert) {
      return {
        success: false,
        error: 'Alerte non trouvée',
      }
    }

    // Update alert
    const alert = await prisma.complianceAlert.update({
      where: { id: alertId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        acknowledgedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    return {
      success: true,
      data: alert as ComplianceAlertWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur lors de la résolution de l'alerte"
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les alertes d'un client avec filtres optionnels
 * 
 * @requirements 3.5 - THE Alert_Engine SHALL display alerts in a filterable list
 */
export async function getAlertsByClient(
  cabinetId: string,
  clientId: string,
  filters?: AlertFiltersInput
): Promise<AlertServiceResult<ComplianceAlertWithRelations[]>> {
  try {
    // Build where clause
    const where: Record<string, unknown> = {
      cabinetId,
      clientId,
    }

    if (filters) {
      const validatedFilters = alertFiltersSchema.parse(filters)

      if (validatedFilters.severity && validatedFilters.severity.length > 0) {
        where.severity = { in: validatedFilters.severity }
      }

      if (validatedFilters.type && validatedFilters.type.length > 0) {
        where.type = { in: validatedFilters.type }
      }

      if (validatedFilters.acknowledged !== undefined) {
        where.acknowledged = validatedFilters.acknowledged
      }

      if (validatedFilters.resolved !== undefined) {
        where.resolved = validatedFilters.resolved
      }
    }

    const alerts = await prisma.complianceAlert.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        acknowledgedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return {
      success: true,
      data: alerts as ComplianceAlertWithRelations[],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des alertes'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère toutes les alertes d'un cabinet avec filtres optionnels
 */
export async function getAlertsByCabinet(
  cabinetId: string,
  filters?: AlertFiltersInput
): Promise<AlertServiceResult<ComplianceAlertWithRelations[]>> {
  try {
    // Build where clause
    const where: Record<string, unknown> = {
      cabinetId,
    }

    if (filters) {
      const validatedFilters = alertFiltersSchema.parse(filters)

      if (validatedFilters.clientId) {
        where.clientId = validatedFilters.clientId
      }

      if (validatedFilters.severity && validatedFilters.severity.length > 0) {
        where.severity = { in: validatedFilters.severity }
      }

      if (validatedFilters.type && validatedFilters.type.length > 0) {
        where.type = { in: validatedFilters.type }
      }

      if (validatedFilters.acknowledged !== undefined) {
        where.acknowledged = validatedFilters.acknowledged
      }

      if (validatedFilters.resolved !== undefined) {
        where.resolved = validatedFilters.resolved
      }
    }

    const alerts = await prisma.complianceAlert.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        acknowledgedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return {
      success: true,
      data: alerts as ComplianceAlertWithRelations[],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des alertes'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Génère automatiquement des alertes pour les documents expirants
 * 
 * @requirements 3.1 - WHEN a document expires in 30 days, THE Alert_Engine SHALL create an alert with severity "warning"
 * @requirements 3.2 - WHEN a document expires in 7 days, THE Alert_Engine SHALL create an alert with severity "high"
 * @requirements 3.3 - WHEN a document is expired, THE Alert_Engine SHALL create an alert with severity "critical"
 */
export async function generateDocumentExpirationAlerts(
  cabinetId: string
): Promise<AlertServiceResult<{ createdCount: number }>> {
  try {
    const now = new Date()
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + DOCUMENT_ALERT_THRESHOLDS.WARNING)

    // Find all documents that are expiring within 30 days or already expired
    // and are in VALIDE status
    const expiringDocuments = await prisma.kYCDocument.findMany({
      where: {
        cabinetId,
        status: 'VALIDE',
        expiresAt: {
          lte: thirtyDaysFromNow,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    let createdCount = 0

    for (const document of expiringDocuments) {
      // Determine alert severity based on expiration date
      const severity = getDocumentAlertSeverity(document.expiresAt, now)
      
      if (!severity) continue

      // Determine alert type
      const alertType: AlertType = document.expiresAt && document.expiresAt <= now
        ? 'DOCUMENT_EXPIRED'
        : 'DOCUMENT_EXPIRING'

      // Check if an alert already exists for this document
      const existingAlert = await prisma.complianceAlert.findFirst({
        where: {
          cabinetId,
          clientId: document.clientId,
          type: alertType,
          resolved: false,
          // Use metadata to track document ID (stored in description)
          description: {
            contains: document.id,
          },
        },
      })

      if (existingAlert) {
        // Update severity if it has increased
        const severityOrder: AlertSeverity[] = ['LOW', 'WARNING', 'HIGH', 'CRITICAL']
        const existingSeverityIndex = severityOrder.indexOf(existingAlert.severity as AlertSeverity)
        const newSeverityIndex = severityOrder.indexOf(severity)

        if (newSeverityIndex > existingSeverityIndex) {
          await prisma.complianceAlert.update({
            where: { id: existingAlert.id },
            data: {
              severity,
              type: alertType,
              title: buildAlertTitle(alertType, document.type as KYCDocumentType),
            },
          })
        }
        continue
      }

      // Create new alert
      const documentTypeLabel = KYC_DOCUMENT_TYPE_LABELS[document.type as KYCDocumentType] || document.type
      const clientName = `${document.client.firstName} ${document.client.lastName}`

      await prisma.complianceAlert.create({
        data: {
          cabinetId,
          clientId: document.clientId,
          type: alertType,
          severity,
          title: buildAlertTitle(alertType, document.type as KYCDocumentType),
          description: `Le document "${documentTypeLabel}" du client ${clientName} ${
            alertType === 'DOCUMENT_EXPIRED' ? 'a expiré' : 'expire bientôt'
          }. Document ID: ${document.id}`,
          actionRequired: alertType === 'DOCUMENT_EXPIRED'
            ? 'Demander un nouveau document au client'
            : 'Relancer le client pour renouveler le document',
          actionUrl: `/dashboard/clients/${document.clientId}/conformite`,
        },
      })

      createdCount++
    }

    return {
      success: true,
      data: { createdCount },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération des alertes'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère une alerte par son ID
 */
export async function getAlertById(
  alertId: string
): Promise<AlertServiceResult<ComplianceAlertWithRelations>> {
  try {
    const alert = await prisma.complianceAlert.findUnique({
      where: { id: alertId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        acknowledgedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!alert) {
      return {
        success: false,
        error: 'Alerte non trouvée',
      }
    }

    return {
      success: true,
      data: alert as ComplianceAlertWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur lors de la récupération de l'alerte"
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Compte les alertes non résolues par sévérité
 */
export async function countUnresolvedAlertsBySeverity(
  cabinetId: string
): Promise<AlertServiceResult<Record<AlertSeverity, number>>> {
  try {
    const counts = await prisma.complianceAlert.groupBy({
      by: ['severity'],
      where: {
        cabinetId,
        resolved: false,
      },
      _count: {
        id: true,
      },
    })

    const result: Record<AlertSeverity, number> = {
      LOW: 0,
      WARNING: 0,
      HIGH: 0,
      CRITICAL: 0,
    }

    for (const count of counts) {
      result[count.severity as AlertSeverity] = count._count.id
    }

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du comptage des alertes'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Obtient le label français d'un type d'alerte
 */
export function getAlertTypeLabel(type: AlertType): string {
  return ALERT_TYPE_LABELS[type]
}

/**
 * Obtient le label français d'une sévérité d'alerte
 */
export function getAlertSeverityLabel(severity: AlertSeverity): string {
  return ALERT_SEVERITY_LABELS[severity]
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Construit le titre d'une alerte basé sur son type et le type de document
 */
function buildAlertTitle(alertType: AlertType, documentType: KYCDocumentType): string {
  const documentTypeLabel = KYC_DOCUMENT_TYPE_LABELS[documentType] || documentType
  
  if (alertType === 'DOCUMENT_EXPIRED') {
    return `Document expiré: ${documentTypeLabel}`
  }
  
  return `Document expirant: ${documentTypeLabel}`
}
