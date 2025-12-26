import type {
  ClientFilters,
  NotificationFilters,
  TacheFilters,
  RendezVousFilters,
  CampaignFilters,
  ScenarioFilters,
  EmailTemplateFilters,
  DocumentFilters,
  KYCDocumentFilters,
  KYCCheckFilters,
  ReclamationFilters,
  PerformanceFilters,
  ArbitrageFilters,
  ApporteurFilters,
} from '@/app/_common/lib/api-types'

export const queryKeys = {
  // Clients
  clients: ['clients'] as const,
  clientList: (filters?: ClientFilters) => ['clients', 'list', filters] as const,
  client: (id: string) => ['clients', id] as const,
  clientWealth: (id: string) => ['clients', id, 'wealth'] as const,

  // Dashboard
  dashboardCounters: ['dashboard', 'counters'] as const,

  // Notifications
  notifications: ['notifications'] as const,
  notificationList: (filters?: NotificationFilters) => ['notifications', 'list', filters] as const,
  unreadCount: ['notifications', 'unread-count'] as const,

  // Tasks
  tasks: ['tasks'] as const,
  taskList: (filters?: TacheFilters) => ['tasks', 'list', filters] as const,

  // Appointments
  appointments: ['appointments'] as const,
  appointmentList: (filters?: RendezVousFilters) => ['appointments', 'list', filters] as const,

  // Campaigns
  campaigns: ['campaigns'] as const,
  campaignList: (filters?: CampaignFilters) => ['campaigns', 'list', filters] as const,
  campaign: (id: string) => ['campaigns', id] as const,
  campaignStats: (filters?: Record<string, unknown>) => ['campaigns', 'stats', filters] as const,

  // Scenarios
  scenarios: ['scenarios'] as const,
  scenarioList: (filters?: ScenarioFilters) => ['scenarios', 'list', filters] as const,
  scenario: (id: string) => ['scenarios', id] as const,
  scenarioStats: (filters?: Record<string, unknown>) => ['scenarios', 'stats', filters] as const,

  // Email Templates
  emailTemplates: ['email-templates'] as const,
  emailTemplateList: (filters?: EmailTemplateFilters) => ['email-templates', 'list', filters] as const,
  emailTemplate: (id: string) => ['email-templates', id] as const,
  emailTemplateCategories: ['email-templates', 'categories'] as const,
  emailTemplateVariables: ['email-templates', 'variables'] as const,
  emailTemplateStats: (filters?: Record<string, unknown>) => ['email-templates', 'stats', filters] as const,

  // Documents GED
  documents: ['documents'] as const,
  documentList: (filters?: DocumentFilters) => ['documents', 'list', filters] as const,
  document: (id: string) => ['documents', id] as const,
  documentStats: ['documents', 'stats'] as const,
  documentVersions: (id: string) => ['documents', id, 'versions'] as const,

  // Templates GED
  documentTemplates: ['document-templates'] as const,
  documentTemplateList: (filters?: Record<string, unknown>) => ['document-templates', 'list', filters] as const,
  documentTemplate: (id: string) => ['document-templates', id] as const,
  documentTemplateStats: ['document-templates', 'stats'] as const,
  documentTemplateDocuments: (id: string) => ['document-templates', id, 'documents'] as const,

  // Signatures électroniques
  signatures: ['signatures'] as const,
  signatureSteps: (documentId: string) => ['signatures', documentId, 'steps'] as const,
  signatureStats: ['signatures', 'stats'] as const,
  pendingSignatures: ['signatures', 'pending'] as const,

  // KYC Documents
  kycDocuments: ['kyc-documents'] as const,
  kycDocumentList: (filters?: KYCDocumentFilters) => ['kyc-documents', 'list', filters] as const,
  kycDocument: (id: string) => ['kyc-documents', id] as const,

  // KYC Checks
  kycChecks: ['kyc-checks'] as const,
  kycCheckList: (filters?: KYCCheckFilters) => ['kyc-checks', 'list', filters] as const,
  kycCheck: (id: string) => ['kyc-checks', id] as const,

  // KYC Stats
  kycStats: ['kyc', 'stats'] as const,

  // Reclamations
  reclamations: ['reclamations'] as const,
  reclamationList: (filters?: ReclamationFilters) => ['reclamations', 'list', filters] as const,
  reclamation: (id: string) => ['reclamations', id] as const,
  reclamationStats: (filters?: Record<string, unknown>) => ['reclamations', 'stats', filters] as const,

  // Performance & Arbitrages
  performance: (filters?: PerformanceFilters) => ['patrimoine', 'performance', filters] as const,
  arbitrages: (filters?: ArbitrageFilters) => ['patrimoine', 'arbitrages', filters] as const,

  // Apporteurs d'affaires
  apporteurs: ['apporteurs'] as const,
  apporteurList: (filters?: ApporteurFilters) => ['apporteurs', 'list', filters] as const,
  apporteur: (id: string) => ['apporteurs', id] as const,
  apporteurStats: ['apporteurs', 'stats'] as const,
}
