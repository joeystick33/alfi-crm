import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { normalizeAssignmentPayload } from '../../utils'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/conseillers/[id]/assignments
 * Get all assistant assignments for an advisor
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

    // Verify advisor exists
    const advisor = await prisma.user.findFirst({
      where: {
        id,
        cabinetId: context.cabinetId,
      },
    })

    if (!advisor) {
      return createErrorResponse('Conseiller not found', 404)
    }

    // Get assignments
    const assignments = await prisma.assistantAssignment.findMany({
      where: {
        cabinetId: context.cabinetId,
        advisorId: id,
      },
      include: {
        assistant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Format response
    const formatted = assignments.map((a) => ({
      id: a.id,
      assistantId: a.assistantId,
      permissions: a.permissions,
      createdAt: a.createdAt,
      assistant: a.assistant,
    }))

    return createSuccessResponse({
      data: formatted,
      total: formatted.length,
    })
  } catch (error) {
    logger.error('Error in GET /api/advisor/conseillers/[id]/assignments:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/conseillers/[id]/assignments
 * Assign an assistant to an advisor
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: advisorId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Only ADMIN can create assignments
    if (user.role !== 'ADMIN') {
      return createErrorResponse('Permission denied: Seuls les administrateurs peuvent créer des assignations', 403)
    }

    if (!advisorId) {
      return createErrorResponse('Missing advisor ID', 400)
    }

    // Parse and validate payload
    const body = await request.json()
    const payload = normalizeAssignmentPayload(body)

    // Get Prisma client
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Verify advisor exists
    const advisor = await prisma.user.findFirst({
      where: {
        id: advisorId,
        cabinetId: context.cabinetId,
      },
    })

    if (!advisor) {
      return createErrorResponse('Conseiller not found', 404)
    }

    // Verify assistant exists
    const assistant = await prisma.user.findFirst({
      where: {
        id: payload.assistantId,
        cabinetId: context.cabinetId,
        role: 'ASSISTANT',
      },
    })

    if (!assistant) {
      return createErrorResponse('Assistant not found or invalid role', 404)
    }

    // Check if assignment already exists
    const existing = await prisma.assistantAssignment.findUnique({
      where: {
        assistantId_advisorId: {
          advisorId,
          assistantId: payload.assistantId,
        },
      },
    })

    if (existing) {
      return createErrorResponse('Cette assignation existe déjà', 409)
    }

    // Create assignment
    const assignment = await prisma.assistantAssignment.create({
      data: {
        cabinetId: context.cabinetId,
        advisorId,
        assistantId: payload.assistantId,
        permissions: payload.permissions ? JSON.parse(JSON.stringify(payload.permissions)) : null,
      },
      include: {
        assistant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            isActive: true,
          },
        },
      },
    })

    return createSuccessResponse({
      id: assignment.id,
      assistantId: assignment.assistantId,
      permissions: assignment.permissions,
      createdAt: assignment.createdAt,
      assistant: assignment.assistant,
    }, 201)
  } catch (error) {
    logger.error('Error in POST /api/advisor/conseillers/[id]/assignments:', { error: error instanceof Error ? error.message : String(error) })
    
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
 * DELETE /api/advisor/conseillers/[id]/assignments
 * Remove an assistant assignment from an advisor
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: advisorId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Only ADMIN can delete assignments
    if (user.role !== 'ADMIN') {
      return createErrorResponse('Permission denied: Seuls les administrateurs peuvent supprimer des assignations', 403)
    }

    if (!advisorId) {
      return createErrorResponse('Missing advisor ID', 400)
    }

    // Get assistantId from query params
    const { searchParams } = new URL(request.url)
    const assistantId = searchParams.get('assistantId')

    if (!assistantId) {
      return createErrorResponse('Missing assistantId parameter', 400)
    }

    // Get Prisma client
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Find and delete assignment
    const assignment = await prisma.assistantAssignment.findUnique({
      where: {
        assistantId_advisorId: {
          advisorId,
          assistantId,
        },
      },
    })

    if (!assignment) {
      return createErrorResponse('Assignation not found', 404)
    }

    await prisma.assistantAssignment.delete({
      where: {
        id: assignment.id,
      },
    })

    return createSuccessResponse({
      success: true,
      message: 'Assignation supprimée avec succès',
    })
  } catch (error) {
    logger.error('Error in DELETE /api/advisor/conseillers/[id]/assignments:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
