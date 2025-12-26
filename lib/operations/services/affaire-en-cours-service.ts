/**
 * Service de catégorisation des Affaires "En Cours"
 * 
 * Ce service gère la catégorisation et le suivi des affaires inactives:
 * - Catégorisation par niveau d'inactivité (vert/orange/rouge)
 * - Détection des affaires nécessitant une action
 * - Calcul des statistiques d'inactivité
 * 
 * @module lib/operations/services/affaire-en-cours-service
 * @requirements 20.1-20.5
 */

import { prisma } from '@/app/_common/lib/prisma'
import {
  type AffaireStatus,
  type InactivityCategory,
  type ProductType,
  AFFAIRE_EN_COURS_STATUSES,
  AFFAIRE_INACTIVITY_THRESHOLDS,
  getAffaireInactivityCategory,
  AFFAIRE_STATUS_LABELS,
  PRODUCT_TYPE_LABELS,
} from '../types'
import { checkAffaireBlocking } from './operation-blocking-service'

// ============================================================================
// Types
// ============================================================================

export interface AffaireEnCoursServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface AffaireEnCoursWithDetails {
  id: string
  reference: string
  clientId: string
  clientName: string
  productType: string
  productTypeLabel: string
  providerName: string
  status: string
  statusLabel: string
  estimatedAmount: number
  lastActivityAt: Date
  daysSinceActivity: number
  inactivityCategory: InactivityCategory
  isPaused: boolean
  pauseReason: string | null
  missingDocumentsCount: number
  blockingIssuesCount: number
  nextActionRequired: string
  createdAt: Date
}

export interface AffaireEnCoursStats {
  total: number
  byCategory: {
    GREEN: number
    ORANGE: number
    RED: number
  }
  byStatus: Record<string, number>
  byProductType: Record<string, number>
  totalValue: number
  averageDaysInactive: number
}

export interface InactiveAffaireAlert {
  affaireId: string
  reference: string
  clientName: string
  daysSinceActivity: number
  category: InactivityCategory
  reason: string
  suggestedAction: string
}

// ============================================================================
// Affaire En Cours Service
// ============================================================================

/**
 * Catégorise les affaires "en cours" par niveau d'inactivité
 * 
 * @requirements 20.1 - THE Operations_Manager SHALL automatically categorize an Affaire Nouvelle as "En Cours"
 */
