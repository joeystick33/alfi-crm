# Design Document - Client 360 Repair

## Overview

Ce document décrit la conception technique pour la réparation complète du module Client 360. L'objectif est de corriger tous les tabs non fonctionnels, restaurer les graphiques Recharts, et assurer le bon fonctionnement des APIs.

Le Client 360 est composé de plusieurs onglets :
- **Overview** : Synthèse avec KPIs et alertes
- **Budget** : Revenus, charges, métriques et recommandations
- **Wealth** : Patrimoine (actifs, passifs, contrats)
- **Taxation** : Fiscalité (IR, IFI, optimisations)
- **Simulations** : Historique des simulations

## Architecture

```mermaid
graph TB
    subgraph Frontend
        C360[Client360 Page]
        TO[TabOverview]
        TB[TabBudget]
        TW[TabWealth]
        TT[TabTaxation]
        SH[SimulationHistory]
    end
    
    subgraph APIs
        AB[/api/advisor/clients/[id]/budget]
        ABM[/api/advisor/clients/[id]/budget/metrics]
        AT[/api/advisor/clients/[id]/taxation]
        ATC[/api/advisor/clients/[id]/taxation/calculations]
        AW[/api/advisor/clients/[id]/wealth]
        AS[/api/advisor/simulations]
    end
    
    subgraph Services
        BS[BudgetService]
        TS[TaxService]
        WS[WealthService]
    end
    
    C360 --> TO
    C360 --> TB
    C360 --> TW
    C360 --> TT
    TO --> SH
    
    TB --> AB
    TB --> ABM
    TT --> AT
    TT --> ATC
    TW --> AW
    SH --> AS
    
    AB --> BS
    ABM --> BS
    AT --> TS
    ATC --> TS
    AW --> WS
```

## Components and Interfaces

### TabBudget Component

```typescript
interface TabBudgetProps {
  clientId: string
  client: ClientDetail
}

interface BudgetData {
  id?: string
  professionalIncome?: {
    netSalary: number
    selfEmployedIncome: number
    bonuses: number
    other: number
  }
  assetIncome?: {
    rentalIncome: number
    dividends: number
    interest: number
    capitalGains: number
  }
  spouseIncome?: {
    netSalary: number
    other: number
  }
  retirementPensions?: { total: number }
  allowances?: { total: number }
  monthlyExpenses?: {
    housing?: { total: number }
    utilities?: { total: number }
    food?: { total: number }
    transportation?: { total: number }
    insurance?: { total: number }
    leisure?: { total: number }
    health?: { total: number }
    education?: { total: number }
    loans?: { total: number }
    other?: { total: number }
  }
}

interface BudgetMetrics {
  revenusMensuels: number
  revenusAnnuels: number
  chargesMensuelles: number
  chargesAnnuelles: number
  capaciteEpargneMensuelle: number
  capaciteEpargneAnnuelle: number
  tauxEpargne: number
  epargneSecuriteMin: number
  epargneSecuriteMax: number
  resteAVivre: number
}
```

### TabWealth Component

```typescript
interface TabWealthProps {
  clientId: string
  client: ClientDetail
  wealth?: WealthSummary
}

interface WealthSummary {
  totalActifs: number
  totalPassifs: number
  patrimoineNet: number
  debtRatio: number
  lastCalculated: Date
  allocationByType: Array<{
    type: string
    value: number
    percentage: number
  }>
  allocationByCategory: Array<{
    category: string
    value: number
    percentage: number
  }>
}
```

### TabTaxation Component

```typescript
interface TabTaxationProps {
  clientId: string
  client: ClientDetail
}

interface TaxationData {
  id?: string
  anneeFiscale: number
  incomeTax?: {
    fiscalReferenceIncome: number
    taxShares: number
    quotientFamilial: number
    taxBracket: number
    annualAmount: number
    monthlyPayment: number
    taxCredits: number
    taxReductions: number
  }
  ifi?: {
    taxableRealEstateAssets: number
    deductibleLiabilities: number
    netTaxableIFI: number
    ifiAmount: number
    bracket: string
    threshold: number
  }
  socialContributions?: {
    taxableAssetIncome: number
    rate: number
    amount: number
  }
}
```

## Data Models

### ClientBudget (Prisma)

```prisma
model ClientBudget {
  id                  String   @id @default(cuid())
  clientId            String   @unique
  client              Client   @relation(fields: [clientId], references: [id])
  professionalIncome  Json?
  assetIncome         Json?
  spouseIncome        Json?
  retirementPensions  Json?
  allowances          Json?
  monthlyExpenses     Json?
  totalRevenue        Decimal?
  totalExpenses       Decimal?
  savingsCapacity     Decimal?
  savingsRate         Decimal?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}
```

### ClientTaxation (Prisma)

