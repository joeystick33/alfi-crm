 
import { getPrismaClient } from '../prisma'
import { SignatureStatus, SignatureProvider } from '@prisma/client'

export interface SignatureStep {
  signerEmail: string
  signerName: string
  signerRole?: string
  signatureType?: string
  expiresAt?: Date
}

export interface InitiateSignatureInput {
  documentId: string
  steps: SignatureStep[]
  provider: SignatureProvider
  providerId?: string
}

export interface UpdateSignatureStepInput {
  status: SignatureStatus
  signedAt?: Date
  signatureData?: any
}

/**
 * Signature Service
 * 
 * Manages electronic signature workflows with multi-signer support.
 * Integrates with external signature providers (Yousign, DocuSign, etc.).
 * 
 * Features:
 * - Multi-step signature workflows
 * - Sequential or parallel signature processes
 * - Signature status tracking per signer
 * - Automatic reminder system
 * - Provider integration abstraction
 * - Document status synchronization
 * 
 * @example
 * const service = new SignatureService(cabinetId, userId)
 * const workflow = await service.initiateSignature({
 *   documentId: 'doc-123',
 *   steps: [
 *     { signerEmail: 'client@example.com', signerName: 'John Doe', signerRole: 'Client' },
 *     { signerEmail: 'advisor@example.com', signerName: 'Jane Smith', signerRole: 'Advisor' }
 *   ],
 *   provider: 'YOUSIGN'
 * })
 */
export class SignatureService {
  private prisma
  
  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Initiates a signature workflow for a document
   * 
   * Creates all signature steps and sets document status to IN_PROGRESS.
   * Steps are numbered sequentially for tracking.
   * 
   * @param data - Signature initiation data with document ID, steps, and provider
   * @returns Created signature workflow steps
   * @throws Error if document not found or already has active workflow
   */
  async initiateSignature(data: InitiateSignatureInput) {
    // Verify document exists and belongs to cabinet
    const document = await this.prisma.document.findFirst({
      where: {
        id: data.documentId,
        cabinetId: this.cabinetId,
      },
    })

    if (!document) {
      throw new Error('Document not found or access denied')
    }

    // Check if document already has an active signature workflow
    const existingSteps = await this.prisma.signatureWorkflowStep.findFirst({
      where: {
        documentId: data.documentId,
        status: {
          in: ['EN_ATTENTE', 'EN_COURS'],
        },
      },
    })

    if (existingSteps) {
      throw new Error('Document already has an active signature workflow')
    }

    // Create signature steps
    const steps = await Promise.all(
      data.steps.map((step, index) =>
        this.prisma.signatureWorkflowStep.create({
          data: {
            documentId: data.documentId,
            stepOrder: index + 1,
            signerEmail: step.signerEmail,
            signerName: step.signerName,
            signerRole: step.signerRole,
            signatureType: step.signatureType || 'ELECTRONIC',
            status: 'EN_ATTENTE',
            expiresAt: step.expiresAt,
          },
        })
      )
    )

    // Update document with signature info
    await this.prisma.document.update({
      where: { id: data.documentId },
      data: {
        signatureStatus: 'EN_COURS',
        signatureProvider: data.provider,
        signatureProviderId: data.providerId,
        signatureWorkflow: {
          totalSteps: steps.length,
          completedSteps: 0,
          initiatedAt: new Date(),
          initiatedBy: this.userId,
        },
      },
    })

    // Create timeline event
    const clientDocuments = await this.prisma.clientDocument.findFirst({
      where: { documentId: data.documentId },
      select: { clientId: true },
    })

    if (clientDocuments) {
      await this.prisma.timelineEvent.create({
        data: {
          cabinetId: this.cabinetId,
          clientId: clientDocuments.clientId,
          type: 'AUTRE',
          title: 'Signature initiée',
          description: `Workflow de signature initié pour ${document.name}`,
          relatedEntityType: 'Document',
          relatedEntityId: data.documentId,
          createdBy: this.userId,
        },
      })
    }

    return steps
  }

  /**
   * Retrieves all signature steps for a document
   * 
   * Returns steps ordered by step order for sequential processing.
   * 
   * @param documentId - Document ID
   * @returns Array of signature workflow steps
   */
  async getSignatureSteps(documentId: string) {
    const steps = await this.prisma.signatureWorkflowStep.findMany({
      where: { documentId },
      orderBy: { stepOrder: 'asc' },
    })

    return steps
  }

