/**
 * API Types for Aura CRM
 * Type definitions for API requests and responses
 */

// Import Prisma types for use in this file
import type {
  Client,
  User,
  Actif,
  Passif,
  Contrat,
  Document,
  Objectif,
  Projet,
  Opportunite,
  Tache,
  RendezVous,
  Notification,
  ClientType,
  ClientStatus,
  MaritalStatus,
  RiskProfile,
  InvestmentHorizon,
  ActifType,
  ActifCategory,
  PassifType,
  ContratType,
  ContratStatus,
  DocumentType,
  DocumentCategory,
  SignatureStatus,
  SignatureProvider,
  ObjectifType,
  ObjectifStatus,
  ProjetType,
  ProjetStatus,
  OpportuniteType,
  OpportuniteStatus,
  TacheType,
  TacheStatus,
  TachePriority,
  RendezVousType,
  RendezVousStatus,
  NotificationType,
  EmailMessage,
  EmailTemplate,
  Scenario as PrismaScenario,
  ScenarioStatus,
  ScenarioTrigger,
} from '@prisma/client'

// Re-export Prisma Scenario type
export type Scenario = PrismaScenario

// Re-export types from Prisma
export type { Client, User, Actif, Passif, Contrat, Document, Objectif, Projet, Opportunite, Tache, RendezVous, Notification }
export type { ClientType, ClientStatus, MaritalStatus, RiskProfile, InvestmentHorizon }
export type { ActifType, ActifCategory, PassifType, ContratType, ContratStatus }
export type { DocumentType, DocumentCategory, SignatureStatus, SignatureProvider }
export type { ObjectifType, ObjectifStatus, ProjetType, ProjetStatus }
export type { OpportuniteType, OpportuniteStatus, TacheType, TacheStatus, TachePriority }
export type { RendezVousType, RendezVousStatus, NotificationType }
export type { EmailMessage, EmailTemplate, ScenarioStatus, ScenarioTrigger }

// ============================================================================
// Common Types
// ============================================================================

export interface AddressData {
  street?: string
  street2?: string
  city?: string
  postalCode?: string
  country?: string
  state?: string
  codeInsee?: string
}

// ============================================================================
// JSON-safe Types (for Prisma Json fields)
// ============================================================================

/** Generic JSON-compatible value */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray
export type JsonObject = { [key: string]: JsonValue }
export type JsonArray = JsonValue[]

/** Permissive record for JSON data from Prisma */
export type UnknownRecord = Record<string, unknown>

// ============================================================================
// Domain-specific sub-types
// ============================================================================

/** Insurance data for passifs (loans) */
export interface PassifInsurance {
  guarantees?: Array<{ type: string; covered: boolean }>
  rate?: number
  provider?: string
  type?: string
}

/** Beneficiary for contracts */
export interface ContractBeneficiary {
  name?: string
  relationship?: string
  share?: number
  rank?: number
  clause?: string
}

/** Apporteur statistics */
export interface ApporteurStatsData {
  totalClients?: number
  activeClients?: number
  totalCommissions?: number
  lastYearCommissions?: number
}

/** Apporteur client reference */
export interface ApporteurClientRef {
  id: string
  firstName: string
  lastName: string
  email?: string
  status?: string
  createdAt?: string | Date
}

/** Conseiller summary for management */
export interface ConseillerSummary {
  id: string
  firstName: string
  lastName: string
  email?: string
  role?: string
  stats?: UnknownRecord
}

/** Client summary reference */
export interface ClientSummaryRef {
  id: string
  firstName: string
  lastName: string
  email?: string
  createdAt?: string | Date
}

/** Opportunity summary reference */
export interface OpportunitySummaryRef {
  id: string
  name: string
  type?: string
  status?: string
  estimatedValue?: number
  createdAt?: string | Date
}

/** History entry for stats */
export interface StatsHistoryEntry {
  period: string
  value: number
  label?: string
}

/** Participant for meetings */
export interface MeetingParticipant {
  id?: string
  name?: string
  email?: string
  role?: string
  status?: string
}

/** Assignee for tasks/actions */
export interface AssigneeRef {
  id: string
  firstName?: string
  lastName?: string
  name?: string
  email?: string
}

/** Activity item */
export interface ActivityItem {
  id: string
  type: string
  title?: string
  description?: string
  date?: string | Date
  createdAt?: string | Date
}

/** Objectif item for stats */
export interface ObjectifItemRef {
  id: string
  type?: string
  name?: string
  target?: number
  current?: number
  status?: string
}

// ============================================================================
// Client Types
// ============================================================================

export interface ClientListItem {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  clientType: ClientType
  status: ClientStatus
  lastContactDate: Date | null
  createdAt: Date
  updatedAt: Date
  _count?: {
    actifs: number
    passifs: number
    contrats: number
    documents: number
  }
  wealth?: {
    totalActifs: number
    totalPassifs: number
    patrimoineNet: number
  }
  income?: {
    annualIncome: number
    totalRevenusActifs: number
    totalRevenus: number
  }
}

export interface ClientDetail {
  // Base client fields
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  mobile?: string
  birthDate?: Date | string | null
  address?: AddressData
  clientType?: ClientType
  status?: ClientStatus
  conseillerId?: string
  cabinetId?: string
  createdAt?: Date | string
  updatedAt?: Date | string
  lastContactDate?: Date | string | null
  // Financial profile
  annualIncome?: number
  riskProfile?: string
  investmentHorizon?: string
  taxResidency?: string
  taxBracket?: string
  usPerson?: boolean
  pepStatus?: boolean
  portalAccessEnabled?: boolean
  // Personal info
  civility?: string
  maidenName?: string
  nomUsage?: string
  birthPlace?: string
  nationality?: string
  maritalStatus?: string
  familyStatus?: string
  matrimonialRegime?: string
  numberOfChildren?: number
  dependents?: number
  profession?: string
  professionCategory?: string
  professionalStatus?: string
  employmentType?: string
  employmentSince?: Date | string
  employerName?: string
  employerSector?: string
  dateOfBirth?: Date | string
  kycStatus?: string
  // KYC/LCB-FT
  isPEP?: boolean
  originOfFunds?: string
  investmentObjective?: string
  investmentKnowledge?: number
  // Professional client fields
  companyName?: string
  siret?: string
  siren?: string
  legalForm?: string
  activitySector?: string
  companyCreationDate?: Date | string
  numberOfEmployees?: number
  annualRevenue?: number
  // Relations
  familyMembers: Array<{ id: string; relation: string; firstName: string; lastName: string; birthDate?: Date }>
  actifs: Actif[]
  passifs: Passif[]
  contrats: Contrat[]
  documents: Document[]
  objectifs: Objectif[]
  projets: Projet[]
  opportunites: Opportunite[]
  taches: Tache[]
  rendezvous: RendezVous[]
  timelineEvents: Array<{ id: string; type: string; title: string; description?: string; createdAt: Date }>
  kycDocuments: Array<{ id: string; type: string; name: string; status?: string }>
  conseiller?: { id: string; firstName: string; lastName: string; email?: string }
  wealth?: {
    totalActifs: number
    totalPassifs: number
    patrimoineNet: number
    netWealth?: number
  }
  // Allow additional dynamic fields
  [key: string]: unknown
}

