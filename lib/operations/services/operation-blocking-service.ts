/**
 * Service de blocage des opérations
 * 
 * Ce service vérifie si une opération peut être créée ou progresser
 * en fonction des documents requis et de la conformité:
 * - Vérification des documents requis par type d'opération
 * - Détection des raisons de blocage
 * - Génération de la liste des documents manquants
 * 
 * @module lib/operations/services/operation-blocking-service
 * @requirements 22.5-22.8
 */

import { prisma } from '@/app/_common/lib/prisma'
import {
  type ProductType,
  type OperationGestionType,
  type AffaireStatus,
} from '../types'
import { checkClientCompliance } from './compliance-check-service'

// ============================================================================
// Types
// ============================================================================

export interface OperationBlockingServiceResult<T> {
  success: boolean
  data?: T
  error?: string
}

export interface BlockingReason {
  type: 'DOCUMENT_MISSING' | 'DOCUMENT_EXPIRED' | 'KYC_INCOMPLETE' | 'MIFID_OUTDATED' | 'COMPLIANCE_ISSUE'
  severity: 'BLOCKING' | 'WARNING'
  description: string
  actionRequired: string
  documentType?: string
}

export interface OperationBlockingResult {
  isBlocked: boolean
  canProceedWithWarnings: boolean
  blockingReasons: BlockingReason[]
  warningReasons: BlockingReason[]
  missingDocuments: string[]
  expiredDocuments: string[]
}

/**
 * Documents requis par type de produit pour les affaires nouvelles
 */
const AFFAIRE_NOUVELLE_REQUIRED_DOCUMENTS: Record<ProductType, string[]> = {
  ASSURANCE_VIE: ['DER', 'RECUEIL_INFORMATIONS', 'QUESTIONNAIRE_MIFID', 'LETTRE_MISSION', 'BULLETIN_SOUSCRIPTION'],
  PER_INDIVIDUEL: ['DER', 'RECUEIL_INFORMATIONS', 'QUESTIONNAIRE_MIFID', 'LETTRE_MISSION', 'BULLETIN_SOUSCRIPTION'],
  PER_ENTREPRISE: ['DER', 'RECUEIL_INFORMATIONS', 'QUESTIONNAIRE_MIFID', 'LETTRE_MISSION', 'BULLETIN_SOUSCRIPTION'],
  SCPI: ['DER', 'RECUEIL_INFORMATIONS', 'QUESTIONNAIRE_MIFID', 'LETTRE_MISSION', 'BULLETIN_SOUSCRIPTION'],
  OPCI: ['DER', 'RECUEIL_INFORMATIONS', 'QUESTIONNAIRE_MIFID', 'LETTRE_MISSION', 'BULLETIN_SOUSCRIPTION'],
  COMPTE_TITRES: ['DER', 'RECUEIL_INFORMATIONS', 'QUESTIONNAIRE_MIFID', 'LETTRE_MISSION'],
  PEA: ['DER', 'RECUEIL_INFORMATIONS', 'QUESTIONNAIRE_MIFID', 'LETTRE_MISSION'],
  PEA_PME: ['DER', 'RECUEIL_INFORMATIONS', 'QUESTIONNAIRE_MIFID', 'LETTRE_MISSION'],
  CAPITALISATION: ['DER', 'RECUEIL_INFORMATIONS', 'QUESTIONNAIRE_MIFID', 'LETTRE_MISSION', 'BULLETIN_SOUSCRIPTION'],
  FCPR: ['DER', 'RECUEIL_INFORMATIONS', 'QUESTIONNAIRE_MIFID', 'LETTRE_MISSION', 'BULLETIN_SOUSCRIPTION'],
  FCPI: ['DER', 'RECUEIL_INFORMATIONS', 'QUESTIONNAIRE_MIFID', 'LETTRE_MISSION', 'BULLETIN_SOUSCRIPTION'],
  FIP: ['DER', 'RECUEIL_INFORMATIONS', 'QUESTIONNAIRE_MIFID', 'LETTRE_MISSION', 'BULLETIN_SOUSCRIPTION'],
  IMMOBILIER_DIRECT: ['DER', 'RECUEIL_INFORMATIONS', 'LETTRE_MISSION'],
  CREDIT_IMMOBILIER: ['DER', 'RECUEIL_INFORMATIONS', 'LETTRE_MISSION'],
}

/**
 * Documents requis par type d'opération de gestion
 */
