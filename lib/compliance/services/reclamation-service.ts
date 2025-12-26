/**
 * Service de gestion des réclamations
 * 
 * Ce service gère le cycle de vie des réclamations clients:
 * - Création de réclamations avec génération de référence unique
 * - Mise à jour du statut avec validation des transitions
 * - Résolution des réclamations avec réponse obligatoire
 * - Calcul SLA et détection de breach
 * 
 * @module lib/compliance/services/reclamation-service
 * @requirements 5.1-5.8
 */

import { prisma } from '@/app/_common/lib/prisma'
import { SLASeverity as PrismaSLASeverity } from '@prisma/client'
import {
  calculateSLADeadline,
  isSLABreached,
  isValidReclamationTransition,
  generateReclamationReference,
  type ReclamationType,
  type ReclamationStatus,
  type SLASeverity,
  RECLAMATION_TYPE_LABELS,
  RECLAMATION_STATUS_LABELS,
  SLA_SEVERITY_LABELS,
  SLA_DEADLINES,
} from '../types'

// ============================================================================
// Mapping between TypeScript SLASeverity and Prisma SLASeverity
// TypeScript uses English values, Prisma uses French values
// ============================================================================

const SLA_SEVERITY_TO_PRISMA: Record<SLASeverity, PrismaSLASeverity> = {
  LOW: 'BASSE',
  MEDIUM: 'MOYENNE',
  HIGH: 'HAUTE',
  CRITICAL: 'CRITIQUE',
}

const PRISMA_TO_SLA_SEVERITY: Record<PrismaSLASeverity, SLASeverity> = {
  BASSE: 'LOW',
  MOYENNE: 'MEDIUM',
  HAUTE: 'HIGH',
  CRITIQUE: 'CRITICAL',
}
import {
  createReclamationSchema,
  updateReclamationStatusSchema,
  resolveReclamationSchema,
  reclamationFiltersSchema,
  type CreateReclamationInput,
  type UpdateReclamationStatusInput,
  type ResolveReclamationInput,
  type ReclamationFiltersInput,
} from '../schemas'

// ============================================================================
// Types
// ============================================================================

export interface ReclamationServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface ReclamationWithRelations {
  id: string
  cabinetId: string
  clientId: string
  reference: string
  subject: string
  description: string
  type: string
  status: string
  severity: string
  assignedToId: string | null
  responseText: string | null
  internalNotes: string | null
  resolutionDate: Date | null
  receivedAt: Date
  deadline: Date
  slaDeadline: Date
  slaBreach: boolean
  slaBreachAt: Date | null
  createdAt: Date
  updatedAt: Date
  client: {
    id: string
    firstName: string
    lastName: string
    email: string | null
  }
  assignedTo?: {
    id: string
    firstName: string
    lastName: string
  } | null
}

// ============================================================================
// Reclamation Service
// ============================================================================

/**
 * Génère le prochain numéro de séquence pour les références de réclamation
 */
async function getNextSequenceNumber(cabinetId: string): Promise<number> {
  const year = new Date().getFullYear()
  const prefix = `REC-${year}-`

  // Find the highest sequence number for this year
  const lastReclamation = await prisma.reclamation.findFirst({
    where: {
      cabinetId,
      reference: { startsWith: prefix },
    },
    orderBy: { reference: 'desc' },
    select: { reference: true },
  })

  if (!lastReclamation) {
    return 1
  }

  // Extract sequence number from reference (REC-YYYY-NNNN)
  const sequenceStr = lastReclamation.reference.split('-')[2]
  const lastSequence = parseInt(sequenceStr, 10)

  return lastSequence + 1
}

/**
 * Crée une nouvelle réclamation
 * 
 * @requirements 5.1 - THE Reclamation_Handler SHALL support complaint types
 * @requirements 5.2 - WHEN creating a reclamation, THE Reclamation_Handler SHALL generate a unique reference number (format: REC-YYYY-NNNN)
 * @requirements 5.3 - WHEN creating a reclamation, THE Reclamation_Handler SHALL calculate SLA deadline based on severity
 */
