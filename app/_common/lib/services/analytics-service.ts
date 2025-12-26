/**
 * Analytics Service - Statistiques et métriques d'activité
 */

import { prisma } from '@/app/_common/lib/prisma'

export interface AnalyticsPeriod {
  start: Date
  end: Date
}

export interface ActivityMetrics {
  period: AnalyticsPeriod
  clients: {
    total: number
    new: number
    active: number
    churned: number
  }
  patrimoine: {
    totalAUM: number
    collecteNette: number
    arbitrages: number
  }
  activite: {
    rdvs: number
    taches: number
    emails: number
    appels: number
  }
  conversion: {
    prospectToClient: number
    opportunityToContract: number
  }
}

export interface TimeSeriesPoint {
  date: string
  value: number
}

export interface AnalyticsDashboard {
  kpis: {
    name: string
    value: number
    change: number
    trend: 'up' | 'down' | 'stable'
  }[]
  charts: {
    name: string
    type: 'line' | 'bar' | 'pie'
    data: TimeSeriesPoint[]
  }[]
}

export class AnalyticsService {
  /**
   * Métriques d'activité pour une période
   */
  async getActivityMetrics(
    advisorId: string,
    period: AnalyticsPeriod
  ): Promise<ActivityMetrics> {
    const { start, end } = period

    // Clients
    const [totalClients, newClients, activeClients] = await Promise.all([
      prisma.client.count({ where: { conseillerId: advisorId } }),
      prisma.client.count({
        where: {
          conseillerId: advisorId,
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.client.count({
        where: {
          conseillerId: advisorId,
          status: 'ACTIF',
        },
      }),
    ])

    // Patrimoine
    const clientIds = (
      await prisma.client.findMany({
        where: { conseillerId: advisorId },
        select: { id: true },
      })
    ).map((c) => c.id)

    const actifsSum = await prisma.actif.aggregate({
      where: { clients: { some: { id: { in: clientIds } } } },
      _sum: { value: true },
    })

    const contratsSum = await prisma.contrat.aggregate({
      where: { clientId: { in: clientIds } },
      _sum: { value: true },
    })

    // Activité
    const [rdvs, taches] = await Promise.all([
      prisma.rendezVous.count({
        where: {
          conseillerId: advisorId,
          createdAt: { gte: start, lte: end },
        },
      }),
      prisma.tache.count({
        where: {
          assignedToId: advisorId,
          createdAt: { gte: start, lte: end },
        },
      }),
    ])

    // Conversions
    const opportunitesConverties = await prisma.opportunite.count({
      where: {
        conseillerId: advisorId,
        status: 'CONVERTIE',
        updatedAt: { gte: start, lte: end },
      },
    })

    const opportunitesTotal = await prisma.opportunite.count({
      where: {
        conseillerId: advisorId,
        createdAt: { gte: start, lte: end },
      },
    })

    return {
      period,
      clients: {
        total: totalClients,
        new: newClients,
        active: activeClients,
        churned: 0,
      },
      patrimoine: {
        totalAUM: Number(actifsSum._sum.value || 0) + Number(contratsSum._sum.value || 0),
        collecteNette: 0,
        arbitrages: 0,
      },
      activite: {
        rdvs,
        taches,
        emails: 0,
        appels: 0,
      },
      conversion: {
        prospectToClient: 0,
        opportunityToContract: opportunitesTotal > 0 
          ? Math.round((opportunitesConverties / opportunitesTotal) * 100) 
          : 0,
      },
    }
  }

  /**
   * Évolution mensuelle d'une métrique
   */
  async getMetricTimeSeries(
    advisorId: string,
    metric: 'clients' | 'aum' | 'rdvs',
    months: number = 12
  ): Promise<TimeSeriesPoint[]> {
    const points: TimeSeriesPoint[] = []
    const now = new Date()

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const endDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
      
      let value = 0

      switch (metric) {
        case 'clients':
          value = await prisma.client.count({
            where: {
              conseillerId: advisorId,
              createdAt: { lte: endDate },
            },
          })
          break
        case 'aum':
          // Simplifié - en production, historiser les valeurs
          value = 0
          break
        case 'rdvs':
          value = await prisma.rendezVous.count({
            where: {
              conseillerId: advisorId,
              createdAt: { gte: date, lte: endDate },
            },
          })
          break
      }

      points.push({
        date: date.toISOString().slice(0, 7), // YYYY-MM
        value,
      })
    }

    return points
  }

  /**
   * Top performers (pour managers)
   */
  async getTopPerformers(
    cabinetId: string,
    metric: 'clients' | 'aum' | 'conversion',
    limit: number = 5
  ): Promise<{ advisorId: string; name: string; value: number }[]> {
    const advisors = await prisma.user.findMany({
      where: { cabinetId },
      select: { id: true, firstName: true, lastName: true },
    })

    const results: { advisorId: string; name: string; value: number }[] = []

    for (const advisor of advisors) {
      let value = 0

      switch (metric) {
        case 'clients':
          value = await prisma.client.count({
            where: { conseillerId: advisor.id },
          })
          break
        case 'aum':
          // Simplifié
          value = 0
          break
        case 'conversion':
          const converted = await prisma.opportunite.count({
            where: { conseillerId: advisor.id, status: 'CONVERTIE' },
          })
          const total = await prisma.opportunite.count({
            where: { conseillerId: advisor.id },
          })
          value = total > 0 ? Math.round((converted / total) * 100) : 0
          break
      }

      results.push({
        advisorId: advisor.id,
        name: `${advisor.firstName || ''} ${advisor.lastName || ''}`.trim(),
        value,
      })
    }

    return results.sort((a, b) => b.value - a.value).slice(0, limit)
  }

  /**
   * Dashboard analytics complet
   */
  async getDashboard(advisorId: string): Promise<AnalyticsDashboard> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const [current, previous] = await Promise.all([
      this.getActivityMetrics(advisorId, { start: startOfMonth, end: now }),
      this.getActivityMetrics(advisorId, { start: startOfLastMonth, end: endOfLastMonth }),
    ])

    const calcTrend = (curr: number, prev: number): { change: number; trend: 'up' | 'down' | 'stable' } => ({
      change: prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0,
      trend: curr > prev ? 'up' : curr < prev ? 'down' : 'stable',
    })

    return {
      kpis: [
        {
          name: 'Clients',
          value: current.clients.total,
          ...calcTrend(current.clients.total, previous.clients.total),
        },
        {
          name: 'Nouveaux clients',
          value: current.clients.new,
          ...calcTrend(current.clients.new, previous.clients.new),
        },
        {
          name: 'Encours total',
          value: current.patrimoine.totalAUM,
          ...calcTrend(current.patrimoine.totalAUM, previous.patrimoine.totalAUM),
        },
        {
          name: 'RDVs',
          value: current.activite.rdvs,
          ...calcTrend(current.activite.rdvs, previous.activite.rdvs),
        },
      ],
      charts: [
        {
          name: 'Évolution clients',
          type: 'line',
          data: await this.getMetricTimeSeries(advisorId, 'clients', 6),
        },
        {
          name: 'RDVs mensuels',
          type: 'bar',
          data: await this.getMetricTimeSeries(advisorId, 'rdvs', 6),
        },
      ],
    }
  }
}

export const analyticsService = new AnalyticsService()
export default analyticsService
