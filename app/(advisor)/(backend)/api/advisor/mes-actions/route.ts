 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'

/**
 * GET /api/advisor/mes-actions
 * Récupère les actions commerciales personnelles du conseiller connecté
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)
    const userId = user.id
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    // Use tasks as actions
    const whereClause: any = { assignedToId: userId }
    if (status && status !== 'all') {
      whereClause.status = status === 'DONE' ? 'TERMINE' : status
    }
    
    const tasks = await prisma.tache.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    const actions = tasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description || '',
      type: t.type || 'AUTRE',
      status: t.status === 'TERMINE' ? 'DONE' : 
              t.status === 'EN_COURS' ? 'EN_COURS' : 'A_FAIRE',
      priority: t.priority || 'MOYENNE',
      dueDate: t.dueDate?.toISOString().split('T')[0],
      clientId: t.client?.id,
      clientName: t.client ? `${t.client.firstName} ${t.client.lastName}` : null,
      createdAt: t.createdAt.toISOString().split('T')[0],
    }))

    return createSuccessResponse({ actions })
  } catch (error) {
    console.error('Error in GET /api/advisor/mes-actions:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/mes-actions
 * Créer une nouvelle action commerciale personnelle
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)
    const body = await request.json()

    const { title, description, type, priority, dueDate, clientId } = body

    if (!title) {
      return createErrorResponse('Champ requis: title', 400)
    }

    // Create as a task
    const task = await prisma.tache.create({
      data: {
        cabinetId: context.cabinetId,
        assignedToId: user.id,
        createdById: user.id,
        clientId: clientId || undefined,
        title: title,
        description: description || '',
        type: (type || 'AUTRE') as any,
        priority: (priority || 'MOYENNE') as any,
        status: 'A_FAIRE',
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      }
    })

    return createSuccessResponse({
      id: task.id,
      title: task.title,
      description: task.description,
      type: task.type,
      status: 'A_FAIRE',
      priority: task.priority,
      dueDate: task.dueDate?.toISOString().split('T')[0],
      clientName: task.client ? `${task.client.firstName} ${task.client.lastName}` : null,
      createdAt: task.createdAt.toISOString().split('T')[0],
    }, 201)
  } catch (error) {
    console.error('Error in POST /api/advisor/mes-actions:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * PATCH /api/advisor/mes-actions
 * Update action status
 */
export async function PATCH(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)
    const body = await request.json()

    const { id, status } = body

    if (!id || !status) {
      return createErrorResponse('Champs requis: id, status', 400)
    }

    // Map status to task status
    const taskStatus = status === 'DONE' ? 'TERMINE' : 
                       status === 'EN_COURS' ? 'EN_COURS' : 'A_FAIRE'

    const task = await prisma.tache.updateMany({
      where: {
        id: id,
        assignedToId: user.id, // Ensure user owns this task
      },
      data: {
        status: taskStatus as any,
        ...(status === 'DONE' ? { completedAt: new Date() } : {}),
      }
    })

    if (task.count === 0) {
      return createErrorResponse('Action non trouvée', 404)
    }

    return createSuccessResponse({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/advisor/mes-actions:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
