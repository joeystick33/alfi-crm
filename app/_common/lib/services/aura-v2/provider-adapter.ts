/**
 * AURA V2 — Provider Adapter Layer
 * 
 * Abstraction multi-provider pour les appels LLM.
 * Gère : OpenAI, Anthropic, Mistral, Groq, Azure OpenAI, Google Vertex, Cohere.
 * 
 * Fonctionnalités :
 * - Résolution de connexion par cabinet (OAuth tokens déchiffrés)
 * - Fallback automatique entre providers
 * - Rate limiting par cabinet
 * - Token tracking et costing
 * - Health checks
 * - Streaming natif
 * 
 * Principe : Le backend est la seule source de vérité.
 * Le LLM orchestre, ne calcule jamais, n'invente jamais.
 */

import type {
  AIProviderType,
  ProviderConfig,
  ProviderModel,
  LLMRequest,
  LLMResponse,
  LLMStreamChunk,
  AgentContext,
} from './types'
import { decryptToken, maskSensitive } from './encryption'
import { getPrismaClient } from '../../prisma'

// ============================================================================
// PROVIDER REGISTRY — Configuration statique des providers
// ============================================================================

export const PROVIDER_REGISTRY: Record<AIProviderType, ProviderConfig> = {
  OPENAI: {
    provider: 'OPENAI',
    apiUrl: 'https://api.openai.com/v1',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    maxContextWindow: 1_000_000,
    models: [
      {
        id: 'gpt-4.1',
        name: 'GPT-4.1',
        maxInputTokens: 1_000_000,
        maxOutputTokens: 32_768,
        costPer1kInput: 0.002,
        costPer1kOutput: 0.008,
        capabilities: ['chat', 'streaming', 'structured_output', 'function_calling', 'vision', 'long_context'],
        recommended: true,
      },
      {
        id: 'gpt-4.1-mini',
        name: 'GPT-4.1 Mini',
        maxInputTokens: 1_000_000,
        maxOutputTokens: 32_768,
        costPer1kInput: 0.0004,
        costPer1kOutput: 0.0016,
        capabilities: ['chat', 'streaming', 'structured_output', 'function_calling', 'vision', 'long_context'],
        recommended: true,
      },
      {
        id: 'gpt-4.1-nano',
        name: 'GPT-4.1 Nano',
        maxInputTokens: 1_000_000,
        maxOutputTokens: 32_768,
        costPer1kInput: 0.0001,
        costPer1kOutput: 0.0004,
        capabilities: ['chat', 'streaming', 'structured_output', 'function_calling', 'long_context'],
        recommended: false,
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        maxInputTokens: 128_000,
        maxOutputTokens: 16_384,
        costPer1kInput: 0.0025,
        costPer1kOutput: 0.01,
        capabilities: ['chat', 'streaming', 'structured_output', 'function_calling', 'vision', 'long_context'],
        recommended: false,
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        maxInputTokens: 128_000,
        maxOutputTokens: 16_384,
        costPer1kInput: 0.00015,
        costPer1kOutput: 0.0006,
        capabilities: ['chat', 'streaming', 'structured_output', 'function_calling', 'vision', 'long_context'],
        recommended: false,
      },
      {
        id: 'o4-mini',
        name: 'O4 Mini (Reasoning)',
        maxInputTokens: 200_000,
        maxOutputTokens: 100_000,
        costPer1kInput: 0.0011,
        costPer1kOutput: 0.0044,
        capabilities: ['chat', 'reasoning', 'function_calling', 'long_context'],
        recommended: false,
      },
      {
        id: 'o3-mini',
        name: 'O3 Mini (Reasoning)',
        maxInputTokens: 200_000,
        maxOutputTokens: 100_000,
        costPer1kInput: 0.0011,
        costPer1kOutput: 0.0044,
        capabilities: ['chat', 'reasoning', 'function_calling', 'long_context'],
        recommended: false,
      },
    ],
    oauthConfig: {
      authorizationUrl: 'https://platform.openai.com/authorize',
      tokenUrl: 'https://api.openai.com/v1/oauth/token',
      scopes: ['model.read', 'model.request'],
      clientIdEnvVar: 'OPENAI_OAUTH_CLIENT_ID',
      clientSecretEnvVar: 'OPENAI_OAUTH_CLIENT_SECRET',
    },
  },

  ANTHROPIC: {
    provider: 'ANTHROPIC',
    apiUrl: 'https://api.anthropic.com/v1',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    maxContextWindow: 200_000,
    models: [
      {
        id: 'claude-sonnet-4-20250514',
        name: 'Claude Sonnet 4',
        maxInputTokens: 200_000,
        maxOutputTokens: 64_000,
        costPer1kInput: 0.003,
        costPer1kOutput: 0.015,
        capabilities: ['chat', 'streaming', 'structured_output', 'function_calling', 'vision', 'long_context', 'reasoning'],
        recommended: true,
      },
      {
        id: 'claude-haiku-4-20250514',
        name: 'Claude Haiku 4.5',
        maxInputTokens: 200_000,
        maxOutputTokens: 8_192,
        costPer1kInput: 0.001,
        costPer1kOutput: 0.005,
        capabilities: ['chat', 'streaming', 'structured_output', 'function_calling', 'long_context'],
        recommended: true,
      },
      {
        id: 'claude-opus-4-20250514',
        name: 'Claude Opus 4',
        maxInputTokens: 200_000,
        maxOutputTokens: 32_000,
        costPer1kInput: 0.015,
        costPer1kOutput: 0.075,
        capabilities: ['chat', 'streaming', 'structured_output', 'function_calling', 'vision', 'long_context', 'reasoning'],
        recommended: false,
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        maxInputTokens: 200_000,
        maxOutputTokens: 8_192,
        costPer1kInput: 0.00025,
        costPer1kOutput: 0.00125,
        capabilities: ['chat', 'streaming', 'structured_output', 'function_calling', 'long_context'],
        recommended: false,
      },
    ],
  },

  MISTRAL: {
    provider: 'MISTRAL',
    apiUrl: 'https://api.mistral.ai/v1',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    maxContextWindow: 128_000,
    models: [
      {
        id: 'mistral-large-latest',
        name: 'Mistral Large',
        maxInputTokens: 128_000,
        maxOutputTokens: 8_192,
        costPer1kInput: 0.002,
        costPer1kOutput: 0.006,
        capabilities: ['chat', 'streaming', 'structured_output', 'function_calling', 'long_context'],
        recommended: true,
      },
      {
        id: 'mistral-small-latest',
        name: 'Mistral Small 3.2',
        maxInputTokens: 128_000,
        maxOutputTokens: 8_192,
        costPer1kInput: 0.00006,
        costPer1kOutput: 0.00018,
        capabilities: ['chat', 'streaming', 'structured_output', 'function_calling', 'long_context'],
        recommended: true,
      },
      {
        id: 'codestral-latest',
        name: 'Codestral',
        maxInputTokens: 256_000,
        maxOutputTokens: 8_192,
        costPer1kInput: 0.0003,
        costPer1kOutput: 0.0009,
        capabilities: ['chat', 'streaming', 'function_calling', 'long_context'],
        recommended: false,
      },
    ],
  },

  GROQ: {
    provider: 'GROQ',
    apiUrl: 'https://api.groq.com/openai/v1',
    supportsStreaming: true,
    supportsStructuredOutput: false,
    maxContextWindow: 128_000,
    models: [
      {
        id: 'llama-3.3-70b-versatile',
        name: 'Llama 3.3 70B',
        maxInputTokens: 128_000,
        maxOutputTokens: 32_768,
        costPer1kInput: 0.00059,
        costPer1kOutput: 0.00079,
        capabilities: ['chat', 'streaming', 'function_calling', 'long_context'],
        recommended: true,
      },
      {
        id: 'llama-3.1-8b-instant',
        name: 'Llama 3.1 8B',
        maxInputTokens: 128_000,
        maxOutputTokens: 8_192,
        costPer1kInput: 0.00005,
        costPer1kOutput: 0.00008,
        capabilities: ['chat', 'streaming', 'function_calling'],
        recommended: false,
      },
    ],
  },

  AZURE_OPENAI: {
    provider: 'AZURE_OPENAI',
    apiUrl: '', // Configuré par cabinet
    supportsStreaming: true,
    supportsStructuredOutput: true,
    maxContextWindow: 128_000,
    models: [], // Configuré par cabinet
  },

  DEEPSEEK: {
    provider: 'DEEPSEEK',
    apiUrl: 'https://api.deepseek.com/v1',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    maxContextWindow: 128_000,
    models: [
      {
        id: 'deepseek-chat',
        name: 'DeepSeek V3',
        maxInputTokens: 128_000,
        maxOutputTokens: 8_192,
        costPer1kInput: 0.00014,
        costPer1kOutput: 0.00028,
        capabilities: ['chat', 'streaming', 'structured_output', 'function_calling', 'long_context'],
        recommended: true,
      },
      {
        id: 'deepseek-reasoner',
        name: 'DeepSeek R1 (Reasoning)',
        maxInputTokens: 128_000,
        maxOutputTokens: 8_192,
        costPer1kInput: 0.00055,
        costPer1kOutput: 0.00219,
        capabilities: ['chat', 'streaming', 'reasoning', 'function_calling', 'long_context'],
        recommended: false,
      },
    ],
  },

  GOOGLE_VERTEX: {
    provider: 'GOOGLE_VERTEX',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta',
    supportsStreaming: true,
    supportsStructuredOutput: true,
    maxContextWindow: 1_000_000,
    models: [
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        maxInputTokens: 1_000_000,
        maxOutputTokens: 8_192,
        costPer1kInput: 0.00125,
        costPer1kOutput: 0.01,
        capabilities: ['chat', 'streaming', 'structured_output', 'function_calling', 'vision', 'long_context', 'reasoning'],
        recommended: true,
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        maxInputTokens: 1_000_000,
        maxOutputTokens: 8_192,
        costPer1kInput: 0.0003,
        costPer1kOutput: 0.0025,
        capabilities: ['chat', 'streaming', 'structured_output', 'function_calling', 'vision', 'long_context'],
        recommended: true,
      },
      {
        id: 'gemini-2.0-flash',
        name: 'Gemini 2.0 Flash',
        maxInputTokens: 1_000_000,
        maxOutputTokens: 8_192,
        costPer1kInput: 0.000075,
        costPer1kOutput: 0.0003,
        capabilities: ['chat', 'streaming', 'structured_output', 'function_calling', 'vision', 'long_context'],
        recommended: false,
      },
    ],
  },

  COHERE: {
    provider: 'COHERE',
    apiUrl: 'https://api.cohere.com/v2',
    supportsStreaming: true,
    supportsStructuredOutput: false,
    maxContextWindow: 128_000,
    models: [
      {
        id: 'command-r-plus',
        name: 'Command R+',
        maxInputTokens: 128_000,
        maxOutputTokens: 4_096,
        costPer1kInput: 0.0025,
        costPer1kOutput: 0.01,
        capabilities: ['chat', 'streaming', 'function_calling', 'long_context'],
        recommended: false,
      },
    ],
  },
}

