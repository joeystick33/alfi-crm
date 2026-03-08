'use client'

import { useState, useCallback, useEffect, useRef } from 'react'

// ============================================================================
// Hook universel IA — Accès à toutes les capabilities IA du CRM
//
// Capabilities :
//   • chat        — Assistant conversationnel pour les conseillers
//   • summarize   — Résumé automatique de RDV / notes
//   • email       — Génération d'emails client personnalisés
//   • analyze     — Analyse SWOT intelligente de profil client
//   • enrich      — Enrichissement de préconisations
//   • explain     — Explication de concepts fiscaux/juridiques
//   • compare     — Comparaison de produits / stratégies
//   • narrative   — Narratifs d'audit patrimonial (route existante)
// ============================================================================

// ── Types ──────────────────────────────────────────────────────────────────

interface AIStatusData {
  available: boolean
  provider: 'openai' | 'mistral-cloud' | 'mistral' | 'groq' | 'fallback'
  model: string
  cache: { size: number; hitRate: string }
  queue: { pending: number; processing: number }
}

export interface RAGSource {
  type: 'crm' | 'web' | 'legal'
  title: string
  url?: string
  sourceName: string
  relevance: number
  legalDocType?: string
}

export interface AgentAction {
  toolName: string
  status: 'executed' | 'pending_confirmation' | 'failed'
  message: string
  data?: unknown
  requiresConfirmation: boolean
  navigationUrl?: string
}

export interface PageContext {
  path: string
  pageType?: string
  clientId?: string
  clientName?: string
  visibleData?: string
}

export interface AgentMeta {
  memoriesUsed: number
  instructionsApplied: number
  metrics?: {
    totalMs: number
    [key: string]: number
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  ragSources?: RAGSource[]
  agentActions?: AgentAction[]
}

export interface ThreadSummary {
  id: string
  title: string
  summary: string | null
  pinned: boolean
  archived: boolean
  clientId: string | null
  clientName: string | null
  messageCount: number
  lastMessage: { content: string; role: string; createdAt: string } | null
  createdAt: string
  updatedAt: string
}

type EmailType = 'relance' | 'confirmation_rdv' | 'envoi_bilan' | 'information' | 'anniversaire' | 'suivi_preco' | 'custom'
type EmailTone = 'formel' | 'chaleureux' | 'urgent'

interface UseAIReturn {
  // Statut
  status: AIStatusData | null
  isAvailable: boolean
  isLoading: boolean
  isStreaming: boolean
  error: string | null
  checkStatus: () => Promise<AIStatusData | null>

  // Chat conversationnel
  chatHistory: ChatMessage[]
  sendMessage: (message: string) => Promise<string | null>
  sendMessageStream: (message: string, clientId?: string, pageContext?: PageContext) => Promise<void>
  streamingContent: string
  lastRagSources: RAGSource[]
  lastAgentActions: AgentAction[]
  lastAgentMeta: AgentMeta | null
  clearChat: () => void

  // Thread persistence (historique conversations)
  currentThreadId: string | null
  threads: ThreadSummary[]
  threadsLoading: boolean
  loadThreads: () => Promise<void>
  createThread: (title?: string, clientId?: string) => Promise<string | null>
  loadThread: (threadId: string) => Promise<void>
  deleteThread: (threadId: string) => Promise<void>
  renameThread: (threadId: string, title: string) => Promise<void>
  pinThread: (threadId: string, pinned: boolean) => Promise<void>
  newConversation: () => void

  // Résumé de RDV
  summarizeAppointment: (notes: string, clientName: string, appointmentType?: string) => Promise<string | null>

  // Email
  generateEmail: (params: {
    clientName: string
    advisorName: string
    cabinetName: string
    emailType: EmailType
    context: string
    tone?: EmailTone
  }) => Promise<{ subject: string; body: string } | null>

  // Analyse profil
  analyzeProfile: (data: {
    age: number
    situationFamiliale: string
    nbEnfants: number
    profession: string
    revenuAnnuel: number
    patrimoineNet: number
    patrimoineImmobilier: number
    patrimoineFinancier: number
    endettement: number
    tauxEpargne: number
    tmi: number
    ifiAssujetti: boolean
  }) => Promise<{ forces: string[]; faiblesses: string[]; opportunites: string[]; menaces: string[]; scoreGlobal: number; prioriteAction: string } | null>

  // Enrichir préconisation
  enrichPreconisation: (preco: {
    titre: string
    categorie: string
    produit?: string
    montantEstime?: number
    objectif: string
    clientAge: number
    clientTmi: number
    clientCapaciteEpargne: number
    clientPatrimoineNet: number
  }) => Promise<string | null>

  // Expliquer un concept
  explainConcept: (concept: string, level?: 'junior' | 'senior') => Promise<string | null>