export interface CreateClientRequest {
  clientType: ClientType
  firstName: string
  lastName: string
  email?: string
  phone?: string
  mobile?: string
  birthDate?: string
  birthPlace?: string
  nationality?: string
  address?: AddressData
  maritalStatus?: MaritalStatus
  marriageRegime?: string
  numberOfChildren?: number
  profession?: string
  employerName?: string
  professionalStatus?: string
  annualIncome?: number
  taxBracket?: string
  fiscalResidence?: string
  riskProfile?: RiskProfile
  investmentHorizon?: InvestmentHorizon
  investmentGoals?: string[]
  // Professional fields
  companyName?: string
  siret?: string
  legalForm?: string
  activitySector?: string
  numberOfEmployees?: number
  annualRevenue?: number
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
  status?: ClientStatus
}

export interface ClientFilters {
  search?: string
  clientType?: ClientType
  status?: ClientStatus
  conseillerId?: string
  kycStatus?: KYCStatus
  page?: number
  pageSize?: number
}

// ============================================================================
// Wealth Types
// ============================================================================

export interface WealthSummary {
  totalActifs: number
  totalPassifs: number
  patrimoineNet: number
  patrimoineGere: number
  patrimoineNonGere: number
  allocationByType: Array<{
    type: ActifType
    value: number
    percentage: number
  }>
  allocationByCategory: Array<{
    category: ActifCategory
    value: number
    percentage: number
  }>
  debtRatio: number
  lastCalculated: string
}

export interface CreateActifRequest {
  type: ActifType
  category: ActifCategory
  name: string
  description?: string
  value: number
  acquisitionDate?: string
  acquisitionValue?: number
  details?: Record<string, unknown>
  annualIncome?: number
  taxDetails?: Record<string, unknown>
  managedByFirm?: boolean
  clientIds: string[]
  ownershipPercentages?: number[]
}

export interface CreatePassifRequest {
  type: PassifType
  name: string
  description?: string
  initialAmount: number
  remainingAmount: number
  interestRate: number
  monthlyPayment: number
  startDate: string
  endDate: string
  linkedActifId?: string
  insurance?: PassifInsurance
}

export interface CreateContratRequest {
  type: ContratType
  name: string
  provider: string
  contractNumber?: string
  startDate: string
  endDate?: string
  premium?: number
  coverage?: number
  value?: number
  beneficiaries?: ContractBeneficiary[]
  details?: UnknownRecord
  commission?: number
  nextRenewalDate?: string
}

// ============================================================================
// Document Types
// ============================================================================

export type StorageProvider = 'LOCAL' | 'S3' | 'AZURE' | 'GCS'

export interface DocumentLinkCounts {
  clients: number
  actifs: number
  passifs: number
  contrats: number
  projets: number
  taches: number
}

export interface DocumentListItem {
  id: string
  cabinetId: string
  name: string
  description?: string | null
  fileUrl: string
  fileSize: number
  mimeType: string
  storageProvider: StorageProvider
  type: DocumentType
  category?: DocumentCategory | null
  tags?: string[] | null
  metadata?: UnknownRecord | null
  version: number
  uploadedBy?: {
    id: string
    firstName: string
    lastName: string
    email?: string
  }
  uploadedAt: string
  signatureStatus?: SignatureStatus | null
  signatureProvider?: SignatureProvider | null
  expiresAt?: string | null
  archivedAt?: string | null
  isConfidential: boolean
  accessLevel: string
  checksum?: string | null
  downloadCount: number
  lastAccessedAt?: string | null
  _count?: DocumentLinkCounts
}

export interface DocumentDetail extends DocumentListItem {
  storageBucket?: string | null
  storageKey?: string | null
  storageRegion?: string | null
  parentVersionId?: string | null
  template?: DocumentTemplateListItem | null
  clients?: Array<{
    clientId: string
    client: {
      id: string
      firstName: string
      lastName: string
      email?: string
    }
  }>
  actifs?: Array<{
    actifId: string
    actif?: {
      id: string
      name: string
      type: ActifType
    }
  }>
  passifs?: Array<{
    passifId: string
    passif?: {
      id: string
      name: string
      type: PassifType
    }
  }>
  contrats?: Array<{
    contratId: string
    contrat?: {
      id: string
      name: string
      type: ContratType
    }
  }>
  projets?: Array<{
    projetId: string
    projet?: {
      id: string
      name: string
    }
  }>
  taches?: Array<{
    tacheId: string
    tache?: {
      id: string
      title: string
    }
  }>
  signatureSteps?: SignatureWorkflowStep[]
}

export interface UploadDocumentRequest {
  name: string
  description?: string
  type: DocumentType
  category?: DocumentCategory
  tags?: string[]
  metadata?: UnknownRecord
  isConfidential?: boolean
  accessLevel?: string
  storageProvider?: StorageProvider
  storageBucket?: string
  storageKey?: string
  storageRegion?: string
  fileUrl: string
  fileSize: number
  mimeType: string
  checksum?: string
  expiresAt?: string
  templateId?: string
  // Link to entities
  clientIds?: string[]
  actifIds?: string[]
  passifIds?: string[]
  contratIds?: string[]
  projetIds?: string[]
  tacheIds?: string[]
}