// ============================================================================
// PROVIDER ADAPTER — Classe principale
// ============================================================================

export class ProviderAdapter {
  private cabinetId: string
  private prisma: ReturnType<typeof getPrismaClient>

  constructor(cabinetId: string) {
    this.cabinetId = cabinetId
    this.prisma = getPrismaClient(cabinetId, false)
  }

  // ── Résolution de connexion ──

  /**
   * Résout la connexion active pour un provider donné.
   * Déchiffre les tokens OAuth et vérifie la validité.
   */
  async resolveConnection(provider?: AIProviderType): Promise<ResolvedConnection | null> {
    // Si un provider spécifique est demandé
    if (provider) {
      return this.resolveSpecificConnection(provider)
    }

    // Sinon, trouver la connexion active avec le provider recommandé
    const connections = await this.prisma.aIConnection.findMany({
      where: {
        cabinetId: this.cabinetId,
        status: 'CONNECTED',
      },
      orderBy: { updatedAt: 'desc' },
    })

    for (const conn of connections) {
      const resolved = await this.tryResolveConnection(conn)
      if (resolved) return resolved
    }

    // Fallback : utiliser les clés API d'environnement (compatibilité V1)
    return this.resolveFallbackConnection()
  }

  private async resolveSpecificConnection(provider: AIProviderType): Promise<ResolvedConnection | null> {
    const conn = await this.prisma.aIConnection.findUnique({
      where: { cabinetId_provider: { cabinetId: this.cabinetId, provider: provider as import('@prisma/client').$Enums.AIProviderType } },
    })

    if (!conn || conn.status !== 'CONNECTED') {
      return this.resolveFallbackConnection(provider)
    }

    return this.tryResolveConnection(conn)
  }

