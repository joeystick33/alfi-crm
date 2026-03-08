/**
 * AURA V2 — Tool Executor
 * 
 * Pont entre le Tool Access Layer (permissions, validation) et les
 * implémentations réelles des outils CRM (existants dans agent-tools.ts).
 * 
 * Ce module :
 * - Délègue l'exécution aux fonctions existantes de agent-tools.ts
 * - Enrichit les résultats avec les métadonnées RGPD (dataAccessed)
 * - Ajoute le timeout et retry
 * - Mappe les résultats au format ToolCallResult V2
 * 
 * Principe : Réutiliser les implémentations existantes sans les réécrire.
 */

import type { AgentContext, ToolCallResult } from './types'
import { executeTool as executeToolV1 } from '../agent/agent-tools'
import type { ToolContext as ToolContextV1 } from '../agent/agent-tools'
import { executeExtendedTool } from '../agent/agent-tools-extended'
import { executeMCPTool } from '../mcp/mcp-gouvernement'
import { AgentMemoryService } from '../agent/agent-memory'
import { DVFService } from '../dvf/dvf-service'
import { MarketDataService } from '../market/market-data-service'
import { RelationshipIntelligenceEngine } from '../intelligence/relationship-intelligence'
import { LeadPipelineEngine } from '../intelligence/lead-pipeline'
import { BusinessIntelligenceCouncil } from '../intelligence/business-intelligence-council'
import { PortfolioAllocationEngine } from '../intelligence/portfolio-allocation'
import { LLMCostTracker } from '../intelligence/llm-cost-tracker'
import { NotificationBatchingEngine } from '../intelligence/notification-batching'
import { MeetingIntelligenceEngine } from '../intelligence/meeting-intelligence'
import { EmailOutreachEngine } from '../intelligence/email-outreach'
import type { ExpertPersona } from '../intelligence/business-intelligence-council'
import type { PipelineStage } from '../intelligence/lead-pipeline'
import type { SequenceType } from '../intelligence/email-outreach'

// ============================================================================
// TOOL EXECUTOR
// ============================================================================

export class ToolExecutor {
  private memoryService: AgentMemoryService

  constructor(
    private cabinetId: string,
    private userId: string,
  ) {
    this.memoryService = new AgentMemoryService(cabinetId, userId)
  }

