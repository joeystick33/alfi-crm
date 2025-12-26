/**
 * API Route: /api/advisor/clients/[id]/declarations
 * GET - Liste les déclarations d'un client
 * POST - Crée une nouvelle déclaration
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId } = await params

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

    // Récupérer les déclarations via la table de liaison ClientDocument
    const clientDocuments = await prisma.clientDocument.findMany({
      where: { clientId },
      include: { document: true },
      orderBy: { createdAt: 'desc' },
    })

    // Filtrer pour ne garder que les documents réglementaires
    const documents = clientDocuments
      .map(cd => cd.document)
      .filter(doc => doc.category === 'REGLEMENTAIRE')

    return createSuccessResponse({
      declarations: documents,
      count: documents.length,
    })
  } catch (error: any) {
    console.error('Error getting declarations:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
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

    // Créer la déclaration comme un document
    const declaration = await prisma.document.create({
      data: {
        cabinetId: context.cabinetId,
        name: body.name || `Déclaration ${body.type}`,
        type: body.type || 'AUTRE',
        category: 'REGLEMENTAIRE',
        fileUrl: '',
        fileSize: 0,
        mimeType: 'application/pdf',
        uploadedById: user.id,
        signatureStatus: 'EN_ATTENTE',
        metadata: {
          declarationType: body.type,
          createdBy: user.id,
          content: body.content,
        },
      },
    })

    // Lier le document au client via ClientDocument
    await prisma.clientDocument.create({
      data: {
        clientId,
        documentId: declaration.id,
      },
    })

    // Créer un événement timeline
    await prisma.timelineEvent.create({
      data: {
        clientId,
        cabinetId: context.cabinetId,
        type: 'DOCUMENT_ADDED',
        title: 'Déclaration créée',
        description: `${body.type || 'Déclaration'} créée`,
        relatedEntityType: 'Document',
        relatedEntityId: declaration.id,
        createdBy: user.id,
      },
    })

    return createSuccessResponse({
      declaration,
      message: 'Déclaration créée avec succès',
    }, 201)
  } catch (error: any) {
    console.error('Error creating declaration:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