  private async tryResolveConnection(conn: {
    id: string
    provider: string
    accessTokenEnc: string | null
    refreshTokenEnc: string | null
    tokenExpiresAt: Date | null
    defaultModel: string | null
    allowedModels: string[]
    consecutiveErrors: number
  }): Promise<ResolvedConnection | null> {
    if (!conn.accessTokenEnc) return null

    // Vérifier si le token est expiré
    if (conn.tokenExpiresAt && conn.tokenExpiresAt < new Date()) {
      // Tenter un refresh
      if (conn.refreshTokenEnc) {
        const refreshed = await this.refreshToken(conn.id, conn.provider as AIProviderType, conn.refreshTokenEnc)
        if (refreshed) return refreshed
      }
      // Marquer comme expiré
      await this.prisma.aIConnection.update({
        where: { id: conn.id },
        data: { status: 'EXPIRED', lastError: 'Token expiré' },
      })
      return null
    }

    // Trop d'erreurs consécutives → ne pas utiliser
    if (conn.consecutiveErrors >= 5) return null

    try {
      const apiKey = decryptToken(conn.accessTokenEnc)
      const providerType = conn.provider as AIProviderType
      const config = PROVIDER_REGISTRY[providerType]

      if (!config) return null

      const model = conn.defaultModel || config.models.find(m => m.recommended)?.id || config.models[0]?.id
      if (!model) return null

      return {
        connectionId: conn.id,
        provider: providerType,
        apiKey,
        apiUrl: config.apiUrl,
        model,
        allowedModels: conn.allowedModels.length > 0 ? conn.allowedModels : config.models.map(m => m.id),
        config,
        mode: 'byok',
      }
    } catch (error) {
      console.error(`[AURA-V2] Erreur déchiffrement token pour connexion ${conn.id}:`, error)
      return null
    }
  }