  /**
   * Exécute un outil et retourne le résultat au format V2.
   * Délègue aux implémentations V1 existantes pour la compatibilité.
   */
  async execute(
    toolName: string,
    params: Record<string, unknown>,
    context: AgentContext,
  ): Promise<ToolCallResult> {
    const startTime = Date.now()

    // Construire le contexte V1 pour compatibilité
    const v1Context: ToolContextV1 = {
      cabinetId: this.cabinetId,
      userId: this.userId,
      clientId: context.clientId,
    }

    try {
      // Cas spéciaux gérés nativement en V2
      switch (toolName) {
        case 'run_simulation':
          return await this.executeSimulation(params, context, startTime)
        case 'analyze_patrimoine':
          return await this.executeAnalysis(params, context, startTime)
        case 'generate_document_draft':
          return await this.executeDocumentDraft(params, context, startTime)
        case 'navigate_to':
          return this.executeNavigation(params, startTime)
        case 'web_search':
          return await this.executeWebSearch(params, startTime)
        case 'dvf_price_lookup':
          return await this.executeDVFPriceLookup(params, startTime)
        case 'market_data':
          return await this.executeMarketData(params, startTime)

        // ── Intelligence Engines ──
        case 'score_client_relationship':
          return await this.executeScoreClientRelationship(params, startTime)
        case 'score_portfolio_relationships':
          return await this.executeScorePortfolioRelationships(params, startTime)
        case 'generate_nudges':
          return await this.executeGenerateNudges(params, startTime)
        case 'profile_client_relationship':
          return await this.executeProfileClientRelationship(params, startTime)
        case 'get_portfolio_dashboard':
          return await this.executeGetPortfolioDashboard(startTime)
        case 'score_prospect':
          return await this.executeScoreProspect(params, startTime)
        case 'advance_pipeline_stage':
          return await this.executeAdvancePipelineStage(params, startTime)
        case 'get_pipeline_stats':
          return await this.executeGetPipelineStats(startTime)
        case 'run_bi_council':
          return await this.executeRunBICouncil(startTime)
        case 'run_bi_expert':
          return await this.executeRunBIExpert(params, startTime)
        case 'analyze_allocation':
          return await this.executeAnalyzeAllocation(params, startTime)
        case 'distribute_contribution':
          return await this.executeDistributeContribution(params, startTime)
        case 'detect_portfolio_drifts':
          return await this.executeDetectPortfolioDrifts(startTime)
        case 'analyze_meeting':
          return await this.executeAnalyzeMeeting(params, startTime)
        case 'apply_meeting_actions':
          return await this.executeApplyMeetingActions(params, startTime)
        case 'get_pending_meeting_analyses':
          return await this.executeGetPendingMeetingAnalyses(startTime)
        case 'create_email_sequence':
          return await this.executeCreateEmailSequence(params, startTime)
        case 'get_smart_followups':
          return await this.executeGetSmartFollowups(params, startTime)
        case 'personalize_email':
          return await this.executePersonalizeEmail(params, startTime)
        case 'list_email_sequences':
          return this.executeListEmailSequences(startTime)
        case 'get_notification_digest':
          return await this.executeGetNotificationDigest(startTime)
        case 'get_ai_usage_report':
          return await this.executeGetAIUsageReport(params, startTime)
        case 'check_ai_budget':
          return await this.executeCheckAIBudget(startTime)
      }

      // Mapper les noms d'outils V2 → V1 si différents
      const v1ToolName = this.mapToolNameToV1(toolName)

      // Déléguer à l'implémentation V1 base
      const v1Result = await executeToolV1(v1ToolName, params, v1Context, '')

      // Si V1 base ne connaît pas l'outil, essayer extended puis MCP
      if (!v1Result.success && v1Result.message?.includes('Outil inconnu')) {
        // Try extended tools (dossiers, contrats, KYC, email, agenda, commercial, workflows...)
        const extResult = await executeExtendedTool(toolName, params, v1Context)
        if (extResult) {
          const durationMs = Date.now() - startTime
          return {
            toolCallId: '',
            toolName,
            success: extResult.success,
            data: extResult.data,
            error: extResult.success ? undefined : extResult.message,
            message: extResult.message,
            durationMs,
            dataAccessed: this.inferDataAccessed(toolName, params),
            navigationUrl: extResult.navigationUrl,
          }
        }

        // Try MCP tools (data.gouv.fr, INSEE SIRENE)
        if (toolName.startsWith('mcp_')) {
          const mcpResult = await executeMCPTool(toolName, params)
          if (mcpResult) {
            const durationMs = Date.now() - startTime
            return {
              toolCallId: '',
              toolName,
              success: mcpResult.success,
              data: mcpResult.data,
              error: mcpResult.success ? undefined : mcpResult.message,
              message: mcpResult.message,
              durationMs,
              dataAccessed: this.inferDataAccessed(toolName, params),
              navigationUrl: mcpResult.navigationUrl,
            }
          }
        }
      }

      const durationMs = Date.now() - startTime

      // Mapper le résultat au format V2
      return {
        toolCallId: '',
        toolName,
        success: v1Result.success,
        data: v1Result.data,
        error: v1Result.success ? undefined : v1Result.message,
        message: v1Result.message,
        durationMs,
        dataAccessed: this.inferDataAccessed(toolName, params),
        navigationUrl: v1Result.navigationUrl,
      }
    } catch (error) {
      const durationMs = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)

      return {
        toolCallId: '',
        toolName,
        success: false,
        error: errorMessage,
        message: `Erreur lors de l'exécution de ${toolName}: ${errorMessage}`,
        durationMs,
        dataAccessed: [],
      }
    }
  }

  // ── Mapping V2 → V1 ──

  private mapToolNameToV1(toolName: string): string {
    const mapping: Record<string, string> = {
      'get_client_details': 'get_client_detail',
      'get_client_patrimoine': 'get_portfolio_summary',
      'get_client_contrats': 'search_contracts',
      'get_tasks': 'get_upcoming_tasks',
      'get_appointments': 'get_upcoming_appointments',
      'get_opportunities': 'search_contracts', // Fallback
      'search_memory': 'list_instructions',
    }
    return mapping[toolName] || toolName
  }

  // ── Implémentations V2 natives ──

  /**
   * Exécute une simulation via les API backend.
   * Le backend calcule — l'agent n'invente JAMAIS les résultats.
   */
  private async executeSimulation(
    params: Record<string, unknown>,
    context: AgentContext,
    startTime: number,
  ): Promise<ToolCallResult> {
    const simulator = params.simulator as string
    const inputs = params.inputs as Record<string, unknown>

    // Construire l'URL de l'API de simulation
    const simulatorRoutes: Record<string, string> = {
      'ir': '/api/advisor/simulators/ir',
      'per': '/api/advisor/simulators/per-salaries',
      'per-salaries': '/api/advisor/simulators/per-salaries',
      'assurance-vie': '/api/advisor/simulators/assurance-vie',
      'assurance-vie-rachat': '/api/advisor/simulators/assurance-vie/rachat',
      'assurance-vie-deces': '/api/advisor/simulators/assurance-vie/deces',
      'succession': '/api/advisor/simulators/succession/simulate',
      'ifi': '/api/advisor/simulators/ifi',
      'prevoyance-tns': '/api/advisor/simulators/prevoyance-tns',
      'immobilier': '/api/advisor/simulators/immobilier',
      'immobilier-lmnp': '/api/advisor/simulators/immobilier/lmnp',
      'immobilier-lmp': '/api/advisor/simulators/immobilier/lmp',
      'immobilier-scpi': '/api/advisor/simulators/immobilier/scpi',
      'plus-values': '/api/advisor/simulators/plus-values',
      'budget': '/api/advisor/simulators/budget',
      'epargne': '/api/advisor/simulators/epargne',
      'capacite-emprunt': '/api/advisor/simulators/capacite-emprunt',
      'retraite': '/api/advisor/simulators/retirement/simulate',
    }

    const route = simulatorRoutes[simulator]
    if (!route) {
      return {
        toolCallId: '',
        toolName: 'run_simulation',
        success: false,
        error: `Simulateur inconnu: ${simulator}`,
        message: `Simulateur "${simulator}" non disponible. Simulateurs disponibles : ${Object.keys(simulatorRoutes).join(', ')}`,
        durationMs: Date.now() - startTime,
        dataAccessed: [],
      }
    }

    try {
      // Appel interne au simulateur backend
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}${route}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cabinet-Id': context.cabinetId,
          'X-User-Id': context.userId,
        },
        body: JSON.stringify(inputs),
        signal: AbortSignal.timeout(25_000),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Erreur inconnue')
        return {
          toolCallId: '',
          toolName: 'run_simulation',
          success: false,
          error: `Simulateur ${simulator} erreur ${response.status}: ${errorText}`,
          message: `Erreur lors de la simulation ${simulator}`,
          durationMs: Date.now() - startTime,
          dataAccessed: [],
        }
      }

      const result = await response.json()
      return {
        toolCallId: '',
        toolName: 'run_simulation',
        success: true,
        data: result,
        message: `Simulation ${simulator} effectuée avec succès (résultats calculés par le backend)`,
        durationMs: Date.now() - startTime,
        dataAccessed: params.clientId ? [`Client:${params.clientId}`] : [],
      }
    } catch (error) {
      return {
        toolCallId: '',
        toolName: 'run_simulation',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: `Erreur technique lors de la simulation ${simulator}`,
        durationMs: Date.now() - startTime,
        dataAccessed: [],
      }
    }
  }

  /**
   * Exécute une analyse patrimoniale via le backend.
   */
  private async executeAnalysis(
    params: Record<string, unknown>,
    context: AgentContext,
    startTime: number,
  ): Promise<ToolCallResult> {
    const clientId = params.clientId as string
    if (!clientId) {
      return {
        toolCallId: '',
        toolName: 'analyze_patrimoine',
        success: false,
        error: 'ID client requis',
        message: 'Veuillez préciser le client à analyser.',
        durationMs: Date.now() - startTime,
        dataAccessed: [],
      }
    }

    try {
      // Appel interne à l'API d'analyse
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/advisor/clients/${clientId}/overview`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Cabinet-Id': context.cabinetId,
          'X-User-Id': context.userId,
        },
        signal: AbortSignal.timeout(25_000),
      })

      if (!response.ok) {
        // Fallback : utiliser les outils V1 pour récupérer les données
        const v1Context: ToolContextV1 = {
          cabinetId: this.cabinetId,
          userId: this.userId,
          clientId,
        }

        const [clientDetail, portfolio] = await Promise.all([
          executeToolV1('get_client_detail', { clientId }, v1Context, ''),
          executeToolV1('get_portfolio_summary', { clientId }, v1Context, ''),
        ])

        return {
          toolCallId: '',
          toolName: 'analyze_patrimoine',
          success: true,
          data: {
            client: clientDetail.data,
            patrimoine: portfolio.data,
            source: 'crm_data',
            disclaimer: 'Données brutes du CRM — analyse à valider par le conseiller',
          },
          message: `Données patrimoniales récupérées pour l'analyse`,
          durationMs: Date.now() - startTime,
          dataAccessed: [`Client:${clientId}`, 'Actif', 'Passif', 'Contrat'],
        }
      }

      const result = await response.json()
      return {
        toolCallId: '',
        toolName: 'analyze_patrimoine',
        success: true,
        data: result,
        message: `Analyse patrimoniale effectuée (calculs backend)`,
        durationMs: Date.now() - startTime,
        dataAccessed: [`Client:${clientId}`, 'Actif', 'Passif', 'Contrat'],
      }
    } catch (error) {
      return {
        toolCallId: '',
        toolName: 'analyze_patrimoine',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: `Erreur lors de l'analyse patrimoniale`,
        durationMs: Date.now() - startTime,
        dataAccessed: [],
      }
    }
  }

  /**
   * Génère un brouillon de document.
   * IMPORTANT : Le résultat est TOUJOURS un brouillon, jamais un document officiel.
   */
  private async executeDocumentDraft(
    params: Record<string, unknown>,
    context: AgentContext,
    startTime: number,
  ): Promise<ToolCallResult> {
    const docType = params.type as string
    const clientId = params.clientId as string

    if (!docType || !clientId) {
      return {
        toolCallId: '',
        toolName: 'generate_document_draft',
        success: false,
        error: 'Type de document et ID client requis',
        message: 'Veuillez préciser le type de document et le client.',
        durationMs: Date.now() - startTime,
        dataAccessed: [],
      }
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const response = await fetch(`${baseUrl}/api/advisor/pdf/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cabinet-Id': context.cabinetId,
          'X-User-Id': context.userId,
        },
        body: JSON.stringify({
          type: docType,
          clientId,
          options: params.options || {},
          isDraft: true, // TOUJOURS brouillon
        }),
        signal: AbortSignal.timeout(55_000),
      })

      if (!response.ok) {
        return {
          toolCallId: '',
          toolName: 'generate_document_draft',
          success: false,
          error: `Erreur génération document: ${response.status}`,
          message: `Impossible de générer le brouillon ${docType}`,
          durationMs: Date.now() - startTime,
          dataAccessed: [`Client:${clientId}`],
        }
      }

      const result = await response.json()
      return {
        toolCallId: '',
        toolName: 'generate_document_draft',
        success: true,
        data: {
          ...result,
          isDraft: true,
          disclaimer: '⚠️ BROUILLON — Ce document n\'a aucune valeur officielle sans validation et signature du conseiller.',
        },
        message: `Brouillon "${docType}" généré pour le client. ⚠️ Document à valider avant utilisation.`,
        durationMs: Date.now() - startTime,
        dataAccessed: [`Client:${clientId}`, 'Contrat', 'Actif', 'Passif'],
      }
    } catch (error) {
      return {
        toolCallId: '',
        toolName: 'generate_document_draft',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: `Erreur lors de la génération du brouillon`,
        durationMs: Date.now() - startTime,
        dataAccessed: [],
      }
    }
  }

  /**
   * Navigation CRM (résolution d'URL).
   */
  private executeNavigation(
    params: Record<string, unknown>,
    startTime: number,
  ): ToolCallResult {
    const page = params.page as string
    const entityId = params.entityId as string | undefined
    const tab = params.tab as string | undefined

    const urlMap: Record<string, string> = {
      'client': entityId ? `/dashboard/clients/${entityId}${tab ? `?tab=${tab}` : ''}` : '/dashboard/clients',
      'task': '/dashboard/taches',
      'appointment': '/dashboard/agenda',
      'simulator': '/dashboard/simulateurs',
      'dashboard': '/dashboard',
      'settings': '/dashboard/parametres',
    }

    const url = urlMap[page] || '/dashboard'

    return {
      toolCallId: '',
      toolName: 'navigate_to',
      success: true,
      message: `Navigation vers ${page}${entityId ? ` (${entityId})` : ''}`,
      durationMs: Date.now() - startTime,
      dataAccessed: [],
      navigationUrl: url,
    }
  }

  /**
   * Recherche web via Tavily API (conçu pour les agents IA) ou Serper.dev en fallback.
   * Retourne des résultats structurés avec titre, URL, extrait.
   */
  private async executeWebSearch(
    params: Record<string, unknown>,
    startTime: number,
  ): Promise<ToolCallResult> {
    const query = params.query as string
    const domain = params.domain as string | undefined
    const limit = Math.min((params.limit as number) || 5, 10)

    if (!query || query.trim().length === 0) {
      return {
        toolCallId: '',
        toolName: 'web_search',
        success: false,
        error: 'Requête de recherche vide',
        message: 'Veuillez fournir une requête de recherche.',
        durationMs: Date.now() - startTime,
        dataAccessed: [],
      }
    }

    // Try Tavily API first (best for AI agents)
    const tavilyKey = process.env.TAVILY_API_KEY
    if (tavilyKey) {
      try {
        const response = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: tavilyKey,
            query: query.trim(),
            search_depth: 'basic',
            include_answer: true,
            include_raw_content: false,
            max_results: limit,
            ...(domain ? { include_domains: [domain] } : {}),
          }),
          signal: AbortSignal.timeout(12_000),
        })

        if (response.ok) {
          const data = await response.json()
          const results = (data.results || []).map((r: { title?: string; url?: string; content?: string; score?: number }) => ({
            title: r.title || '',
            url: r.url || '',
            snippet: r.content || '',
            relevance: r.score || 0,
          }))

          return {
            toolCallId: '',
            toolName: 'web_search',
            success: true,
            data: {
              query: query.trim(),
              answer: data.answer || null,
              results,
              resultCount: results.length,
              source: 'tavily',
            },
            message: `${results.length} résultat(s) trouvé(s) pour "${query.trim()}"${data.answer ? ' — réponse directe disponible' : ''}`,
            durationMs: Date.now() - startTime,
            dataAccessed: ['Web:search'],
          }
        }
      } catch {
        // Tavily failed, try fallback
      }
    }

    // Fallback: Serper.dev (Google Search API)
    const serperKey = process.env.SERPER_API_KEY
    if (serperKey) {
      try {
        const response = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': serperKey,
          },
          body: JSON.stringify({
            q: domain ? `site:${domain} ${query.trim()}` : query.trim(),
            gl: 'fr',
            hl: 'fr',
            num: limit,
          }),
          signal: AbortSignal.timeout(10_000),
        })

        if (response.ok) {
          const data = await response.json()
          const organic = (data.organic || []).slice(0, limit)
          const results = organic.map((r: { title?: string; link?: string; snippet?: string; position?: number }) => ({
            title: r.title || '',
            url: r.link || '',
            snippet: r.snippet || '',
            position: r.position || 0,
          }))

          return {
            toolCallId: '',
            toolName: 'web_search',
            success: true,
            data: {
              query: query.trim(),
              answer: data.answerBox?.answer || data.answerBox?.snippet || null,
              results,
              resultCount: results.length,
              source: 'serper',
            },
            message: `${results.length} résultat(s) trouvé(s) pour "${query.trim()}"`,
            durationMs: Date.now() - startTime,
            dataAccessed: ['Web:search'],
          }
        }
      } catch {
        // Serper failed too
      }
    }

    // No search API configured
    return {
      toolCallId: '',
      toolName: 'web_search',
      success: false,
      error: 'Aucune API de recherche web configurée',
      message: 'La recherche web n\'est pas disponible. Configurez TAVILY_API_KEY ou SERPER_API_KEY dans les variables d\'environnement.',
      durationMs: Date.now() - startTime,
      dataAccessed: [],
    }
  }

  /**
   * Données financières temps réel : cotations, indices, taux, recherche.
   */
  private async executeMarketData(
    params: Record<string, unknown>,
    startTime: number,
  ): Promise<ToolCallResult> {
    const action = params.action as string
    const symbols = params.symbols as string[] | undefined
    const query = params.query as string | undefined

    if (!action) {
      return {
        toolCallId: '',
        toolName: 'market_data',
        success: false,
        error: 'Action requise',
        message: 'Veuillez préciser l\'action : quotes, overview, rates ou search.',
        durationMs: Date.now() - startTime,
        dataAccessed: [],
      }
    }

    const market = new MarketDataService()

    try {
      switch (action) {
        case 'quotes': {
          if (!symbols || symbols.length === 0) {
            return {
              toolCallId: '',
              toolName: 'market_data',
              success: false,
              error: 'Symboles requis pour action=quotes',
              message: 'Veuillez fournir des symboles financiers (ex: ["^FCHI", "MC.PA"]).',
              durationMs: Date.now() - startTime,
              dataAccessed: [],
            }
          }
          const quotes = await market.getQuotes(symbols.slice(0, 15))
          return {
            toolCallId: '',
            toolName: 'market_data',
            success: true,
            data: { action: 'quotes', quotes },
            message: `${quotes.length} cotation(s) récupérée(s) : ${quotes.map(q => `${q.name} ${q.price} ${q.currency} (${q.changePercent >= 0 ? '+' : ''}${q.changePercent.toFixed(2)}%)`).join(', ')}`,
            durationMs: Date.now() - startTime,
            dataAccessed: ['Market:quotes'],
          }
        }

        case 'overview': {
          const overview = await market.getMarketOverview()
          return {
            toolCallId: '',
            toolName: 'market_data',
            success: true,
            data: { action: 'overview', ...overview },
            message: `Aperçu des marchés : ${overview.indices.map(i => `${i.name} ${i.value.toLocaleString('fr-FR')} (${i.changePercent >= 0 ? '+' : ''}${i.changePercent.toFixed(2)}%)`).join(', ')} — ${overview.rates.length} taux récupérés`,
            durationMs: Date.now() - startTime,
            dataAccessed: ['Market:overview'],
          }
        }

        case 'rates': {
          const rates = await market.getKeyRates()
          return {
            toolCallId: '',
            toolName: 'market_data',
            success: true,
            data: { action: 'rates', rates },
            message: `${rates.length} taux récupérés : ${rates.map(r => `${r.name} ${r.rate}%`).join(', ')}`,
            durationMs: Date.now() - startTime,
            dataAccessed: ['Market:rates'],
          }
        }

        case 'search': {
          if (!query) {
            return {
              toolCallId: '',
              toolName: 'market_data',
              success: false,
              error: 'Requête requise pour action=search',
              message: 'Veuillez fournir un terme de recherche (ex: "LVMH", "CAC 40").',
              durationMs: Date.now() - startTime,
              dataAccessed: [],
            }
          }
          const results = await market.searchSymbol(query)
          return {
            toolCallId: '',
            toolName: 'market_data',
            success: true,
            data: { action: 'search', query, results },
            message: `${results.length} résultat(s) pour "${query}" : ${results.slice(0, 5).map(r => `${r.symbol} (${r.name})`).join(', ')}`,
            durationMs: Date.now() - startTime,
            dataAccessed: ['Market:search'],
          }
        }

        default:
          return {
            toolCallId: '',
            toolName: 'market_data',
            success: false,
            error: `Action inconnue: ${action}`,
            message: 'Actions disponibles : quotes, overview, rates, search.',
            durationMs: Date.now() - startTime,
            dataAccessed: [],
          }
      }
    } catch (error) {
      return {
        toolCallId: '',
        toolName: 'market_data',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Erreur lors de la récupération des données de marché.',
        durationMs: Date.now() - startTime,
        dataAccessed: [],
      }
    }
  }

  /**
   * Recherche DVF (Demandes de Valeurs Foncières) pour obtenir les prix immobiliers réels.
   * API gratuite, données DGFiP depuis 2014.
   */
  private async executeDVFPriceLookup(
    params: Record<string, unknown>,
    startTime: number,
  ): Promise<ToolCallResult> {
    const codePostal = params.codePostal as string | undefined
    const codeCommune = params.codeCommune as string | undefined
    const typeLocal = params.typeLocal as 'Maison' | 'Appartement' | undefined
    const lat = params.lat as number | undefined
    const lon = params.lon as number | undefined

    if (!codePostal && !codeCommune && (!lat || !lon)) {
      return {
        toolCallId: '',
        toolName: 'dvf_price_lookup',
        success: false,
        error: 'Localisation requise',
        message: 'Veuillez fournir un code postal, un code commune INSEE, ou des coordonnées GPS.',
        durationMs: Date.now() - startTime,
        dataAccessed: [],
      }
    }

    try {
      const dvf = new DVFService()
      const stats = await dvf.getPriceStats({
        codePostal,
        codeCommune,
        typeLocal,
        lat,
        lon,
      })

      if (!stats) {
        return {
          toolCallId: '',
          toolName: 'dvf_price_lookup',
          success: true,
          data: { query: { codePostal, codeCommune, typeLocal }, results: null },
          message: `Aucune transaction DVF trouvée pour ${codePostal || codeCommune || `lat=${lat},lon=${lon}`}${typeLocal ? ` (${typeLocal})` : ''}. La base DVF ne couvre pas l'Alsace, la Moselle et Mayotte.`,
          durationMs: Date.now() - startTime,
          dataAccessed: ['DVF:search'],
        }
      }

      return {
        toolCallId: '',
        toolName: 'dvf_price_lookup',
        success: true,
        data: stats,
        message: `Prix immobiliers à ${stats.commune} (${stats.codePostal}) — ${stats.typeLocal} : médiane ${stats.prixM2.median}€/m², moyenne ${stats.prixM2.moyen}€/m² sur ${stats.nombreTransactions} transactions (${stats.periode.debut} → ${stats.periode.fin})`,
        durationMs: Date.now() - startTime,
        dataAccessed: ['DVF:search'],
      }
    } catch (error) {
      return {
        toolCallId: '',
        toolName: 'dvf_price_lookup',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        message: 'Erreur lors de la consultation des données DVF.',
        durationMs: Date.now() - startTime,
        dataAccessed: [],
      }
    }
  }

  // ── Inférence des données accédées (RGPD) ──

  private inferDataAccessed(toolName: string, params: Record<string, unknown>): string[] {
    const accessed: string[] = []
    const clientId = params.clientId as string | undefined

    switch (toolName) {
      case 'search_clients':
        accessed.push('Client:list')
        break
      case 'get_client_detail':
      case 'get_client_details':
        if (clientId) accessed.push(`Client:${clientId}`, 'Contrat', 'Actif', 'Passif')
        break
      case 'get_portfolio_summary':
      case 'get_client_patrimoine':
        if (clientId) accessed.push(`Client:${clientId}`, 'Actif', 'Passif')
        break
      case 'get_client_contrats':
      case 'search_contracts':
        if (clientId) accessed.push(`Client:${clientId}`, 'Contrat')
        break
      case 'get_upcoming_tasks':
      case 'get_tasks':
        accessed.push('Tache')
        break
      case 'get_upcoming_appointments':
      case 'get_appointments':
        accessed.push('RendezVous')
        break
      case 'get_kyc_alerts':
        accessed.push('Client:kyc')
        break
      case 'get_dashboard_stats':
        accessed.push('Dashboard:stats')
        break
      case 'create_task':
        accessed.push('Tache:create')
        if (clientId) accessed.push(`Client:${clientId}`)
        break
      case 'create_appointment':
        accessed.push('RendezVous:create')
        if (clientId) accessed.push(`Client:${clientId}`)
        break
    }

    return accessed
  }

  // ══════════════════════════════════════════════════════════════════════════
  // INTELLIGENCE ENGINE EXECUTORS
  // ══════════════════════════════════════════════════════════════════════════

  // ── Relationship Intelligence ──

  private async executeScoreClientRelationship(params: Record<string, unknown>, startTime: number): Promise<ToolCallResult> {
    const clientId = params.clientId as string
    if (!clientId) return this.errorResult('score_client_relationship', 'ID client requis', startTime)
    const engine = new RelationshipIntelligenceEngine(this.cabinetId, this.userId)
    const score = await engine.scoreClient(clientId)
    return {
      toolCallId: '', toolName: 'score_client_relationship', success: true, data: score,
      message: `Score relationnel de ${score.clientName}: ${score.score}/100 (Grade ${score.grade}, tendance ${score.trend}). Récence: ${score.dimensions.recency}/25, Fréquence: ${score.dimensions.frequency}/25, Profondeur: ${score.dimensions.depth}/25, Conformité: ${score.dimensions.compliance}/25. ${score.signals.length} signal(s) détecté(s).`,
      durationMs: Date.now() - startTime, dataAccessed: [`Client:${clientId}`],
    }
  }

  private async executeScorePortfolioRelationships(params: Record<string, unknown>, startTime: number): Promise<ToolCallResult> {
    const engine = new RelationshipIntelligenceEngine(this.cabinetId, this.userId)
    const scores = await engine.scorePortfolio({
      limit: params.limit as number | undefined,
      sortBy: params.sortBy as any,
      minScore: params.minScore as number | undefined,
      maxScore: params.maxScore as number | undefined,
    })
    const avg = scores.length > 0 ? Math.round(scores.reduce((s, c) => s + c.score, 0) / scores.length) : 0
    return {
      toolCallId: '', toolName: 'score_portfolio_relationships', success: true, data: scores,
      message: `${scores.length} client(s) scoré(s). Score moyen: ${avg}/100. Top: ${scores.slice(0, 3).map(s => `${s.clientName} ${s.score}`).join(', ')}. Bas: ${scores.slice(-3).map(s => `${s.clientName} ${s.score}`).join(', ')}.`,
      durationMs: Date.now() - startTime, dataAccessed: ['Client:list'],
    }
  }

  private async executeGenerateNudges(params: Record<string, unknown>, startTime: number): Promise<ToolCallResult> {
    const engine = new RelationshipIntelligenceEngine(this.cabinetId, this.userId)
    const nudges = await engine.generateNudges({ limit: params.limit as number | undefined })
    const criticals = nudges.filter(n => n.urgency === 'critical')
    return {
      toolCallId: '', toolName: 'generate_nudges', success: true, data: nudges,
      message: `${nudges.length} nudge(s) générée(s) dont ${criticals.length} critique(s). ${nudges.slice(0, 5).map(n => `• [${n.urgency.toUpperCase()}] ${n.title}`).join('\n')}`,
      durationMs: Date.now() - startTime, dataAccessed: ['Client:list', 'Tache', 'Contrat'],
    }
  }

  private async executeProfileClientRelationship(params: Record<string, unknown>, startTime: number): Promise<ToolCallResult> {
    const clientId = params.clientId as string
    if (!clientId) return this.errorResult('profile_client_relationship', 'ID client requis', startTime)
    const engine = new RelationshipIntelligenceEngine(this.cabinetId, this.userId)
    const profile = await engine.profileClient(clientId)
    return {
      toolCallId: '', toolName: 'profile_client_relationship', success: true, data: profile,
      message: `Profil: Segment ${profile.segment}, Cycle ${profile.lifeCycleStage}, Engagement ${profile.engagementLevel}, Comm ${profile.communicationPreference}. Sujets: ${profile.keyTopics.join(', ')}. Opportunités: ${profile.opportunityAreas.join(', ') || 'aucune'}. Fréquence recommandée: ${profile.recommendedFrequency}.`,
      durationMs: Date.now() - startTime, dataAccessed: [`Client:${clientId}`],
    }
  }

  private async executeGetPortfolioDashboard(startTime: number): Promise<ToolCallResult> {
    const engine = new RelationshipIntelligenceEngine(this.cabinetId, this.userId)
    const dashboard = await engine.getPortfolioDashboard()
    return {
      toolCallId: '', toolName: 'get_portfolio_dashboard', success: true, data: dashboard,
      message: `Dashboard: ${dashboard.totalClients} clients, score moyen ${dashboard.averageScore}/100. Grades: A=${dashboard.gradeDistribution.A || 0} B=${dashboard.gradeDistribution.B || 0} C=${dashboard.gradeDistribution.C || 0} D=${dashboard.gradeDistribution.D || 0} F=${dashboard.gradeDistribution.F || 0}. ${dashboard.criticalNudges} alerte(s) critique(s).`,
      durationMs: Date.now() - startTime, dataAccessed: ['Client:list'],
    }
  }

  // ── Lead Pipeline ──

  private async executeScoreProspect(params: Record<string, unknown>, startTime: number): Promise<ToolCallResult> {
    const clientId = params.clientId as string
    if (!clientId) return this.errorResult('score_prospect', 'ID prospect requis', startTime)
    const engine = new LeadPipelineEngine(this.cabinetId, this.userId)
    const score = await engine.scoreProspect(clientId)
    return {
      toolCallId: '', toolName: 'score_prospect', success: true, data: score,
      message: `Score prospect ${score.clientName}: ${score.totalScore}/100 (${score.bucket}). Fit: ${score.dimensions.fit}/20, Potentiel: ${score.dimensions.potential}/20, Maturité: ${score.dimensions.maturity}/20, Confiance: ${score.dimensions.trust}/20, Timeline: ${score.dimensions.timeline}/20. CA estimé: ${score.estimatedRevenue}€/an. Action: ${score.recommendedAction}`,
      durationMs: Date.now() - startTime, dataAccessed: [`Client:${clientId}`],
    }
  }

  private async executeAdvancePipelineStage(params: Record<string, unknown>, startTime: number): Promise<ToolCallResult> {
    const clientId = params.clientId as string
    const toStage = params.toStage as PipelineStage
    const reason = params.reason as string
    if (!clientId || !toStage || !reason) return this.errorResult('advance_pipeline_stage', 'clientId, toStage et reason requis', startTime)
    const engine = new LeadPipelineEngine(this.cabinetId, this.userId)
    const result = await engine.advanceStage(clientId, toStage, reason)
    return {
      toolCallId: '', toolName: 'advance_pipeline_stage', success: result.success, data: result.transition,
      message: result.message, error: result.success ? undefined : result.message,
      durationMs: Date.now() - startTime, dataAccessed: [`Client:${clientId}`],
    }
  }

  private async executeGetPipelineStats(startTime: number): Promise<ToolCallResult> {
    const engine = new LeadPipelineEngine(this.cabinetId, this.userId)
    const stats = await engine.getPipelineStats()
    return {
      toolCallId: '', toolName: 'get_pipeline_stats', success: true, data: stats,
      message: `Pipeline: ${stats.totalProspects} prospects. Conversion: ${stats.conversionRate}%. ${stats.staleLeads.length} prospect(s) stagnant(s). Top scorés: ${stats.topScored.slice(0, 3).map(s => `${s.clientName} (${s.totalScore})`).join(', ')}.`,
      durationMs: Date.now() - startTime, dataAccessed: ['Client:list'],
    }
  }

  // ── Business Intelligence Council ──

  private async executeRunBICouncil(startTime: number): Promise<ToolCallResult> {
    const council = new BusinessIntelligenceCouncil(this.cabinetId, this.userId)
    const digest = await council.runCouncil()
    const criticals = digest.expertInsights.filter(i => i.priority === 'critical')
    return {
      toolCallId: '', toolName: 'run_bi_council', success: true, data: digest,
      message: `Business Intelligence Council — ${digest.expertInsights.length} insight(s) dont ${criticals.length} critique(s).\n\nFocus semaine: ${digest.synthesis.weeklyFocus}\nThème mensuel: ${digest.synthesis.monthlyTheme}\n\nTop recommandations:\n${digest.synthesis.topRecommendations.slice(0, 5).map((r, i) => `${i + 1}. [${r.expert}] ${r.title}`).join('\n')}`,
      durationMs: Date.now() - startTime, dataAccessed: ['Client:list', 'Contrat', 'Actif'],
    }
  }

  private async executeRunBIExpert(params: Record<string, unknown>, startTime: number): Promise<ToolCallResult> {
    const expert = params.expert as ExpertPersona
    if (!expert) return this.errorResult('run_bi_expert', 'Expert requis (FISCAL, IMMOBILIER, ASSURANCE_VIE, RETRAITE, CONFORMITE, COMMERCIAL)', startTime)
    const council = new BusinessIntelligenceCouncil(this.cabinetId, this.userId)
    const insights = await council.runExpert(expert)
    return {
      toolCallId: '', toolName: 'run_bi_expert', success: true, data: insights,
      message: `Expert ${expert}: ${insights.length} insight(s).\n${insights.map(i => `• [${i.priority.toUpperCase()}] ${i.title} — ${i.recommendation}`).join('\n')}`,
      durationMs: Date.now() - startTime, dataAccessed: ['Client:list'],
    }
  }

  // ── Portfolio Allocation ──

  private async executeAnalyzeAllocation(params: Record<string, unknown>, startTime: number): Promise<ToolCallResult> {
    const clientId = params.clientId as string
    if (!clientId) return this.errorResult('analyze_allocation', 'ID client requis', startTime)
    const engine = new PortfolioAllocationEngine(this.cabinetId)
    const proposal = await engine.analyzeAndRebalance(clientId)
    return {
      toolCallId: '', toolName: 'analyze_allocation', success: true, data: proposal,
      message: `Allocation ${proposal.clientName} (${(proposal.totalPortfolio / 1000).toFixed(0)}K€): Urgence rééquilibrage ${proposal.summary.rebalanceUrgency}. Drift max: ${proposal.summary.maxDrift.toFixed(1)}%. ${proposal.summary.totalMoves} mouvement(s) proposé(s): achats ${(proposal.summary.totalBuys / 1000).toFixed(0)}K€, ventes ${(proposal.summary.totalSells / 1000).toFixed(0)}K€.`,
      durationMs: Date.now() - startTime, dataAccessed: [`Client:${clientId}`, 'Actif', 'Contrat'],
    }
  }

  private async executeDistributeContribution(params: Record<string, unknown>, startTime: number): Promise<ToolCallResult> {
    const clientId = params.clientId as string
    const monthlyAmount = params.monthlyAmount as number
    if (!clientId || !monthlyAmount) return this.errorResult('distribute_contribution', 'clientId et monthlyAmount requis', startTime)
    const engine = new PortfolioAllocationEngine(this.cabinetId)
    const plan = await engine.distributeContribution(clientId, monthlyAmount)
    return {
      toolCallId: '', toolName: 'distribute_contribution', success: true, data: plan,
      message: `Distribution de ${monthlyAmount}€/mois:\n${plan.distributions.map(d => `• ${d.label}: ${d.amount}€ (${d.pct}%) — ${d.rationale}`).join('\n')}`,
      durationMs: Date.now() - startTime, dataAccessed: [`Client:${clientId}`, 'Actif'],
    }
  }

  private async executeDetectPortfolioDrifts(startTime: number): Promise<ToolCallResult> {
    const engine = new PortfolioAllocationEngine(this.cabinetId)
    const result = await engine.detectPortfolioDrifts()
    return {
      toolCallId: '', toolName: 'detect_portfolio_drifts', success: true, data: result,
      message: `${result.clientsWithDrift.length} client(s) avec dérive d'allocation sur ${result.totalClientsAnalyzed} analysés. ${result.criticalCount} critique(s). ${result.clientsWithDrift.slice(0, 5).map(c => `• ${c.clientName}: drift ${c.maxDrift.toFixed(1)}% (${c.urgency})`).join('\n')}`,
      durationMs: Date.now() - startTime, dataAccessed: ['Client:list', 'Actif'],
    }
  }

  // ── Meeting Intelligence ──

  private async executeAnalyzeMeeting(params: Record<string, unknown>, startTime: number): Promise<ToolCallResult> {
    const entretienId = params.entretienId as string
    if (!entretienId) return this.errorResult('analyze_meeting', 'ID entretien requis', startTime)
    const engine = new MeetingIntelligenceEngine(this.cabinetId, this.userId)
    const analysis = await engine.analyzeEntretien(entretienId)
    return {
      toolCallId: '', toolName: 'analyze_meeting', success: true, data: analysis,
      message: `Analyse entretien ${analysis.summary.title}: ${analysis.actionItems.length} action(s) détectée(s), ${analysis.clientUpdates.length} mise(s) à jour client, ${analysis.signals.length} signal(s). Sujets: ${analysis.summary.keyTopics.join(', ')}. Humeur client: ${analysis.summary.clientMood}.${analysis.nextMeetingSuggestion ? ` Prochain RDV suggéré: ${analysis.nextMeetingSuggestion.type} (${analysis.nextMeetingSuggestion.suggestedDate}).` : ''}`,
      durationMs: Date.now() - startTime, dataAccessed: [`Client:${analysis.clientId}`, 'Entretien'],
    }
  }

  private async executeApplyMeetingActions(params: Record<string, unknown>, startTime: number): Promise<ToolCallResult> {
    const entretienId = params.entretienId as string
    if (!entretienId) return this.errorResult('apply_meeting_actions', 'ID entretien requis', startTime)
    const engine = new MeetingIntelligenceEngine(this.cabinetId, this.userId)
    const analysis = await engine.analyzeEntretien(entretienId)
    const result = await engine.applyActions(analysis)
    return {
      toolCallId: '', toolName: 'apply_meeting_actions', success: true, data: result,
      message: `Actions appliquées: ${result.tasksCreated} tâche(s) créée(s), ${result.updatesApplied} mise(s) à jour client appliquée(s).`,
      durationMs: Date.now() - startTime, dataAccessed: [`Client:${analysis.clientId}`, 'Tache:create', 'TimelineEvent:create'],
    }
  }

  private async executeGetPendingMeetingAnalyses(startTime: number): Promise<ToolCallResult> {
    const engine = new MeetingIntelligenceEngine(this.cabinetId, this.userId)
    const pending = await engine.getPendingAnalyses()
    return {
      toolCallId: '', toolName: 'get_pending_meeting_analyses', success: true, data: pending,
      message: `${pending.length} entretien(s) en attente d'analyse: ${pending.map(p => `${p.clientName} (${p.type}, ${new Date(p.date).toLocaleDateString('fr-FR')})`).join(', ') || 'aucun'}`,
      durationMs: Date.now() - startTime, dataAccessed: ['Entretien'],
    }
  }

  // ── Email Outreach ──

  private async executeCreateEmailSequence(params: Record<string, unknown>, startTime: number): Promise<ToolCallResult> {
    const type = params.type as SequenceType
    if (!type) return this.errorResult('create_email_sequence', 'Type de séquence requis', startTime)
    const engine = new EmailOutreachEngine(this.cabinetId, this.userId)
    const clientIds = params.clientIds ? (params.clientIds as string).split(',').map(id => id.trim()) : undefined
    const sequence = await engine.createSequence({
      type,
      name: params.name as string | undefined,
      clientIds,
      segment: params.segment as string | undefined,
    })
    return {
      toolCallId: '', toolName: 'create_email_sequence', success: true, data: sequence,
      message: `Séquence "${sequence.name}" créée (${sequence.steps.length} étape(s), ${sequence.totalRecipients} destinataire(s)). Statut: ${sequence.status}.`,
      durationMs: Date.now() - startTime, dataAccessed: ['Campaign:create', 'Client:list'],
    }
  }

  private async executeGetSmartFollowups(params: Record<string, unknown>, startTime: number): Promise<ToolCallResult> {
    const engine = new EmailOutreachEngine(this.cabinetId, this.userId)
    const followups = await engine.getSmartFollowUps({ limit: params.limit as number | undefined })
    return {
      toolCallId: '', toolName: 'get_smart_followups', success: true, data: followups,
      message: `${followups.length} follow-up(s) suggéré(s):\n${followups.slice(0, 5).map(f => `• [${f.urgency.toUpperCase()}] ${f.clientName} — ${f.followUpType} relance (${f.daysSinceLastEmail}j sans réponse)`).join('\n')}`,
      durationMs: Date.now() - startTime, dataAccessed: ['Email', 'Client:list'],
    }
  }

  private async executePersonalizeEmail(params: Record<string, unknown>, startTime: number): Promise<ToolCallResult> {
    const subject = params.subject as string
    const body = params.body as string
    const clientId = params.clientId as string
    if (!subject || !body || !clientId) return this.errorResult('personalize_email', 'subject, body et clientId requis', startTime)
    const engine = new EmailOutreachEngine(this.cabinetId, this.userId)
    const result = await engine.personalizeEmail(subject, body, clientId)
    return {
      toolCallId: '', toolName: 'personalize_email', success: true, data: result,
      message: `Email personnalisé pour ${result.to}. ${result.personalizations.length} variable(s) remplacée(s). Envoi optimal: ${result.suggestedSendTime.toLocaleDateString('fr-FR')} à ${result.suggestedSendTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`,
      durationMs: Date.now() - startTime, dataAccessed: [`Client:${clientId}`],
    }
  }

  private executeListEmailSequences(startTime: number): ToolCallResult {
    const engine = new EmailOutreachEngine(this.cabinetId, this.userId)
    const sequences = engine.getAvailableSequences()
    return {
      toolCallId: '', toolName: 'list_email_sequences', success: true, data: sequences,
      message: `${sequences.length} séquence(s) disponible(s):\n${sequences.map(s => `• ${s.name} (${s.stepCount} étape(s)) — ${s.description}`).join('\n')}`,
      durationMs: Date.now() - startTime, dataAccessed: [],
    }
  }

  // ── Notification Intelligence ──

  private async executeGetNotificationDigest(startTime: number): Promise<ToolCallResult> {
    const engine = new NotificationBatchingEngine(this.cabinetId, this.userId)
    const unread = await engine.getUnread()
    return {
      toolCallId: '', toolName: 'get_notification_digest', success: true, data: unread,
      message: `${unread.total} notification(s) non lue(s): ${unread.critical.length} critique(s), ${unread.high.length} importante(s), ${unread.medium.length} moyenne(s).${unread.critical.length > 0 ? `\n🚨 Critiques: ${unread.critical.map(n => n.title).join(', ')}` : ''}`,
      durationMs: Date.now() - startTime, dataAccessed: ['Notification'],
    }
  }

  // ── LLM Cost Tracking ──

  private async executeGetAIUsageReport(params: Record<string, unknown>, startTime: number): Promise<ToolCallResult> {
    const tracker = new LLMCostTracker(this.cabinetId, this.userId)
    const period = (params.period as string) || 'month'
    const now = new Date()
    let start: Date
    let end: Date = now

    switch (period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        break
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      default: // month
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    const report = await tracker.getUsageReport(start!, end)
    return {
      toolCallId: '', toolName: 'get_ai_usage_report', success: true, data: report,
      message: `Usage IA (${period}): ${report.totalCalls} appels, ${report.totalTokens.toLocaleString('fr-FR')} tokens, ${report.totalCostEuros.toFixed(2)}€. Top modèle: ${report.byModel[0]?.model || 'N/A'} (${report.byModel[0]?.costCents || 0}c).`,
      durationMs: Date.now() - startTime, dataAccessed: ['AuraTokenUsage'],
    }
  }

  private async executeCheckAIBudget(startTime: number): Promise<ToolCallResult> {
    const tracker = new LLMCostTracker(this.cabinetId, this.userId)
    const alerts = await tracker.checkBudgetAlerts()
    return {
      toolCallId: '', toolName: 'check_ai_budget', success: true, data: alerts,
      message: alerts.length > 0
        ? `⚠️ ${alerts.length} alerte(s) budgétaire(s):\n${alerts.map(a => `• [${a.type.toUpperCase()}] ${a.message}`).join('\n')}`
        : '✅ Budget IA dans les limites. Aucune alerte.',
      durationMs: Date.now() - startTime, dataAccessed: ['AuraTokenUsage'],
    }
  }

  // ── Error helper ──

  private errorResult(toolName: string, error: string, startTime: number): ToolCallResult {
    return {
      toolCallId: '', toolName, success: false, error,
      message: error, durationMs: Date.now() - startTime, dataAccessed: [],
    }
  }
}
