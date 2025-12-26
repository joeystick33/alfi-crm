# Design Document - Client 360 Evolution

## Overview

Ce document décrit la conception technique pour l'évolution majeure du module Client 360, transformant l'interface existante en un outil métier complet pour CGP. L'architecture est conçue pour supporter 11 onglets optimisés avec des fonctionnalités de gestion patrimoniale professionnelle.

### Objectifs Clés
- Interface mature avec composants concrets, graphiques dynamiques, filtres et tableaux
- Couverture complète du cycle de vie client CGP
- Performance optimale avec lazy loading et caching
- Conformité réglementaire intégrée (KYC, MIFID, LCB-FT)

## Architecture

```mermaid
graph TB
    subgraph "Client 360 Page"
        C360[Client360Container]
        TabNav[TabNavigation]
    end
    
    subgraph "Onglets Principaux"
        T1[TabOverview]
        T2[TabProfile]
        T3[TabPatrimoine]
        T4[TabBudget]
        T5[TabFiscalite]
        T6[TabContrats]
        T7[TabDocuments]
        T8[TabObjectifs]
        T9[TabOpportunites]
        T10[TabActivites]
        T11[TabParametres]
    end
    
    subgraph "Services Layer"
        PS[PatrimoineService]
        BS[BudgetService]
        TS[TaxService]
        CS[ContractService]
        DS[DocumentService]
        OS[OpportunityService]
        AS[ActivityService]
    end
    
    subgraph "API Routes"
        API1[/api/advisor/clients/[id]/overview]
        API2[/api/advisor/clients/[id]/profile]
        API3[/api/advisor/clients/[id]/patrimoine]
        API4[/api/advisor/clients/[id]/budget]
        API5[/api/advisor/clients/[id]/taxation]
        API6[/api/advisor/clients/[id]/contracts]
        API7[/api/advisor/clients/[id]/documents]
        API8[/api/advisor/clients/[id]/objectives]
        API9[/api/advisor/clients/[id]/opportunities]
        API10[/api/advisor/clients/[id]/activities]
        API11[/api/advisor/clients/[id]/settings]
    end
    
    C360 --> TabNav
    TabNav --> T1 & T2 & T3 & T4 & T5 & T6 & T7 & T8 & T9 & T10 & T11
    
    T1 --> API1
    T2 --> API2
    T3 --> API3
    T4 --> API4
    T5 --> API5
    T6 --> API6
    T7 --> API7
    T8 --> API8
    T9 --> API9
    T10 --> API10
    T11 --> API11
    
    API3 --> PS
    API4 --> BS
    API5 --> TS
    API6 --> CS
    API7 --> DS
    API9 --> OS
    API10 --> AS
```

## Components and Interfaces

### TabOverview Component

```typescript
interface TabOverviewProps {
  clientId: string
  client: ClientDetail
}

interface OverviewData {
  patrimony: {
    totalGross: number
    totalNet: number
    allocation: AllocationItem[]
    evolution: EvolutionPoint[]
  }
  indicators: {
    currentTaxation: number
    taxableIncome: number
    activeContractsCount: number
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    priorityObjectives: string[]
  }
  alerts: Alert[]
  recentActivities: Activity[]
}

interface AllocationItem {
  category: string
  value: number
  percentage: number
  color: string
}

interface EvolutionPoint {
  date: string
  value: number
}

interface Alert {
  id: string
  type: 'CRITICAL' | 'WARNING' | 'INFO'
  title: string
  message: string
  actionLink?: string
  actionLabel?: string
}
```

### TabProfile Component

