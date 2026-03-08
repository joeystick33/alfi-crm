/**
 * AURA — Autonomous, Conversational & Voice-First Agent
 *
 * Architecture :
 *   aura-config.ts     — Configuration canonique, model routing, token caps, modes
 *   aura-models.ts     — Multi-model router (orchestrator/subagent/stt)
 *   aura-budget.ts     — Token budget tracking & enforcement
 *   aura-background.ts — Background mode: CRM monitoring, anomaly detection
 *   aura-pipeline.ts   — Post-meeting autonomous 9-step pipeline (TODO)
 *
 * Point d'entrée API :
 *   /api/aura/background — CRON endpoint for background scan cycle
 *   /api/aura/budget     — Budget status endpoint
 *   /api/aura/chat       — Conversational mode (routed via orchestrator)
 */

// Config & types
export {
  type AuraMode,
  type AuraModelRole,
  type AuraProvider,
  type AuraTaskType,
  type ConfidenceLevel,
  type ExtractedDataPoint,
  MODEL_CONFIGS,
  MONTHLY_QUOTAS,
  RATE_LIMITS,
  TASK_ROUTING,
  POST_MEETING_PIPELINE_STEPS,
  BACKGROUND_JOBS,
  VOICE_CONFIG,
  GOVERNANCE,
  QUALITY_CHECKS,
  PRIORITY_ORDER,
  resolveModelConfig,
  getModelRoleForTask,
  getMaxOutputTokens,
} from './aura-config'

// Multi-model router
export {
  callAuraLLM,
  callAuraLLMStream,
  type AuraLLMRequest,
  type AuraLLMResponse,
  type AuraStreamResponse,
} from './aura-models'

// Budget tracking
export {
  trackTokenUsage,
  getTokenUsage,
  isQuotaExceeded,
  isQuotaNearLimit,
  getBudgetStatus,
  getEffectiveMaxTokens,
  type TokenUsageSummary,
  type BudgetStatus,
} from './aura-budget'

// Background mode
export {
  runBackgroundScanCycle,
  type BackgroundJobType,
  type BackgroundJobResult,
  type BackgroundInsight,
  type ProposedAction,
} from './aura-background'

// Post-meeting pipeline
export {
  runPostMeetingPipeline,
  type PipelineStepId,
  type PipelineStepStatus,
  type PipelineStepResult,
  type PipelineRunResult,
  type MeetingCompact,
  type ExtractedMeetingData,
  type CRMComparison,
} from './aura-pipeline'
