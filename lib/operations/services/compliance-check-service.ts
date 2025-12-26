/**
 * Service de vérification de conformité pour les opérations
 * 
 * Ce service vérifie la conformité d'un client avant de permettre
 * la création d'opérations:
 * - Vérification KYC (documents valides et non expirés)
 * - Vérification MiFID (questionnaire à jour)
 * - Vérification LCB-FT (pas de risque élevé)
 * 
 * @module lib/operations/services/compliance-check-service
 * @requirements 18.6, 25.1-25.7
 */

import { prisma } from '@/app/_common/lib/prisma'
import {
  type ComplianceCheckResult,
  type ComplianceIssue,
  type KYCCheckStatus,
  type MiFIDCheckStatus,
  type LCBFTCheckStatus,
} from '../types'
import { type AlertSeverity } from '../../compliance/types'

// ============================================================================
// Types
// ============================================================================

export interface ComplianceCheckServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Configuration des documents KYC requis
 * Alignés avec l'enum KYCDocumentType de Prisma
 */
const REQUIRED_KYC_DOCUMENTS = [
  'IDENTITE',
  'JUSTIFICATIF_DOMICILE',
  'RIB_BANCAIRE',
] as const

/**
 * Durée de validité du questionnaire MiFID en jours (12 mois)
 */
const MIFID_VALIDITY_DAYS = 365

// ============================================================================
// Compliance Check Service
// ============================================================================

/**
 * Vérifie la conformité complète d'un client
 * 
 * @requirements 18.6 - WHEN any operation is created or modified, THE Operations_Manager SHALL verify KYC compliance status
 * @requirements 25.1 - THE Operations_Manager SHALL verify client compliance before allowing operations
 */
