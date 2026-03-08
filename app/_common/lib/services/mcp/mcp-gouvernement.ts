/**
 * ══════════════════════════════════════════════════════════════════════════════
 * MCP Gouvernemental — Client pour les serveurs MCP publics français
 * ══════════════════════════════════════════════════════════════════════════════
 *
 * Intègre les serveurs MCP (Model Context Protocol) mis en place par le
 * gouvernement français pour accéder aux données ouvertes directement
 * depuis l'IA AURA.
 *
 * Serveurs supportés :
 *   1. data.gouv.fr MCP — Données ouvertes nationales (immobilier, population, etc.)
 *      Endpoint : https://mcp.data.gouv.fr/mcp
 *      GitHub  : https://github.com/datagouv/datagouv-mcp
 *
 *   2. INSEE SIRENE — Recherche d'entreprises françaises (SIREN, SIRET, nom)
 *      API     : https://api.insee.fr/api-sirene/3.11
 *      MCP     : https://github.com/DavidScanu/mcp-insee-entreprises
 *
 * Transport : Streamable HTTP (JSON-RPC 2.0 over POST)
 * Aucune clé API requise pour data.gouv.fr (lecture seule)
 * Clé API INSEE requise pour SIRENE (via env SIRENE_API_KEY)
 */

import { logger } from '@/app/_common/lib/logger'

// ============================================================================
// TYPES
// ============================================================================

export interface MCPToolCall {
  name: string
  arguments: Record<string, unknown>
}

export interface MCPToolResult {
  success: boolean
  data: unknown
  error?: string
  source: string
}

interface JSONRPCRequest {
  jsonrpc: '2.0'
  id: number
  method: string
  params?: Record<string, unknown>
}

interface JSONRPCResponse {
  jsonrpc: '2.0'
  id: number
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
}

// ============================================================================
// CONFIG
// ============================================================================

const MCP_ENDPOINTS = {
  dataGouv: process.env.MCP_DATAGOUV_URL || 'https://mcp.data.gouv.fr/mcp',
  sirene: process.env.MCP_SIRENE_URL || 'https://api.insee.fr/api-sirene/3.11',
} as const

const SIRENE_API_KEY = process.env.SIRENE_API_KEY || ''
const MCP_TIMEOUT = 15_000

// ============================================================================
// DATA.GOUV.FR MCP CLIENT — JSON-RPC 2.0 over Streamable HTTP
// ============================================================================

let mcpRequestId = 0

async function callDataGouvMCP(method: string, params?: Record<string, unknown>): Promise<unknown> {
  const id = ++mcpRequestId
  const body: JSONRPCRequest = {
    jsonrpc: '2.0',
    id,
    method,
    params,
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), MCP_TIMEOUT)

    const response = await fetch(MCP_ENDPOINTS.dataGouv, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`MCP data.gouv.fr HTTP ${response.status}: ${response.statusText}`)
    }

    const json = await response.json() as JSONRPCResponse
    if (json.error) {
      throw new Error(`MCP RPC Error ${json.error.code}: ${json.error.message}`)
    }

    return json.result
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('MCP data.gouv.fr: timeout après 15s')
    }
    throw error
  }
}

// ============================================================================
// INSEE SIRENE API CLIENT — REST (pas MCP natif, wrapper compatible)
// ============================================================================

