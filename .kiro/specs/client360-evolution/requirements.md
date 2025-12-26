# Requirements Document

## Introduction

Ce document spécifie les exigences pour l'évolution majeure du module Client 360 du CRM Aura, destiné aux Conseillers en Gestion de Patrimoine (CGP), family offices, cabinets de conseil financier et gestionnaires de fortune. L'objectif est de transformer le Client 360 en une interface métier complète, méticuleuse et orientée efficacité, permettant une gestion patrimoniale professionnelle.

Cette évolution inclut :
- Restructuration en 11 onglets optimisés avec fusion des redondances
- Interface mature avec composants concrets, graphiques dynamiques, filtres et tableaux
- Couverture complète : patrimoine, budget, fiscalité, contrats, conformité, objectifs, opportunités
- Actions de gestion complètes (CRUD, exports, simulations)

## Glossary

- **Client 360**: Vue centrale et exhaustive d'un client regroupant toutes ses informations patrimoniales, fiscales, budgétaires, contractuelles et réglementaires
- **CGP**: Conseiller en Gestion de Patrimoine
- **Patrimoine Net**: Total des actifs moins total des passifs
- **IFI**: Impôt sur la Fortune Immobilière
- **IR**: Impôt sur le Revenu
- **KYC**: Know Your Customer - processus de vérification d'identité client
- **MIFID**: Markets in Financial Instruments Directive - directive européenne sur les instruments financiers
- **LCB-FT**: Lutte Contre le Blanchiment et Financement du Terrorisme
- **PEA**: Plan d'Épargne en Actions
- **CTO**: Compte-Titres Ordinaire
- **PER**: Plan d'Épargne Retraite
- **SCPI**: Société Civile de Placement Immobilier
- **UC**: Unités de Compte (assurance-vie)
- **SCI**: Société Civile Immobilière
- **Régime Matrimonial**: Cadre juridique régissant les biens des époux

## Requirements

### Requirement 1: Vue d'ensemble

**User Story:** As a financial advisor, I want to see a comprehensive overview of my client's situation at a glance, so that I can quickly assess their global patrimony and identify priorities.

#### Acceptance Criteria

1. WHEN the advisor opens the Overview tab THEN the System SHALL display the total patrimony value (net and gross) with a donut chart showing global allocation
2. WHEN patrimony data exists THEN the System SHALL display an evolution chart showing patrimony changes over time (monthly/yearly toggle)
3. WHEN budget data exists THEN the System SHALL display a revenue vs expenses evolution chart
4. WHEN the advisor views the Overview THEN the System SHALL display key indicators: current taxation, taxable income, active contracts count, risk level, and priority objectives
5. WHEN alerts exist THEN the System SHALL display intelligent notifications with severity levels (CRITICAL, WARNING, INFO) and actionable links
6. WHEN the advisor clicks on any KPI card THEN the System SHALL navigate to the corresponding detailed tab

### Requirement 2: Profil & Famille

**User Story:** As a financial advisor, I want to manage my client's complete civil and family profile, so that I can understand their personal situation and fiscal implications.

#### Acceptance Criteria

1. WHEN the advisor opens the Profile tab THEN the System SHALL display identity information (name, birth date, nationality, contact details)
2. WHEN the advisor views the Profile tab THEN the System SHALL display the family structure with all members (spouse, children majors/minors, dependents)
3. WHEN family members exist THEN the System SHALL display each member with their role, birth date, and fiscal dependency status
4. WHEN the advisor views the Profile tab THEN the System SHALL display legal rights (matrimonial regime, professional status, SCI/holding structures)
5. WHEN family data exists THEN the System SHALL calculate and display fiscal shares automatically
6. WHEN the advisor modifies family structure THEN the System SHALL recalculate IFI taxable base automatically
7. WHEN the advisor clicks "Ajouter membre" THEN the System SHALL open a form to add a family member with role selection

### Requirement 3: Patrimoine - Actifs

**User Story:** As a financial advisor, I want to view and manage all client assets with detailed categorization, so that I can analyze their wealth composition.

#### Acceptance Criteria