  // Comparer des options
  compareOptions: (items: string[], clientContext?: string) => Promise<string | null>

  // Narratif audit (route legacy)
  generateNarrative: (type: string, context: Record<string, unknown>, clientName?: string) => Promise<string | null>
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAI(cabinetId?: string, userId?: string): UseAIReturn {
  const [status, setStatus] = useState<AIStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [lastRagSources, setLastRagSources] = useState<RAGSource[]>([])
  const [lastAgentActions, setLastAgentActions] = useState<AgentAction[]>([])
  const [lastAgentMeta, setLastAgentMeta] = useState<AgentMeta | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const chatHistoryRef = useRef<ChatMessage[]>([])
  const statusChecked = useRef(false)
  const abortRef = useRef<AbortController | null>(null)
  const STREAMING_TIMEOUT_MS = 30_000

  // Thread persistence state
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null)
  const [threads, setThreads] = useState<ThreadSummary[]>([])
  const [threadsLoading, setThreadsLoading] = useState(false)
  const currentThreadIdRef = useRef<string | null>(null)
  useEffect(() => { currentThreadIdRef.current = currentThreadId }, [currentThreadId])

  // Sync ref with state to avoid stale closures in callbacks
  useEffect(() => { chatHistoryRef.current = chatHistory }, [chatHistory])

  // Check status on mount (once)
  useEffect(() => {
    if (!statusChecked.current) {
      statusChecked.current = true
      checkStatus()
    }
  }, [])

  const checkStatus = useCallback(async (): Promise<AIStatusData | null> => {
    try {
      const res = await fetch('/api/advisor/ai/chat')
      if (!res.ok) return null
      const data: AIStatusData = await res.json()
      setStatus(data)
      return data
    } catch {
      setStatus(null)
      return null
    }
  }, [])