const OPERATION_GESTION_REQUIRED_DOCUMENTS: Record<OperationGestionType, string[]> = {
  VERSEMENT_COMPLEMENTAIRE: ['BULLETIN_VERSEMENT', 'DECLARATION_ADEQUATION'],
  ARBITRAGE: ['ORDRE_ARBITRAGE', 'DECLARATION_ADEQUATION', 'RAPPORT_MISSION'],
  RACHAT_PARTIEL: ['DEMANDE_RACHAT', 'SIMULATION_FISCALE'],
  RACHAT_TOTAL: ['DEMANDE_RACHAT', 'SIMULATION_FISCALE'],
  AVANCE: ['DEMANDE_RACHAT'],
  MODIFICATION_BENEFICIAIRE: ['ATTESTATION_CONSEIL'],
  CHANGEMENT_OPTION_GESTION: ['ATTESTATION_CONSEIL'],
  TRANSFERT: ['LETTRE_MISSION', 'DECLARATION_ADEQUATION'],
}

/**
 * Documents bloquants (l'opération ne peut pas progresser sans eux)
 */
const BLOCKING_DOCUMENTS = [
  'DER',
  'RECUEIL_INFORMATIONS',
  'QUESTIONNAIRE_MIFID',
  'BULLETIN_SOUSCRIPTION',
  'DEMANDE_RACHAT',
  'ORDRE_ARBITRAGE',
  'BULLETIN_VERSEMENT',
]

// ============================================================================
// Operation Blocking Service
// ============================================================================

/**
 * Vérifie si une affaire nouvelle est bloquée
 * 
 * @requirements 22.5 - THE Operations_Manager SHALL verify required documents before allowing operation to proceed
 */
