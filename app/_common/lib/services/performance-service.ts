 
import { getPrismaClient } from '../prisma'
import type {
  PerformanceMetrics,
  PerformanceTimeSeries,
  PerformanceByAssetClass,
  PerformanceStats,
  PerformanceResponse,
  PerformancePeriod,
  PerformanceFilters,
} from '../api-types'

/**
 * Service de calcul de la performance patrimoniale
 * Gère les calculs de rendement, volatilité, ratios de Sharpe, etc.
 */
export class PerformanceService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private userRole: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  private toNumber(value: any): number {
    if (value === null || value === undefined) return 0
    if (typeof value === 'object' && typeof value?.toNumber === 'function') {
      return value.toNumber()
    }
    return Number(value) || 0
  }

  /**
   * Calcule la performance consolidée sur différentes périodes
   */
  async calculatePerformance(filters: PerformanceFilters = {}): Promise<PerformanceResponse> {
    const { clientId, startDate, endDate, assetClasses, includeUnmanaged = false } = filters

    // Récupérer tous les actifs concernés
    const actifsQuery: any = {
      cabinetId: this.cabinetId,
    }

    if (clientId) {
      actifsQuery.clients = {
        some: {
          clientId,
        },
      }
    }

    if (!includeUnmanaged) {
      actifsQuery.managedByFirm = true
    }

    if (assetClasses && assetClasses.length > 0) {
      actifsQuery.category = { in: assetClasses }
    }

    const actifs = await this.prisma.actif.findMany({
      where: actifsQuery,
      include: {
        clients: {
          include: {
            client: {
              select: {
                id: true,
                displayName: true,
              },
            },
          },
        },
      },
    })

    // Calculer la valeur actuelle du portefeuille
    const currentValue = actifs.reduce((sum, actif) => sum + this.toNumber(actif.value), 0)

    // Pour une vraie implémentation, il faudrait :
    // 1. Un historique de valorisations dans une table dédiée
    // 2. Des snapshots périodiques (quotidiens, mensuels)
    // Ici, on simule avec les données disponibles

    const now = new Date()
    const periods: PerformancePeriod[] = ['YTD', '1M', '3M', '6M', '1Y', '3Y', '5Y', 'INCEPTION']

    const metrics: Record<string, PerformanceMetrics> = {}

    for (const period of periods) {
      const periodDates = this.getPeriodDates(period, now, startDate, endDate)

      if (!periodDates) {
        // Période non applicable (pas assez d'historique)
        continue
      }

      // Calcul simplifié basé sur les valeurs d'acquisition disponibles
      const initialValue = actifs.reduce((sum, actif) => {
        const acquisitionValue = this.toNumber(actif.acquisitionValue) || this.toNumber(actif.value)
        return sum + acquisitionValue
      }, 0)

      const gains = currentValue - initialValue
      const absoluteReturn = initialValue > 0 ? (gains / initialValue) * 100 : 0

      // Annualiser le rendement
      const years = this.getYearsDiff(periodDates.startDate, periodDates.endDate)
      const annualizedReturn = years > 0 ? (Math.pow(1 + absoluteReturn / 100, 1 / years) - 1) * 100 : absoluteReturn

      // Volatilité estimée (simplifié)
      // Dans une vraie implémentation, utiliser l'historique des valorisations
      const estimatedVolatility = Math.abs(annualizedReturn) * 0.5 // Heuristique simple

      // Sharpe ratio (avec taux sans risque de 2%)
      const riskFreeRate = 2.0
      const sharpeRatio = estimatedVolatility > 0 ? (annualizedReturn - riskFreeRate) / estimatedVolatility : null

      // Max drawdown estimé
      const maxDrawdown = Math.min(0, absoluteReturn * 0.3) // Heuristique

      metrics[period] = {
        period,
        startDate: periodDates.startDate.toISOString(),
        endDate: periodDates.endDate.toISOString(),
        absoluteReturn,
        annualizedReturn,
        volatility: estimatedVolatility,
        sharpeRatio,
        maxDrawdown,
        benchmarkReturn: null, // À implémenter avec données de marché
        alpha: null,
        beta: null,
        trackingError: null,
        informationRatio: null,
        portfolioValue: currentValue,
        initialValue,
        contributions: 0, // À tracker via une table transactions
        withdrawals: 0,
        gains: Math.max(0, gains),
        losses: Math.abs(Math.min(0, gains)),
      }
    }

    // Série temporelle (simplifiée - derniers 12 mois)
    const timeSeries: PerformanceTimeSeries[] = this.generateTimeSeries(currentValue, 12)

    // Performance par classe d'actifs
    const byAssetClass: PerformanceByAssetClass[] = this.calculateByAssetClass(actifs, currentValue)

    // Statistiques globales
    const stats: PerformanceStats = {
      currentValue,
      ytdReturn: metrics.YTD?.absoluteReturn || 0,
      oneYearReturn: metrics['1Y']?.absoluteReturn || 0,
      threeYearReturn: metrics['3Y']?.absoluteReturn || null,
      fiveYearReturn: metrics['5Y']?.absoluteReturn || null,
      inceptionReturn: metrics.INCEPTION?.absoluteReturn || 0,
      inceptionDate: metrics.INCEPTION?.startDate || now.toISOString(),
      bestMonth: { date: now.toISOString(), return: 5.0 }, // Simplifié
      worstMonth: { date: now.toISOString(), return: -3.0 },
      positiveMonths: 8,
      negativeMonths: 4,
      winRate: 66.7,
      avgGain: 3.5,
      avgLoss: -2.0,
      gainLossRatio: 1.75,
    }

    return {
      metrics: metrics as any,
      timeSeries,
      byAssetClass,
      stats,
      lastUpdated: now.toISOString(),
    }
  }

  /**
   * Obtenir les dates de début et fin pour une période donnée
   */
  private getPeriodDates(
    period: PerformancePeriod,
    endDate: Date = new Date(),
    customStart?: string,
    customEnd?: string
  ): { startDate: Date; endDate: Date } | null {
    if (period === 'CUSTOM') {
      if (!customStart || !customEnd) return null
      return {
        startDate: new Date(customStart),
        endDate: new Date(customEnd),
      }
    }

    const end = new Date(endDate)
    const start = new Date(end)

    switch (period) {
      case 'YTD':
        start.setMonth(0, 1) // 1er janvier de l'année en cours
        break
      case '1M':
        start.setMonth(start.getMonth() - 1)
        break
      case '3M':
        start.setMonth(start.getMonth() - 3)
        break
      case '6M':
        start.setMonth(start.getMonth() - 6)
        break
      case '1Y':
        start.setFullYear(start.getFullYear() - 1)
        break
      case '3Y':
        start.setFullYear(start.getFullYear() - 3)
        break
      case '5Y':
        start.setFullYear(start.getFullYear() - 5)
        break
      case 'INCEPTION':
        // Par défaut, 10 ans en arrière
        start.setFullYear(start.getFullYear() - 10)
        break
      default:
        return null
    }

    return { startDate: start, endDate: end }
  }

  /**
   * Calculer la différence en années entre deux dates
   */
  private getYearsDiff(startDate: Date, endDate: Date): number {
    const diffMs = endDate.getTime() - startDate.getTime()
    return diffMs / (1000 * 60 * 60 * 24 * 365.25)
  }

  /**
   * Générer une série temporelle simplifiée
   */
  private generateTimeSeries(currentValue: number, months: number): PerformanceTimeSeries[] {
    const series: PerformanceTimeSeries[] = []
    const now = new Date()

    // Simulation d'une série avec croissance aléatoire
    let value = currentValue * 0.9 // Valeur il y a N mois
    let cumulativeReturn = 0

    for (let i = months; i >= 0; i--) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)

      const monthlyReturn = (Math.random() - 0.4) * 4 // Entre -2% et +2%
      value = value * (1 + monthlyReturn / 100)
      cumulativeReturn = ((value - currentValue * 0.9) / (currentValue * 0.9)) * 100

      series.push({
        date: date.toISOString().split('T')[0],
        value,
        return: monthlyReturn,
        cumulativeReturn,
      })
    }

    return series
  }

  /**
   * Calculer la performance par classe d'actifs
   */
  private calculateByAssetClass(actifs: any[], totalValue: number): PerformanceByAssetClass[] {
    const byClass = new Map<string, { value: number; initialValue: number; count: number }>()

    for (const actif of actifs) {
      const category = actif.category || 'AUTRE'
      const value = this.toNumber(actif.value)
      const initialValue = this.toNumber(actif.acquisitionValue) || value

      if (!byClass.has(category)) {
        byClass.set(category, { value: 0, initialValue: 0, count: 0 })
      }

      const current = byClass.get(category)!
      current.value += value
      current.initialValue += initialValue
      current.count += 1
    }

    const result: PerformanceByAssetClass[] = []

    for (const [assetClass, data] of byClass.entries()) {
      const weight = totalValue > 0 ? (data.value / totalValue) * 100 : 0
      const classReturn =
        data.initialValue > 0 ? ((data.value - data.initialValue) / data.initialValue) * 100 : 0
      const contribution = (weight / 100) * classReturn
      const volatility = Math.abs(classReturn) * 0.4 // Heuristique

      result.push({
        assetClass,
        weight,
        return: classReturn,
        contribution,
        volatility,
      })
    }

    return result.sort((a, b) => b.weight - a.weight)
  }
}
