 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/advisor/management/conseillers/[id]
 * Récupère les détails et KPIs d'un conseiller spécifique
 * Accessible uniquement par les ADMIN
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: conseillerId } = await params
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Seuls les ADMIN peuvent accéder au détail
    if (user.role !== 'ADMIN') {
      return createErrorResponse('Permission denied: Réservé aux administrateurs', 403)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)
    
    // Parse period filter
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    
    // Calculate date range
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
        break
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Get conseiller
    const conseiller = await prisma.user.findFirst({
      where: {
        id: conseillerId,
        cabinetId: context.cabinetId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true,
      }
    })

    if (!conseiller) {
      return createErrorResponse('Conseiller non trouvé', 404)
    }

    // Get clients
    const clients = await prisma.client.findMany({
      where: {
        conseillerId: conseillerId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
        wealth: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const totalClients = await prisma.client.count({
      where: { conseillerId: conseillerId }
    })

    const newClients = await prisma.client.count({
      where: {
        conseillerId: conseillerId,
        createdAt: { gte: startDate },
      }
    })

    // Get opportunities
    const opportunites = await prisma.opportunite.findMany({
      where: {
        conseillerId: conseillerId,
      },
      select: {
        id: true,
        name: true,
        estimatedValue: true,
        status: true,
        createdAt: true,
        client: {
          select: {
            firstName: true,
            lastName: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const totalOpportunities = await prisma.opportunite.count({
      where: { conseillerId: conseillerId }
    })

    const opportunitiesWon = await prisma.opportunite.count({
      where: {
        conseillerId: conseillerId,
        status: 'CONVERTIE',
      }
    })

    // Calculate CA
    const opportunitiesWonData = await prisma.opportunite.findMany({
      where: {
        conseillerId: conseillerId,
        status: 'CONVERTIE',
        createdAt: { gte: startDate },
      },
      select: { estimatedValue: true }
    })
    const totalCA = opportunitiesWonData.reduce((sum: number, o: any) => 
      sum + (Number(o.estimatedValue) || 0), 0)

    // Get tasks
    const tasks = await prisma.tache.count({
      where: {
        assignedToId: conseillerId,
        createdAt: { gte: startDate },
      }
    })

    const tasksDone = await prisma.tache.count({
      where: {
        assignedToId: conseillerId,
        status: 'TERMINE',
        createdAt: { gte: startDate },
      }
    })

    const tasksOverdue = await prisma.tache.count({
      where: {
        assignedToId: conseillerId,
        status: { not: 'TERMINE' },
        dueDate: { lt: now },
      }
    })

    // Get appointments
    const appointments = await prisma.rendezVous.count({
      where: {
        conseillerId: conseillerId,
        startDate: { gte: startDate },
      }
    })

    // Get monthly history (last 6 months)
    const history = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      const monthOpportunities = await prisma.opportunite.findMany({
        where: {
          conseillerId: conseillerId,
          status: 'CONVERTIE',
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        select: { estimatedValue: true }
      })
      
      const monthCA = monthOpportunities.reduce((sum: number, o: any) => 
        sum + (Number(o.estimatedValue) || 0), 0)

      const monthClients = await prisma.client.count({
        where: {
          conseillerId: conseillerId,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        }
      })

      history.push({
        month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        ca: monthCA,
        clients: monthClients,
      })
    }

    return createSuccessResponse({
      conseiller,
      period,
      stats: {
        totalClients,
        newClients,
        totalOpportunities,
        opportunitiesWon,
        totalCA,
        tasks,
        tasksDone,
        tasksOverdue,
        appointments,
        conversionRate: totalOpportunities > 0 
          ? Math.round((opportunitiesWon / totalOpportunities) * 100) 
          : 0,
      },
      recentClients: clients.map(c => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`,
        email: c.email,
        phone: c.phone,
        patrimoine: c.wealth ? Number((c.wealth as any).netWealth || 0) : 0,
        createdAt: c.createdAt,
      })),
      recentOpportunities: opportunites.map(o => ({
        id: o.id,
        title: o.name,
        amount: Number(o.estimatedValue) || 0,
        status: o.status,
        clientName: o.client ? `${o.client.firstName} ${o.client.lastName}` : null,
        createdAt: o.createdAt,
      })),
      history,
    })
  } catch (error) {
    logger.error('Error in GET /api/advisor/management/conseillers/[id]:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
