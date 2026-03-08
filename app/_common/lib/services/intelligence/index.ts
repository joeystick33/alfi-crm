/**
 * Intelligence Module — Barrel Export
 * 
 * Moteurs d'intelligence intégrés au CRM AURA :
 *   1. Relationship Intelligence — Scoring relationnel, nudges, profiler
 *   2. Lead Pipeline — Scoring prospects, state machine, audit trail
 *   3. Business Intelligence Council — Analyses nocturnes multi-experts CGP
 *   4. Portfolio Allocation — Rééquilibrage, allocation cible, distribution versements
 *   5. LLM Cost Tracker — Suivi tokens/coûts par cabinet/utilisateur
 *   6. Notification Batching — File d'attente prioritaire intelligente
 *   7. Meeting Intelligence — Post-RDV auto (CR, actions, email suivi)
 *   8. Email Outreach — Campagnes auto, séquences, follow-ups
 */

export { RelationshipIntelligenceEngine } from './relationship-intelligence'
export type {
  RelationshipScore,
  RelationshipSignal,
  ClientNudge,
  NudgeType,
  RelationshipProfile,
  ClientSegment,
  LifeCycleStage,
} from './relationship-intelligence'

export { LeadPipelineEngine } from './lead-pipeline'
export type {
  PipelineStage,
  LeadScore,
  LeadFlag,
  StageTransition,
  PipelineStats,
} from './lead-pipeline'

export { BusinessIntelligenceCouncil } from './business-intelligence-council'
export type {
  ExpertPersona,
  ExpertInsight,
  CouncilDigest,
  SynthesisReport,
  RankedRecommendation,
  CouncilMetrics,
} from './business-intelligence-council'

export { PortfolioAllocationEngine } from './portfolio-allocation'
export type {
  AssetClass,
  AllocationTarget,
  CurrentAllocation,
  AllocationDrift,
  RebalanceAction,
  RebalanceProposal,
  ContributionPlan,
} from './portfolio-allocation'

export { LLMCostTracker } from './llm-cost-tracker'
export type {
  LLMCallLog,
  CostEstimate,
  UsageReport,
  BudgetAlert,
  QuotaConfig,
} from './llm-cost-tracker'

export { NotificationBatchingEngine } from './notification-batching'
export type {
  NotificationTier,
  NotificationCategory,
  BatchedNotification,
  NotificationDigest,
} from './notification-batching'

export { MeetingIntelligenceEngine } from './meeting-intelligence'
export type {
  MeetingAnalysis,
  MeetingSummary,
  ActionItem,
  ClientUpdate,
  FollowUpEmailDraft,
  NextMeetingSuggestion,
  MeetingSignal,
} from './meeting-intelligence'

export { EmailOutreachEngine } from './email-outreach'
export type {
  SequenceType,
  EmailSequence,
  EmailSequenceStep,
  SequenceMetrics,
  SmartFollowUp,
  PersonalizedEmail,
} from './email-outreach'