export async function createReclamation(
  input: CreateReclamationInput
): Promise<ReclamationServiceResult<ReclamationWithRelations>> {
  try {
    // Validate input
    const validatedInput = createReclamationSchema.parse(input)

    // Generate unique reference number
    const sequenceNumber = await getNextSequenceNumber(validatedInput.cabinetId)
    const reference = generateReclamationReference(sequenceNumber)

    // Calculate SLA deadline based on severity
    const receivedAt = new Date()
    const slaDeadline = calculateSLADeadline(validatedInput.severity as SLASeverity, receivedAt)

    // Create reclamation with status RECUE
    const reclamation = await prisma.reclamation.create({
      data: {
        cabinetId: validatedInput.cabinetId,
        clientId: validatedInput.clientId,
        reference,
        subject: validatedInput.subject,
        description: validatedInput.description,
        type: validatedInput.type,
        status: 'RECUE',
        severity: SLA_SEVERITY_TO_PRISMA[validatedInput.severity as SLASeverity],
        assignedToId: validatedInput.assignedToId ?? null,
        internalNotes: validatedInput.internalNotes ?? null,
        receivedAt,
        deadline: slaDeadline,
        slaDeadline,
        slaBreach: false,
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
        assignedTo: {
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
      data: reclamation as unknown as ReclamationWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la création de la réclamation'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Met à jour le statut d'une réclamation
 * 
 * @requirements 5.4 - THE Reclamation_Handler SHALL track status through workflow: Received → In Progress → Waiting Info → Resolved → Closed
 */
export async function updateStatus(
  input: UpdateReclamationStatusInput
): Promise<ReclamationServiceResult<ReclamationWithRelations>> {
  try {
    // Validate input
    const validatedInput = updateReclamationStatusSchema.parse(input)

    // Check if reclamation exists
    const existingReclamation = await prisma.reclamation.findUnique({
      where: { id: validatedInput.reclamationId },
    })

    if (!existingReclamation) {
      return {
        success: false,
        error: 'Réclamation non trouvée',
      }
    }

    // Validate status transition
    const currentStatus = existingReclamation.status as ReclamationStatus
    const newStatus = validatedInput.newStatus as ReclamationStatus

    if (!isValidReclamationTransition(currentStatus, newStatus)) {
      return {
        success: false,
        error: `Transition de statut invalide: ${currentStatus} → ${newStatus}`,
      }
    }

    // Update reclamation
    const reclamation = await prisma.reclamation.update({
      where: { id: validatedInput.reclamationId },
      data: {
        status: newStatus,
        internalNotes: validatedInput.note
          ? `${existingReclamation.internalNotes || ''}\n[${new Date().toISOString()}] ${validatedInput.note}`
          : existingReclamation.internalNotes,
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
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Create SLA event for status change
    await prisma.sLAEvent.create({
      data: {
        reclamationId: validatedInput.reclamationId,
        type: 'STATUT_MODIFIE',
        description: `Statut modifié: ${currentStatus} → ${newStatus}${validatedInput.note ? ` - ${validatedInput.note}` : ''}`,
        userId: validatedInput.userId,
      },
    })

    return {
      success: true,
      data: reclamation as unknown as ReclamationWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour du statut'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Résout une réclamation
 * 
 * @requirements 5.6 - WHEN resolving a reclamation, THE Reclamation_Handler SHALL require a response text
 */
export async function resolveReclamation(
  input: ResolveReclamationInput
): Promise<ReclamationServiceResult<ReclamationWithRelations>> {
  try {
    // Validate input - response text is required by schema
    const validatedInput = resolveReclamationSchema.parse(input)

    // Check if reclamation exists
    const existingReclamation = await prisma.reclamation.findUnique({
      where: { id: validatedInput.reclamationId },
    })

    if (!existingReclamation) {
      return {
        success: false,
        error: 'Réclamation non trouvée',
      }
    }

    // Only reclamations in EN_COURS status can be resolved
    if (existingReclamation.status !== 'EN_COURS') {
      return {
        success: false,
        error: `Impossible de résoudre une réclamation avec le statut "${existingReclamation.status}"`,
      }
    }

    // Update reclamation
    const reclamation = await prisma.reclamation.update({
      where: { id: validatedInput.reclamationId },
      data: {
        status: 'RESOLUE',
        responseText: validatedInput.responseText,
        internalNotes: validatedInput.internalNotes
          ? `${existingReclamation.internalNotes || ''}\n[${new Date().toISOString()}] ${validatedInput.internalNotes}`
          : existingReclamation.internalNotes,
        resolutionDate: new Date(),
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
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Create SLA event for resolution
    await prisma.sLAEvent.create({
      data: {
        reclamationId: validatedInput.reclamationId,
        type: 'RESOLU',
        description: 'Réclamation résolue',
      },
    })

    return {
      success: true,
      data: reclamation as unknown as ReclamationWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la résolution de la réclamation'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les réclamations d'un client avec filtres optionnels
 * 
 * @requirements 5.7 - THE Reclamation_Handler SHALL display reclamations in a filterable table
 * @requirements 5.8 - WHEN filtering reclamations, THE Reclamation_Handler SHALL support filters by: status, type, SLA breach flag, date range
 */
export async function getReclamationsByClient(
  cabinetId: string,
  clientId: string,
  filters?: ReclamationFiltersInput
): Promise<ReclamationServiceResult<ReclamationWithRelations[]>> {
  try {
    // Build where clause
    const where: Record<string, unknown> = {
      cabinetId,
      clientId,
    }

    if (filters) {
      const validatedFilters = reclamationFiltersSchema.parse(filters)

      if (validatedFilters.status && validatedFilters.status.length > 0) {
        where.status = { in: validatedFilters.status }
      }

      if (validatedFilters.type && validatedFilters.type.length > 0) {
        where.type = { in: validatedFilters.type }
      }

      if (validatedFilters.slaBreachOnly) {
        where.slaBreach = true
      }

      if (validatedFilters.dateFrom || validatedFilters.dateTo) {
        where.receivedAt = {}
        if (validatedFilters.dateFrom) {
          (where.receivedAt as Record<string, Date>).gte = validatedFilters.dateFrom
        }
        if (validatedFilters.dateTo) {
          (where.receivedAt as Record<string, Date>).lte = validatedFilters.dateTo
        }
      }
    }

    const reclamations = await prisma.reclamation.findMany({
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
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { slaBreach: 'desc' },
        { slaDeadline: 'asc' },
      ],
    })

    return {
      success: true,
      data: reclamations as unknown as ReclamationWithRelations[],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des réclamations'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère toutes les réclamations d'un cabinet avec filtres optionnels
 */
export async function getReclamationsByCabinet(
  cabinetId: string,
  filters?: ReclamationFiltersInput
): Promise<ReclamationServiceResult<ReclamationWithRelations[]>> {
  try {
    // Build where clause
    const where: Record<string, unknown> = {
      cabinetId,
    }

    if (filters) {
      const validatedFilters = reclamationFiltersSchema.parse(filters)

      if (validatedFilters.clientId) {
        where.clientId = validatedFilters.clientId
      }

      if (validatedFilters.status && validatedFilters.status.length > 0) {
        where.status = { in: validatedFilters.status }
      }

      if (validatedFilters.type && validatedFilters.type.length > 0) {
        where.type = { in: validatedFilters.type }
      }

      if (validatedFilters.slaBreachOnly) {
        where.slaBreach = true
      }

      if (validatedFilters.dateFrom || validatedFilters.dateTo) {
        where.receivedAt = {}
        if (validatedFilters.dateFrom) {
          (where.receivedAt as Record<string, Date>).gte = validatedFilters.dateFrom
        }
        if (validatedFilters.dateTo) {
          (where.receivedAt as Record<string, Date>).lte = validatedFilters.dateTo
        }
      }
    }

    const reclamations = await prisma.reclamation.findMany({
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
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { slaBreach: 'desc' },
        { slaDeadline: 'asc' },
      ],
    })

    return {
      success: true,
      data: reclamations as unknown as ReclamationWithRelations[],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des réclamations'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Met à jour le statut SLA breach des réclamations
 * 
 * @requirements 5.5 - WHEN SLA deadline is passed and status is not "Resolved" or "Closed", THE Reclamation_Handler SHALL mark as "SLA Breach"
 */
export async function updateSLABreaches(
  cabinetId: string
): Promise<ReclamationServiceResult<{ updatedCount: number }>> {
  try {
    const now = new Date()

    // Find all reclamations that have breached SLA but not yet marked
    const result = await prisma.reclamation.updateMany({
      where: {
        cabinetId,
        status: { notIn: ['RESOLUE', 'CLOTUREE'] },
        slaDeadline: { lt: now },
        slaBreach: false,
      },
      data: {
        slaBreach: true,
        slaBreachAt: now,
      },
    })

    return {
      success: true,
      data: { updatedCount: result.count },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour des SLA breaches'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère une réclamation par son ID
 */
export async function getReclamationById(
  reclamationId: string
): Promise<ReclamationServiceResult<ReclamationWithRelations>> {
  try {
    const reclamation = await prisma.reclamation.findUnique({
      where: { id: reclamationId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!reclamation) {
      return {
        success: false,
        error: 'Réclamation non trouvée',
      }
    }

    return {
      success: true,
      data: reclamation as unknown as ReclamationWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération de la réclamation'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère une réclamation par sa référence
 */
export async function getReclamationByReference(
  reference: string
): Promise<ReclamationServiceResult<ReclamationWithRelations>> {
  try {
    const reclamation = await prisma.reclamation.findUnique({
      where: { reference },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!reclamation) {
      return {
        success: false,
        error: 'Réclamation non trouvée',
      }
    }

    return {
      success: true,
      data: reclamation as unknown as ReclamationWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération de la réclamation'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Compte les réclamations par statut
 */
export async function countReclamationsByStatus(
  cabinetId: string
): Promise<ReclamationServiceResult<Record<ReclamationStatus, number>>> {
  try {
    const counts = await prisma.reclamation.groupBy({
      by: ['status'],
      where: { cabinetId },
      _count: { id: true },
    })

    const result: Record<ReclamationStatus, number> = {
      RECUE: 0,
      EN_COURS: 0,
      EN_ATTENTE_INFO: 0,
      RESOLUE: 0,
      CLOTUREE: 0,
    }

    for (const count of counts) {
      result[count.status as ReclamationStatus] = count._count.id
    }

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du comptage des réclamations'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Calcule le taux de breach SLA
 */
export async function calculateSLABreachRate(
  cabinetId: string
): Promise<ReclamationServiceResult<number>> {
  try {
    const [total, breached] = await Promise.all([
      prisma.reclamation.count({ where: { cabinetId } }),
      prisma.reclamation.count({ where: { cabinetId, slaBreach: true } }),
    ])

    if (total === 0) {
      return { success: true, data: 0 }
    }

    const rate = (breached / total) * 100

    return {
      success: true,
      data: Math.round(rate * 100) / 100, // Round to 2 decimal places
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du calcul du taux de breach SLA'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Obtient le label français d'un type de réclamation
 */
export function getReclamationTypeLabel(type: ReclamationType): string {
  return RECLAMATION_TYPE_LABELS[type]
}

/**
 * Obtient le label français d'un statut de réclamation
 */
export function getReclamationStatusLabel(status: ReclamationStatus): string {
  return RECLAMATION_STATUS_LABELS[status]
}

/**
 * Obtient le label français d'une sévérité SLA
 */
export function getSLASeverityLabel(severity: SLASeverity): string {
  return SLA_SEVERITY_LABELS[severity]
}

/**
 * Obtient le délai SLA en jours pour une sévérité donnée
 */
export function getSLADeadlineDays(severity: SLASeverity): number {
  return SLA_DEADLINES[severity]
}