async function callSireneAPI(endpoint: string, params?: Record<string, string>): Promise<unknown> {
  const url = new URL(`${MCP_ENDPOINTS.sirene}/${endpoint}`)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  }
  if (SIRENE_API_KEY) {
    headers['Authorization'] = `Bearer ${SIRENE_API_KEY}`
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), MCP_TIMEOUT)

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('INSEE SIRENE: Clé API manquante ou invalide (SIRENE_API_KEY)')
      }
      throw new Error(`INSEE SIRENE HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('INSEE SIRENE: timeout après 15s')
    }
    throw error
  }
}

// ============================================================================
// TOOL IMPLEMENTATIONS
// ============================================================================

/**
 * Rechercher des jeux de données sur data.gouv.fr
 */
async function searchDatasets(query: string, pageSize = 10): Promise<MCPToolResult> {
  try {
    const result = await callDataGouvMCP('tools/call', {
      name: 'search_datasets',
      arguments: { query, page_size: pageSize },
    })
    return { success: true, data: result, source: 'data.gouv.fr' }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error('[MCP] searchDatasets error:', { error: msg })
    return { success: false, data: null, error: msg, source: 'data.gouv.fr' }
  }
}

/**
 * Obtenir les détails d'un jeu de données
 */
async function getDatasetInfo(datasetId: string): Promise<MCPToolResult> {
  try {
    const result = await callDataGouvMCP('tools/call', {
      name: 'get_dataset_info',
      arguments: { dataset_id: datasetId },
    })
    return { success: true, data: result, source: 'data.gouv.fr' }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error('[MCP] getDatasetInfo error:', { error: msg })
    return { success: false, data: null, error: msg, source: 'data.gouv.fr' }
  }
}

/**
 * Requêter des données d'une ressource data.gouv.fr
 */
async function queryResourceData(resourceId: string, question: string, pageSize = 20): Promise<MCPToolResult> {
  try {
    const result = await callDataGouvMCP('tools/call', {
      name: 'query_resource_data',
      arguments: { resource_id: resourceId, question, page_size: pageSize },
    })
    return { success: true, data: result, source: 'data.gouv.fr' }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error('[MCP] queryResourceData error:', { error: msg })
    return { success: false, data: null, error: msg, source: 'data.gouv.fr' }
  }
}

/**
 * Rechercher des APIs (dataservices) sur data.gouv.fr
 */
async function searchDataservices(query: string, pageSize = 10): Promise<MCPToolResult> {
  try {
    const result = await callDataGouvMCP('tools/call', {
      name: 'search_dataservices',
      arguments: { query, page_size: pageSize },
    })
    return { success: true, data: result, source: 'data.gouv.fr' }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error('[MCP] searchDataservices error:', { error: msg })
    return { success: false, data: null, error: msg, source: 'data.gouv.fr' }
  }
}

/**
 * Recherche d'entreprise par SIREN (9 chiffres)
 */
async function searchBySiren(siren: string): Promise<MCPToolResult> {
  try {
    const result = await callSireneAPI(`siren/${siren}`)
    return { success: true, data: result, source: 'INSEE SIRENE' }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error('[MCP] searchBySiren error:', { error: msg })
    return { success: false, data: null, error: msg, source: 'INSEE SIRENE' }
  }
}

/**
 * Recherche d'établissement par SIRET (14 chiffres)
 */
async function searchBySiret(siret: string): Promise<MCPToolResult> {
  try {
    const result = await callSireneAPI(`siret/${siret}`)
    return { success: true, data: result, source: 'INSEE SIRENE' }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error('[MCP] searchBySiret error:', { error: msg })
    return { success: false, data: null, error: msg, source: 'INSEE SIRENE' }
  }
}

/**
 * Recherche d'entreprises par nom / raison sociale
 */
async function searchEntrepriseByName(name: string, pageSize = 10): Promise<MCPToolResult> {
  try {
    const result = await callSireneAPI('siren', {
      q: `denominationUniteLegale:"${name}"`,
      nombre: String(pageSize),
    })
    return { success: true, data: result, source: 'INSEE SIRENE' }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error('[MCP] searchEntrepriseByName error:', { error: msg })
    return { success: false, data: null, error: msg, source: 'INSEE SIRENE' }
  }
}

/**
 * Rechercher des données immobilières (DVF — Demandes de Valeurs Foncières)
 */
async function searchDVF(commune: string): Promise<MCPToolResult> {
  try {
    const result = await searchDatasets(`DVF valeurs foncieres ${commune}`, 5)
    return { ...result, source: 'data.gouv.fr (DVF)' }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return { success: false, data: null, error: msg, source: 'data.gouv.fr (DVF)' }
  }
}

// ============================================================================
// TOOL DEFINITIONS pour AURA V2 (OpenAI function calling)
// ============================================================================

import type { ToolDefinition, ToolResult } from '../agent/agent-tools'

export const MCP_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'mcp_search_datasets',
    description: "Rechercher des jeux de données sur data.gouv.fr (open data gouvernemental). Utile pour trouver des données publiques sur l'immobilier, la population, les entreprises, la fiscalité, etc.",
    parameters: [
      { name: 'query', type: 'string', description: 'Mots-clés de recherche', required: true },
      { name: 'pageSize', type: 'number', description: 'Nombre de résultats (max 100)', required: false },
    ],
    requiresConfirmation: false,
    category: 'read',
  },
  {
    name: 'mcp_query_data',
    description: "Interroger les données d'une ressource data.gouv.fr. Permet de requêter directement le contenu d'un fichier CSV/JSON publié par le gouvernement.",
    parameters: [
      { name: 'resourceId', type: 'string', description: "ID de la ressource data.gouv.fr", required: true },
      { name: 'question', type: 'string', description: 'Question sur les données', required: true },
    ],
    requiresConfirmation: false,
    category: 'read',
  },
  {
    name: 'mcp_search_entreprise',
    description: "Rechercher une entreprise française par nom, SIREN ou SIRET via l'API INSEE SIRENE. Utile pour la vérification KYC, l'onboarding client professionnel, et la récupération d'informations légales.",
    parameters: [
      { name: 'siren', type: 'string', description: 'Numéro SIREN (9 chiffres)', required: false },
      { name: 'siret', type: 'string', description: 'Numéro SIRET (14 chiffres)', required: false },
      { name: 'name', type: 'string', description: 'Nom ou raison sociale', required: false },
    ],
    requiresConfirmation: false,
    category: 'read',
  },
  {
    name: 'mcp_search_apis',
    description: "Rechercher des APIs gouvernementales disponibles sur data.gouv.fr (Adresse, SIRENE, DVF, etc.). Utile pour trouver des services de données publiques.",
    parameters: [
      { name: 'query', type: 'string', description: 'Mots-clés de recherche', required: true },
    ],
    requiresConfirmation: false,
    category: 'read',
  },
  {
    name: 'mcp_dvf_immobilier',
    description: "Rechercher les données de transactions immobilières (DVF — Demandes de Valeurs Foncières) pour une commune. Utile pour estimer la valeur d'un bien, analyser le marché local.",
    parameters: [
      { name: 'commune', type: 'string', description: 'Nom de la commune', required: true },
    ],
    requiresConfirmation: false,
    category: 'read',
  },
]

// ============================================================================
// DISPATCHER — Exécute un outil MCP et retourne le résultat
// ============================================================================

export async function executeMCPTool(
  toolName: string,
  params: Record<string, unknown>,
): Promise<ToolResult | null> {
  let result: MCPToolResult

  switch (toolName) {
    case 'mcp_search_datasets':
      result = await searchDatasets(
        params.query as string,
        (params.pageSize as number) || 10,
      )
      break

    case 'mcp_query_data':
      result = await queryResourceData(
        params.resourceId as string,
        params.question as string,
        (params.pageSize as number) || 20,
      )
      break

    case 'mcp_search_entreprise': {
      if (params.siren) {
        result = await searchBySiren(params.siren as string)
      } else if (params.siret) {
        result = await searchBySiret(params.siret as string)
      } else if (params.name) {
        result = await searchEntrepriseByName(params.name as string)
      } else {
        return {
          success: false,
          toolName,
          message: 'Fournissez au moins un critère : siren, siret ou name',
        }
      }
      break
    }

    case 'mcp_search_apis':
      result = await searchDataservices(params.query as string)
      break

    case 'mcp_dvf_immobilier':
      result = await searchDVF(params.commune as string)
      break

    default:
      return null // Not an MCP tool
  }

  return {
    success: result.success,
    toolName,
    data: result.data,
    message: result.success
      ? `Données récupérées depuis ${result.source}`
      : `Erreur ${result.source}: ${result.error}`,
    actionTaken: result.success ? `Requête MCP ${result.source}` : undefined,
  }
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

export async function checkMCPHealth(): Promise<{
  dataGouv: { available: boolean; latencyMs: number }
  sirene: { available: boolean; configured: boolean }
}> {
  // Check data.gouv.fr
  let dataGouvAvailable = false
  let latencyMs = 0
  try {
    const start = Date.now()
    const res = await fetch(`${MCP_ENDPOINTS.dataGouv.replace('/mcp', '')}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    latencyMs = Date.now() - start
    dataGouvAvailable = res.ok
  } catch {
    dataGouvAvailable = false
  }

  return {
    dataGouv: { available: dataGouvAvailable, latencyMs },
    sirene: { available: !!SIRENE_API_KEY, configured: !!SIRENE_API_KEY },
  }
}