  /**
   * Fallback : utilise les clés API d'environnement (compatibilité avec le système V1).
   */
  private resolveFallbackConnection(preferredProvider?: AIProviderType): ResolvedConnection | null {
    // Ordre de préférence pour le fallback
    const fallbackOrder: Array<{ provider: AIProviderType; envVar: string }> = [
      { provider: 'OPENAI', envVar: 'OPENAI_API_KEY' },
      { provider: 'ANTHROPIC', envVar: 'ANTHROPIC_API_KEY' },
      { provider: 'DEEPSEEK', envVar: 'DEEPSEEK_API_KEY' },
      { provider: 'GOOGLE_VERTEX', envVar: 'GOOGLE_AI_API_KEY' },
      { provider: 'MISTRAL', envVar: 'MISTRAL_API_KEY' },
      { provider: 'GROQ', envVar: 'GROQ_API_KEY' },
    ]

    // Si un provider est préféré, le mettre en premier
    if (preferredProvider) {
      const preferred = fallbackOrder.find(f => f.provider === preferredProvider)
      if (preferred) {
        fallbackOrder.splice(fallbackOrder.indexOf(preferred), 1)
        fallbackOrder.unshift(preferred)
      }
    }

    for (const { provider, envVar } of fallbackOrder) {
      const apiKey = process.env[envVar]
      if (apiKey) {
        const config = PROVIDER_REGISTRY[provider]
        const model = config.models.find(m => m.recommended)?.id || config.models[0]?.id
        if (!model) continue

        return {
          connectionId: null, // Pas de connexion en base — mode natif plateforme
          provider,
          apiKey,
          apiUrl: config.apiUrl,
          model,
          allowedModels: config.models.map(m => m.id),
          config,
          mode: 'native',
        }
      }
    }

    return null
  }

  // ── Token Refresh ──