1. WHEN the advisor opens the Patrimoine tab THEN the System SHALL display total assets value with breakdown by category
2. WHEN assets exist THEN the System SHALL categorize them into: Immobilier (résidence principale, locatif, commercial, SCPI), Financier (PEA, CTO, assurance-vie, fonds euros, UC), Professionnel, Autres (véhicules, œuvres)
3. WHEN the advisor views assets THEN the System SHALL display pie charts for: global category distribution, detailed real estate breakdown, detailed financial breakdown
4. WHEN financial assets exist THEN the System SHALL display a performance chart showing returns over time
5. WHEN the advisor clicks "Ajouter un actif" THEN the System SHALL open a form with category-specific fields
6. WHEN the advisor modifies an asset THEN the System SHALL update all charts and calculations instantly
7. WHEN assets exist THEN the System SHALL display a "Géré par le cabinet / Non géré" indicator for each asset

### Requirement 4: Patrimoine - Passifs

**User Story:** As a financial advisor, I want to view and manage all client liabilities, so that I can understand their debt situation.

#### Acceptance Criteria

1. WHEN the advisor opens the Passifs section THEN the System SHALL display total liabilities with breakdown by type
2. WHEN liabilities exist THEN the System SHALL categorize them into: crédits immobiliers, crédits consommation, dettes professionnelles
3. WHEN the advisor views liabilities THEN the System SHALL display remaining amount, interest rate, monthly payment, and end date for each
4. WHEN the advisor clicks "Ajouter un passif" THEN the System SHALL open a form with liability-specific fields
5. WHEN liabilities exist THEN the System SHALL display a "Géré par le cabinet / Non géré" indicator for each liability

### Requirement 5: Patrimoine - Reporting

**User Story:** As a financial advisor, I want to generate comprehensive patrimony reports, so that I can share professional documentation with my client.

#### Acceptance Criteria

1. WHEN the advisor clicks "Générer rapport" THEN the System SHALL create a complete patrimony report with all assets, liabilities, and allocations
2. WHEN generating a report THEN the System SHALL include evolution charts and summary tables
3. WHEN the advisor clicks "Exporter PDF" THEN the System SHALL generate a formatted PDF document
4. WHEN the advisor clicks "Exporter Excel" THEN the System SHALL generate an Excel file with detailed data tables

### Requirement 6: Budget & Flux Financiers

**User Story:** As a financial advisor, I want to manage my client's complete budget with projections, so that I can analyze their cash flow situation.

#### Acceptance Criteria

1. WHEN the advisor opens the Budget tab THEN the System SHALL display recurring and one-time revenues with categorization
2. WHEN the advisor views the Budget tab THEN the System SHALL display fixed and variable expenses with categorization
3. WHEN budget data exists THEN the System SHALL calculate and display monthly and annual balances
4. WHEN the advisor views the Budget tab THEN the System SHALL display a future projection chart (12-month forecast)
5. WHEN budget data exists THEN the System SHALL display evolution charts showing income/expense trends
6. WHEN budget alerts exist THEN the System SHALL display warnings for surplus, deficit, or risk situations
7. WHEN the advisor modifies budget items THEN the System SHALL recalculate all metrics and projections instantly

### Requirement 7: Fiscalité - IR

**User Story:** As a financial advisor, I want to analyze my client's income tax situation with simulations, so that I can provide tax optimization advice.

#### Acceptance Criteria

1. WHEN the advisor opens the Fiscalité tab THEN the System SHALL display taxable income with all revenue sources
2. WHEN IR data exists THEN the System SHALL display deductible charges and their impact
3. WHEN IR data exists THEN the System SHALL display the marginal tax rate with bracket visualization
4. WHEN the advisor clicks "Simuler" THEN the System SHALL calculate projected IR based on current data
5. WHEN simulation results exist THEN the System SHALL display comparison between current and simulated scenarios

### Requirement 8: Fiscalité - IFI

**User Story:** As a financial advisor, I want to analyze my client's wealth tax situation, so that I can identify optimization opportunities.

#### Acceptance Criteria

1. WHEN the advisor opens the IFI section THEN the System SHALL display the taxable base calculated from real estate assets
2. WHEN IFI data exists THEN the System SHALL distinguish between IFI-taxable and non-IFI assets
3. WHEN the advisor clicks "Simuler IFI" THEN the System SHALL calculate the IFI amount due
4. WHEN IFI simulation exists THEN the System SHALL display possible optimizations with potential savings

### Requirement 9: Contrats

**User Story:** As a financial advisor, I want to manage all client contracts with detailed characteristics, so that I can track their financial products.

#### Acceptance Criteria