```typescript
interface TabProfileProps {
  clientId: string
  client: ClientDetail
}

interface ProfileData {
  identity: {
    firstName: string
    lastName: string
    birthDate: string
    nationality: string
    email: string
    phone: string
    address: Address
  }
  family: FamilyMember[]
  legalRights: {
    matrimonialRegime: string
    professionalStatus: string
    structures: LegalStructure[]
  }
  fiscalInfo: {
    fiscalShares: number
    fiscalHousehold: string
  }
}

interface FamilyMember {
  id: string
  role: 'SPOUSE' | 'CHILD_MAJOR' | 'CHILD_MINOR' | 'DEPENDENT'
  firstName: string
  lastName: string
  birthDate: string
  isFiscalDependent: boolean
}

interface LegalStructure {
  type: 'SCI' | 'HOLDING' | 'SARL' | 'SAS'
  name: string
  ownership: number
}
```

### TabPatrimoine Component

```typescript
interface TabPatrimoineProps {
  clientId: string
  client: ClientDetail
}

interface PatrimoineData {
  summary: {
    totalAssets: number
    totalLiabilities: number
    netWorth: number
    debtRatio: number
  }
  assets: Asset[]
  liabilities: Liability[]
  allocations: {
    byCategory: AllocationItem[]
    realEstateDetail: AllocationItem[]
    financialDetail: AllocationItem[]
  }
  performance: PerformancePoint[]
}

interface Asset {
  id: string
  name: string
  category: 'IMMOBILIER' | 'FINANCIER' | 'PROFESSIONNEL' | 'AUTRES'
  subCategory: string
  value: number
  acquisitionDate: string
  acquisitionValue: number
  isManaged: boolean
  details: Record<string, unknown>
}

interface Liability {
  id: string
  name: string
  category: 'CREDIT_IMMO' | 'CREDIT_CONSO' | 'DETTE_PRO'
  remainingAmount: number
  interestRate: number
  monthlyPayment: number
  endDate: string
  isManaged: boolean
}

interface PerformancePoint {
  date: string
  return: number
  benchmark?: number
}
```

### TabBudget Component

```typescript
interface TabBudgetProps {
  clientId: string
  client: ClientDetail
}

interface BudgetData {
  revenues: {
    recurring: RevenueItem[]
    oneTime: RevenueItem[]
    totalMonthly: number
    totalAnnual: number
  }
  expenses: {
    fixed: ExpenseItem[]
    variable: ExpenseItem[]
    totalMonthly: number
    totalAnnual: number
  }
  balance: {
    monthly: number
    annual: number
    savingsRate: number
  }
  projection: ProjectionPoint[]
  alerts: BudgetAlert[]
}

interface RevenueItem {
  id: string
  category: string
  label: string
  amount: number
  frequency: 'MONTHLY' | 'ANNUAL' | 'ONE_TIME'
}

interface ExpenseItem {
  id: string
  category: string
  label: string
  amount: number
  isFixed: boolean
}

interface ProjectionPoint {
  month: string
  projectedBalance: number
  projectedRevenue: number
  projectedExpense: number
}

interface BudgetAlert {
  type: 'SURPLUS' | 'DEFICIT' | 'RISK'
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  message: string
  threshold?: number
}
```

### TabFiscalite Component

```typescript
interface TabFiscaliteProps {
  clientId: string
  client: ClientDetail
}

interface FiscaliteData {
  ir: {
    taxableIncome: number
    revenueSources: RevenueSource[]
    deductibleCharges: DeductibleCharge[]
    fiscalShares: number
    marginalRate: number
    brackets: TaxBracket[]
    annualTax: number
    monthlyPayment: number
  }
  ifi: {
    taxableBase: number
    taxableAssets: IFIAsset[]
    nonTaxableAssets: IFIAsset[]
    deductibleLiabilities: number
    amount: number
    bracket: string
    optimizations: Optimization[]
  }
  simulations: TaxSimulation[]
}

interface TaxBracket {
  min: number
  max: number
  rate: number
  isCurrentBracket: boolean
}

interface IFIAsset {
  id: string
  name: string
  value: number
  isTaxable: boolean
  reason?: string
}

interface Optimization {
  id: string
  type: string
  description: string
  potentialSavings: number
  complexity: 'LOW' | 'MEDIUM' | 'HIGH'
}

interface TaxSimulation {
  id: string
  name: string
  scenario: string
  currentTax: number
  simulatedTax: number
  delta: number
  createdAt: string
}
```

