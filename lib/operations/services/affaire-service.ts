/**
 * Service de gestion des Affaires Nouvelles
 * 
 * Ce service gère le cycle de vie complet des affaires nouvelles (ventes):
 * - Création d'affaires avec génération de référence unique
 * - Mise à jour du statut avec validation des transitions
 * - Récupération des affaires par client avec filtres
 * - Gestion des affaires "en cours"
 * 
 * @module lib/operations/services/affaire-service
 * @requirements 18.1-18.6, 19.1-19.7
 */

import { prisma } from '@/app/_common/lib/prisma'
import { Prisma } from '@prisma/client'
import {
  type AffaireStatus,
  type AffaireSource,
  type ProductType,
  type AffaireFilters,
  isValidAffaireTransition,
  AFFAIRE_STATUS_LABELS,
  AFFAIRE_EN_COURS_STATUSES,
} from '../types'
import {
  createAffaireSchema,
  updateAffaireStatusSchema,
  affaireFiltersSchema,
  type CreateAffaireInput,
  type UpdateAffaireStatusInput,
  type AffaireFiltersInput,
} from '../schemas'

// ============================================================================
// Types
// ============================================================================

export interface AffaireServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface AffaireNouvelleWithRelations {
  id: string
  cabinetId: string
  reference: string
  clientId: string
  productType: string
  providerId: string
  productId: string | null
  status: string
  source: string
  estimatedAmount: number
  actualAmount: number | null
  targetDate: Date | null
  productDetails: unknown
  entryFees: number | null
  managementFees: number | null
  expectedCommission: number | null
  lastActivityAt: Date
  pausedAt: Date | null
  pauseReason: string | null
  rejectionReason: string | null
  cancellationReason: string | null
  createdById: string
  createdAt: Date
  updatedAt: Date
  client: {
    id: string
    firstName: string
    lastName: string
    email: string | null
  }
  provider: {
    id: string
    name: string
    type: string
  }
  product?: {
    id: string
    name: string
    code: string
  } | null
  createdBy: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface AffaireStatusHistoryEntry {
  id: string
  affaireId: string
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
 * Génère une référence unique pour une affaire nouvelle
 * Format: AN-YYYY-NNNN
 * 
 * @requirements 18.2 - THE Operations_Manager SHALL generate unique reference numbers for all operations
 */
async function generateAffaireReference(cabinetId: string): Promise<string> {
  const year = new Date().getFullYear()
  
  // Count existing affaires for this cabinet in the current year
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
// Affaire Service
// ============================================================================

/**
 * Crée une nouvelle affaire
 * 
 * @requirements 19.2 - WHEN creating an Affaire Nouvelle, THE Affaire_Nouvelle SHALL require client, product type, provider, estimated amount, target date, source
 */
export async function createAffaire(
  input: CreateAffaireInput
): Promise<AffaireServiceResult<AffaireNouvelleWithRelations>> {
  try {
    // Validate input
    const validatedInput = createAffaireSchema.parse(input)

    // Generate unique reference
    const reference = await generateAffaireReference(validatedInput.cabinetId)

    // Create affaire with initial status PROSPECT
    const affaire = await prisma.affaireNouvelle.create({
      data: {
        cabinetId: validatedInput.cabinetId,
        reference,
        clientId: validatedInput.clientId,
        productType: validatedInput.productType as ProductType,
        providerId: validatedInput.providerId,
        productId: validatedInput.productId ?? null,
        status: 'PROSPECT',
        source: validatedInput.source as AffaireSource,
        estimatedAmount: validatedInput.estimatedAmount,
        targetDate: validatedInput.targetDate ?? null,
        productDetails: (validatedInput.productDetails ?? null) as unknown as Prisma.InputJsonValue,
        createdById: validatedInput.createdById,
        lastActivityAt: new Date(),
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
        provider: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            code: true,
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
    await prisma.affaireStatusHistory.create({
      data: {
        affaireId: affaire.id,
        fromStatus: null,
        toStatus: 'PROSPECT',
        note: 'Création de l\'affaire',
        userId: validatedInput.createdById,
      },
    })

    return {
      success: true,
      data: transformAffaire(affaire),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la création de l\'affaire'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Met à jour le statut d'une affaire avec validation des transitions
 * 
 * @requirements 19.1 - THE Affaire_Nouvelle SHALL track new subscriptions through workflow stages
 * @requirements 19.6 - WHEN an Affaire Nouvelle status changes, THE Operations_Manager SHALL record the change
 */
export async function updateAffaireStatus(
  input: UpdateAffaireStatusInput
): Promise<AffaireServiceResult<AffaireNouvelleWithRelations>> {
  try {
    // Validate input
    const validatedInput = updateAffaireStatusSchema.parse(input)

    // Get current affaire
    const existingAffaire = await prisma.affaireNouvelle.findUnique({
      where: { id: validatedInput.affaireId },
    })

    if (!existingAffaire) {
      return {
        success: false,
        error: 'Affaire non trouvée',
      }
    }

    const currentStatus = existingAffaire.status as AffaireStatus
    const newStatus = validatedInput.newStatus as AffaireStatus

    // Validate status transition
    if (!isValidAffaireTransition(currentStatus, newStatus)) {
      return {
        success: false,
        error: `Transition de statut invalide: ${AFFAIRE_STATUS_LABELS[currentStatus]} → ${AFFAIRE_STATUS_LABELS[newStatus]}`,
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status: newStatus,
      lastActivityAt: new Date(),
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

    if (newStatus === 'ANNULE') {
      if (!validatedInput.cancellationReason) {
        return {
          success: false,
          error: 'La raison de l\'annulation est obligatoire',
        }
      }
      updateData.cancellationReason = validatedInput.cancellationReason
    }

    // Update affaire
    const affaire = await prisma.affaireNouvelle.update({
      where: { id: validatedInput.affaireId },
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
        provider: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            code: true,
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
    await prisma.affaireStatusHistory.create({
      data: {
        affaireId: affaire.id,
        fromStatus: currentStatus,
        toStatus: newStatus,
        note: validatedInput.note ?? null,
        userId: validatedInput.userId,
      },
    })

    return {
      success: true,
      data: transformAffaire(affaire),
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
 * Récupère les affaires d'un client avec filtres optionnels
 */
export async function getAffairesByClient(
  cabinetId: string,
  clientId: string,
  filters?: AffaireFiltersInput
): Promise<AffaireServiceResult<AffaireNouvelleWithRelations[]>> {
  try {
    const where = buildAffaireWhereClause(cabinetId, { ...filters, clientId })

    const affaires = await prisma.affaireNouvelle.findMany({
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
        provider: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            code: true,
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
      orderBy: [
        { lastActivityAt: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return {
      success: true,
      data: affaires.map(transformAffaire),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des affaires'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère toutes les affaires d'un cabinet avec filtres optionnels
 */
export async function getAffairesByCabinet(
  cabinetId: string,
  filters?: AffaireFiltersInput
): Promise<AffaireServiceResult<AffaireNouvelleWithRelations[]>> {
  try {
    const where = buildAffaireWhereClause(cabinetId, filters)

    const affaires = await prisma.affaireNouvelle.findMany({
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
        provider: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            code: true,
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
      orderBy: [
        { lastActivityAt: 'desc' },
        { createdAt: 'desc' },
      ],
    })

    return {
      success: true,
      data: affaires.map(transformAffaire),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des affaires'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les affaires "en cours" (inactives ou avec documents manquants)
 * 
 * @requirements 20.1 - THE Operations_Manager SHALL automatically categorize an Affaire Nouvelle as "En Cours"
 */
export async function getAffairesEnCours(
  cabinetId: string,
  daysInactive: number = 7
): Promise<AffaireServiceResult<AffaireNouvelleWithRelations[]>> {
  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive)

    const affaires = await prisma.affaireNouvelle.findMany({
      where: {
        cabinetId,
        status: {
          in: AFFAIRE_EN_COURS_STATUSES,
        },
        lastActivityAt: {
          lt: cutoffDate,
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
        provider: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            code: true,
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
        lastActivityAt: 'asc',
      },
    })

    return {
      success: true,
      data: affaires.map(transformAffaire),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des affaires en cours'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère une affaire par son ID
 */
export async function getAffaireById(
  affaireId: string
): Promise<AffaireServiceResult<AffaireNouvelleWithRelations>> {
  try {
    const affaire = await prisma.affaireNouvelle.findUnique({
      where: { id: affaireId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        provider: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            code: true,
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

    if (!affaire) {
      return {
        success: false,
        error: 'Affaire non trouvée',
      }
    }

    return {
      success: true,
      data: transformAffaire(affaire),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération de l\'affaire'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère l'historique des statuts d'une affaire
 */
export async function getAffaireStatusHistory(
  affaireId: string
): Promise<AffaireServiceResult<AffaireStatusHistoryEntry[]>> {
  try {
    const history = await prisma.affaireStatusHistory.findMany({
      where: { affaireId },
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
        affaireId: entry.affaireId,
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
 * Met en pause une affaire
 * 
 * @requirements 20.3 - THE Operations_Manager SHALL provide quick actions: "Mettre en pause"
 */
export async function pauseAffaire(
  affaireId: string,
  pauseReason: string,
  userId: string
): Promise<AffaireServiceResult<AffaireNouvelleWithRelations>> {
  try {
    const existingAffaire = await prisma.affaireNouvelle.findUnique({
      where: { id: affaireId },
    })

    if (!existingAffaire) {
      return {
        success: false,
        error: 'Affaire non trouvée',
      }
    }

    // Can only pause affaires in "en cours" statuses
    if (!AFFAIRE_EN_COURS_STATUSES.includes(existingAffaire.status as AffaireStatus)) {
      return {
        success: false,
        error: 'Seules les affaires en cours peuvent être mises en pause',
      }
    }

    const affaire = await prisma.affaireNouvelle.update({
      where: { id: affaireId },
      data: {
        pausedAt: new Date(),
        pauseReason,
        lastActivityAt: new Date(),
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
        provider: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            code: true,
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

    // Record pause in history
    await prisma.affaireStatusHistory.create({
      data: {
        affaireId: affaire.id,
        fromStatus: existingAffaire.status,
        toStatus: existingAffaire.status,
        note: `Mise en pause: ${pauseReason}`,
        userId,
      },
    })

    return {
      success: true,
      data: transformAffaire(affaire),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise en pause'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Reprend une affaire en pause
 * 
 * @requirements 20.3 - THE Operations_Manager SHALL provide quick actions: "Reprendre"
 */
export async function resumeAffaire(
  affaireId: string,
  userId: string
): Promise<AffaireServiceResult<AffaireNouvelleWithRelations>> {
  try {
    const existingAffaire = await prisma.affaireNouvelle.findUnique({
      where: { id: affaireId },
    })

    if (!existingAffaire) {
      return {
        success: false,
        error: 'Affaire non trouvée',
      }
    }

    if (!existingAffaire.pausedAt) {
      return {
        success: false,
        error: 'Cette affaire n\'est pas en pause',
      }
    }

    const affaire = await prisma.affaireNouvelle.update({
      where: { id: affaireId },
      data: {
        pausedAt: null,
        pauseReason: null,
        lastActivityAt: new Date(),
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
        provider: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            code: true,
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

    // Record resume in history
    await prisma.affaireStatusHistory.create({
      data: {
        affaireId: affaire.id,
        fromStatus: existingAffaire.status,
        toStatus: existingAffaire.status,
        note: 'Reprise de l\'affaire',
        userId,
      },
    })

    return {
      success: true,
      data: transformAffaire(affaire),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la reprise'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Met à jour la dernière activité d'une affaire
 */
export async function updateLastActivity(
  affaireId: string
): Promise<AffaireServiceResult<{ updated: boolean }>> {
  try {
    await prisma.affaireNouvelle.update({
      where: { id: affaireId },
      data: {
        lastActivityAt: new Date(),
      },
    })

    return {
      success: true,
      data: { updated: true },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la mise à jour de l\'activité'
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
 * Construit la clause WHERE pour les requêtes d'affaires
 */
function buildAffaireWhereClause(
  cabinetId: string,
  filters?: AffaireFiltersInput
): Record<string, unknown> {
  const where: Record<string, unknown> = { cabinetId }

  if (!filters) return where

  // Validate filters
  const validatedFilters = affaireFiltersSchema.parse(filters)

  if (validatedFilters.clientId) {
    where.clientId = validatedFilters.clientId
  }

  if (validatedFilters.status && validatedFilters.status.length > 0) {
    where.status = { in: validatedFilters.status }
  }

  if (validatedFilters.productType && validatedFilters.productType.length > 0) {
    where.productType = { in: validatedFilters.productType }
  }

  if (validatedFilters.providerId) {
    where.providerId = validatedFilters.providerId
  }

  if (validatedFilters.source && validatedFilters.source.length > 0) {
    where.source = { in: validatedFilters.source }
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

  if (validatedFilters.enCoursOnly) {
    where.status = { in: AFFAIRE_EN_COURS_STATUSES }
  }

  return where
}

/**
 * Transforme une affaire Prisma en type de sortie
 */
function transformAffaire(affaire: {
  id: string
  cabinetId: string
  reference: string
  clientId: string
  productType: string
  providerId: string
  productId: string | null
  status: string
  source: string
  estimatedAmount: { toNumber(): number } | number
  actualAmount: { toNumber(): number } | number | null
  targetDate: Date | null
  productDetails: unknown
  entryFees: { toNumber(): number } | number | null
  managementFees: { toNumber(): number } | number | null
  expectedCommission: { toNumber(): number } | number | null
  lastActivityAt: Date
  pausedAt: Date | null
  pauseReason: string | null
  rejectionReason: string | null
  cancellationReason: string | null
  createdById: string
  createdAt: Date
  updatedAt: Date
  client: { id: string; firstName: string; lastName: string; email: string | null }
  provider: { id: string; name: string; type: string }
  product?: { id: string; name: string; code: string } | null
  createdBy: { id: string; firstName: string; lastName: string }
}): AffaireNouvelleWithRelations {
  return {
    id: affaire.id,
    cabinetId: affaire.cabinetId,
    reference: affaire.reference,
    clientId: affaire.clientId,
    productType: affaire.productType,
    providerId: affaire.providerId,
    productId: affaire.productId,
    status: affaire.status,
    source: affaire.source,
    estimatedAmount: typeof affaire.estimatedAmount === 'number' 
      ? affaire.estimatedAmount 
      : affaire.estimatedAmount.toNumber(),
    actualAmount: affaire.actualAmount 
      ? (typeof affaire.actualAmount === 'number' ? affaire.actualAmount : affaire.actualAmount.toNumber())
      : null,
    targetDate: affaire.targetDate,
    productDetails: affaire.productDetails,
    entryFees: affaire.entryFees 
      ? (typeof affaire.entryFees === 'number' ? affaire.entryFees : affaire.entryFees.toNumber())
      : null,
    managementFees: affaire.managementFees 
      ? (typeof affaire.managementFees === 'number' ? affaire.managementFees : affaire.managementFees.toNumber())
      : null,
    expectedCommission: affaire.expectedCommission 
      ? (typeof affaire.expectedCommission === 'number' ? affaire.expectedCommission : affaire.expectedCommission.toNumber())
      : null,
    lastActivityAt: affaire.lastActivityAt,
    pausedAt: affaire.pausedAt,
    pauseReason: affaire.pauseReason,
    rejectionReason: affaire.rejectionReason,
    cancellationReason: affaire.cancellationReason,
    createdById: affaire.createdById,
    createdAt: affaire.createdAt,
    updatedAt: affaire.updatedAt,
    client: affaire.client,
    provider: affaire.provider,
    product: affaire.product ?? null,
    createdBy: affaire.createdBy,
  }
}

/**
 * Obtient le label français d'un statut d'affaire
 */
export function getAffaireStatusLabel(status: AffaireStatus): string {
  return AFFAIRE_STATUS_LABELS[status]
}

/**
 * Calcule le nombre de jours depuis la dernière activité
 */
export function getDaysSinceLastActivity(lastActivityAt: Date): number {
  const now = new Date()
  const diffMs = now.getTime() - lastActivityAt.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}
