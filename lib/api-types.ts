/**
 * API Types for ALFI CRM
 * Type definitions for API requests and responses
 */

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
  KYCStatus,
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
} from '@prisma/client'

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
}

export interface ClientDetail extends Client {
  familyMembers: any[]
  actifs: Actif[]
  passifs: Passif[]
  contrats: Contrat[]
  documents: Document[]
  objectifs: Objectif[]
  projets: Projet[]
  opportunites: Opportunite[]
  taches: Tache[]
  rendezvous: RendezVous[]
  timelineEvents: any[]
  kycDocuments: any[]
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
  address?: any
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
  investmentGoals?: any
  // Professional fields
  companyName?: string
  siret?: string
  legalForm?: string
  activitySector?: string
  numberOfEmployees?: number
  annualRevenue?: number
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {}

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
  details?: any
  annualIncome?: number
  taxDetails?: any
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
  insurance?: any
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
  beneficiaries?: any
  details?: any
  commission?: number
  nextRenewalDate?: string
}

// ============================================================================
// Document Types
// ============================================================================

export interface UploadDocumentRequest {
  name: string
  description?: string
  type: DocumentType
  category?: DocumentCategory
  tags?: string[]
  isConfidential?: boolean
  accessLevel?: string
  // Link to entities
  clientIds?: string[]
  actifIds?: string[]
  passifIds?: string[]
  contratIds?: string[]
  projetIds?: string[]
  tacheIds?: string[]
}

export interface DocumentFilters {
  search?: string
  type?: DocumentType
  category?: DocumentCategory
  clientId?: string
  uploadedById?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
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
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  monthlyContribution?: number
  recommendations?: any
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
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  status?: OpportuniteStatus
  stage?: string
  actionDeadline?: string
}

// ============================================================================
// Notification Types
// ============================================================================

export interface NotificationListItem extends Notification {
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
  filters?: any
  locale?: string
}

// ============================================================================
// Simulation Types
// ============================================================================

export interface SimulationRequest {
  type: 'retirement' | 'succession' | 'tax' | 'budget' | 'objective'
  data: any
  clientId?: string
  saveResults?: boolean
}

export interface SimulationResult {
  id?: string
  type: string
  results: any
  recommendations?: string[]
  createdAt?: string
}