### TabContrats Component

```typescript
interface TabContratsProps {
  clientId: string
  client: ClientDetail
}

interface ContratsData {
  contracts: Contract[]
  summary: {
    totalValue: number
    managedCount: number
    nonManagedCount: number
    byType: ContractTypeCount[]
  }
}

interface Contract {
  id: string
  type: 'ASSURANCE_VIE' | 'PER' | 'MADELIN' | 'PREVOYANCE' | 'BANCAIRE'
  provider: string
  name: string
  value: number
  beneficiaries: Beneficiary[]
  fees: ContractFees
  performance: number
  versements: Versement[]
  status: 'ACTIVE' | 'CLOSED' | 'TRANSFERRED'
  isManaged: boolean
  openDate: string
}

interface Beneficiary {
  name: string
  percentage: number
  clause: string
}

interface ContractFees {
  entryFee: number
  managementFee: number
  arbitrageFee: number
}

interface Versement {
  date: string
  amount: number
  type: 'INITIAL' | 'SCHEDULED' | 'EXCEPTIONAL'
}
```

### TabDocuments Component

```typescript
interface TabDocumentsProps {
  clientId: string
  client: ClientDetail
}

interface DocumentsData {
  documents: Document[]
  kycStatus: {
    overall: 'VALID' | 'EXPIRED' | 'INCOMPLETE'
    lastUpdate: string
    expiringDocuments: Document[]
  }
  riskProfile: {
    status: 'COMPLETED' | 'PENDING' | 'EXPIRED'
    score: number
    category: string
    lastAssessment: string
  }
  compliance: {
    lcbFtStatus: 'COMPLIANT' | 'PENDING' | 'NON_COMPLIANT'
    declarations: ComplianceDeclaration[]
  }
}

interface Document {
  id: string
  category: 'IDENTITY' | 'PATRIMONY' | 'RISK_PROFILE' | 'COMPLIANCE'
  type: string
  name: string
  status: 'VALID' | 'EXPIRED' | 'MISSING'
  expirationDate?: string
  uploadDate: string
  metadata: DocumentMetadata
}

interface DocumentMetadata {
  certifiedAt: string
  certifiedBy: string
  hash: string
  size: number
}

interface ComplianceDeclaration {
  type: string
  status: 'SIGNED' | 'PENDING'
  date: string
}
```

### TabObjectifs Component

```typescript
interface TabObjectifsProps {
  clientId: string
  client: ClientDetail
}

interface ObjectifsData {
  objectives: Objective[]
  projects: Project[]
  timeline: TimelineEvent[]
}

interface Objective {
  id: string
  type: 'RETIREMENT' | 'REAL_ESTATE' | 'TRANSMISSION' | 'EDUCATION' | 'OTHER'
  title: string
  description: string
  targetAmount?: number
  targetDate?: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  status: 'ACTIVE' | 'ACHIEVED' | 'ABANDONED'
}

interface Project {
  id: string
  name: string
  objectiveId?: string
  budget: number
  deadline: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  progress: number
  milestones: Milestone[]
  risks: Risk[]
  simulations: string[]
}

interface Milestone {
  id: string
  title: string
  date: string
  isAchieved: boolean
}

interface Risk {
  id: string
  description: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  mitigation?: string
}
```

### TabOpportunites Component

```typescript
interface TabOpportunitesProps {
  clientId: string
  client: ClientDetail
}

interface OpportunitesData {
  opportunities: Opportunity[]
  matchedObjectives: ObjectiveMatch[]
}

interface Opportunity {
  id: string
  category: 'FISCAL' | 'INVESTMENT' | 'REORGANIZATION'
  title: string
  description: string
  potentialImpact: number
  relevanceScore: number
  matchedObjectives: string[]
  analysis: OpportunityAnalysis
  status: 'NEW' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED'
}

interface OpportunityAnalysis {
  pros: string[]
  cons: string[]
  requirements: string[]
  timeline: string
  complexity: 'LOW' | 'MEDIUM' | 'HIGH'
}

interface ObjectiveMatch {
  objectiveId: string
  objectiveTitle: string
  opportunityIds: string[]
  matchScore: number
}
```

