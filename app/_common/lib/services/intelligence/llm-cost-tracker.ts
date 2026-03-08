/**
 * LLM Cost Tracker — Suivi tokens/coûts par utilisateur et cabinet
 * 
 * Inspiré par OpenClaw LLM Usage and Cost Tracking Prompt #12
 * Adapté au CRM AURA avec modèle SaaS multi-cabinet.
 * 
 * Composants :
 *   1. Call Logger — Log chaque appel LLM (fire-and-forget)
 *   2. Cost Estimator — Estimation coût par modèle/provider
 *   3. Usage Dashboard — Agrégation par période, modèle, utilisateur
 *   4. Budget Alerts — Alertes quand seuils de consommation atteints
 *   5. Quotas — Limites par cabinet/utilisateur
 */

import { getPrismaClient } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'

// ============================================================================
// TYPES
// ============================================================================

export interface LLMCallLog {
  provider: string
  model: string
  tokensInput: number
  tokensOutput: number
  totalTokens: number
  durationMs: number
  estimatedCost: number       // En centimes d'euro
  taskType: string            // 'chat', 'tool_call', 'analysis', 'summary', etc.
  status: 'success' | 'error' | 'timeout'
  cabinetId: string
  userId: string
  sessionId?: string
  correlationId?: string
}

export interface CostEstimate {
  model: string
  inputCostPer1k: number      // Centimes par 1K tokens input
  outputCostPer1k: number     // Centimes par 1K tokens output
}

export interface UsageReport {
  period: { start: Date; end: Date }
  totalCalls: number
  totalTokensInput: number
  totalTokensOutput: number
  totalTokens: number
  totalCostCents: number
  totalCostEuros: number
  byModel: { model: string; calls: number; tokens: number; costCents: number }[]
  byTaskType: { taskType: string; calls: number; tokens: number; costCents: number }[]
  byUser: { userId: string; calls: number; tokens: number; costCents: number }[]
  dailyTrend: { date: string; calls: number; tokens: number; costCents: number }[]
}

export interface BudgetAlert {
  type: 'warning' | 'critical' | 'exceeded'
  message: string
  currentUsage: number        // En centimes
  limit: number               // En centimes
  percentUsed: number
}

export interface QuotaConfig {
  cabinetMonthlyLimitCents: number
  userDailyLimitCents: number
  alertThresholds: number[]   // e.g. [70, 90, 100]
}

// ============================================================================
// PRICING — Tarification par modèle (centimes d'euro / 1K tokens)
// ============================================================================

const MODEL_PRICING: Record<string, CostEstimate> = {
  'gpt-4o': { model: 'gpt-4o', inputCostPer1k: 0.25, outputCostPer1k: 1.0 },
  'gpt-4o-mini': { model: 'gpt-4o-mini', inputCostPer1k: 0.015, outputCostPer1k: 0.06 },
  'gpt-4-turbo': { model: 'gpt-4-turbo', inputCostPer1k: 1.0, outputCostPer1k: 3.0 },
  'gpt-3.5-turbo': { model: 'gpt-3.5-turbo', inputCostPer1k: 0.05, outputCostPer1k: 0.15 },
  'claude-3-5-sonnet': { model: 'claude-3-5-sonnet', inputCostPer1k: 0.3, outputCostPer1k: 1.5 },
  'claude-3-haiku': { model: 'claude-3-haiku', inputCostPer1k: 0.025, outputCostPer1k: 0.125 },
  'mistral-large': { model: 'mistral-large', inputCostPer1k: 0.2, outputCostPer1k: 0.6 },
  'mistral-small': { model: 'mistral-small', inputCostPer1k: 0.02, outputCostPer1k: 0.06 },
  'groq-llama-70b': { model: 'groq-llama-70b', inputCostPer1k: 0.059, outputCostPer1k: 0.079 },
  'groq-llama-8b': { model: 'groq-llama-8b', inputCostPer1k: 0.005, outputCostPer1k: 0.008 },
}

// Default pricing for unknown models
const DEFAULT_PRICING: CostEstimate = { model: 'unknown', inputCostPer1k: 0.1, outputCostPer1k: 0.3 }

// Default quota config
const DEFAULT_QUOTA: QuotaConfig = {
  cabinetMonthlyLimitCents: 5000,   // 50€/mois par cabinet
  userDailyLimitCents: 200,          // 2€/jour par utilisateur
  alertThresholds: [70, 90, 100],
}

// ============================================================================
// LLM COST TRACKER
// ============================================================================

export class LLMCostTracker {
  private cabinetId: string
  private userId: string

