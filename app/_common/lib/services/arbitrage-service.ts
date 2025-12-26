import { getPrismaClient } from '../prisma'
import type {
  ArbitrageSuggestion,
  ArbitrageStats,
  ArbitragesResponse,
  ArbitrageFilters,
  ArbitrageType,
  ArbitragePriority,
} from '../api-types'

/**
 * Service de génération de suggestions d'arbitrages
 * Analyse le portefeuille et suggère des optimisations basées sur des règles métier
 */
export class ArbitrageService {
  private prisma

  constructor(
    private cabinetId: string,
    private userId: string,
    private userRole: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  private toNumber(value: unknown): number {
    if (value === null || value === undefined) return 0
    if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof (value as { toNumber: () => number }).toNumber === 'function') {
      return (value as { toNumber: () => number }).toNumber()
    }
    return Number(value) || 0
  }

  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  private toStringSafe(value: unknown, fallback: string = ''): string {
    if (value === null || value === undefined) return fallback
    if (typeof value === 'string') return value
    if (typeof value === 'number') return Number.isFinite(value) ? String(value) : fallback
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    return fallback
  }

  private toActifRow(actif: Record<string, unknown>): {
    id: string
    name: string
    category: string
    type: string
    value: unknown
    acquisitionValue?: unknown
    managementFees?: unknown
  } {
    return {
      id: this.toStringSafe(actif.id),
      name: this.toStringSafe(actif.name, '(Sans nom)'),
      category: this.toStringSafe(actif.category, 'AUTRE'),
      type: this.toStringSafe(actif.type, 'AUTRE'),
      value: actif.value,
      acquisitionValue: actif.acquisitionValue,
      managementFees: actif.managementFees,
    }
  }

