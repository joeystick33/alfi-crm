/**
 * Overview Utilities
 * 
 * Pure functions for Client 360 Overview tab logic.
 * These functions are designed to be testable with property-based testing.
 */

import type { KYCStatus } from '@prisma/client'

// ============================================================================
// KYC Alert Mapping Types
// ============================================================================

export type AlertType = 'critical' | 'warning' | 'success' | 'info'

export interface KYCAlert {
  type: AlertType
  title: string
  description: string
  badgeText: string
  badgeVariant: 'destructive' | 'warning' | 'success' | 'default'
}

// ============================================================================
// Timeline Event Types
// ============================================================================

export interface TimelineEvent {
  id: string
  title: string
  description?: string | null
  createdAt: Date | string
  type?: string
}

// ============================================================================
// Simulation Status Types
// ============================================================================

export type SimulationStatus = 'BROUILLON' | 'TERMINE' | 'PARTAGE' | 'ARCHIVE'

export type BadgeVariant = 'secondary' | 'success' | 'default' | 'warning'

export interface SimulationStatusBadge {
  variant: BadgeVariant
  label: string
}

// ============================================================================
// KYC Alert Mapping Functions
// ============================================================================

/**
 * Maps KYC status to alert configuration
 * 
 * **Feature: client360-repair, Property 10: KYC alert mapping**
 * **Validates: Requirements 4.3, 4.4**
 * 
 * For any KYC status, the alert type SHALL be:
 * - EXPIRED → critical
 * - PENDING → warning
 * - COMPLETED → success
 * 
 * @param kycStatus - The KYC status to map
 * @returns The alert configuration or null if status is not recognized
 */
export function mapKYCStatusToAlert(kycStatus: KYCStatus | string | null | undefined): KYCAlert | null {
  if (!kycStatus) {
    return null
  }

  switch (kycStatus) {
    case 'EXPIRE':
      return {
        type: 'critical',
        title: 'KYC expiré',
        description: 'Le KYC de ce client a expiré et doit être renouvelé',
        badgeText: 'Urgent',
        badgeVariant: 'destructive',
      }
    case 'EN_ATTENTE':
      return {
        type: 'warning',
        title: 'KYC incomplet',
        description: "Le KYC de ce client n'est pas encore complété",
        badgeText: 'À faire',
        badgeVariant: 'warning',
      }
    case 'TERMINE':
      return {
        type: 'success',
        title: 'KYC à jour',
        description: 'Le KYC de ce client est complet et à jour',
        badgeText: 'OK',
        badgeVariant: 'success',
      }
    case 'EN_COURS':
      return {
        type: 'info',
        title: 'KYC en cours',
        description: 'Le KYC de ce client est en cours de traitement',
        badgeText: 'En cours',
        badgeVariant: 'default',
      }
    default:
      return null
  }
}

/**
 * Gets the alert type for a KYC status
 * 
 * @param kycStatus - The KYC status
 * @returns The alert type or null
 */
export function getKYCAlertType(kycStatus: KYCStatus | string | null | undefined): AlertType | null {
  const alert = mapKYCStatusToAlert(kycStatus)
  return alert?.type ?? null
}

// ============================================================================
// Timeline Event Functions
// ============================================================================

/**
 * Limits and sorts timeline events
 * 
 * **Feature: client360-repair, Property 11: Timeline event limiting**
 * **Validates: Requirements 4.5**
 * 
 * For any list of timeline events:
 * - The displayed list SHALL contain at most 5 events
 * - Events SHALL be sorted by creation date descending
 * 
 * @param events - Array of timeline events
 * @param limit - Maximum number of events to return (default: 5)
 * @returns Limited and sorted array of events
 */
export function limitTimelineEvents<T extends TimelineEvent>(
  events: T[] | null | undefined,
  limit: number = 5
): T[] {
  if (!events || !Array.isArray(events)) {
    return []
  }

  // Sort by createdAt descending (most recent first)
  const sorted = [...events].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime()
    const dateB = new Date(b.createdAt).getTime()
    return dateB - dateA
  })

  // Return at most 'limit' events
  return sorted.slice(0, limit)
}

/**
 * Checks if timeline events are properly limited
 * 
 * @param events - Original events array
 * @param limitedEvents - Limited events array
 * @param limit - The limit that was applied
 * @returns True if the limiting was done correctly
 */
export function isTimelineProperlyLimited<T extends TimelineEvent>(
  events: T[] | null | undefined,
  limitedEvents: T[],
  limit: number = 5
): boolean {
  if (!events || events.length === 0) {
    return limitedEvents.length === 0
  }

  // Check that we have at most 'limit' events
  if (limitedEvents.length > limit) {
    return false
  }

  // Check that we have the correct number of events
  const expectedLength = Math.min(events.length, limit)
  if (limitedEvents.length !== expectedLength) {
    return false
  }

  // Check that events are sorted by date descending
  for (let i = 1; i < limitedEvents.length; i++) {
    const prevDate = new Date(limitedEvents[i - 1].createdAt).getTime()
    const currDate = new Date(limitedEvents[i].createdAt).getTime()
    if (prevDate < currDate) {
      return false
    }
  }

  return true
}

// ============================================================================
// Simulation Status Badge Functions
// ============================================================================

/**
 * Maps simulation status to badge configuration
 * 
 * **Feature: client360-repair, Property 12: Simulation status badge mapping**
 * **Validates: Requirements 5.2**
 * 
 * For any simulation status, the badge variant SHALL be:
 * - DRAFT → secondary
 * - COMPLETED → success
 * - SHARED → default
 * - ARCHIVED → warning
 * 
 * @param status - The simulation status
 * @returns The badge configuration
 */
export function mapSimulationStatusToBadge(status: SimulationStatus | string | null | undefined): SimulationStatusBadge {
  const statusLabels: Record<string, string> = {
    DRAFT: 'Brouillon',
    COMPLETED: 'Terminée',
    SHARED: 'Partagée',
    ARCHIVED: 'Archivée',
  }

  const statusVariants: Record<string, BadgeVariant> = {
    DRAFT: 'secondary',
    COMPLETED: 'success',
    SHARED: 'default',
    ARCHIVED: 'warning',
  }

  const normalizedStatus = status || 'BROUILLON'
  
  return {
    variant: statusVariants[normalizedStatus] || 'default',
    label: statusLabels[normalizedStatus] || normalizedStatus,
  }
}

/**
 * Gets the badge variant for a simulation status
 * 
 * @param status - The simulation status
 * @returns The badge variant
 */
export function getSimulationBadgeVariant(status: SimulationStatus | string | null | undefined): BadgeVariant {
  return mapSimulationStatusToBadge(status).variant
}

/**
 * Gets the badge label for a simulation status
 * 
 * @param status - The simulation status
 * @returns The badge label
 */
export function getSimulationBadgeLabel(status: SimulationStatus | string | null | undefined): string {
  return mapSimulationStatusToBadge(status).label
}