  /**
   * Updates a single signature step status
   * 
   * Automatically updates document status when all steps are completed or if any fails.
   * Creates timeline event for signature completion.
   * 
   * @param stepId - Signature step ID
   * @param data - Update data with status and optional signature metadata
   * @returns Updated signature step
   * @throws Error if step not found
   */
  async updateSignatureStep(stepId: string, data: UpdateSignatureStepInput) {
    const step = await this.prisma.signatureWorkflowStep.findUnique({
      where: { id: stepId },
      include: {
        document: {
          select: {
            id: true,
            name: true,
            cabinetId: true,
            signatureWorkflow: true,
          },
        },
      },
    })

    if (!step) {
      throw new Error('Signature step not found')
    }

    // Verify cabinet access
    if (step.document.cabinetId !== this.cabinetId) {
      throw new Error('Access denied')
    }

    // Update the step
    const updatedStep = await this.prisma.signatureWorkflowStep.update({
      where: { id: stepId },
      data: {
        status: data.status,
        signedAt: data.signedAt || (data.status === 'SIGNE' ? new Date() : undefined),
        signatureData: data.signatureData,
        updatedAt: new Date(),
      },
    })

    // Get all steps to check overall workflow status
    const allSteps = await this.prisma.signatureWorkflowStep.findMany({
      where: { documentId: step.documentId },
    })

    const completedCount = allSteps.filter(s => s.status === 'SIGNE').length
    const rejectedCount = allSteps.filter(s => s.status === 'REJETE').length
    const totalSteps = allSteps.length

    // Update document status based on workflow progress
    let newDocumentStatus: SignatureStatus | undefined

    if (completedCount === totalSteps) {
      newDocumentStatus = 'SIGNE'
    } else if (rejectedCount > 0) {
      newDocumentStatus = 'REJETE'
    } else if (completedCount > 0) {
      newDocumentStatus = 'PARTIELLEMENT_SIGNE'
    } else {
      newDocumentStatus = 'EN_COURS'
    }

    // Update document
    await this.prisma.document.update({
      where: { id: step.documentId },
      data: {
        signatureStatus: newDocumentStatus,
        signedAt: newDocumentStatus === 'SIGNE' ? new Date() : undefined,
        signatureWorkflow: {
          ...(step.document.signatureWorkflow as any),
          completedSteps: completedCount,
          rejectedSteps: rejectedCount,
          lastUpdatedAt: new Date(),
        },
      },
    })

    // Create timeline event if step was signed
    if (data.status === 'SIGNE') {
      const clientDocuments = await this.prisma.clientDocument.findFirst({
        where: { documentId: step.documentId },
        select: { clientId: true },
      })

      if (clientDocuments) {
        await this.prisma.timelineEvent.create({
          data: {
            cabinetId: this.cabinetId,
            clientId: clientDocuments.clientId,
            type: 'AUTRE',
            title: 'Signature effectuée',
            description: `${step.signerName} a signé ${step.document.name}`,
            relatedEntityType: 'Document',
            relatedEntityId: step.documentId,
            createdBy: this.userId,
          },
        })
      }
    }

    return updatedStep
  }

  /**
   * Marks a signature step as signed by email
   * 
   * Convenience method to update step using signer email instead of step ID.
   * Useful for webhook callbacks from signature providers.
   * 
   * @param documentId - Document ID
   * @param signerEmail - Email of the signer
   * @param signatureData - Metadata from the signature provider
   * @returns Updated signature step
   * @throws Error if step not found
   */
  async markStepAsSignedByEmail(
    documentId: string,
    signerEmail: string,
    signatureData?: any
  ) {
    const step = await this.prisma.signatureWorkflowStep.findFirst({
      where: {
        documentId,
        signerEmail,
        status: { not: 'SIGNE' },
      },
    })

    if (!step) {
      throw new Error('Signature step not found or already signed')
    }

    return this.updateSignatureStep(step.id, {
      status: 'SIGNE',
      signedAt: new Date(),
      signatureData,
    })
  }

