'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

/**
 * AURA V2 — Hook frontend pour l'architecture agent autonome
 * 
 * Utilise les endpoints V2 :
 * - /api/advisor/ai/v2/connections — Gestion connexions IA
 * - /api/advisor/ai/v2/sessions — Gestion sessions
 * - /api/advisor/ai/v2/sessions/[id]/runs — Exécution de runs
 * - /api/advisor/ai/v2/sessions/[id]/messages — Historique messages
 * 
 * Features :
 * - Typewriter streaming simulation (le run V2 est synchrone mais l'affichage est progressif)
 * - Agent meta (intent, confidence, model, duration, warnings)
 * - Tool calls avec navigation
 * - Plan et Critic report
 * - Session history (remplace les threads)
 */

// ── Types ──

export interface AIConnectionV2 {
  id: string
  provider: string
  status: string
  label: string
  providerEmail: string | null
  allowedModels: string[]
  defaultModel: string | null
  lastHealthCheck: string | null
  lastError: string | null
  consecutiveErrors: number
  totalTokensUsed: string
  totalCost: number | null
  monthlyTokenLimit: number | null
  monthlySpendLimit: number | null
  tokenExpiresAt: string | null
  scopes: string[]
  createdAt: string
  updatedAt: string
  providerInfo?: {
    name: string
    models: Array<{ id: string; name: string; recommended: boolean }>
    supportsStreaming: boolean
  }
}

export interface AISessionV2 {
  id: string
  title: string
  summary: string | null
  status: string
  mode: string
  client: { id: string; name: string } | null
  totalRuns: number
  totalTokens: string
  totalToolCalls: number
  totalDuration: number
  runsCount: number
  messagesCount: number
  startedAt: string
  lastActiveAt: string
  createdAt: string
}

export interface AIMessageV2 {
  id: string
  role: 'user' | 'assistant'
  content: string
  metadata: Record<string, unknown>
  run: {
    id: string
    status: string
    type: string
    intent: string | null
    criticScore: number | null
    durationMs: number | null
    modelUsed: string | null
  } | null
  createdAt: string
}

export interface AIRunV2 {
  id: string
  status: string
  response: string | null
  metadata: {
    intent: string
    intentConfidence: number
    confidence: string
    durationMs: number
    modelUsed: string
    providerUsed: string
    connectionMode?: 'byok' | 'native'
    warnings: string[]
  }
  toolCalls: Array<{
    toolName: string
    success: boolean
    message: string
    durationMs: number
    navigationUrl?: string
  }>
  plan: {
    strategy: string
    stepsCount: number
    requiresConfirmation: boolean
  } | null
  criticReport: {
    passed: boolean
    score: number
    recommendation: string
  } | null
}

export interface PageContextV2 {
  path: string
  pageType?: string
  clientId?: string
  clientName?: string
  modeId?: string
  modePrompt?: string
}

export interface AgentActionV2 {
  toolName: string
  status: 'executed' | 'failed' | 'pending_confirmation'
  success: boolean
  message: string
  durationMs: number
  navigationUrl?: string
}

export interface AgentMetaV2 {
  intent: string
  intentConfidence: number
  confidence: string
  durationMs: number
  modelUsed: string
  providerUsed: string
  connectionMode: 'byok' | 'native'
  warnings: string[]
  plan?: { strategy: string; stepsCount: number; requiresConfirmation: boolean }
  criticReport?: { passed: boolean; score: number; recommendation: string }
}

export interface ChatMessageV2 {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  run?: AIRunV2
  agentActions?: AgentActionV2[]
  agentMeta?: AgentMetaV2
}

export interface AssistantProfileV2 {
  id: string
  name: string
  description: string | null
  tone: string
  enabledDomains: string[]
  enabledFeatures: Record<string, unknown> | null
  isDefault: boolean
  isActive: boolean
  _count?: { sessions: number }
}

