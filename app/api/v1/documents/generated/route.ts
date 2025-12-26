/**
 * API Route: Generated Documents
 * 
 * Récupère les documents générés avec filtres
 * 
 * @module app/api/v1/documents/generated/route
 * @requirements 22.8, 25.5
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getGeneratedDocumentsByClient } from '@/lib/documents/services/document-generator-service'
import { prisma } from '@/app/_common/lib/prisma'
import type { RegulatoryDocumentType } from '@/lib/documents/types'

/**
 * GET /api/v1/documents/generated
 * 
 * Récupère les documents générés avec filtres optionnels
 * 
 * Query params:
 * - clientId: ID du client
 * - affaireId: ID de l'affaire
 * - operationId: ID de l'opération
 * - documentType: Type de document (peut être multiple)
 * - status: Statut du document (peut être multiple)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.cabinetId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const affaireId = searchParams.get('affaireId')
    const operationId = searchParams.get('operationId')
    const documentTypes = searchParams.getAll('documentType') as RegulatoryDocumentType[]
    const statuses = searchParams.getAll('status')

    // Build where clause
    const where: Record<string, unknown> = {
      cabinetId: session.user.cabinetId,
    }

    if (clientId) {
      where.clientId = clientId
    }

    if (affaireId) {
      where.affaireId = affaireId
    }

    if (operationId) {
      where.operationId = operationId
    }

    if (documentTypes.length > 0) {
      where.documentType = { in: documentTypes }
    }

    if (statuses.length > 0) {
      where.status = { in: statuses }
    }

    // Fetch documents
    const documents = await prisma.regulatoryGeneratedDocument.findMany({
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
        template: {
          select: {
            id: true,
            name: true,
            documentType: true,
            associationType: true,
          },
        },
        generatedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
    })

    return NextResponse.json({
      data: documents.map(doc => ({
        ...doc,
        generatedData: doc.generatedData as Record<string, unknown>,
      })),
    })
  } catch (error) {
    console.error('Error fetching generated documents:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