### TabActivites Component

```typescript
interface TabActivitesProps {
  clientId: string
  client: ClientDetail
}

interface ActivitesData {
  activities: Activity[]
  filters: ActivityFilter
}

interface Activity {
  id: string
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'ACTION' | 'LOG'
  title: string
  description: string
  timestamp: string
  performedBy: string
  linkedDocuments: string[]
  metadata?: Record<string, unknown>
}

interface ActivityFilter {
  types: string[]
  dateRange: { start: string; end: string }
  search: string
}
```

### TabParametres Component

```typescript
interface TabParametresProps {
  clientId: string
  client: ClientDetail
}

interface ParametresData {
  preferences: {
    communication: 'EMAIL' | 'PHONE' | 'BOTH'
    reportingFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
    language: string
  }
  fiscalParams: {
    taxYear: number
    regimeOptions: string[]
    selectedRegime: string
  }
  bankAccounts: BankAccount[]
  accessRights: AccessRight[]
  notifications: NotificationSetting[]
  privacy: {
    dataConsent: boolean
    marketingConsent: boolean
    consentDate: string
  }
}

interface BankAccount {
  id: string
  bankName: string
  accountType: string
  iban: string
  isMain: boolean
}

interface AccessRight {
  advisorId: string
  advisorName: string
  role: 'OWNER' | 'EDITOR' | 'VIEWER'
  permissions: string[]
}

interface NotificationSetting {
  type: string
  enabled: boolean
  channels: string[]
}
```

## Data Models

### Extended Client Model (Prisma)

