// ============================================================================
// AURA — Autonomous, Conversational & Voice-First Agent
// Configuration canonique — Source de vérité unique
//
// Ce fichier encode la spécification AURA en configuration exécutable.
// Aucune partie n'est optionnelle. Si deux instructions conflictent,
// la plus restrictive s'applique.
// ============================================================================

// ── MODES D'OPÉRATION ──────────────────────────────────────────────────────

export type AuraMode = 'background' | 'conversation' | 'voice'

export interface AuraModeConfig {
  /** Mode actuellement actif */
  active: AuraMode
  /** Timestamp d'activation */
  activatedAt: number
}

// ── RÔLES MODÈLES ──────────────────────────────────────────────────────────

/**
 * Rôle fonctionnel dans l'architecture AURA.
 * Chaque appel LLM est routé vers le bon modèle selon son rôle.
 */
export type AuraModelRole = 'orchestrator' | 'subagent' | 'stt'

/**
 * Providers supportés.
 * Fallback : openai → mistral-cloud
 */
export type AuraProvider =
  | 'openai'         // GPT-4o-mini / GPT-4o (orchestrator)
  | 'mistral-cloud'  // Mistral Small (subagent)
  | 'mistral'        // Alias court utilisé dans aura-models.ts
  | 'groq'           // Groq Cloud (STT)
  | 'fallback'       // Aucune clé API configurée

// ── CONFIGURATION MODÈLES ──────────────────────────────────────────────────

export interface ModelConfig {
  provider: AuraProvider
  model: string
  apiUrl: string
  timeout: number
  /** Caps de tokens stricts (spec §11.1) */
  maxInputTokens: number
  maxOutputTokens: Record<string, number>
  /** Température par défaut */
  defaultTemperature: number
}

/**
 * Configuration complète des modèles par rôle.
 * Respecte strictement la spec §2 (Architecture Modèles).
 */
export const MODEL_CONFIGS: Record<AuraModelRole, ModelConfig> = {
  // ── ORCHESTRATEUR (§2.1) ──
  // Rôle : cerveau central, planification, orchestration, synthèse, gouvernance
  // INTERDIT : calculs financiers, écriture CRM directe, appels outils directs
  orchestrator: {
    provider: 'openai',
    model: process.env.AURA_ORCHESTRATOR_MODEL || 'gpt-4o-mini',
    apiUrl: 'https://api.openai.com/v1/chat/completions',
    timeout: 30_000,
    maxInputTokens: 20_000,   // HARD CAP (spec §11.1)
    maxOutputTokens: {
      planning: 800,           // Plans et orchestration
      synthesis: 1400,         // Bilans et synthèses
      default: 800,
    },
    defaultTemperature: 0.2,
  },

  // ── SUBAGENT (§2.2) ──
  // Rôle : exécution haute fréquence, CRUD CRM, extraction, copilote live
  // INTERDIT : planification multi-step, décisions métier, calculs
  subagent: {
    provider: 'mistral-cloud',
    model: process.env.AURA_SUBAGENT_MODEL || 'mistral-small-latest',
    apiUrl: 'https://api.mistral.ai/v1/chat/completions',
    timeout: 15_000,
    maxInputTokens: 8_000,
    maxOutputTokens: {
      live_suggestion: 80,     // Copilote live (spec §11.1)
      chat: 250,               // Chat subagent
      extraction: 350,         // Extraction/JSON
      default: 250,
    },
    defaultTemperature: 0.1,
  },

  // ── STT (§2.3) ──
  // Rôle : transcription streaming, segmentation temporelle
  // Aucun raisonnement sémantique
  stt: {
    provider: 'groq',
    model: process.env.AURA_STT_MODEL || 'whisper-large-v3-turbo',
    apiUrl: 'https://api.groq.com/openai/v1/audio/transcriptions',
    timeout: 30_000,
    maxInputTokens: 0, // N/A pour STT
    maxOutputTokens: { default: 0 },
    defaultTemperature: 0,
  },
}

// ── QUOTAS MENSUELS PAR CONSEILLER (§11.4) ──────────────────────────────────

export interface MonthlyQuota {
  /** Tokens max par mois */
  tokens: number
  /** Minutes STT max par mois */
  sttMinutes?: number
  /** Label pour affichage */
  label: string
}

export const MONTHLY_QUOTAS: Record<AuraModelRole, MonthlyQuota> = {
  orchestrator: {
    tokens: 1_000_000,   // 1M tokens/mois GPT
    label: 'Orchestrateur (GPT)',
  },
  subagent: {
    tokens: 5_000_000,   // 5M tokens/mois Mistral
    label: 'Subagent (Mistral)',
  },
  stt: {
    tokens: 0,
    sttMinutes: 1200,     // 1200 minutes/mois STT
    label: 'Transcription (STT)',
  },
}

// ── RATE LIMITS (§11.3) ─────────────────────────────────────────────────────

