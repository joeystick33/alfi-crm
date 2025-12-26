/**
 * API Route: /api/advisor/clients/[id]/declarations/[declarationId]/sign
 * POST - Signe une déclaration
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; declarationId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId, declarationId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Vérifier que le client existe
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: context.cabinetId,
      },
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    // Vérifier que la déclaration existe et est liée au client
    const clientDocument = await prisma.clientDocument.findFirst({
      where: {
        clientId,
        documentId: declarationId,
      },
      include: { document: true },
    })

    if (!clientDocument || clientDocument.document.category !== 'REGLEMENTAIRE') {
      return createErrorResponse('Declaration not found', 404)
    }

    const declaration = clientDocument.document

    // Mettre à jour la déclaration comme signée
    const updated = await prisma.document.update({
      where: { id: declarationId },
      data: {
        signatureStatus: 'SIGNE',
        signedAt: new Date(),
        signedBy: [{ id: user.id, signedAt: new Date().toISOString() }],
        metadata: {
          ...(declaration.metadata as object || {}),
          signedBy: user.id,
          signedAt: new Date().toISOString(),
        },
      },
    })

    // Créer un événement timeline
    await prisma.timelineEvent.create({
      data: {
        clientId,
        cabinetId: context.cabinetId,
        type: 'DOCUMENT_SIGNED',
        title: 'Déclaration signée',
        description: `${declaration.name} signée`,
        relatedEntityType: 'Document',
        relatedEntityId: declarationId,
        createdBy: user.id,
      },
    })

    return createSuccessResponse({
      declaration: updated,
      message: 'Déclaration signée avec succès',
    })
  } catch (error: any) {
    console.error('Error signing declaration:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
