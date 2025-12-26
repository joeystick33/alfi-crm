/**
 * API Route: /api/advisor/clients/[id]/advisors
 * GET - Liste les conseillers ayant accès à un client
 * POST - Ajoute un conseiller avec accès au client
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

    // Vérifier que le client existe avec ses conseillers
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        cabinetId: context.cabinetId,
      },
      include: {
        conseiller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
        conseillerRemplacant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            avatar: true,
          },
        },
      },
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    // Liste des conseillers: principal + remplaçant si présent
    const advisors = [
      {
        id: client.conseiller.id,
        firstName: client.conseiller.firstName,
        lastName: client.conseiller.lastName,
        email: client.conseiller.email,
        role: client.conseiller.role,
        avatar: client.conseiller.avatar,
        isPrimary: true,
      },
      ...(client.conseillerRemplacant ? [{
        id: client.conseillerRemplacant.id,
        firstName: client.conseillerRemplacant.firstName,
        lastName: client.conseillerRemplacant.lastName,
        email: client.conseillerRemplacant.email,
        role: client.conseillerRemplacant.role,
        avatar: client.conseillerRemplacant.avatar,
        isPrimary: false,
      }] : [])
    ]

    return createSuccessResponse({
      advisors,
      count: advisors.length,
    })
  } catch (error: any) {
    console.error('Error getting client advisors:', error)

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
    const { email, role } = body

    if (!email) {
      return createErrorResponse('Email is required', 400)
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

    // Trouver le conseiller par email
    const advisor = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        cabinetId: context.cabinetId,
      },
    })

    if (!advisor) {
      return createErrorResponse('Advisor not found in this cabinet', 404)
    }

    // Mettre à jour le conseiller principal ou remplaçant
    if (role === 'primary') {
      await prisma.client.update({
        where: { id: clientId },
        data: { conseillerId: advisor.id },
      })
    } else {
      await prisma.client.update({
        where: { id: clientId },
        data: { conseillerRemplacantId: advisor.id },
      })
    }

    // Créer un événement timeline
    await prisma.timelineEvent.create({
      data: {
        clientId,
        cabinetId: context.cabinetId,
        type: 'CLIENT_UPDATED',
        title: 'Conseiller ajouté',
        description: `${advisor.firstName} ${advisor.lastName} a été ajouté comme conseiller`,
        createdBy: user.id,
      },
    })

    return createSuccessResponse({
      advisor: {
        id: advisor.id,
        firstName: advisor.firstName,
        lastName: advisor.lastName,
        email: advisor.email,
        role: advisor.role,
      },
      message: 'Conseiller ajouté avec succès',
    }, 201)
  } catch (error: any) {
    console.error('Error adding advisor to client:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