export interface UpdateDocumentRequest {
  name?: string
  description?: string
  tags?: string[]
  metadata?: UnknownRecord
  isConfidential?: boolean
  accessLevel?: string
  expiresAt?: string
  archivedAt?: string | null
  signatureStatus?: SignatureStatus
  signatureProvider?: SignatureProvider
  signatureProviderId?: string
  signatureWorkflow?: UnknownRecord
  signedAt?: string
  signedBy?: UnknownRecord
}

export interface DocumentFilters {
  search?: string
  type?: DocumentType
  category?: DocumentCategory
  clientId?: string
  actifId?: string
  passifId?: string
  contratId?: string
  projetId?: string
  tacheId?: string
  uploadedById?: string
  signatureStatus?: SignatureStatus
  storageProvider?: StorageProvider
  isConfidential?: boolean
  startDate?: string
  endDate?: string
  tags?: string[]
  page?: number
  pageSize?: number
}

export interface DocumentStats {
  totalDocuments: number
  totalSize: number
  totalSizeGB: number
  averageSize: number
  byType: Record<string, number>
  byCategory: Record<string, number>
  confidential: number
}

export interface DocumentVersionItem {
  id: string
  version: number
  uploadedAt: string
  uploadedBy?: {
    firstName: string
    lastName: string
  }
  checksum?: string | null
}

export interface DocumentTemplateListItem {
  id: string
  cabinetId: string
  name: string
  description?: string | null
  type: DocumentType
  category?: DocumentCategory | null
  tags?: string[] | null
  fileUrl?: string | null
  variables?: UnknownRecord | null
  isActive: boolean
  createdBy?: {
    id: string
    firstName: string
    lastName: string
    email?: string
  }
  createdAt: string
  updatedAt: string
  _count?: {
    documents: number
  }
}

export interface DocumentTemplateDetail extends DocumentTemplateListItem {
  documents?: DocumentListItem[]
}

export interface CreateDocumentTemplateRequest {
  name: string
  description?: string
  type: DocumentType
  category?: DocumentCategory
  tags?: string[]
  fileUrl?: string
  variables?: UnknownRecord
}

export interface UpdateDocumentTemplateRequest extends Partial<CreateDocumentTemplateRequest> {
  isActive?: boolean
}

export interface DuplicateDocumentTemplateRequest {
  name?: string
}

export interface GenerateDocumentFromTemplateRequest {
  templateId: string
  variableValues: UnknownRecord
  documentName?: string
  clientId?: string
}

export interface DocumentTemplateStats {
  totalTemplates: number
  activeTemplates: number
  inactiveTemplates: number
  totalDocumentsGenerated: number
  byType: Record<string, number>
  mostUsed: Array<{
    id: string
    name: string
    type: DocumentType
    usageCount: number
  }>
}

