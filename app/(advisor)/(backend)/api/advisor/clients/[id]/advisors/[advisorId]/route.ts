/**
 * API Route: /api/advisor/clients/[id]/advisors/[advisorId]
 * DELETE - Retire l'accès d'un conseiller à un client
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; advisorId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId, advisorId } = await params

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

    // Si c'est le conseiller remplaçant, retirer l'assignation
    // Note: On ne peut pas retirer le conseiller principal (conseillerId est requis)
    if (client.conseillerRemplacantId === advisorId) {
      await prisma.client.update({
        where: { id: clientId },
        data: { conseillerRemplacantId: null },
      })
    } else if (client.conseillerId === advisorId) {
      return createErrorResponse('Cannot remove primary advisor', 400)
    }

    // Créer un événement timeline
    await prisma.timelineEvent.create({
      data: {
        clientId,
        cabinetId: context.cabinetId,
        type: 'CLIENT_UPDATED',
        title: 'Accès conseiller retiré',
        description: 'Un conseiller a été retiré du dossier',
        createdBy: user.id,
      },
    })

    return createSuccessResponse({
      success: true,
      message: 'Accès conseiller retiré',
    })
  } catch (error: any) {
    console.error('Error removing advisor from client:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