  private async refreshToken(
    connectionId: string,
    provider: AIProviderType,
    refreshTokenEnc: string,
  ): Promise<ResolvedConnection | null> {
    const config = PROVIDER_REGISTRY[provider]
    if (!config.oauthConfig) return null

    try {
      const refreshToken = decryptToken(refreshTokenEnc)
      const clientId = process.env[config.oauthConfig.clientIdEnvVar]
      const clientSecret = process.env[config.oauthConfig.clientSecretEnvVar]

      if (!clientId || !clientSecret) return null

      const response = await fetch(config.oauthConfig.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      })

      if (!response.ok) return null

      const data = await response.json()
      const { encrypt } = await import('./encryption')
      const newAccessTokenEnc = JSON.stringify(encrypt(data.access_token))
      const newRefreshTokenEnc = data.refresh_token ? JSON.stringify(encrypt(data.refresh_token)) : refreshTokenEnc

      const expiresAt = data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000)
        : new Date(Date.now() + 3600 * 1000)

      const conn = await this.prisma.aIConnection.update({
        where: { id: connectionId },
        data: {
          accessTokenEnc: newAccessTokenEnc,
          refreshTokenEnc: newRefreshTokenEnc,
          tokenExpiresAt: expiresAt,
          status: 'CONNECTED',
          consecutiveErrors: 0,
          lastError: null,
        },
      })

      const apiKey = data.access_token
      const model = conn.defaultModel || config.models.find(m => m.recommended)?.id || config.models[0]?.id

      if (!model) return null

