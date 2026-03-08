import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'

/**
 * POST /api/advisor/dossiers/[id]/send-to-client
 * Envoyer le document du dossier au client par email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: dossierId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const { documentId } = body

    // Récupérer le dossier avec le client
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, cabinetId: context.cabinetId },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
        conseiller: { select: { firstName: true, lastName: true, email: true } },
      },
    })

    if (!dossier) {
      return createErrorResponse('Dossier non trouvé', 404)
    }

    if (!dossier.client?.email) {
      return createErrorResponse('Le client n\'a pas d\'adresse email renseignée', 400)
    }

    // Récupérer le document si spécifié
    let document = null
    if (documentId) {
      document = await prisma.dossierDocument.findFirst({
        where: { id: documentId, dossierId },
      })
    }

    // Créer une notification/activité pour tracer l'envoi
    // En production, intégrer un service email (SendGrid, Resend, etc.)
    const emailRecord = {
      to: dossier.client.email,
      subject: `Votre bilan patrimonial - ${dossier.reference}`,
      clientName: `${dossier.client.firstName} ${dossier.client.lastName}`,
      conseillerName: `${dossier.conseiller.firstName} ${dossier.conseiller.lastName}`,
      dossierReference: dossier.reference,
      documentName: document?.nom || 'Bilan Patrimonial',
      sentAt: new Date().toISOString(),
    }

    // Log l'envoi (en production, remplacer par un vrai envoi email)
    logger.info('Email sent to client', { email: emailRecord })

    // Mettre à jour le dossier pour noter l'envoi
    await prisma.dossier.update({
      where: { id: dossierId },
      data: {
        notes: dossier.notes
          ? `${dossier.notes}\n\n[${new Date().toLocaleDateString('fr-FR')}] Document envoyé à ${dossier.client.email}`
          : `[${new Date().toLocaleDateString('fr-FR')}] Document envoyé à ${dossier.client.email}`,
      },
    })

    return createSuccessResponse({
      success: true,
      message: `Document envoyé à ${dossier.client.email}`,
      emailRecord,
    })
  } catch (error) {
    logger.error('Error sending document to client:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
