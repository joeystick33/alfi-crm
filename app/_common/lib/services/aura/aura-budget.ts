// ============================================================================
// AURA — Token Budget Tracker
//
// Suivi et enforcement des quotas de tokens par rôle modèle (spec §11).
// Stockage en DB via Prisma (AuraTokenUsage table) pour persistance
// avec fallback in-memory quand la DB est inaccessible.
//
// Quotas mensuels par conseiller (spec §11.4) :
//   • Orchestrator (GPT) : 1M tokens/mois
//   • Subagent (Mistral) : 5M tokens/mois
//   • STT : 1200 minutes/mois
//
// Comportement à l'approche des caps (§11.4) :
//   • Switch to SHORT MODE
//   • Disable non-essential background jobs
//   • Defer heavy tasks to batch
//   • NEVER degrade correctness
// ============================================================================

import { type AuraModelRole, MONTHLY_QUOTAS } from './aura-config'
import { logger } from '@/app/_common/lib/logger'

// ── TYPES ──────────────────────────────────────────────────────────────────

export interface TokenUsageSummary {
  role: AuraModelRole
  cabinetId: string
  userId: string
  /** Tokens consommés ce mois */
  tokensUsed: number
  /** Minutes STT consommées ce mois */
  sttMinutesUsed: number
  /** Quota max tokens */
  tokensQuota: number
  /** Quota max STT minutes */
  sttMinutesQuota: number
  /** Pourcentage de consommation tokens (0-100) */
  tokensPercent: number
  /** Pourcentage de consommation STT (0-100) */
  sttPercent: number
  /** true si quota dépassé ou proche (>90%) */
  warning: boolean
  /** true si quota strictement dépassé */
  exceeded: boolean
  /** Mois courant (YYYY-MM) */
  period: string
}

export interface BudgetStatus {
  orchestrator: TokenUsageSummary
  subagent: TokenUsageSummary
  stt: TokenUsageSummary
  /** Mode dégradé actif (SHORT MODE) */
  shortMode: boolean
  /** Actions désactivées */
  disabledFeatures: string[]
}

// ── IN-MEMORY FALLBACK ─────────────────────────────────────────────────────

/**
 * Fallback en mémoire quand la DB est inaccessible.
 * Réinitialisé au redémarrage du serveur.
 * Structure: Map<`${role}:${cabinetId}:${userId}:${period}`, tokens>
 */
const memoryUsage = new Map<string, { tokens: number; sttMinutes: number }>()

