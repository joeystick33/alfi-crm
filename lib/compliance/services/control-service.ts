/**
 * Service de gestion des contrôles ACPR
 * 
 * Ce service gère le cycle de vie des contrôles de conformité ACPR:
 * - Création de contrôles avec type, priorité et date d'échéance
 * - Complétion des contrôles avec calcul automatique du niveau de risque
 * - Détection des contrôles en retard
 * - Récupération des contrôles par client avec filtres
 * 
 * @module lib/compliance/services/control-service
 * @requirements 4.1-4.7
 */

import { prisma } from '@/app/_common/lib/prisma'
import {
  calculateRiskLevel,
  isControlOverdue,
  type ControlType,
  type ControlStatus,
  type ControlPriority,
  type RiskLevel,
  CONTROL_TYPE_LABELS,
  CONTROL_STATUS_LABELS,
  CONTROL_PRIORITY_LABELS,
  RISK_LEVEL_LABELS,
} from '../types'
import {
  createControlSchema,
  completeControlSchema,
  controlFiltersSchema,
  type CreateControlInput,
  type CompleteControlInput,
  type ControlFiltersInput,
} from '../schemas'

// ============================================================================
// Types
// ============================================================================

export interface ControlServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface ComplianceControlWithRelations {
  id: string
  cabinetId: string
  clientId: string
  type: string
  status: string
  priority: string
  description: string | null
  findings: string | null
  recommendations: string | null
  dueDate: Date
  completedAt: Date | null
  completedById: string | null
  isACPRMandatory: boolean
  score: number | null
  riskLevel: string | null
  createdAt: Date
  updatedAt: Date
  client: {
    id: string
    firstName: string
    lastName: string
    email: string | null
  }
  completedBy?: {
    id: string
    firstName: string
    lastName: string
  } | null
}

// ============================================================================
// Control Service
// ============================================================================

/**
 * Crée un nouveau contrôle ACPR
 * 
 * @requirements 4.2 - WHEN creating a control, THE Control_Manager SHALL require: client, type, due date, priority, description
 */