export async function checkAffaireBlocking(
  cabinetId: string,
  clientId: string,
  productType: ProductType,
  affaireId?: string
): Promise<OperationBlockingServiceResult<OperationBlockingResult>> {
  try {
    const blockingReasons: BlockingReason[] = []
    const warningReasons: BlockingReason[] = []
    const missingDocuments: string[] = []
    const expiredDocuments: string[] = []

    // Check compliance status
    const complianceResult = await checkClientCompliance(cabinetId, clientId)
    if (complianceResult.success && complianceResult.data) {
      if (!complianceResult.data.isCompliant) {
        // Add compliance issues as blocking reasons
        for (const issue of complianceResult.data.issues) {
          const reason: BlockingReason = {
            type: issue.type === 'KYC_EXPIRED' ? 'KYC_INCOMPLETE' : 
                  issue.type === 'MIFID_OUTDATED' ? 'MIFID_OUTDATED' : 'COMPLIANCE_ISSUE',
            severity: issue.severity === 'CRITICAL' || issue.severity === 'HIGH' ? 'BLOCKING' : 'WARNING',
            description: issue.description,
            actionRequired: issue.actionRequired,
          }

          if (reason.severity === 'BLOCKING') {
            blockingReasons.push(reason)
          } else {
            warningReasons.push(reason)
          }
        }
      }
    }

    // Check required documents for this product type
    const requiredDocs = AFFAIRE_NOUVELLE_REQUIRED_DOCUMENTS[productType] || []
    
    // Get generated documents for this client/affaire
    const generatedDocs = await getGeneratedDocuments(cabinetId, clientId, affaireId)
    const generatedDocTypes = new Set(generatedDocs.map(d => d.documentType))

    for (const docType of requiredDocs) {
      if (!generatedDocTypes.has(docType)) {
        missingDocuments.push(docType)
        
        const isBlocking = BLOCKING_DOCUMENTS.includes(docType)
        const reason: BlockingReason = {
          type: 'DOCUMENT_MISSING',
          severity: isBlocking ? 'BLOCKING' : 'WARNING',
          description: `Document manquant: ${getDocumentTypeLabel(docType)}`,
          actionRequired: `Générer le document ${getDocumentTypeLabel(docType)}`,
          documentType: docType,
        }

        if (isBlocking) {
          blockingReasons.push(reason)
        } else {
          warningReasons.push(reason)
        }
      }
    }

    // Check for expired documents
    const expiredDocs = generatedDocs.filter(d => d.expiresAt && d.expiresAt < new Date())
    for (const doc of expiredDocs) {
      expiredDocuments.push(doc.documentType)
      
      const isBlocking = BLOCKING_DOCUMENTS.includes(doc.documentType)
      const reason: BlockingReason = {
        type: 'DOCUMENT_EXPIRED',
        severity: isBlocking ? 'BLOCKING' : 'WARNING',
        description: `Document expiré: ${getDocumentTypeLabel(doc.documentType)}`,
        actionRequired: `Renouveler le document ${getDocumentTypeLabel(doc.documentType)}`,
        documentType: doc.documentType,
      }

      if (isBlocking) {
        blockingReasons.push(reason)
      } else {
        warningReasons.push(reason)
      }
    }

    const isBlocked = blockingReasons.length > 0
    const canProceedWithWarnings = !isBlocked && warningReasons.length > 0

    return {
      success: true,
      data: {
        isBlocked,
        canProceedWithWarnings,
        blockingReasons,
        warningReasons,
        missingDocuments,
        expiredDocuments,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la vérification du blocage'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Vérifie si une opération de gestion est bloquée
 * 
 * @requirements 22.6 - THE Operations_Manager SHALL block operations with missing required documents
 */
export async function checkOperationGestionBlocking(
  cabinetId: string,
  clientId: string,
  operationType: OperationGestionType,
  operationId?: string
): Promise<OperationBlockingServiceResult<OperationBlockingResult>> {
  try {
    const blockingReasons: BlockingReason[] = []
    const warningReasons: BlockingReason[] = []
    const missingDocuments: string[] = []
    const expiredDocuments: string[] = []

    // Check compliance status
    const complianceResult = await checkClientCompliance(cabinetId, clientId)
    if (complianceResult.success && complianceResult.data) {
      if (!complianceResult.data.isCompliant) {
        for (const issue of complianceResult.data.issues) {
          const reason: BlockingReason = {
            type: issue.type === 'KYC_EXPIRED' ? 'KYC_INCOMPLETE' : 
                  issue.type === 'MIFID_OUTDATED' ? 'MIFID_OUTDATED' : 'COMPLIANCE_ISSUE',
            severity: issue.severity === 'CRITICAL' || issue.severity === 'HIGH' ? 'BLOCKING' : 'WARNING',
            description: issue.description,
            actionRequired: issue.actionRequired,
          }

          if (reason.severity === 'BLOCKING') {
            blockingReasons.push(reason)
          } else {
            warningReasons.push(reason)
          }
        }
      }
    }

    // Check required documents for this operation type
    const requiredDocs = OPERATION_GESTION_REQUIRED_DOCUMENTS[operationType] || []
    
    // Get generated documents for this client/operation
    const generatedDocs = await getGeneratedDocumentsForOperation(cabinetId, clientId, operationId)
    const generatedDocTypes = new Set(generatedDocs.map(d => d.documentType))

    for (const docType of requiredDocs) {
      if (!generatedDocTypes.has(docType)) {
        missingDocuments.push(docType)
        
        const isBlocking = BLOCKING_DOCUMENTS.includes(docType)
        const reason: BlockingReason = {
          type: 'DOCUMENT_MISSING',
          severity: isBlocking ? 'BLOCKING' : 'WARNING',
          description: `Document manquant: ${getDocumentTypeLabel(docType)}`,
          actionRequired: `Générer le document ${getDocumentTypeLabel(docType)}`,
          documentType: docType,
        }

        if (isBlocking) {
          blockingReasons.push(reason)
        } else {
          warningReasons.push(reason)
        }
      }
    }

    const isBlocked = blockingReasons.length > 0
    const canProceedWithWarnings = !isBlocked && warningReasons.length > 0

    return {
      success: true,
      data: {
        isBlocked,
        canProceedWithWarnings,
        blockingReasons,
        warningReasons,
        missingDocuments,
        expiredDocuments,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la vérification du blocage'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les raisons de blocage pour une affaire
 * 
 * @requirements 22.7 - THE Operations_Manager SHALL display blocking reasons
 */
export async function getBlockingReasons(
  cabinetId: string,
  clientId: string,
  productType?: ProductType,
  operationType?: OperationGestionType,
  affaireId?: string,
  operationId?: string
): Promise<OperationBlockingServiceResult<BlockingReason[]>> {
  try {
    let result: OperationBlockingResult | undefined

    if (productType) {
      const blockingResult = await checkAffaireBlocking(cabinetId, clientId, productType, affaireId)
      if (blockingResult.success) {
        result = blockingResult.data
      }
    } else if (operationType) {
      const blockingResult = await checkOperationGestionBlocking(cabinetId, clientId, operationType, operationId)
      if (blockingResult.success) {
        result = blockingResult.data
      }
    }

    if (!result) {
      return {
        success: false,
        error: 'Type de produit ou d\'opération requis',
      }
    }

    // Combine blocking and warning reasons
    const allReasons = [...result.blockingReasons, ...result.warningReasons]

    return {
      success: true,
      data: allReasons,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération des raisons de blocage'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère les documents requis pour un type de produit
 */
export function getRequiredDocumentsForProduct(productType: ProductType): string[] {
  return AFFAIRE_NOUVELLE_REQUIRED_DOCUMENTS[productType] || []
}

/**
 * Récupère les documents requis pour un type d'opération de gestion
 */
export function getRequiredDocumentsForOperation(operationType: OperationGestionType): string[] {
  return OPERATION_GESTION_REQUIRED_DOCUMENTS[operationType] || []
}

/**
 * Vérifie si un document est bloquant
 */
export function isBlockingDocument(documentType: string): boolean {
  return BLOCKING_DOCUMENTS.includes(documentType)
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Récupère les documents générés pour un client/affaire
 */
async function getGeneratedDocuments(
  cabinetId: string,
  clientId: string,
  affaireId?: string
): Promise<{ documentType: string; expiresAt: Date | null }[]> {
  const where: Record<string, unknown> = {
    cabinetId,
    clientId,
  }

  if (affaireId) {
    where.affaireId = affaireId
  }

  const documents = await prisma.regulatoryGeneratedDocument.findMany({
    where,
    select: {
      documentType: true,
      expiresAt: true,
    },
  })

  return documents
}

/**
 * Récupère les documents générés pour un client/opération
 */
async function getGeneratedDocumentsForOperation(
  cabinetId: string,
  clientId: string,
  operationId?: string
): Promise<{ documentType: string; expiresAt: Date | null }[]> {
  const where: Record<string, unknown> = {
    cabinetId,
    clientId,
  }

  if (operationId) {
    where.operationId = operationId
  }

  const documents = await prisma.regulatoryGeneratedDocument.findMany({
    where,
    select: {
      documentType: true,
      expiresAt: true,
    },
  })

  return documents
}

/**
 * Obtient le label français d'un type de document
 */
function getDocumentTypeLabel(documentType: string): string {
  const labels: Record<string, string> = {
    DER: "Document d'Entrée en Relation",
    RECUEIL_INFORMATIONS: "Recueil d'Informations Client",
    LETTRE_MISSION: 'Lettre de Mission',
    RAPPORT_MISSION: 'Rapport de Mission',
    CONVENTION_HONORAIRES: "Convention d'Honoraires",
    ATTESTATION_CONSEIL: 'Attestation de Conseil',
    MANDAT_GESTION: 'Mandat de Gestion',
    DECLARATION_ADEQUATION: "Déclaration d'Adéquation",
    QUESTIONNAIRE_MIFID: 'Questionnaire MiFID II',
    BULLETIN_SOUSCRIPTION: 'Bulletin de Souscription',
    ORDRE_ARBITRAGE: "Ordre d'Arbitrage",
    DEMANDE_RACHAT: 'Demande de Rachat',
    BULLETIN_VERSEMENT: 'Bulletin de Versement Complémentaire',
    SIMULATION_FISCALE: 'Simulation Fiscale',
  }

  return labels[documentType] || documentType
}

/**
 * Récupère le statut de blocage d'une affaire existante
 * 
 * @requirements 22.8 - THE Operations_Manager SHALL track blocking status
 */
export async function getAffaireBlockingStatus(
  affaireId: string
): Promise<OperationBlockingServiceResult<OperationBlockingResult>> {
  try {
    const affaire = await prisma.affaireNouvelle.findUnique({
      where: { id: affaireId },
      select: {
        cabinetId: true,
        clientId: true,
        productType: true,
      },
    })

    if (!affaire) {
      return {
        success: false,
        error: 'Affaire non trouvée',
      }
    }

    return checkAffaireBlocking(
      affaire.cabinetId,
      affaire.clientId,
      affaire.productType as ProductType,
      affaireId
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération du statut de blocage'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Récupère le statut de blocage d'une opération de gestion existante
 */
export async function getOperationBlockingStatus(
  operationId: string
): Promise<OperationBlockingServiceResult<OperationBlockingResult>> {
  try {
    const operation = await prisma.operationGestion.findUnique({
      where: { id: operationId },
      select: {
        cabinetId: true,
        clientId: true,
        type: true,
      },
    })

    if (!operation) {
      return {
        success: false,
        error: 'Opération non trouvée',
      }
    }

    return checkOperationGestionBlocking(
      operation.cabinetId,
      operation.clientId,
      operation.type as OperationGestionType,
      operationId
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur lors de la récupération du statut de blocage'
    return {
      success: false,
      error: message,
    }
  }
}
