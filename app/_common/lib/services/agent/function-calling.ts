/**
 * Function Calling Adapter — Native OpenAI/Anthropic tool_use
 *
 * Converts Aura CRM tool definitions into OpenAI-compatible function schemas
 * so the LLM can select and parameterize tools natively instead of regex parsing.
 *
 * This replaces the regex-based ACTION_PATTERNS approach with proper
 * function calling, making the agent significantly more reliable.
 */

import { TOOL_DEFINITIONS, type ToolDefinition } from './agent-tools'

// ============================================================================
// OpenAI Function Calling Schema Types
// ============================================================================

interface OpenAIFunctionParameter {
  type: string
  description: string
  enum?: string[]
}

interface OpenAIFunctionSchema {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, OpenAIFunctionParameter>
      required: string[]
    }
  }
}

// ============================================================================
// Anthropic Tool Use Schema Types
// ============================================================================

interface AnthropicToolSchema {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, OpenAIFunctionParameter>
    required: string[]
  }
}

// ============================================================================
// CONVERSION: Aura Tool → OpenAI Function
// ============================================================================

function auraParamTypeToJsonSchema(type: string): string {
  switch (type) {
    case 'string': return 'string'
    case 'number': return 'number'
    case 'boolean': return 'boolean'
    case 'date': return 'string' // ISO date string
    default: return 'string'
  }
}

/**
 * Convert a single Aura tool definition to OpenAI function schema
 */
function toOpenAIFunction(tool: ToolDefinition): OpenAIFunctionSchema {
  const properties: Record<string, OpenAIFunctionParameter> = {}
  const required: string[] = []

  for (const param of tool.parameters) {
    const prop: OpenAIFunctionParameter = {
      type: auraParamTypeToJsonSchema(param.type),
      description: param.description,
    }
    if (param.enum) {
      prop.enum = param.enum
    }
    properties[param.name] = prop
    if (param.required) {
      required.push(param.name)
    }
  }

  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties,
        required,
      },
    },
  }
}

/**
 * Convert a single Aura tool definition to Anthropic tool schema
 */
function toAnthropicTool(tool: ToolDefinition): AnthropicToolSchema {
  const properties: Record<string, OpenAIFunctionParameter> = {}
  const required: string[] = []

  for (const param of tool.parameters) {
    const prop: OpenAIFunctionParameter = {
      type: auraParamTypeToJsonSchema(param.type),
      description: param.description,
    }
    if (param.enum) {
      prop.enum = param.enum
    }
    properties[param.name] = prop
    if (param.required) {
      required.push(param.name)
    }
  }

  return {
    name: tool.name,
    description: tool.description,
    input_schema: {
      type: 'object',
      properties,
      required,
    },
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get all Aura CRM tools as OpenAI function calling schemas.
 * Use with: openai.chat.completions.create({ tools: getOpenAITools() })
 */
export function getOpenAITools(): OpenAIFunctionSchema[] {
  return TOOL_DEFINITIONS.map(toOpenAIFunction)
}

/**
 * Get all Aura CRM tools as Anthropic tool_use schemas.
 * Use with: anthropic.messages.create({ tools: getAnthropicTools() })
 */
export function getAnthropicTools(): AnthropicToolSchema[] {
  return TOOL_DEFINITIONS.map(toAnthropicTool)
}

/**
 * Get tools filtered by category
 */
export function getToolsByCategory(
  category: 'read' | 'write' | 'memory' | 'navigation',
  format: 'openai' | 'anthropic' = 'openai'
): OpenAIFunctionSchema[] | AnthropicToolSchema[] {
  const filtered = TOOL_DEFINITIONS.filter(t => t.category === category)
  if (format === 'anthropic') {
    return filtered.map(toAnthropicTool)
  }
  return filtered.map(toOpenAIFunction)
}

/**
 * Parse an OpenAI tool_call response into Aura tool execution params
 */
export function parseOpenAIToolCall(toolCall: {
  function: { name: string; arguments: string }
}): { toolName: string; params: Record<string, unknown> } {
  return {
    toolName: toolCall.function.name,
    params: JSON.parse(toolCall.function.arguments),
  }
}

/**
 * Parse an Anthropic tool_use content block into Aura tool execution params
 */
export function parseAnthropicToolUse(block: {
  name: string
  input: Record<string, unknown>
}): { toolName: string; params: Record<string, unknown> } {
  return {
    toolName: block.name,
    params: block.input,
  }
}

/**
 * Build the system prompt with tool descriptions for providers
 * that don't support native function calling (e.g., Ollama, Mistral local)
 */
export function buildToolPromptFallback(): string {
  const lines = ['Outils CRM disponibles:\n']

  for (const tool of TOOL_DEFINITIONS) {
    lines.push(`## ${tool.name}`)
    lines.push(`Description: ${tool.description}`)
    if (tool.parameters.length > 0) {
      lines.push('Paramètres:')
      for (const p of tool.parameters) {
        const req = p.required ? '(requis)' : '(optionnel)'
        const enumStr = p.enum ? ` [${p.enum.join(', ')}]` : ''
        lines.push(`  - ${p.name} (${p.type})${enumStr}: ${p.description} ${req}`)
      }
    }
    if (tool.requiresConfirmation) {
      lines.push('⚠️ Nécessite confirmation utilisateur avant exécution.')
    }
    lines.push('')
  }

  lines.push(`Pour utiliser un outil, réponds avec ce format JSON:`)
  lines.push(`{"tool_call": {"name": "nom_outil", "arguments": {"param1": "valeur1"}}}`)

  return lines.join('\n')
}