  constructor(cabinetId: string, userId: string) {
    this.cabinetId = cabinetId
    this.userId = userId
  }

  private get prisma() {
    return getPrismaClient(this.cabinetId)
  }

  // ============================================================================
  // 1. COST ESTIMATOR
  // ============================================================================

  /**
   * Estimer le coût d'un appel LLM avant exécution
   */
  static estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = MODEL_PRICING[model] || DEFAULT_PRICING
    const inputCost = (inputTokens / 1000) * pricing.inputCostPer1k
    const outputCost = (outputTokens / 1000) * pricing.outputCostPer1k
    return Math.round((inputCost + outputCost) * 100) / 100 // Centimes, 2 décimales
  }

  /**
   * Estimer le nombre de tokens à partir du texte (approximation)
   */
  static estimateTokensFromText(text: string): number {
    // Approximation: 1 token ≈ 4 caractères en français
    return Math.ceil(text.length / 4)
  }

  // ============================================================================
  // 2. CALL LOGGER (fire-and-forget)
  // ============================================================================

  /**
   * Logger un appel LLM dans la base (fire-and-forget, ne bloque jamais)
   */
  async logCall(call: Omit<LLMCallLog, 'cabinetId' | 'userId'>): Promise<void> {
    try {
      const now = new Date()
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const role = call.taskType || 'orchestrator'

      // Upsert: accumulate tokens for this role/user/period
      await this.prisma.auraTokenUsage.upsert({
        where: {
          role_cabinetId_userId_period: {
            role,
            cabinetId: this.cabinetId,
            userId: this.userId,
            period,
          },
        },
        create: {
          role,
          cabinetId: this.cabinetId,
          userId: this.userId,
          period,
          tokensUsed: call.totalTokens,
          sttMinutesUsed: 0,
        },
        update: {
          tokensUsed: { increment: call.totalTokens },
        },
      })
    } catch (err) {
      // Fire-and-forget: log but don't throw
      logger.warn('[LLMCostTracker] Failed to log call:', { error: err instanceof Error ? err.message : String(err) })
    }
  }

  // ============================================================================
  // 3. USAGE DASHBOARD
  // ============================================================================

  /**
   * Rapport d'utilisation pour une période donnée
   */
  async getUsageReport(startDate: Date, endDate: Date): Promise<UsageReport> {
    const usages = await this.prisma.auraTokenUsage.findMany({
      where: {
        cabinetId: this.cabinetId,
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { createdAt: 'asc' },
    })

    let totalTokensInput = 0
    let totalTokensOutput = 0
    let totalCostCents = 0

    const byModel = new Map<string, { calls: number; tokens: number; costCents: number }>()
    const byTaskType = new Map<string, { calls: number; tokens: number; costCents: number }>()
    const byUser = new Map<string, { calls: number; tokens: number; costCents: number }>()
    const byDay = new Map<string, { calls: number; tokens: number; costCents: number }>()

    for (const u of usages) {
      const total = u.tokensUsed || 0
      // Estimate cost from tokens (average pricing)
      const cost = Math.round((total / 1000) * 0.15 * 100) / 100 // ~$0.15/1K tokens average

      totalTokensInput += Math.round(total * 0.4) // Estimate 40% input
      totalTokensOutput += Math.round(total * 0.6) // Estimate 60% output
      totalCostCents += cost

      // By model (use role as proxy)
      const modelKey = u.role || 'unknown'
      const modelEntry = byModel.get(modelKey) || { calls: 0, tokens: 0, costCents: 0 }
      modelEntry.calls++
      modelEntry.tokens += total
      modelEntry.costCents += cost
      byModel.set(modelKey, modelEntry)

      // By task type (use role as proxy)
      const taskKey = u.role || 'unknown'
      const taskEntry = byTaskType.get(taskKey) || { calls: 0, tokens: 0, costCents: 0 }
      taskEntry.calls++
      taskEntry.tokens += total
      taskEntry.costCents += cost
      byTaskType.set(taskKey, taskEntry)

      // By user
      const userEntry = byUser.get(u.userId) || { calls: 0, tokens: 0, costCents: 0 }
      userEntry.calls++
      userEntry.tokens += total
      userEntry.costCents += cost
      byUser.set(u.userId, userEntry)

      // By day
      const dayKey = new Date(u.createdAt).toISOString().slice(0, 10)
      const dayEntry = byDay.get(dayKey) || { calls: 0, tokens: 0, costCents: 0 }
      dayEntry.calls++
      dayEntry.tokens += total
      dayEntry.costCents += cost
      byDay.set(dayKey, dayEntry)
    }

    return {
      period: { start: startDate, end: endDate },
      totalCalls: usages.length,
      totalTokensInput,
      totalTokensOutput,
      totalTokens: totalTokensInput + totalTokensOutput,
      totalCostCents: Math.round(totalCostCents),
      totalCostEuros: Math.round(totalCostCents) / 100,
      byModel: [...byModel.entries()].map(([model, d]) => ({ model, ...d })).sort((a, b) => b.costCents - a.costCents),
      byTaskType: [...byTaskType.entries()].map(([taskType, d]) => ({ taskType, ...d })).sort((a, b) => b.costCents - a.costCents),
      byUser: [...byUser.entries()].map(([userId, d]) => ({ userId, ...d })).sort((a, b) => b.costCents - a.costCents),
      dailyTrend: [...byDay.entries()].map(([date, d]) => ({ date, ...d })).sort((a, b) => a.date.localeCompare(b.date)),
    }
  }

  /**
   * Usage du mois en cours (raccourci)
   */
  async getCurrentMonthUsage(): Promise<UsageReport> {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    return this.getUsageReport(startOfMonth, endOfMonth)
  }

  // ============================================================================
  // 4. BUDGET ALERTS
  // ============================================================================

  /**
   * Vérifier les alertes budgétaires
   */
  async checkBudgetAlerts(quota?: Partial<QuotaConfig>): Promise<BudgetAlert[]> {
    const config = { ...DEFAULT_QUOTA, ...quota }
    const alerts: BudgetAlert[] = []

    // Monthly cabinet limit
    const monthlyUsage = await this.getCurrentMonthUsage()
    const monthlyPct = Math.round((monthlyUsage.totalCostCents / config.cabinetMonthlyLimitCents) * 100)

    for (const threshold of config.alertThresholds) {
      if (monthlyPct >= threshold) {
        let type: BudgetAlert['type']
        if (threshold >= 100) type = 'exceeded'
        else if (threshold >= 90) type = 'critical'
        else type = 'warning'

        alerts.push({
          type,
          message: threshold >= 100
            ? `Budget mensuel IA dépassé: ${monthlyUsage.totalCostEuros}€ / ${config.cabinetMonthlyLimitCents / 100}€`
            : `Budget mensuel IA à ${monthlyPct}%: ${monthlyUsage.totalCostEuros}€ / ${config.cabinetMonthlyLimitCents / 100}€`,
          currentUsage: monthlyUsage.totalCostCents,
          limit: config.cabinetMonthlyLimitCents,
          percentUsed: monthlyPct,
        })
        break // Only the highest triggered threshold
      }
    }

    // Daily user limit
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    const dailyUsage = await this.getUsageReport(startOfDay, endOfDay)

    const userDailyUsage = dailyUsage.byUser.find(u => u.userId === this.userId)
    if (userDailyUsage) {
      const dailyPct = Math.round((userDailyUsage.costCents / config.userDailyLimitCents) * 100)
      if (dailyPct >= 90) {
        alerts.push({
          type: dailyPct >= 100 ? 'exceeded' : 'critical',
          message: `Limite quotidienne IA utilisateur à ${dailyPct}%`,
          currentUsage: userDailyUsage.costCents,
          limit: config.userDailyLimitCents,
          percentUsed: dailyPct,
        })
      }
    }

    return alerts
  }

  /**
   * Vérifier si un appel LLM est autorisé (quota non dépassé)
   */
  async canMakeCall(estimatedCostCents: number, quota?: Partial<QuotaConfig>): Promise<{ allowed: boolean; reason?: string }> {
    const config = { ...DEFAULT_QUOTA, ...quota }

    // Check monthly cabinet limit
    const monthlyUsage = await this.getCurrentMonthUsage()
    if (monthlyUsage.totalCostCents + estimatedCostCents > config.cabinetMonthlyLimitCents * 1.1) {
      return { allowed: false, reason: `Budget mensuel cabinet dépassé (${monthlyUsage.totalCostEuros}€/${config.cabinetMonthlyLimitCents / 100}€)` }
    }

    // Check daily user limit
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    const dailyUsage = await this.getUsageReport(startOfDay, endOfDay)
    const userDaily = dailyUsage.byUser.find(u => u.userId === this.userId)
    if (userDaily && userDaily.costCents + estimatedCostCents > config.userDailyLimitCents * 1.1) {
      return { allowed: false, reason: `Limite quotidienne utilisateur atteinte` }
    }

    return { allowed: true }
  }
}