  const callAPI = useCallback(async <T>(
    url: string,
    body: Record<string, unknown>
  ): Promise<T | null> => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, cabinetId }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(errData.error || `Erreur HTTP ${res.status}`)
      }
      return await res.json() as T
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur réseau'
      setError(msg)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [cabinetId])

  // ── Chat ──

  const sendMessage = useCallback(async (message: string): Promise<string | null> => {
    const userMsg: ChatMessage = { role: 'user', content: message, timestamp: Date.now() }
    setChatHistory(prev => [...prev, userMsg])

    const result = await callAPI<{ response: string }>('/api/advisor/ai/chat', {
      message,
      history: chatHistoryRef.current.map(m => ({ role: m.role, content: m.content })),
    })

    if (result?.response) {
      const assistantMsg: ChatMessage = { role: 'assistant', content: result.response, timestamp: Date.now() }
      setChatHistory(prev => [...prev, assistantMsg])
      return result.response
    }
    return null
  }, [callAPI])

  // ── Thread persistence helpers (must be declared before sendMessageStream) ──

  const saveMessageToThread = useCallback(async (
    threadId: string,
    msg: { role: string; content: string; ragSources?: unknown; agentActions?: unknown; agentMeta?: unknown }
  ) => {
    try {
      await fetch(`/api/advisor/ai/threads/${threadId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msg),
      })
    } catch { /* fire & forget — don't break chat flow */ }
  }, [])

  const ensureThread = useCallback(async (clientId?: string): Promise<string | null> => {
    if (currentThreadIdRef.current) return currentThreadIdRef.current
    try {
      const res = await fetch('/api/advisor/ai/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const id = data.thread?.id
      if (id) {
        setCurrentThreadId(id)
        currentThreadIdRef.current = id
      }
      return id || null
    } catch { return null }
  }, [])

  const loadThreads = useCallback(async () => {
    setThreadsLoading(true)
    try {
      const res = await fetch('/api/advisor/ai/threads')
      if (res.ok) {
        const data = await res.json()
        setThreads(data.threads || [])
      }
    } catch { /* ignore */ }
    setThreadsLoading(false)
  }, [])

  // ── Chat Streaming ──

  const sendMessageStream = useCallback(async (message: string, clientId?: string, pageContext?: PageContext): Promise<void> => {
    const userMsg: ChatMessage = { role: 'user', content: message, timestamp: Date.now() }
    setChatHistory(prev => [...prev, userMsg])
    setIsStreaming(true)
    setStreamingContent('')
    setLastRagSources([])
    setLastAgentActions([])
    setError(null)

    // Auto-create thread if needed + save user message
    const threadId = await ensureThread(clientId)
    if (threadId) {
      saveMessageToThread(threadId, { role: 'user', content: message })
    }

    // Cancel any existing stream
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    try {
      const res = await fetch('/api/advisor/ai/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history: chatHistoryRef.current.map(m => ({ role: m.role, content: m.content })),
          clientId,
          enableRag: true,
          enableAgent: true,
          autoExecute: false,
          pageContext,
        }),
        signal: abortRef.current.signal,
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
        throw new Error(errData.error || `Erreur HTTP ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('Pas de stream disponible')

      const decoder = new TextDecoder()
      let fullContent = ''
      let sources: RAGSource[] = []
      let actions: AgentAction[] = []

      let lastTokenTime = Date.now()
      while (true) {
        // Streaming timeout: if no token received for 30s, abort
        const timeoutId = setTimeout(() => {
          if (Date.now() - lastTokenTime > STREAMING_TIMEOUT_MS) {
            abortRef.current?.abort()
          }
        }, STREAMING_TIMEOUT_MS)

        const { done, value } = await reader.read()
        clearTimeout(timeoutId)
        if (done) break
        lastTokenTime = Date.now()

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6))
            // Premier event : métadonnées agent (sources + actions + mémoire + metrics)
            if (json.ragSources || json.agentActions || json.memoriesUsed !== undefined) {
              if (json.ragSources) {
                sources = json.ragSources as RAGSource[]
                setLastRagSources(sources)
              }
              if (json.agentActions) {
                actions = json.agentActions as AgentAction[]
                setLastAgentActions(actions)
              }
              if (json.memoriesUsed !== undefined) {
                setLastAgentMeta({
                  memoriesUsed: json.memoriesUsed ?? 0,
                  instructionsApplied: json.instructionsApplied ?? 0,
                  metrics: json.metrics,
                })
              }
              continue
            }
            if (json.token) {
              fullContent += json.token
              // Filtrer les tags [ACTION:...] résiduels pour ne pas les afficher
              const cleanContent = fullContent.replace(/\[ACTION:\s*\w+\([^\)]*\)\]/g, '').trim()
              setStreamingContent(cleanContent)
            }
            if (json.done) break
          } catch { /* skip malformed SSE */ }
        }
      }

      // Add completed message to history with RAG sources and agent actions
      const cleanedContent = fullContent.replace(/\[ACTION:\s*\w+\([^\)]*\)\]/g, '').trim()
      if (cleanedContent) {
        const assistantMsg: ChatMessage = {
          role: 'assistant',
          content: cleanedContent,
          timestamp: Date.now(),
          ragSources: sources.length > 0 ? sources : undefined,
          agentActions: actions.length > 0 ? actions : undefined,
        }
        setChatHistory(prev => [...prev, assistantMsg])

        // Persist assistant message to thread
        const tid = currentThreadIdRef.current
        if (tid) {
          saveMessageToThread(tid, {
            role: 'assistant',
            content: cleanedContent,
            ragSources: sources.length > 0 ? sources : undefined,
            agentActions: actions.length > 0 ? actions : undefined,
          })
          // Refresh thread list (updates title/lastMessage)
          loadThreads()
        }
      }
      setStreamingContent('')
    } catch (e: unknown) {
      if (e instanceof Error && e.name === 'AbortError') return
      const msg = e instanceof Error ? e.message : 'Erreur réseau'
      setError(msg)
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [ensureThread, saveMessageToThread, loadThreads])

  const createThread = useCallback(async (title?: string, clientId?: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/advisor/ai/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, clientId }),
      })
      if (!res.ok) return null
      const data = await res.json()
      const id = data.thread?.id
      if (id) {
        setCurrentThreadId(id)
        currentThreadIdRef.current = id
        setChatHistory([])
        loadThreads()
      }
      return id || null
    } catch { return null }
  }, [loadThreads])

  const loadThread = useCallback(async (threadId: string) => {
    try {
      const res = await fetch(`/api/advisor/ai/threads/${threadId}`)
      if (!res.ok) return
      const data = await res.json()
      const thread = data.thread
      if (!thread) return

      setCurrentThreadId(threadId)
      currentThreadIdRef.current = threadId

      const messages: ChatMessage[] = (thread.messages || []).map((m: { role: string; content: string; createdAt: string; ragSources?: unknown; agentActions?: unknown }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.createdAt).getTime(),
        ragSources: m.ragSources as RAGSource[] | undefined,
        agentActions: m.agentActions as AgentAction[] | undefined,
      }))
      setChatHistory(messages)
      setStreamingContent('')
      setLastRagSources([])
      setLastAgentActions([])
      setLastAgentMeta(null)
      setError(null)
    } catch { /* ignore */ }
  }, [])

  const deleteThread = useCallback(async (threadId: string) => {
    try {
      await fetch(`/api/advisor/ai/threads/${threadId}`, { method: 'DELETE' })
      if (currentThreadIdRef.current === threadId) {
        setCurrentThreadId(null)
        currentThreadIdRef.current = null
        setChatHistory([])
      }
      setThreads(prev => prev.filter(t => t.id !== threadId))
    } catch { /* ignore */ }
  }, [])

  const renameThread = useCallback(async (threadId: string, title: string) => {
    try {
      await fetch(`/api/advisor/ai/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, title } : t))
    } catch { /* ignore */ }
  }, [])

  const pinThread = useCallback(async (threadId: string, pinned: boolean) => {
    try {
      await fetch(`/api/advisor/ai/threads/${threadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned }),
      })
      setThreads(prev => prev.map(t => t.id === threadId ? { ...t, pinned } : t))
    } catch { /* ignore */ }
  }, [])

  const newConversation = useCallback(() => {
    setCurrentThreadId(null)
    currentThreadIdRef.current = null
    setChatHistory([])
    setStreamingContent('')
    setLastRagSources([])
    setLastAgentActions([])
    setLastAgentMeta(null)
    setError(null)
    setIsLoading(false)
    setIsStreaming(false)
    if (abortRef.current) abortRef.current.abort()
    abortRef.current = null
  }, [])

  const clearChat = useCallback(() => {
    newConversation()
  }, [newConversation])

  // ── Résumé RDV ──

  const summarizeAppointment = useCallback(async (
    notes: string,
    clientName: string,
    appointmentType?: string
  ): Promise<string | null> => {
    const result = await callAPI<{ summary: string }>('/api/advisor/ai/summarize', {
      notes,
      clientName,
      appointmentType,
    })
    return result?.summary || null
  }, [callAPI])

  // ── Email ──

  const generateEmail = useCallback(async (params: {
    clientName: string
    advisorName: string
    cabinetName: string
    emailType: EmailType
    context: string
    tone?: EmailTone
  }): Promise<{ subject: string; body: string } | null> => {
    const result = await callAPI<{ subject: string; body: string }>('/api/advisor/ai/email', params)
    return result ? { subject: result.subject, body: result.body } : null
  }, [callAPI])

  // ── Analyse profil ──

  const analyzeProfile = useCallback(async (data: {
    age: number
    situationFamiliale: string
    nbEnfants: number
    profession: string
    revenuAnnuel: number
    patrimoineNet: number
    patrimoineImmobilier: number
    patrimoineFinancier: number
    endettement: number
    tauxEpargne: number
    tmi: number
    ifiAssujetti: boolean
  }) => {
    const result = await callAPI<{ analysis: { forces: string[]; faiblesses: string[]; opportunites: string[]; menaces: string[]; scoreGlobal: number; prioriteAction: string } | null }>('/api/advisor/ai/analyze-profile', data)
    return result?.analysis || null
  }, [callAPI])

  // ── Enrichir préco ──

  const enrichPreconisation = useCallback(async (preco: {
    titre: string
    categorie: string
    produit?: string
    montantEstime?: number
    objectif: string
    clientAge: number
    clientTmi: number
    clientCapaciteEpargne: number
    clientPatrimoineNet: number
  }): Promise<string | null> => {
    const result = await callAPI<{ enrichedDescription: string }>('/api/advisor/ai/enrich-preco', preco)
    return result?.enrichedDescription || null
  }, [callAPI])

  // ── Expliquer ──

  const explainConcept = useCallback(async (concept: string, level: 'junior' | 'senior' = 'junior'): Promise<string | null> => {
    const result = await callAPI<{ explanation: string }>('/api/advisor/ai/explain', {
      action: 'explain',
      concept,
      level,
    })
    return result?.explanation || null
  }, [callAPI])

  // ── Comparer ──

  const compareOptions = useCallback(async (items: string[], clientContext?: string): Promise<string | null> => {
    const result = await callAPI<{ comparison: string }>('/api/advisor/ai/explain', {
      action: 'compare',
      items,
      clientContext: clientContext || '',
    })
    return result?.comparison || null
  }, [callAPI])

  // ── Narratif audit (route legacy) ──

  const generateNarrative = useCallback(async (
    type: string,
    context: Record<string, unknown>,
    clientName?: string
  ): Promise<string | null> => {
    const result = await callAPI<{ narrative: string | null }>('/api/advisor/ai/generate-narrative', {
      type,
      context,
      clientName,
    })
    return result?.narrative || null
  }, [callAPI])

  return {
    status,
    isAvailable: status?.available ?? false,
    isLoading,
    isStreaming,
    streamingContent,
    lastRagSources,
    lastAgentActions,
    lastAgentMeta,
    error,
    checkStatus,
    chatHistory,
    sendMessage,
    sendMessageStream,
    clearChat,
    currentThreadId,
    threads,
    threadsLoading,
    loadThreads,
    createThread,
    loadThread,
    deleteThread,
    renameThread,
    pinThread,
    newConversation,
    summarizeAppointment,
    generateEmail,
    analyzeProfile,
    enrichPreconisation,
    explainConcept,
    compareOptions,
    generateNarrative,
  }
}