1. WHEN the advisor opens the Contrats tab THEN the System SHALL display all contracts categorized by type: Assurance-vie, Retraite (PER, Madelin), Prévoyance, Bancaires
2. WHEN contracts exist THEN the System SHALL display detailed characteristics: provider, value, beneficiaries, fees, performance
3. WHEN contracts exist THEN the System SHALL display a dashboard showing managed vs non-managed contracts
4. WHEN the advisor clicks "Ajouter contrat" THEN the System SHALL open a form with contract-type-specific fields
5. WHEN the advisor clicks on a contract THEN the System SHALL display full details including versements history
6. WHEN the advisor clicks "Clôturer" or "Transférer" THEN the System SHALL initiate the corresponding workflow

### Requirement 10: Documents & Conformité

**User Story:** As a financial advisor, I want to manage all client documents and compliance requirements in one place, so that I can ensure regulatory compliance.

#### Acceptance Criteria

1. WHEN the advisor opens the Documents tab THEN the System SHALL display KYC documents with status (valid, expired, missing)
2. WHEN documents exist THEN the System SHALL categorize them: identity documents, patrimony justifications, risk profile (MIFID), compliance declarations (LCB-FT)
3. WHEN documents have expiration dates THEN the System SHALL display alerts for upcoming expirations
4. WHEN the advisor uploads a document THEN the System SHALL store it with certified archiving metadata
5. WHEN the advisor views the Documents tab THEN the System SHALL display the client's risk profile questionnaire status and score

### Requirement 11: Objectifs & Projets

**User Story:** As a financial advisor, I want to track my client's financial objectives and projects, so that I can align recommendations with their goals.

#### Acceptance Criteria

1. WHEN the advisor opens the Objectifs tab THEN the System SHALL display personal objectives (retirement, secondary residence, transmission)
2. WHEN projects exist THEN the System SHALL display them with budget, deadlines, and priorities
3. WHEN the advisor views a project THEN the System SHALL display financial simulations linked to it
4. WHEN projects exist THEN the System SHALL display a timeline visualization with milestones
5. WHEN the advisor views a project THEN the System SHALL display progress percentage, milestones achieved, and identified risks

### Requirement 12: Opportunités

**User Story:** As a financial advisor, I want to see contextual recommendations and opportunities for my client, so that I can provide proactive advice.

#### Acceptance Criteria

1. WHEN the advisor opens the Opportunités tab THEN the System SHALL display contextualized recommendations based on client profile
2. WHEN opportunities exist THEN the System SHALL categorize them: fiscal opportunities, investment opportunities, patrimony reorganization opportunities
3. WHEN opportunities exist THEN the System SHALL display automatic matching with client objectives
4. WHEN the advisor clicks on an opportunity THEN the System SHALL display detailed analysis with potential impact

### Requirement 13: Activités & Historique

**User Story:** As a financial advisor, I want to track all interactions and actions on a client file, so that I can maintain a complete audit trail.

#### Acceptance Criteria

1. WHEN the advisor opens the Activités tab THEN the System SHALL display interaction history (calls, emails, meetings)
2. WHEN activities exist THEN the System SHALL display actions performed on the file with timestamps
3. WHEN activities exist THEN the System SHALL display financial and fiscal logs
4. WHEN the advisor views activities THEN the System SHALL display a chronological timeline with filtering options
5. WHEN the advisor adds an activity THEN the System SHALL record it with type, description, and linked documents

### Requirement 14: Paramètres

**User Story:** As a financial advisor, I want to configure client-specific settings, so that I can customize the client experience and access controls.

#### Acceptance Criteria

1. WHEN the advisor opens the Paramètres tab THEN the System SHALL display client preferences (communication, reporting frequency)
2. WHEN the advisor views Paramètres THEN the System SHALL display fiscal parameters (tax year, regime options)
3. WHEN the advisor views Paramètres THEN the System SHALL display linked bank accounts
4. WHEN multiple advisors exist THEN the System SHALL display access rights configuration (multi-advisor)
5. WHEN the advisor modifies notification settings THEN the System SHALL update alert preferences
6. WHEN the advisor views Paramètres THEN the System SHALL display privacy preferences and consent status

### Requirement 15: Navigation et UX

**User Story:** As a financial advisor, I want seamless navigation between all Client 360 sections, so that I can work efficiently.

#### Acceptance Criteria

1. WHEN the advisor navigates between tabs THEN the System SHALL preserve scroll position and filter states
2. WHEN data is loading THEN the System SHALL display skeleton loaders maintaining layout stability
3. WHEN the advisor performs bulk actions THEN the System SHALL display progress indicators
4. WHEN errors occur THEN the System SHALL display contextual error messages with recovery options
5. WHEN the advisor uses keyboard shortcuts THEN the System SHALL support tab navigation and common actions
