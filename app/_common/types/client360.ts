/**
 * Client 360 Types
 * Type definitions for the Client 360 module tabs and data structures
 */

// ============================================================================
// Shared Enums
// ============================================================================

export type AlertSeverity = 'CRITIQUE' | 'WARNING' | 'INFO'

export type AssetCategory = 'IMMOBILIER' | 'FINANCIER' | 'EPARGNE_SALARIALE' | 'EPARGNE_RETRAITE' | 'PROFESSIONNEL' | 'MOBILIER' | 'AUTRES'

export type AssetSubCategory =
  | 'RESIDENCE_PRINCIPALE'
  | 'LOCATIF'
  | 'COMMERCIAL'
  | 'SCPI'
  | 'PEA'
  | 'CTO'
  | 'ASSURANCE_VIE'
  | 'FONDS_EUROS'
  | 'UC'
  | 'VEHICULES'
  | 'OEUVRES'
  | 'AUTRE'

export type LiabilityCategory = 'CREDIT_IMMO' | 'CREDIT_CONSO' | 'DETTE_PRO'

export type ContractType = 'ASSURANCE_VIE' | 'PER' | 'MADELIN' | 'PREVOYANCE' | 'BANCAIRE'

export type ContractStatus = 'ACTIF' | 'CLOSED' | 'TRANSFERRED'

export type DocumentCategory = 'IDENTITE' | 'FISCAL' | 'PATRIMOINE' | 'REGLEMENTAIRE' | 'COMMERCIAL' | 'AUTRE'

export type DocumentStatus = 'VALID' | 'EXPIRE' | 'MISSING'

export type ObjectiveType = 'RETRAITE' | 'REAL_ESTATE' | 'TRANSMISSION' | 'ETUDES' | 'AUTRE'

export type ObjectiveStatus = 'ACTIF' | 'ATTEINT' | 'ABANDONED'

export type ProjectPriority = 'HAUTE' | 'MOYENNE' | 'BASSE'

export type OpportunityCategory = 'FISCAL' | 'INVESTMENT' | 'REORGANIZATION'

export type OpportunityStatus = 'NEW' | 'DETECTEE' | 'ACCEPTEE' | 'REJETEE'

export type ActivityType = 'CALL' | 'EMAIL' | 'MEETING' | 'ACTION' | 'LOG'

export type FamilyRole = 'CONJOINT' | 'CHILD_MAJOR' | 'CHILD_MINOR' | 'DEPENDENT'

export type RiskLevel = 'BASSE' | 'MOYENNE' | 'HAUTE'

export type Complexity = 'BASSE' | 'MOYENNE' | 'HAUTE'

export type CommunicationPreference = 'EMAIL' | 'PHONE' | 'BOTH'

export type ReportingFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'

export type RevenueFrequency = 'MONTHLY' | 'ANNUAL' | 'ONE_TIME'

export type BudgetAlertType = 'SURPLUS' | 'DEFICIT' | 'RISK'

export type VersementType = 'INITIAL' | 'PLANIFIE' | 'EXCEPTIONAL'

export type LegalStructureType = 'SCI' | 'HOLDING' | 'SARL' | 'SAS'

export type AccessRole = 'OWNER' | 'EDITOR' | 'VIEWER'

// ============================================================================
// Shared Interfaces
// ============================================================================

export interface Address {
  street?: string
  city?: string
  postalCode?: string
  country?: string
}

export interface AllocationItem {
  category: string
  value: number
  percentage: number
  color?: string
}

export interface EvolutionPoint {
  date: string
  value: number
}

export interface PerformancePoint {
  date: string
  return: number
  benchmark?: number
}

// ============================================================================
// TabOverview Types
// ============================================================================

export interface Alert {
  id: string
  type: AlertSeverity
  title: string
  message: string
  actionLink?: string
  actionLabel?: string
}

export interface OverviewIndicators {
  currentTaxation: number
  taxableIncome: number
  activeContractsCount: number
  riskLevel: RiskLevel
  priorityObjectives: string[]
}

export interface OverviewPatrimony {
  totalGross: number
  totalNet: number
  allocation: AllocationItem[]
  evolution: EvolutionPoint[]
}

export interface OverviewData {
  patrimony: OverviewPatrimony
  indicators: OverviewIndicators
  alerts: Alert[]
  recentActivities: Activity[]
}

// ============================================================================
// TabProfile Types
// ============================================================================

export interface FamilyMember {
  id: string
  role: FamilyRole
  firstName: string
  lastName: string
  birthDate: string
  isFiscalDependent: boolean
}