export const RATE_LIMITS = {
  /** Copilote live : 1 suggestion toutes les 20-60s */
  liveCopilot: {
    minIntervalMs: 20_000,
    maxIntervalMs: 60_000,
  },
  /** Si 3 erreurs outils consécutives → STOP + RE-PLAN */
  maxConsecutiveToolErrors: 3,
  /** Requêtes IA par minute par cabinet */
  maxRequestsPerMinutePerCabinet: 30,
  /** Requêtes simultanées globales */
  maxConcurrentRequests: 5,
} as const

// ── PRIORITÉS OPÉRATIONNELLES (§4) ─────────────────────────────────────────

/**
 * Ordre de priorité strict :
 * 1. Correctness — Les données sont exactes
 * 2. Safety — Pas d'action destructive sans validation
 * 3. Performance — Temps de réponse acceptable
 * 4. Cost control — Respect des budgets tokens
 * 5. Elegance — Solution la plus simple et robuste
 */
export const PRIORITY_ORDER = [
  'correctness',
  'safety',
  'performance',
  'cost_control',
  'elegance',
] as const

// ── TASK ROUTING (§5) ───────────────────────────────────────────────────────

/**
 * Détermine quel rôle de modèle doit traiter une tâche donnée.
 * L'orchestrateur délègue les tâches d'exécution aux subagents.
 */
export type AuraTaskType =
  // Orchestrator tasks (§2.1)
  | 'planning'              // Planification multi-step
  | 'workflow_orchestration' // Orchestration de workflow
  | 'simulator_orchestration' // Orchestration de simulateurs
  | 'synthesis'             // Synthèse finale (bilan, plans, résumés)
  | 'governance'            // Validation, audit, budget
  | 'quality_control'       // Vérification de qualité
  // Subagent tasks (§2.2)
  | 'crm_crud'             // Navigation et CRUD CRM
  | 'data_extraction'      // Extraction et normalisation
  | 'live_copilot'         // Copilotage meeting en direct
  | 'rag_retrieval'        // Récupération RAG simple
  | 'schema_validation'    // Validation de schéma
  | 'simulator_input_prep' // Préparation des inputs simulateurs
  | 'document_prep'        // Préparation de structures documentaires
  // Pipeline post-meeting tasks
  | 'crm_proposal'         // Proposition de mise à jour CRM
  | 'simulators'           // Orchestration de simulations
  | 'document'             // Préparation de document
  | 'compliance'           // Vérification conformité
  | 'actions'              // Proposition d'actions

/** Mapping tâche → rôle modèle */
export const TASK_ROUTING: Record<AuraTaskType, AuraModelRole> = {
  planning: 'orchestrator',
  workflow_orchestration: 'orchestrator',
  simulator_orchestration: 'orchestrator',
  synthesis: 'orchestrator',
  governance: 'orchestrator',
  quality_control: 'orchestrator',
  crm_crud: 'subagent',
  data_extraction: 'subagent',
  live_copilot: 'subagent',
  rag_retrieval: 'subagent',
  schema_validation: 'subagent',
  simulator_input_prep: 'subagent',
  document_prep: 'subagent',
  // Pipeline post-meeting
  crm_proposal: 'subagent',
  simulators: 'orchestrator',
  document: 'subagent',
  compliance: 'subagent',
  actions: 'orchestrator',
}

// ── POST-MEETING PIPELINE (§12.2) ──────────────────────────────────────────

export const POST_MEETING_PIPELINE_STEPS = [
  { id: 'extract', label: 'Extraction & compactage des données', role: 'subagent' as AuraModelRole },
  { id: 'compare_crm', label: 'Comparaison avec CRM existant', role: 'subagent' as AuraModelRole },
  { id: 'crm_proposal', label: 'Préparation proposition mise à jour CRM', role: 'orchestrator' as AuraModelRole },
  { id: 'simulators', label: 'Orchestration des simulateurs', role: 'orchestrator' as AuraModelRole },
  { id: 'synthesis', label: 'Synthèse bilan & plan d\'action', role: 'orchestrator' as AuraModelRole },
  { id: 'document', label: 'Préparation structure documentaire', role: 'subagent' as AuraModelRole },
  { id: 'compliance', label: 'Vérifications conformité', role: 'subagent' as AuraModelRole },
  { id: 'actions', label: 'Proposition d\'actions', role: 'orchestrator' as AuraModelRole },
  { id: 'execute', label: 'Exécution après validation', role: 'subagent' as AuraModelRole },
] as const

// ── BACKGROUND MONITORING (§3.1) ───────────────────────────────────────────

export const BACKGROUND_JOBS = {
  /** Fréquence de vérification CRM (ms) */
  crmMonitorIntervalMs: 5 * 60 * 1000,  // 5 minutes
  /** Fréquence de détection d'opportunités */
  opportunityDetectionIntervalMs: 30 * 60 * 1000, // 30 minutes
  /** Fréquence de vérification KYC/compliance */
  complianceCheckIntervalMs: 60 * 60 * 1000, // 1 heure
  /** Détection d'anomalies données */
  dataInconsistencyCheckIntervalMs: 60 * 60 * 1000, // 1 heure
} as const