```prisma
model Client {
  id                String   @id @default(cuid())
  // Identity
  firstName         String
  lastName          String
  email             String   @unique
  phone             String?
  birthDate         DateTime?
  nationality       String?
  address           Json?
  
  // Family & Legal
  familyMembers     FamilyMember[]
  matrimonialRegime String?
  professionalStatus String?
  legalStructures   Json?
  
  // Relations
  assets            Asset[]
  liabilities       Liability[]
  contracts         Contract[]
  documents         Document[]
  objectives        Objective[]
  projects          Project[]
  opportunities     Opportunity[]
  activities        Activity[]
  budget            ClientBudget?
  taxation          ClientTaxation?
  settings          ClientSettings?
  
  // Metadata
  organizationId    String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model FamilyMember {
  id               String   @id @default(cuid())
  clientId         String
  client           Client   @relation(fields: [clientId], references: [id])
  role             String   // SPOUSE, CHILD_MAJOR, CHILD_MINOR, DEPENDENT
  firstName        String
  lastName         String
  birthDate        DateTime?
  isFiscalDependent Boolean @default(false)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model Asset {
  id              String   @id @default(cuid())
  clientId        String
  client          Client   @relation(fields: [clientId], references: [id])
  name            String
  category        String   // IMMOBILIER, FINANCIER, PROFESSIONNEL, AUTRES
  subCategory     String?
  value           Decimal
  acquisitionDate DateTime?
  acquisitionValue Decimal?
  isManaged       Boolean  @default(false)
  details         Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Liability {
  id              String   @id @default(cuid())
  clientId        String
  client          Client   @relation(fields: [clientId], references: [id])
  name            String
  category        String   // CREDIT_IMMO, CREDIT_CONSO, DETTE_PRO
  remainingAmount Decimal
  interestRate    Decimal?
  monthlyPayment  Decimal?
  endDate         DateTime?
  isManaged       Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Contract {
  id            String   @id @default(cuid())
  clientId      String
  client        Client   @relation(fields: [clientId], references: [id])
  type          String   // ASSURANCE_VIE, PER, MADELIN, PREVOYANCE, BANCAIRE
  provider      String
  name          String
  value         Decimal
  beneficiaries Json?
  fees          Json?
  performance   Decimal?
  versements    Json?
  status        String   @default("ACTIVE")
  isManaged     Boolean  @default(false)
  openDate      DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Objective {
  id          String   @id @default(cuid())
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id])
  type        String   // RETIREMENT, REAL_ESTATE, TRANSMISSION, EDUCATION, OTHER
  title       String
  description String?
  targetAmount Decimal?
  targetDate  DateTime?
  priority    String   @default("MEDIUM")
  status      String   @default("ACTIVE")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Project {
  id          String   @id @default(cuid())
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id])
  objectiveId String?
  name        String
  budget      Decimal?
  deadline    DateTime?
  priority    String   @default("MEDIUM")
  progress    Int      @default(0)
  milestones  Json?
  risks       Json?
  simulations Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Opportunity {
  id              String   @id @default(cuid())
  clientId        String
  client          Client   @relation(fields: [clientId], references: [id])
  category        String   // FISCAL, INVESTMENT, REORGANIZATION
  title           String
  description     String?
  potentialImpact Decimal?
  relevanceScore  Int?
  matchedObjectives Json?
  analysis        Json?
  status          String   @default("NEW")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Activity {
  id              String   @id @default(cuid())
  clientId        String
  client          Client   @relation(fields: [clientId], references: [id])
  type            String   // CALL, EMAIL, MEETING, ACTION, LOG
  title           String
  description     String?
  performedBy     String?
  linkedDocuments Json?
  metadata        Json?
  timestamp       DateTime @default(now())
  createdAt       DateTime @default(now())
}

model ClientSettings {
  id                  String   @id @default(cuid())
  clientId            String   @unique
  client              Client   @relation(fields: [clientId], references: [id])
  communication       String   @default("EMAIL")
  reportingFrequency  String   @default("QUARTERLY")
  language            String   @default("fr")
  taxYear             Int?
  selectedRegime      String?
  bankAccounts        Json?
  accessRights        Json?
  notifications       Json?
  dataConsent         Boolean  @default(false)
  marketingConsent    Boolean  @default(false)
  consentDate         DateTime?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Allocation sum consistency
*For any* set of allocation items (assets by category, liabilities by type, or any breakdown), the sum of all item values SHALL equal the total value, and the sum of all percentages SHALL equal 100 (within floating point tolerance).
**Validates: Requirements 1.1, 3.1, 3.3, 4.1**

### Property 2: Entity categorization validity
*For any* entity with a category field (asset, liability, contract, document, opportunity, activity), the category value SHALL be one of the predefined valid values for that entity type.
**Validates: Requirements 3.2, 4.2, 9.1, 10.2, 12.2, 13.1**

### Property 3: Temporal data ordering
*For any* list of time-series data (evolution points, activities, projections), the items SHALL be sorted by date in the expected order (ascending for projections, descending for activities).
**Validates: Requirements 1.2, 1.3, 6.5, 13.4**

### Property 4: Entity completeness
*For any* entity with required fields (contract details, document metadata, project info, activity record), all required fields SHALL be present and non-null.
**Validates: Requirements 4.3, 9.2, 10.4, 11.2, 13.5**

### Property 5: Fiscal shares calculation
*For any* family structure with spouse and children, the fiscal shares SHALL be calculated according to French tax rules: 1 share per adult, 0.5 share per dependent child (first two), 1 share per additional dependent child.
**Validates: Requirements 2.5**

### Property 6: IFI taxable base calculation
*For any* set of real estate assets, the IFI taxable base SHALL equal the sum of values of assets marked as IFI-taxable, minus deductible liabilities related to those assets.
**Validates: Requirements 2.6, 8.1, 8.2**

### Property 7: Budget balance calculation
*For any* budget with revenues and expenses, the monthly balance SHALL equal (total monthly revenues - total monthly expenses), and the annual balance SHALL equal (monthly balance * 12) for recurring items plus one-time items.
**Validates: Requirements 6.3, 6.7**

### Property 8: Budget projection consistency
*For any* 12-month budget projection, each month's projected balance SHALL be calculated from projected revenues minus projected expenses, and the projection SHALL contain exactly 12 data points.
**Validates: Requirements 6.4**

### Property 9: IR calculation accuracy
*For any* taxable income and fiscal shares, the IR amount SHALL be calculated by applying French progressive tax brackets to (taxable income / fiscal shares), then multiplying by fiscal shares.
**Validates: Requirements 7.3, 7.4**

### Property 10: IFI calculation accuracy
*For any* IFI taxable base above the threshold (1.3M€), the IFI amount SHALL be calculated by applying French IFI brackets to the taxable base.
**Validates: Requirements 8.3**

### Property 11: Contract managed status consistency
*For any* set of contracts, the count of managed contracts plus non-managed contracts SHALL equal the total contract count.
**Validates: Requirements 9.3**

### Property 12: Document expiration alerts
*For any* document with an expiration date within 30 days of current date, an expiration alert SHALL be generated.
**Validates: Requirements 10.3**

### Property 13: Project progress bounds
*For any* project, the progress percentage SHALL be between 0 and 100 inclusive, and milestones achieved count SHALL be less than or equal to total milestones count.
**Validates: Requirements 11.5**

### Property 14: Opportunity objective matching
*For any* opportunity with matched objectives, each matched objective ID SHALL exist in the client's objectives list.
**Validates: Requirements 12.3**

### Property 15: Alert severity ordering
*For any* list of alerts displayed to the user, CRITICAL alerts SHALL appear before WARNING alerts, and WARNING alerts SHALL appear before INFO alerts.
**Validates: Requirements 1.5**

### Property 16: Net worth calculation
*For any* client with assets and liabilities, the net worth SHALL equal (total assets - total liabilities), and the debt ratio SHALL equal (total liabilities / total assets * 100) when total assets > 0.
**Validates: Requirements 3.1, 4.1**

### Property 17: Managed status indicator presence
*For any* asset or liability, the isManaged field SHALL be present with a boolean value.
**Validates: Requirements 3.7, 4.5**

## Error Handling

### API Error Handling

| Error Type | HTTP Code | User Message | Recovery Action |
|------------|-----------|--------------|-----------------|
| Network Error | - | "Connexion impossible" | Retry button |
| Not Found | 404 | "Client non trouvé" | Redirect to list |
| Unauthorized | 401 | "Session expirée" | Redirect to login |
| Forbidden | 403 | "Accès non autorisé" | Display permission message |
| Validation Error | 400 | Field-specific messages | Highlight invalid fields |
| Server Error | 500 | "Erreur serveur" | Contact support link |

### Data Validation

1. **Missing Required Data**: Display contextual empty state with CTA to add data
2. **Invalid Calculations**: Log error, display "Calcul indisponible" with recalculate button
3. **Stale Data**: Display last update timestamp with refresh option
4. **Concurrent Edits**: Optimistic locking with conflict resolution dialog

## Testing Strategy

### Unit Testing

Unit tests will be written using Vitest to verify:
- Allocation calculation functions
- Tax calculation functions (IR, IFI)
- Budget balance and projection calculations
- Fiscal shares calculation
- Data transformation utilities
- Filter and sort logic

### Property-Based Testing

Property-based tests will be written using **fast-check** library to verify all 17 correctness properties:

Each property-based test will:
- Run a minimum of 100 iterations
- Use smart generators that constrain to valid input space
- Be tagged with format: `**Feature: client360-evolution, Property {number}: {property_text}**`
- Reference the requirements clause it validates

### Integration Testing

Integration tests will verify:
- API endpoints return correct data structure
- Tab components render correctly with mock data
- Navigation between tabs preserves state
- CRUD operations update UI correctly
- Export functions generate valid files

### E2E Testing

Playwright tests will verify:
- Complete user flows (view client → edit → save)
- Tab navigation and data loading
- Form submissions and validations
- Export functionality
