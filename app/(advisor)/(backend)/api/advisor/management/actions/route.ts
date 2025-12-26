 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'

/**
 * GET /api/advisor/management/actions
 * Récupère les actions commerciales du cabinet
 * Accessible uniquement par les ADMIN
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (user.role !== 'ADMIN') {
      return createErrorResponse('Permission denied: Réservé aux administrateurs', 403)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // Get all cabinet users
    const cabinetUsers = await prisma.user.findMany({
      where: {
        cabinetId: context.cabinetId,
        role: { in: ['ADVISOR', 'ASSISTANT', 'ADMIN'] },
      },
      select: { id: true, firstName: true, lastName: true }
    })

    const userIds = cabinetUsers.map(u => u.id)
    const userMap = new Map(cabinetUsers.map(u => [u.id, `${u.firstName} ${u.lastName}`]))

    // Build where clause for tasks (as proxy for actions)
    const whereClause: any = {
      userId: { in: userIds },
    }

    if (status && status !== 'all') {
      whereClause.statut = status === 'TERMINE' ? 'TERMINE' : 
                           status === 'EN_COURS' ? 'EN_COURS' : 'A_FAIRE'
    }

    if (type && type !== 'all') {
      whereClause.categorie = type
    }

    // Get tasks as actions
    const tasks = await prisma.tache.findMany({
      where: whereClause,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Map to action format
    const actions = tasks.map((t: any) => ({
      id: t.id,
      title: t.titre,
      description: t.description || '',
      type: mapCategorie(t.categorie),
      status: mapStatut(t.statut),
      priority: t.priorite || 'MOYENNE',
      assignedTo: t.assignedTo ? [{
        id: t.assignedTo.id,
        firstName: t.assignedTo.firstName,
        lastName: t.assignedTo.lastName,
      }] : [],
      startDate: t.createdAt.toISOString().split('T')[0],
      endDate: t.dateEcheance?.toISOString().split('T')[0],
      clientId: t.client?.id,
      clientName: t.client ? `${t.client.firstName} ${t.client.lastName}` : null,
      createdAt: t.createdAt.toISOString().split('T')[0],
    }))

    return createSuccessResponse({ actions })
  } catch (error) {
    console.error('Error in GET /api/advisor/management/actions:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/management/actions
 * Créer une nouvelle action commerciale cabinet
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (user.role !== 'ADMIN') {
      return createErrorResponse('Permission denied: Réservé aux administrateurs', 403)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)
    const body = await request.json()

    const { title, description, type, priority, startDate, endDate, assignedTo } = body

    if (!title) {
      return createErrorResponse('Champ requis: title', 400)
    }

    // Create tasks for each assigned user
    const createdTasks = []
    const userIds = assignedTo && assignedTo.length > 0 ? assignedTo : [user.id]

    for (const assigneeId of userIds) {
      const task = await prisma.tache.create({
        data: {
          cabinetId: context.cabinetId,
          assignedToId: assigneeId,
          createdById: user.id,
          title: title,
          description: description || '',
          type: reverseMapType(type) as any,
          priority: (priority || 'MOYENNE') as any,
          status: 'A_FAIRE',
          dueDate: endDate ? new Date(endDate) : null,
        },
        include: {
          assignedTo: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      })
      createdTasks.push(task)
    }

    return createSuccessResponse({
      id: createdTasks[0]?.id,
      title,
      description,
      type,
      status: 'PLANIFIE',
      priority,
      assignedTo: createdTasks.map((t: any) => ({
        id: t.assignedTo?.id,
        firstName: t.assignedTo?.firstName,
        lastName: t.assignedTo?.lastName,
      })),
      startDate,
      endDate,
      createdAt: new Date().toISOString().split('T')[0],
    }, 201)
  } catch (error) {
    console.error('Error in POST /api/advisor/management/actions:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

// Helper functions
function mapCategorie(categorie: string): string {
  const mapping: Record<string, string> = {
    'APPEL': 'PROSPECTION',
    'EMAIL': 'RELANCE',
    'REUNION': 'EVENEMENT',
    'SUIVI': 'RELANCE',
    'AUTRE': 'AUTRE',
  }
  return mapping[categorie] || 'AUTRE'
}

function mapStatut(statut: string): string {
  const mapping: Record<string, string> = {
    'A_FAIRE': 'PLANIFIE',
    'EN_COURS': 'EN_COURS',
    'TERMINE': 'TERMINE',
    'ANNULE': 'ANNULE',
  }
  return mapping[statut] || 'PLANIFIE'
}

function reverseMapType(type: string): string {
  const mapping: Record<string, string> = {
    'PROSPECTION': 'APPEL',
    'RELANCE': 'SUIVI',
    'CAMPAGNE': 'EMAIL',
    'EVENEMENT': 'REUNION',
    'FORMATION': 'REUNION',
    'AUTRE': 'AUTRE',
  }
  return mapping[type] || 'AUTRE'
}