export async function checkClientCompliance(
  cabinetId: string,
  clientId: string
): Promise<ComplianceCheckServiceResult<ComplianceCheckResult>> {
  try {
    // Get client data
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        kycStatus: true,
        kycCompletedAt: true,
        kycNextReviewDate: true,
        isPEP: true,
        riskProfile: true,
        investmentHorizon: true,
      },
    })

    if (!client) {
      return {
        success: false,
        error: 'Client non trouvé',
      }
    }

    // Check KYC status
    const kycResult = await checkKYCStatus(cabinetId, clientId)
    
    // Check MiFID status
    const mifidResult = await checkMiFIDStatus(clientId)
    
    // Check LCB-FT status
    const lcbftResult = checkLCBFTStatus(client.isPEP)

    // Collect all issues
    const issues: ComplianceIssue[] = [
      ...kycResult.issues,
      ...mifidResult.issues,
      ...lcbftResult.issues,
    ]

    // Determine overall compliance
    const isCompliant = 
      kycResult.status === 'VALID' &&
      mifidResult.status === 'VALID' &&
      lcbftResult.status === 'CLEAR'

    const result: ComplianceCheckResult = {
      isCompliant,
      kycStatus: kycResult.status,
      mifidStatus: mifidResult.status,
      lcbftStatus: lcbftResult.status,
      issues,
    }

    return {
      success: true,
      data: result,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la vérification de conformité'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les problèmes de conformité d'un client
 * 
 * @requirements 25.2 - THE Operations_Manager SHALL display compliance issues
 */
export async function getComplianceIssues(
  cabinetId: string,
  clientId: string
): Promise<ComplianceCheckServiceResult<ComplianceIssue[]>> {
  try {
    const complianceResult = await checkClientCompliance(cabinetId, clientId)
    
    if (!complianceResult.success || !complianceResult.data) {
      return {
        success: false,
        error: complianceResult.error ?? 'Erreur lors de la vérification',
      }
    }

    return {
      success: true,
      data: complianceResult.data.issues,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des problèmes'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Vérifie si un client est conforme pour une opération
 * 
 * @requirements 25.3 - THE Operations_Manager SHALL block operations if client is not compliant
 */
export async function isClientCompliantForOperation(
  cabinetId: string,
  clientId: string
): Promise<ComplianceCheckServiceResult<{ isCompliant: boolean; blockingIssues: ComplianceIssue[] }>> {
  try {
    const complianceResult = await checkClientCompliance(cabinetId, clientId)
    
    if (!complianceResult.success || !complianceResult.data) {
      return {
        success: false,
        error: complianceResult.error ?? 'Erreur lors de la vérification',
      }
    }

    // Filter for blocking issues (HIGH or CRITICAL severity)
    const blockingIssues = complianceResult.data.issues.filter(
      issue => issue.severity === 'HIGH' || issue.severity === 'CRITICAL'
    )

    return {
      success: true,
      data: {
        isCompliant: complianceResult.data.isCompliant,
        blockingIssues,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la vérification'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère un résumé de conformité pour plusieurs clients
 */
export async function getComplianceSummaryForClients(
  cabinetId: string,
  clientIds: string[]
): Promise<ComplianceCheckServiceResult<Map<string, ComplianceCheckResult>>> {
  try {
    const results = new Map<string, ComplianceCheckResult>()

    for (const clientId of clientIds) {
      const result = await checkClientCompliance(cabinetId, clientId)
      if (result.success && result.data) {
        results.set(clientId, result.data)
      }
    }

    return {
      success: true,
      data: results,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération du résumé'
    return {
      success: false,
      error: message,
    }
  }
}

// ============================================================================
// Internal Check Functions
// ============================================================================

/**
 * Vérifie le statut KYC d'un client
 * 
 * @requirements 25.4 - THE Operations_Manager SHALL verify KYC documents are valid
 */
async function checkKYCStatus(
  cabinetId: string,
  clientId: string
): Promise<{ status: KYCCheckStatus; issues: ComplianceIssue[] }> {
  const issues: ComplianceIssue[] = []
  const now = new Date()

  // Get all KYC documents for the client
  const documents = await prisma.kYCDocument.findMany({
    where: {
      cabinetId,
      clientId,
    },
    select: {
      id: true,
      type: true,
      status: true,
      expiresAt: true,
    },
  })

  // Check for required documents
  const documentTypes = new Set(documents.map(d => d.type))
  const missingDocuments: string[] = []

  for (const requiredType of REQUIRED_KYC_DOCUMENTS) {
    if (!documentTypes.has(requiredType)) {
      missingDocuments.push(requiredType)
    }
  }

  if (missingDocuments.length > 0) {
    issues.push({
      type: 'KYC_MISSING',
      severity: 'HIGH' as AlertSeverity,
      description: `Documents KYC manquants: ${missingDocuments.join(', ')}`,
      actionRequired: 'Téléverser les documents manquants',
      actionUrl: `/dashboard/clients/${clientId}/documents`,
    })
  }

  // Check for expired documents
  const expiredDocuments = documents.filter(
    d => d.status === 'EXPIRE' || (d.expiresAt && d.expiresAt < now)
  )

  if (expiredDocuments.length > 0) {
    issues.push({
      type: 'KYC_EXPIRED',
      severity: 'CRITICAL' as AlertSeverity,
      description: `${expiredDocuments.length} document(s) KYC expiré(s)`,
      actionRequired: 'Renouveler les documents expirés',
      actionUrl: `/dashboard/clients/${clientId}/documents`,
    })
  }

  // Check for documents pending validation
  const pendingDocuments = documents.filter(d => d.status === 'EN_ATTENTE')
  if (pendingDocuments.length > 0) {
    issues.push({
      type: 'KYC_MISSING',
      severity: 'WARNING' as AlertSeverity,
      description: `${pendingDocuments.length} document(s) en attente de validation`,
      actionRequired: 'Valider les documents en attente',
      actionUrl: `/dashboard/conformite/documents`,
    })
  }

  // Determine overall KYC status
  let status: KYCCheckStatus = 'VALID'
  
  if (missingDocuments.length > 0) {
    status = 'INCOMPLETE'
  } else if (expiredDocuments.length > 0) {
    status = 'EXPIRED'
  }

  return { status, issues }
}

/**
 * Vérifie le statut MiFID d'un client
 * 
 * @requirements 25.5 - THE Operations_Manager SHALL verify MiFID questionnaire is up to date
 */
async function checkMiFIDStatus(
  clientId: string
): Promise<{ status: MiFIDCheckStatus; issues: ComplianceIssue[] }> {
  const issues: ComplianceIssue[] = []
  const now = new Date()

  // Get client's MiFID data
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      riskProfile: true,
      investmentHorizon: true,
      investmentGoals: true,
      investmentKnowledge: true,
      investmentExperience: true,
      updatedAt: true,
    },
  })

  if (!client) {
    return {
      status: 'MISSING',
      issues: [{
        type: 'MIFID_OUTDATED',
        severity: 'HIGH' as AlertSeverity,
        description: 'Client non trouvé',
        actionRequired: 'Vérifier les données client',
        actionUrl: `/dashboard/clients/${clientId}`,
      }],
    }
  }

  // Check if MiFID questionnaire has been completed
  if (!client.riskProfile || !client.investmentHorizon) {
    issues.push({
      type: 'MIFID_OUTDATED',
      severity: 'HIGH' as AlertSeverity,
      description: 'Questionnaire MiFID non complété',
      actionRequired: 'Compléter le questionnaire investisseur',
      actionUrl: `/dashboard/clients/${clientId}/mifid`,
    })
    return { status: 'MISSING', issues }
  }

  // Check if MiFID questionnaire is outdated (older than 12 months)
  const mifidCutoffDate = new Date()
  mifidCutoffDate.setDate(mifidCutoffDate.getDate() - MIFID_VALIDITY_DAYS)

  if (client.updatedAt < mifidCutoffDate) {
    issues.push({
      type: 'MIFID_OUTDATED',
      severity: 'WARNING' as AlertSeverity,
      description: 'Questionnaire MiFID obsolète (plus de 12 mois)',
      actionRequired: 'Mettre à jour le questionnaire investisseur',
      actionUrl: `/dashboard/clients/${clientId}/mifid`,
    })
    return { status: 'OUTDATED', issues }
  }

  return { status: 'VALID', issues }
}

/**
 * Vérifie le statut LCB-FT d'un client
 * 
 * @requirements 25.6 - THE Operations_Manager SHALL verify LCB-FT status
 */
function checkLCBFTStatus(
  isPEP: boolean
): { status: LCBFTCheckStatus; issues: ComplianceIssue[] } {
  const issues: ComplianceIssue[] = []

  // Check if client is a PEP (Politically Exposed Person)
  if (isPEP) {
    issues.push({
      type: 'HIGH_RISK_ALERT',
      severity: 'WARNING' as AlertSeverity,
      description: 'Client identifié comme Personne Politiquement Exposée (PPE)',
      actionRequired: 'Vigilance renforcée requise pour toutes les opérations',
      actionUrl: `/dashboard/conformite/controles`,
    })
    return { status: 'PENDING_REVIEW', issues }
  }

  return { status: 'CLEAR', issues }
}

/**
 * Vérifie si un client a des alertes de conformité actives
 */
export async function hasActiveComplianceAlerts(
  cabinetId: string,
  clientId: string
): Promise<ComplianceCheckServiceResult<{ hasAlerts: boolean; alertCount: number }>> {
  try {
    const alertCount = await prisma.complianceAlert.count({
      where: {
        cabinetId,
        clientId,
        resolved: false,
        severity: {
          in: ['HIGH', 'CRITICAL'],
        },
      },
    })

    return {
      success: true,
      data: {
        hasAlerts: alertCount > 0,
        alertCount,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la vérification des alertes'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les actions correctives suggérées pour un client non conforme
 * 
 * @requirements 25.7 - THE Operations_Manager SHALL suggest corrective actions
 */
export async function getSuggestedCorrectiveActions(
  cabinetId: string,
  clientId: string
): Promise<ComplianceCheckServiceResult<{ action: string; url: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }[]>> {
  try {
    const complianceResult = await checkClientCompliance(cabinetId, clientId)
    
    if (!complianceResult.success || !complianceResult.data) {
      return {
        success: false,
        error: complianceResult.error ?? 'Erreur lors de la vérification',
      }
    }

    const actions: { action: string; url: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }[] = []

    for (const issue of complianceResult.data.issues) {
      let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
      
      if (issue.severity === 'CRITICAL') {
        priority = 'HIGH'
      } else if (issue.severity === 'HIGH') {
        priority = 'HIGH'
      } else if (issue.severity === 'WARNING') {
        priority = 'MEDIUM'
      } else {
        priority = 'LOW'
      }

      actions.push({
        action: issue.actionRequired,
        url: issue.actionUrl,
        priority,
      })
    }

    // Sort by priority
    actions.sort((a, b) => {
      const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    return {
      success: true,
      data: actions,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des actions'
    return {
      success: false,
      error: message,
    }
  }
}