export async function createControl(
  input: CreateControlInput
): Promise<ControlServiceResult<ComplianceControlWithRelations>> {
  try {
    // Validate input
    const validatedInput = createControlSchema.parse(input)

    // Create control with status EN_ATTENTE
    const control = await prisma.kYCCheck.create({
      data: {
        cabinetId: validatedInput.cabinetId,
        clientId: validatedInput.clientId,
        type: validatedInput.type,
        status: 'EN_ATTENTE',
        priority: validatedInput.priority,
        description: validatedInput.description ?? null,
        dueDate: validatedInput.dueDate,
        isACPRMandatory: validatedInput.isACPRMandatory ?? false,
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
      data: control as unknown as ComplianceControlWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la création du contrôle'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Complète un contrôle avec les conclusions et le score de risque
 * 
 * @requirements 4.3 - WHEN completing a control, THE Control_Manager SHALL require: findings, risk score (0-100), risk level
 * @requirements 4.4 - THE Control_Manager SHALL calculate risk level automatically based on score
 */
export async function completeControl(
  input: CompleteControlInput
): Promise<ControlServiceResult<ComplianceControlWithRelations>> {
  try {
    // Validate input
    const validatedInput = completeControlSchema.parse(input)

    // Check if control exists
    const existingControl = await prisma.kYCCheck.findUnique({
      where: { id: validatedInput.controlId },
    })

    if (!existingControl) {
      return {
        success: false,
        error: 'Contrôle non trouvé',
      }
    }

    // Only controls in EN_ATTENTE or EN_COURS status can be completed
    if (existingControl.status !== 'EN_ATTENTE' && existingControl.status !== 'EN_COURS') {
      return {
        success: false,
        error: `Impossible de compléter un contrôle avec le statut "${existingControl.status}"`,
      }
    }

    // Calculate risk level from score (requirement 4.4)
    const riskLevel = calculateRiskLevel(validatedInput.score)

    // Update control
    const control = await prisma.kYCCheck.update({
      where: { id: validatedInput.controlId },
      data: {
        status: 'TERMINE',
        findings: validatedInput.findings,
        recommendations: validatedInput.recommendations ?? null,
        score: validatedInput.score,
        riskLevel,
        completedAt: new Date(),
        completedById: validatedInput.completedById,
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
        completedBy: {
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
      data: control as unknown as ComplianceControlWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la complétion du contrôle'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les contrôles d'un client avec filtres optionnels
 * 
 * @requirements 4.6 - THE Control_Manager SHALL display controls in a filterable table
 * @requirements 4.7 - WHEN filtering controls, THE Control_Manager SHALL support filters by: status, type, priority, ACPR mandatory flag, overdue only
 */
export async function getControlsByClient(
  cabinetId: string,
  clientId: string,
  filters?: ControlFiltersInput
): Promise<ControlServiceResult<ComplianceControlWithRelations[]>> {
  try {
    // Build where clause
    const where: Record<string, unknown> = {
      cabinetId,
      clientId,
    }

    if (filters) {
      const validatedFilters = controlFiltersSchema.parse(filters)

      if (validatedFilters.status && validatedFilters.status.length > 0) {
        where.status = { in: validatedFilters.status }
      }

      if (validatedFilters.type && validatedFilters.type.length > 0) {
        where.type = { in: validatedFilters.type }
      }

      if (validatedFilters.priority && validatedFilters.priority.length > 0) {
        where.priority = { in: validatedFilters.priority }
      }

      if (validatedFilters.isACPRMandatory !== undefined) {
        where.isACPRMandatory = validatedFilters.isACPRMandatory
      }

      if (validatedFilters.overdueOnly) {
        where.dueDate = { lt: new Date() }
        where.status = { not: 'TERMINE' }
      }
    }

    const controls = await prisma.kYCCheck.findMany({
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
        completedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' },
      ],
    })

    return {
      success: true,
      data: controls as unknown as ComplianceControlWithRelations[],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des contrôles'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère tous les contrôles d'un cabinet avec filtres optionnels
 */
export async function getControlsByCabinet(
  cabinetId: string,
  filters?: ControlFiltersInput
): Promise<ControlServiceResult<ComplianceControlWithRelations[]>> {
  try {
    // Build where clause
    const where: Record<string, unknown> = {
      cabinetId,
    }

    if (filters) {
      const validatedFilters = controlFiltersSchema.parse(filters)

      if (validatedFilters.clientId) {
        where.clientId = validatedFilters.clientId
      }

      if (validatedFilters.status && validatedFilters.status.length > 0) {
        where.status = { in: validatedFilters.status }
      }

      if (validatedFilters.type && validatedFilters.type.length > 0) {
        where.type = { in: validatedFilters.type }
      }

      if (validatedFilters.priority && validatedFilters.priority.length > 0) {
        where.priority = { in: validatedFilters.priority }
      }

      if (validatedFilters.isACPRMandatory !== undefined) {
        where.isACPRMandatory = validatedFilters.isACPRMandatory
      }

      if (validatedFilters.overdueOnly) {
        where.dueDate = { lt: new Date() }
        where.status = { not: 'TERMINE' }
      }
    }

    const controls = await prisma.kYCCheck.findMany({
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
        completedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' },
      ],
    })

    return {
      success: true,
      data: controls as unknown as ComplianceControlWithRelations[],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des contrôles'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Met à jour le statut des contrôles en retard
 * 
 * @requirements 4.5 - WHEN a control due date is passed and status is not "Completed", THE Control_Manager SHALL mark it as "Overdue"
 */
export async function updateOverdueControls(
  cabinetId: string
): Promise<ControlServiceResult<{ updatedCount: number }>> {
  try {
    const now = new Date()

    // Find all controls that are overdue but not yet marked as EN_RETARD
    const result = await prisma.kYCCheck.updateMany({
      where: {
        cabinetId,
        status: { in: ['EN_ATTENTE', 'EN_COURS'] },
        dueDate: { lt: now },
      },
      data: {
        status: 'EN_RETARD',
      },
    })

    return {
      success: true,
      data: { updatedCount: result.count },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour des contrôles en retard'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les contrôles en retard
 */
export async function getOverdueControls(
  cabinetId: string
): Promise<ControlServiceResult<ComplianceControlWithRelations[]>> {
  try {
    const now = new Date()

    const controls = await prisma.kYCCheck.findMany({
      where: {
        cabinetId,
        status: { in: ['EN_ATTENTE', 'EN_COURS', 'EN_RETARD'] },
        dueDate: { lt: now },
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
        completedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    })

    return {
      success: true,
      data: controls as unknown as ComplianceControlWithRelations[],
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des contrôles en retard'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère un contrôle par son ID
 */
export async function getControlById(
  controlId: string
): Promise<ControlServiceResult<ComplianceControlWithRelations>> {
  try {
    const control = await prisma.kYCCheck.findUnique({
      where: { id: controlId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        completedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!control) {
      return {
        success: false,
        error: 'Contrôle non trouvé',
      }
    }

    return {
      success: true,
      data: control as unknown as ComplianceControlWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération du contrôle'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Met à jour le statut d'un contrôle en EN_COURS
 */
export async function startControl(
  controlId: string
): Promise<ControlServiceResult<ComplianceControlWithRelations>> {
  try {
    const existingControl = await prisma.kYCCheck.findUnique({
      where: { id: controlId },
    })

    if (!existingControl) {
      return {
        success: false,
        error: 'Contrôle non trouvé',
      }
    }

    if (existingControl.status !== 'EN_ATTENTE') {
      return {
        success: false,
        error: `Impossible de démarrer un contrôle avec le statut "${existingControl.status}"`,
      }
    }

    const control = await prisma.kYCCheck.update({
      where: { id: controlId },
      data: {
        status: 'EN_COURS',
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
      data: control as unknown as ComplianceControlWithRelations,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du démarrage du contrôle'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Compte les contrôles par statut
 */
export async function countControlsByStatus(
  cabinetId: string
): Promise<ControlServiceResult<Record<ControlStatus, number>>> {
  try {
    const counts = await prisma.kYCCheck.groupBy({
      by: ['status'],
      where: { cabinetId },
      _count: { id: true },
    })

    const result: Record<ControlStatus, number> = {
      EN_ATTENTE: 0,
      EN_COURS: 0,
      TERMINE: 0,
      EN_RETARD: 0,
    }

    for (const count of counts) {
      result[count.status as ControlStatus] = count._count.id
    }

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du comptage des contrôles'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Obtient le label français d'un type de contrôle
 */
export function getControlTypeLabel(type: ControlType): string {
  return CONTROL_TYPE_LABELS[type]
}

/**
 * Obtient le label français d'un statut de contrôle
 */
export function getControlStatusLabel(status: ControlStatus): string {
  return CONTROL_STATUS_LABELS[status]
}

/**
 * Obtient le label français d'une priorité de contrôle
 */
export function getControlPriorityLabel(priority: ControlPriority): string {
  return CONTROL_PRIORITY_LABELS[priority]
}

/**
 * Obtient le label français d'un niveau de risque
 */
export function getRiskLevelLabel(riskLevel: RiskLevel): string {
  return RISK_LEVEL_LABELS[riskLevel]
}