export interface SignatureWorkflowStep {
  id: string
  documentId: string
  stepOrder: number
  signerEmail: string
  signerName?: string
  signerRole?: string
  signatureType: 'ELECTRONIC' | 'ADVANCED' | 'QUALIFIEE'
  status: SignatureStatus
  signedAt?: string | null
  signatureData?: UnknownRecord | null
  reminderSentAt?: string | null
  reminderCount: number
  expiresAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface InitiateSignatureRequest {
  documentId: string
  provider: SignatureProvider
  providerId?: string
  steps: SignatureStepInput[]
}

export interface SignatureStepInput {
  signerEmail: string
  signerName: string
  signerRole?: string
  signatureType?: 'ELECTRONIC' | 'ADVANCED' | 'QUALIFIEE'
  expiresAt?: string
}

export interface UpdateSignatureStepRequest {
  status: SignatureStatus
  signedAt?: string
  signatureData?: UnknownRecord
}

export interface SignatureStats {
  totalWorkflows: number
  completed: number
  pending: number
  rejected: number
  completionRate: number
  avgSignatureHours: number
}

export interface PendingSignatureItem extends DocumentListItem {
  signatureSteps?: SignatureWorkflowStep[]
}

// ============================================================================
// Performance & Arbitrages Types
// ============================================================================

export type PerformancePeriod = 'YTD' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'INCEPTION' | 'CUSTOM'

export interface PerformanceMetrics {
  period: PerformancePeriod
  startDate: string
  endDate: string
  absoluteReturn: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number | null
  maxDrawdown: number
  benchmarkReturn: number | null
  alpha: number | null
  beta: number | null
  trackingError: number | null
  informationRatio: number | null
  portfolioValue: number
  initialValue: number
  contributions: number
  withdrawals: number
  gains: number
  losses: number
}

export interface PerformanceTimeSeries {
  date: string
  value: number
  return: number
  cumulativeReturn: number
  benchmarkValue?: number
  benchmarkReturn?: number
}

export interface PerformanceByAssetClass {
  assetClass: string
  weight: number
  return: number
  contribution: number
  volatility: number
}

export interface PerformanceStats {
  currentValue: number
  ytdReturn: number
  oneYearReturn: number
  threeYearReturn: number | null
  fiveYearReturn: number | null
  inceptionReturn: number
  inceptionDate: string
  bestMonth: { date: string; return: number }
  worstMonth: { date: string; return: number }
  positiveMonths: number
  negativeMonths: number
  winRate: number
  avgGain: number
  avgLoss: number
  gainLossRatio: number
}

export interface PerformanceResponse {
  metrics: Record<PerformancePeriod, PerformanceMetrics>
  timeSeries: PerformanceTimeSeries[]
  byAssetClass: PerformanceByAssetClass[]
  stats: PerformanceStats
  lastUpdated: string
}

export interface PerformanceFilters {
  clientId?: string
  startDate?: string
  endDate?: string
  assetClasses?: string[]
  includeUnmanaged?: boolean
}

export type ArbitrageType =
  | 'REBALANCING'
  | 'OPTIMISATION_FISCALE'
  | 'DIVERSIFICATION'
  | 'LIQUIDITY'
  | 'YIELD_ENHANCEMENT'
  | 'RISK_REDUCTION'
  | 'COST_OPTIMIZATION'

export type ArbitragePriority = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE'

export type ArbitrageStatus = 'SUGGESTED' | 'ACCEPTEE' | 'REJETEE' | 'EXECUTED'

export interface ArbitrageSuggestion {
  id: string
  type: ArbitrageType
  priority: ArbitragePriority
  status: ArbitrageStatus
  title: string
  description: string
  rationale: string
  sourceActifId?: string
  sourceActifName?: string
  targetActifType?: ActifType
  targetActifName?: string
  suggestedAmount: number
  currentAllocation?: number
  targetAllocation?: number
  expectedImpact: {
    returnImprovement?: number
    riskReduction?: number
    taxSavings?: number
    feeReduction?: number
    liquidityImprovement?: number
  }
  implementation: {
    steps: string[]
    timeframe: string
    complexity: 'BASSE' | 'MOYENNE' | 'HAUTE'
  }
  createdAt: string
  validUntil?: string
  executedAt?: string
  executedBy?: string
}

export interface ArbitrageStats {
  totalSuggestions: number
  bySuggested: number
  byAccepted: number
  byRejected: number
  byExecuted: number
  byType: Record<ArbitrageType, number>
  byPriority: Record<ArbitragePriority, number>
  avgExecutionRate: number
  totalPotentialImpact: {
    returnImprovement: number
    taxSavings: number
    feeReduction: number
  }
}

export interface ArbitragesResponse {
  suggestions: ArbitrageSuggestion[]
  stats: ArbitrageStats
  lastAnalyzed: string
}

export interface ArbitrageFilters {
  clientId?: string
  types?: ArbitrageType[]
  priorities?: ArbitragePriority[]
  statuses?: ArbitrageStatus[]
  minAmount?: number
}

export interface UpdateArbitrageRequest {
  status: ArbitrageStatus
  notes?: string
}

// ============================================================================
// Apporteurs d'affaires Types
// ============================================================================

export type ApporteurType = 'NOTAIRE' | 'EXPERT_COMPTABLE' | 'BANQUIER' | 'COURTIER' | 'AUTRE'

export interface ApporteurListItem {
  id: string
  type: ApporteurType
  firstName: string
  lastName: string
  email: string
  phone: string | null
  company: string | null
  profession: string | null
  commissionRate: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  owner?: {
    id: string
    firstName: string
    lastName: string
  }
  _count: {
    clients: number
  }
  stats: ApporteurStatsData | null
}

export interface ApporteurDetail extends ApporteurListItem {
  clients?: ApporteurClientRef[]
}

export interface CreateApporteurRequest {
  type: ApporteurType
  firstName: string
  lastName: string
  email: string
  phone?: string
  company?: string
  profession?: string
  commissionRate?: number
}

export interface UpdateApporteurRequest {
  type?: ApporteurType
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  company?: string
  profession?: string
  commissionRate?: number
  isActive?: boolean
}

export interface ApporteurFilters {
  search?: string
  type?: ApporteurType
  isActive?: boolean
}

export interface ApporteurStats {
  total: number
  active: number
  inactive: number
  byType: Record<string, number>
  totalClientsApportes: number
  totalCommissions: number
}

// ============================================================================
// Task & Calendar Types
// ============================================================================

export interface CreateTacheRequest {
  title: string
  description?: string
  type: TacheType
  priority: TachePriority
  status?: TacheStatus
  dueDate?: string
  reminderDate?: string
  assignedToId: string
  clientId?: string
  projetId?: string
}

export interface CreateRendezVousRequest {
  title: string
  description?: string
  type: RendezVousType
  startDate: string
  endDate: string
  location?: string
  isVirtual?: boolean
  meetingUrl?: string
  clientId?: string
}

export interface TacheFilters {
  status?: TacheStatus
  priority?: TachePriority
  assignedToId?: string
  clientId?: string
  projetId?: string
  dueBefore?: string
  dueAfter?: string
  page?: number
  pageSize?: number
}

export interface RendezVousFilters {
  status?: RendezVousStatus
  conseillerId?: string
  clientId?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

// ============================================================================
// Objective & Project Types
// ============================================================================

export interface CreateObjectifRequest {
  type: ObjectifType
  name: string
  description?: string
  targetAmount: number
  targetDate: string
  currentAmount?: number
  priority: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE'
  monthlyContribution?: number
  recommendations?: string[] | UnknownRecord
}

export interface CreateProjetRequest {
  type: ProjetType
  name: string
  description?: string
  estimatedBudget?: number
  actualBudget?: number
  startDate?: string
  targetDate?: string
  endDate?: string
  progress?: number
}

// ============================================================================
// Opportunity Types
// ============================================================================

export interface CreateOpportuniteRequest {
  type: OpportuniteType
  name: string
  description?: string
  estimatedValue?: number
  score?: number
  confidence?: number
  priority: 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE'
  status?: OpportuniteStatus
  stage?: string
  actionDeadline?: string
}

// ============================================================================
// Notification Types
// ============================================================================

export interface NotificationListItem {
  id: string
  createdAt: Date | string
  cabinetId?: string
  userId?: string
  clientId?: string
  type?: NotificationType
  title?: string
  message?: string
  actionUrl?: string
  isRead?: boolean
  readAt?: Date | string | null
  client?: {
    id: string
    firstName: string
    lastName: string
  }
}

export interface NotificationFilters {
  type?: NotificationType
  isRead?: boolean
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
  userId?: string
  clientId?: string
  createdAfter?: string
  createdBefore?: string
  limit?: number
  offset?: number
}

export interface CreateNotificationPayload {
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: UnknownRecord
  isRead?: boolean
  clientId?: string
  actionUrl?: string
}

// ============================================================================
// Dashboard Types
// ============================================================================

export interface DashboardCounters {
  clients: {
    total: number
    active: number
    prospects: number
  }
  tasks: {
    total: number
    overdue: number
    today: number
  }
  appointments: {
    total: number
    today: number
    thisWeek: number
  }
  opportunities: {
    total: number
    qualified: number
    totalValue: number
  }
  alerts: {
    total: number
    kycExpiring: number
    contractsRenewing: number
    documentsExpiring: number
  }
  notifications: {
    unread: number
  }
}

// ============================================================================
// Export Types
// ============================================================================

export interface ExportRequest {
  format: 'csv' | 'excel' | 'pdf'
  type: 'clients' | 'actifs' | 'passifs' | 'contrats' | 'documents' | 'full'
  filters?: UnknownRecord
  locale?: string
}

// ============================================================================
// Simulation Types
// ============================================================================

export interface SimulationRequest {
  type: 'retirement' | 'succession' | 'tax' | 'budget' | 'objective'
  data: UnknownRecord
  clientId?: string
  saveResults?: boolean
}

export interface SimulationResult {
  id?: string
  type: string
  results: UnknownRecord
  recommendations?: string[]
  createdAt?: string
}

// ============================================================================
// Marketing Types (Campaigns, Scenarios, Email Templates)
// ============================================================================

import type {
  Campaign,
  CampaignRecipient,
  CampaignStatus,
  CampaignType,
} from '@prisma/client'

// Campaign Types
export interface CampaignListItem {
  id: string
  name: string
  description: string | null
  type: CampaignType
  status: CampaignStatus
  subject: string | null
  scheduledAt: Date | null
  sentAt: Date | null
  completedAt: Date | null
  recipientsTotal: number
  recipientsSent: number
  recipientsOpened: number
  recipientsClicked: number
  recipientsBounced: number
  recipientsError: number
  openRate: number | null
  clickRate: number | null
  bounceRate: number | null
  tags: string[]
  createdAt: Date
  updatedAt: Date
  createdByUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  emailTemplate: {
    id: string
    name: string
  } | null
  _count?: {
    recipients: number
    messages: number
  }
}

export interface CampaignDetail extends Campaign {
  createdByUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  emailTemplate: {
    id: string
    name: string
    category: string | null
  } | null
  recipients: CampaignRecipient[]
  messages: EmailMessage[]
  _count: {
    recipients: number
    messages: number
  }
}

export interface CreateCampaignRequest {
  name: string
  description?: string
  type?: CampaignType
  subject?: string
  previewText?: string
  htmlContent?: string
  plainContent?: string
  emailTemplateId?: string
  targetSegment?: string
  targetClientIds?: string[]
  excludeClientIds?: string[]
  fromName?: string
  fromEmail?: string
  replyTo?: string
  trackOpens?: boolean
  trackClicks?: boolean
  tags?: string[]
  notes?: string
}

export interface UpdateCampaignRequest {
  name?: string
  description?: string
  subject?: string
  previewText?: string
  htmlContent?: string
  plainContent?: string
  emailTemplateId?: string
  targetSegment?: string
  targetClientIds?: string[]
  excludeClientIds?: string[]
  fromName?: string
  fromEmail?: string
  replyTo?: string
  trackOpens?: boolean
  trackClicks?: boolean
  tags?: string[]
  notes?: string
}

export interface CampaignFilters {
  status?: CampaignStatus
  type?: CampaignType
  createdBy?: string
  search?: string
  scheduledFrom?: string
  scheduledTo?: string
  tags?: string[]
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'name' | 'scheduledAt' | 'sentAt'
  sortOrder?: 'asc' | 'desc'
}

export interface CampaignStats {
  total: number
  byStatus: Record<CampaignStatus, number>
  totals: {
    recipients: number
    sent: number
    delivered: number
    opened: number
    clicked: number
    bounced: number
    errors: number
  }
  averageRates: {
    openRate: number
    clickRate: number
    bounceRate: number
  }
}

export interface ScheduleCampaignRequest {
  scheduledAt: string
}

// Scenario Types
export interface ScenarioListItem {
  id: string
  name: string
  description: string | null
  status: ScenarioStatus
  trigger: ScenarioTrigger
  delayHours: number
  executionCount: number
  lastExecutedAt: Date | null
  tags: string[]
  createdAt: Date
  updatedAt: Date
  createdByUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  emailTemplate: {
    id: string
    name: string
  } | null
  _count?: {
    messages: number
  }
}

export interface ScenarioDetail extends Scenario {
  createdByUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  emailTemplate: {
    id: string
    name: string
    category: string | null
  } | null
  messages: EmailMessage[]
  _count: {
    messages: number
  }
}

export interface CreateScenarioRequest {
  name: string
  description?: string
  trigger: ScenarioTrigger
  triggerData?: UnknownRecord
  emailTemplateId: string
  delayHours?: number
  conditions?: UnknownRecord
  fromName?: string
  fromEmail?: string
  replyTo?: string
  tags?: string[]
  notes?: string
}

export interface UpdateScenarioRequest {
  name?: string
  description?: string
  trigger?: ScenarioTrigger
  triggerData?: UnknownRecord
  emailTemplateId?: string
  delayHours?: number
  conditions?: UnknownRecord
  fromName?: string
  fromEmail?: string
  replyTo?: string
  tags?: string[]
  notes?: string
}

export interface ScenarioFilters {
  status?: ScenarioStatus
  trigger?: ScenarioTrigger
  createdBy?: string
  search?: string
  tags?: string[]
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'name' | 'lastExecutedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ScenarioStats {
  total: number
  byStatus: Record<ScenarioStatus, number>
  totalExecutions: number
}

export interface ExecuteScenarioRequest {
  clientIds: string[]
}

// Email Template Types
export interface EmailTemplateListItem {
  id: string
  name: string
  description: string | null
  category: string | null
  subject: string
  previewText: string | null
  variables: string[]
  tags: string[]
  isActive: boolean
  isSystem: boolean
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  createdByUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  _count?: {
    campaigns: number
    scenarios: number
    messages: number
  }
}

export interface EmailTemplateDetail extends EmailTemplate {
  createdByUser: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  campaigns: {
    id: string
    name: string
    status: CampaignStatus
  }[]
  scenarios: {
    id: string
    name: string
    status: ScenarioStatus
  }[]
  messages: EmailMessage[]
  _count: {
    campaigns: number
    scenarios: number
    messages: number
  }
}

export interface CreateEmailTemplateRequest {
  name: string
  description?: string
  category?: string
  subject: string
  previewText?: string
  htmlContent: string
  plainContent?: string
  variables?: string[]
  tags?: string[]
  notes?: string
  isSystem?: boolean
  isActive?: boolean
}

export interface UpdateEmailTemplateRequest {
  name?: string
  description?: string
  category?: string
  subject?: string
  previewText?: string
  htmlContent?: string
  plainContent?: string
  variables?: string[]
  tags?: string[]
  notes?: string
  isActive?: boolean
}

export interface EmailTemplateFilters {
  category?: string
  isActive?: boolean
  isArchived?: boolean
  isSystem?: boolean
  search?: string
  tags?: string[]
  limit?: number
  offset?: number
  sortBy?: 'createdAt' | 'name' | 'category' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface EmailTemplateStats {
  total: number
  active: number
  inactive: number
  archived: number
  system: number
}

export interface DuplicateTemplateRequest {
  newName?: string
}

export interface PreviewTemplateRequest {
  testData?: UnknownRecord
}

export interface PreviewTemplateResponse {
  subject: string
  htmlContent: string
  plainContent: string | null
}

// ============================================
// KYC & COMPLIANCE TYPES
// ============================================

export type KYCDocumentType =
  | 'IDENTITE'
  | 'JUSTIFICATIF_DOMICILE'
  | 'AVIS_IMPOSITION'
  | 'RIB_BANCAIRE'
  | 'JUSTIFICATIF_PATRIMOINE'
  | 'ORIGINE_FONDS'
  | 'AUTRE'

export type KYCDocStatus = 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'EXPIRE'

export type KYCStatus = 'EN_ATTENTE' | 'EN_COURS' | 'COMPLET' | 'EXPIRE' | 'REJETE'

export interface KYCDocumentListItem {
  id: string
  cabinetId: string
  clientId: string
  type: KYCDocumentType
  documentId: string | null
  fileName: string | null
  fileUrl: string | null
  status: KYCDocStatus
  validatedAt: string | null
  validatedById: string | null
  rejectionReason: string | null
  expiresAt: string | null
  reminderSentAt: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface KYCDocumentDetail extends KYCDocumentListItem {
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string | null
    kycStatus: KYCStatus
  }
  validatedBy?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface CreateKYCDocumentRequest {
  clientId: string
  type: KYCDocumentType
  documentId?: string
  fileName?: string
  fileUrl?: string
  expiresAt?: string
  notes?: string
}

export interface UpdateKYCDocumentRequest {
  fileName?: string
  fileUrl?: string
  expiresAt?: string
  notes?: string
}

export interface ValidateKYCDocumentRequest {
  status: 'VALIDE' | 'REJETEE'
  rejectionReason?: string
}

export interface KYCDocumentFilters {
  clientId?: string
  status?: KYCDocStatus
  type?: KYCDocumentType
  expiresAfter?: string
  expiresBefore?: string
}

export type KYCCheckType =
  | 'VERIFICATION_IDENTITE'
  | 'VERIFICATION_ADRESSE'
  | 'SITUATION_FINANCIERE'
  | 'CONNAISSANCE_INVESTISSEMENT'
  | 'PROFIL_RISQUE'
  | 'ORIGINE_PATRIMOINE'
  | 'PERSONNE_EXPOSEE'
  | 'CRIBLAGE_SANCTIONS'
  | 'REVUE_PERIODIQUE'
  | 'AUTRE'

export type KYCCheckStatus =
  | 'EN_ATTENTE'
  | 'EN_COURS'
  | 'TERMINE'
  | 'ECHOUE'
  | 'ACTION_REQUISE'
  | 'ESCALADE'

export type KYCCheckPriority = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'URGENTE'

export type KYCRiskLevel = 'BASSE' | 'MODEREE' | 'ELEVEE' | 'CRITIQUE'

export interface KYCCheckListItem {
  id: string
  cabinetId: string
  clientId: string
  type: KYCCheckType
  status: KYCCheckStatus
  priority: KYCCheckPriority
  assignedToId: string | null
  description: string | null
  findings: string | null
  recommendations: string | null
  dueDate: string | null
  completedAt: string | null
  completedById: string | null
  isACPRMandatory: boolean
  acprReference: string | null
  score: number | null
  riskLevel: string | null
  createdAt: string
  updatedAt: string
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
    kycStatus: KYCStatus
  }
  assignedTo?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface KYCCheckDetail extends KYCCheckListItem {
  completedBy?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface CreateKYCCheckRequest {
  clientId: string
  type: KYCCheckType
  priority?: KYCCheckPriority
  assignedToId?: string
  description?: string
  dueDate?: string
  isACPRMandatory?: boolean
  acprReference?: string
}

export interface UpdateKYCCheckRequest {
  status?: KYCCheckStatus
  priority?: KYCCheckPriority
  assignedToId?: string
  description?: string
  findings?: string
  recommendations?: string
  dueDate?: string
  score?: number
  riskLevel?: KYCRiskLevel
}

export interface CompleteKYCCheckRequest {
  findings: string
  recommendations?: string
  score?: number
  riskLevel?: KYCRiskLevel
}

export interface KYCCheckFilters {
  clientId?: string
  status?: KYCCheckStatus
  type?: KYCCheckType
  priority?: KYCCheckPriority
  assignedToId?: string
  isACPRMandatory?: boolean
  dueBefore?: string
  dueAfter?: string
}

export interface KYCStats {
  total: number
  byStatus: Record<string, number>
  completed: number
  pending: number
  inProgress: number
  expired: number
  rejected: number
  completionRate: number
}

export interface KYCCheckStats {
  total: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  byType: Record<string, number>
  overdue: number
  acprMandatory: number
}

// ============================================
// RECLAMATION TYPES
// ============================================

export type ReclamationType =
  | 'QUALITE_SERVICE'
  | 'TARIFICATION'
  | 'QUALITE_CONSEIL'
  | 'COMMUNICATION'
  | 'DOCUMENT'
  | 'AUTRE'

export type ReclamationStatus =
  | 'RECUE'
  | 'EN_COURS'
  | 'EN_ATTENTE_INFO'
  | 'RESOLUE'
  | 'CLOTUREE'
  | 'ESCALADEE'

export type SLASeverity = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE'

export type SLAEventType =
  | 'CREE'
  | 'ASSIGNE'
  | 'STATUT_MODIFIE'
  | 'ESCALADEE'
  | 'ECHEANCE_PROCHE'
  | 'ECHEANCE_DEPASSEE'
  | 'RESOLUE'
  | 'REPONSE_ENVOYEE'
  | 'RETOUR_CLIENT'
  | 'NOTE_INTERNE'
  | 'AUTRE'

export interface SLAEventListItem {
  id: string
  reclamationId: string
  type: SLAEventType
  description: string
  metadata: UnknownRecord | null
  userId: string | null
  timestamp: string
  isSystemGenerated: boolean
  user?: {
    firstName: string
    lastName: string
    email: string
  }
}

export interface ReclamationListItem {
  id: string
  cabinetId: string
  clientId: string
  reference: string
  subject: string
  description: string
  type: ReclamationType
  status: ReclamationStatus
  severity: SLASeverity
  assignedToId: string | null
  responseText: string | null
  internalNotes: string | null
  resolutionDate: string | null
  receivedAt: string
  deadline: string
  slaDeadline: string
  slaBreach: boolean
  slaBreachAt: string | null
  escalatedToMediator: boolean
  escalatedAt: string | null
  mediatorReference: string | null
  clientSatisfaction: number | null
  satisfactionComment: string | null
  createdAt: string
  updatedAt: string
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  assignedTo?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  _count?: {
    slaEvents: number
  }
}

export interface ReclamationDetail extends Omit<ReclamationListItem, '_count'> {
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone: string | null
  }
  slaEvents: SLAEventListItem[]
}

export interface CreateReclamationRequest {
  clientId: string
  subject: string
  description: string
  type: ReclamationType
  severity?: SLASeverity
  assignedToId?: string
  receivedAt?: string
}

export interface UpdateReclamationRequest {
  subject?: string
  description?: string
  type?: ReclamationType
  status?: ReclamationStatus
  severity?: SLASeverity
  assignedToId?: string
  responseText?: string
  internalNotes?: string
}

export interface ResolveReclamationRequest {
  responseText: string
  internalNotes?: string
}

export interface EscalateReclamationRequest {
  reason: string
  mediatorReference?: string
}

export interface ReclamationFilters {
  clientId?: string
  status?: ReclamationStatus
  type?: ReclamationType
  severity?: SLASeverity
  assignedToId?: string
  slaBreach?: boolean
  escalatedToMediator?: boolean
  search?: string
  deadlineAfter?: string
  deadlineBefore?: string
}

export interface ReclamationStats {
  total: number
  byStatus: Record<string, number>
  byType: Record<string, number>
  bySeverity: Record<string, number>
  slaBreaches: number
  slaBreachRate: number
  escalated: number
  avgResolutionDays: number
}

// ============================================================================
// Budget & Cash-Flow Types
// ============================================================================

export interface ProfessionalIncome {
  netSalary: number
  selfEmployedIncome: number // BNC / BIC
  bonuses: number
  other: number
}

export interface AssetIncome {
  rentalIncome: number // Revenus fonciers
  dividends: number // Dividendes
  interest: number // Intérêts
  capitalGains: number // Plus-values
}

export interface SpouseIncome {
  netSalary: number
  other: number
}

export interface RetirementPensions {
  total: number
}

export interface Allowances {
  total: number
}

export interface MonthlyExpenseCategory {
  total: number
}

export interface MonthlyExpenses {
  housing?: MonthlyExpenseCategory // 🏠 Logement
  utilities?: MonthlyExpenseCategory // ⚡ Énergie & utilities
  food?: MonthlyExpenseCategory // 🍽️ Alimentation
  transportation?: MonthlyExpenseCategory // 🚗 Transport
  insurance?: MonthlyExpenseCategory // 🛡️ Assurances
  leisure?: MonthlyExpenseCategory // 🎭 Loisirs & culture
  health?: MonthlyExpenseCategory // 🏥 Santé
  education?: MonthlyExpenseCategory // 📚 Éducation
  loans?: MonthlyExpenseCategory // 💳 Crédits (hors immo)
  other?: MonthlyExpenseCategory // 📋 Autres charges
}

export interface ClientBudget {
  id: string
  clientId: string
  professionalIncome?: ProfessionalIncome
  assetIncome?: AssetIncome
  spouseIncome?: SpouseIncome
  retirementPensions?: RetirementPensions
  allowances?: Allowances
  monthlyExpenses?: MonthlyExpenses
  totalRevenue?: number
  totalExpenses?: number
  savingsCapacity?: number
  savingsRate?: number
  createdAt: Date
  updatedAt: Date
}

export interface BudgetMetrics {
  revenusMensuels: number
  revenusAnnuels: number
  chargesMensuelles: number
  chargesAnnuelles: number
  capaciteEpargneMensuelle: number
  capaciteEpargneAnnuelle: number
  tauxEpargne: number
  epargneSecuriteMin: number // 3 mois de charges
  epargneSecuriteMax: number // 6 mois de charges
  resteAVivre: number
}

export type BudgetAlertSeverity = 'CRITIQUE' | 'WARNING' | 'INFO'

export interface BudgetAlert {
  severity: BudgetAlertSeverity
  category: string // SAVINGS, HOUSING, DEBT, etc.
  message: string
  recommendation: string
}

export type BudgetRecommendationPriority = 'HAUTE' | 'MOYENNE' | 'BASSE'

export interface BudgetRecommendation {
  priority: BudgetRecommendationPriority
  category: string // SAVINGS, TAX, EXPENSES, INVESTMENT
  title: string
  description: string
  impact: string
}

// ============================================================================
// Fiscalité Types
// ============================================================================

export interface IncomeTax {
  fiscalReferenceIncome: number // Revenu fiscal de référence
  taxShares: number // Nombre de parts
  quotientFamilial: number // RFR / parts
  taxBracket: number // TMI: 0, 11, 30, 41, 45
  annualAmount: number // Montant IR annuel
  monthlyPayment: number // Prélèvement mensuel
  taxCredits: number // Crédits d'impôt
  taxReductions: number // Réductions d'impôt
}

export interface IFI {
  taxableRealEstateAssets: number // Patrimoine immobilier brut
  deductibleLiabilities: number // Dettes déductibles
  netTaxableIFI: number // Patrimoine net taxable
  ifiAmount: number // Montant IFI estimé
  bracket: string // Tranche IFI
  threshold: number // Seuil d'assujettissement (1 300 000€)
}

export interface SocialContributions {
  taxableAssetIncome: number // Revenus du patrimoine soumis
  rate: number // 17.2%
  amount: number // Montant PS
}

export interface ClientTaxation {
  id: string
  clientId: string
  anneeFiscale: number
  incomeTax?: IncomeTax
  ifi?: IFI
  socialContributions?: SocialContributions
  createdAt: Date
  updatedAt: Date
}

export type TaxOptimizationPriority = 'HAUTE' | 'MOYENNE' | 'BASSE'
export type TaxOptimizationStatus =
  | 'DETECTEE'
  | 'DETECTEE'
  | 'EN_COURS'
  | 'TERMINE'
  | 'REJETEE'

export interface TaxOptimization {
  id: string
  clientId: string
  priority: TaxOptimizationPriority
  category: string
  title: string
  description: string
  potentialSavings?: number
  recommendation: string
  status: TaxOptimizationStatus
  reviewedAt?: Date
  reviewedBy?: string
  completedAt?: Date
  dismissedAt?: Date
  dismissReason?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Patrimoine Enrichi Types
// ============================================================================

export interface ManagementTracking {
  isManaged: boolean
  advisor?: string
  since?: Date
  fees?: number
}

export interface FiscalDataIFI {
  propertyType?: 'RP' | 'SECONDARY' | 'RENTAL' | 'COMMERCIAL'
  rpAbatement: boolean
  manualDiscount?: number
  ifiValue?: number
}

export interface ActifEnriched {
  id: string
  type: ActifType
  category?: ActifCategory
  name: string
  value?: number
  description?: string
  location?: string
  managementAdvisor?: string
  managementSince?: Date
  fiscalPropertyType?: string
  fiscalRpAbatement?: boolean
  fiscalManualDiscount?: number
  fiscalIfiValue?: number
  linkedPassifId?: string
  createdAt?: Date | string
  updatedAt?: Date | string
  [key: string]: unknown
}

export interface PassifEnriched {
  id: string
  type: PassifType
  name: string
  description?: string
  initialAmount?: number
  currentBalance?: number
  monthlyPayment?: number
  interestRate?: number
  insuranceRate?: number
  startDate?: Date | string
  endDate?: Date | string
  createdAt?: Date | string
  updatedAt?: Date | string
  [key: string]: unknown
}

// ============================================================================
// Famille Enrichie Types
// ============================================================================

export type FamilyRelationshipType =
  | 'CONJOINT'
  | 'ENFANT'
  | 'PARENT'
  | 'FRATRIE'
  | 'PETIT_ENFANT'
  | 'ASCENDANT'
  | 'AUTRE'

export interface FamilyMemberEnriched {
  id: string
  clientId: string
  firstName: string
  lastName: string
  birthDate?: Date
  relationship: FamilyRelationshipType
  civility?: string // M, MME, MLLE
  profession?: string
  annualIncome?: number
  isDependent: boolean
  email?: string
  phone?: string
  notes?: string
  linkedClientId?: string
  isBeneficiary: boolean
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// Management Types
// ============================================================================

export interface ManagementStatsFilters {
  period?: 'week' | 'month' | 'quarter' | 'year'
}

export interface ManagementStats {
  period: string
  periodLabel: string
  stats?: {
    totalClients: number
    newClients: number
    totalOpportunities: number
    opportunitiesWon: number
    totalCA: number
    tasks: number
    tasksDone: number
    appointments: number
    conversionRate: number
  }
  globalStats?: {
    totalCA: number
    newClients: number
    totalNewClients: number
    opportunitiesWon: number
    totalOpportunitiesWon: number
    tasks: number
    totalTasks: number
    tasksDone: number
    totalTasksDone: number
    appointments: number
    conversionRate: number
    caGrowth: number
    totalClients: number
    totalOpportunities: number
  }
  conseillers: ConseillerSummary[]
}

export interface ConseillerDetailStats {
  conseiller: ConseillerSummary
  period: string
  stats: UnknownRecord
  recentClients: ClientSummaryRef[]
  recentOpportunities: OpportunitySummaryRef[]
  history: StatsHistoryEntry[]
}

export interface ObjectifItem {
  id: string
  type: string
  label: string
  target: number
  current: number
  unit: string
  period: string
  status: string
  conseillerId?: string
  conseillerName?: string
}

export interface ActionItem {
  id: string
  title: string
  description?: string
  type: string
  status: string
  priority: string
  dueDate?: string
  startDate?: string
  endDate?: string
  assignedTo: AssigneeRef[]
  createdAt: string
}

export interface ReunionItem {
  id: string
  title: string
  type: string
  date: string
  time: string
  duration: number
  location?: string
  videoLink?: string
  status: string
  participants: MeetingParticipant[]
  agenda?: string[] | string
  notes?: string
  recurring: boolean | string
  createdAt: string
}

export interface MonActiviteStats {
  period: string
  periodLabel: string
  stats: {
    // Core stats
    totalClients: number
    newClients: number
    totalOpportunities: number
    opportunitiesWon: number
    currentCA: number
    lastPeriodCA: number
    caProgression: number
    tasks: number
    tasksDone: number
    tasksOverdue: number
    rank: number
    totalConseillers: number
    conversionRate: number
    caObjectif: number
    caProgress: number
    // Additional properties that pages might access
    ca?: number
    caLastMonth?: number
    clients?: number
    clientsNew?: number
    opportunities?: number
    opportunitiesValue?: number
    rankTotal?: number
  }
  activities: ActivityItem[]
  objectifs: ObjectifItemRef[]
}

export interface MesActionsItem {
  id: string
  title: string
  description?: string
  type: string
  status: string
  priority: string
  dueDate?: string
  clientId?: string
  clientName?: string
  createdAt: string
}

export interface MaFactureItem {
  id: string
  invoiceNumber?: string
  numero?: string
  client?: string
  clientId?: string
  type?: string
  montant?: number
  amountHT?: number
  amountTTC?: number
  status: string
  description?: string
  issueDate?: string
  dueDate?: string
  paidDate?: string
  dateCreation?: string
  dateSoumission?: string
  datePaiement?: string
}