export interface LegalStructure {
  type: LegalStructureType
  name: string
  ownership: number
}

export interface ProfileIdentity {
  firstName: string
  lastName: string
  birthDate: string
  nationality: string
  email: string
  phone: string
  address: Address
}

export interface ProfileLegalRights {
  matrimonialRegime: string
  professionalStatus: string
  structures: LegalStructure[]
}

export interface ProfileFiscalInfo {
  fiscalShares: number
  fiscalHousehold: string
}

export interface ProfileData {
  identity: ProfileIdentity
  family: FamilyMember[]
  legalRights: ProfileLegalRights
  fiscalInfo: ProfileFiscalInfo
}

// ============================================================================
// TabPatrimoine Types
// ============================================================================

export interface Asset {
  id: string
  name: string
  category: AssetCategory
  subCategory: string
  value: number
  acquisitionDate: string
  acquisitionValue: number
  isManaged: boolean
  details: Record<string, unknown>
}

export interface Liability {
  id: string
  name: string
  category: LiabilityCategory
  remainingAmount: number
  interestRate: number
  monthlyPayment: number
  endDate: string
  isManaged: boolean
}

export interface PatrimoineSummary {
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  debtRatio: number
}

export interface PatrimoineAllocations {
  byCategory: AllocationItem[]
  realEstateDetail: AllocationItem[]
  financialDetail: AllocationItem[]
}

export interface PatrimoineData {
  summary: PatrimoineSummary
  assets: Asset[]
  liabilities: Liability[]
  allocations: PatrimoineAllocations
  performance: PerformancePoint[]
}

// ============================================================================
// TabBudget Types
// ============================================================================

export interface RevenueItem {
  id: string
  category: string
  label: string
  amount: number
  frequency: RevenueFrequency
}

export interface ExpenseItem {
  id: string
  category: string
  label: string
  amount: number
  isFixed: boolean
}

export interface ProjectionPoint {
  month: string
  projectedBalance: number
  projectedRevenue: number
  projectedExpense: number
}

export interface BudgetAlert {
  type: BudgetAlertType
  severity: AlertSeverity
  message: string
  threshold?: number
}

export interface BudgetRevenues {
  recurring: RevenueItem[]
  oneTime: RevenueItem[]
  totalMonthly: number
  totalAnnual: number
}

export interface BudgetExpenses {
  fixed: ExpenseItem[]
  variable: ExpenseItem[]
  totalMonthly: number
  totalAnnual: number
}

export interface BudgetBalance {
  monthly: number
  annual: number
  savingsRate: number
}

export interface BudgetData {
  revenues: BudgetRevenues
  expenses: BudgetExpenses
  balance: BudgetBalance
  projection: ProjectionPoint[]
  alerts: BudgetAlert[]
}

// ============================================================================
// TabFiscalite Types
// ============================================================================

export interface RevenueSource {
  id: string
  type: string
  label: string
  amount: number
}

export interface DeductibleCharge {
  id: string
  type: string
  label: string
  amount: number
}

export interface TaxBracket {
  min: number
  max: number
  rate: number
  isCurrentBracket: boolean
}

export interface IFIAsset {
  id: string
  name: string
  value: number
  isTaxable: boolean
  reason?: string
}

export interface TaxOptimization {
  id: string
  type: string
  description: string
  potentialSavings: number
  complexity: Complexity
}

export interface TaxSimulation {
  id: string
  name: string
  scenario: string
  currentTax: number
  simulatedTax: number
  delta: number
  createdAt: string
}

export interface IRData {
  taxableIncome: number
  revenueSources: RevenueSource[]
  deductibleCharges: DeductibleCharge[]
  fiscalShares: number
  marginalRate: number
  brackets: TaxBracket[]
  annualTax: number
  monthlyPayment: number
}

export interface IFIData {
  taxableBase: number
  taxableAssets: IFIAsset[]
  nonTaxableAssets: IFIAsset[]
  deductibleLiabilities: number
  amount: number
  bracket: string
  optimizations: TaxOptimization[]
}

export interface FiscaliteData {
  ir: IRData
  ifi: IFIData
  simulations: TaxSimulation[]
}

// ============================================================================
// TabContrats Types
// ============================================================================

export interface Beneficiary {
  name: string
  percentage: number
  clause: string
}

export interface ContractFees {
  entryFee: number
  managementFee: number
  arbitrageFee: number
}

export interface Versement {
  date: string
  amount: number
  type: VersementType
}

export interface ContractTypeCount {
  type: ContractType
  count: number
  totalValue: number
}

