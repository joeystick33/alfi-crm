// ============================================================================
// AURA — Multi-Model Router (v2 — OpenAI + Mistral, sans Ollama)
//
// Route les appels LLM vers le bon modèle selon le rôle fonctionnel :
//   • Orchestrator → OpenAI GPT-4o-mini  (OPENAI_API_KEY)
//   • Subagent     → Mistral Small        (MISTRAL_API_KEY)
//
// Fallback : si le provider primaire échoue, tente l'autre.
// Respecte les caps de tokens stricts (spec §11.1).
// ============================================================================

import {
  type AuraModelRole,
  type AuraTaskType,
  type AuraProvider,
  getModelRoleForTask,
  getMaxOutputTokens,
  RATE_LIMITS,
} from './aura-config'
import { trackTokenUsage, isQuotaExceeded } from './aura-budget'
import { logger } from '@/app/_common/lib/logger'

// ── CONFIGURATION PROVIDERS ────────────────────────────────────────────────

const PROVIDERS = {
  openai: {
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    model: process.env.AURA_ORCHESTRATOR_MODEL || 'gpt-4o-mini',
    get apiKey() { return process.env.OPENAI_API_KEY },
    timeout: 30_000,
    defaultTemperature: 0.3,
    maxInputTokens: 20_000,
  },
  mistral: {
    apiUrl: 'https://api.mistral.ai/v1/chat/completions',
    model: process.env.AURA_SUBAGENT_MODEL || 'mistral-small-latest',
    get apiKey() { return process.env.MISTRAL_API_KEY },
    timeout: 20_000,
    defaultTemperature: 0.2,
    maxInputTokens: 8_000,
  },
} as const

type LiveProvider = 'openai' | 'mistral'

// ── TYPES ──────────────────────────────────────────────────────────────────

export interface AuraLLMRequest {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  task: AuraTaskType
  /** Override du rôle si nécessaire */
  roleOverride?: AuraModelRole
  /** Contexte pour sélectionner le bon cap de tokens */
  outputContext?: string
  temperature?: number
  maxTokens?: number
  cabinetId?: string
  userId?: string
  stream?: boolean
}

export interface AuraLLMResponse {
  content: string
  provider: AuraProvider
  model: string
  role: AuraModelRole
  inputTokensEstimated: number
  outputTokensEstimated: number
  latencyMs: number
  quotaWarning?: boolean
}

export interface AuraStreamResponse {
  stream: ReadableStream<Uint8Array>
  provider: AuraProvider
  model: string
  role: AuraModelRole
}

// ── ERREURS CONSÉCUTIVES ────────────────────────────────────────────────────

const _g = globalThis as unknown as { _auraConsecErrors?: number }

function incrementErrors(): number {
  _g._auraConsecErrors = (_g._auraConsecErrors || 0) + 1
  return _g._auraConsecErrors
}
function resetErrors(): void { _g._auraConsecErrors = 0 }

// ── RÉSOLUTION DU PROVIDER ─────────────────────────────────────────────────

function resolveProvider(role: AuraModelRole): { liveProvider: LiveProvider; cfg: typeof PROVIDERS[LiveProvider] } {
  // orchestrator → OpenAI, subagent → Mistral
  const primary: LiveProvider = role === 'orchestrator' ? 'openai' : 'mistral'
  const fallback: LiveProvider = primary === 'openai' ? 'mistral' : 'openai'

  if (PROVIDERS[primary].apiKey) {
    return { liveProvider: primary, cfg: PROVIDERS[primary] }
  }
  if (PROVIDERS[fallback].apiKey) {
    logger.warn(`[AURA] Clé ${primary} manquante, fallback vers ${fallback}`, { module: 'aura-models' })
    return { liveProvider: fallback, cfg: PROVIDERS[fallback] }
  }
  throw new Error('[AURA] Aucune clé API configurée. Ajoutez OPENAI_API_KEY et/ou MISTRAL_API_KEY dans .env.local')
}

// ── POINT D'ENTRÉE PRINCIPAL ────────────────────────────────────────────────