function getCurrentPeriod(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getUsageKey(role: AuraModelRole, cabinetId: string, userId: string): string {
  return `${role}:${cabinetId}:${userId}:${getCurrentPeriod()}`
}

// ── TRACK USAGE ────────────────────────────────────────────────────────────

/**
 * Enregistre des tokens consommés.
 * Tente d'écrire en DB, sinon fallback in-memory.
 */
export async function trackTokenUsage(
  role: AuraModelRole,
  cabinetId: string,
  userId: string,
  tokens: number,
  sttMinutes: number = 0,
): Promise<void> {
  const key = getUsageKey(role, cabinetId, userId)
  const period = getCurrentPeriod()

  // Toujours mettre à jour le fallback mémoire
  const current = memoryUsage.get(key) || { tokens: 0, sttMinutes: 0 }
  current.tokens += tokens
  current.sttMinutes += sttMinutes
  memoryUsage.set(key, current)

  // Tenter la persistance en DB
  try {
    const { prisma } = await import('../../prisma')
    await prisma.auraTokenUsage.upsert({
      where: {
        role_cabinetId_userId_period: {
          role,
          cabinetId,
          userId,
          period,
        },
      },
      create: {
        role,
        cabinetId,
        userId,
        period,
        tokensUsed: tokens,
        sttMinutesUsed: sttMinutes,
      },
      update: {
        tokensUsed: { increment: tokens },
        sttMinutesUsed: { increment: sttMinutes },
      },
    })
  } catch {
    // DB inaccessible — le fallback mémoire est déjà à jour
    logger.warn('[AURA Budget] DB write failed, using in-memory fallback', { module: 'aura-budget' })
  }
}

/**
 * Récupère l'usage courant pour un rôle/cabinet/user.
 */
export async function getTokenUsage(
  role: AuraModelRole,
  cabinetId: string,
  userId: string,
): Promise<{ tokens: number; sttMinutes: number }> {
  const period = getCurrentPeriod()

  try {
    const { prisma } = await import('../../prisma')
    const record = await prisma.auraTokenUsage.findUnique({
      where: {
        role_cabinetId_userId_period: {
          role,
          cabinetId,
          userId,
          period,
        },
      },
    })
    if (record) {
      return { tokens: record.tokensUsed, sttMinutes: record.sttMinutesUsed }
    }
  } catch {
    // Fallback mémoire
  }

  const key = getUsageKey(role, cabinetId, userId)
  return memoryUsage.get(key) || { tokens: 0, sttMinutes: 0 }
}

// ── QUOTA CHECK ────────────────────────────────────────────────────────────

/**
 * Vérifie si le quota mensuel est dépassé pour un rôle.
 */
export async function isQuotaExceeded(
  role: AuraModelRole,
  cabinetId: string,
  userId: string,
): Promise<boolean> {
  const usage = await getTokenUsage(role, cabinetId, userId)
  const quota = MONTHLY_QUOTAS[role]

  if (role === 'stt') {
    return usage.sttMinutes >= (quota.sttMinutes || Infinity)
  }
  return usage.tokens >= quota.tokens
}

/**
 * Vérifie si le quota approche (>90%) pour un rôle.
 */
export async function isQuotaNearLimit(
  role: AuraModelRole,
  cabinetId: string,
  userId: string,
): Promise<boolean> {
  const usage = await getTokenUsage(role, cabinetId, userId)
  const quota = MONTHLY_QUOTAS[role]

  if (role === 'stt') {
    return usage.sttMinutes >= (quota.sttMinutes || Infinity) * 0.9
  }
  return usage.tokens >= quota.tokens * 0.9
}

// ── BUDGET STATUS ──────────────────────────────────────────────────────────

/**
 * Retourne le statut budgétaire complet pour un cabinet/user.
 * Inclut les informations de mode dégradé (SHORT MODE).
 */
export async function getBudgetStatus(
  cabinetId: string,
  userId: string,
): Promise<BudgetStatus> {
  const roles: AuraModelRole[] = ['orchestrator', 'subagent', 'stt']
  const period = getCurrentPeriod()

  const summaries: Record<string, TokenUsageSummary> = {}

  for (const role of roles) {
    const usage = await getTokenUsage(role, cabinetId, userId)
    const quota = MONTHLY_QUOTAS[role]

    const tokensPercent = quota.tokens > 0 ? Math.round((usage.tokens / quota.tokens) * 100) : 0
    const sttPercent = quota.sttMinutes ? Math.round((usage.sttMinutes / quota.sttMinutes) * 100) : 0

    summaries[role] = {
      role,
      cabinetId,
      userId,
      tokensUsed: usage.tokens,
      sttMinutesUsed: usage.sttMinutes,
      tokensQuota: quota.tokens,
      sttMinutesQuota: quota.sttMinutes || 0,
      tokensPercent,
      sttPercent,
      warning: tokensPercent >= 90 || sttPercent >= 90,
      exceeded: tokensPercent >= 100 || sttPercent >= 100,
      period,
    }
  }

  // Déterminer le SHORT MODE et les features désactivées (spec §11.4)
  const anyNearLimit = Object.values(summaries).some(s => s.warning)
  const anyExceeded = Object.values(summaries).some(s => s.exceeded)

  const disabledFeatures: string[] = []
  if (anyNearLimit) {
    disabledFeatures.push('background_opportunity_detection')
    disabledFeatures.push('proactive_analysis')
  }
  if (anyExceeded) {
    disabledFeatures.push('background_monitoring')
    disabledFeatures.push('auto_enrichment')
    disabledFeatures.push('heavy_synthesis')
  }

  return {
    orchestrator: summaries.orchestrator,
    subagent: summaries.subagent,
    stt: summaries.stt,
    shortMode: anyNearLimit,
    disabledFeatures,
  }
}

/**
 * Détermine le cap de tokens effectif en tenant compte du mode dégradé.
 * En SHORT MODE, réduit les tokens mais JAMAIS la correctness (spec §11.4).
 */
export async function getEffectiveMaxTokens(
  role: AuraModelRole,
  baseMax: number,
  cabinetId: string,
  userId: string,
): Promise<number> {
  const nearLimit = await isQuotaNearLimit(role, cabinetId, userId)
  if (!nearLimit) return baseMax

  const exceeded = await isQuotaExceeded(role, cabinetId, userId)
  if (exceeded) {
    // Mode très dégradé : minimum absolu
    return Math.min(baseMax, 150)
  }

  // Mode dégradé : réduire de 40%
  return Math.max(Math.round(baseMax * 0.6), 100)
}
