/**
 * AURA V2 — Agent Runtime
 * 
 * Orchestrateur principal du cycle de vie d'un Run :
 * 1. Intent Classification
 * 2. Memory Retrieval
 * 3. Planning (Planner Agent)
 * 4. Execution (Executor Agent) 
 * 5. Critic Evaluation
 * 6. Response Formatting
 * 7. Persistence
 * 
 * Architecture : Orchestrateur → Planner → Executor → Critic
 * Le backend est TOUJOURS la source de vérité.
 * Le LLM orchestre, ne calcule JAMAIS, n'invente JAMAIS.
 */

import { randomUUID } from 'crypto'
import type {
  AgentContext,
  RunInput,
  RunOutput,
  RunMetadata,
  PlanOutput,
  PlanStep,
  CriticReport,
  ToolCallResult,
  ValidationResult,
  IntentClassification,
  LLMMessage,
  LLMResponse,
  AIRunStatus,
  AIRunType,
  AISessionMode,
  ConfidenceLevel,
} from './types'
import { ProviderAdapter, type ResolvedConnection } from './provider-adapter'
import { ToolAccessLayer } from './tool-access-layer'
import { AgentMemoryService } from '../agent/agent-memory'
import {
  SYSTEM_PLATFORM_PROMPT,
  POLICY_PROMPT,
  buildAssistantPrompt,
  buildSessionContext,
  buildWorkflowContext,
  assemblePlannerPrompt,
  assembleCriticPrompt,
  assemblePrompt,
  buildIntentClassificationPrompt,
  RESPONSE_FORMATTING_PROMPT,
} from './prompts'
import { ToolExecutor } from './tool-executor'
import { getPrismaClient } from '../../prisma'
import type { Prisma } from '@prisma/client'

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_CONSECUTIVE_TOOL_ERRORS = 3
const MAX_CRITIC_RETRIES = 1
const RUN_TIMEOUT_MS = 120_000 // 2 minutes max par run
const STEP_TIMEOUT_MS = 30_000 // 30s max par step

// ============================================================================
// AGENT RUNTIME — Classe principale
// ============================================================================

export class AgentRuntime {
  private prisma: ReturnType<typeof getPrismaClient>
  private providerAdapter: ProviderAdapter
  private toolAccessLayer: ToolAccessLayer
  private toolExecutor: ToolExecutor
  private memoryService: AgentMemoryService

  constructor(
    private cabinetId: string,
    private userId: string,
  ) {
    this.prisma = getPrismaClient(cabinetId, false)
    this.providerAdapter = new ProviderAdapter(cabinetId)
    this.toolAccessLayer = new ToolAccessLayer(cabinetId)
    this.toolExecutor = new ToolExecutor(cabinetId, userId)
    this.memoryService = new AgentMemoryService(cabinetId, userId)
  }

  // ── Point d'entrée principal ──

  /**
   * Exécute un run complet : Intent → Plan → Execute → Critic → Response
   */
  async executeRun(input: RunInput): Promise<RunOutput> {
    const correlationId = randomUUID()
    const startTime = Date.now()

    // 1. Résoudre la connexion provider
    const connection = await this.providerAdapter.resolveConnection()
    if (!connection) {
      return this.buildErrorOutput(correlationId, 'Aucune connexion IA disponible. Veuillez configurer une connexion dans les paramètres.', startTime)
    }

    // 2. Créer le run en base
    const run = await this.createRun(input, correlationId, connection)

    try {
      // 3. Construire le contexte agent
      const context = await this.buildAgentContext(input, connection, correlationId)
      console.log(`[AURA-V2 DEBUG] Context built — clientId=${context.clientId || 'NONE'}, mode=${context.mode}, userRole=${context.userRole}`)

      // 4. Classifier l'intent
      const intent = await this.classifyIntent(context, input.userMessage, connection, run.id)
      console.log(`[AURA-V2 DEBUG] Intent classified — intent=${intent.intent}, requiresTool=${intent.requiresTool}, confidence=${intent.confidence}, suggestedTools=[${intent.suggestedTools.join(',')}]`)

      // 5. Mettre à jour le run avec l'intent
      await this.updateRunIntent(run.id, intent)

      // 6. Route selon l'intent
      let response: string
      let toolCalls: ToolCallResult[] = []
      let plan: PlanOutput | undefined
      let criticReport: CriticReport | undefined
      let validations: ValidationResult[] = []

      if (intent.intent === 'conversation' || (intent.intent === 'question' && !intent.requiresTool)) {
        console.log(`[AURA-V2 DEBUG] Routing → handleSimpleConversation`)
        // Conversation simple — pas besoin de planification
        response = await this.handleSimpleConversation(context, input.userMessage, connection, run.id)
      } else if (intent.intent === 'confirmation') {
        response = await this.handleConfirmation(context, input.userMessage, run.id)
      } else if (intent.intent === 'cancellation') {
        response = await this.handleCancellation(context, run.id)
      } else if (intent.intent === 'instruction') {
        response = await this.handleInstruction(context, input.userMessage, run.id)
      } else {
        console.log(`[AURA-V2 DEBUG] Routing → executeFullCycle (intent=${intent.intent})`)
        // Cycle complet : Plan → Execute → Critic
        const fullResult = await this.executeFullCycle(context, input.userMessage, intent, connection, run.id)
        response = fullResult.response
        toolCalls = fullResult.toolCalls
        plan = fullResult.plan
        criticReport = fullResult.criticReport
        validations = fullResult.validations
      }

      // 7. Sauvegarder le résumé de conversation en mémoire
      await this.saveConversationMemory(input.userMessage, response, context)

      // 8. Finaliser le run
      const durationMs = Date.now() - startTime
      const metadata = await this.finalizeRun(run.id, 'COMPLETED', response, {
        intent: intent.intent,
        intentConfidence: intent.confidence,
        durationMs,
        correlationId,
        connection,
        plan,
        criticReport,
      })

      // 9. Persister le message dans la session
      await this.persistMessages(input.sessionId, run.id, input.userMessage, response, metadata)

      return {
        runId: run.id,
        status: 'COMPLETED',
        response,
        metadata,
        toolCalls,
        validations,
        plan,
        criticReport,
      }
    } catch (error) {
      const durationMs = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      await this.finalizeRun(run.id, 'FAILED', null, {
        intent: 'unknown',
        intentConfidence: 0,
        durationMs,
        correlationId,
        connection,
        error: errorMessage,
      })

      return this.buildErrorOutput(correlationId, `Une erreur est survenue : ${errorMessage}`, startTime)
    }
  }