export async function callAuraLLM(request: AuraLLMRequest): Promise<AuraLLMResponse> {
  const startTime = Date.now()
  const role = request.roleOverride || getModelRoleForTask(request.task)
  const { liveProvider, cfg } = resolveProvider(role)

  // Vérifier le quota mensuel
  if (request.cabinetId && request.userId) {
    const exceeded = await isQuotaExceeded(role, request.cabinetId, request.userId)
    if (exceeded) {
      logger.warn(`[AURA] Quota mensuel dépassé pour ${role}`, { module: 'aura-models', action: 'quota_check' })
      request.maxTokens = Math.min(request.maxTokens || 200, 200)
    }
  }

  const maxOutput = request.maxTokens || getMaxOutputTokens(role, request.outputContext)
  const temperature = request.temperature ?? cfg.defaultTemperature

  // Tronquer l'input si nécessaire
  const inputText = request.messages.map(m => m.content).join(' ')
  const estimatedInputTokens = Math.ceil(inputText.length / 4)
  if (estimatedInputTokens > cfg.maxInputTokens) {
    logger.warn(`[AURA] Input tronqué (${estimatedInputTokens} > ${cfg.maxInputTokens})`, { module: 'aura-models' })
    request.messages = truncateMessages(request.messages, cfg.maxInputTokens)
  }

  // Appel LLM
  let content: string
  try {
    content = await callOpenAICompat(cfg.apiUrl, cfg.apiKey!, cfg.model, request.messages, maxOutput, temperature, cfg.timeout)
    resetErrors()
  } catch (error) {
    const errorCount = incrementErrors()
    if (errorCount >= RATE_LIMITS.maxConsecutiveToolErrors) {
      logger.error(`[AURA] ${errorCount} erreurs consécutives — STOP + RE-PLAN`, { module: 'aura-models' })
      resetErrors()
      throw new Error(`[AURA] ${errorCount} erreurs consécutives. Re-planification nécessaire.`)
    }
    throw error
  }

  const outputTokensEstimated = Math.ceil(content.length / 4)

  // Tracker l'usage
  if (request.cabinetId && request.userId) {
    await trackTokenUsage(role, request.cabinetId, request.userId, estimatedInputTokens + outputTokensEstimated).catch(() => {
      logger.warn('[AURA] Failed to track token usage', { module: 'aura-models' })
    })
  }

  return {
    content,
    provider: liveProvider as AuraProvider,
    model: cfg.model,
    role,
    inputTokensEstimated: estimatedInputTokens,
    outputTokensEstimated,
    latencyMs: Date.now() - startTime,
  }
}

export async function callAuraLLMStream(request: AuraLLMRequest): Promise<AuraStreamResponse> {
  const role = request.roleOverride || getModelRoleForTask(request.task)
  const { liveProvider, cfg } = resolveProvider(role)

  const maxOutput = request.maxTokens || getMaxOutputTokens(role, request.outputContext)
  const temperature = request.temperature ?? cfg.defaultTemperature

  const stream = await callOpenAICompatStream(cfg.apiUrl, cfg.apiKey!, cfg.model, request.messages, maxOutput, temperature, cfg.timeout)

  return { stream, provider: liveProvider as AuraProvider, model: cfg.model, role }
}

// ── APPELS HTTP OPENAI-COMPAT ──────────────────────────────────────────────
// OpenAI et Mistral partagent exactement le même format d'API

async function callOpenAICompat(
  apiUrl: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  temperature: number,
  timeout: number,
): Promise<string> {
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
    signal: AbortSignal.timeout(timeout),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`[AURA] ${model} ${res.status}: ${body.slice(0, 200)}`)
  }
  const data = await res.json()
  return data?.choices?.[0]?.message?.content || ''
}

async function callOpenAICompatStream(
  apiUrl: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
  temperature: number,
  timeout: number,
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens, stream: true }),
    signal: AbortSignal.timeout(timeout),
  })
  if (!res.ok || !res.body) throw new Error(`[AURA] Stream ${model} ${res.status}`)

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  return res.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const text = decoder.decode(chunk, { stream: true })
        for (const line of text.split('\n').filter(l => l.startsWith('data: '))) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
            return
          }
          try {
            const token = JSON.parse(data)?.choices?.[0]?.delta?.content || ''
            if (token) controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`))
          } catch { /* skip malformed */ }
        }
      },
    }),
  )
}

// ── UTILITAIRES ────────────────────────────────────────────────────────────

/**
 * Tronque les messages pour respecter le cap de tokens d'input.
 * Garde toujours : premier system message + dernier user message.
 * Supprime les messages intermédiaires (historique) en commençant par les plus anciens.
 */
function truncateMessages(
  messages: Array<{ role: string; content: string }>,
  maxTokens: number,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  // Séparer system, historique, et dernier user
  const systemMsgs = messages.filter(m => m.role === 'system')
  const lastUser = [...messages].reverse().find(m => m.role === 'user')
  const middle = messages.filter(m => m !== systemMsgs[0] && m !== lastUser)

  // Estimer les tokens fixes
  const fixedTokens = [...systemMsgs, lastUser].filter(Boolean).reduce(
    (sum, m) => sum + Math.ceil((m?.content.length || 0) / 4), 0
  )

  const budgetForMiddle = maxTokens - fixedTokens
  if (budgetForMiddle <= 0) {
    // Pas de place pour l'historique — garder system + user tronqué
    const result: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = []
    if (systemMsgs[0]) {
      result.push({
        role: systemMsgs[0].role as 'system',
        content: systemMsgs[0].content.slice(0, maxTokens * 3),
      })
    }
    if (lastUser) {
      result.push({
        role: 'user',
        content: lastUser.content.slice(0, maxTokens * 2),
      })
    }
    return result
  }

  // Garder les messages les plus récents qui tiennent dans le budget
  const kept: Array<{ role: string; content: string }> = []
  let usedTokens = 0
  for (let i = middle.length - 1; i >= 0; i--) {
    const tokens = Math.ceil(middle[i].content.length / 4)
    if (usedTokens + tokens > budgetForMiddle) break
    kept.unshift(middle[i])
    usedTokens += tokens
  }

  const result: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = []
  for (const m of systemMsgs) result.push({ role: m.role as 'system', content: m.content })
  for (const m of kept) result.push({ role: m.role as 'system' | 'user' | 'assistant', content: m.content })
  if (lastUser) result.push({ role: 'user', content: lastUser.content })

  return result
}
