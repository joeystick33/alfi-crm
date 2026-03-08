/**
 * AURA V2 — Types centraux pour l'architecture Agent Autonome
 * 
 * Ce fichier est la source de vérité pour tous les types TypeScript
 * utilisés dans le système d'agent autonome AURA V2.
 * 
 * Architecture : Orchestrateur → Planner → Executor → Critic
 * Principes : Backend = source de vérité, LLM = orchestrateur, pas d'hallucination
 */

// ============================================================================
// PROVIDER & CONNECTION
// ============================================================================

export type AIProviderType = 'OPENAI' | 'ANTHROPIC' | 'MISTRAL' | 'GROQ' | 'DEEPSEEK' | 'AZURE_OPENAI' | 'GOOGLE_VERTEX' | 'COHERE'

export type AIConnectionStatus =
  | 'DISCONNECTED'
  | 'PENDING_OAUTH'
  | 'CONNECTED'
  | 'EXPIRED'
  | 'REVOKED'
  | 'ERROR'
  | 'RESTRICTED'

export interface ProviderConfig {
  provider: AIProviderType
  apiUrl: string
  models: ProviderModel[]
  supportsStreaming: boolean
  supportsStructuredOutput: boolean
  maxContextWindow: number
  oauthConfig?: {
    authorizationUrl: string
    tokenUrl: string
    scopes: string[]
    clientIdEnvVar: string
    clientSecretEnvVar: string
  }
}

export interface ProviderModel {
  id: string
  name: string
  maxInputTokens: number
  maxOutputTokens: number
  costPer1kInput: number   // USD
  costPer1kOutput: number  // USD
  capabilities: ModelCapability[]
  recommended: boolean
}

export type ModelCapability =
  | 'chat'
  | 'streaming'
  | 'structured_output'
  | 'function_calling'
  | 'vision'
  | 'long_context'
  | 'reasoning'

// ============================================================================
// SESSION
// ============================================================================

export type AISessionMode = 'conversation' | 'voice' | 'background'

export interface SessionContext {
  pageContext?: string        // Page CRM actuelle
  clientSnapshot?: ClientSnapshot // Snapshot du client actif
  intent?: string             // Intent initial
  features?: Record<string, boolean> // Features activées
}

export interface ClientSnapshot {
  id: string
  firstName: string
  lastName: string
  status: string
  patrimoine?: {
    totalActifs: number
    totalPassifs: number
    patrimoineNet: number
  }
  fiscalite?: {
    tmi: number
    revenuFiscal: number
  }
  contrats?: Array<{
    id: string
    type: string
    fournisseur: string
    montant: number
  }>
}

// ============================================================================
// AGENT RUNTIME
// ============================================================================

export type AgentRole = 'orchestrator' | 'planner' | 'executor' | 'critic' | 'memory' | 'workflow' | 'drafting'

export interface AgentContext {
  cabinetId: string
  userId: string
  userRole: string
  clientId?: string
  sessionId: string
  connectionId?: string
  mode: AISessionMode
  correlationId: string
  // Prompt layers
  platformPrompt: string
  policyPrompt: string
  assistantPrompt: string
  sessionContext: string
  workflowContext?: string
  memoryContext: string
  // Constraints
  maxToolCalls: number
  maxRunSteps: number
  requireConfirmForWrites: boolean
  // Provider
  provider: AIProviderType
  model: string
  apiKey: string
}

// ============================================================================
// RUN LIFECYCLE
// ============================================================================

export type AIRunStatus =
  | 'QUEUED'
  | 'PLANNING'
  | 'EXECUTING'
  | 'CRITICIZING'
  | 'AWAITING_CONFIRM'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'TIMED_OUT'

export type AIRunType =
  | 'CHAT'
  | 'TOOL_CALL'
  | 'ANALYSIS'
  | 'SIMULATION'
  | 'WORKFLOW'
  | 'BACKGROUND'
  | 'VOICE'
  | 'DRAFT'

export interface RunInput {
  userMessage: string
  sessionId: string
  clientId?: string
  pageContext?: { page: string; section?: string; entityId?: string; entityType?: string; modeId?: string; modePrompt?: string }
  context?: AgentContext
  type?: AIRunType
}