  // ── Intent Classification ──

  private async classifyIntent(
    context: AgentContext,
    userMessage: string,
    connection: ResolvedConnection,
    runId: string,
  ): Promise<IntentClassification> {
    const stepStart = Date.now()

    try {
      const availableTools = await this.toolAccessLayer.getAvailableTools(context.userRole)
      const toolNames = availableTools.map(t => t.name)

      const messages: LLMMessage[] = [
        { role: 'system', content: buildIntentClassificationPrompt(toolNames) },
        { role: 'system', content: context.memoryContext || '' },
        { role: 'user', content: userMessage },
      ]

      const response = await this.providerAdapter.callLLM({
        messages,
        model: connection.model,
        temperature: 0.1,
        maxTokens: 500,
        responseFormat: { type: 'json_object' },
      }, connection)

      // Enregistrer le step
      await this.createRunStep(runId, 1, 'INTENT_CLASSIFICATION', 'orchestrator', {
        input: { userMessage: userMessage.slice(0, 200) },
        output: response.content,
        tokensUsed: response.tokensInput + response.tokensOutput,
        durationMs: Date.now() - stepStart,
        modelUsed: response.model,
      })

      const parsed = this.safeParseJSON<IntentClassification>(response.content)
      if (parsed) return parsed

      // Fallback : conversation par défaut
      return {
        intent: 'conversation',
        confidence: 0.5,
        entities: [],
        requiresTool: false,
        suggestedTools: [],
      }
    } catch (error) {
      console.error('[AURA-V2] Intent classification error:', error)
      return {
        intent: 'conversation',
        confidence: 0.3,
        entities: [],
        requiresTool: false,
        suggestedTools: [],
      }
    }
  }

  // ── Conversation Simple ──

  private async handleSimpleConversation(
    context: AgentContext,
    userMessage: string,
    connection: ResolvedConnection,
    runId: string,
  ): Promise<string> {
    const messages = assemblePrompt(context, userMessage)

    // Pass native tool definitions so LLM can suggest or invoke tools
    const llmTools = await this.toolAccessLayer.getToolsForLLM(context.userRole)

    // Force tool calling when client context is present — prevents hallucination
    const forceTools = !!(context.clientId && llmTools.length > 0)
    console.log(`[AURA-V2 DEBUG] handleSimpleConversation — forceTools=${forceTools}, toolsCount=${llmTools.length}, clientId=${context.clientId || 'NONE'}`)

    const response = await this.providerAdapter.callLLM({
      messages: messages as LLMMessage[],
      model: connection.model,
      temperature: 0.3,
      maxTokens: 4000,
      tools: llmTools,
      toolChoice: forceTools ? 'required' : 'auto',
    }, connection)

    console.log(`[AURA-V2 DEBUG] handleSimpleConversation LLM response — toolCalls=${response.toolCalls?.length || 0}, finishReason=${response.finishReason}, contentLength=${response.content?.length || 0}`)

    // Handle native tool calls from the LLM
    if (response.toolCalls && response.toolCalls.length > 0) {
      const toolResults: string[] = []
      for (const tc of response.toolCalls) {
        try {
          const params = JSON.parse(tc.arguments || '{}')
          // Auto-inject clientId if missing
          if (context.clientId && !params.clientId) {
            const toolDef = this.toolAccessLayer.getToolDefinition(tc.name)
            if (toolDef?.parameters?.some(p => p.name === 'clientId')) {
              params.clientId = context.clientId
            }
          }
          const permCheck = await this.toolAccessLayer.checkPermission(tc.name, context, params)
          if (!permCheck.allowed) {
            toolResults.push(`[${tc.name}] Permission refusée: ${permCheck.reason}`)
            continue
          }
          if (permCheck.requiresConfirmation) {
            toolResults.push(`[${tc.name}] ⏳ Action en attente de confirmation`)
            continue
          }
          const result = await this.withTimeout(
            this.toolExecutor.execute(tc.name, params, context),
            STEP_TIMEOUT_MS,
          )
          await this.toolAccessLayer.logToolCall(
            { toolName: tc.name, params, reasoning: 'native tool call' },
            context, result, permCheck, runId,
          )
          toolResults.push(result.success ? JSON.stringify(result.data).slice(0, 2000) : `Erreur: ${result.error}`)
        } catch (e) {
          toolResults.push(`[${tc.name}] Erreur: ${e instanceof Error ? e.message : String(e)}`)
        }
      }

      // Second LLM call with tool results to generate final response
      const followUp = await this.providerAdapter.callLLM({
        messages: [
          ...(messages as LLMMessage[]),
          { role: 'assistant' as const, content: response.content || '', tool_calls: response.toolCalls.map(tc => ({ id: tc.id, type: 'function' as const, function: { name: tc.name, arguments: tc.arguments } })) } as LLMMessage,
          ...response.toolCalls.map((tc, i) => ({ role: 'tool' as const, content: toolResults[i] || '', tool_call_id: tc.id }) as LLMMessage),
        ],
        model: connection.model,
        temperature: 0.3,
        maxTokens: 4000,
      }, connection)

      await this.createRunStep(runId, 2, 'LLM_GENERATION', 'orchestrator', {
        input: { type: 'conversation_with_tools', toolsCalled: response.toolCalls.map(tc => tc.name) },
        output: followUp.content.slice(0, 500),
        tokensUsed: (response.tokensInput + response.tokensOutput) + (followUp.tokensInput + followUp.tokensOutput),
        durationMs: 0,
        modelUsed: followUp.model,
      })

      return followUp.content
    }

    // Hallucination guard: if tools were forced but LLM didn't call any,
    // and the response contains monetary amounts, reject it
    if (forceTools && this.containsMonetaryAmounts(response.content)) {
      console.warn('[AURA-V2] Hallucination detected: LLM generated monetary data without calling tools')
      await this.createRunStep(runId, 2, 'LLM_GENERATION', 'orchestrator', {
        input: { type: 'hallucination_blocked' },
        output: 'Réponse bloquée — données fabriquées détectées',
        tokensUsed: response.tokensInput + response.tokensOutput,
        durationMs: 0,
        modelUsed: response.model,
      })
      return `⚠️ Je n'ai pas pu récupérer les données réelles du client dans le CRM. Pour éviter de vous présenter des informations incorrectes, je préfère ne pas répondre avec des données non vérifiées.\n\nVeuillez vérifier :\n- Que le client est bien sélectionné dans la session\n- Que les données du client existent dans le CRM\n- Que la connexion IA est correctement configurée\n\nVoulez-vous que je réessaie ?`
    }

    await this.createRunStep(runId, 2, 'LLM_GENERATION', 'orchestrator', {
      input: { type: 'conversation' },
      output: response.content.slice(0, 500),
      tokensUsed: response.tokensInput + response.tokensOutput,
      durationMs: 0,
      modelUsed: response.model,
    })

    return response.content
  }

