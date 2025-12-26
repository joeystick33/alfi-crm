 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API Mon Portefeuille - Stats et revue portefeuille du conseiller
 * GET /api/advisor/mon-portefeuille
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const cabinetId = context.cabinetId
    const advisorId = user.id

    // Get query params for filtering
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') // ACTIVE, PROSPECT, DORMANT, ALL
    const reviewFilter = searchParams.get('review') // overdue, upcoming, all

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Base where clause for advisor's clients
    const baseWhere = {
      cabinetId,
      conseillerPrincipalId: advisorId,
      status: { not: 'ARCHIVE' as const }
    }

    // Get all clients with their last interaction data
    const allClients = await prisma.client.findMany({
      where: baseWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        status: true,
        clientType: true,
        createdAt: true,
        updatedAt: true,
        kycNextReviewDate: true,
        kycStatus: true,
        // Last interaction approximation via updated date
        rendezvous: {
          orderBy: { startDate: 'desc' },
          take: 1,
          select: { startDate: true, title: true }
        },
        taches: {
          where: { assignedToId: advisorId },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true, title: true }
        },
        contrats: {
          orderBy: { nextRenewalDate: 'asc' },
          where: {
            nextRenewalDate: { gte: now, lte: thirtyDaysFromNow }
          },
          take: 3,
          select: { id: true, name: true, nextRenewalDate: true, type: true }
        },
        opportunites: {
          where: { status: { notIn: ['CONVERTIE', 'PERDUE', 'REJETEE'] } },
          select: { id: true, name: true, estimatedValue: true, status: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    // Categorize clients
    const clientsWithStatus = allClients.map(client => {
      const lastRdv = client.rendezvous[0]?.startDate
      const lastTask = client.taches[0]?.createdAt
      const lastInteraction = lastRdv && lastTask 
        ? (lastRdv > lastTask ? lastRdv : lastTask)
        : lastRdv || lastTask || client.updatedAt

      // Calculate dormancy status
      let activityStatus: 'active' | 'recent' | 'dormant' | 'lost'
      if (lastInteraction > thirtyDaysAgo) {
        activityStatus = 'active'
      } else if (lastInteraction > ninetyDaysAgo) {
        activityStatus = 'recent'
      } else if (lastInteraction > sixMonthsAgo) {
        activityStatus = 'dormant'
      } else {
        activityStatus = 'lost'
      }

      // Review status
      const kycOverdue = client.kycNextReviewDate && client.kycNextReviewDate < now
      const kycUpcoming = client.kycNextReviewDate && client.kycNextReviewDate >= now && client.kycNextReviewDate <= thirtyDaysFromNow
      const contractsRenewing = client.contrats.length > 0

      return {
        ...client,
        lastInteraction,
        activityStatus,
        kycOverdue,
        kycUpcoming,
        contractsRenewing,
        opportunitiesCount: client.opportunites.length,
        opportunitiesValue: client.opportunites.reduce((sum, o) => sum + (Number(o.estimatedValue) || 0), 0)
      }
    })

    // Filter based on query params
    let filteredClients = clientsWithStatus

    if (statusFilter && statusFilter !== 'ALL') {
      if (statusFilter === 'DORMANT') {
        filteredClients = filteredClients.filter(c => c.activityStatus === 'dormant' || c.activityStatus === 'lost')
      } else {
        filteredClients = filteredClients.filter(c => c.status === statusFilter)
      }
    }

    if (reviewFilter === 'overdue') {
      filteredClients = filteredClients.filter(c => c.kycOverdue)
    } else if (reviewFilter === 'upcoming') {
      filteredClients = filteredClients.filter(c => c.kycUpcoming || c.contractsRenewing)
    }

    // Summary stats
    const stats = {
      total: clientsWithStatus.length,
      active: clientsWithStatus.filter(c => c.status === 'ACTIF').length,
      prospects: clientsWithStatus.filter(c => c.status === 'PROSPECT').length,
      dormants: clientsWithStatus.filter(c => c.activityStatus === 'dormant' || c.activityStatus === 'lost').length,
      byActivity: {
        active: clientsWithStatus.filter(c => c.activityStatus === 'active').length,
        recent: clientsWithStatus.filter(c => c.activityStatus === 'recent').length,
        dormant: clientsWithStatus.filter(c => c.activityStatus === 'dormant').length,
        lost: clientsWithStatus.filter(c => c.activityStatus === 'lost').length,
      },
      alerts: {
        kycOverdue: clientsWithStatus.filter(c => c.kycOverdue).length,
        kycUpcoming: clientsWithStatus.filter(c => c.kycUpcoming).length,
        contractsRenewing: clientsWithStatus.filter(c => c.contractsRenewing).length,
      }
    }

    // Clients needing review (priority list)
    const needsReview = clientsWithStatus
      .filter(c => c.kycOverdue || c.activityStatus === 'dormant' || c.activityStatus === 'lost')
      .slice(0, 10)

    // Upcoming actions
    const upcomingActions = clientsWithStatus
      .filter(c => c.kycUpcoming || c.contractsRenewing)
      .slice(0, 10)

    return NextResponse.json({
      stats,
      clients: filteredClients.map(c => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phone: c.phone,
        status: c.status,
        clientType: c.clientType,
        activityStatus: c.activityStatus,
        lastInteraction: c.lastInteraction,
        kycOverdue: c.kycOverdue,
        kycUpcoming: c.kycUpcoming,
        kycNextReviewDate: c.kycNextReviewDate,
        contractsRenewing: c.contractsRenewing,
        contractsToRenew: c.contrats,
        opportunitiesCount: c.opportunitiesCount,
        opportunitiesValue: c.opportunitiesValue,
      })),
      needsReview: needsReview.map(c => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        reason: c.kycOverdue ? 'KYC expiré' : 'Client dormant',
        lastInteraction: c.lastInteraction,
        activityStatus: c.activityStatus,
      })),
      upcomingActions: upcomingActions.map(c => ({
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        actions: [
          ...(c.kycUpcoming ? [`KYC à revoir (${c.kycNextReviewDate?.toLocaleDateString('fr-FR')})`] : []),
          ...c.contrats.map(ct => `${ct.name} - renouvellement ${ct.nextRenewalDate?.toLocaleDateString('fr-FR')}`)
        ]
      }))
    })
  } catch (error: any) {
    console.error('Error fetching portfolio:', error)
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Erreur lors de la récupération du portefeuille', 500)
  }
}