  /**
   * Sends reminders for pending signatures
   * 
   * Finds all pending steps that need reminders and updates reminder tracking.
   * Should be called by a scheduled job/cron.
   * 
   * @param hoursThreshold - Hours since last reminder (default: 48)
   * @returns Array of steps that need reminders
   */
  async sendReminders(hoursThreshold: number = 48) {
    const thresholdDate = new Date()
    thresholdDate.setHours(thresholdDate.getHours() - hoursThreshold)

    const pendingSteps = await this.prisma.signatureWorkflowStep.findMany({
      where: {
        status: 'EN_ATTENTE',
        OR: [
          { reminderSentAt: null },
          { reminderSentAt: { lt: thresholdDate } },
        ],
        expiresAt: { gt: new Date() }, // Not expired
      },
      include: {
        document: {
          select: {
            id: true,
            name: true,
            cabinetId: true,
          },
        },
      },
    })

    // Filter by cabinet
    const cabinetSteps = pendingSteps.filter(
      step => step.document.cabinetId === this.cabinetId
    )

    // Update reminder tracking
    await Promise.all(
      cabinetSteps.map(step =>
        this.prisma.signatureWorkflowStep.update({
          where: { id: step.id },
          data: {
            reminderSentAt: new Date(),
            reminderCount: { increment: 1 },
          },
        })
      )
    )

    return cabinetSteps
  }

  /**
   * Cancels a signature workflow
   * 
   * Sets all pending steps to CANCELLED and updates document status.
   * 
   * @param documentId - Document ID
   * @param reason - Optional cancellation reason
   * @returns Success indicator
   */
  async cancelSignatureWorkflow(documentId: string, reason?: string) {
    // Update all pending steps to cancelled
    await this.prisma.signatureWorkflowStep.updateMany({
      where: {
        documentId,
        status: { in: ['EN_ATTENTE', 'EN_COURS'] },
      },
      data: {
        status: 'ANNULE',
      },
    })

    // Update document
    await this.prisma.document.updateMany({
      where: {
        id: documentId,
        cabinetId: this.cabinetId,
      },
      data: {
        signatureStatus: 'ANNULE',
        signatureWorkflow: {
          cancelledAt: new Date(),
          cancelledBy: this.userId,
          cancellationReason: reason,
        },
      },
    })

    // Create timeline event
    const clientDocuments = await this.prisma.clientDocument.findFirst({
      where: { documentId },
      select: { clientId: true },
    })

    if (clientDocuments) {
      await this.prisma.timelineEvent.create({
        data: {
          cabinetId: this.cabinetId,
          clientId: clientDocuments.clientId,
          type: 'AUTRE',
          title: 'Signature annulée',
          description: reason || 'Workflow de signature annulé',
          relatedEntityType: 'Document',
          relatedEntityId: documentId,
          createdBy: this.userId,
        },
      })
    }

    return { success: true }
  }

  /**
   * Retrieves signature statistics for the cabinet
   * 
   * Calculates aggregate metrics including total workflows, completion rates,
   * and average signature time.
   * 
   * @returns Statistics object with counts and metrics
   */
  async getSignatureStats() {
    const documents = await this.prisma.document.findMany({
      where: {
        cabinetId: this.cabinetId,
        signatureStatus: { not: null },
      },
      include: {
        signatureSteps: true,
      },
    })

    const totalWorkflows = documents.length
    const completed = documents.filter(d => d.signatureStatus === 'SIGNE').length
    const pending = documents.filter(d =>
      ['EN_ATTENTE', 'EN_COURS', 'PARTIELLEMENT_SIGNE'].includes(d.signatureStatus!)
    ).length
    const rejected = documents.filter(d => d.signatureStatus === 'REJETE').length

    // Calculate average signature time for completed documents
    const completedDocs = documents.filter(
      d => d.signatureStatus === 'SIGNE' && d.signedAt && d.uploadedAt
    )
    const avgSignatureTime =
      completedDocs.length > 0
        ? completedDocs.reduce((sum, d) => {
            const diff = d.signedAt!.getTime() - d.uploadedAt.getTime()
            return sum + diff
          }, 0) / completedDocs.length
        : 0

    const avgSignatureHours = avgSignatureTime / (1000 * 60 * 60)

    return {
      totalWorkflows,
      completed,
      pending,
      rejected,
      completionRate: totalWorkflows > 0 ? (completed / totalWorkflows) * 100 : 0,
      avgSignatureHours: Math.round(avgSignatureHours * 10) / 10,
    }
  }

  /**
   * Retrieves documents pending signature
   * 
   * Finds all documents with active signature workflows that are not yet completed.
   * 
   * @returns Array of documents with signature step details
   */
  async getPendingSignatures() {
    const documents = await this.prisma.document.findMany({
      where: {
        cabinetId: this.cabinetId,
        signatureStatus: {
          in: ['EN_ATTENTE', 'EN_COURS', 'PARTIELLEMENT_SIGNE'],
        },
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        signatureSteps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    })

    return documents
  }
}