  // ── Gestion des instructions ──

  private async handleInstruction(
    context: AgentContext,
    userMessage: string,
    runId: string,
  ): Promise<string> {
    try {
      // Vérifier si une instruction similaire existe
      const existing = await this.memoryService.findSimilarInstruction(userMessage)
      if (existing) {
        await this.memoryService.update(existing.id, { content: userMessage })
        return `✅ J'ai mis à jour l'instruction existante : "${existing.title}"\n\nNouveau contenu : "${userMessage}"`
      }

      await this.memoryService.create({
        type: 'INSTRUCTION',
        title: userMessage.slice(0, 100),
        content: userMessage,
        priority: 1,
        sourceQuery: userMessage,
      })

      return `✅ Instruction mémorisée : "${userMessage.slice(0, 100)}${userMessage.length > 100 ? '...' : ''}"\n\nJe la suivrai dans toutes nos futures conversations.`
    } catch (error) {
      console.error('[AURA-V2] Instruction save error:', error)
      return `❌ Erreur lors de la sauvegarde de l'instruction. Veuillez réessayer.`
    }
  }

  // ── Gestion des confirmations ──

  private async handleConfirmation(
    context: AgentContext,
    userMessage: string,
    runId: string,
  ): Promise<string> {
    // Rechercher les actions en attente de confirmation
    const pendingActions = await this.prisma.aIToolCall.findMany({
      where: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        status: 'AWAITING_CONFIRM',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    if (pendingActions.length === 0) {
      return `Aucune action en attente de confirmation.`
    }

    const isPositive = /^(oui|ok|yes|confirme|valide|d'accord|go|c'est bon|parfait|exact)/i.test(userMessage.trim())
    const isNegative = /^(non|no|annule|cancel|refuse|stop|arrête)/i.test(userMessage.trim())

    if (isPositive) {
      // Exécuter la première action en attente
      const action = pendingActions[0]
      try {
        const toolResult = await this.toolExecutor.execute(
          action.toolName,
          action.toolParams as Record<string, unknown>,
          context,
        )

        await this.prisma.aIToolCall.update({
          where: { id: action.id },
          data: {
            status: toolResult.success ? 'COMPLETED' : 'FAILED',
            result: (toolResult.data || undefined) as Prisma.InputJsonValue | undefined,
            error: toolResult.error,
            confirmedBy: this.userId,
            confirmedAt: new Date(),
            completedAt: new Date(),
          },
        })

        return toolResult.success
          ? `✅ Action exécutée avec succès : ${action.toolName}\n\n${toolResult.message}`
          : `❌ L'action a échoué : ${toolResult.error}`
      } catch (error) {
        return `❌ Erreur lors de l'exécution : ${error instanceof Error ? error.message : String(error)}`
      }
    }

    if (isNegative) {
      await this.prisma.aIToolCall.updateMany({
        where: {
          id: { in: pendingActions.map(a => a.id) },
          status: 'AWAITING_CONFIRM',
        },
        data: { status: 'CANCELLED' },
      })

      return `❌ Action(s) annulée(s). ${pendingActions.length} action(s) en attente ont été annulées.`
    }

    // Clarification nécessaire
    const actionList = pendingActions.map((a, i) =>
      `${i + 1}. **${a.toolName}** — ${(a.resultSummary || JSON.stringify(a.toolParams)).slice(0, 100)}`
    ).join('\n')

    return `J'ai ${pendingActions.length} action(s) en attente de confirmation :\n\n${actionList}\n\nRépondez **oui** pour confirmer ou **non** pour annuler.`
  }

  // ── Gestion des annulations ──

  private async handleCancellation(
    context: AgentContext,
    runId: string,
  ): Promise<string> {
    const cancelled = await this.prisma.aIToolCall.updateMany({
      where: {
        cabinetId: this.cabinetId,
        userId: this.userId,
        status: { in: ['PENDING', 'AWAITING_CONFIRM'] },
      },
      data: { status: 'CANCELLED' },
    })

    return cancelled.count > 0
      ? `✅ ${cancelled.count} action(s) annulée(s).`
      : `Aucune action en cours à annuler.`
  }

  // ── Cycle complet : Plan → Execute → Critic ──

  private async executeFullCycle(
    context: AgentContext,
    userMessage: string,
    intent: IntentClassification,
    connection: ResolvedConnection,
    runId: string,
  ): Promise<{
    response: string
    toolCalls: ToolCallResult[]
    plan: PlanOutput
    criticReport: CriticReport
    validations: ValidationResult[]
  }> {
    // ── Phase 1 : PLANNING ──
    await this.updateRunStatus(runId, 'PLANNING')
    const plan = await this.executePlanning(context, userMessage, intent, connection, runId)
    console.log(`[AURA-V2 DEBUG] Planning result — steps=${plan.steps.length}, strategy=${plan.strategy?.slice(0, 100)}`)
    if (plan.steps.length > 0) {
      console.log(`[AURA-V2 DEBUG] Plan steps: ${plan.steps.map(s => `${s.tool}(${JSON.stringify(s.params || {}).slice(0, 80)})`).join(', ')}`)
    }

    // Si pas de steps mais intent nécessite des outils → générer un plan par défaut
    if (!plan.steps.length) {
      // Si on a un clientId et des outils suggérés, on crée un plan minimal
      if (context.clientId && intent.suggestedTools.length > 0) {
        plan.steps = intent.suggestedTools.map((tool, i) => ({
          id: `default_step_${i + 1}`,
          order: i + 1,
          description: `Appel automatique de ${tool} (plan par défaut)`,
          tool,
          params: { clientId: context.clientId },
          reason: 'Plan par défaut — le planner n\'a pas produit de steps mais l\'intent nécessite des outils',
          optional: false,
          estimatedTokens: 200,
        }))
        plan.strategy = 'Plan par défaut généré automatiquement à partir des outils suggérés'
      } else if (context.clientId) {
        // Aucun outil suggéré mais un client actif → appeler get_client_details par défaut
        const hasClientDetailsTool = this.toolAccessLayer.getToolDefinition('get_client_details')
        if (hasClientDetailsTool) {
          plan.steps = [{
            id: 'default_step_1',
            order: 1,
            description: 'Récupération des données client',
            tool: 'get_client_details',
            params: { clientId: context.clientId },
            reason: 'Plan par défaut — données client nécessaires pour répondre',
            optional: false,
            estimatedTokens: 200,
          }]
          plan.strategy = 'Plan par défaut — récupération données client'
        }
      }

      // Si toujours pas de steps après les tentatives de fallback → conversation simple
      if (!plan.steps.length) {
        const response = await this.handleSimpleConversation(context, userMessage, connection, runId)
        return {
          response,
          toolCalls: [],
          plan,
          criticReport: { passed: true, score: 0.8, checks: [], recommendation: 'approve', notes: 'Pas de tools, conversation simple' },
          validations: [],
        }
      }
    }

    // ── Phase 2 : EXECUTION ──
    await this.updateRunStatus(runId, 'EXECUTING')
    const { toolCalls, toolResults } = await this.executeSteps(context, plan, connection, runId)

    // ── Phase 3 : RESPONSE GENERATION ──
    const response = await this.generateResponse(context, userMessage, plan, toolResults, connection, runId)

    // ── Phase 4 : CRITIC ──
    await this.updateRunStatus(runId, 'CRITICIZING')
    const criticReport = await this.executeCritic(userMessage, plan, toolResults, response, connection, runId)

    // Si le critic rejette → retry une fois
    if (criticReport.recommendation === 'retry' && MAX_CRITIC_RETRIES > 0) {
      const retryResponse = await this.retryWithCriticFeedback(
        context, userMessage, plan, toolResults, criticReport, connection, runId,
      )
      return {
        response: retryResponse,
        toolCalls,
        plan,
        criticReport: { ...criticReport, passed: true, recommendation: 'approve', notes: 'Approved after retry' },
        validations: [],
      }
    }

    if (criticReport.recommendation === 'reject') {
      return {
        response: `Je ne suis pas en mesure de fournir une réponse fiable à cette demande. ${criticReport.notes}`,
        toolCalls,
        plan,
        criticReport,
        validations: [],
      }
    }

    return { response, toolCalls, plan, criticReport, validations: [] }
  }

  // ── Planning ──

  private async executePlanning(
    context: AgentContext,
    userMessage: string,
    intent: IntentClassification,
    connection: ResolvedConnection,
    runId: string,
  ): Promise<PlanOutput> {
    const stepStart = Date.now()

    const availableTools = await this.toolAccessLayer.getAvailableTools(context.userRole)
    const conversationHistory = await this.getRecentMessages(context.sessionId, 6)

    const messages = assemblePlannerPrompt(context, userMessage, conversationHistory, availableTools)

    const response = await this.providerAdapter.callLLM({
      messages: messages as LLMMessage[],
      model: connection.model,
      temperature: 0.1,
      maxTokens: 1000,
      responseFormat: { type: 'json_object' },
    }, connection)

    await this.createRunStep(runId, 2, 'PLANNING', 'planner', {
      input: { userMessage: userMessage.slice(0, 200), intent: intent.intent },
      output: response.content.slice(0, 500),
      tokensUsed: response.tokensInput + response.tokensOutput,
      durationMs: Date.now() - stepStart,
      modelUsed: response.model,
    })

    const parsed = this.safeParseJSON<PlanOutput>(response.content)
    if (parsed?.steps) return parsed

    // Fallback : plan simple basé sur l'intent
    return {
      strategy: `Réponse directe pour intent ${intent.intent}`,
      steps: intent.suggestedTools.map((tool, i) => ({
        id: `step_${i + 1}`,
        order: i + 1,
        description: `Appel ${tool}`,
        tool,
        params: {},
        reason: `Suggéré par la classification d'intent`,
        optional: false,
        estimatedTokens: 200,
      })),
      estimatedTokens: 500,
      estimatedDuration: 5000,
      requiresConfirmation: false,
    }
  }

  // ── Execution des steps ──

  private async executeSteps(
    context: AgentContext,
    plan: PlanOutput,
    connection: ResolvedConnection,
    runId: string,
  ): Promise<{
    toolCalls: ToolCallResult[]
    toolResults: Array<{ toolName: string; result: string }>
  }> {
    const toolCalls: ToolCallResult[] = []
    const toolResults: Array<{ toolName: string; result: string }> = []
    let consecutiveErrors = 0
    let toolCallCount = 0

    for (const step of plan.steps) {
      if (!step.tool) continue
      console.log(`[AURA-V2 DEBUG] Executing step ${step.id}: tool=${step.tool}, params=${JSON.stringify(step.params || {}).slice(0, 200)}`)

      // Auto-inject clientId from context if missing in params
      if (context.clientId) {
        if (!step.params) step.params = {}
        if (!step.params.clientId) {
          const toolDef = this.toolAccessLayer.getToolDefinition(step.tool)
          const acceptsClientId = toolDef?.parameters?.some(p => p.name === 'clientId')
          if (acceptsClientId) {
            step.params.clientId = context.clientId
          }
        }
      }

      // Enforce maxToolCalls governance limit
      if (toolCallCount >= context.maxToolCalls) {
        console.warn(`[AURA-V2] maxToolCalls limit reached (${context.maxToolCalls}) — stopping execution`)
        toolCalls.push({
          toolCallId: randomUUID(),
          toolName: step.tool,
          success: false,
          error: `Limite de ${context.maxToolCalls} appels d'outils atteinte`,
          message: `⚠️ Limite d'appels d'outils atteinte (${context.maxToolCalls}). Contactez votre administrateur pour augmenter la limite.`,
          durationMs: 0,
          dataAccessed: [],
        })
        break
      }

      // Enforce maxRunSteps governance limit
      if (step.order >= context.maxRunSteps) {
        console.warn(`[AURA-V2] maxRunSteps limit reached (${context.maxRunSteps}) — stopping execution`)
        break
      }

      // Vérifier les erreurs consécutives
      if (consecutiveErrors >= MAX_CONSECUTIVE_TOOL_ERRORS) {
        console.warn(`[AURA-V2] ${MAX_CONSECUTIVE_TOOL_ERRORS} erreurs consécutives — arrêt de l'exécution`)
        break
      }

      const stepStart = Date.now()

      // Vérifier les permissions
      const permCheck = await this.toolAccessLayer.checkPermission(
        step.tool,
        context,
        step.params || {},
      )

      if (!permCheck.allowed) {
        console.warn(`[AURA-V2 DEBUG] Permission DENIED for ${step.tool}: ${permCheck.reason}`)
        consecutiveErrors++
        toolCalls.push({
          toolCallId: randomUUID(),
          toolName: step.tool,
          success: false,
          error: permCheck.reason || 'Permission refusée',
          message: `❌ Permission refusée : ${permCheck.reason}`,
          durationMs: 0,
          dataAccessed: [],
        })
        continue
      }

      // Si confirmation requise, marquer comme en attente
      if (permCheck.requiresConfirmation) {
        await this.prisma.aIToolCall.create({
          data: {
            cabinetId: this.cabinetId,
            userId: this.userId,
            runId,
            toolName: step.tool,
            toolCategory: this.toolAccessLayer.getToolDefinition(step.tool)?.category || 'unknown',
            toolParams: (step.params || {}) as Prisma.InputJsonValue,
            toolParamsMasked: this.toolAccessLayer.maskParamsForAudit(step.tool, step.params || {}) as Prisma.InputJsonValue,
            status: 'AWAITING_CONFIRM',
            requiresConfirmation: true,
            reasoning: step.reason,
            dataAccessed: [],
          },
        })

        toolCalls.push({
          toolCallId: randomUUID(),
          toolName: step.tool,
          success: true,
          message: `⏳ Action "${step.tool}" en attente de confirmation`,
          durationMs: 0,
          dataAccessed: [],
        })
        toolResults.push({
          toolName: step.tool,
          result: `[En attente de confirmation utilisateur]`,
        })
        continue
      }

      // Valider les paramètres
      const validation = this.toolAccessLayer.validateParams(step.tool, step.params || {})
      if (!validation.valid) {
        console.warn(`[AURA-V2 DEBUG] Validation FAILED for ${step.tool}: ${validation.errors.join(', ')}`)
        consecutiveErrors++
        toolCalls.push({
          toolCallId: randomUUID(),
          toolName: step.tool,
          success: false,
          error: `Paramètres invalides : ${validation.errors.join(', ')}`,
          message: `❌ Paramètres invalides pour ${step.tool}`,
          durationMs: 0,
          dataAccessed: [],
        })
        continue
      }

      // Exécuter l'outil
      try {
        const result = await this.withTimeout(
          this.toolExecutor.execute(step.tool, step.params || {}, context),
          STEP_TIMEOUT_MS,
        )
        console.log(`[AURA-V2 DEBUG] Step ${step.id} result: success=${result.success}, message=${result.message?.slice(0, 200)}`)

        const durationMs = Date.now() - stepStart

        // Logger l'appel
        const toolCallId = await this.toolAccessLayer.logToolCall(
          { toolName: step.tool, params: step.params || {}, reasoning: step.reason },
          context,
          { ...result, durationMs },
          permCheck,
          runId,
        )

        // Logger l'accès RGPD si données client accédées
        if (result.dataAccessed.length > 0 && context.clientId) {
          await this.toolAccessLayer.logDataAccess(
            context,
            'Client',
            context.clientId,
            result.dataAccessed,
            this.toolAccessLayer.getToolDefinition(step.tool)?.category === 'write' ? 'write' : 'read',
            toolCallId,
            runId,
          )
        }

        toolCallCount++
        toolCalls.push({ ...result, toolCallId, durationMs })
        toolResults.push({
          toolName: step.tool,
          result: result.success
            ? JSON.stringify(result.data).slice(0, 2000)
            : `Erreur: ${result.error}`,
        })

        // Enregistrer le step
        await this.createRunStep(runId, step.order + 2, 'TOOL_EXECUTION', 'executor', {
          input: { tool: step.tool, params: step.params },
          output: result.success ? result.message : result.error,
          tokensUsed: 0,
          durationMs,
          modelUsed: null,
        })

        if (result.success) {
          consecutiveErrors = 0
        } else {
          consecutiveErrors++
        }
      } catch (error) {
        consecutiveErrors++
        const errorMsg = error instanceof Error ? error.message : String(error)
        toolCalls.push({
          toolCallId: randomUUID(),
          toolName: step.tool,
          success: false,
          error: errorMsg,
          message: `❌ Erreur: ${errorMsg}`,
          durationMs: Date.now() - stepStart,
          dataAccessed: [],
        })
      }
    }

    return { toolCalls, toolResults }
  }

  // ── Response Generation ──

  private async generateResponse(
    context: AgentContext,
    userMessage: string,
    plan: PlanOutput,
    toolResults: Array<{ toolName: string; result: string }>,
    connection: ResolvedConnection,
    runId: string,
  ): Promise<string> {
    const stepStart = Date.now()

    const messages = assemblePrompt(context, userMessage, toolResults)
    messages.push({ role: 'system', content: RESPONSE_FORMATTING_PROMPT })

    console.log(`[AURA-V2 DEBUG] generateResponse — toolResults=${toolResults.length}, tools=${toolResults.map(tr => tr.toolName).join(',')}`)

    // Hallucination guard: if no successful tool results, warn the LLM
    const hasSuccessfulResults = toolResults.some(tr => !tr.result.startsWith('Erreur:') && !tr.result.startsWith('['))
    if (!hasSuccessfulResults && toolResults.length > 0) {
      messages.push({
        role: 'system',
        content: `⚠️ ALERTE ANTI-HALLUCINATION : Tous les appels d'outils ont échoué. Tu ne DOIS PAS inventer de données. Indique clairement au conseiller que les données n'ont pas pu être récupérées et liste les erreurs rencontrées. Ne génère AUCUN montant, ratio ou chiffre non sourcé.`,
      })
    } else if (toolResults.length === 0 && plan.steps.length > 0) {
      messages.push({
        role: 'system',
        content: `⚠️ ALERTE ANTI-HALLUCINATION : Aucun outil n'a été exécuté malgré un plan qui en prévoyait. Tu ne DOIS PAS inventer de données. Indique clairement que les données n'ont pas pu être récupérées.`,
      })
    }

    // Explicit anti-description instruction
    messages.push({
      role: 'system',
      content: `RAPPEL CRITIQUE : Présente DIRECTEMENT les résultats des données ci-dessus. N'écris JAMAIS "Je vais récupérer", "Je vais utiliser", "Je vais procéder", "Je vais appeler". Les outils ont DÉJÀ été appelés — les résultats sont dans les messages tool ci-dessus. Analyse-les et présente les résultats.`,
    })

    const response = await this.providerAdapter.callLLM({
      messages: messages as LLMMessage[],
      model: connection.model,
      temperature: 0.3,
      maxTokens: 4000,
    }, connection)

    // Post-generation anti-description guard
    const descriptionPatterns = /je vais (récupérer|utiliser|procéder|appeler|analyser|collecter|lancer|chercher)|j'utilise l'outil|je vais maintenant|nous allons (suivre|procéder|analyser)|les étapes suivantes|voici les étapes|pour procéder à|nous devons déterminer/i
    if (descriptionPatterns.test(response.content) && toolResults.length > 0) {
      console.warn(`[AURA-V2] Anti-description guard triggered — response describes tool usage instead of presenting results`)
      // If we have successful tool results, try to generate a better response
      if (hasSuccessfulResults) {
        const retryMessages = [
          ...messages,
          { role: 'assistant', content: response.content },
          { role: 'system', content: `ERREUR : Ta réponse DÉCRIT ce que tu vas faire au lieu de PRÉSENTER les résultats. Les outils ont DÉJÀ été exécutés et les données sont disponibles dans les messages précédents. Reformule ta réponse en présentant DIRECTEMENT les résultats sous forme structurée (tableaux, listes, KPIs). Ne décris PAS ton processus.` },
        ]
        const retry = await this.providerAdapter.callLLM({
          messages: retryMessages as LLMMessage[],
          model: connection.model,
          temperature: 0.2,
          maxTokens: 4000,
        }, connection)
        console.log(`[AURA-V2 DEBUG] Anti-description retry — contentLength=${retry.content?.length || 0}`)
        if (!descriptionPatterns.test(retry.content)) {
          await this.createRunStep(runId, plan.steps.length + 3, 'LLM_GENERATION', 'orchestrator', {
            input: { type: 'response_generation_retry', toolResultsCount: toolResults.length },
            output: retry.content.slice(0, 500),
            tokensUsed: (response.tokensInput + response.tokensOutput) + (retry.tokensInput + retry.tokensOutput),
            durationMs: Date.now() - stepStart,
            modelUsed: retry.model,
          })
          return retry.content
        }
      }
    }

    await this.createRunStep(runId, plan.steps.length + 3, 'LLM_GENERATION', 'orchestrator', {
      input: { type: 'response_generation', toolResultsCount: toolResults.length },
      output: response.content.slice(0, 500),
      tokensUsed: response.tokensInput + response.tokensOutput,
      durationMs: Date.now() - stepStart,
      modelUsed: response.model,
    })

    return response.content
  }

  // ── Critic ──

  private async executeCritic(
    userMessage: string,
    plan: PlanOutput,
    toolResults: Array<{ toolName: string; result: string }>,
    response: string,
    connection: ResolvedConnection,
    runId: string,
  ): Promise<CriticReport> {
    const stepStart = Date.now()

    try {
      const messages = assembleCriticPrompt(
        userMessage,
        JSON.stringify(plan.steps.map(s => `${s.order}. ${s.tool || 'conversation'}: ${s.description}`)),
        toolResults.map(tr => `[${tr.toolName}] ${tr.result.slice(0, 300)}`).join('\n'),
        response.slice(0, 1500),
      )

      const criticResponse = await this.providerAdapter.callLLM({
        messages: messages as LLMMessage[],
        model: connection.model,
        temperature: 0.1,
        maxTokens: 500,
        responseFormat: { type: 'json_object' },
      }, connection)

      await this.createRunStep(runId, plan.steps.length + 4, 'CRITIC_EVALUATION', 'critic', {
        input: { responseLength: response.length },
        output: criticResponse.content.slice(0, 500),
        tokensUsed: criticResponse.tokensInput + criticResponse.tokensOutput,
        durationMs: Date.now() - stepStart,
        modelUsed: criticResponse.model,
      })

      const parsed = this.safeParseJSON<CriticReport>(criticResponse.content)
      if (parsed) return parsed

      // Fallback : approuver par défaut
      return { passed: true, score: 0.7, checks: [], recommendation: 'approve', notes: 'Critic parse failed — approved by default' }
    } catch (error) {
      console.error('[AURA-V2] Critic error:', error)
      return { passed: true, score: 0.5, checks: [], recommendation: 'approve', notes: 'Critic error — approved by default' }
    }
  }

  // ── Retry avec feedback du Critic ──

  private async retryWithCriticFeedback(
    context: AgentContext,
    userMessage: string,
    plan: PlanOutput,
    toolResults: Array<{ toolName: string; result: string }>,
    criticReport: CriticReport,
    connection: ResolvedConnection,
    runId: string,
  ): Promise<string> {
    const messages = assemblePrompt(context, userMessage, toolResults)
    messages.push({
      role: 'system',
      content: `CORRECTION REQUISE par le Critic :\n${criticReport.notes}\n\nChecks échoués :\n${criticReport.checks.filter(c => !c.passed).map(c => `- ${c.name}: ${c.message}`).join('\n')}\n\nReformule ta réponse en corrigeant ces points.`,
    })

    const response = await this.providerAdapter.callLLM({
      messages: messages as LLMMessage[],
      model: connection.model,
      temperature: 0.2,
      maxTokens: 2000,
    }, connection)

    return response.content
  }

  // ── Helpers de persistence ──

  private async createRun(
    input: RunInput,
    correlationId: string,
    connection: ResolvedConnection,
  ) {
    return this.prisma.aIRun.create({
      data: {
        sessionId: input.sessionId,
        cabinetId: this.cabinetId,
        userId: this.userId,
        connectionId: connection.connectionId,
        status: 'QUEUED',
        type: (input.type || 'CHAT') as import('@prisma/client').$Enums.AIRunType,
        userMessage: input.userMessage,
        correlationId,
        startedAt: new Date(),
      },
    })
  }

  private async updateRunStatus(runId: string, status: AIRunStatus) {
    await this.prisma.aIRun.update({
      where: { id: runId },
      data: { status },
    })
  }

  private async updateRunIntent(runId: string, intent: IntentClassification) {
    await this.prisma.aIRun.update({
      where: { id: runId },
      data: {
        intent: intent.intent,
        intentConfidence: intent.confidence,
      },
    })
  }

  private async finalizeRun(
    runId: string,
    status: AIRunStatus,
    response: string | null,
    meta: {
      intent: string
      intentConfidence: number
      durationMs: number
      correlationId: string
      connection: ResolvedConnection
      plan?: PlanOutput
      criticReport?: CriticReport
      error?: string
    },
  ): Promise<RunMetadata> {
    const updateData: Record<string, unknown> = {
      status,
      response: response || undefined,
      durationMs: meta.durationMs,
      modelUsed: meta.connection.model,
      providerUsed: meta.connection.provider,
      completedAt: new Date(),
    }

    if (meta.plan) {
      updateData.plan = meta.plan as unknown
    }
    if (meta.criticReport) {
      updateData.criticScore = meta.criticReport.score
      updateData.criticNotes = meta.criticReport.notes
      updateData.criticPassed = meta.criticReport.passed
    }
    if (meta.error) {
      updateData.error = meta.error
    }

    // Aggregate real token counts from run steps
    const tokenAgg = await this.prisma.runStep.aggregate({
      where: { runId },
      _sum: { tokensUsed: true },
    }).catch(() => ({ _sum: { tokensUsed: 0 } }))

    const totalTokens = tokenAgg._sum.tokensUsed || 0
    // Heuristic split: ~60% input, ~40% output (based on typical CGP workloads)
    const tokensInput = Math.round(totalTokens * 0.6)
    const tokensOutput = totalTokens - tokensInput

    // Cost estimation (rough, per-model pricing in USD per 1K tokens)
    const costPer1K: Record<string, number> = {
      'gpt-4o': 0.005, 'gpt-4o-mini': 0.00015, 'gpt-4-turbo': 0.01,
      'claude-3-5-sonnet-20241022': 0.003, 'claude-3-haiku-20240307': 0.00025,
      'mistral-large-latest': 0.004, 'mistral-small-latest': 0.001,
    }
    const modelKey = meta.connection.model.toLowerCase()
    const rate = costPer1K[modelKey] || 0.003 // default to mid-tier
    const estimatedCost = Number(((totalTokens / 1000) * rate).toFixed(6))

    updateData.tokensInput = tokensInput
    updateData.tokensOutput = tokensOutput
    updateData.totalTokens = totalTokens
    updateData.estimatedCost = estimatedCost

    await this.prisma.aIRun.update({
      where: { id: runId },
      data: updateData,
    })

    // Mettre à jour les métriques de la session
    await this.prisma.aISession.update({
      where: { id: (await this.prisma.aIRun.findUnique({ where: { id: runId }, select: { sessionId: true } }))?.sessionId || '' },
      data: {
        totalRuns: { increment: 1 },
        totalDuration: { increment: meta.durationMs },
        totalTokens: { increment: totalTokens },
        lastActiveAt: new Date(),
      },
    }).catch(() => {/* non-blocking */})

    return {
      intent: meta.intent,
      intentConfidence: meta.intentConfidence,
      tokensInput,
      tokensOutput,
      totalTokens,
      durationMs: meta.durationMs,
      modelUsed: meta.connection.model,
      providerUsed: meta.connection.provider,
      connectionMode: meta.connection.mode,
      estimatedCost,
      correlationId: meta.correlationId,
      confidence: meta.intentConfidence > 0.8 ? 'HIGH' : meta.intentConfidence > 0.5 ? 'MED' : 'LOW',
      sources: [],
      warnings: [],
    }
  }

  private async createRunStep(
    runId: string,
    stepNumber: number,
    type: string,
    agentRole: string,
    data: {
      input: unknown
      output: unknown
      tokensUsed: number
      durationMs: number
      modelUsed: string | null
    },
  ) {
    await this.prisma.runStep.create({
      data: {
        runId,
        stepNumber,
        type: type as 'INTENT_CLASSIFICATION' | 'MEMORY_RETRIEVAL' | 'RAG_ENRICHMENT' | 'PLANNING' | 'TOOL_EXECUTION' | 'LLM_GENERATION' | 'CRITIC_EVALUATION' | 'VALIDATION' | 'CONFIRMATION_REQUEST' | 'RESPONSE_FORMATTING' | 'ERROR_RECOVERY',
        status: 'COMPLETED',
        agentRole,
        input: (data.input || {}) as Prisma.InputJsonValue,
        output: (data.output || undefined) as Prisma.InputJsonValue | undefined,
        tokensUsed: data.tokensUsed,
        durationMs: data.durationMs,
        modelUsed: data.modelUsed,
        startedAt: new Date(Date.now() - data.durationMs),
        completedAt: new Date(),
      },
    })
  }

  private async persistMessages(
    sessionId: string,
    runId: string,
    userMessage: string,
    assistantResponse: string,
    metadata: RunMetadata,
  ) {
    await this.prisma.aISessionMessage.createMany({
      data: [
        {
          sessionId,
          role: 'user',
          content: userMessage,
          runId,
          metadata: {} as Prisma.InputJsonValue,
        },
        {
          sessionId,
          role: 'assistant',
          content: assistantResponse,
          runId,
          metadata: {
            intent: metadata.intent,
            confidence: metadata.confidence,
            model: metadata.modelUsed,
            provider: metadata.providerUsed,
            durationMs: metadata.durationMs,
          } as Prisma.InputJsonValue,
        },
      ],
    })
  }

  private async getRecentMessages(
    sessionId: string,
    limit: number,
  ): Promise<Array<{ role: string; content: string }>> {
    const messages = await this.prisma.aISessionMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: { role: true, content: true },
    })

    return messages.reverse()
  }