export interface BackgroundInsightsV2 {
  status: 'active' | 'inactive'
  backgroundEnabled: boolean
  hasConnection: boolean
  provider: string | null
  profileName: string | null
  lastScanAt: string | null
  insights: Array<{
    type?: string
    message?: string
    severity?: string
    jobType?: string
    [key: string]: unknown
  }>
  quickStats: {
    totalClients: number
    clientsSansContact: number
    kycExpirant: number
    tachesEnRetard: number
    reclamationsOuvertes: number
  }
}

// ── Hook ──

export function useAIv2() {
  // Connections state
  const [connections, setConnections] = useState<AIConnectionV2[]>([])
  const [connectionsLoading, setConnectionsLoading] = useState(false)

  // Profiles state
  const [profiles, setProfiles] = useState<AssistantProfileV2[]>([])
  const [profilesLoading, setProfilesLoading] = useState(false)
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)

  // Background insights state
  const [backgroundInsights, setBackgroundInsights] = useState<BackgroundInsightsV2 | null>(null)
  const [backgroundLoading, setBackgroundLoading] = useState(false)

  // Sessions state
  const [sessions, setSessions] = useState<AISessionV2[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const currentSessionIdRef = useRef<string | null>(null)

  // Messages state
  const [messages, setMessages] = useState<AIMessageV2[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  // Run state
  const [isRunning, setIsRunning] = useState(false)
  const [lastRun, setLastRun] = useState<AIRunV2 | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Streaming simulation state
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const streamingRef = useRef<{ cancel: boolean }>({ cancel: false })

  // Derived agent state
  const [lastAgentActions, setLastAgentActions] = useState<AgentActionV2[]>([])
  const [lastAgentMeta, setLastAgentMeta] = useState<AgentMetaV2 | null>(null)

  // Chat history (combined view)
  const [chatHistory, setChatHistory] = useState<ChatMessageV2[]>([])

  useEffect(() => { currentSessionIdRef.current = currentSessionId }, [currentSessionId])

  const hasActiveConnection = connections.some(c => c.status === 'CONNECTED')

  // ══════════════════════════════════════════════════════════════
  // TYPEWRITER STREAMING SIMULATION
  // ══════════════════════════════════════════════════════════════

  const typewriterStream = useCallback(async (
    fullText: string,
    run: AIRunV2,
    onComplete: () => void,
  ) => {
    streamingRef.current = { cancel: false }
    setIsStreaming(true)
    setStreamingContent('')

    // Derive agent actions from run
    const actions: AgentActionV2[] = (run.toolCalls || []).map(tc => ({
      toolName: tc.toolName,
      status: tc.success ? 'executed' as const : 'failed' as const,
      success: tc.success,
      message: tc.message,
      durationMs: tc.durationMs,
      navigationUrl: tc.navigationUrl,
    }))
    setLastAgentActions(actions)

    // Derive agent meta from run
    const meta: AgentMetaV2 = {
      intent: run.metadata?.intent || 'conversation',
      intentConfidence: run.metadata?.intentConfidence || 0,
      confidence: run.metadata?.confidence || 'MED',
      durationMs: run.metadata?.durationMs || 0,
      modelUsed: run.metadata?.modelUsed || '',
      providerUsed: run.metadata?.providerUsed || '',
      connectionMode: run.metadata?.connectionMode || 'native',
      warnings: run.metadata?.warnings || [],
      plan: run.plan || undefined,
      criticReport: run.criticReport || undefined,
    }
    setLastAgentMeta(meta)

    // Show tool calls phase first (brief pause if tools were called)
    if (actions.length > 0) {
      await new Promise(r => setTimeout(r, 600))
    }

    // Typewriter: stream text character by character
    // Speed: ~15ms per char, with faster speed for spaces/newlines
    const chars = fullText.split('')
    let displayed = ''

    for (let i = 0; i < chars.length; i++) {
      if (streamingRef.current.cancel) break

      displayed += chars[i]
      setStreamingContent(displayed)

      // Variable speed: faster for whitespace, slower for punctuation
      const char = chars[i]
      const delay = char === ' ' || char === '\n' ? 5 : char === '.' || char === ',' || char === ':' ? 30 : 12
      await new Promise(r => setTimeout(r, delay))
    }

    setIsStreaming(false)
    setStreamingContent('')
    onComplete()
  }, [])

  // ══════════════════════════════════════════════════════════════
  // CONNECTIONS
  // ══════════════════════════════════════════════════════════════

  const loadConnections = useCallback(async () => {
    setConnectionsLoading(true)
    try {
      const res = await fetch('/api/advisor/ai/v2/connections')
      if (res.ok) {
        const data = await res.json()
        setConnections(data.connections || [])
      }
    } catch { /* ignore */ }
    setConnectionsLoading(false)
  }, [])

  const createConnection = useCallback(async (
    provider: string,
    apiKey?: string,
    label?: string,
    defaultModel?: string,
  ): Promise<AIConnectionV2 | null> => {
    try {
      const res = await fetch('/api/advisor/ai/v2/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, label, defaultModel }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        setError(errData.error || 'Erreur de création')
        return null
      }
      const data = await res.json()
      await loadConnections()
      return data.connection
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau')
      return null
    }
  }, [loadConnections])

  const deleteConnection = useCallback(async (connectionId: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/advisor/ai/v2/connections/${connectionId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        await loadConnections()
        return true
      }
      return false
    } catch {
      return false
    }
  }, [loadConnections])

  const testConnection = useCallback(async (
    provider: string,
    apiKey: string,
  ): Promise<{ success: boolean; message: string; models?: string[] }> => {
    try {
      const res = await fetch('/api/advisor/ai/v2/connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey }),
      })
      const data = await res.json()
      return data
    } catch {
      return { success: false, message: 'Erreur réseau lors du test' }
    }
  }, [])

  // ══════════════════════════════════════════════════════════════
  // SESSIONS
  // ══════════════════════════════════════════════════════════════

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true)
    try {
      const res = await fetch('/api/advisor/ai/v2/sessions')
      if (res.ok) {
        const data = await res.json()
        setSessions(data.sessions || [])
      }
    } catch { /* ignore */ }
    setSessionsLoading(false)
  }, [])

  const createSession = useCallback(async (
    clientId?: string,
    title?: string,
    mode?: string,
  ): Promise<string | null> => {
    try {
      const res = await fetch('/api/advisor/ai/v2/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, title, mode }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const id = data.session?.id
      if (id) {
        setCurrentSessionId(id)
        currentSessionIdRef.current = id
        await loadSessions()
      }
      return id || null
    } catch {
      return null
    }
  }, [loadSessions])

  const loadSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId)
    currentSessionIdRef.current = sessionId
    setMessagesLoading(true)
    try {
      const res = await fetch(`/api/advisor/ai/v2/sessions/${sessionId}/messages`)
      if (res.ok) {
        const data = await res.json()
        const msgs: AIMessageV2[] = data.messages || []
        setMessages(msgs)
        setChatHistory(msgs.map(m => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(m.createdAt).getTime(),
        })))
      }
    } catch { /* ignore */ }
    setMessagesLoading(false)
  }, [])

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await fetch(`/api/advisor/ai/v2/sessions/${sessionId}`, { method: 'DELETE' })
      if (currentSessionIdRef.current === sessionId) {
        setCurrentSessionId(null)
        currentSessionIdRef.current = null
        setChatHistory([])
        setMessages([])
      }
      await loadSessions()
    } catch { /* ignore */ }
  }, [loadSessions])

  // ══════════════════════════════════════════════════════════════
  // MESSAGES
  // ══════════════════════════════════════════════════════════════

  const loadMessages = useCallback(async (sessionId: string) => {
    setMessagesLoading(true)
    try {
      const res = await fetch(`/api/advisor/ai/v2/sessions/${sessionId}/messages`)
      if (res.ok) {
        const data = await res.json()
        const msgs = data.messages || []
        setMessages(msgs)
        setChatHistory(msgs.map((m: AIMessageV2) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(m.createdAt).getTime(),
          run: undefined,
        })))
      }
    } catch { /* ignore */ }
    setMessagesLoading(false)
  }, [])

  // ══════════════════════════════════════════════════════════════
  // RUNS
  // ══════════════════════════════════════════════════════════════

  const sendMessage = useCallback(async (message: string): Promise<AIRunV2 | null> => {
    const sessionId = currentSessionIdRef.current
    if (!sessionId) {
      setError('Aucune session active')
      return null
    }

    setIsRunning(true)
    setError(null)

    try {
      const res = await fetch(`/api/advisor/ai/v2/sessions/${sessionId}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, clientId: undefined, pageContext: undefined }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(errData.error || `Erreur HTTP ${res.status}`)
      }

      const data = await res.json()
      const run = data.run as AIRunV2
      setLastRun(run)
      return run
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur réseau'
      setError(msg)
      return null
    } finally {
      setIsRunning(false)
    }
  }, [])

  // ══════════════════════════════════════════════════════════════
  // COMBINED FLOW — sendMessageStream (V2 with typewriter)
  // ══════════════════════════════════════════════════════════════

  const sendMessageStream = useCallback(async (
    message: string,
    clientId?: string,
    pageContext?: PageContextV2,
  ) => {
    setError(null)
    setLastAgentActions([])
    setLastAgentMeta(null)

    // Cancel any ongoing stream
    streamingRef.current.cancel = true

    // Auto-create session if needed
    let sessionId = currentSessionIdRef.current
    if (!sessionId) {
      sessionId = await createSession(clientId, undefined, 'conversation')
      if (!sessionId) {
        setError('Impossible de créer une session')
        return
      }
    }

    // Add user message to chat history immediately
    setChatHistory(prev => [...prev, {
      role: 'user' as const,
      content: message,
      timestamp: Date.now(),
    }])

    setIsRunning(true)
    setIsStreaming(true)
    setStreamingContent('')

    try {
      const res = await fetch(`/api/advisor/ai/v2/sessions/${sessionId}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          ...(clientId && { clientId }),
          ...(pageContext && { pageContext }),
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(errData.error || `Erreur HTTP ${res.status}`)
      }

      const data = await res.json()
      const run = data.run as AIRunV2
      setLastRun(run)
      setIsRunning(false)

      if (run.response) {
        // Derive agent actions
        const actions: AgentActionV2[] = (run.toolCalls || []).map(tc => ({
          toolName: tc.toolName,
          status: (tc.success ? 'executed' : 'failed') as AgentActionV2['status'],
          success: tc.success,
          message: tc.message,
          durationMs: tc.durationMs,
          navigationUrl: tc.navigationUrl,
        }))
        setLastAgentActions(actions)

        // Derive agent meta
        setLastAgentMeta({
          intent: run.metadata?.intent || 'conversation',
          intentConfidence: run.metadata?.intentConfidence || 0,
          confidence: run.metadata?.confidence || 'MED',
          durationMs: run.metadata?.durationMs || 0,
          modelUsed: run.metadata?.modelUsed || '',
          providerUsed: run.metadata?.providerUsed || '',
          connectionMode: run.metadata?.connectionMode || 'native',
          warnings: run.metadata?.warnings || [],
          plan: run.plan || undefined,
          criticReport: run.criticReport || undefined,
        })

        // Start typewriter effect
        await typewriterStream(run.response, run, () => {
          // On complete: add final message to chat history
          setChatHistory(prev => [...prev, {
            role: 'assistant' as const,
            content: run.response!,
            timestamp: Date.now(),
            run,
            agentActions: actions,
            agentMeta: {
              intent: run.metadata?.intent || 'conversation',
              intentConfidence: run.metadata?.intentConfidence || 0,
              confidence: run.metadata?.confidence || 'MED',
              durationMs: run.metadata?.durationMs || 0,
              modelUsed: run.metadata?.modelUsed || '',
              providerUsed: run.metadata?.providerUsed || '',
              connectionMode: run.metadata?.connectionMode || 'native',
              warnings: run.metadata?.warnings || [],
              plan: run.plan || undefined,
              criticReport: run.criticReport || undefined,
            },
          }])
        })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur réseau'
      setError(msg)
      setIsRunning(false)
      setIsStreaming(false)
      setStreamingContent('')
      setChatHistory(prev => [...prev, {
        role: 'assistant' as const,
        content: `Erreur : ${msg}`,
        timestamp: Date.now(),
      }])
    }
  }, [createSession, typewriterStream])

  const newConversation = useCallback(() => {
    streamingRef.current.cancel = true
    setCurrentSessionId(null)
    currentSessionIdRef.current = null
    setChatHistory([])
    setMessages([])
    setLastRun(null)
    setLastAgentActions([])
    setLastAgentMeta(null)
    setError(null)
    setIsRunning(false)
    setIsStreaming(false)
    setStreamingContent('')
  }, [])

  // ══════════════════════════════════════════════════════════════
  // PROFILES
  // ══════════════════════════════════════════════════════════════

  const loadProfiles = useCallback(async () => {
    setProfilesLoading(true)
    try {
      const res = await fetch('/api/advisor/ai/v2/profiles')
      if (res.ok) {
        const data = await res.json()
        const loaded = data.profiles || []
        setProfiles(loaded)
        // Auto-select default profile if none selected
        if (!activeProfileId && loaded.length > 0) {
          const defaultProfile = loaded.find((p: AssistantProfileV2) => p.isDefault) || loaded[0]
          setActiveProfileId(defaultProfile.id)
        }
      }
    } catch { /* ignore */ }
    setProfilesLoading(false)
  }, [activeProfileId])

  const selectProfile = useCallback((profileId: string) => {
    setActiveProfileId(profileId)
  }, [])

  const loadBackgroundInsights = useCallback(async () => {
    setBackgroundLoading(true)
    try {
      const res = await fetch('/api/advisor/ai/v2/background')
      if (res.ok) {
        const data = await res.json()
        setBackgroundInsights(data)
      }
    } catch { /* ignore */ }
    setBackgroundLoading(false)
  }, [])

  // Load connections, profiles, and background on mount
  useEffect(() => {
    loadConnections()
    loadProfiles()
    loadBackgroundInsights()
  }, [loadConnections, loadProfiles, loadBackgroundInsights])

  return {
    // Connections
    connections,
    connectionsLoading,
    loadConnections,
    createConnection,
    deleteConnection,
    testConnection,
    hasActiveConnection,

    // Profiles
    profiles,
    profilesLoading,
    activeProfileId,
    loadProfiles,
    selectProfile,

    // Background insights
    backgroundInsights,
    backgroundLoading,
    loadBackgroundInsights,

    // Sessions (replaces threads)
    sessions,
    sessionsLoading,
    currentSessionId,
    loadSessions,
    createSession,
    loadSession,
    deleteSession,
    setCurrentSession: setCurrentSessionId,
    newConversation,

    // Messages
    messages,
    messagesLoading,
    loadMessages,

    // Runs
    isRunning,
    isLoading: isRunning,
    lastRun,
    sendMessage,
    error,

    // Streaming simulation
    isStreaming,
    streamingContent,

    // Agent derived state
    lastAgentActions,
    lastAgentMeta,

    // Combined flow
    chatHistory,
    sendMessageStream,
    clearChat: newConversation,
    isAvailable: hasActiveConnection,
  }
}
