import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/conseillers/[id]/stats
 * Get detailed statistics for a specific conseiller
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

    // Verify conseiller exists
    const conseiller = await prisma.user.findFirst({
      where: {
        id,
        cabinetId: context.cabinetId,
      },
    })

    if (!conseiller) {
      return createErrorResponse('Conseiller not found', 404)
    }

    // Get base counts
    const [
      totalClients,
      clientsPrincipaux,
      clientsRemplacants,
      totalTasks,
      totalAppointments,
      totalOpportunities,
    ] = await Promise.all([
      prisma.client.count({
        where: {
          cabinetId: context.cabinetId,
          OR: [
            { conseillerId: id },
            { conseillerRemplacantId: id },
          ],
        },
      }),
      prisma.client.count({
        where: {
          cabinetId: context.cabinetId,
          conseillerId: id,
        },
      }),
      prisma.client.count({
        where: {
          cabinetId: context.cabinetId,
          conseillerRemplacantId: id,
        },
      }),
      prisma.tache.count({
        where: {
          cabinetId: context.cabinetId,
          assignedToId: id,
        },
      }),
      prisma.rendezVous.count({
        where: {
          cabinetId: context.cabinetId,
          conseillerId: id,
        },
      }),
      prisma.opportunite.count({
        where: {
          cabinetId: context.cabinetId,
          conseillerId: id,
        },
      }),
    ])

    // Get task statistics
    const [tasksTodo, tasksInProgress, tasksCompleted, tasksOverdue] = await Promise.all([
      prisma.tache.count({
        where: {
          cabinetId: context.cabinetId,
          assignedToId: id,
          status: 'A_FAIRE',
        },
      }),
      prisma.tache.count({
        where: {
          cabinetId: context.cabinetId,
          assignedToId: id,
          status: 'EN_COURS',
        },
      }),
      prisma.tache.count({
        where: {
          cabinetId: context.cabinetId,
          assignedToId: id,
          status: 'TERMINE',
        },
      }),
      prisma.tache.count({
        where: {
          cabinetId: context.cabinetId,
          assignedToId: id,
          dueDate: { lt: new Date() },
          status: { in: ['A_FAIRE', 'EN_COURS'] },
        },
      }),
    ])

    // Get appointment statistics
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const [appointmentsThisMonth, appointmentsUpcoming] = await Promise.all([
      prisma.rendezVous.count({
        where: {
          cabinetId: context.cabinetId,
          conseillerId: id,
          startDate: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      }),
      prisma.rendezVous.count({
        where: {
          cabinetId: context.cabinetId,
          conseillerId: id,
          startDate: { gte: now },
          status: { in: ['PLANIFIE', 'CONFIRME'] },
        },
      }),
    ])

    // Get opportunity statistics
    const [opportunitiesActive, opportunitiesWon, opportunitiesLost] = await Promise.all([
      prisma.opportunite.count({
        where: {
          cabinetId: context.cabinetId,
          conseillerId: id,
          status: { in: ['DETECTEE', 'CONTACTEE', 'QUALIFIEE', 'PRESENTEE', 'ACCEPTEE'] },
        },
      }),
      prisma.opportunite.count({
        where: {
          cabinetId: context.cabinetId,
          conseillerId: id,
          status: 'CONVERTIE',
        },
      }),
      prisma.opportunite.count({
        where: {
          cabinetId: context.cabinetId,
          conseillerId: id,
          status: { in: ['PERDUE', 'REJETEE'] },
        },
      }),
    ])

    // Get opportunity pipeline value
    const opportunitiesWithValue = await prisma.opportunite.findMany({
      where: {
        cabinetId: context.cabinetId,
        conseillerId: id,
        estimatedValue: { not: null },
      },
      select: {
        estimatedValue: true,
        confidence: true,
        status: true,
      },
    })

    const activeStatuses = ['DETECTEE', 'CONTACTEE', 'QUALIFIEE', 'PRESENTEE', 'ACCEPTEE']
    const totalPipelineValue = opportunitiesWithValue
      .filter(o => activeStatuses.includes(o.status))
      .reduce((sum, o) => sum + Number(o.estimatedValue || 0), 0)

    const weightedPipelineValue = opportunitiesWithValue
      .filter(o => activeStatuses.includes(o.status))
      .reduce((sum, o) => {
        const value = Number(o.estimatedValue || 0)
        const conf = Number(o.confidence || 0) / 100
        return sum + (value * conf)
      }, 0)

    const totalWonValue = opportunitiesWithValue
      .filter(o => o.status === 'CONVERTIE')
      .reduce((sum, o) => sum + Number(o.estimatedValue || 0), 0)

    // Calculate conversion rate
    const totalClosedOpportunities = opportunitiesWon + opportunitiesLost
    const conversionRate = totalClosedOpportunities > 0
      ? Math.round((opportunitiesWon / totalClosedOpportunities) * 100)
      : 0

    // Calculate task completion rate
    const taskCompletionRate = totalTasks > 0
      ? Math.round((tasksCompleted / totalTasks) * 100)
      : 0

    // Build response
    const stats = {
      clients: {
        total: totalClients,
        principaux: clientsPrincipaux,
        remplacants: clientsRemplacants,
      },
      tasks: {
        total: totalTasks,
        todo: tasksTodo,
        inProgress: tasksInProgress,
        completed: tasksCompleted,
        overdue: tasksOverdue,
        completionRate: taskCompletionRate,
      },
      appointments: {
        total: totalAppointments,
        thisMonth: appointmentsThisMonth,
        upcoming: appointmentsUpcoming,
      },
      opportunities: {
        total: totalOpportunities,
        active: opportunitiesActive,
        won: opportunitiesWon,
        lost: opportunitiesLost,
        conversionRate,
        pipelineValue: totalPipelineValue,
        weightedPipelineValue: Math.round(weightedPipelineValue),
        wonValue: totalWonValue,
      },
    }

    return createSuccessResponse(stats)
  } catch (error) {
    logger.error('Error in GET /api/advisor/conseillers/[id]/stats:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
