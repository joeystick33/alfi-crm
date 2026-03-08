/**
 * Service de gestion des Opérations de Gestion
 * 
 * Ce service gère le cycle de vie complet des opérations de gestion post-vente:
 * - Création d'opérations avec génération de référence unique
 * - Mise à jour du statut avec validation des transitions
 * - Récupération des opérations par contrat avec filtres
 * - Gestion des détails spécifiques par type (arbitrage, rachat, versement)
 * 
 * @module lib/operations/services/operation-gestion-service
 * @requirements 21.1-21.7
 */

import { prisma } from '@/app/_common/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  type OperationGestionType,
  type OperationGestionStatus,
  isValidOperationGestionTransition,
  OPERATION_GESTION_STATUS_LABELS,
  OPERATION_GESTION_TYPE_LABELS,
} from '../types'
import {
  createOperationGestionSchema,
  updateOperationGestionStatusSchema,
  operationGestionFiltersSchema,
  type CreateOperationGestionInput,
  type UpdateOperationGestionStatusInput,
  type OperationGestionFiltersInput,
} from '../schemas'

// ============================================================================
// Types
// ============================================================================

export interface OperationGestionServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface OperationGestionWithRelations {
  id: string
  cabinetId: string
  reference: string
  clientId: string
  contractId: string
  affaireOrigineId: string
  type: string
  status: string
  amount: number | null
  effectiveDate: Date | null
  operationDetails: unknown
  rejectionReason: string | null
  executedAt: Date | null
  createdById: string
  createdAt: Date
  updatedAt: Date
  client: {
    id: string
    firstName: string
    lastName: string
    email: string | null
  }
  affaireOrigine: {
    id: string
    reference: string
    productType: string
    provider: {
      id: string
      name: string
    }
  }
  createdBy: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface OperationStatusHistoryEntry {
  id: string
  operationId: string
  fromStatus: string | null
  toStatus: string
  note: string | null
  userId: string
  createdAt: Date
  user: {
    id: string
    firstName: string
    lastName: string
  }
}

// ============================================================================
// Reference Number Generation
// ============================================================================

/**
 * Génère une référence unique pour une opération de gestion
 * Format: OG-YYYY-NNNN
 * 
 * @requirements 21.1 - THE Operations_Manager SHALL support operation types with unique references
 */
async function generateOperationReference(cabinetId: string): Promise<string> {
  const year = new Date().getFullYear()
  
  // Count existing operations for this cabinet in the current year
  const count = await prisma.operationGestion.count({
    where: {
      cabinetId,
      reference: {
        startsWith: `OG-${year}-`,
      },
    },
  })
  
  const sequenceNumber = count + 1
  const paddedSequence = sequenceNumber.toString().padStart(4, '0')
  return `OG-${year}-${paddedSequence}`
}

async function generateAffaireReference(cabinetId: string): Promise<string> {
  const year = new Date().getFullYear()
  const count = await prisma.affaireNouvelle.count({
    where: {
      cabinetId,
      reference: {
        startsWith: `AN-${year}-`,
      },
    },
  })
  const sequenceNumber = count + 1
  const paddedSequence = sequenceNumber.toString().padStart(4, '0')
  return `AN-${year}-${paddedSequence}`
}

// ============================================================================
// Operation Gestion Service
// ============================================================================

/**
 * Crée une nouvelle opération de gestion
 * 
 * @requirements 21.2 - WHEN creating an Opération de Gestion, THE Operations_Manager SHALL require client, contract, type, amount, effective date
 */
export async function createOperation(
  input: CreateOperationGestionInput
): Promise<OperationGestionServiceResult<OperationGestionWithRelations>> {
  try {
    // Validate input
    const validatedInput = createOperationGestionSchema.parse(input)

    let affaireOrigineId = validatedInput.affaireOrigineId

    const affaireOrigine = await prisma.affaireNouvelle.findUnique({
      where: { id: affaireOrigineId },
      select: { id: true },
    })

    if (!affaireOrigine) {
      const contrat = await prisma.contrat.findFirst({
        where: {
          id: affaireOrigineId,
          cabinetId: validatedInput.cabinetId,
          clientId: validatedInput.clientId,
        },
      })

      if (!contrat) {
        return {
          success: false,
          error: 'Affaire d\'origine non trouvée',
        }
      }

      const resolvedProductType =
        contrat.type === 'ASSURANCE_VIE'
          ? 'ASSURANCE_VIE'
          : contrat.type === 'EPARGNE_RETRAITE'
            ? 'PER_INDIVIDUEL'
            : null

      if (!resolvedProductType) {
        return {
          success: false,
          error: 'Type de contrat incompatible avec une opération de gestion',
        }
      }

      let provider = await prisma.operationProvider.findFirst({
        where: {
          cabinetId: validatedInput.cabinetId,
          name: {
            equals: contrat.provider,
            mode: 'insensitive',
          },
        },
      })

      if (!provider) {
        provider = await prisma.operationProvider.create({
          data: {
            cabinetId: validatedInput.cabinetId,
            name: contrat.provider,
            type: 'ASSUREUR',
            conventionStatus: 'ACTIVE',
            isFavorite: false,
          },
        })
      }

      const existingAffaire = await prisma.affaireNouvelle.findFirst({
        where: {
          cabinetId: validatedInput.cabinetId,
          clientId: validatedInput.clientId,
          providerId: provider.id,
          status: 'VALIDE',
          productType: resolvedProductType as any,
        },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
      })

      if (existingAffaire) {
        affaireOrigineId = existingAffaire.id
      } else {
        const reference = await generateAffaireReference(validatedInput.cabinetId)
        const amount = contrat.value ? new Prisma.Decimal(contrat.value) : new Prisma.Decimal(0)

        const createdAffaire = await prisma.affaireNouvelle.create({
          data: {
            cabinetId: validatedInput.cabinetId,
            reference,
            clientId: validatedInput.clientId,
            productType: resolvedProductType as any,
            providerId: provider.id,
            productId: null,
            status: 'VALIDE',
            source: 'CLIENT_EXISTANT',
            estimatedAmount: amount,
            actualAmount: amount,
            targetDate: null,
            productDetails: null,
            entryFees: null,
            managementFees: null,
            expectedCommission: null,
            lastActivityAt: new Date(),
            pausedAt: null,
            pauseReason: null,
            rejectionReason: null,
            cancellationReason: null,
            createdById: validatedInput.createdById,
          },
        })

        affaireOrigineId = createdAffaire.id
      }
    }

    // Generate unique reference
    const reference = await generateOperationReference(validatedInput.cabinetId)

    // Create operation with initial status BROUILLON
    const operation = await prisma.operationGestion.create({
      data: {
        cabinetId: validatedInput.cabinetId,
        reference,
        clientId: validatedInput.clientId,
        contractId: validatedInput.contractId,
        affaireOrigineId,
        type: validatedInput.type as OperationGestionType,
        status: 'BROUILLON',
        amount: validatedInput.amount ?? null,
        effectiveDate: validatedInput.effectiveDate ?? null,
        operationDetails: (validatedInput.operationDetails ?? null) as unknown as Prisma.InputJsonValue,
        createdById: validatedInput.createdById,
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
        affaireOrigine: {
          select: {
            id: true,
            reference: true,
            productType: true,
            provider: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Record initial status in history
    await prisma.operationStatusHistory.create({
      data: {
        operationId: operation.id,
        fromStatus: null,
        toStatus: 'BROUILLON',
        note: 'Création de l\'opération',
        userId: validatedInput.createdById,
      },
    })

    return {
      success: true,
      data: transformOperation(operation),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la création de l\'opération'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Met à jour le statut d'une opération de gestion avec validation des transitions
 * 
 * @requirements 21.3 - THE Operations_Manager SHALL track Opérations de Gestion through workflow
 */
export async function updateOperationStatus(
  input: UpdateOperationGestionStatusInput
): Promise<OperationGestionServiceResult<OperationGestionWithRelations>> {
  try {
    // Validate input
    const validatedInput = updateOperationGestionStatusSchema.parse(input)

    // Get current operation
    const existingOperation = await prisma.operationGestion.findUnique({
      where: { id: validatedInput.operationId },
    })

    if (!existingOperation) {
      return {
        success: false,
        error: 'Opération non trouvée',
      }
    }

    const currentStatus = existingOperation.status as OperationGestionStatus
    const newStatus = validatedInput.newStatus as OperationGestionStatus

    // Validate status transition
    if (!isValidOperationGestionTransition(currentStatus, newStatus)) {
      return {
        success: false,
        error: `Transition de statut invalide: ${OPERATION_GESTION_STATUS_LABELS[currentStatus]} → ${OPERATION_GESTION_STATUS_LABELS[newStatus]}`,
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status: newStatus,
    }

    // Handle specific status transitions
    if (newStatus === 'REJETE') {
      if (!validatedInput.rejectionReason) {
        return {
          success: false,
          error: 'La raison du rejet est obligatoire',
        }
      }
      updateData.rejectionReason = validatedInput.rejectionReason
    }

    if (newStatus === 'EXECUTE') {
      updateData.executedAt = new Date()
    }

    // Update operation
    const operation = await prisma.operationGestion.update({
      where: { id: validatedInput.operationId },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        affaireOrigine: {
          select: {
            id: true,
            reference: true,
            productType: true,
            provider: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Record status change in history
    await prisma.operationStatusHistory.create({
      data: {
        operationId: operation.id,
        fromStatus: currentStatus,
        toStatus: newStatus,
        note: validatedInput.note ?? null,
        userId: validatedInput.userId,
      },
    })

    return {
      success: true,
      data: transformOperation(operation),
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
 * Récupère les opérations de gestion par contrat
 */
export async function getOperationsByContract(
  cabinetId: string,
  contractId: string,
  filters?: OperationGestionFiltersInput
): Promise<OperationGestionServiceResult<OperationGestionWithRelations[]>> {
  try {
    const where = buildOperationWhereClause(cabinetId, { ...filters, contractId })

    const operations = await prisma.operationGestion.findMany({
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
        affaireOrigine: {
          select: {
            id: true,
            reference: true,
            productType: true,
            provider: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
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
      data: operations.map(transformOperation),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des opérations'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les opérations de gestion par client
 */
export async function getOperationsByClient(
  cabinetId: string,
  clientId: string,
  filters?: OperationGestionFiltersInput
): Promise<OperationGestionServiceResult<OperationGestionWithRelations[]>> {
  try {
    const where = buildOperationWhereClause(cabinetId, { ...filters, clientId })

    const operations = await prisma.operationGestion.findMany({
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
        affaireOrigine: {
          select: {
            id: true,
            reference: true,
            productType: true,
            provider: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
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
      data: operations.map(transformOperation),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des opérations'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère toutes les opérations de gestion d'un cabinet avec filtres optionnels
 */
export async function getOperationsByCabinet(
  cabinetId: string,
  filters?: OperationGestionFiltersInput
): Promise<OperationGestionServiceResult<OperationGestionWithRelations[]>> {
  try {
    const where = buildOperationWhereClause(cabinetId, filters)

    const operations = await prisma.operationGestion.findMany({
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
        affaireOrigine: {
          select: {
            id: true,
            reference: true,
            productType: true,
            provider: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
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
      data: operations.map(transformOperation),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des opérations'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère une opération par son ID
 */
export async function getOperationById(
  operationId: string
): Promise<OperationGestionServiceResult<OperationGestionWithRelations>> {
  try {
    const operation = await prisma.operationGestion.findUnique({
      where: { id: operationId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        affaireOrigine: {
          select: {
            id: true,
            reference: true,
            productType: true,
            provider: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!operation) {
      return {
        success: false,
        error: 'Opération non trouvée',
      }
    }

    return {
      success: true,
      data: transformOperation(operation),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération de l\'opération'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère l'historique des statuts d'une opération
 */
export async function getOperationStatusHistory(
  operationId: string
): Promise<OperationGestionServiceResult<OperationStatusHistoryEntry[]>> {
  try {
    const history = await prisma.operationStatusHistory.findMany({
      where: { operationId },
      include: {
        user: {
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
      data: history.map(entry => ({
        id: entry.id,
        operationId: entry.operationId,
        fromStatus: entry.fromStatus,
        toStatus: entry.toStatus,
        note: entry.note,
        userId: entry.userId,
        createdAt: entry.createdAt,
        user: entry.user,
      })),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération de l\'historique'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Met à jour les détails d'une opération de gestion
 * 
 * @requirements 21.4-21.6 - FOR specific operation types, THE Operations_Manager SHALL require specific details
 */
export async function updateOperationDetails(
  operationId: string,
  operationDetails: unknown,
  userId: string
): Promise<OperationGestionServiceResult<OperationGestionWithRelations>> {
  try {
    const existingOperation = await prisma.operationGestion.findUnique({
      where: { id: operationId },
    })

    if (!existingOperation) {
      return {
        success: false,
        error: 'Opération non trouvée',
      }
    }

    // Can only update details for operations in BROUILLON status
    if (existingOperation.status !== 'BROUILLON') {
      return {
        success: false,
        error: 'Seules les opérations en brouillon peuvent être modifiées',
      }
    }

    const operation = await prisma.operationGestion.update({
      where: { id: operationId },
      data: {
        operationDetails: operationDetails as unknown as Prisma.InputJsonValue,
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
        affaireOrigine: {
          select: {
            id: true,
            reference: true,
            productType: true,
            provider: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Record update in history
    await prisma.operationStatusHistory.create({
      data: {
        operationId: operation.id,
        fromStatus: existingOperation.status,
        toStatus: existingOperation.status,
        note: 'Mise à jour des détails de l\'opération',
        userId,
      },
    })

    return {
      success: true,
      data: transformOperation(operation),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour des détails'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les opérations en attente (non exécutées)
 */
export async function getPendingOperations(
  cabinetId: string
): Promise<OperationGestionServiceResult<OperationGestionWithRelations[]>> {
  try {
    const operations = await prisma.operationGestion.findMany({
      where: {
        cabinetId,
        status: {
          notIn: ['EXECUTE', 'REJETE'],
        },
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
        affaireOrigine: {
          select: {
            id: true,
            reference: true,
            productType: true,
            provider: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
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
      data: operations.map(transformOperation),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des opérations en attente'
    return {
      success: false,
      error: message,
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Construit la clause WHERE pour les requêtes d'opérations
 */
function buildOperationWhereClause(
  cabinetId: string,
  filters?: OperationGestionFiltersInput
): Record<string, unknown> {
  const where: Record<string, unknown> = { cabinetId }

  if (!filters) return where

  // Validate filters
  const validatedFilters = operationGestionFiltersSchema.parse(filters)

  if (validatedFilters.clientId) {
    where.clientId = validatedFilters.clientId
  }

  if (validatedFilters.contractId) {
    where.contractId = validatedFilters.contractId
  }

  if (validatedFilters.status && validatedFilters.status.length > 0) {
    where.status = { in: validatedFilters.status }
  }

  if (validatedFilters.type && validatedFilters.type.length > 0) {
    where.type = { in: validatedFilters.type }
  }

  if (validatedFilters.dateFrom || validatedFilters.dateTo) {
    where.createdAt = {}
    if (validatedFilters.dateFrom) {
      (where.createdAt as Record<string, Date>).gte = validatedFilters.dateFrom
    }
    if (validatedFilters.dateTo) {
      (where.createdAt as Record<string, Date>).lte = validatedFilters.dateTo
    }
  }

  return where
}

/**
 * Transforme une opération Prisma en type de sortie
 */
function transformOperation(operation: {
  id: string
  cabinetId: string
  reference: string
  clientId: string
  contractId: string
  affaireOrigineId: string
  type: string
  status: string
  amount: { toNumber(): number } | number | null
  effectiveDate: Date | null
  operationDetails: unknown
  rejectionReason: string | null
  executedAt: Date | null
  createdById: string
  createdAt: Date
  updatedAt: Date
  client: { id: string; firstName: string; lastName: string; email: string | null }
  affaireOrigine: { id: string; reference: string; productType: string; provider: { id: string; name: string } }
  createdBy: { id: string; firstName: string; lastName: string }
}): OperationGestionWithRelations {
  return {
    id: operation.id,
    cabinetId: operation.cabinetId,
    reference: operation.reference,
    clientId: operation.clientId,
    contractId: operation.contractId,
    affaireOrigineId: operation.affaireOrigineId,
    type: operation.type,
    status: operation.status,
    amount: operation.amount 
      ? (typeof operation.amount === 'number' ? operation.amount : operation.amount.toNumber())
      : null,
    effectiveDate: operation.effectiveDate,
    operationDetails: operation.operationDetails,
    rejectionReason: operation.rejectionReason,
    executedAt: operation.executedAt,
    createdById: operation.createdById,
    createdAt: operation.createdAt,
    updatedAt: operation.updatedAt,
    client: operation.client,
    affaireOrigine: operation.affaireOrigine,
    createdBy: operation.createdBy,
  }
}

/**
 * Obtient le label français d'un statut d'opération
 */
export function getOperationStatusLabel(status: OperationGestionStatus): string {
  return OPERATION_GESTION_STATUS_LABELS[status]
}

/**
 * Obtient le label français d'un type d'opération
 */
export function getOperationTypeLabel(type: OperationGestionType): string {
  return OPERATION_GESTION_TYPE_LABELS[type]
}