export interface Contract {
  id: string
  type: ContractType
  provider: string
  name: string
  value: number
  beneficiaries: Beneficiary[]
  fees: ContractFees
  performance: number
  versements: Versement[]
  status: ContractStatus
  isManaged: boolean
  openDate: string
}

export interface ContractsSummary {
  totalValue: number
  managedCount: number
  nonManagedCount: number
  byType: ContractTypeCount[]
}

export interface ContratsData {
  contracts: Contract[]
  summary: ContractsSummary
}

// ============================================================================
// TabDocuments Types
// ============================================================================

export interface DocumentMetadata {
  certifiedAt: string
  certifiedBy: string
  hash: string
  size: number
}

export interface ComplianceDeclaration {
  type: string
  status: 'SIGNE' | 'EN_ATTENTE'
  date: string
}

export interface Document {
  id: string
  category: DocumentCategory
  type: string
  name: string
  status: DocumentStatus
  expirationDate?: string
  uploadDate: string
  metadata: DocumentMetadata
}

export interface KYCStatusInfo {
  overall: 'VALID' | 'EXPIRE' | 'INCOMPLETE'
  lastUpdate: string
  expiringDocuments: Document[]
}

export interface RiskProfileInfo {
  status: 'TERMINE' | 'EN_ATTENTE' | 'EXPIRE'
  score: number
  category: string
  lastAssessment: string
}

export interface ComplianceInfo {
  lcbFtStatus: 'COMPLIANT' | 'EN_ATTENTE' | 'NON_COMPLIANT'
  declarations: ComplianceDeclaration[]
}

export interface DocumentsData {
  documents: Document[]
  kycStatus: KYCStatusInfo
  riskProfile: RiskProfileInfo
  compliance: ComplianceInfo
}

// ============================================================================
// TabObjectifs Types
// ============================================================================

export interface Objective {
  id: string
  type: ObjectiveType
  title: string
  description: string
  targetAmount?: number
  targetDate?: string
  priority: ProjectPriority
  status: ObjectiveStatus
}

export interface Milestone {
  id: string
  title: string
  date: string
  isAchieved: boolean
}

export interface Risk {
  id: string
  description: string
  severity: RiskLevel
  mitigation?: string
}

export interface Project {
  id: string
  name: string
  objectiveId?: string
  budget: number
  deadline: string
  priority: ProjectPriority
  progress: number
  milestones: Milestone[]
  risks: Risk[]
  simulations: string[]
}

export interface TimelineEvent {
  id: string
  date: string
  title: string
  type: string
  description?: string
}

export interface ObjectifsData {
  objectives: Objective[]
  projects: Project[]
  timeline: TimelineEvent[]
}

// ============================================================================
// TabOpportunites Types
// ============================================================================

export interface OpportunityAnalysis {
  pros: string[]
  cons: string[]
  requirements: string[]
  timeline: string
  complexity: Complexity
}

export interface Opportunity {
  id: string
  category: OpportunityCategory
  title: string
  description: string
  potentialImpact: number
  relevanceScore: number
  matchedObjectives: string[]
  analysis: OpportunityAnalysis
  status: OpportunityStatus
}

export interface ObjectiveMatch {
  objectiveId: string
  objectiveTitle: string
  opportunityIds: string[]
  matchScore: number
}

export interface OpportunitesData {
  opportunities: Opportunity[]
  matchedObjectives: ObjectiveMatch[]
}

// ============================================================================
// TabActivites Types
// ============================================================================

export interface Activity {
  id: string
  type: ActivityType
  title: string
  description: string
  timestamp: string
  performedBy: string
  linkedDocuments: string[]
  metadata?: Record<string, unknown>
}

export interface ActivityFilter {
  types: string[]
  dateRange: { start: string; end: string }
  search: string
}

export interface ActivitesData {
  activities: Activity[]
  filters: ActivityFilter
}

// ============================================================================
// TabParametres Types
// ============================================================================

export interface BankAccount {
  id: string
  bankName: string
  accountType: string
  iban: string
  isMain: boolean
}

export interface AccessRight {
  advisorId: string
  advisorName: string
  role: AccessRole
  permissions: string[]
}

export interface NotificationSetting {
  type: string
  enabled: boolean
  channels: string[]
}

export interface SettingsPreferences {
  communication: CommunicationPreference
  reportingFrequency: ReportingFrequency
  language: string
}

export interface SettingsFiscalParams {
  taxYear: number
  regimeOptions: string[]
  selectedRegime: string
}

export interface SettingsPrivacy {
  dataConsent: boolean
  marketingConsent: boolean
  consentDate: string
}

