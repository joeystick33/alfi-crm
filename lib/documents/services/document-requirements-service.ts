/**
 * Service de gestion des documents requis par type d'opération
 * 
 * Ce service détermine automatiquement les documents réglementaires requis
 * en fonction du type d'opération et du contexte client.
 * 
 * @module lib/documents/services/document-requirements-service
 * @requirements 22.1-22.4
 */

import { prisma } from '@/app/_common/lib/prisma'
import {
  type RegulatoryDocumentType,
  type OperationType,
  type DocumentRequirement,
  type DocumentCondition,
  OPERATION_REQUIREMENTS_MAP,
  AFFAIRE_NOUVELLE_REQUIREMENTS,
  ARBITRAGE_REQUIREMENTS,
  RACHAT_REQUIREMENTS,
  VERSEMENT_REQUIREMENTS,
  isDocumentConditionMet,
  REGULATORY_DOCUMENT_TYPE_LABELS,
} from '../types'
import type { ProductType } from '../../operations/types'

// ============================================================================
// Types
// ============================================================================

export interface DocumentRequirementsResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Statut d'un document requis
 */
export type RequiredDocumentStatus = 'GENERATED' | 'PENDING' | 'MISSING' | 'EXPIRED' | 'SIGNED'

/**
 * Document requis avec son statut actuel
 */
export interface RequiredDocumentWithStatus {
  documentType: RegulatoryDocumentType
  label: string
  status: RequiredDocumentStatus
  isBlocking: boolean
  condition: DocumentCondition
  documentId: string | null
  generatedAt: Date | null
  signedAt: Date | null
  expiresAt: Date | null
}

/**
 * Résultat de la vérification des documents requis
 */
export interface DocumentCheckResult {
  operationType: OperationType
  clientId: string
  affaireId?: string
  operationId?: string
  isCompliant: boolean
  blockingIssues: string[]
  requiredDocuments: RequiredDocumentWithStatus[]
  missingCount: number
  expiredCount: number
  pendingCount: number
  generatedCount: number
  signedCount: number
}

/**
 * Contexte pour évaluer les conditions de documents
 */
export interface DocumentConditionContext {
  isFirstRelation: boolean
  lastRecueilDate?: Date
  lastMifidDate?: Date
  amount?: number
  productType?: ProductType
  allocationChanged?: boolean
}

// ============================================================================
// Document Requirements Service
// ============================================================================

/**
 * Récupère les documents requis pour une opération
 * 
 * @requirements 22.1 - WHEN creating an Affaire Nouvelle, THE Document_Generator SHALL require/suggest based on context
 * @requirements 22.2 - WHEN creating an Arbitrage, THE Document_Generator SHALL require specific documents
 * @requirements 22.3 - WHEN creating a Rachat, THE Document_Generator SHALL require specific documents
 * @requirements 22.4 - WHEN creating a Versement complémentaire, THE Document_Generator SHALL require specific documents
 */