      return {
        connectionId,
        provider,
        apiKey,
        apiUrl: config.apiUrl,
        model,
        allowedModels: conn.allowedModels.length > 0 ? conn.allowedModels : config.models.map(m => m.id),
        config,
        mode: 'byok' as const,
      }
    } catch (error) {
      console.error(`[AURA-V2] Erreur refresh token pour ${provider}:`, error)
      return null
    }
  }

  // ── Appel LLM ──

  /**
   * Effectue un appel LLM via le provider résolu.
   * Gère automatiquement le format de requête selon le provider.
   */
  async callLLM(
    request: LLMRequest,
    connection: ResolvedConnection,
  ): Promise<LLMResponse> {
    const startTime = Date.now()

    try {
      switch (connection.provider) {
        case 'ANTHROPIC':
          return await this.callAnthropic(request, connection)
        case 'GOOGLE_VERTEX':
          return await this.callGoogleVertex(request, connection)
        default:
          // OpenAI-compatible: OpenAI, Mistral, Groq, Azure OpenAI, Cohere
          return await this.callOpenAICompat(request, connection)
      }
    } catch (error) {
      const durationMs = Date.now() - startTime

      // Tracker l'erreur sur la connexion
      if (connection.connectionId) {
        await this.prisma.aIConnection.update({
          where: { id: connection.connectionId },
          data: {
            consecutiveErrors: { increment: 1 },
            lastError: error instanceof Error ? error.message : String(error),
          },
        }).catch(() => {/* non-blocking */})
      }

      throw new ProviderError(
        connection.provider,
        error instanceof Error ? error.message : String(error),
        durationMs,
      )
    }
  }

  /**
   * Effectue un appel LLM en streaming.
   */
  async *callLLMStream(
    request: LLMRequest,
    connection: ResolvedConnection,
  ): AsyncGenerator<LLMStreamChunk> {
    switch (connection.provider) {
      case 'ANTHROPIC':
        return this.streamAnthropic(request, connection)
      default:
        return this.streamOpenAICompat(request, connection)
    }
  }

  // ── OpenAI-Compatible (OpenAI, Mistral, Groq, Azure) ──

  private async callOpenAICompat(
    request: LLMRequest,
    connection: ResolvedConnection,
  ): Promise<LLMResponse> {
    const url = `${connection.apiUrl}/chat/completions`

    const body: Record<string, unknown> = {
      model: request.model || connection.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens,
      stream: false,
    }

    if (request.responseFormat) {
      body.response_format = request.responseFormat
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools
      body.tool_choice = request.toolChoice || 'auto'
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${connection.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`${connection.provider} API error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    const choice = data.choices?.[0]

    // Reset erreurs consécutives sur succès
    if (connection.connectionId) {
      this.prisma.aIConnection.update({
        where: { id: connection.connectionId },
        data: { consecutiveErrors: 0, lastHealthCheck: new Date() },
      }).catch(() => {/* non-blocking */})
    }

    const toolCalls = choice?.message?.tool_calls?.map((tc: { id: string; function: { name: string; arguments: string } }) => ({
      id: tc.id,
      name: tc.function.name,
      arguments: tc.function.arguments,
    }))

    return {
      content: choice?.message?.content || '',
      model: data.model || request.model || connection.model,
      tokensInput: data.usage?.prompt_tokens || 0,
      tokensOutput: data.usage?.completion_tokens || 0,
      finishReason: choice?.finish_reason || 'stop',
      toolCalls,
    }
  }

  private async *streamOpenAICompat(
    request: LLMRequest,
    connection: ResolvedConnection,
  ): AsyncGenerator<LLMStreamChunk> {
    const url = `${connection.apiUrl}/chat/completions`

    const body: Record<string, unknown> = {
      model: request.model || connection.model,
      messages: request.messages,
      temperature: request.temperature ?? 0.2,
      max_tokens: request.maxTokens,
      stream: true,
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools
      body.tool_choice = request.toolChoice || 'auto'
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${connection.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`${connection.provider} stream error ${response.status}: ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body for streaming')

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data: ')) continue
          const data = trimmed.slice(6)
          if (data === '[DONE]') {
            yield { done: true }
            return
          }

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta
            const finishReason = parsed.choices?.[0]?.finish_reason

            if (delta?.content) {
              yield { content: delta.content, done: false }
            }

            if (delta?.tool_calls?.[0]) {
              const tc = delta.tool_calls[0]
              yield {
                toolCallDelta: {
                  id: tc.id || '',
                  name: tc.function?.name,
                  arguments: tc.function?.arguments,
                },
                done: false,
              }
            }

            if (finishReason) {
              yield { done: true, finishReason }
            }
          } catch {
            // Ignorer les lignes non-JSON
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    yield { done: true }
  }

  // ── Anthropic ──

  private async callAnthropic(
    request: LLMRequest,
    connection: ResolvedConnection,
  ): Promise<LLMResponse> {
    const url = `${connection.apiUrl}/messages`

    // Anthropic utilise un format différent : system prompt séparé
    const systemMessage = request.messages.find(m => m.role === 'system')
    const otherMessages = request.messages.filter(m => m.role !== 'system')

    const body: Record<string, unknown> = {
      model: request.model || connection.model,
      max_tokens: request.maxTokens || 4096,
      messages: otherMessages.map(m => ({
        role: m.role === 'tool' ? 'user' : m.role,
        content: m.content,
      })),
    }

    if (systemMessage) {
      body.system = systemMessage.content
    }

    if (request.tools && request.tools.length > 0) {
      body.tools = request.tools.map(t => ({
        name: t.function.name,
        description: t.function.description,
        input_schema: t.function.parameters,
      }))
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': connection.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Anthropic API error ${response.status}: ${errorText}`)
    }

    const data = await response.json()

    // Extraire le contenu textuel
    let content = ''
    const toolCalls: Array<{ id: string; name: string; arguments: string }> = []

    for (const block of data.content || []) {
      if (block.type === 'text') {
        content += block.text
      } else if (block.type === 'tool_use') {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: JSON.stringify(block.input),
        })
      }
    }

    return {
      content,
      model: data.model || request.model || connection.model,
      tokensInput: data.usage?.input_tokens || 0,
      tokensOutput: data.usage?.output_tokens || 0,
      finishReason: data.stop_reason || 'end_turn',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    }
  }

  private async *streamAnthropic(
    request: LLMRequest,
    connection: ResolvedConnection,
  ): AsyncGenerator<LLMStreamChunk> {
    const url = `${connection.apiUrl}/messages`

    const systemMessage = request.messages.find(m => m.role === 'system')
    const otherMessages = request.messages.filter(m => m.role !== 'system')

    const body: Record<string, unknown> = {
      model: request.model || connection.model,
      max_tokens: request.maxTokens || 4096,
      stream: true,
      messages: otherMessages.map(m => ({
        role: m.role === 'tool' ? 'user' : m.role,
        content: m.content,
      })),
    }

    if (systemMessage) {
      body.system = systemMessage.content
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': connection.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Anthropic stream error ${response.status}: ${errorText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body for streaming')

    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data: ')) continue
          const jsonStr = trimmed.slice(6)

          try {
            const event = JSON.parse(jsonStr)

            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              yield { content: event.delta.text, done: false }
            }

            if (event.type === 'message_stop') {
              yield { done: true, finishReason: 'end_turn' }
              return
            }
          } catch {
            // Ignorer les lignes non-JSON
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    yield { done: true }
  }

  // ── Google Vertex ──

  private async callGoogleVertex(
    request: LLMRequest,
    connection: ResolvedConnection,
  ): Promise<LLMResponse> {
    const model = request.model || connection.model
    const url = `${connection.apiUrl}/models/${model}:generateContent?key=${connection.apiKey}`

    // Convertir le format de messages
    const systemInstruction = request.messages.find(m => m.role === 'system')
    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.2,
        maxOutputTokens: request.maxTokens || 4096,
      },
    }

    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction.content }] }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      throw new Error(`Google Vertex API error ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]
    const content = candidate?.content?.parts?.map((p: { text: string }) => p.text).join('') || ''

    return {
      content,
      model,
      tokensInput: data.usageMetadata?.promptTokenCount || 0,
      tokensOutput: data.usageMetadata?.candidatesTokenCount || 0,
      finishReason: candidate?.finishReason || 'STOP',
    }
  }

  // ── Health Check ──

  /**
   * Vérifie la santé d'une connexion en faisant un appel minimal.
   */
  async healthCheck(connectionId: string): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const conn = await this.prisma.aIConnection.findUnique({
      where: { id: connectionId },
    })

    if (!conn || !conn.accessTokenEnc) {
      return { healthy: false, latencyMs: 0, error: 'Connexion introuvable ou sans token' }
    }

    const startTime = Date.now()

    try {
      const apiKey = decryptToken(conn.accessTokenEnc)
      const provider = conn.provider as AIProviderType
      const config = PROVIDER_REGISTRY[provider]

      // Appel minimal pour vérifier la connectivité
      let url: string
      let headers: Record<string, string>

      if (provider === 'ANTHROPIC') {
        url = `${config.apiUrl}/messages`
        headers = {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        }
      } else {
        url = `${config.apiUrl}/models`
        headers = { 'Authorization': `Bearer ${apiKey}` }
      }

      const response = await fetch(url, {
        method: provider === 'ANTHROPIC' ? 'POST' : 'GET',
        headers,
        ...(provider === 'ANTHROPIC' ? {
          body: JSON.stringify({
            model: config.models[0]?.id || 'claude-3-5-haiku-20241022',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'ping' }],
          }),
        } : {}),
        signal: AbortSignal.timeout(10_000),
      })

      const latencyMs = Date.now() - startTime

      if (response.ok || response.status === 200) {
        await this.prisma.aIConnection.update({
          where: { id: connectionId },
          data: {
            lastHealthCheck: new Date(),
            consecutiveErrors: 0,
            status: 'CONNECTED',
          },
        })
        return { healthy: true, latencyMs }
      }

      const error = `HTTP ${response.status}`
      await this.prisma.aIConnection.update({
        where: { id: connectionId },
        data: {
          lastHealthCheck: new Date(),
          lastError: error,
          consecutiveErrors: { increment: 1 },
        },
      })
      return { healthy: false, latencyMs, error }
    } catch (err) {
      const latencyMs = Date.now() - startTime
      const error = err instanceof Error ? err.message : String(err)
      return { healthy: false, latencyMs, error }
    }
  }

  // ── Utilitaires ──

  /**
   * Liste tous les modèles disponibles pour un provider.
   */
  getModelsForProvider(provider: AIProviderType): ProviderModel[] {
    return PROVIDER_REGISTRY[provider]?.models || []
  }

  /**
   * Estime le coût d'un appel LLM.
   */
  estimateCost(
    provider: AIProviderType,
    modelId: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    const model = PROVIDER_REGISTRY[provider]?.models.find(m => m.id === modelId)
    if (!model) return 0

    return (inputTokens / 1000) * model.costPer1kInput + (outputTokens / 1000) * model.costPer1kOutput
  }
}

// ============================================================================
// TYPES INTERNES
// ============================================================================

export interface ResolvedConnection {
  connectionId: string | null
  provider: AIProviderType
  apiKey: string
  apiUrl: string
  model: string
  allowedModels: string[]
  config: ProviderConfig
  mode: 'byok' | 'native'
}

export class ProviderError extends Error {
  constructor(
    public provider: AIProviderType,
    message: string,
    public durationMs: number,
  ) {
    super(`[${provider}] ${message}`)
    this.name = 'ProviderError'
  }
}
