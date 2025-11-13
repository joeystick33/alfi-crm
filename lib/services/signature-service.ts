import { getPrismaClient, setRLSContext } from '../prisma'
import { SignatureStatus } from '@prisma/client'

export interface InitiateSignatureInput {
  documentId: string
  signers: {
    email: string
    firstName: string
    lastName: string
    role?: string
  }[]
  message?: string
  expiresInDays?: number
}

export interface SignatureWebhookData {
  documentId: string
  status: SignatureStatus
  signedBy?: any
  signedAt?: Date
  provider: string
  providerEnvelopeId?: string
}

/**
 * Service de signature électronique
 * Intégration avec providers de signature (DocuSign, HelloSign, etc.)
 * 
 * NOTE: Ce service est un placeholder qui doit être complété
 * avec l'intégration réelle du provider de signature choisi
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
   * Initie un processus de signature électronique
   */
  async initiateSignature(data: InitiateSignatureInput) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Vérifier que le document existe
    const document = await this.prisma.document.findUnique({
      where: { id: data.documentId },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // TODO: Intégrer avec le provider de signature (DocuSign, HelloSign, etc.)
    // Exemple avec DocuSign:
    // const envelope = await docusignClient.createEnvelope({
    //   documentUrl: document.fileUrl,
    //   signers: data.signers,
    //   message: data.message,
    // })

    // Pour l'instant, on simule l'envoi
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 30))

    // Mettre à jour le document
    await this.prisma.document.update({
      where: { id: data.documentId },
      data: {
        signatureStatus: 'PENDING',
        signatureProvider: 'PLACEHOLDER', // Remplacer par le vrai provider
        // TODO: Stocker l'ID de l'enveloppe du provider
      },
    })

    return {
      documentId: data.documentId,
      status: 'PENDING',
      signers: data.signers,
      expiresAt,
      // TODO: Retourner l'URL de signature du provider
      signatureUrl: `https://signature-provider.com/sign/${data.documentId}`,
    }
  }

  /**
   * Récupère le statut d'une signature
   */
  async getSignatureStatus(documentId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        name: true,
        signatureStatus: true,
        signatureProvider: true,
        signedAt: true,
        signedBy: true,
      },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    // TODO: Récupérer le statut réel depuis le provider
    // const providerStatus = await signatureProvider.getStatus(envelopeId)

    return document
  }

  /**
   * Webhook pour recevoir les notifications du provider de signature
   */
  async handleSignatureWebhook(data: SignatureWebhookData) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // Mettre à jour le document
    const document = await this.prisma.document.update({
      where: { id: data.documentId },
      data: {
        signatureStatus: data.status,
        signatureProvider: data.provider,
        signedAt: data.signedAt,
        signedBy: data.signedBy,
      },
    })

    // Si signé, créer un événement timeline pour le client
    if (data.status === 'SIGNED') {
      // Récupérer les clients liés au document
      const clientDocuments = await this.prisma.clientDocument.findMany({
        where: { documentId: data.documentId },
      })

      for (const cd of clientDocuments) {
        await this.prisma.timelineEvent.create({
          data: {
            clientId: cd.clientId,
            type: 'DOCUMENT_SIGNED',
            title: 'Document signé',
            description: document.name,
            relatedEntityType: 'Document',
            relatedEntityId: document.id,
            createdBy: this.userId,
          },
        })
      }
    }

    return document
  }

  /**
   * Annule une demande de signature en cours
   */
  async cancelSignature(documentId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // TODO: Annuler sur le provider
    // await signatureProvider.cancelEnvelope(envelopeId)

    const document = await this.prisma.document.update({
      where: { id: documentId },
      data: {
        signatureStatus: 'REJECTED',
      },
    })

    return document
  }

  /**
   * Renvoie une demande de signature
   */
  async resendSignatureRequest(documentId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    if (document.signatureStatus !== 'PENDING') {
      throw new Error('Document is not pending signature')
    }

    // TODO: Renvoyer via le provider
    // await signatureProvider.resendNotification(envelopeId)

    return {
      success: true,
      message: 'Signature request resent',
    }
  }

  /**
   * Récupère tous les documents en attente de signature
   */
  async getPendingSignatures() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const documents = await this.prisma.document.findMany({
      where: {
        signatureStatus: 'PENDING',
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        clients: {
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
        },
      },
      orderBy: {
        uploadedAt: 'desc',
      },
    })

    return documents
  }

  /**
   * Récupère les documents signés récemment
   */
  async getRecentlySignedDocuments(days: number = 30) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - days)

    const documents = await this.prisma.document.findMany({
      where: {
        signatureStatus: 'SIGNED',
        signedAt: {
          gte: sinceDate,
        },
      },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        clients: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        signedAt: 'desc',
      },
    })

    return documents
  }

  /**
   * Récupère les statistiques de signature
   */
  async getSignatureStats() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const documents = await this.prisma.document.findMany({
      where: {
        signatureStatus: {
          not: null,
        },
      },
    })

    const byStatus = documents.reduce((acc, d) => {
      const status = d.signatureStatus || 'NONE'
      if (!acc[status]) {
        acc[status] = 0
      }
      acc[status]++
      return acc
    }, {} as Record<string, number>)

    const pending = documents.filter(d => d.signatureStatus === 'PENDING').length
    const signed = documents.filter(d => d.signatureStatus === 'SIGNED').length
    const rejected = documents.filter(d => d.signatureStatus === 'REJECTED').length
    const expired = documents.filter(d => d.signatureStatus === 'EXPIRED').length

    // Calculer le taux de signature
    const total = pending + signed + rejected + expired
    const signatureRate = total > 0 ? (signed / total) * 100 : 0

    return {
      total,
      byStatus,
      pending,
      signed,
      rejected,
      expired,
      signatureRate,
    }
  }

  /**
   * Vérifie les signatures expirées et met à jour leur statut
   */
  async checkExpiredSignatures() {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    // TODO: Implémenter la logique d'expiration
    // Nécessite de stocker la date d'expiration dans le document
    // ou de la récupérer depuis le provider

    return {
      count: 0,
      documents: [],
    }
  }

  /**
   * Télécharge le document signé depuis le provider
   */
  async downloadSignedDocument(documentId: string) {
    await setRLSContext(this.cabinetId, this.isSuperAdmin)

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    })

    if (!document) {
      throw new Error('Document not found')
    }

    if (document.signatureStatus !== 'SIGNED') {
      throw new Error('Document is not signed')
    }

    // TODO: Télécharger le document signé depuis le provider
    // const signedDocumentUrl = await signatureProvider.downloadDocument(envelopeId)

    return {
      documentId,
      signedDocumentUrl: document.fileUrl, // Remplacer par l'URL du document signé
    }
  }
}