  /**
   * Générer des suggestions d'arbitrages pour un client ou l'ensemble du portefeuille
   */
  async generateSuggestions(filters: ArbitrageFilters = {}): Promise<ArbitragesResponse> {
    const { clientId, types, priorities, statuses, minAmount } = filters

    const suggestions: ArbitrageSuggestion[] = []

    // Récupérer les actifs concernés
    const actifsQuery: Record<string, unknown> = {
      cabinetId: this.cabinetId,
    }

    if (clientId) {
      actifsQuery.clientActifs = {
        some: {
          clientId,
        },
      }
    }

    const actifsRaw = await this.prisma.actif.findMany({
      where: actifsQuery,
      include: {
        clientActifs: {
          include: {
            client: {
              select: {
                id: true,
                displayName: true,
                riskProfile: true,
              },
            },
          },
        },
      },
    })

    const actifs = (Array.isArray(actifsRaw) ? actifsRaw : []).map((a) => this.toActifRow(a as Record<string, unknown>))

    if (actifs.length === 0) {
      return {
        suggestions: [],
        stats: this.buildEmptyStats(),
        lastAnalyzed: new Date().toISOString(),
      }
    }

    // Calculer la valeur totale du portefeuille
    const totalValue = actifs.reduce((sum, actif) => sum + this.toNumber(actif.value), 0)

    // Analyser l'allocation actuelle
    const allocation = this.calculateAllocation(actifs, totalValue)

    // Règle 1: Rééquilibrage si déséquilibre important
    const rebalancingSuggestions = this.analyzeRebalancing(actifs, allocation, totalValue)
    suggestions.push(...rebalancingSuggestions)

    // Règle 2: Diversification (concentration excessive)
    const diversificationSuggestions = this.analyzeDiversification(actifs, allocation, totalValue)
    suggestions.push(...diversificationSuggestions)

    // Règle 3: Optimisation fiscale
    const taxOptimizationSuggestions = this.analyzeTaxOptimization(actifs)
    suggestions.push(...taxOptimizationSuggestions)

    // Règle 4: Optimisation des frais
    const costOptimizationSuggestions = this.analyzeCostOptimization(actifs, totalValue)
    suggestions.push(...costOptimizationSuggestions)

    // Règle 5: Amélioration de liquidité
    const liquiditySuggestions = this.analyzeLiquidity(actifs, allocation, totalValue)
    suggestions.push(...liquiditySuggestions)

    // Règle 6: Réduction de risque
    const riskReductionSuggestions = this.analyzeRiskReduction(actifs, allocation)
    suggestions.push(...riskReductionSuggestions)

    // Filtrer selon les critères
    let filteredSuggestions = suggestions

    if (types && types.length > 0) {
      filteredSuggestions = filteredSuggestions.filter(s => types.includes(s.type))
    }

    if (priorities && priorities.length > 0) {
      filteredSuggestions = filteredSuggestions.filter(s => priorities.includes(s.priority))
    }

    if (statuses && statuses.length > 0) {
      filteredSuggestions = filteredSuggestions.filter(s => statuses.includes(s.status))
    }

    if (minAmount) {
      filteredSuggestions = filteredSuggestions.filter(s => s.suggestedAmount >= minAmount)
    }

    // Trier par priorité
    filteredSuggestions.sort((a, b) => {
      const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    const stats = this.calculateStats(filteredSuggestions)

    return {
      suggestions: filteredSuggestions,
      stats,
      lastAnalyzed: new Date().toISOString(),
    }
  }

  /**
   * Calculer l'allocation actuelle par catégorie
   */
  private calculateAllocation(
    actifs: Array<{ category: string; value: unknown }>,
    totalValue: number
  ): Map<string, { value: number; percentage: number; count: number }> {
    const allocation = new Map<string, { value: number; percentage: number; count: number }>()

    for (const actif of actifs) {
      const category = actif.category || 'AUTRE'
      const value = this.toNumber(actif.value)

      if (!allocation.has(category)) {
        allocation.set(category, { value: 0, percentage: 0, count: 0 })
      }

      const current = allocation.get(category)!
      current.value += value
      current.count += 1
    }

    // Calculer les pourcentages
    for (const [category, data] of allocation.entries()) {
      data.percentage = totalValue > 0 ? (data.value / totalValue) * 100 : 0
    }

    return allocation
  }

  /**
   * Analyser le besoin de rééquilibrage
   */
  private analyzeRebalancing(
    actifs: Array<{ category: string; value: unknown }>,
    allocation: Map<string, { value: number; percentage: number; count: number }>,
    totalValue: number
  ): ArbitrageSuggestion[] {
    const suggestions: ArbitrageSuggestion[] = []

    // Allocation cible simplifiée (à affiner selon le profil de risque)
    const targetAllocation: Record<string, number> = {
      FINANCIER_COTÉ: 40,
      FINANCIER_NON_COTÉ: 10,
      IMMOBILIER_DIRECT: 25,
      IMMOBILIER_INDIRECT: 10,
      AUTRE: 15,
    }

    for (const [category, data] of allocation.entries()) {
      const target = targetAllocation[category] || 10
      const deviation = Math.abs(data.percentage - target)

      // Si écart > 10%, suggérer rééquilibrage
      if (deviation > 10) {
        const isOverweight = data.percentage > target
        const adjustmentAmount = (deviation / 100) * totalValue

        suggestions.push({
          id: `rebalancing-${category}-${Date.now()}`,
          type: 'REBALANCING',
          priority: deviation > 20 ? 'HAUTE' : 'MOYENNE',
          status: 'SUGGESTED',
          title: `Rééquilibrage ${category}`,
          description: isOverweight
            ? `La catégorie ${category} est surpondérée (${data.percentage.toFixed(1)}% vs cible ${target}%)`
            : `La catégorie ${category} est sous-pondérée (${data.percentage.toFixed(1)}% vs cible ${target}%)`,
          rationale: `L'allocation actuelle dévie de ${deviation.toFixed(1)}% par rapport à l'allocation cible, ce qui peut augmenter le risque ou réduire les opportunités.`,
          sourceActifName: isOverweight ? category : undefined,
          targetActifName: !isOverweight ? category : undefined,
          suggestedAmount: adjustmentAmount,
          currentAllocation: data.percentage,
          targetAllocation: target,
          expectedImpact: {
            riskReduction: isOverweight ? deviation * 0.5 : undefined,
            returnImprovement: !isOverweight ? deviation * 0.3 : undefined,
          },
          implementation: {
            steps: [
              isOverweight
                ? `Alléger ${category} de ${this.formatCurrency(adjustmentAmount)}`
                : `Renforcer ${category} de ${this.formatCurrency(adjustmentAmount)}`,
              'Sélectionner les actifs sous-performants à céder',
              'Réinvestir dans la catégorie cible',
            ],
            timeframe: '1-2 semaines',
            complexity: 'MOYENNE',
          },
          createdAt: new Date().toISOString(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }
    }

    return suggestions
  }

  /**
   * Analyser le besoin de diversification
   */
  private analyzeDiversification(
    actifs: Array<{ id: string; name: string; value: unknown }>,
    allocation: Map<string, { value: number; percentage: number; count: number }>,
    totalValue: number
  ): ArbitrageSuggestion[] {
    const suggestions: ArbitrageSuggestion[] = []

    for (const actif of actifs) {
      const value = this.toNumber(actif.value)
      const weight = (value / totalValue) * 100

      if (weight > 15) {
        suggestions.push({
          id: `diversification-${actif.id}`,
          type: 'DIVERSIFICATION',
          priority: weight > 30 ? 'HAUTE' : 'MOYENNE',
          status: 'SUGGESTED',
          title: `Réduire concentration sur ${actif.name}`,
          description: `${actif.name} représente ${weight.toFixed(1)}% du portefeuille, ce qui crée un risque de concentration.`,
          rationale: `Une concentration excessive sur un actif unique augmente significativement le risque du portefeuille. Il est recommandé de limiter chaque position à 15% maximum.`,
          sourceActifId: actif.id,
          sourceActifName: actif.name,
          suggestedAmount: value * 0.3,
          currentAllocation: weight,
          targetAllocation: 15,
          expectedImpact: {
            riskReduction: (weight - 15) * 0.8,
          },
          implementation: {
            steps: [
              `Céder ${this.formatCurrency(value * 0.3)} de ${actif.name}`,
              'Répartir sur 2-3 actifs de même catégorie',
              "Maintenir l'exposition globale à la classe d'actifs",
            ],
            timeframe: '2-4 semaines',
            complexity: 'MOYENNE',
          },
          createdAt: new Date().toISOString(),
        })
      }
    }

    return suggestions
  }

  /**
   * Analyser les opportunités d'optimisation fiscale
   */
  private analyzeTaxOptimization(actifs: Record<string, unknown>[]): ArbitrageSuggestion[] {
    const suggestions: ArbitrageSuggestion[] = []

    for (const actif of actifs) {
      const actifId = this.toStringSafe(actif.id)
      const actifName = this.toStringSafe(actif.name, '(Sans nom)')
      const value = this.toNumber(actif.value)
      const acquisitionValue = this.toNumber(actif.acquisitionValue) || value
      const latentGain = value - acquisitionValue
      const latentGainPercent = acquisitionValue > 0 ? (latentGain / acquisitionValue) * 100 : 0

      if (latentGain > 10000 && latentGainPercent > 20) {
        const estimatedTax = latentGain * 0.3

        suggestions.push({
          id: `tax-optimization-${actifId}`,
          type: 'OPTIMISATION_FISCALE',
          priority: estimatedTax > 50000 ? 'HAUTE' : 'MOYENNE',
          status: 'SUGGESTED',
          title: `Optimiser fiscalité ${actifName}`,
          description: `Plus-value latente de ${this.formatCurrency(latentGain)} (${latentGainPercent.toFixed(1)}%) sur ${actifName}.`,
          rationale: `En l'état actuel, une cession génèrerait environ ${this.formatCurrency(estimatedTax)} d'impôt. Des stratégies de lissage ou de donation peuvent optimiser la charge fiscale.`,
          sourceActifId: actifId,
          sourceActifName: actifName,
          suggestedAmount: latentGain,
          expectedImpact: {
            taxSavings: estimatedTax * 0.3,
          },
          implementation: {
            steps: [
              'Analyser les opportunités de donation avec abattements',
              'Envisager un démembrement pour étaler la fiscalité',
              'Utiliser les moins-values disponibles',
            ],
            timeframe: '1-3 mois',
            complexity: 'HAUTE',
          },
          createdAt: new Date().toISOString(),
        })
      }
    }

    return suggestions
  }

  /**
   * Analyser l'optimisation des frais
   */
  private analyzeCostOptimization(actifs: Record<string, unknown>[], totalValue: number): ArbitrageSuggestion[] {
    const suggestions: ArbitrageSuggestion[] = []

    for (const actif of actifs) {
      const actifId = this.toStringSafe(actif.id)
      const actifName = this.toStringSafe(actif.name, '(Sans nom)')
      const managementFees = this.toNumber(actif.managementFees)
      const value = this.toNumber(actif.value)

      if (managementFees > 0 && value > 0) {
        const feesPercent = (managementFees / value) * 100

        if (feesPercent > 1.5) {
          const potentialSavings = managementFees * 0.5

          suggestions.push({
            id: `cost-optimization-${actifId}`,
            type: 'COST_OPTIMIZATION',
            priority: managementFees > 5000 ? 'HAUTE' : 'MOYENNE',
            status: 'SUGGESTED',
            title: `Réduire frais sur ${actifName}`,
            description: `Frais de gestion de ${feesPercent.toFixed(2)}% (${this.formatCurrency(managementFees)}/an) sur ${actifName}.`,
            rationale: `Des alternatives moins coûteuses (ETF, gestion passive) pourraient générer ${this.formatCurrency(potentialSavings)}/an d'économies, soit un gain cumulé significatif à long terme.`,
            sourceActifId: actifId,
            sourceActifName: actifName,
            suggestedAmount: value,
            expectedImpact: {
              feeReduction: potentialSavings,
              returnImprovement: (potentialSavings / value) * 100,
            },
            implementation: {
              steps: [
                'Identifier des fonds indiciels ou ETF équivalents',
                'Comparer les performances historiques nettes de frais',
                "Arbitrer progressivement vers l'alternative low-cost",
              ],
              timeframe: '1-2 mois',
              complexity: 'BASSE',
            },
            createdAt: new Date().toISOString(),
          })
        }
      }
    }

    return suggestions
  }

  /**
   * Analyser le besoin de liquidité
   */
  private analyzeLiquidity(
    actifs: Array<{ category: string; type: string; value: unknown }>,
    allocation: Map<string, { value: number; percentage: number; count: number }>,
    totalValue: number
  ): ArbitrageSuggestion[] {
    const suggestions: ArbitrageSuggestion[] = []

    const liquidAssets = actifs
      .filter(a => a.category === 'FINANCIER_COTÉ' || a.type === 'ESPECES')
      .reduce((sum, a) => sum + this.toNumber(a.value), 0)

    const liquidityRatio = (liquidAssets / totalValue) * 100

    if (liquidityRatio < 20) {
      const targetLiquid = totalValue * 0.2
      const gap = targetLiquid - liquidAssets

      suggestions.push({
        id: `liquidity-${Date.now()}`,
        type: 'LIQUIDITY',
        priority: liquidityRatio < 10 ? 'HAUTE' : 'MOYENNE',
        status: 'SUGGESTED',
        title: 'Améliorer la liquidité du portefeuille',
        description: `La part liquide représente seulement ${liquidityRatio.toFixed(1)}% du portefeuille (cible : 20%).`,
        rationale: `Un matelas de liquidité insuffisant peut contraindre à céder des actifs dans de mauvaises conditions en cas de besoin urgent.`,
        suggestedAmount: gap,
        currentAllocation: liquidityRatio,
        targetAllocation: 20,
        expectedImpact: {
          liquidityImprovement: 20 - liquidityRatio,
        },
        implementation: {
          steps: [
            `Constituer une poche liquide de ${this.formatCurrency(gap)}`,
            'Céder partiellement des actifs immobiliers ou non cotés',
            'Investir en fonds monétaires ou ETF obligataires courts',
          ],
          timeframe: '1-3 mois',
          complexity: 'MOYENNE',
        },
        createdAt: new Date().toISOString(),
      })
    }

    return suggestions
  }

  /**
   * Analyser les opportunités de réduction de risque
   */
  private analyzeRiskReduction(actifs: Record<string, unknown>[], allocation: Map<string, { value: number; percentage: number; count: number }>): ArbitrageSuggestion[] {
    const suggestions: ArbitrageSuggestion[] = []

    const riskyCategories = ['FINANCIER_NON_COTÉ', 'IMMOBILIER_DIRECT']
    const riskyValue = actifs
      .filter(a => riskyCategories.includes(this.toStringSafe(a.category)))
      .reduce((sum, a) => sum + this.toNumber(a.value), 0)

    const totalValue = actifs.reduce((sum, a) => sum + this.toNumber(a.value), 0)
    const riskyRatio = (riskyValue / totalValue) * 100

    if (riskyRatio > 50) {
      const targetRiskyRatio = 40
      const reductionAmount = ((riskyRatio - targetRiskyRatio) / 100) * totalValue

      suggestions.push({
        id: `risk-reduction-${Date.now()}`,
        type: 'RISK_REDUCTION',
        priority: riskyRatio > 60 ? 'HAUTE' : 'MOYENNE',
        status: 'SUGGESTED',
        title: "Réduire l'exposition aux actifs risqués",
        description: `Les actifs risqués (non cotés, immobilier direct) représentent ${riskyRatio.toFixed(1)}% du portefeuille.`,
        rationale: `Une concentration excessive sur des actifs peu liquides et volatils augmente le risque global du portefeuille.`,
        suggestedAmount: reductionAmount,
        currentAllocation: riskyRatio,
        targetAllocation: targetRiskyRatio,
        expectedImpact: {
          riskReduction: riskyRatio - targetRiskyRatio,
        },
        implementation: {
          steps: [
            `Alléger ${this.formatCurrency(reductionAmount)} sur actifs risqués`,
            'Réorienter vers actions cotées ou fonds diversifiés',
            'Maintenir une poche défensive (obligations, monétaire)',
          ],
          timeframe: '3-6 mois',
          complexity: 'MOYENNE',
        },
        createdAt: new Date().toISOString(),
      })
    }

    return suggestions
  }

  /**
   * Calculer les statistiques globales
   */
  private calculateStats(suggestions: ArbitrageSuggestion[]): ArbitrageStats {
    const stats: ArbitrageStats = {
      totalSuggestions: suggestions.length,
      bySuggested: suggestions.filter(s => s.status === 'SUGGESTED').length,
      byAccepted: suggestions.filter(s => s.status === 'ACCEPTEE').length,
      byRejected: suggestions.filter(s => s.status === 'REJETEE').length,
      byExecuted: suggestions.filter(s => s.status === 'EXECUTED').length,
      byType: {} as Record<ArbitrageType, number>,
      byPriority: {} as Record<ArbitragePriority, number>,
      avgExecutionRate: 0,
      totalPotentialImpact: {
        returnImprovement: 0,
        taxSavings: 0,
        feeReduction: 0,
      },
    }

    const types: ArbitrageType[] = [
      'REBALANCING',
      'OPTIMISATION_FISCALE',
      'DIVERSIFICATION',
      'LIQUIDITY',
      'YIELD_ENHANCEMENT',
      'RISK_REDUCTION',
      'COST_OPTIMIZATION',
    ]

    for (const type of types) {
      stats.byType[type] = suggestions.filter(s => s.type === type).length
    }

    const priorities: ArbitragePriority[] = ['BASSE', 'MOYENNE', 'HAUTE', 'URGENTE']
    for (const priority of priorities) {
      stats.byPriority[priority] = suggestions.filter(s => s.priority === priority).length
    }

    for (const suggestion of suggestions) {
      if (suggestion.expectedImpact.returnImprovement) {
        stats.totalPotentialImpact.returnImprovement += suggestion.expectedImpact.returnImprovement
      }
      if (suggestion.expectedImpact.taxSavings) {
        stats.totalPotentialImpact.taxSavings += suggestion.expectedImpact.taxSavings
      }
      if (suggestion.expectedImpact.feeReduction) {
        stats.totalPotentialImpact.feeReduction += suggestion.expectedImpact.feeReduction
      }
    }

    const executed = stats.byExecuted
    const total = stats.byExecuted + stats.byRejected
    stats.avgExecutionRate = total > 0 ? (executed / total) * 100 : 0

    return stats
  }

  private buildEmptyStats(): ArbitrageStats {
    return {
      totalSuggestions: 0,
      bySuggested: 0,
      byAccepted: 0,
      byRejected: 0,
      byExecuted: 0,
      byType: {
        REBALANCING: 0,
        OPTIMISATION_FISCALE: 0,
        DIVERSIFICATION: 0,
        LIQUIDITY: 0,
        YIELD_ENHANCEMENT: 0,
        RISK_REDUCTION: 0,
        COST_OPTIMIZATION: 0,
      },
      byPriority: {
        BASSE: 0,
        MOYENNE: 0,
        HAUTE: 0,
        URGENTE: 0,
      },
      avgExecutionRate: 0,
      totalPotentialImpact: {
        returnImprovement: 0,
        taxSavings: 0,
        feeReduction: 0,
      },
    }
  }
}