export async function categorizeAffairesEnCours(
  cabinetId: string
): Promise<AffaireEnCoursServiceResult<AffaireEnCoursWithDetails[]>> {
  try {
    const now = new Date()

    // Get all affaires in "en cours" statuses
    const affaires = await prisma.affaireNouvelle.findMany({
      where: {
        cabinetId,
        status: {
          in: AFFAIRE_EN_COURS_STATUSES,
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
        provider: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        lastActivityAt: 'asc',
      },
    })

    const categorizedAffaires: AffaireEnCoursWithDetails[] = []

    for (const affaire of affaires) {
      const daysSinceActivity = Math.floor(
        (now.getTime() - affaire.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
      )

      const inactivityCategory = getAffaireInactivityCategory(affaire.lastActivityAt, now)

      // Check for blocking issues
      const blockingResult = await checkAffaireBlocking(
        cabinetId,
        affaire.clientId,
        affaire.productType as ProductType,
        affaire.id
      )

      const missingDocumentsCount = blockingResult.data?.missingDocuments.length ?? 0
      const blockingIssuesCount = blockingResult.data?.blockingReasons.length ?? 0

      // Determine next action required
      const nextActionRequired = determineNextAction(
        affaire.status as AffaireStatus,
        daysSinceActivity,
        missingDocumentsCount,
        affaire.pausedAt !== null
      )

      categorizedAffaires.push({
        id: affaire.id,
        reference: affaire.reference,
        clientId: affaire.clientId,
        clientName: `${affaire.client.firstName} ${affaire.client.lastName}`,
        productType: affaire.productType,
        productTypeLabel: PRODUCT_TYPE_LABELS[affaire.productType as ProductType],
        providerName: affaire.provider.name,
        status: affaire.status,
        statusLabel: AFFAIRE_STATUS_LABELS[affaire.status as AffaireStatus],
        estimatedAmount: typeof affaire.estimatedAmount === 'number' 
          ? affaire.estimatedAmount 
          : affaire.estimatedAmount.toNumber(),
        lastActivityAt: affaire.lastActivityAt,
        daysSinceActivity,
        inactivityCategory,
        isPaused: affaire.pausedAt !== null,
        pauseReason: affaire.pauseReason,
        missingDocumentsCount,
        blockingIssuesCount,
        nextActionRequired,
        createdAt: affaire.createdAt,
      })
    }

    return {
      success: true,
      data: categorizedAffaires,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la catégorisation des affaires'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les affaires inactives nécessitant une action
 * 
 * @requirements 20.2 - THE Operations_Manager SHALL display Affaires en Cours with days since last activity
 */
export async function getInactiveAffaires(
  cabinetId: string,
  minDaysInactive: number = 7
): Promise<AffaireEnCoursServiceResult<AffaireEnCoursWithDetails[]>> {
  try {
    const result = await categorizeAffairesEnCours(cabinetId)
    
    if (!result.success || !result.data) {
      return result
    }

    // Filter for affaires that have been inactive for at least minDaysInactive days
    const inactiveAffaires = result.data.filter(
      affaire => affaire.daysSinceActivity >= minDaysInactive && !affaire.isPaused
    )

    return {
      success: true,
      data: inactiveAffaires,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des affaires inactives'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les statistiques des affaires "en cours"
 * 
 * @requirements 20.5 - THE Operations_Manager SHALL track statistics
 */
export async function getAffairesEnCoursStats(
  cabinetId: string
): Promise<AffaireEnCoursServiceResult<AffaireEnCoursStats>> {
  try {
    const result = await categorizeAffairesEnCours(cabinetId)
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error ?? 'Erreur lors de la récupération des statistiques',
      }
    }

    const affaires = result.data

    // Calculate stats
    const stats: AffaireEnCoursStats = {
      total: affaires.length,
      byCategory: {
        GREEN: 0,
        ORANGE: 0,
        RED: 0,
      },
      byStatus: {},
      byProductType: {},
      totalValue: 0,
      averageDaysInactive: 0,
    }

    let totalDaysInactive = 0

    for (const affaire of affaires) {
      // By category
      stats.byCategory[affaire.inactivityCategory]++

      // By status
      if (!stats.byStatus[affaire.status]) {
        stats.byStatus[affaire.status] = 0
      }
      stats.byStatus[affaire.status]++

      // By product type
      if (!stats.byProductType[affaire.productType]) {
        stats.byProductType[affaire.productType] = 0
      }
      stats.byProductType[affaire.productType]++

      // Total value
      stats.totalValue += affaire.estimatedAmount

      // Days inactive
      totalDaysInactive += affaire.daysSinceActivity
    }

    stats.averageDaysInactive = affaires.length > 0 
      ? Math.round(totalDaysInactive / affaires.length) 
      : 0

    return {
      success: true,
      data: stats,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du calcul des statistiques'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Génère les alertes pour les affaires inactives
 * 
 * @requirements 20.4 - THE Operations_Manager SHALL generate alerts for Affaires en Cours
 */
export async function generateInactiveAffaireAlerts(
  cabinetId: string
): Promise<AffaireEnCoursServiceResult<InactiveAffaireAlert[]>> {
  try {
    const result = await categorizeAffairesEnCours(cabinetId)
    
    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error ?? 'Erreur lors de la génération des alertes',
      }
    }

    const alerts: InactiveAffaireAlert[] = []

    for (const affaire of result.data) {
      // Skip paused affaires
      if (affaire.isPaused) continue

      // Generate alert based on inactivity level
      if (affaire.inactivityCategory === 'RED') {
        alerts.push({
          affaireId: affaire.id,
          reference: affaire.reference,
          clientName: affaire.clientName,
          daysSinceActivity: affaire.daysSinceActivity,
          category: 'RED',
          reason: `Aucune activité depuis ${affaire.daysSinceActivity} jours`,
          suggestedAction: 'Contacter le client ou annuler l\'affaire',
        })
      } else if (affaire.inactivityCategory === 'ORANGE') {
        alerts.push({
          affaireId: affaire.id,
          reference: affaire.reference,
          clientName: affaire.clientName,
          daysSinceActivity: affaire.daysSinceActivity,
          category: 'ORANGE',
          reason: `Aucune activité depuis ${affaire.daysSinceActivity} jours`,
          suggestedAction: 'Relancer le client',
        })
      }

      // Alert for missing documents
      if (affaire.missingDocumentsCount > 0) {
        alerts.push({
          affaireId: affaire.id,
          reference: affaire.reference,
          clientName: affaire.clientName,
          daysSinceActivity: affaire.daysSinceActivity,
          category: affaire.inactivityCategory,
          reason: `${affaire.missingDocumentsCount} document(s) manquant(s)`,
          suggestedAction: 'Générer les documents manquants',
        })
      }

      // Alert for blocking issues
      if (affaire.blockingIssuesCount > 0) {
        alerts.push({
          affaireId: affaire.id,
          reference: affaire.reference,
          clientName: affaire.clientName,
          daysSinceActivity: affaire.daysSinceActivity,
          category: affaire.inactivityCategory,
          reason: `${affaire.blockingIssuesCount} problème(s) bloquant(s)`,
          suggestedAction: 'Résoudre les problèmes de conformité',
        })
      }
    }

    // Sort by category (RED first) then by days inactive
    alerts.sort((a, b) => {
      const categoryOrder = { RED: 0, ORANGE: 1, GREEN: 2 }
      const categoryDiff = categoryOrder[a.category] - categoryOrder[b.category]
      if (categoryDiff !== 0) return categoryDiff
      return b.daysSinceActivity - a.daysSinceActivity
    })

    return {
      success: true,
      data: alerts,
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
 * Récupère les affaires par catégorie d'inactivité
 */
export async function getAffairesByInactivityCategory(
  cabinetId: string,
  category: InactivityCategory
): Promise<AffaireEnCoursServiceResult<AffaireEnCoursWithDetails[]>> {
  try {
    const result = await categorizeAffairesEnCours(cabinetId)
    
    if (!result.success || !result.data) {
      return result
    }

    const filteredAffaires = result.data.filter(
      affaire => affaire.inactivityCategory === category
    )

    return {
      success: true,
      data: filteredAffaires,
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
 * Récupère les affaires en pause
 */
export async function getPausedAffaires(
  cabinetId: string
): Promise<AffaireEnCoursServiceResult<AffaireEnCoursWithDetails[]>> {
  try {
    const result = await categorizeAffairesEnCours(cabinetId)
    
    if (!result.success || !result.data) {
      return result
    }

    const pausedAffaires = result.data.filter(affaire => affaire.isPaused)

    return {
      success: true,
      data: pausedAffaires,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des affaires en pause'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les affaires avec des documents manquants
 */
export async function getAffairesWithMissingDocuments(
  cabinetId: string
): Promise<AffaireEnCoursServiceResult<AffaireEnCoursWithDetails[]>> {
  try {
    const result = await categorizeAffairesEnCours(cabinetId)
    
    if (!result.success || !result.data) {
      return result
    }

    const affairesWithMissingDocs = result.data.filter(
      affaire => affaire.missingDocumentsCount > 0
    )

    return {
      success: true,
      data: affairesWithMissingDocs,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des affaires'
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
 * Détermine la prochaine action requise pour une affaire
 */
function determineNextAction(
  status: AffaireStatus,
  daysSinceActivity: number,
  missingDocumentsCount: number,
  isPaused: boolean
): string {
  if (isPaused) {
    return 'Reprendre l\'affaire'
  }

  if (missingDocumentsCount > 0) {
    return `Générer ${missingDocumentsCount} document(s) manquant(s)`
  }

  if (daysSinceActivity > AFFAIRE_INACTIVITY_THRESHOLDS.RED) {
    return 'Contacter le client ou annuler'
  }

  if (daysSinceActivity > AFFAIRE_INACTIVITY_THRESHOLDS.GREEN) {
    return 'Relancer le client'
  }

  // Based on status
  switch (status) {
    case 'QUALIFICATION':
      return 'Finaliser la qualification'
    case 'CONSTITUTION':
      return 'Compléter le dossier'
    case 'SIGNATURE':
      return 'Obtenir les signatures'
    default:
      return 'Continuer le traitement'
  }
}

/**
 * Calcule le taux de conversion des affaires
 * 
 * @requirements 20.5 - THE Operations_Manager SHALL track "win rate" statistics
 */
export async function calculateConversionRate(
  cabinetId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<AffaireEnCoursServiceResult<{ conversionRate: number; totalCreated: number; totalValidated: number }>> {
  try {
    const where: Record<string, unknown> = { cabinetId }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        (where.createdAt as Record<string, Date>).gte = dateFrom
      }
      if (dateTo) {
        (where.createdAt as Record<string, Date>).lte = dateTo
      }
    }

    const totalCreated = await prisma.affaireNouvelle.count({ where })

    const totalValidated = await prisma.affaireNouvelle.count({
      where: {
        ...where,
        status: 'VALIDE',
      },
    })

    const conversionRate = totalCreated > 0 
      ? Math.round((totalValidated / totalCreated) * 100 * 100) / 100 
      : 0

    return {
      success: true,
      data: {
        conversionRate,
        totalCreated,
        totalValidated,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du calcul du taux de conversion'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Calcule le délai moyen de traitement des affaires
 */
export async function calculateAverageProcessingTime(
  cabinetId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<AffaireEnCoursServiceResult<{ averageDays: number; count: number }>> {
  try {
    const where: Record<string, unknown> = {
      cabinetId,
      status: 'VALIDE',
    }

    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        (where.createdAt as Record<string, Date>).gte = dateFrom
      }
      if (dateTo) {
        (where.createdAt as Record<string, Date>).lte = dateTo
      }
    }

    const validatedAffaires = await prisma.affaireNouvelle.findMany({
      where,
      select: {
        createdAt: true,
        updatedAt: true,
      },
    })

    if (validatedAffaires.length === 0) {
      return {
        success: true,
        data: { averageDays: 0, count: 0 },
      }
    }

    let totalDays = 0
    for (const affaire of validatedAffaires) {
      const days = Math.floor(
        (affaire.updatedAt.getTime() - affaire.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )
      totalDays += days
    }

    const averageDays = Math.round(totalDays / validatedAffaires.length)

    return {
      success: true,
      data: {
        averageDays,
        count: validatedAffaires.length,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors du calcul du délai moyen'
    return {
      success: false,
      error: message,
    }
  }
}
