/**
 * Service de génération d'alertes pour les opérations
 * 
 * Ce service gère la création automatique d'alertes liées aux opérations:
 * - Alertes pour affaires inactives
 * - Alertes pour opérations bloquées
 * - Navigation depuis l'alerte vers l'opération
 * 
 * @module lib/operations/services/operation-alert-service
 * @requirements 20.4, 25.6
 */

import { prisma } from '@/app/_common/lib/prisma'
import type { AlertType, AlertSeverity } from '@/lib/compliance/types'

// ============================================================================
// Types
// ============================================================================

export interface OperationAlertServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface GeneratedAlertsResult {
  inactiveAffairesAlerts: number
  blockedOperationsAlerts: number
  totalCreated: number
}

// ============================================================================
// Constants
// ============================================================================

// Inactivity thresholds in days
const INACTIVITY_THRESHOLDS = {
  WARNING: 14,  // 14 days - warning alert
  HIGH: 30,     // 30 days - high priority alert
  CRITICAL: 60, // 60 days - critical alert
}

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Génère des alertes pour les affaires inactives
 * 
 * @requirements 20.4 - WHEN an Affaire has no activity for 14 days, create "warning" alert
 * @requirements 20.4 - WHEN an Affaire has no activity for 30 days, create "high" alert
 */