export interface RunOutput {
  runId: string
  status: AIRunStatus
  response: string
  metadata: RunMetadata
  toolCalls: ToolCallResult[]
  validations: ValidationResult[]
  plan?: PlanOutput
  criticReport?: CriticReport
}

export interface RunMetadata {
  intent: string
  intentConfidence: number
  tokensInput: number
  tokensOutput: number
  totalTokens: number
  durationMs: number
  modelUsed: string
  providerUsed: string
  connectionMode: 'byok' | 'native'
  estimatedCost: number
  correlationId: string
  confidence: ConfidenceLevel
  sources: RAGSource[]
  warnings: string[]
}

// ============================================================================
// PLANNER
// ============================================================================

export interface PlanOutput {
  strategy: string          // Description de la stratégie
  steps: PlanStep[]
  fallback?: string         // Plan de secours
  estimatedTokens: number
  estimatedDuration: number // ms
  requiresConfirmation: boolean
}

export interface PlanStep {
  id: string
  order: number
  description: string
  tool?: string              // Nom de l'outil à appeler
  params?: Record<string, unknown>
  reason: string             // Pourquoi cette étape
  dependsOn?: string[]       // IDs des étapes dont elle dépend
  optional: boolean
  estimatedTokens: number
}

// ============================================================================
// EXECUTOR
// ============================================================================

export interface ExecutionResult {
  stepId: string
  success: boolean
  output: unknown
  error?: string
  tokensUsed: number
  durationMs: number
  toolCallId?: string
}

// ============================================================================
// CRITIC
// ============================================================================

export interface CriticReport {
  passed: boolean
  score: number             // 0-1
  checks: CriticCheck[]
  recommendation: 'approve' | 'retry' | 'escalate' | 'reject'
  notes: string
}

export interface CriticCheck {
  name: string
  passed: boolean
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  details?: unknown
}

// ============================================================================
// TOOLS
// ============================================================================

export type ToolCategory = 'read' | 'write' | 'navigate' | 'memory' | 'simulate' | 'export' | 'analyze'

export interface ToolDefinitionV2 {
  name: string
  description: string
  category: ToolCategory
  parameters: ToolParameterV2[]
  requiresConfirmation: boolean
  idempotent: boolean
  sensitiveFields: string[]  // Champs à masquer dans les logs
  permissions: ToolPermissionSpec
  timeout: number            // ms
  retryable: boolean
  maxRetries: number
  outputSchema?: Record<string, unknown> // JSON Schema du résultat
}

export interface ToolParameterV2 {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  description: string
  required: boolean
  enum?: string[]
  default?: unknown
  sensitive?: boolean        // Masquer dans les logs
  validation?: {
    min?: number
    max?: number
    minLength?: number
    pattern?: string
    maxLength?: number
  }
}

export interface ToolPermissionSpec {
  minRole: string             // Rôle minimum ('ASSISTANT' | 'ADVISOR' | 'ADMIN')
  scopes: string[]            // Scopes requis
  requiresClientAccess: boolean // Nécessite accès au client
  onlyOwnClients: boolean     // Seulement les clients du conseiller
}

export interface ToolCallInput {
  toolName: string
  params: Record<string, unknown>
  reasoning: string          // Pourquoi l'agent appelle cet outil
  idempotencyKey?: string
}

export interface ToolCallResult {
  toolCallId: string
  toolName: string
  success: boolean
  data?: unknown
  error?: string
  message: string
  durationMs: number
  dataAccessed: string[]     // Entités accédées (RGPD)
  navigationUrl?: string     // Pour les outils de navigation
}

// ============================================================================
// VALIDATION
// ============================================================================

export type ValidationType =
  | 'fiscal_calculation'
  | 'patrimoine_coherence'
  | 'regulatory_check'
  | 'data_integrity'
  | 'simulation_result'
  | 'document_content'

export interface ValidationResult {
  type: ValidationType
  passed: boolean
  score: number
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  expected: unknown
  got: unknown
  severity: 'error' | 'critical'
  message: string
}

export interface ValidationWarning {
  field: string
  message: string
  severity: 'info' | 'warning'
}

// ============================================================================
// STRUCTURED OUTPUTS
// ============================================================================

export type ConfidenceLevel = 'HIGH' | 'MED' | 'LOW'

export interface StructuredResponse {
  type: string
  data: unknown
  confidence: ConfidenceLevel
  sources: RAGSource[]
  warnings: string[]
  disclaimer?: string
}

