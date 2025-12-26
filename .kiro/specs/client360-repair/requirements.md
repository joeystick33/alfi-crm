# Requirements Document

## Introduction

Ce document spécifie les exigences pour la réparation complète du module Client 360 du CRM Aura. Le Client 360 est la vue centrale permettant aux conseillers financiers de visualiser et gérer toutes les informations d'un client : patrimoine, budget, fiscalité, simulations, documents, etc.

Les problèmes actuels incluent :
- Tabs non fonctionnels (Budget, Fiscalité, Patrimoine)
- Graphiques disparus (Recharts non rendus)
- Simulations non affichées
- Données non chargées correctement depuis les APIs

## Glossary

- **Client 360**: Vue complète d'un client regroupant toutes ses informations patrimoniales, fiscales et budgétaires
- **TabBudget**: Onglet affichant les revenus, charges, métriques budgétaires et recommandations
- **TabWealth**: Onglet affichant le patrimoine (actifs, passifs, contrats)
- **TabTaxation**: Onglet affichant la fiscalité (IR, IFI, prélèvements sociaux, optimisations)
- **TabOverview**: Onglet synthèse avec KPIs et alertes prioritaires
- **SimulationHistory**: Composant affichant l'historique des simulations client
- **BudgetMetrics**: Métriques calculées (revenus, charges, capacité épargne, taux épargne)
- **WealthSummary**: Résumé patrimonial (total actifs, passifs, patrimoine net, taux endettement)
- **Recharts**: Bibliothèque de graphiques React utilisée pour les visualisations

## Requirements

### Requirement 1

**User Story:** As a financial advisor, I want to view the Budget tab with all charts and metrics, so that I can analyze my client's financial situation.

#### Acceptance Criteria

1. WHEN the advisor opens the Budget tab THEN the System SHALL display the monthly income and expenses bar chart using Recharts
2. WHEN the advisor opens the Budget tab THEN the System SHALL display the expense distribution pie chart with category breakdown
3. WHEN budget data exists THEN the System SHALL display four KPI cards (annual income, annual expenses, savings capacity, savings rate)
4. WHEN budget alerts exist THEN the System SHALL display them with appropriate severity styling (CRITICAL, WARNING, INFO)
5. WHEN the advisor clicks "Modifier" THEN the System SHALL enable editing mode for budget data
6. WHEN the advisor saves budget changes THEN the System SHALL persist data and recalculate metrics

### Requirement 2

**User Story:** As a financial advisor, I want to view the Wealth tab with complete asset and liability information, so that I can understand my client's net worth.

#### Acceptance Criteria

1. WHEN the advisor opens the Wealth tab THEN the System SHALL display the BentoGrid with KPI cards (Total Assets, Total Liabilities, Net Worth, Debt Ratio)
2. WHEN the advisor opens the Wealth tab THEN the System SHALL display advanced metrics (liquidity ratio, managed assets, leveraged assets)
3. WHEN assets exist THEN the System SHALL display them in a sortable list with value, type, and acquisition date
4. WHEN liabilities exist THEN the System SHALL display them with remaining amount, interest rate, and monthly payment
5. WHEN contracts exist THEN the System SHALL display them in a DataTable with type, provider, value, and status
6. WHEN the advisor clicks "Recalculer" THEN the System SHALL trigger wealth recalculation via API

### Requirement 3

**User Story:** As a financial advisor, I want to view the Taxation tab with IR, IFI calculations and optimizations, so that I can advise my client on tax matters.

#### Acceptance Criteria

1. WHEN the advisor opens the Taxation tab THEN the System SHALL display KPI cards for IR, IFI, and social contributions
2. WHEN IR data exists THEN the System SHALL display the progressive tax bracket visualization with current bracket highlighted
3. WHEN IR data exists THEN the System SHALL display the IR breakdown pie chart (gross IR, credits, reductions, net IR)
4. WHEN IFI data exists THEN the System SHALL display the IFI calculation with taxable assets, deductible liabilities, and amount due
5. WHEN tax optimizations exist THEN the System SHALL display them with priority, status, and potential savings
6. WHEN the advisor clicks "Calculer" THEN the System SHALL trigger tax calculation via API

### Requirement 4

**User Story:** As a financial advisor, I want to view the Overview tab with synthesis and alerts, so that I can quickly assess my client's situation.

#### Acceptance Criteria

1. WHEN the advisor opens the Overview tab THEN the System SHALL display four KPI cards (Total Assets, Total Liabilities, Net Worth, Debt Ratio)
2. WHEN allocation data exists THEN the System SHALL display allocation by type and category with progress bars
3. WHEN KYC status is EXPIRED THEN the System SHALL display a critical alert with "Urgent" badge
4. WHEN KYC status is PENDING THEN the System SHALL display a warning alert with "À faire" badge
5. WHEN timeline events exist THEN the System SHALL display the 5 most recent events

### Requirement 5

**User Story:** As a financial advisor, I want to view the simulation history for a client, so that I can track past analyses and share them.

#### Acceptance Criteria

1. WHEN the advisor opens the Overview tab THEN the System SHALL display the SimulationHistory component
2. WHEN simulations exist THEN the System SHALL display them with type icon, name, status badge, and creation date
3. WHEN a simulation has a feasibility score THEN the System SHALL display it
4. WHEN the advisor clicks "Partager" THEN the System SHALL share the simulation with the client
5. WHEN the advisor clicks "Archiver" THEN the System SHALL archive the simulation

### Requirement 6

**User Story:** As a financial advisor, I want all API endpoints to return proper data, so that the UI components can render correctly.

#### Acceptance Criteria

1. WHEN the Budget API is called THEN the System SHALL return budget data with professionalIncome, assetIncome, spouseIncome, and monthlyExpenses
2. WHEN the Budget Metrics API is called THEN the System SHALL return metrics, alerts, and recommendations
3. WHEN the Taxation API is called THEN the System SHALL return taxation data with incomeTax, ifi, and socialContributions
4. WHEN the Wealth API is called THEN the System SHALL return wealth summary with totalActifs, totalPassifs, patrimoineNet, and allocations
5. WHEN the Simulations API is called THEN the System SHALL return simulation list with type, status, and createdBy

### Requirement 7

**User Story:** As a financial advisor, I want Recharts components to render properly, so that I can visualize data graphically.

#### Acceptance Criteria

1. WHEN rendering a BarChart THEN the System SHALL display bars with proper colors and tooltips
2. WHEN rendering a PieChart THEN the System SHALL display slices with labels and proper colors
3. WHEN rendering charts THEN the System SHALL use ResponsiveContainer for proper sizing
4. WHEN chart data is empty THEN the System SHALL display a placeholder message instead of an empty chart
5. WHEN hovering over chart elements THEN the System SHALL display formatted tooltips with currency values
