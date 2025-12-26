import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'

/**
 * GET /api/advisor/management/stats
 * Récupère les statistiques globales du cabinet pour le dashboard de management
 * Accessible uniquement par les ADMIN
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Seuls les ADMIN peuvent accéder aux stats de management
    if (user.role !== 'ADMIN') {
      return createErrorResponse('Permission denied: Réservé aux administrateurs', 403)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)
    
    // Parse period filter
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    
    // Calculate date range based on period
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

    // Get all conseillers du cabinet
    const conseillers = await prisma.user.findMany({
      where: {
        cabinetId: context.cabinetId,
        role: { in: ['ADVISOR', 'ASSISTANT'] },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
      }
    })

    // Get stats pour chaque conseiller
    const conseillersWithStats = await Promise.all(
      conseillers.map(async (conseiller) => {
        // Clients
        const clientsCount = await prisma.client.count({
          where: {
            conseillerId: conseiller.id,
          }
        })

        // Nouveaux clients sur la période
        const newClientsCount = await prisma.client.count({
          where: {
            conseillerId: conseiller.id,
            createdAt: { gte: startDate },
          }
        })

        // Opportunités
        const opportunites = await prisma.opportunite.findMany({
          where: {
            conseillerId: conseiller.id,
            createdAt: { gte: startDate },
          },
          select: {
            id: true,
            status: true,
            estimatedValue: true,
          }
        })

        const opportunitesGagnees = opportunites.filter(o => o.status === 'CONVERTIE')
        const totalCA = opportunitesGagnees.reduce((sum, o) => sum + (Number(o.estimatedValue) || 0), 0)

        // Tâches
        const taches = await prisma.tache.count({
          where: {
            assignedToId: conseiller.id,
            createdAt: { gte: startDate },
          }
        })

        const tachesTerminees = await prisma.tache.count({
          where: {
            assignedToId: conseiller.id,
            status: 'TERMINE',
            createdAt: { gte: startDate },
          }
        })

        // RDV
        const rdvCount = await prisma.rendezVous.count({
          where: {
            conseillerId: conseiller.id,
            startDate: { gte: startDate },
          }
        })

        return {
          id: conseiller.id,
          firstName: conseiller.firstName,
          lastName: conseiller.lastName,
          role: conseiller.role,
          avatar: conseiller.avatar,
          stats: {
            clients: clientsCount,
            newClients: newClientsCount,
            opportunities: opportunites.length,
            opportunitiesWon: opportunitesGagnees.length,
            ca: totalCA,
            tasks: taches,
            tasksDone: tachesTerminees,
            appointments: rdvCount,
            conversionRate: opportunites.length > 0 
              ? Math.round((opportunitesGagnees.length / opportunites.length) * 100) 
              : 0,
          }
        }
      })
    )

    // Calculate global stats
    const totalClients = conseillersWithStats.reduce((sum, c) => sum + c.stats.clients, 0)
    const totalNewClients = conseillersWithStats.reduce((sum, c) => sum + c.stats.newClients, 0)
    const totalCA = conseillersWithStats.reduce((sum, c) => sum + c.stats.ca, 0)
    const totalOpportunities = conseillersWithStats.reduce((sum, c) => sum + c.stats.opportunities, 0)
    const totalOpportunitiesWon = conseillersWithStats.reduce((sum, c) => sum + c.stats.opportunitiesWon, 0)
    const totalTasks = conseillersWithStats.reduce((sum, c) => sum + c.stats.tasks, 0)
    const totalTasksDone = conseillersWithStats.reduce((sum, c) => sum + c.stats.tasksDone, 0)
    const totalAppointments = conseillersWithStats.reduce((sum, c) => sum + c.stats.appointments, 0)

    // Rank conseillers by CA
    const ranking = [...conseillersWithStats]
      .sort((a, b) => b.stats.ca - a.stats.ca)
      .map((c, index) => ({
        ...c,
        rank: index + 1,
      }))

    return createSuccessResponse({
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      globalStats: {
        totalClients,
        totalNewClients,
        totalCA,
        totalOpportunities,
        totalOpportunitiesWon,
        totalTasks,
        totalTasksDone,
        totalAppointments,
        conversionRate: totalOpportunities > 0 
          ? Math.round((totalOpportunitiesWon / totalOpportunities) * 100) 
          : 0,
        conseillerCount: conseillers.length,
      },
      conseillers: ranking,
    })
  } catch (error) {
    console.error('Error in GET /api/advisor/management/stats:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