export async function generateInactiveAffaireAlerts(
  cabinetId: string
): Promise<OperationAlertServiceResult<{ createdCount: number }>> {
  try {
    const now = new Date()
    
    // Find all affaires that are in progress (not validated/rejected/cancelled)
    // and have been inactive for more than 14 days
    const inactiveAffaires = await prisma.affaireNouvelle.findMany({
      where: {
        cabinetId,
        status: {
          in: ['PROSPECT', 'QUALIFICATION', 'CONSTITUTION', 'SIGNATURE', 'ENVOYE', 'EN_TRAITEMENT'],
        },
        pausedAt: null, // Not intentionally paused
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

    for (const affaire of inactiveAffaires) {
      const lastActivity = affaire.lastActivityAt || affaire.createdAt
      const daysSinceActivity = Math.floor(
        (now.getTime() - new Date(lastActivity).getTime()) / (1000 * 60 * 60 * 24)
      )

      // Skip if activity is recent
      if (daysSinceActivity < INACTIVITY_THRESHOLDS.WARNING) {
        continue
      }

      // Determine severity based on inactivity duration
      let severity: AlertSeverity
      if (daysSinceActivity >= INACTIVITY_THRESHOLDS.CRITICAL) {
        severity = 'CRITICAL'
      } else if (daysSinceActivity >= INACTIVITY_THRESHOLDS.HIGH) {
        severity = 'HIGH'
      } else {
        severity = 'WARNING'
      }

      // Check if an alert already exists for this affaire
      const existingAlert = await prisma.complianceAlert.findFirst({
        where: {
          cabinetId,
          operationId: affaire.id,
          type: 'AFFAIRE_INACTIVE',
          resolved: false,
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
              title: buildInactiveAffaireTitle(daysSinceActivity),
              description: buildInactiveAffaireDescription(affaire, daysSinceActivity),
            },
          })
        }
        continue
      }

      // Create new alert
      const clientName = `${affaire.client.firstName} ${affaire.client.lastName}`

      await prisma.complianceAlert.create({
        data: {
          cabinetId,
          clientId: affaire.clientId,
          operationId: affaire.id,
          type: 'AFFAIRE_INACTIVE',
          severity,
          title: buildInactiveAffaireTitle(daysSinceActivity),
          description: buildInactiveAffaireDescription(affaire, daysSinceActivity),
          actionRequired: `Reprendre l'affaire ${affaire.reference} ou la mettre en pause avec une raison`,
          actionUrl: `/dashboard/operations/affaires-nouvelles/${affaire.id}`,
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
 * Génère des alertes pour les opérations bloquées par des documents manquants
 * 
 * @requirements 25.6 - Create alerts for blocked operations
 */
export async function generateBlockedOperationAlerts(
  cabinetId: string
): Promise<OperationAlertServiceResult<{ createdCount: number }>> {
  try {
    // Find all affaires in CONSTITUTION or SIGNATURE status
    // These are the stages where documents are required
    const affairesNeedingDocuments = await prisma.affaireNouvelle.findMany({
      where: {
        cabinetId,
        status: {
          in: ['CONSTITUTION', 'SIGNATURE'],
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

    for (const affaire of affairesNeedingDocuments) {
      // For now, we don't have requiredDocuments relation
      // We'll check if there's an existing blocked alert and resolve it if the affaire progresses
      // In a real implementation, you would check document requirements from a separate service
      
      // Check if an alert already exists
      const existingAlert = await prisma.complianceAlert.findFirst({
        where: {
          cabinetId,
          operationId: affaire.id,
          type: 'OPERATION_BLOCKED',
          resolved: false,
        },
      })

      // If affaire is in CONSTITUTION/SIGNATURE without an alert, we could create one
      // but we need document requirements data to determine if it's actually blocked
      // For now, skip creating new alerts without document data
      
      if (existingAlert) {
        // Update the description
        const clientName = `${affaire.client.firstName} ${affaire.client.lastName}`
        await prisma.complianceAlert.update({
          where: { id: existingAlert.id },
          data: {
            description: `L'affaire ${affaire.reference} pour ${clientName} est en attente de documents.`,
          },
        })
      }
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
 * Génère toutes les alertes liées aux opérations
 */
export async function generateAllOperationAlerts(
  cabinetId: string
): Promise<OperationAlertServiceResult<GeneratedAlertsResult>> {
  try {
    const [inactiveResult, blockedResult] = await Promise.all([
      generateInactiveAffaireAlerts(cabinetId),
      generateBlockedOperationAlerts(cabinetId),
    ])

    if (!inactiveResult.success || !blockedResult.success) {
      return {
        success: false,
        error: inactiveResult.error || blockedResult.error,
      }
    }

    return {
      success: true,
      data: {
        inactiveAffairesAlerts: inactiveResult.data?.createdCount || 0,
        blockedOperationsAlerts: blockedResult.data?.createdCount || 0,
        totalCreated: (inactiveResult.data?.createdCount || 0) + (blockedResult.data?.createdCount || 0),
      },
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
 * Récupère les alertes liées à une opération spécifique
 */
export async function getAlertsByOperation(
  operationId: string
): Promise<OperationAlertServiceResult<unknown[]>> {
  try {
    const alerts = await prisma.complianceAlert.findMany({
      where: {
        operationId,
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      data: alerts,
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
 * Résout automatiquement les alertes d'une opération quand elle progresse
 */
export async function resolveOperationAlerts(
  operationId: string,
  alertTypes?: AlertType[]
): Promise<OperationAlertServiceResult<{ resolvedCount: number }>> {
  try {
    const where: Record<string, unknown> = {
      operationId,
      resolved: false,
    }

    if (alertTypes && alertTypes.length > 0) {
      where.type = { in: alertTypes }
    }

    const result = await prisma.complianceAlert.updateMany({
      where,
      data: {
        resolved: true,
        resolvedAt: new Date(),
      },
    })

    return {
      success: true,
      data: { resolvedCount: result.count },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la résolution des alertes'
    return {
      success: false,
      error: message,
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function buildInactiveAffaireTitle(daysSinceActivity: number): string {
  if (daysSinceActivity >= INACTIVITY_THRESHOLDS.CRITICAL) {
    return `Affaire critique: ${daysSinceActivity} jours d'inactivité`
  }
  if (daysSinceActivity >= INACTIVITY_THRESHOLDS.HIGH) {
    return `Affaire en attente: ${daysSinceActivity} jours d'inactivité`
  }
  return `Affaire à suivre: ${daysSinceActivity} jours d'inactivité`
}

function buildInactiveAffaireDescription(
  affaire: { reference: string; client: { firstName: string; lastName: string } },
  daysSinceActivity: number
): string {
  const clientName = `${affaire.client.firstName} ${affaire.client.lastName}`
  return `L'affaire ${affaire.reference} pour ${clientName} n'a pas eu d'activité depuis ${daysSinceActivity} jours. Veuillez la reprendre ou la mettre en pause.`
}
