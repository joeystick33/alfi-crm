 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/mon-activite
 * Récupère les statistiques personnelles du conseiller connecté
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    
    const now = new Date()
    let startDate: Date
    let lastPeriodStart: Date
    let lastPeriodEnd: Date
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        lastPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14)
        lastPeriodEnd = startDate
        break
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        lastPeriodStart = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        lastPeriodEnd = startDate
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        lastPeriodStart = new Date(now.getFullYear() - 1, 0, 1)
        lastPeriodEnd = startDate
        break
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        lastPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        lastPeriodEnd = startDate
    }

    const userId = user.id

    // Current period stats
    // Clients
    const totalClients = await prisma.client.count({
      where: { conseillerId: userId }
    })

    const newClients = await prisma.client.count({
      where: {
        conseillerId: userId,
        createdAt: { gte: startDate },
      }
    })

    // Opportunities
    const opportunities = await prisma.opportunite.findMany({
      where: {
        conseillerId: userId,
        createdAt: { gte: startDate },
      },
      select: { estimatedValue: true, status: true }
    })

    const totalOpportunities = opportunities.length
    const opportunitiesWon = opportunities.filter(o => o.status === 'CONVERTIE').length
    const opportunitiesValue = opportunities.reduce((sum, o) => 
      sum + (Number(o.estimatedValue) || 0), 0)

    // CA from won opportunities
    const currentCA = opportunities
      .filter(o => o.status === 'CONVERTIE')
      .reduce((sum, o) => sum + (Number(o.estimatedValue) || 0), 0)

    // Last period CA
    const lastPeriodOpportunities = await prisma.opportunite.findMany({
      where: {
        conseillerId: userId,
        status: 'CONVERTIE',
        createdAt: {
          gte: lastPeriodStart,
          lt: lastPeriodEnd,
        },
      },
      select: { estimatedValue: true }
    })

    const lastPeriodCA = lastPeriodOpportunities.reduce((sum, o) => 
      sum + (Number(o.estimatedValue) || 0), 0)

    // Tasks
    const tasks = await prisma.tache.count({
      where: {
        assignedToId: userId,
        createdAt: { gte: startDate },
      }
    })

    const tasksDone = await prisma.tache.count({
      where: {
        assignedToId: userId,
        status: 'TERMINE',
        createdAt: { gte: startDate },
      }
    })

    const tasksOverdue = await prisma.tache.count({
      where: {
        assignedToId: userId,
        status: { not: 'TERMINE' },
        dueDate: { lt: now },
      }
    })

    // Calculate rank among all conseillers
    const allConseillers = await prisma.user.findMany({
      where: {
        cabinetId: context.cabinetId,
        role: { in: ['ADVISOR', 'ASSISTANT'] },
        isActive: true,
      },
      select: { id: true }
    })

    const conseillersCA = await Promise.all(
      allConseillers.map(async (c) => {
        const opps = await prisma.opportunite.findMany({
          where: {
            conseillerId: c.id,
            status: 'CONVERTIE',
            createdAt: { gte: startDate },
          },
          select: { estimatedValue: true }
        })
        return {
          id: c.id,
          ca: opps.reduce((sum, o) => sum + (Number(o.estimatedValue) || 0), 0)
        }
      })
    )

    const sortedByCA = conseillersCA.sort((a, b) => b.ca - a.ca)
    const rank = sortedByCA.findIndex(c => c.id === userId) + 1

    // Conversion rate
    const conversionRate = totalOpportunities > 0 
      ? Math.round((opportunitiesWon / totalOpportunities) * 100) 
      : 0

    // Default objectives (would come from database in real implementation)
    const caObjectif = 40000

    // Recent activities
    const recentClients = await prisma.client.findMany({
      where: {
        conseillerId: userId,
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        wealth: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    const recentOpportunities = await prisma.opportunite.findMany({
      where: {
        conseillerId: userId,
        status: 'CONVERTIE',
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        name: true,
        estimatedValue: true,
        createdAt: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    const activities = [
      ...recentClients.map(c => ({
        id: c.id,
        type: 'CLIENT' as const,
        title: `Nouveau client: ${c.firstName} ${c.lastName}`,
        description: `Patrimoine: ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(c.wealth ? Number((c.wealth as any).netWealth || 0) : 0)}`,
        date: c.createdAt.toISOString().split('T')[0],
      })),
      ...recentOpportunities.map(o => ({
        id: o.id,
        type: 'OPPORTUNITY' as const,
        title: `Opportunité gagnée`,
        description: `${o.name} - ${o.client?.firstName} ${o.client?.lastName}`,
        date: o.createdAt.toISOString().split('T')[0],
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

    // Objectives with progress
    const objectifs = [
      {
        id: 'ca',
        type: 'CA',
        label: 'CA Mensuel',
        target: caObjectif,
        current: currentCA,
        unit: '€',
        progress: Math.round((currentCA / caObjectif) * 100),
        status: currentCA >= caObjectif ? 'ATTEINT' : 
                currentCA >= caObjectif * 0.8 ? 'ON_TRACK' : 
                currentCA >= caObjectif * 0.5 ? 'AT_RISK' : 'BEHIND',
      },
      {
        id: 'clients',
        type: 'CLIENTS',
        label: 'Nouveaux Clients',
        target: 8,
        current: newClients,
        unit: 'clients',
        progress: Math.round((newClients / 8) * 100),
        status: newClients >= 8 ? 'ATTEINT' : 
                newClients >= 6 ? 'ON_TRACK' : 
                newClients >= 4 ? 'AT_RISK' : 'BEHIND',
      },
      {
        id: 'opportunities',
        type: 'OPPORTUNITIES',
        label: 'Opportunités Gagnées',
        target: 5,
        current: opportunitiesWon,
        unit: 'opport.',
        progress: Math.round((opportunitiesWon / 5) * 100),
        status: opportunitiesWon >= 5 ? 'ATTEINT' : 
                opportunitiesWon >= 4 ? 'ON_TRACK' : 
                opportunitiesWon >= 2 ? 'AT_RISK' : 'BEHIND',
      },
    ]

    return createSuccessResponse({
      period,
      stats: {
        ca: currentCA,
        caObjectif,
        caLastMonth: lastPeriodCA,
        clients: totalClients,
        clientsNew: newClients,
        opportunities: totalOpportunities,
        opportunitiesWon,
        opportunitiesValue,
        tasks,
        tasksDone,
        tasksOverdue,
        rank,
        rankTotal: allConseillers.length,
        conversionRate,
      },
      objectifs,
      activities,
    })
  } catch (error) {
    logger.error('Error in GET /api/advisor/mon-activite:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
