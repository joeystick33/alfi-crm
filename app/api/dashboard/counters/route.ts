import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // TODO: Get cabinetId from session
    const cabinetId = 'demo-cabinet-id'

    // Get counts in parallel
    const [
      totalClients,
      activeClients,
      prospectClients,
      totalTasks,
      overdueTasks,
      todayTasks,
      totalAppointments,
      todayAppointments,
      thisWeekAppointments,
      totalOpportunities,
      qualifiedOpportunities,
      totalOpportunitiesValue,
      kycExpiring,
      contractsRenewing,
      documentsExpiring,
      unreadNotifications,
    ] = await Promise.all([
      // Clients
      prisma.client.count({ where: { cabinetId } }),
      prisma.client.count({ where: { cabinetId, status: 'ACTIVE' } }),
      prisma.client.count({ where: { cabinetId, status: 'PROSPECT' } }),
      
      // Tasks
      prisma.tache.count({ where: { cabinetId } }),
      prisma.tache.count({
        where: {
          cabinetId,
          status: { not: 'COMPLETED' },
          dueDate: { lt: new Date() },
        },
      }),
      prisma.tache.count({
        where: {
          cabinetId,
          status: { not: 'COMPLETED' },
          dueDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      
      // Appointments
      prisma.rendezVous.count({ where: { cabinetId } }),
      prisma.rendezVous.count({
        where: {
          cabinetId,
          startDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      }),
      prisma.rendezVous.count({
        where: {
          cabinetId,
          startDate: {
            gte: new Date(),
            lt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Opportunities
      prisma.opportunite.count({ where: { cabinetId } }),
      prisma.opportunite.count({ where: { cabinetId, status: 'QUALIFIED' } }),
      prisma.opportunite.aggregate({
        where: { cabinetId },
        _sum: { estimatedValue: true },
      }),
      
      // Alerts
      prisma.client.count({
        where: {
          cabinetId,
          kycNextReviewDate: {
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.contrat.count({
        where: {
          cabinetId,
          nextRenewalDate: {
            lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      0, // Documents expiring - TODO: implement when document expiry is added
      
      // Notifications
      prisma.notification.count({
        where: { cabinetId, isRead: false },
      }),
    ])

    const counters = {
      clients: {
        total: totalClients,
        active: activeClients,
        prospects: prospectClients,
      },
      tasks: {
        total: totalTasks,
        overdue: overdueTasks,
        today: todayTasks,
      },
      appointments: {
        total: totalAppointments,
        today: todayAppointments,
        thisWeek: thisWeekAppointments,
      },
      opportunities: {
        total: totalOpportunities,
        qualified: qualifiedOpportunities,
        totalValue: totalOpportunitiesValue._sum.estimatedValue || 0,
      },
      alerts: {
        total: kycExpiring + contractsRenewing + documentsExpiring,
        kycExpiring,
        contractsRenewing,
        documentsExpiring,
      },
      notifications: {
        unread: unreadNotifications,
      },
    }

    return NextResponse.json(counters)
  } catch (error) {
    console.error('Error fetching dashboard counters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard counters' },
      { status: 500 }
    )
  }
}