```prisma
model ClientTaxation {
  id                   String   @id @default(cuid())
  clientId             String   @unique
  client               Client   @relation(fields: [clientId], references: [id])
  anneeFiscale         Int
  incomeTax            Json?
  ifi                  Json?
  socialContributions  Json?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Budget metrics calculation consistency
*For any* valid budget data with income and expenses, the calculated savings capacity SHALL equal (total monthly income - total monthly expenses), and the savings rate SHALL equal (savings capacity / monthly income * 100).
**Validates: Requirements 1.3, 1.6**

### Property 2: Budget alert severity ordering
*For any* set of budget alerts, CRITICAL alerts SHALL appear before WARNING alerts, and WARNING alerts SHALL appear before INFO alerts.
**Validates: Requirements 1.4**

### Property 3: Expense pie chart data transformation
*For any* budget with monthly expenses, the pie chart data SHALL contain only categories with value > 0, and the sum of all slice values SHALL equal total monthly expenses.
**Validates: Requirements 1.2**

### Property 4: Wealth net worth calculation
*For any* client with assets and liabilities, the net worth SHALL equal (total assets - total liabilities), and the debt ratio SHALL equal (total liabilities / total assets * 100).
**Validates: Requirements 2.1, 4.1**

### Property 5: Asset sorting consistency
*For any* list of assets sorted by value, each asset's value SHALL be greater than or equal to the next asset's value in the list.
**Validates: Requirements 2.3**

### Property 6: Liquidity ratio calculation
*For any* set of assets, the liquidity ratio SHALL equal (liquid assets / total assets * 100), where liquid assets are those with type in ['SAVINGS', 'CHECKING', 'MONEY_MARKET'].
**Validates: Requirements 2.2**

### Property 7: Tax bracket highlighting
*For any* income tax data with a tax bracket, exactly one bracket in the visualization SHALL be highlighted, and it SHALL match the taxBracket value.
**Validates: Requirements 3.2**

### Property 8: IFI calculation consistency
*For any* IFI data, the net taxable IFI SHALL equal (taxable real estate assets - deductible liabilities).
**Validates: Requirements 3.4**

### Property 9: Tax optimization filtering
*For any* filter combination (status, priority), the filtered list SHALL contain only optimizations matching both criteria.
**Validates: Requirements 3.5**

### Property 10: KYC alert mapping
*For any* KYC status, the alert type SHALL be: EXPIRED → critical, PENDING → warning, COMPLETED → success.
**Validates: Requirements 4.3, 4.4**

### Property 11: Timeline event limiting
*For any* list of timeline events, the displayed list SHALL contain at most 5 events, sorted by creation date descending.
**Validates: Requirements 4.5**

### Property 12: Simulation status badge mapping
*For any* simulation status, the badge variant SHALL be: DRAFT → secondary, COMPLETED → success, SHARED → default, ARCHIVED → warning.
**Validates: Requirements 5.2**

### Property 13: Empty chart placeholder
*For any* chart component with empty data array, the component SHALL render a placeholder message instead of an empty chart.
**Validates: Requirements 7.4**

### Property 14: Currency tooltip formatting
*For any* numeric value in a chart tooltip, the formatted output SHALL match the French currency format (e.g., "1 234,56 €").
**Validates: Requirements 7.5**

## Error Handling

### API Error Handling

1. **Network Errors**: Display toast notification with retry option
2. **404 Not Found**: Return null data, display empty state in UI
3. **401 Unauthorized**: Redirect to login page
4. **500 Server Error**: Display error message with support contact

### Data Validation

1. **Missing Budget Data**: Display "Aucune donnée budgétaire" with CTA to add data
2. **Missing Taxation Data**: Display "Aucune donnée fiscale" with calculate button
3. **Empty Charts**: Display placeholder with icon and message
4. **Invalid Metrics**: Log error, display fallback values (0)

## Testing Strategy

### Unit Testing

Unit tests will be written using Vitest to verify:
- Budget metrics calculation functions
- Tax calculation functions
- Data transformation utilities
- Alert severity sorting
- Filter logic

### Property-Based Testing

Property-based tests will be written using **fast-check** library to verify:
- Budget metrics calculation consistency (Property 1)
- Expense pie chart data transformation (Property 3)
- Wealth net worth calculation (Property 4)
- Asset sorting consistency (Property 5)
- Liquidity ratio calculation (Property 6)
- Tax bracket highlighting (Property 7)
- IFI calculation consistency (Property 8)
- Tax optimization filtering (Property 9)
- KYC alert mapping (Property 10)
- Timeline event limiting (Property 11)
- Simulation status badge mapping (Property 12)
- Empty chart placeholder (Property 13)
- Currency tooltip formatting (Property 14)

Each property-based test will:
- Run a minimum of 100 iterations
- Use smart generators that constrain to valid input space
- Be tagged with the property number and requirements reference

### Integration Testing

Integration tests will verify:
- API endpoints return correct data structure
- Components render correctly with mock data
- User interactions trigger correct API calls