export interface RAGSource {
  type: 'crm_data' | 'legal_text' | 'product_info' | 'market_data' | 'historical'
  title: string
  reference: string
  confidence: ConfidenceLevel
  snippet?: string
}

// ============================================================================
// INTENT CLASSIFICATION
// ============================================================================

export type IntentType =
  | 'action'           // Demande d'exécution d'action CRM
  | 'question'         // Question d'information
  | 'instruction'      // Consigne à mémoriser
  | 'confirmation'     // Réponse à une demande de confirmation
  | 'cancellation'     // Annulation d'une action
  | 'simulation'       // Demande de simulation
  | 'analysis'         // Demande d'analyse patrimoniale/fiscale
  | 'draft'            // Demande de brouillon de document
  | 'navigation'       // Demande de navigation CRM
  | 'memory_query'     // Requête sur la mémoire
  | 'workflow'         // Démarrage/reprise de workflow
  | 'conversation'     // Conversation générale

export interface IntentClassification {
  intent: IntentType
  confidence: number     // 0-1
  entities: ExtractedEntity[]
  subIntent?: string     // Sous-catégorie
  requiresTool: boolean
  suggestedTools: string[]
}

export interface ExtractedEntity {
  type: string           // 'client_name' | 'amount' | 'date' | 'product' | ...
  value: string
  confidence: ConfidenceLevel
  source: 'explicit' | 'inferred' | 'estimated'
  normalized?: unknown   // Valeur normalisée
}

// ============================================================================
// WORKFLOW
// ============================================================================

export type WorkflowType =
  | 'post_meeting'
  | 'onboarding'
  | 'kyc_review'
  | 'bilan_patrimonial'
  | 'rebalancing'
  | 'regulatory_review'

export interface WorkflowDefinition {
  type: WorkflowType
  title: string
  description: string
  steps: WorkflowStepDef[]
  requiredContext: string[]    // Données requises pour démarrer
  estimatedDuration: number   // minutes
}

export interface WorkflowStepDef {
  id: string
  label: string
  role: AgentRole
  description: string
  tools: string[]             // Outils potentiellement utilisés
  requiresUserInput: boolean
  optional: boolean
  dependsOn: string[]
}

// ============================================================================
// LLM MESSAGE FORMAT
// ============================================================================

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string               // Pour les messages tool
  tool_call_id?: string       // Pour les résultats tool
}

export interface LLMRequest {
  messages: LLMMessage[]
  model: string
  temperature?: number
  maxTokens?: number
  responseFormat?: {
    type: 'json_object' | 'text'
    schema?: Record<string, unknown>
  }
  tools?: LLMToolDef[]
  toolChoice?: 'auto' | 'required' | 'none'
  stream?: boolean
}

export interface LLMToolDef {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown> // JSON Schema
  }
}

export interface LLMResponse {
  content: string
  model: string
  tokensInput: number
  tokensOutput: number
  finishReason: string
  toolCalls?: Array<{
    id: string
    name: string
    arguments: string // JSON string
  }>
}

export interface LLMStreamChunk {
  content?: string
  toolCallDelta?: {
    id: string
    name?: string
    arguments?: string
  }
  done: boolean
  finishReason?: string
}

// ============================================================================
// ENCRYPTION
// ============================================================================

export interface EncryptedValue {
  ciphertext: string
  iv: string
  tag: string
  algorithm: 'aes-256-gcm'
}

// ============================================================================
// EVENTS (pour observability)
// ============================================================================

export type AgentEventType =
  | 'run.started'
  | 'run.completed'
  | 'run.failed'
  | 'step.started'
  | 'step.completed'
  | 'step.failed'
  | 'tool.called'
  | 'tool.completed'
  | 'tool.failed'
  | 'tool.denied'
  | 'validation.passed'
  | 'validation.failed'
  | 'confirmation.requested'
  | 'confirmation.received'
  | 'memory.saved'
  | 'memory.retrieved'
  | 'workflow.started'
  | 'workflow.step_completed'
  | 'workflow.completed'
  | 'error.recovery'
  | 'rate_limit.hit'

export interface AgentEvent {
  type: AgentEventType
  timestamp: number
  correlationId: string
  cabinetId: string
  userId: string
  data: Record<string, unknown>
}