  private async saveConversationMemory(
    userMessage: string,
    response: string,
    context: AgentContext,
  ) {
    try {
      // Résumé court pour la mémoire
      const topics = this.extractTopics(userMessage + ' ' + response)
      await this.memoryService.saveConversationSummary(
        `Q: ${userMessage.slice(0, 100)} → R: ${response.slice(0, 200)}`,
        topics,
        {},
        1,
        context.clientId,
      )
    } catch {
      // Non-blocking
    }
  }

  // ── Construction du contexte ──

  private async buildAgentContext(
    input: RunInput,
    connection: ResolvedConnection,
    correlationId: string,
  ): Promise<AgentContext> {
    // Charger le profil assistant
    const profile = await this.prisma.assistantProfile.findFirst({
      where: { cabinetId: this.cabinetId, isDefault: true, isActive: true },
    })

    // Charger la session
    const session = await this.prisma.aISession.findUnique({
      where: { id: input.sessionId },
      include: { client: { select: { id: true, firstName: true, lastName: true, status: true, totalActifs: true, totalPassifs: true, patrimoineNet: true } } },
    })

    // Resolve effective clientId: run-level override > session-level
    const effectiveClientId = input.clientId || session?.clientId || undefined

    // If run provides a clientId not on session, load client data
    let clientData = session?.client || null
    if (effectiveClientId && effectiveClientId !== session?.clientId) {
      clientData = await this.prisma.client.findFirst({
        where: { id: effectiveClientId, cabinetId: this.cabinetId },
        select: { id: true, firstName: true, lastName: true, status: true, totalActifs: true, totalPassifs: true, patrimoineNet: true },
      })
    }

    // Charger la mémoire
    const instructions = await this.memoryService.getActiveInstructions()
    const clientMemories = effectiveClientId
      ? await this.memoryService.getClientMemories(effectiveClientId)
      : []
    const allMemories = [...instructions, ...clientMemories]

    // Charger le user
    const user = await this.prisma.user.findUnique({
      where: { id: this.userId },
      select: { role: true },
    })

    const assistantPrompt = buildAssistantPrompt(
      profile?.name || 'AURA',
      profile?.tone || 'PROFESSIONNEL',
      profile?.customSystemPrompt || undefined,
      profile?.enabledDomains || undefined,
    )

    // Resolve page context: run-level override > session-level
    // Frontend sends 'path', type says 'page' — accept both
    const effectivePageContext = input.pageContext?.page
      || (input.pageContext as Record<string, unknown>)?.path as string
      || (session?.context as Record<string, unknown>)?.pageContext as string
      || undefined

    const sessionContext = buildSessionContext({
      pageContext: effectivePageContext,
      clientName: clientData ? `${clientData.firstName} ${clientData.lastName}` : undefined,
      clientId: clientData?.id,
      clientStatus: clientData?.status,
      patrimoine: clientData?.totalActifs ? {
        totalActifs: Number(clientData.totalActifs),
        totalPassifs: Number(clientData.totalPassifs || 0),
        patrimoineNet: Number(clientData.patrimoineNet || 0),
      } : undefined,
      mode: session?.mode || 'conversation',
      modeId: input.pageContext?.modeId,
      modePrompt: input.pageContext?.modePrompt,
    })

    return {
      cabinetId: this.cabinetId,
      userId: this.userId,
      userRole: user?.role || 'ADVISOR',
      clientId: effectiveClientId,
      sessionId: input.sessionId,
      connectionId: connection.connectionId || undefined,
      mode: (session?.mode || 'conversation') as AISessionMode,
      correlationId,
      platformPrompt: SYSTEM_PLATFORM_PROMPT,
      policyPrompt: POLICY_PROMPT,
      assistantPrompt,
      sessionContext,
      memoryContext: this.memoryService.formatForPrompt(allMemories),
      maxToolCalls: profile?.maxToolCallsPerRun || 10,
      maxRunSteps: profile?.maxRunSteps || 20,
      requireConfirmForWrites: profile?.requireConfirmForWrites ?? true,
      provider: connection.provider,
      model: connection.model,
      apiKey: connection.apiKey,
    }
  }