export async function getRequiredDocuments(
  cabinetId: string,
  clientId: string,
  operationType: OperationType,
  context?: Partial<DocumentConditionContext>
): Promise<DocumentRequirementsResult<RequiredDocumentWithStatus[]>> {
  try {
    // Get base requirements for the operation type
    const baseRequirements = OPERATION_REQUIREMENTS_MAP[operationType] || []

    // Build the full context
    const fullContext = await buildConditionContext(cabinetId, clientId, context)

    // Filter requirements based on conditions
    const applicableRequirements = baseRequirements.filter(req =>
      isDocumentConditionMet(req.condition, fullContext)
    )

    // Get existing documents for this client
    const existingDocuments = await (prisma as unknown as { 
      regulatoryGeneratedDocument: { 
        findMany: (args: unknown) => Promise<Array<{ id: string; documentType: string; status: string; generatedAt: Date; signedAt: Date | null; expiresAt: Date | null }>> 
      } 
    }).regulatoryGeneratedDocument.findMany({
      where: {
        cabinetId,
        clientId,
        documentType: { in: applicableRequirements.map(r => r.documentType) },
      },
      orderBy: { generatedAt: 'desc' },
    })

    // Build the result with status for each required document
    const requiredDocuments: RequiredDocumentWithStatus[] = applicableRequirements.map(req => {
      // Find the most recent document of this type
      const existingDoc = existingDocuments.find(d => d.documentType === req.documentType)

      let status: RequiredDocumentStatus = 'MISSING'
      let documentId: string | null = null
      let generatedAt: Date | null = null
      let signedAt: Date | null = null
      let expiresAt: Date | null = null

      if (existingDoc) {
        documentId = existingDoc.id
        generatedAt = existingDoc.generatedAt
        signedAt = existingDoc.signedAt
        expiresAt = existingDoc.expiresAt

        // Check if expired
        if (expiresAt && new Date() > expiresAt) {
          status = 'EXPIRED'
        } else if (existingDoc.status === 'SIGNED') {
          status = 'SIGNED'
        } else if (existingDoc.status === 'FINAL') {
          status = 'GENERATED'
        } else {
          status = 'PENDING'
        }
      }

      return {
        documentType: req.documentType,
        label: REGULATORY_DOCUMENT_TYPE_LABELS[req.documentType],
        status,
        isBlocking: req.isBlocking,
        condition: req.condition,
        documentId,
        generatedAt,
        signedAt,
        expiresAt,
      }
    })

    return {
      success: true,
      data: requiredDocuments,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des documents requis'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Vérifie le statut de conformité documentaire pour une opération
 * 
 * @requirements 22.5 - THE Operations_Manager SHALL display a compliance checklist for each operation
 * @requirements 22.6 - THE Operations_Manager SHALL block operation submission when required documents are missing
 */
export async function checkDocumentStatus(
  cabinetId: string,
  clientId: string,
  operationType: OperationType,
  affaireId?: string,
  operationId?: string,
  context?: Partial<DocumentConditionContext>
): Promise<DocumentRequirementsResult<DocumentCheckResult>> {
  try {
    // Get required documents with their status
    const requiredResult = await getRequiredDocuments(cabinetId, clientId, operationType, context)
    
    if (!requiredResult.success || !requiredResult.data) {
      return {
        success: false,
        error: requiredResult.error || 'Erreur lors de la vérification des documents',
      }
    }

    const requiredDocuments = requiredResult.data

    // Calculate counts
    const missingCount = requiredDocuments.filter(d => d.status === 'MISSING').length
    const expiredCount = requiredDocuments.filter(d => d.status === 'EXPIRED').length
    const pendingCount = requiredDocuments.filter(d => d.status === 'PENDING').length
    const generatedCount = requiredDocuments.filter(d => d.status === 'GENERATED').length
    const signedCount = requiredDocuments.filter(d => d.status === 'SIGNED').length

    // Identify blocking issues
    const blockingIssues: string[] = []

    for (const doc of requiredDocuments) {
      if (doc.isBlocking) {
        if (doc.status === 'MISSING') {
          blockingIssues.push(`Document manquant: ${doc.label}`)
        } else if (doc.status === 'EXPIRED') {
          blockingIssues.push(`Document expiré: ${doc.label}`)
        }
      }
    }

    // Check KYC status
    const kycStatus = await checkKYCStatus(cabinetId, clientId)
    if (!kycStatus.isValid) {
      blockingIssues.push(...kycStatus.issues)
    }

    // Check MiFID status
    const mifidStatus = await checkMiFIDStatus(clientId)
    if (!mifidStatus.isValid) {
      blockingIssues.push(...mifidStatus.issues)
    }

    const isCompliant = blockingIssues.length === 0

    return {
      success: true,
      data: {
        operationType,
        clientId,
        affaireId,
        operationId,
        isCompliant,
        blockingIssues,
        requiredDocuments,
        missingCount,
        expiredCount,
        pendingCount,
        generatedCount,
        signedCount,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la vérification du statut'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les documents requis pour une affaire nouvelle
 * 
 * @requirements 22.1 - Documents requis pour une nouvelle souscription
 */
export async function getAffaireNouvelleRequirements(
  cabinetId: string,
  clientId: string,
  productType?: ProductType,
  amount?: number
): Promise<DocumentRequirementsResult<RequiredDocumentWithStatus[]>> {
  const context: Partial<DocumentConditionContext> = {
    productType,
    amount,
  }

  return getRequiredDocuments(cabinetId, clientId, 'AFFAIRE_NOUVELLE', context)
}

/**
 * Récupère les documents requis pour un arbitrage
 * 
 * @requirements 22.2 - Documents requis pour un arbitrage
 */
export async function getArbitrageRequirements(
  cabinetId: string,
  clientId: string
): Promise<DocumentRequirementsResult<RequiredDocumentWithStatus[]>> {
  return getRequiredDocuments(cabinetId, clientId, 'ARBITRAGE')
}

/**
 * Récupère les documents requis pour un rachat
 * 
 * @requirements 22.3 - Documents requis pour un rachat
 */
export async function getRachatRequirements(
  cabinetId: string,
  clientId: string,
  isPartial: boolean = true
): Promise<DocumentRequirementsResult<RequiredDocumentWithStatus[]>> {
  const operationType = isPartial ? 'RACHAT_PARTIEL' : 'RACHAT_TOTAL'
  return getRequiredDocuments(cabinetId, clientId, operationType)
}

/**
 * Récupère les documents requis pour un versement complémentaire
 * 
 * @requirements 22.4 - Documents requis pour un versement complémentaire
 */
export async function getVersementRequirements(
  cabinetId: string,
  clientId: string,
  allocationChanged: boolean = false
): Promise<DocumentRequirementsResult<RequiredDocumentWithStatus[]>> {
  const context: Partial<DocumentConditionContext> = {
    allocationChanged,
  }

  return getRequiredDocuments(cabinetId, clientId, 'VERSEMENT_COMPLEMENTAIRE', context)
}

/**
 * Vérifie si une opération peut être soumise (tous les documents bloquants sont présents)
 * 
 * @requirements 22.6 - Block operation submission when required documents are missing
 */
export async function canSubmitOperation(
  cabinetId: string,
  clientId: string,
  operationType: OperationType,
  context?: Partial<DocumentConditionContext>
): Promise<DocumentRequirementsResult<{ canSubmit: boolean; blockingReasons: string[] }>> {
  try {
    const checkResult = await checkDocumentStatus(cabinetId, clientId, operationType, undefined, undefined, context)

    if (!checkResult.success || !checkResult.data) {
      return {
        success: false,
        error: checkResult.error,
      }
    }

    return {
      success: true,
      data: {
        canSubmit: checkResult.data.isCompliant,
        blockingReasons: checkResult.data.blockingIssues,
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

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Construit le contexte complet pour évaluer les conditions de documents
 */
async function buildConditionContext(
  cabinetId: string,
  clientId: string,
  partialContext?: Partial<DocumentConditionContext>
): Promise<DocumentConditionContext> {
  // Check if this is the first relation with the client
  const existingDocuments = await (prisma as unknown as { 
    regulatoryGeneratedDocument: { 
      count: (args: unknown) => Promise<number> 
    } 
  }).regulatoryGeneratedDocument.count({
    where: {
      cabinetId,
      clientId,
      documentType: 'DER',
    },
  })
  const isFirstRelation = existingDocuments === 0

  // Get the last Recueil d'Informations date
  const lastRecueil = await (prisma as unknown as { 
    regulatoryGeneratedDocument: { 
      findFirst: (args: unknown) => Promise<{ generatedAt: Date } | null> 
    } 
  }).regulatoryGeneratedDocument.findFirst({
    where: {
      cabinetId,
      clientId,
      documentType: 'RECUEIL_INFORMATIONS',
      status: { in: ['FINAL', 'SIGNED'] },
    },
    orderBy: { generatedAt: 'desc' },
    select: { generatedAt: true },
  })

  // Get the last MiFID questionnaire date
  const lastMifid = await (prisma as unknown as { 
    regulatoryGeneratedDocument: { 
      findFirst: (args: unknown) => Promise<{ generatedAt: Date } | null> 
    } 
  }).regulatoryGeneratedDocument.findFirst({
    where: {
      cabinetId,
      clientId,
      documentType: 'QUESTIONNAIRE_MIFID',
      status: { in: ['FINAL', 'SIGNED'] },
    },
    orderBy: { generatedAt: 'desc' },
    select: { generatedAt: true },
  })

  return {
    isFirstRelation,
    lastRecueilDate: lastRecueil?.generatedAt ?? undefined,
    lastMifidDate: lastMifid?.generatedAt ?? undefined,
    amount: partialContext?.amount,
    productType: partialContext?.productType,
    allocationChanged: partialContext?.allocationChanged ?? false,
  }
}

/**
 * Vérifie le statut KYC du client
 */
async function checkKYCStatus(
  cabinetId: string,
  clientId: string
): Promise<{ isValid: boolean; issues: string[] }> {
  const issues: string[] = []

  // Get all KYC documents for the client
  const kycDocuments = await prisma.kYCDocument.findMany({
    where: {
      cabinetId,
      clientId,
    },
  })

  // Check for expired documents
  const now = new Date()
  const expiredDocs = kycDocuments.filter(
    doc => doc.status === 'EXPIRE' || (doc.expiresAt && doc.expiresAt < now)
  )

  if (expiredDocs.length > 0) {
    issues.push(`${expiredDocs.length} document(s) KYC expiré(s)`)
  }

  // Check for required document types that are missing or not validated
  const requiredTypes = ['PIECE_IDENTITE', 'JUSTIFICATIF_DOMICILE']
  for (const type of requiredTypes) {
    const doc = kycDocuments.find(d => d.type === type && d.status === 'VALIDE')
    if (!doc) {
      issues.push(`Document KYC manquant ou non validé: ${type}`)
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  }
}

/**
 * Vérifie le statut du questionnaire MiFID
 */
async function checkMiFIDStatus(
  clientId: string
): Promise<{ isValid: boolean; issues: string[] }> {
  const issues: string[] = []

  // Get the client's risk profile and last MiFID update
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      riskProfile: true,
      investmentHorizon: true,
      updatedAt: true,
    },
  })

  if (!client) {
    issues.push('Client non trouvé')
    return { isValid: false, issues }
  }

  // Check if MiFID profile is set
  if (!client.riskProfile || !client.investmentHorizon) {
    issues.push('Questionnaire MiFID non complété')
    return { isValid: false, issues }
  }

  // Check if MiFID is outdated (>12 months)
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)

  // Note: In a real implementation, we would track the MiFID completion date separately
  // For now, we use the client's updatedAt as a proxy

  return {
    isValid: issues.length === 0,
    issues,
  }
}

/**
 * Obtient le label français d'un type de document
 */
export function getDocumentTypeLabel(documentType: RegulatoryDocumentType): string {
  return REGULATORY_DOCUMENT_TYPE_LABELS[documentType]
}

/**
 * Obtient le label français d'un statut de document
 */
export function getDocumentStatusLabel(status: RequiredDocumentStatus): string {
  const labels: Record<RequiredDocumentStatus, string> = {
    GENERATED: 'Généré',
    PENDING: 'En attente',
    MISSING: 'Manquant',
    EXPIRED: 'Expiré',
    SIGNED: 'Signé',
  }
  return labels[status]
}

/**
 * Obtient la couleur associée à un statut de document
 */
export function getDocumentStatusColor(status: RequiredDocumentStatus): string {
  const colors: Record<RequiredDocumentStatus, string> = {
    GENERATED: 'blue',
    PENDING: 'yellow',
    MISSING: 'red',
    EXPIRED: 'red',
    SIGNED: 'green',
  }
  return colors[status]
}