// ── VOICE MODE (§3.3) ──────────────────────────────────────────────────────

export const VOICE_CONFIG = {
  /** Max phrases par réponse en mode voix */
  maxSentencesPerResponse: 2,
  /** Max idées par réponse */
  maxIdeasPerResponse: 1,
  /** Toujours confirmer avant exécution */
  requireVoiceConfirmation: true,
  /** Pas de jargon sauf demande explicite */
  avoidJargon: true,
  /** TTS provider */
  ttsProvider: 'openai' as AuraProvider,
  ttsModel: 'tts-1',
  ttsVoice: 'nova',
} as const

// ── GOVERNANCE (§9) ────────────────────────────────────────────────────────

export const GOVERNANCE = {
  /** Toute mutation CRM nécessite une PROPOSITION + VALIDATION */
  requireProposalForMutations: true,
  /** Toutes les actions sont loggées */
  auditAllActions: true,
  /** Pas d'actions silencieuses */
  noSilentActions: true,
  /** Toute action doit être traçable et explicable */
  requireExplainability: true,
} as const

// ── CONFIDENCE SCORING (§6, §10) ───────────────────────────────────────────

export type ConfidenceLevel = 'HIGH' | 'MED' | 'LOW'

export interface ExtractedDataPoint {
  field: string
  value: unknown
  confidence: ConfidenceLevel
  source: 'explicit' | 'inferred' | 'estimated'
  sourceTimestamp?: string
}

// ── QUALITY SYSTEM (§10) ───────────────────────────────────────────────────

export const QUALITY_CHECKS = {
  /** Vérification obligatoire avant completion */
  preCompletionChecks: [
    'accuracy_guardrails',
    'consistency_check',
    'confidence_scoring',
  ],
  /** Question obligatoire d'auto-vérification */
  selfVerificationQuestion: 'Would a staff engineer AND a senior advisor approve this?',
  /** Disclosure progressive : résumé d'abord, détails sur demande */
  progressiveDisclosure: true,
} as const

// ── HELPER : résoudre la config modèle pour un rôle ────────────────────────

/**
 * Résout la configuration modèle effective pour un rôle donné,
 * en tenant compte des variables d'environnement et des fallbacks.
 */
export function resolveModelConfig(role: AuraModelRole): ModelConfig & { available: boolean; apiKey: string | undefined } {
  const config = MODEL_CONFIGS[role]

  let apiKey: string | undefined
  let available = false

  switch (config.provider) {
    case 'openai':
      apiKey = process.env.OPENAI_API_KEY
      if (!apiKey) {
        // Fallback : Mistral si OpenAI absent
        apiKey = process.env.MISTRAL_API_KEY
        if (apiKey) {
          return {
            ...config,
            provider: 'mistral-cloud',
            model: 'mistral-small-latest',
            apiUrl: 'https://api.mistral.ai/v1/chat/completions',
            available: true,
            apiKey,
          }
        }
        return { ...config, provider: 'fallback', available: false, apiKey: undefined }
      }
      available = true
      break

    case 'mistral-cloud':
      apiKey = process.env.MISTRAL_API_KEY
      if (!apiKey) {
        // Fallback : OpenAI si Mistral absent
        apiKey = process.env.OPENAI_API_KEY
        if (apiKey) {
          return {
            ...config,
            provider: 'openai',
            model: process.env.AURA_ORCHESTRATOR_MODEL || 'gpt-4o-mini',
            apiUrl: 'https://api.openai.com/v1/chat/completions',
            available: true,
            apiKey,
          }
        }
        return { ...config, provider: 'fallback', available: false, apiKey: undefined }
      }
      available = true
      break

    case 'groq':
      apiKey = process.env.GROQ_API_KEY
      if (!apiKey) {
        // Fallback OpenAI pour STT (Whisper)
        apiKey = process.env.OPENAI_API_KEY
        if (apiKey) {
          return {
            ...config,
            provider: 'openai',
            model: 'whisper-1',
            apiUrl: 'https://api.openai.com/v1/audio/transcriptions',
            available: true,
            apiKey,
          }
        }
      }
      available = !!apiKey
      break
  }

  return { ...config, available, apiKey }
}

/**
 * Résout le rôle de modèle pour un type de tâche donné.
 */
export function getModelRoleForTask(task: AuraTaskType): AuraModelRole {
  return TASK_ROUTING[task]
}

/**
 * Obtient la limite de tokens de sortie pour un contexte donné.
 */
export function getMaxOutputTokens(role: AuraModelRole, context: string = 'default'): number {
  const config = MODEL_CONFIGS[role]
  return config.maxOutputTokens[context] ?? config.maxOutputTokens.default
}