  // ── Utilitaires ──

  private buildErrorOutput(
    correlationId: string,
    message: string,
    startTime: number,
  ): RunOutput {
    return {
      runId: '',
      status: 'FAILED',
      response: message,
      metadata: {
        intent: 'error',
        intentConfidence: 0,
        tokensInput: 0,
        tokensOutput: 0,
        totalTokens: 0,
        durationMs: Date.now() - startTime,
        modelUsed: '',
        providerUsed: '',
        connectionMode: 'native',
        estimatedCost: 0,
        correlationId,
        confidence: 'LOW',
        sources: [],
        warnings: [message],
      },
      toolCalls: [],
      validations: [],
    }
  }

  private safeParseJSON<T>(content: string): T | null {
    try {
      // Extraire le JSON du contenu (peut être entouré de markdown)
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) return null
      return JSON.parse(jsonMatch[0]) as T
    } catch {
      return null
    }
  }

  private extractTopics(text: string): string[] {
    const keywords = text.toLowerCase()
      .replace(/[^a-zàâäéèêëïîôùûüÿçœæ\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4)

    // Déduplication simple
    return [...new Set(keywords)].slice(0, 10)
  }

  private containsMonetaryAmounts(text: string): boolean {
    // Detect patterns like: 500 000 €, 1 234,56€, 150000€, 80 000 €/an, etc.
    const monetaryPatterns = [
      /\d[\d\s]*\d\s*€/,             // "500 000 €" or "150000€"
      /\d[\d\s]*\d\s*euros?/i,        // "500 000 euros"
      /\d{1,3}(?:\s?\d{3})+\s*€/,    // "1 234 567 €"
      /\d+\s*%\s*(?:du|des|sur)/i,   // "25% du patrimoine"
    ]
    // Need at least 3 matches to consider it as fabricated financial data
    let matchCount = 0
    for (const pattern of monetaryPatterns) {
      const matches = text.match(new RegExp(pattern.source, pattern.flags + 'g'))
      matchCount += matches?.length || 0
    }
    return matchCount >= 3
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout après ${ms}ms`)), ms)
      promise
        .then(result => { clearTimeout(timer); resolve(result) })
        .catch(error => { clearTimeout(timer); reject(error) })
    })
  }
}
