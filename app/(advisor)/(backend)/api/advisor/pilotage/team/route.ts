 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
/**
 * API Pilotage Équipe (Admin only)
 * GET /api/advisor/pilotage/team
 * 
 * Retourne les données de pilotage de l'équipe :
 * - KPIs globaux cabinet
 * - Performance par conseiller
 * - Leaderboard
 * - Alertes équipe
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Only admins can access team pilotage
    if (user.role !== 'ADMIN') {
      return createErrorResponse('Accès réservé aux administrateurs', 403)
    }

    const cabinetId = context.cabinetId

    // Get period from query
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'quarter':
        startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default: // month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Get all advisors in cabinet
    const advisors = await prisma.user.findMany({
      where: { 
        cabinetId, 
        role: { in: ['ADMIN', 'ADVISOR'] }, 
        isActive: true 
      },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        email: true,
        role: true,
        createdAt: true,
      }
    })

    // Get performance data for each advisor
    const advisorStats = await Promise.all(
      advisors.map(async (advisor) => {
        // CA from won opportunities
        const wonOpps = await prisma.opportunite.findMany({
          where: { 
            cabinetId, 
            conseillerId: advisor.id, 
            status: 'CONVERTIE',
            updatedAt: { gte: startDate }
          },
          select: { estimatedValue: true }
        })
        const ca = wonOpps.reduce((sum, o) => sum + (Number(o.estimatedValue) || 0), 0)

        // All opportunities (pipeline)
        const allOpps = await prisma.opportunite.findMany({
          where: { 
            cabinetId, 
            conseillerId: advisor.id,
            status: { notIn: ['PERDUE', 'CONVERTIE'] }
          },
          select: { estimatedValue: true, confidence: true }
        })
        const pipelineValue = allOpps.reduce((sum, o) => sum + (Number(o.estimatedValue) || 0), 0)
        const pipelineWeighted = allOpps.reduce((sum, o) => sum + ((Number(o.estimatedValue) || 0) * (Number(o.confidence) || 50) / 100), 0)
        const pipelineCount = allOpps.length

        // Clients count
        const clientsCount = await prisma.client.count({
          where: { cabinetId, conseillerId: advisor.id, status: 'ACTIF' }
        })

        // New clients this period
        const newClients = await prisma.client.count({
          where: { 
            cabinetId, 
            conseillerId: advisor.id, 
            createdAt: { gte: startDate }
          }
        })

        // RDV count
        const rdvCount = await prisma.rendezVous.count({
          where: { cabinetId, conseillerId: advisor.id, startDate: { gte: startDate } }
        })

        // Tasks completed
        const tasksCompleted = await prisma.tache.count({
          where: { 
            cabinetId, 
            assignedToId: advisor.id, 
            status: 'TERMINE',
            completedAt: { gte: startDate }
          }
        })

        // Tasks pending
        const tasksPending = await prisma.tache.count({
          where: { 
            cabinetId, 
            assignedToId: advisor.id, 
            status: { in: ['A_FAIRE', 'EN_COURS'] }
          }
        })

        // Conversion rate
        const totalCreated = await prisma.opportunite.count({
          where: { cabinetId, conseillerId: advisor.id, createdAt: { gte: startDate } }
        })
        const conversionRate = totalCreated > 0 ? Math.round((wonOpps.length / totalCreated) * 100) : 0

        return {
          id: advisor.id,
          firstName: advisor.firstName,
          lastName: advisor.lastName,
          email: advisor.email,
          role: advisor.role,
          ca,
          pipelineValue,
          pipelineWeighted,
          pipelineCount,
          clientsCount,
          newClients,
          rdvCount,
          tasksCompleted,
          tasksPending,
          conversionRate,
          wonDeals: wonOpps.length,
        }
      })
    )

    // Sort by CA for leaderboard
    const leaderboard = [...advisorStats].sort((a, b) => b.ca - a.ca)

    // Cabinet totals
    const cabinetTotals = {
      totalCA: advisorStats.reduce((sum, a) => sum + a.ca, 0),
      totalPipeline: advisorStats.reduce((sum, a) => sum + a.pipelineValue, 0),
      totalPipelineWeighted: advisorStats.reduce((sum, a) => sum + a.pipelineWeighted, 0),
      totalClients: advisorStats.reduce((sum, a) => sum + a.clientsCount, 0),
      totalNewClients: advisorStats.reduce((sum, a) => sum + a.newClients, 0),
      totalRdv: advisorStats.reduce((sum, a) => sum + a.rdvCount, 0),
      totalDeals: advisorStats.reduce((sum, a) => sum + a.wonDeals, 0),
      avgConversionRate: advisorStats.length > 0 
        ? Math.round(advisorStats.reduce((sum, a) => sum + a.conversionRate, 0) / advisorStats.length)
        : 0,
    }

    // Pipeline stages for cabinet
    const pipelineStages = [
      { id: 'discovery', name: 'Découverte', shortName: 'R0', color: 'bg-gray-500' },
      { id: 'qualification', name: 'Qualification', shortName: 'R1', color: 'bg-blue-500' },
      { id: 'proposal', name: 'Proposition', shortName: 'R2', color: 'bg-violet-500' },
      { id: 'negotiation', name: 'Négociation', shortName: 'R3', color: 'bg-amber-500' },
      { id: 'closing', name: 'Closing', shortName: 'Win', color: 'bg-emerald-500' },
    ]

    const statusToStage: Record<string, string> = {
      'NEW': 'discovery',
      'CONTACTEE': 'discovery', 
      'QUALIFIEE': 'qualification',
      'PROPOSITION': 'proposal',
      'NEGOTIATION': 'negotiation',
      'CONVERTIE': 'closing',
    }

    const allOpportunities = await prisma.opportunite.findMany({
      where: { cabinetId, status: { notIn: ['PERDUE'] } },
      select: { status: true, estimatedValue: true }
    })

    const teamPipeline = pipelineStages.map(stage => {
      const stageOpps = allOpportunities.filter(o => 
        statusToStage[o.status] === stage.id
      )
      return {
        ...stage,
        count: stageOpps.length,
        value: stageOpps.reduce((sum, o) => sum + (Number(o.estimatedValue) || 0), 0),
      }
    })

    // Alerts: underperformers, dormant advisors
    const alerts: Array<{ type: string; severity: 'warning' | 'danger' | 'info'; message: string; advisorId?: string }> = []
    
    // CA objective (example: 50K/month per advisor)
    const monthlyTarget = 50000
    const periodMultiplier = period === 'week' ? 0.25 : period === 'quarter' ? 3 : period === 'year' ? 12 : 1
    const target = monthlyTarget * periodMultiplier

    advisorStats.forEach(advisor => {
      const progress = (advisor.ca / target) * 100
      if (progress < 50) {
        alerts.push({
          type: 'underperformer',
          severity: 'danger',
          message: `${advisor.firstName} ${advisor.lastName} est à ${Math.round(progress)}% de son objectif CA`,
          advisorId: advisor.id,
        })
      } else if (progress < 80) {
        alerts.push({
          type: 'at_risk',
          severity: 'warning',
          message: `${advisor.firstName} ${advisor.lastName} est à ${Math.round(progress)}% de son objectif`,
          advisorId: advisor.id,
        })
      }

      if (advisor.tasksPending > 10) {
        alerts.push({
          type: 'tasks_overload',
          severity: 'warning',
          message: `${advisor.firstName} ${advisor.lastName} a ${advisor.tasksPending} tâches en attente`,
          advisorId: advisor.id,
        })
      }
    })

    return NextResponse.json({
      advisors: advisorStats,
      leaderboard,
      cabinetTotals,
      teamPipeline,
      alerts,
      period,
      caTarget: target,
    })
  } catch (error: any) {
    logger.error('Error fetching team pilotage data:', { error: error instanceof Error ? error.message : String(error) })
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Erreur lors de la récupération des données équipe', 500)
  }
}