export interface ParametresData {
  preferences: SettingsPreferences
  fiscalParams: SettingsFiscalParams
  bankAccounts: BankAccount[]
  accessRights: AccessRight[]
  notifications: NotificationSetting[]
  privacy: SettingsPrivacy
}

// ============================================================================
// Tab Props Interfaces
// ============================================================================

// Import and re-export ClientDetail from api-types to avoid duplication
import type { ClientDetail } from '@/app/_common/lib/api-types'
export type { ClientDetail } from '@/app/_common/lib/api-types'

export interface TabOverviewProps {
  clientId: string
  client: ClientDetail
}

export interface TabProfileProps {
  clientId: string
  client: ClientDetail
}

export interface TabPatrimoineProps {
  clientId: string
  client: ClientDetail
}

export interface TabBudgetProps {
  clientId: string
  client: ClientDetail
}

export interface TabFiscaliteProps {
  clientId: string
  client: ClientDetail
}

export interface TabContratsProps {
  clientId: string
  client: ClientDetail
}

export interface TabDocumentsProps {
  clientId: string
  client: ClientDetail
}

export interface TabObjectifsProps {
  clientId: string
  client: ClientDetail
}

export interface TabOpportunitesProps {
  clientId: string
  client: ClientDetail
}

export interface TabActivitesProps {
  clientId: string
  client: ClientDetail
}

export interface TabParametresProps {
  clientId: string
  client: ClientDetail
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateAssetRequest {
  name: string
  category: AssetCategory
  subCategory?: string
  value: number
  acquisitionDate?: string
  acquisitionValue?: number
  isManaged?: boolean
  details?: Record<string, unknown>
}

export interface UpdateAssetRequest extends Partial<CreateAssetRequest> {}

export interface CreateLiabilityRequest {
  name: string
  category: LiabilityCategory
  remainingAmount: number
  interestRate: number
  monthlyPayment: number
  endDate: string
  isManaged?: boolean
}

export interface UpdateLiabilityRequest extends Partial<CreateLiabilityRequest> {}

export interface CreateFamilyMemberRequest {
  role: FamilyRole
  firstName: string
  lastName: string
  birthDate?: string
  isFiscalDependent?: boolean
}

export interface UpdateFamilyMemberRequest extends Partial<CreateFamilyMemberRequest> {}

export interface CreateObjectiveRequest {
  type: ObjectiveType
  title: string
  description?: string
  targetAmount?: number
  targetDate?: string
  priority: ProjectPriority
}

export interface UpdateObjectiveRequest extends Partial<CreateObjectiveRequest> {
  status?: ObjectiveStatus
}

export interface CreateProjectRequest {
  name: string
  objectiveId?: string
  budget?: number
  deadline?: string
  priority?: ProjectPriority
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  progress?: number
}

export interface CreateActivityRequest {
  type: ActivityType
  title: string
  description?: string
  linkedDocuments?: string[]
  metadata?: Record<string, unknown>
}

export interface UpdateClientSettingsRequest {
  communication?: CommunicationPreference
  reportingFrequency?: ReportingFrequency
  language?: string
  taxYear?: number
  selectedRegime?: string
  bankAccounts?: BankAccount[]
  accessRights?: AccessRight[]
  notifications?: NotificationSetting[]
  dataConsent?: boolean
  marketingConsent?: boolean
}

// ============================================================================
// Utility Types
// ============================================================================

export type Client360Tab =
  | 'overview'
  | 'profile'
  | 'patrimoine'
  | 'budget'
  | 'fiscalite'
  | 'contrats'
  | 'documents'
  | 'objectifs'
  | 'opportunites'
  | 'activites'
  | 'parametres'

export interface Client360TabConfig {
  id: Client360Tab
  label: string
  icon: string
}

export const CLIENT360_TABS: Client360TabConfig[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: 'LayoutDashboard' },
  { id: 'profile', label: 'Profil & Famille', icon: 'User' },
  { id: 'patrimoine', label: 'Patrimoine', icon: 'Wallet' },
  { id: 'budget', label: 'Budget', icon: 'PiggyBank' },
  { id: 'fiscalite', label: 'Fiscalité', icon: 'Calculator' },
  { id: 'contrats', label: 'Contrats', icon: 'FileText' },
  { id: 'documents', label: 'Documents', icon: 'FolderOpen' },
  { id: 'objectifs', label: 'Objectifs', icon: 'Target' },
  { id: 'opportunites', label: 'Opportunités', icon: 'Lightbulb' },
  { id: 'activites', label: 'Activités', icon: 'History' },
  { id: 'parametres', label: 'Paramètres', icon: 'Settings' },
]
