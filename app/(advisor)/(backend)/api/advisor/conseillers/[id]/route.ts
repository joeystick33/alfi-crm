import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { normalizeConseillerUpdatePayload } from '../utils'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/conseillers/[id]
 * Get a specific conseiller by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (!id) {
      return createErrorResponse('Missing conseiller ID', 400)
    }

    // Get Prisma client
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Get conseiller with stats
    const conseiller = await prisma.user.findFirst({
      where: {
        id,
        cabinetId: context.cabinetId,
      },
      include: {
        _count: {
          select: {
            clientsPrincipaux: true,
            clientsRemplacants: true,
            taches: true,
            rendezvous: true,
            opportunites: true,
          },
        },
      },
    })

    if (!conseiller) {
      return createErrorResponse('Conseiller not found', 404)
    }

    // Format response
    const formatted = {
      id: conseiller.id,
      email: conseiller.email,
      firstName: conseiller.firstName,
      lastName: conseiller.lastName,
      phone: conseiller.phone,
      avatar: conseiller.avatar,
      role: conseiller.role,
      permissions: conseiller.permissions,
      isActive: conseiller.isActive,
      lastLogin: conseiller.lastLogin,
      createdAt: conseiller.createdAt,
      stats: {
        totalClients: conseiller._count.clientsPrincipaux + conseiller._count.clientsRemplacants,
        clientsPrincipaux: conseiller._count.clientsPrincipaux,
        clientsRemplacants: conseiller._count.clientsRemplacants,
        totalTasks: conseiller._count.taches,
        totalAppointments: conseiller._count.rendezvous,
        totalOpportunities: conseiller._count.opportunites,
      },
    }

    return createSuccessResponse(formatted)
  } catch (error) {
    logger.error('Error in GET /api/advisor/conseillers/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/advisor/conseillers/[id]
 * Update a specific conseiller
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Only ADMIN can update conseillers
    if (user.role !== 'ADMIN') {
      return createErrorResponse('Permission denied: Seuls les administrateurs peuvent modifier des conseillers', 403)
    }

    if (!id) {
      return createErrorResponse('Missing conseiller ID', 400)
    }

    // Parse and validate payload
    const body = await request.json()
    const payload = normalizeConseillerUpdatePayload(body)

    // Get Prisma client
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Check if conseiller exists
    const existing = await prisma.user.findFirst({
      where: {
        id,
        cabinetId: context.cabinetId,
      },
    })

    if (!existing) {
      return createErrorResponse('Conseiller not found', 404)
    }

    // If updating email, check uniqueness
    if (payload.email && payload.email !== existing.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          cabinetId: context.cabinetId,
          email: payload.email,
          NOT: { id },
        },
      })

      if (emailExists) {
        return createErrorResponse('Un conseiller avec cet email existe déjà', 409)
      }
    }

    // Prepare update data
    const updateData: any = {}
    
    if (payload.email) updateData.email = payload.email
    if (payload.firstName) updateData.firstName = payload.firstName
    if (payload.lastName) updateData.lastName = payload.lastName
    if (payload.phone !== undefined) updateData.phone = payload.phone
    if (payload.avatar !== undefined) updateData.avatar = payload.avatar
    if (payload.role) updateData.role = payload.role as any
    if (payload.permissions !== undefined) {
      updateData.permissions = payload.permissions ? JSON.parse(JSON.stringify(payload.permissions)) : null
    }
    if (payload.isActive !== undefined) updateData.isActive = payload.isActive

    // Update conseiller
    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        permissions: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    })

    return createSuccessResponse(updated)
  } catch (error) {
    logger.error('Error in PATCH /api/advisor/conseillers/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error && error.message.includes('Validation')) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * DELETE /api/advisor/conseillers/[id]
 * Delete (deactivate) a specific conseiller
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Only ADMIN can delete conseillers
    if (user.role !== 'ADMIN') {
      return createErrorResponse('Permission denied: Seuls les administrateurs peuvent supprimer des conseillers', 403)
    }

    if (!id) {
      return createErrorResponse('Missing conseiller ID', 400)
    }

    // Cannot delete yourself
    if (id === user.id) {
      return createErrorResponse('Impossible de supprimer votre propre compte', 400)
    }

    // Get Prisma client
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Check if conseiller exists
    const existing = await prisma.user.findFirst({
      where: {
        id,
        cabinetId: context.cabinetId,
      },
    })

    if (!existing) {
      return createErrorResponse('Conseiller not found', 404)
    }

    // Soft delete: deactivate instead of hard delete
    // This preserves data integrity with relations
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    return createSuccessResponse({
      success: true,
      message: 'Conseiller désactivé avec succès',
    })
  } catch (error) {
    logger.error('Error in DELETE /api/advisor/conseillers/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
