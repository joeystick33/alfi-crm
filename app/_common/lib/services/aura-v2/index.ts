/**
 * AURA V2 — Barrel Export
 * 
 * Point d'entrée unique pour toute l'architecture agent autonome V2.
 */

// Types centraux
export type {
  AIProviderType,
  AIConnectionStatus,
  ProviderConfig,
  ProviderModel,
  ModelCapability,
  AISessionMode,
  SessionContext,
  ClientSnapshot,
  AgentRole,
  AgentContext,
  AIRunStatus,
  AIRunType,
  RunInput,
  RunOutput,
  RunMetadata,
  PlanOutput,
  PlanStep,
  ExecutionResult,
  CriticReport,
  CriticCheck,
  ToolCategory,
  ToolDefinitionV2,
  ToolParameterV2,
  ToolPermissionSpec,
  ToolCallInput,
  ToolCallResult,
  ValidationType,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ConfidenceLevel,
  StructuredResponse,
  RAGSource,
  IntentType,
  IntentClassification,
  ExtractedEntity,
  WorkflowType,
  WorkflowDefinition,
  WorkflowStepDef,
  LLMMessage,
  LLMRequest,
  LLMToolDef,
  LLMResponse,
  LLMStreamChunk,
  EncryptedValue,
  AgentEventType,
  AgentEvent,
} from './types'

// Provider Adapter
export { ProviderAdapter, PROVIDER_REGISTRY, ProviderError } from './provider-adapter'
export type { ResolvedConnection } from './provider-adapter'

// Tool Access Layer
export { ToolAccessLayer, TOOL_REGISTRY } from './tool-access-layer'

// Tool Executor
export { ToolExecutor } from './tool-executor'

// Agent Runtime
export { AgentRuntime } from './agent-runtime'

// Prompts
export {
  SYSTEM_PLATFORM_PROMPT,
  POLICY_PROMPT,
  PLANNER_SYSTEM_PROMPT,
  EXECUTOR_SYSTEM_PROMPT,
  CRITIC_SYSTEM_PROMPT,
  RESPONSE_FORMATTING_PROMPT,
  buildAssistantPrompt,
  buildSessionContext,
  buildWorkflowContext,
  buildIntentClassificationPrompt,
  assemblePrompt,
  assemblePlannerPrompt,
  assembleCriticPrompt,
} from './prompts'

// Validation Engine
export { ValidationEngine } from './validation-engine'

// Encryption
export { encrypt, decrypt, encryptToken, decryptToken, maskSensitive, maskParams } from './encryption'
