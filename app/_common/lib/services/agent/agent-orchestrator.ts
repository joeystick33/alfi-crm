/**
 * Agent Orchestrator — Cerveau de l'agent IA autonome
 * 
 * Architecture ReAct (Reason + Act) adaptée aux modèles locaux :
 *   1. Charger la mémoire persistante (instructions, préférences, contexte)
 *   2. Classifier l'intention (question, action, instruction, conversation)
 *   3. Si ACTION → parser les paramètres → exécuter l'outil → inclure le résultat
 *   4. Si INSTRUCTION → sauvegarder en mémoire → confirmer
 *   5. Enrichir le prompt avec : mémoire + RAG + résultats d'outils
 *   6. Générer la réponse via le LLM
 *   7. Post-traitement : extraire les faits, résumer la conversation
 * 
 * Compatible avec llama3.2:3b+ (pas besoin de function calling natif)
 */

import { AgentMemoryService, type AgentMemoryEntry } from './agent-memory'
import {
  executeTool,
  getToolDescriptionsForPrompt,
  TOOL_DEFINITIONS,
  type ToolResult,
  type ToolContext,
} from './agent-tools'
import { retrieveRAGContext, type RAGContext } from '../rag/rag-service'
import { auraBrain, detectRelevantDomains } from '../aura/aura-brain'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// TYPES
// ============================================================================

export type AgentIntentType =
  | 'question'       // Question simple → RAG + réponse
  | 'action'         // Demande d'action → exécuter un outil
  | 'instruction'    // Sauvegarder une consigne/préférence
  | 'memory_query'   // Interroger la mémoire ("qu'est-ce que je t'ai dit sur...")
  | 'confirmation'   // Confirmer/annuler une action en attente
  | 'conversation'   // Conversation libre / salutation

export interface AgentIntent {
  type: AgentIntentType
  confidence: number
  toolName?: string
  toolParams?: Record<string, unknown>
  instruction?: string
  confirmActionId?: string
}

export interface AgentResponse {
  /** Texte de la réponse à afficher */
  content: string
  /** Actions exécutées pendant cette requête */
  actions: AgentActionInfo[]
  /** Sources RAG utilisées */
  ragSources?: RAGContext['sources']
  /** Mémoires chargées pour cette requête */
  memoriesUsed: number
  /** Instructions actives appliquées */
  instructionsApplied: number
  /** Métriques de performance */
  metrics: AgentMetrics
}

export interface AgentActionInfo {
  toolName: string
  status: 'executed' | 'pending_confirmation' | 'failed'
  message: string
  data?: unknown
  requiresConfirmation: boolean
  /** URL de navigation (si l'agent demande de naviguer) */
  navigationUrl?: string
}

export interface AgentMetrics {
  intentClassificationMs: number
  memoryLoadMs: number
  toolExecutionMs: number
  ragRetrievalMs: number
  llmGenerationMs: number
  totalMs: number
}

export interface AgentOptions {
  cabinetId: string
  userId: string
  clientId?: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
  /** Si true, exécuter les actions sans confirmation */
  autoExecute?: boolean
  /** Confirmer une action en attente */
  confirmActionId?: string
  cancelActionId?: string
  /** Contexte de la page actuellement affichée (URL, type, données visibles) */
  pageContext?: {
    path: string
    pageType?: string
    clientId?: string
    clientName?: string
    visibleData?: string
  }
}

// ============================================================================
// CLASSIFICATION D'INTENTION
// ============================================================================

