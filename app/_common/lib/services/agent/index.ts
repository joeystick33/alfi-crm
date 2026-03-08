/**
 * Agent IA Autonome — Module principal
 * 
 * Architecture :
 *   agent-memory.ts       — Mémoire persistante (instructions, préférences, faits, conversations)
 *   agent-tools.ts        — 16 outils CRM exécutables (lecture + écriture + mémoire)
 *   agent-orchestrator.ts — Boucle agentique ReAct (classify → execute → enrich → generate)
 * 
 * Point d'entrée dans ai-service.ts :
 *   aiAgentChat()       — Chat synchrone avec agent
 *   aiAgentChatStream() — Chat streaming avec agent
 */

export { AgentMemoryService, type AgentMemoryEntry, type CreateMemoryInput, type MemorySearchOptions } from './agent-memory'
export { executeTool, getToolDescriptionsForPrompt, TOOL_DEFINITIONS, type ToolDefinition, type ToolResult, type ToolContext } from './agent-tools'
export { runAgent, classifyIntent, type AgentIntent, type AgentIntentType, type AgentResponse, type AgentActionInfo, type AgentOptions, type AgentMetrics } from './agent-orchestrator'
