 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
/**
 * API Pilotage Commercial
 * GET /api/advisor/pilotage
 * 
 * Retourne toutes les données nécessaires au pilotage commercial :
 * - Pipeline par étape avec valeurs et taux de conversion
 * - Objectifs CA, clients, RDV
 * - Performance (classement, taux transformation)
 * - Top deals
 * - Métriques d'activité
 * - Vue portefeuille
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

    // Get period from query
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    // Calculate date range
    const now = new Date()
    let startDate: Date
    let previousStartDate: Date
    let previousEndDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        previousEndDate = startDate
        break
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        previousStartDate = new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000)
        previousEndDate = startDate
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1)
        previousEndDate = startDate
        break
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        previousEndDate = startDate
    }

    // Pipeline stages definition
    const pipelineStages = [
      { id: 'discovery', name: 'Découverte', shortName: 'R0', color: 'bg-gray-500', baseRate: 20 },
      { id: 'qualification', name: 'Qualification', shortName: 'R1', color: 'bg-blue-500', baseRate: 40 },
      { id: 'proposal', name: 'Proposition', shortName: 'R2', color: 'bg-violet-500', baseRate: 60 },
      { id: 'negotiation', name: 'Négociation', shortName: 'R3', color: 'bg-amber-500', baseRate: 80 },
      { id: 'closing', name: 'Closing', shortName: 'Win', color: 'bg-emerald-500', baseRate: 95 },
    ]

    // Get opportunities for pipeline
    const opportunities = await prisma.opportunite.findMany({
      where: {
        cabinetId,
        conseillerId: advisorId,
        status: { notIn: ['PERDUE'] },
      },
      select: {
        id: true,
        name: true,
        estimatedValue: true,
        status: true,
        confidence: true,
        actionDeadline: true,
        createdAt: true,
        client: {
          select: { firstName: true, lastName: true }
        }
      },
      orderBy: { estimatedValue: 'desc' }
    })

    // Map opportunity status to pipeline stage
    const statusToStage: Record<string, string> = {
      'NEW': 'discovery',
      'CONTACTEE': 'discovery', 
      'QUALIFIEE': 'qualification',
      'PROPOSITION': 'proposal',
      'NEGOTIATION': 'negotiation',
      'CONVERTIE': 'closing',
    }

    // Build pipeline data
    const pipeline = pipelineStages.map(stage => {
      const stageOpps = opportunities.filter(o => 
        statusToStage[o.status] === stage.id || 
        (stage.id === 'closing' && o.status === 'CONVERTIE')
      )
      
      return {
        id: stage.id,
        name: stage.name,
        shortName: stage.shortName,
        count: stageOpps.length,
        value: stageOpps.reduce((sum, o) => sum + (Number(o.estimatedValue) || 0), 0),
        conversionRate: stage.baseRate,
        color: stage.color,
      }
    })

    // Top deals (highest value opportunities not yet won)
    const topDeals = opportunities
      .filter(o => o.status !== 'CONVERTIE')
      .slice(0, 10)
      .map(o => ({
        id: o.id,
        clientName: `${o.client?.firstName || ''} ${o.client?.lastName || ''}`.trim() || o.name,
        value: Number(o.estimatedValue) || 0,
        stage: statusToStage[o.status] || 'discovery',
        probability: Number(o.confidence) || 50,
        nextAction: getNextAction(o.status),
        dueDate: o.actionDeadline?.toISOString() || '',
      }))

    // Calculate CA from won opportunities in period
    const wonOpportunities = await prisma.opportunite.findMany({
      where: {
        cabinetId,
        conseillerId: advisorId,
        status: 'CONVERTIE',
        updatedAt: { gte: startDate }
      },
      select: { estimatedValue: true }
    })
    const currentCA = wonOpportunities.reduce((sum, o) => sum + (Number(o.estimatedValue) || 0), 0)

    // Previous period CA for trend
    const previousWonOpportunities = await prisma.opportunite.findMany({
      where: {
        cabinetId,
        conseillerId: advisorId,
        status: 'CONVERTIE',
        updatedAt: { gte: previousStartDate, lt: previousEndDate }
      },
      select: { estimatedValue: true }
    })
    const previousCA = previousWonOpportunities.reduce((sum, o) => sum + (Number(o.estimatedValue) || 0), 0)
    const caTrend = previousCA > 0 ? Math.round(((currentCA - previousCA) / previousCA) * 100) : 0

    // Activity metrics
    const [rdvCount, rdvPrevious, tasksCompleted, tasksPrevious] = await Promise.all([
      prisma.rendezVous.count({
        where: { cabinetId, conseillerId: advisorId, startDate: { gte: startDate } }
      }),
      prisma.rendezVous.count({
        where: { cabinetId, conseillerId: advisorId, startDate: { gte: previousStartDate, lt: previousEndDate } }
      }),
      prisma.tache.count({
        where: { cabinetId, assignedToId: advisorId, status: 'TERMINE', completedAt: { gte: startDate } }
      }),
      prisma.tache.count({
        where: { cabinetId, assignedToId: advisorId, status: 'TERMINE', completedAt: { gte: previousStartDate, lt: previousEndDate } }
      }),
    ])

    // Portfolio stats
    const [totalClients, prospects, dormants] = await Promise.all([
      prisma.client.count({
        where: { cabinetId, conseillerId: advisorId, status: 'ACTIF' }
      }),
      prisma.client.count({
        where: { cabinetId, conseillerId: advisorId, status: 'PROSPECT' }
      }),
      prisma.client.count({
        where: { 
          cabinetId, 
          conseillerId: advisorId, 
          status: 'ACTIF',
          updatedAt: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) }
        }
      }),
    ])

    // Ranking among cabinet advisors (by CA)
    const allAdvisors = await prisma.user.findMany({
      where: { cabinetId, role: { in: ['ADMIN', 'ADVISOR'] }, isActive: true },
      select: { id: true }
    })

    const advisorCAs = await Promise.all(
      allAdvisors.map(async (adv) => {
        const ca = await prisma.opportunite.aggregate({
          where: { cabinetId, conseillerId: adv.id, status: 'CONVERTIE', updatedAt: { gte: startDate } },
          _sum: { estimatedValue: true }
        })
        return { id: adv.id, ca: Number(ca._sum.estimatedValue) || 0 }
      })
    )

    const sortedAdvisors = advisorCAs.sort((a, b) => b.ca - a.ca)
    const rank = sortedAdvisors.findIndex(a => a.id === advisorId) + 1

    // Calculate conversion rate
    const totalOppsCreated = await prisma.opportunite.count({
      where: { cabinetId, conseillerId: advisorId, createdAt: { gte: startDate } }
    })
    const wonCount = wonOpportunities.length
    const conversionRate = totalOppsCreated > 0 ? Math.round((wonCount / totalOppsCreated) * 100) : 0

    // Monthly CA target (example: 50K€/month, adjust based on plan/settings)
    const monthlyCATarget = 50000
    const periodMultiplier = period === 'week' ? 0.25 : period === 'quarter' ? 3 : period === 'year' ? 12 : 1
    const caTarget = monthlyCATarget * periodMultiplier

    // Activity targets
    const rdvTarget = period === 'week' ? 5 : period === 'quarter' ? 60 : period === 'year' ? 240 : 20
    const proposalsTarget = period === 'week' ? 2 : period === 'quarter' ? 24 : period === 'year' ? 96 : 8
    const callsTarget = period === 'week' ? 15 : period === 'quarter' ? 180 : period === 'year' ? 720 : 60
    const signaturesTarget = period === 'week' ? 1 : period === 'quarter' ? 12 : period === 'year' ? 48 : 4

    return NextResponse.json({
      pipeline,
      topDeals,
      objectives: {
        ca: {
          current: currentCA,
          target: caTarget,
          trend: caTrend,
        }
      },
      allObjectives: [
        {
          id: 'ca',
          label: 'Chiffre d\'affaires',
          type: 'ca',
          current: currentCA,
          target: caTarget,
          unit: '€',
          trend: caTrend,
        },
        {
          id: 'clients',
          label: 'Nouveaux clients',
          type: 'clients',
          current: wonCount,
          target: signaturesTarget,
          unit: 'clients',
          trend: tasksPrevious > 0 ? Math.round(((wonCount - tasksPrevious) / tasksPrevious) * 100) : 0,
        },
        {
          id: 'rdv',
          label: 'Rendez-vous',
          type: 'rdv',
          current: rdvCount,
          target: rdvTarget,
          unit: 'RDV',
          trend: rdvPrevious > 0 ? Math.round(((rdvCount - rdvPrevious) / rdvPrevious) * 100) : 0,
        },
      ],
      performance: {
        rank,
        totalAdvisors: allAdvisors.length,
        conversionRate,
      },
      activity: {
        rdv: { current: rdvCount, target: rdvTarget },
        proposals: { current: Math.min(opportunities.filter(o => o.status === 'PRESENTEE').length, proposalsTarget), target: proposalsTarget },
        calls: { current: tasksCompleted, target: callsTarget },
        signatures: { current: wonCount, target: signaturesTarget },
      },
      portfolio: {
        totalClients,
        prospects,
        dormants,
        aum: 0, // Would need to aggregate from client patrimoine data
      },
      period,
    })
  } catch (error: any) {
    logger.error('Error fetching pilotage data:', { error: error instanceof Error ? error.message : String(error) })
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Erreur lors de la récupération des données de pilotage', 500)
  }
}

function getNextAction(status: string): string {
  switch (status) {
    case 'NEW':
    case 'CONTACTEE':
      return 'Qualifier le besoin'
    case 'QUALIFIEE':
      return 'Envoyer proposition'
    case 'PROPOSITION':
      return 'Relancer client'
    case 'NEGOTIATION':
      return 'Finaliser closing'
    default:
      return 'Prochaine étape'
  }
}