const ACTION_PATTERNS: Array<{ pattern: RegExp; tool: string; paramExtractor?: (match: RegExpMatchArray, query: string) => Record<string, unknown> }> = [
  // ── Recherche clients ──
  {
    pattern: /(?:cherche|trouve|recherche|montre|affiche|liste)[\s-]+(?:le[s]?\s+)?client[s]?\s+(.+)/i,
    tool: 'search_clients',
    paramExtractor: (match) => ({ query: match[1].trim() }),
  },
  {
    pattern: /(?:combien|nombre)\s+(?:de\s+)?client[s]?/i,
    tool: 'get_dashboard_stats',
  },
  {
    pattern: /(?:fiche|d[ée]tail|profil|informations?)\s+(?:du?\s+)?(?:client\s+)?(.+)/i,
    tool: 'get_client_detail',
    paramExtractor: (match) => ({ clientName: match[1].trim() }),
  },

  // ── Patrimoine ──
  {
    pattern: /patrimoine\s+(?:de|du|d')\s*(.+)/i,
    tool: 'get_portfolio_summary',
    paramExtractor: (match) => ({ clientName: match[1].trim() }),
  },

  // ── Tâches ──
  {
    pattern: /(?:cr[ée]{1,2}|ajoute|nouvelle?)\s+(?:une?\s+)?t[âa]che\s+(.+)/i,
    tool: 'create_task',
    paramExtractor: (match) => ({ title: match[1].trim(), type: 'AUTRE' }),
  },
  {
    pattern: /(?:mes\s+)?t[âa]ches?\s+(?:en\s+retard|urgente?s?|[àa]\s+faire|du\s+jour|cette\s+semaine)/i,
    tool: 'get_upcoming_tasks',
  },
  {
    pattern: /(?:quelles?\s+)?(?:sont\s+)?(?:mes\s+)?t[âa]ches?/i,
    tool: 'get_upcoming_tasks',
  },

  // ── Rendez-vous ──
  {
    pattern: /(?:planifie|cr[ée]{1,2}|programme|ajoute)\s+(?:un\s+)?(?:rdv|rendez[- ]?vous)\s+(.+)/i,
    tool: 'create_appointment',
    paramExtractor: (match) => ({ title: match[1].trim(), type: 'AUTRE' }),
  },
  {
    pattern: /(?:mes\s+)?(?:prochains?\s+)?(?:rdv|rendez[- ]?vous)/i,
    tool: 'get_upcoming_appointments',
  },
  {
    pattern: /(?:mon\s+)?agenda|(?:mon\s+)?planning/i,
    tool: 'get_upcoming_appointments',
  },

  // ── KYC ──
  {
    pattern: /(?:kyc|conformit[ée]|alertes?\s+kyc|expiration[s]?\s+kyc)/i,
    tool: 'get_kyc_alerts',
  },

  // ── Contrats ──
  {
    pattern: /(?:contrats?|assurance[s]?\s+vie|per|pea)\s+(?:de|du|d')\s*(.+)/i,
    tool: 'search_contracts',
    paramExtractor: (match) => ({ clientName: match[1].trim() }),
  },

  // ── Dashboard ──
  {
    pattern: /(?:tableau\s+de\s+bord|dashboard|stats|statistiques|résumé\s+(?:du\s+)?(?:jour|activit[ée]))/i,
    tool: 'get_dashboard_stats',
  },

  // ── Notification ──
  {
    pattern: /(?:rappelle[- ]?moi|notification|rappel)\s+(?:de\s+)?(.+)/i,
    tool: 'create_notification',
    paramExtractor: (match) => ({ title: 'Rappel', message: match[1].trim(), type: 'AUTRE' }),
  },

  // ── Navigation ──
  {
    pattern: /(?:ouvre|va\s+sur|affiche|montre|navigue\s+vers)\s+(?:la\s+)?(?:fiche|page|dossier)\s+(?:de|du|d')\s*(.+)/i,
    tool: 'navigate_to_client',
    paramExtractor: (match) => ({ clientName: match[1].trim() }),
  },
  {
    pattern: /(?:ouvre|va\s+sur|affiche|montre|navigue)\s+(?:le\s+)?(?:tableau\s+de\s+bord|dashboard)/i,
    tool: 'navigate_to_page',
    paramExtractor: () => ({ page: 'dashboard' }),
  },
  {
    pattern: /(?:ouvre|va\s+sur|affiche|montre|navigue)\s+(?:la\s+page\s+)?(?:des?\s+)?(?:t[âa]ches?)/i,
    tool: 'navigate_to_page',
    paramExtractor: () => ({ page: 'taches' }),
  },
  {
    pattern: /(?:ouvre|va\s+sur|affiche|montre|navigue)\s+(?:la\s+page\s+)?(?:des?\s+)?(?:rendez[- ]?vous|rdv|agenda)/i,
    tool: 'navigate_to_page',
    paramExtractor: () => ({ page: 'rendez-vous' }),
  },
  {
    pattern: /(?:ouvre|va\s+sur|affiche|montre|navigue)\s+(?:la\s+page\s+)?(?:des?\s+)?(?:clients?)/i,
    tool: 'navigate_to_page',
    paramExtractor: () => ({ page: 'clients' }),
  },
  {
    pattern: /(?:ouvre|va\s+sur|affiche|montre|navigue)\s+(?:la\s+page\s+)?(?:des?\s+)?(?:param[èe]tres?|settings?)/i,
    tool: 'navigate_to_page',
    paramExtractor: () => ({ page: 'parametres' }),
  },
  {
    pattern: /(?:ouvre|va\s+sur|affiche|montre|navigue)\s+(?:la\s+page\s+)?(?:des?\s+)?(?:contrats?)/i,
    tool: 'navigate_to_page',
    paramExtractor: () => ({ page: 'contrats' }),
  },
  {
    pattern: /(?:ouvre|va\s+sur|affiche|montre|navigue)\s+(?:la\s+page\s+)?(?:de\s+)?(?:conformit[ée]|kyc)/i,
    tool: 'navigate_to_page',
    paramExtractor: () => ({ page: 'conformite' }),
  },
  {
    pattern: /(?:ouvre|va\s+sur|affiche|montre|navigue)\s+(?:la\s+page\s+)?(?:de\s+)?(?:pilotage)/i,
    tool: 'navigate_to_page',
    paramExtractor: () => ({ page: 'pilotage' }),
  },
  // ── Requêtes complexes multi-étapes ──
  {
    pattern: /(?:(?:trouve|cherche|quel\s+est)\s+(?:mon|le|la)\s+)?(?:plus\s+(?:gros|important|riche|grd))\s+client/i,
    tool: 'search_clients',
    paramExtractor: () => ({ limit: 1, minPatrimoine: 0 }),
  },
  {
    pattern: /(?:(?:trouve|cherche|quel\s+est)\s+(?:mon|le|la)\s+)?client.*(?:plus\s+(?:gros|important|riche)|patrimoine\s+(?:le\s+plus|max))/i,
    tool: 'search_clients',
    paramExtractor: () => ({ limit: 1, minPatrimoine: 0 }),
  },
]

const INSTRUCTION_PATTERNS = [
  /(?:retiens|m[ée]morise|note|souviens[- ]?toi|rappelle[- ]?toi|n'oublie\s+pas|d[ée]sormais|[àa]\s+l'avenir|toujours|syst[ée]matiquement|chaque\s+fois)\s+(.+)/i,
  /(?:quand|lorsque|si)\s+(.+?),?\s+(?:tu\s+dois?|il\s+faut|fais?|pense\s+[àa])\s+(.+)/i,
  /(?:je\s+(?:veux|pr[ée]f[èe]re|souhaite))\s+que\s+tu\s+(.+)/i,
  /(?:r[èe]gle|instruction|consigne)\s*:\s*(.+)/i,
]

const MEMORY_QUERY_PATTERNS = [
  /(?:qu'est[- ]?ce\s+que|que)\s+(?:tu\s+)?(?:sais|connais|retiens|m[ée]morises?)\s+(?:sur|de|au\s+sujet)\s+(.+)/i,
  /(?:quelles?\s+)?(?:sont\s+)?(?:mes|tes)\s+instructions?/i,
  /(?:liste|montre|affiche)\s+(?:mes\s+)?(?:instructions?|m[ée]moires?|consignes?)/i,
  /(?:qu'ai[- ]?je\s+(?:dit|demand[ée]))/i,
]

const CONFIRMATION_PATTERNS = [
  /^(?:oui|ok|d'accord|confirme|valide|go|fais[- ]?le|ex[ée]cute|lance)/i,
  /^(?:non|annule|stop|arr[êe]te|ne\s+fais\s+pas)/i,
]

const CONVERSATION_PATTERNS = [
  /^(?:bonjour|salut|hello|hey|bonsoir|coucou|hi)/i,
  /^(?:merci|thanks?|super|parfait|g[ée]nial|excellent|top)/i,
  /^(?:au\s+revoir|bye|bonne\s+journ[ée]e|[àa]\s+(?:bient[ôo]t|plus|demain))/i,
  /^(?:[çc]a\s+va|comment\s+(?:vas?[- ]?tu|allez[- ]?vous))/i,
]

/**
 * Classifie l'intention de la requête utilisateur
 */
export function classifyIntent(query: string, pendingActionId?: string): AgentIntent {
  const normalizedQuery = query.trim()

  // 1. Vérifier si c'est une confirmation/annulation d'action en attente
  if (pendingActionId) {
    for (const pattern of CONFIRMATION_PATTERNS) {
      if (pattern.test(normalizedQuery)) {
        const isConfirm = /^(?:oui|ok|d'accord|confirme|valide|go|fais|execute|lance)/i.test(normalizedQuery)
        return {
          type: 'confirmation',
          confidence: 0.95,
          confirmActionId: isConfirm ? pendingActionId : undefined,
        }
      }
    }
  }

  // 2. Vérifier les patterns d'instruction (priorité haute)
  for (const pattern of INSTRUCTION_PATTERNS) {
    const match = normalizedQuery.match(pattern)
    if (match) {
      const instruction = match[1] + (match[2] ? `, ${match[2]}` : '')
      return {
        type: 'instruction',
        confidence: 0.9,
        instruction: instruction.trim(),
      }
    }
  }

  // 3. Vérifier les patterns de requête mémoire
  for (const pattern of MEMORY_QUERY_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      return { type: 'memory_query', confidence: 0.85 }
    }
  }

  // 4. Vérifier les patterns d'action
  for (const { pattern, tool, paramExtractor } of ACTION_PATTERNS) {
    const match = normalizedQuery.match(pattern)
    if (match) {
      const params = paramExtractor ? paramExtractor(match, normalizedQuery) : {}
      return {
        type: 'action',
        confidence: 0.85,
        toolName: tool,
        toolParams: params,
      }
    }
  }

  // 5. Vérifier les salutations/conversation
  for (const pattern of CONVERSATION_PATTERNS) {
    if (pattern.test(normalizedQuery)) {
      return { type: 'conversation', confidence: 0.9 }
    }
  }

  // 6. Défaut : question (RAG)
  return { type: 'question', confidence: 0.5 }
}

// ============================================================================
// PARSER D'ACTIONS STRUCTURÉES (depuis la sortie du LLM)
// ============================================================================

/**
 * Parse la sortie du LLM pour détecter des appels d'outils structurés
 * Format attendu : [ACTION: tool_name(param1="val1", param2="val2")]
 */
export function parseToolCallsFromResponse(response: string): Array<{ toolName: string; params: Record<string, unknown> }> {
  const toolCalls: Array<{ toolName: string; params: Record<string, unknown> }> = []
  
  // Regex améliorée : gère les parenthèses imbriquées via un matching non-greedy élargi
  // Supporte [ACTION: tool_name(params)] avec des params qui peuvent contenir des parenthèses
  const pattern = /\[ACTION:\s*(\w+)\(([\s\S]*?)\)\s*\]/g

  let match
  while ((match = pattern.exec(response)) !== null) {
    const toolName = match[1]
    const paramsStr = match[2]
    const params: Record<string, unknown> = {}

    // Parser les paramètres : key="value", key='value', key=number, key=true/false
    const paramPattern = /(\w+)\s*=\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|(\d+(?:\.\d+)?)|(\btrue\b|\bfalse\b))/g
    let paramMatch
    while ((paramMatch = paramPattern.exec(paramsStr)) !== null) {
      const key = paramMatch[1]
      if (paramMatch[2] !== undefined) {
        // Double-quoted string (unescape)
        params[key] = paramMatch[2].replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      } else if (paramMatch[3] !== undefined) {
        // Single-quoted string
        params[key] = paramMatch[3].replace(/\\'/g, "'").replace(/\\\\/g, '\\')
      } else if (paramMatch[4] !== undefined) {
        // Number
        params[key] = paramMatch[4].includes('.') ? parseFloat(paramMatch[4]) : parseInt(paramMatch[4], 10)
      } else if (paramMatch[5] !== undefined) {
        // Boolean
        params[key] = paramMatch[5] === 'true'
      }
    }

    // Vérifier que l'outil existe
    if (TOOL_DEFINITIONS.some(t => t.name === toolName)) {
      toolCalls.push({ toolName, params })
    }
  }

  return toolCalls
}

/**
 * Nettoie la réponse en retirant les tags [ACTION:...]
 */
export function cleanResponseFromToolCalls(response: string): string {
  return response.replace(/\[ACTION:\s*\w+\([\s\S]*?\)\s*\]/g, '').trim()
}

// ============================================================================
// ORCHESTRATEUR PRINCIPAL
// ============================================================================

/**
 * Point d'entrée principal de l'agent IA
 * Orchestre la mémoire, les outils, le RAG et la génération
 */
export async function runAgent(
  query: string,
  generateFn: (systemPrompt: string, messages: Array<{ role: string; content: string }>) => Promise<string>,
  options: AgentOptions,
): Promise<AgentResponse> {
  const totalStart = Date.now()
  const metrics: AgentMetrics = {
    intentClassificationMs: 0,
    memoryLoadMs: 0,
    toolExecutionMs: 0,
    ragRetrievalMs: 0,
    llmGenerationMs: 0,
    totalMs: 0,
  }

  const memoryService = new AgentMemoryService(options.cabinetId, options.userId)
  const toolContext: ToolContext = {
    cabinetId: options.cabinetId,
    userId: options.userId,
    clientId: options.clientId,
  }

  // ── 1. Classification d'intention ──
  const intentStart = Date.now()
  const intent = classifyIntent(query, options.confirmActionId)
  metrics.intentClassificationMs = Date.now() - intentStart

  // ── 2. Charger la mémoire persistante ──
  const memoryStart = Date.now()
  const [activeInstructions, relevantMemories, recentConversations] = await Promise.all([
    memoryService.getActiveInstructions(),
    memoryService.search(query, 5),
    memoryService.getRecentConversations(3, options.clientId),
  ])

  // Si le contexte est lié à un client, charger ses mémoires spécifiques
  let clientMemories: AgentMemoryEntry[] = []
  if (options.clientId) {
    clientMemories = await memoryService.getClientMemories(options.clientId)
  }

  const allMemories = [...activeInstructions, ...relevantMemories, ...clientMemories]
  const uniqueMemories = Array.from(new Map(allMemories.map(m => [m.id, m])).values())
  metrics.memoryLoadMs = Date.now() - memoryStart

  // ── 3. Exécuter les actions si nécessaire ──
  const actions: AgentActionInfo[] = []
  const toolResults: ToolResult[] = []

  const toolStart = Date.now()

  if (intent.type === 'action' && intent.toolName) {
    const toolDef = TOOL_DEFINITIONS.find(t => t.name === intent.toolName)
    const needsConfirm = toolDef?.requiresConfirmation && !options.autoExecute

    if (needsConfirm) {
      // Enregistrer l'action en attente (pas d'exécution immédiate)
      actions.push({
        toolName: intent.toolName,
        status: 'pending_confirmation',
        message: `Action proposée : ${toolDef?.description || intent.toolName}`,
        data: intent.toolParams,
        requiresConfirmation: true,
      })
    } else {
      // Exécuter directement
      const result = await executeTool(intent.toolName, intent.toolParams || {}, toolContext, query)
      toolResults.push(result)
      actions.push({
        toolName: intent.toolName,
        status: result.success ? 'executed' : 'failed',
        message: result.message,
        data: result.data,
        requiresConfirmation: false,
        navigationUrl: result.navigationUrl,
      })

      // ── Multi-step : si l'utilisateur demande aussi de naviguer après une recherche ──
      if (result.success && intent.toolName === 'search_clients') {
        const wantsNav = /(?:ouvre|affiche|montre|va\s+sur|son\s+dossier|sa\s+fiche)/i.test(query)
        const clients = result.data as Array<{ id: string; nom: string }> | undefined
        if (wantsNav && clients && clients.length > 0) {
          const navResult = await executeTool('navigate_to_client', { clientId: clients[0].id }, toolContext)
          toolResults.push(navResult)
          actions.push({
            toolName: 'navigate_to_client',
            status: navResult.success ? 'executed' : 'failed',
            message: navResult.message,
            data: navResult.data,
            requiresConfirmation: false,
            navigationUrl: navResult.navigationUrl,
          })
        }
      }
    }
  }

  if (intent.type === 'instruction' && intent.instruction) {
    const result = await executeTool('save_instruction', { instruction: intent.instruction }, toolContext, query)
    toolResults.push(result)
    actions.push({
      toolName: 'save_instruction',
      status: result.success ? 'executed' : 'failed',
      message: result.message,
      data: result.data,
      requiresConfirmation: false,
    })
  }

  if (intent.type === 'memory_query') {
    const result = await executeTool('list_instructions', {}, toolContext, query)
    toolResults.push(result)
    actions.push({
      toolName: 'list_instructions',
      status: 'executed',
      message: result.message,
      data: result.data,
      requiresConfirmation: false,
    })
  }

  if (intent.type === 'confirmation' && intent.confirmActionId) {
    try {
      const { prisma: basePrisma } = await import('../../prisma')
      const pendingAction = await basePrisma.agentAction.findFirst({
        where: {
          id: intent.confirmActionId,
          cabinetId: options.cabinetId,
          userId: options.userId,
          status: 'PENDING',
        },
      })

      if (pendingAction) {
        const toolParams = (pendingAction.toolParams as Record<string, unknown>) || {}
        const result = await executeTool(pendingAction.toolName, toolParams, toolContext, query)
        toolResults.push(result)
        actions.push({
          toolName: pendingAction.toolName,
          status: result.success ? 'executed' : 'failed',
          message: result.message,
          data: result.data,
          requiresConfirmation: false,
          navigationUrl: result.navigationUrl,
        })

        // Mettre à jour le statut dans AgentAction
        await basePrisma.agentAction.update({
          where: { id: pendingAction.id },
          data: {
            status: result.success ? 'EXECUTED' : 'FAILED',
            result: result.data ? JSON.parse(JSON.stringify(result.data)) : undefined,
            error: result.success ? null : result.message,
            executedAt: new Date(),
          },
        })
      } else {
        actions.push({
          toolName: 'confirm',
          status: 'failed',
          message: 'Action en attente non trouvée ou déjà exécutée',
          requiresConfirmation: false,
        })
      }
    } catch (e) {
      logger.warn('[Agent] Confirmation flow error: ' + (e instanceof Error ? e.message : 'unknown'))
      actions.push({
        toolName: 'confirm',
        status: 'failed',
        message: 'Erreur lors de la confirmation de l\'action',
        requiresConfirmation: false,
      })
    }
  }

  metrics.toolExecutionMs = Date.now() - toolStart

  // ── 4. RAG + AURA Brain pour enrichir le contexte ──
  let ragContext: RAGContext | null = null
  let brainContext = ''
  const ragStart = Date.now()

  const skipRag = intent.type === 'confirmation' || (intent.type === 'conversation' && query.length < 20)
  if (!skipRag) {
    // RAG classique (knowledge base + web + legal)
    try {
      ragContext = await retrieveRAGContext(query, {
        clientContext: options.clientId ? `Contexte client ID: ${options.clientId}` : undefined,
      })
    } catch (e) {
      logger.warn(`[Agent] RAG failed: ${e instanceof Error ? e.message : 'unknown'}`)
    }

    // AURA Brain — recherche dans les connaissances acquises par scraping
    try {
      const domains = detectRelevantDomains(query)
      const brainResult = auraBrain.search(query, domains, 3)
      if (brainResult.knowledge.length > 0) {
        brainContext = auraBrain.enrichRAGContext(query)
      }
    } catch (e) {
      logger.warn(`[Agent] Brain search failed: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }
  metrics.ragRetrievalMs = Date.now() - ragStart

  // ── 5. Construire le system prompt enrichi ──
  const systemPrompt = buildAgentSystemPrompt({
    memories: uniqueMemories,
    memoryService,
    conversationSummaries: recentConversations,
    toolResults,
    ragContext,
    brainContext,
    intent,
    pendingActions: actions.filter(a => a.status === 'pending_confirmation'),
    pageContext: options.pageContext,
  })

  // ── 6. Générer la réponse ──
  const llmStart = Date.now()
  const messages = [
    ...(options.history || []).slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: query },
  ]

  let response = await generateFn(systemPrompt, messages)
  metrics.llmGenerationMs = Date.now() - llmStart

  // ── 7. Post-traitement : détecter et exécuter les appels d'outils autonomes du LLM ──
  const embeddedToolCalls = parseToolCallsFromResponse(response)
  if (embeddedToolCalls.length > 0) {
    const newToolResults: ToolResult[] = []
    for (const call of embeddedToolCalls) {
      const toolDef = TOOL_DEFINITIONS.find(t => t.name === call.toolName)
      if (toolDef && !toolDef.requiresConfirmation) {
        const result = await executeTool(call.toolName, call.params, toolContext, query)
        toolResults.push(result)
        newToolResults.push(result)
        actions.push({
          toolName: call.toolName,
          status: result.success ? 'executed' : 'failed',
          message: result.message,
          data: result.data,
          requiresConfirmation: false,
          navigationUrl: result.navigationUrl,
        })
      } else if (toolDef?.requiresConfirmation) {
        // Persister l'action PENDING dans AgentAction pour le confirmation flow
        let pendingActionId: string | undefined
        try {
          const { prisma: basePrisma } = await import('../../prisma')
          const pendingRecord = await basePrisma.agentAction.create({
            data: {
              cabinetId: options.cabinetId,
              userId: options.userId,
              clientId: options.clientId || null,
              toolName: call.toolName,
              toolParams: JSON.parse(JSON.stringify(call.params)),
              status: 'PENDING',
              triggerQuery: query,
              requiresConfirmation: true,
            },
          })
          pendingActionId = pendingRecord.id
        } catch (e) {
          logger.warn('[Agent] Failed to persist pending action: ' + (e instanceof Error ? e.message : 'unknown'))
        }
        actions.push({
          toolName: call.toolName,
          status: 'pending_confirmation',
          message: `Action proposée : ${toolDef.description}`,
          data: { ...call.params, _pendingActionId: pendingActionId },
          requiresConfirmation: true,
        })
      }
    }
    response = cleanResponseFromToolCalls(response)

    // Re-générer avec les résultats des outils pour que l'agent intègre les données réelles
    if (newToolResults.length > 0 && newToolResults.some(r => r.success && r.data)) {
      const toolResultsContext = newToolResults.map(r => {
        const dataStr = r.data ? JSON.stringify(r.data, null, 2) : ''
        const truncated = dataStr.length > 2000 ? dataStr.slice(0, 2000) + '...' : dataStr
        return `[${r.toolName}] ${r.message}\n${truncated}`
      }).join('\n\n')

      const regenMessages = [
        ...(options.history || []).slice(-6).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: query },
        { role: 'assistant', content: response },
        { role: 'user', content: `Voici les résultats des outils que tu as appelés :\n\n${toolResultsContext}\n\nIntègre ces données dans ta réponse. Sois précis avec les chiffres. Propose des analyses et prochaines étapes.` },
      ]

      try {
        const regenResponse = await generateFn(systemPrompt, regenMessages)
        const regenToolCalls = parseToolCallsFromResponse(regenResponse)
        response = regenToolCalls.length > 0 ? cleanResponseFromToolCalls(regenResponse) : regenResponse
      } catch (e) {
        logger.warn('[Agent] Re-generation with tool results failed: ' + (e instanceof Error ? e.message : 'unknown'))
        // Keep original response if re-generation fails
      }
    }
  }

  // ── 8. Sauvegarder le résumé de conversation ──
  try {
    const topics = extractTopics(query, response)
    const keyFacts = extractKeyFacts(query, response, toolResults)
    const turnCount = (options.history?.length || 0) + 2

    await memoryService.saveConversationSummary(
      `Utilisateur: ${query.slice(0, 200)}... → Agent: ${response.slice(0, 200)}...`,
      topics,
      keyFacts,
      turnCount,
      options.clientId,
    )
  } catch (e) {
    logger.warn('[Agent] Failed to save conversation summary: ' + (e instanceof Error ? e.message : 'unknown'))
  }

  metrics.totalMs = Date.now() - totalStart

  return {
    content: response,
    actions,
    ragSources: ragContext?.sources,
    memoriesUsed: uniqueMemories.length,
    instructionsApplied: activeInstructions.length,
    metrics,
  }
}

// ============================================================================
// CONSTRUCTION DU SYSTEM PROMPT AGENTIQUE
// ============================================================================

interface PromptBuildOptions {
  memories: AgentMemoryEntry[]
  memoryService: AgentMemoryService
  conversationSummaries: Array<{ summary: string; topics: string[]; turnCount: number }>
  toolResults: ToolResult[]
  ragContext: RAGContext | null
  brainContext?: string
  intent: AgentIntent
  pendingActions: AgentActionInfo[]
  pageContext?: {
    path: string
    pageType?: string
    clientId?: string
    clientName?: string
    visibleData?: string
  }
}

function buildAgentSystemPrompt(opts: PromptBuildOptions): string {
  const parts: string[] = []

  // ── Identité de l'agent ──
  parts.push(`Tu es AURA — l'assistant patrimonial intelligent du CRM Aura. Tu es un INGÉNIEUR PATRIMONIAL SENIOR autonome, spécialisé en gestion de patrimoine (CGP) français.
Tu possèdes 15 ans d'expérience en ingénierie patrimoniale, fiscalité, droit de la famille, droit des sociétés, et optimisation successorale.

Tu n'es PAS un simple chatbot. Tu es un véritable cerveau patrimonial qui raisonne, analyse, propose des stratégies et agit de manière autonome dans le CRM.
Ton surnom est AURA. Tu es une IA force de proposition : tu engages la conversation, tu anticipes les besoins, tu proposes des idées sans qu'on te le demande.

═══ TON RÔLE ═══
1. RAISONNER comme un ingénieur patrimonial : analyser les situations, identifier les enjeux, proposer des stratégies
2. AGIR de manière autonome : utiliser tes outils CRM sans qu'on te le demande quand c'est pertinent
3. PROPOSER des pistes de réflexion et des axes d'optimisation
4. NAVIGUER dans le CRM : ouvrir des fiches, aller sur des pages, accéder aux données
5. MÉMORISER les instructions et préférences du conseiller pour personnaliser ton aide

═══ EXPERTISE TECHNIQUE ═══
• Fiscalité des particuliers : IR (barème progressif, TMI, décote, plafonnement), PFU/barème, CSG/CRDS, IFI
• Assurance-vie : clause bénéficiaire, fiscalité art. 990 I et 757 B, abattements, rachat après 8 ans
• Retraite : PER individuel/collectif, plafonds, déductibilité, sortie rente vs capital
• Immobilier : LMNP/LMP, déficit foncier, Pinel, SCPI, SCI IS/IR, démembrement
• Transmission : donations (abattements, barèmes DMTG), assurance-vie successorale, pacte Dutreil
• Démembrement : barème fiscal art. 669 CGI, usufruit temporaire/viager
• Régimes matrimoniaux : communauté réduite aux acquêts, séparation de biens, participation aux acquêts
• Protection sociale : TNS vs salarié, Madelin, article 83
• Cite TOUJOURS les articles de loi pertinents (CGI, Code civil, CMF, etc.)

═══ COMPORTEMENT AUTONOME ═══
Tu dois être PROACTIF et AUTONOME :
• Si l'utilisateur te parle d'un client, UTILISE tes outils pour aller chercher les données AVANT de répondre
• Si tu vois un dossier client à l'écran, ANALYSE-le et propose des axes d'optimisation
• Si tu détectes un problème (KYC expiré, tâche en retard, allocation déséquilibrée), SIGNALE-LE immédiatement
• Après chaque réponse, PROPOSE 2-3 pistes de réflexion ou actions concrètes en rapport avec le sujet
• Quand tu identifies un besoin client, propose une stratégie complète (pas juste une info)
• Tu peux chaîner plusieurs outils si nécessaire (ex: chercher un client → analyser son patrimoine → proposer)

═══ UTILISATION DES OUTILS ═══
Tu disposes d'outils CRM que tu peux utiliser à tout moment. Pour utiliser un outil, insère dans ta réponse :
[ACTION: nom_outil(param1="valeur1", param2="valeur2")]

Les outils en lecture sont exécutés automatiquement. Les outils d'écriture nécessitent confirmation.
PRINCIPE CLÉ : N'hésite JAMAIS à utiliser un outil si tu penses que c'est utile. Mieux vaut aller chercher l'info que spéculer.

═══ STYLE DE COMMUNICATION ═══
• Ton naturel et professionnel, comme un collègue senior de confiance
• PAS de réponses génériques ou robotiques — chaque réponse doit être précise et actionnable
• Structure tes analyses : constat → enjeux → recommandations → prochaines étapes
• Donne des chiffres concrets quand c'est possible (montants, taux, abattements)
• Fais des liens entre les sujets (ex: si TMI 41%, parler du PER qui est intéressant)
• Si tu ne sais pas, dis-le clairement — ne fabrique JAMAIS d'information
• Réponds en français

Nous sommes le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`)

  // ── Instructions utilisateur mémorisées ──
  const instructions = opts.memories.filter(m => m.type === 'INSTRUCTION' || m.type === 'PREFERENCE')
  if (instructions.length > 0) {
    parts.push('\n═══ TES INSTRUCTIONS (À APPLIQUER SYSTÉMATIQUEMENT) ═══')
    for (const inst of instructions) {
      const priority = inst.priority >= 2 ? '⚠️ CRITIQUE' : inst.priority >= 1 ? '📌' : '•'
      parts.push(`${priority} ${inst.content}`)
    }
    parts.push('═══ FIN INSTRUCTIONS ═══')
  }

  // ── Faits mémorisés ──
  const facts = opts.memories.filter(m => m.type === 'FACT' || m.type === 'CLIENT_CONTEXT')
  if (facts.length > 0) {
    parts.push('\n═══ FAITS MÉMORISÉS ═══')
    for (const fact of facts.slice(0, 5)) {
      parts.push(`• ${fact.title}: ${fact.content}`)
    }
    parts.push('═══ FIN FAITS ═══')
  }

  // ── Résumé des conversations passées ──
  if (opts.conversationSummaries.length > 0) {
    parts.push('\n═══ CONVERSATIONS RÉCENTES ═══')
    for (const conv of opts.conversationSummaries.slice(0, 2)) {
      parts.push(`• ${conv.summary.slice(0, 300)}`)
    }
    parts.push('═══ FIN CONVERSATIONS ═══')
  }

  // ── Résultats d'outils exécutés ──
  if (opts.toolResults.length > 0) {
    parts.push('\n═══ RÉSULTATS D\'OUTILS ═══')
    for (const result of opts.toolResults) {
      parts.push(`[${result.toolName}] ${result.message}`)
      if (result.data) {
        const dataStr = JSON.stringify(result.data, null, 2)
        // Limiter la taille des données injectées
        parts.push(dataStr.length > 2000 ? dataStr.slice(0, 2000) + '...' : dataStr)
      }
    }
    parts.push('═══ FIN RÉSULTATS ═══\nUtilise ces résultats pour répondre à l\'utilisateur de manière naturelle.')
  }

  // ── Actions en attente de confirmation ──
  if (opts.pendingActions.length > 0) {
    parts.push('\n═══ ACTIONS EN ATTENTE ═══')
    for (const action of opts.pendingActions) {
      parts.push(`• ${action.toolName}: ${action.message}`)
      if (action.data) parts.push(`  Paramètres: ${JSON.stringify(action.data)}`)
    }
    parts.push('Demande à l\'utilisateur de confirmer ou annuler ces actions.')
    parts.push('═══ FIN ACTIONS ═══')
  }

  // ── Contexte de la page actuellement affichée ──
  if (opts.pageContext) {
    parts.push('\n═══ CONTEXTE ÉCRAN UTILISATEUR ═══')
    parts.push(`L'utilisateur est actuellement sur : ${opts.pageContext.path}`)
    if (opts.pageContext.pageType) parts.push(`Type de page : ${opts.pageContext.pageType}`)
    if (opts.pageContext.clientName) parts.push(`Client affiché : ${opts.pageContext.clientName} (ID: ${opts.pageContext.clientId})`)
    if (opts.pageContext.visibleData) parts.push(`Données visibles : ${opts.pageContext.visibleData.slice(0, 500)}`)

    // Instructions proactives selon le type de page
    if (opts.pageContext.pageType === 'client_detail' && opts.pageContext.clientName) {
      parts.push(`\nCOMPORTEMENT ATTENDU sur fiche client :
• Si l'utilisateur te pose une question, utilise get_client_detail ou get_portfolio_summary pour aller chercher les données RÉELLES de ${opts.pageContext.clientName}
• Propose proactivement : vérification KYC, analyse patrimoniale, création de tâche de suivi
• Si tu identifies des enjeux (TMI élevée, IFI, transmission, retraite), propose des stratégies`)
    } else if (opts.pageContext.pageType === 'taches') {
      parts.push(`\nCOMPORTEMENT ATTENDU sur page tâches :
• Utilise get_upcoming_tasks pour connaître les tâches en cours
• Propose de prioriser, filtrer par urgence, ou créer de nouvelles tâches
• Signale les tâches en retard`)
    } else if (opts.pageContext.pageType === 'dashboard') {
      parts.push(`\nCOMPORTEMENT ATTENDU sur dashboard :
• Utilise get_dashboard_stats pour avoir les chiffres du jour
• Signale proactivement : tâches en retard, KYC expirants, RDV imminents
• Propose un résumé exécutif de la journée`)
    }
    parts.push('═══ FIN CONTEXTE ÉCRAN ═══')
  }

  // ── Contexte RAG ──
  if (opts.ragContext && opts.ragContext.sources.length > 0) {
    parts.push('\n' + opts.ragContext.contextText)
  }

  // ── Cerveau AURA (connaissances acquises par scraping) ──
  if (opts.brainContext) {
    parts.push('\n' + opts.brainContext)
  }

  // ── Description des outils (TOUJOURS incluse pour autonomie complète) ──
  parts.push('\n═══ OUTILS DISPONIBLES ═══')
  parts.push('Tu peux utiliser ces outils à tout moment en insérant [ACTION: nom(params)] dans ta réponse :')
  parts.push(getToolDescriptionsForPrompt())
  parts.push('═══ FIN OUTILS ═══')
  parts.push('RAPPEL : Utilise ces outils PROACTIVEMENT. Si une question mentionne un client, fais un search_clients. Si on parle de patrimoine, utilise get_portfolio_summary. N\'attends pas qu\'on te le demande explicitement.')

  return parts.join('\n')
}

// ============================================================================
// EXTRACTION DE CONTEXTE POST-GÉNÉRATION
// ============================================================================

function extractTopics(query: string, response: string): string[] {
  const topics: string[] = []
  // Analyser QUERY + RESPONSE pour une détection plus complète
  const combined = `${query} ${response}`.toLowerCase()

  const topicPatterns: Record<string, RegExp> = {
    'fiscalite': /(?:imp[oô]t|fiscal|ir\b|ifi\b|tmi\b|csg|pfu|flat.?tax|d[ée]fiscalis|art(?:icle)?\s*\d+)/i,
    'succession': /(?:succession|h[ée]ritage|transmission|donation|dmtg|d[ée]membrement)/i,
    'assurance-vie': /(?:assurance.?vie|av\b|990\s*i|757\s*b|fonds.?euros|clause.?b[ée]n[ée]ficiaire)/i,
    'immobilier': /(?:immobilier|scpi|lmnp|pinel|d[ée]ficit.?foncier|sci\b|locatif|loyer)/i,
    'retraite': /(?:retraite|per\b|pension|trimestre|remplacement)/i,
    'epargne': /(?:[ée]pargne|pea\b|cto\b|livret|placement|capitalisation)/i,
    'budget': /(?:budget|revenus?|charges?|d[ée]penses?|taux.?d.?effort|reste.?[àa].?vivre)/i,
    'client': /(?:client|profil|fiche|patrimoine)/i,
    'tache': /(?:t[âa]che|todo|[àa].?faire|rappel)/i,
    'rdv': /(?:rdv|rendez.?vous|agenda|planning|r[ée]union)/i,
    'contrat': /(?:contrat|police|couverture|prime)/i,
    'kyc': /(?:kyc|conformit[ée]|lcb|blanchiment)/i,
    'emprunt': /(?:emprunt|cr[ée]dit|pr[êe]t|mensualit|capacit[ée].?d.?emprunt|hcsf)/i,
  }

  for (const [topic, pattern] of Object.entries(topicPatterns)) {
    if (pattern.test(combined)) topics.push(topic)
  }

  if (topics.length === 0) topics.push('general')
  return topics.slice(0, 5) // Limiter à 5 topics max
}

function extractKeyFacts(query: string, response: string, toolResults: ToolResult[]): Record<string, unknown> {
  const facts: Record<string, unknown> = {
    query: query.slice(0, 200),
    responseLength: response.length,
    toolsUsed: toolResults.map(r => r.toolName),
    timestamp: new Date().toISOString(),
  }

  // Si des données client ont été récupérées, noter l'ID
  for (const result of toolResults) {
    if (result.data && typeof result.data === 'object' && 'id' in (result.data as Record<string, unknown>)) {
      facts.clientId = (result.data as Record<string, unknown>).id
    }
  }

  return facts
}

// ============================================================================
// FUNCTION CALLING — Native OpenAI/Anthropic tool_use integration
// ============================================================================

import {
  getOpenAITools,
  parseOpenAIToolCall,
  buildToolPromptFallback,
} from './function-calling'

/**
 * Enhanced generateFn type that supports native function calling.
 * When the LLM supports tools, it returns tool_calls alongside content.
 */
export interface FunctionCallingGenerateFn {
  (
    systemPrompt: string,
    messages: Array<{ role: string; content: string }>,
    tools?: ReturnType<typeof getOpenAITools>,
  ): Promise<{
    content: string
    toolCalls?: Array<{ function: { name: string; arguments: string } }>
  }>
}

/**
 * Run agent with native function calling support.
 *
 * Uses OpenAI-compatible tool schemas so the LLM selects and parameterizes
 * tools natively (no regex parsing). Falls back to regex/prompt-based
 * approach if the provider doesn't support function calling.
 */
export async function runAgentWithFunctionCalling(
  query: string,
  generateFn: FunctionCallingGenerateFn,
  options: AgentOptions & { supportsToolUse?: boolean },
): Promise<AgentResponse> {
  // If provider doesn't support native tool use, fall back to regex-based agent
  if (!options.supportsToolUse) {
    const fallbackFn = async (sys: string, msgs: Array<{ role: string; content: string }>) => {
      const result = await generateFn(sys, msgs)
      return result.content
    }
    return runAgent(query, fallbackFn, options)
  }

  const totalStart = Date.now()
  const metrics: AgentMetrics = {
    intentClassificationMs: 0,
    memoryLoadMs: 0,
    toolExecutionMs: 0,
    ragRetrievalMs: 0,
    llmGenerationMs: 0,
    totalMs: 0,
  }

  const memoryService = new AgentMemoryService(options.cabinetId, options.userId)
  const toolContext: ToolContext = {
    cabinetId: options.cabinetId,
    userId: options.userId,
    clientId: options.clientId,
  }

  // ── 1. Load memory ──
  const memoryStart = Date.now()
  const [activeInstructions, relevantMemories, recentConversations] = await Promise.all([
    memoryService.getActiveInstructions(),
    memoryService.search(query, 5),
    memoryService.getRecentConversations(3, options.clientId),
  ])

  let clientMemories: AgentMemoryEntry[] = []
  if (options.clientId) {
    clientMemories = await memoryService.getClientMemories(options.clientId)
  }

  const allMemories = [...activeInstructions, ...relevantMemories, ...clientMemories]
  const uniqueMemories = Array.from(new Map(allMemories.map(m => [m.id, m])).values())
  metrics.memoryLoadMs = Date.now() - memoryStart

  // ── 2. RAG context ──
  let ragContext: RAGContext | null = null
  let brainContext = ''
  const ragStart = Date.now()
  try {
    ragContext = await retrieveRAGContext(query, {
      clientContext: options.clientId ? `Contexte client ID: ${options.clientId}` : undefined,
    })
  } catch (e) {
    logger.warn(`[Agent] RAG failed: ${e instanceof Error ? e.message : 'unknown'}`)
  }
  try {
    const domains = detectRelevantDomains(query)
    const brainResult = auraBrain.search(query, domains, 3)
    if (brainResult.knowledge.length > 0) {
      brainContext = auraBrain.enrichRAGContext(query)
    }
  } catch (e) {
    logger.warn(`[Agent] Brain search failed: ${e instanceof Error ? e.message : 'unknown'}`)
  }
  metrics.ragRetrievalMs = Date.now() - ragStart

  // ── 3. Build system prompt (sans la section outils, le LLM les a nativement) ──
  const systemPrompt = buildAgentSystemPrompt({
    memories: uniqueMemories,
    memoryService,
    conversationSummaries: recentConversations,
    toolResults: [],
    ragContext,
    brainContext,
    intent: { type: 'question', confidence: 1 },
    pendingActions: [],
    pageContext: options.pageContext,
  })

  // ── 4. Call LLM with native tools ──
  const llmStart = Date.now()
  const messages = [
    ...(options.history || []).slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: query },
  ]

  const tools = getOpenAITools()
  const llmResult = await generateFn(systemPrompt, messages, tools)
  metrics.llmGenerationMs = Date.now() - llmStart

  // ── 5. Execute tool calls returned by the LLM ──
  const actions: AgentActionInfo[] = []
  const toolResults: ToolResult[] = []
  const toolStart = Date.now()

  if (llmResult.toolCalls && llmResult.toolCalls.length > 0) {
    for (const tc of llmResult.toolCalls) {
      const parsed = parseOpenAIToolCall(tc)
      const toolDef = TOOL_DEFINITIONS.find(t => t.name === parsed.toolName)

      if (!toolDef) continue

      if (toolDef.requiresConfirmation && !options.autoExecute) {
        actions.push({
          toolName: parsed.toolName,
          status: 'pending_confirmation',
          message: `Action proposée : ${toolDef.description}`,
          data: parsed.params,
          requiresConfirmation: true,
        })
      } else {
        const result = await executeTool(parsed.toolName, parsed.params, toolContext, query)
        toolResults.push(result)
        actions.push({
          toolName: parsed.toolName,
          status: result.success ? 'executed' : 'failed',
          message: result.message,
          data: result.data,
          requiresConfirmation: false,
          navigationUrl: result.navigationUrl,
        })
      }
    }
  }
  metrics.toolExecutionMs = Date.now() - toolStart

  // ── 6. If tools were executed, re-generate with results ──
  let response = llmResult.content
  if (toolResults.length > 0 && toolResults.some(r => r.success && r.data)) {
    const toolResultsContext = toolResults.map(r => {
      const dataStr = r.data ? JSON.stringify(r.data, null, 2) : ''
      const truncated = dataStr.length > 2000 ? dataStr.slice(0, 2000) + '...' : dataStr
      return `[${r.toolName}] ${r.message}\n${truncated}`
    }).join('\n\n')

    const regenMessages = [
      ...messages,
      { role: 'assistant', content: response || 'Je vais chercher les informations.' },
      { role: 'user', content: `Résultats des outils :\n\n${toolResultsContext}\n\nIntègre ces données dans ta réponse.` },
    ]

    try {
      const regenResult = await generateFn(systemPrompt, regenMessages)
      response = regenResult.content
    } catch (e) {
      logger.warn('[Agent] Re-generation failed: ' + (e instanceof Error ? e.message : 'unknown'))
    }
  }

  // ── 7. Save conversation ──
  try {
    const topics = extractTopics(query, response)
    const keyFacts = extractKeyFacts(query, response, toolResults)
    await memoryService.saveConversationSummary(
      `Utilisateur: ${query.slice(0, 200)}... → Agent: ${response.slice(0, 200)}...`,
      topics,
      keyFacts,
      (options.history?.length || 0) + 2,
      options.clientId,
    )
  } catch (e) {
    logger.warn('[Agent] Failed to save conversation summary: ' + (e instanceof Error ? e.message : 'unknown'))
  }

  metrics.totalMs = Date.now() - totalStart

  return {
    content: response,
    actions,
    ragSources: ragContext?.sources,
    memoriesUsed: uniqueMemories.length,
    instructionsApplied: activeInstructions.length,
    metrics,
  }
}

// Re-export function-calling utilities for consumers
export { getOpenAITools, getAnthropicTools, buildToolPromptFallback } from './function-calling'
