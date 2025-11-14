# Requirements Document - CRM Frontend Complet

## Introduction

Ce document définit les exigences pour la création complète du frontend du CRM patrimonial ALFI. L'objectif est de créer une interface utilisateur moderne, intuitive et complète qui exploite pleinement le backend Prisma/PostgreSQL existant.

## Glossary

- **System**: L'application frontend du CRM ALFI
- **User**: Conseiller en gestion de patrimoine (CGP) utilisant le CRM
- **Client**: Client particulier ou professionnel géré dans le CRM
- **Vue 360°**: Interface complète affichant toutes les informations d'un client
- **GED**: Gestion Électronique des Documents
- **KYC**: Know Your Customer - Connaissance client réglementaire
- **MIF II**: Markets in Financial Instruments Directive - Directive européenne
- **RLS**: Row Level Security - Sécurité au niveau des lignes PostgreSQL
- **Multi-tenant**: Architecture permettant l'isolation des données par cabinet
- **Prisma Client**: Client TypeScript généré pour interagir avec PostgreSQL
- **API Route**: Route Next.js App Router pour les appels backend
- **Real Data**: Données réelles stockées dans PostgreSQL via Prisma (AUCUN MOCK autorisé)

## Requirements

### Requirement 1: Layout et Navigation

**User Story:** En tant que conseiller, je veux un dashboard avec une navigation claire et intuitive, afin d'accéder rapidement à toutes les fonctionnalités du CRM.

#### Acceptance Criteria

1.1 WHEN the user logs in, THE System SHALL display a dashboard layout with two sidebars (left navigation, right services)

1.2 WHEN the user hovers over the left sidebar, THE System SHALL expand it to show full menu labels and descriptions

1.3 WHEN the user clicks on a navigation item, THE System SHALL highlight the active item and navigate to the corresponding page

1.4 THE System SHALL display real-time counters for tasks, appointments, alerts, and opportunities in the navigation

1.5 WHEN the user presses Ctrl+K, THE System SHALL open a command palette for quick navigation

1.6 THE System SHALL provide a global search bar in the top header for searching clients, documents, and tasks

1.7 THE System SHALL display user profile information with logout option in the sidebar footer

### Requirement 2: Gestion des Clients

**User Story:** En tant que conseiller, je veux gérer mes clients particuliers et professionnels, afin de maintenir un portefeuille client organisé.

#### Acceptance Criteria

2.1 THE System SHALL display a paginated list of clients with filters for type (Particulier/Professionnel), status (Prospect/Actif/Inactif), and conseiller

2.2 WHEN the user clicks "Nouveau Client", THE System SHALL display a modal with client type selection (Particulier or Professionnel)

2.3 WHEN the user selects "Particulier", THE System SHALL display a form with personal information fields (firstName, lastName, email, phone, birthDate, maritalStatus, profession, annualIncome)

2.4 WHEN the user selects "Professionnel", THE System SHALL display additional fields (companyName, siret, legalForm, activitySector, numberOfEmployees, annualRevenue)

2.5 WHEN the user submits the client form, THE System SHALL validate all required fields and create the client in the database

2.6 THE System SHALL display client cards with key information (name, type badge, status badge, patrimoine net, last contact date)

2.7 WHEN the user clicks on a client card, THE System SHALL navigate to the Client 360° view

### Requirement 3: Vue Client 360°

**User Story:** En tant que conseiller, je veux une vue complète à 360° de mon client, afin d'avoir toutes les informations nécessaires en un seul endroit.

#### Acceptance Criteria

3.1 THE System SHALL display a client header with photo, name, contact info, client type, status, and key metrics (patrimoine net, patrimoine géré, score KYC)

3.2 THE System SHALL provide tabbed navigation with the following tabs: Vue d'ensemble, Profil & Famille, Patrimoine, Objectifs & Projets, Opportunités, Activité & Historique, Documents, Reporting, Conformité & KYC, Paramètres

3.3 WHEN the user selects the "Vue d'ensemble" tab, THE System SHALL display KPI cards, patrimoine charts (pie chart for allocation, line chart for evolution), alerts, and recent timeline

3.4 WHEN the user selects the "Profil & Famille" tab, THE System SHALL display personal information, family members, investor profile (MIF II), and fiscal information

3.5 WHEN the user selects the "Patrimoine" tab, THE System SHALL display sub-tabs for Actifs, Passifs, Contrats, and Synthèse with detailed tables and charts

3.6 THE System SHALL calculate and display patrimoine net automatically (total actifs - total passifs)

3.7 THE System SHALL allow inline editing of client information with auto-save functionality

### Requirement 4: Gestion du Patrimoine

**User Story:** En tant que conseiller, je veux gérer les actifs, passifs et contrats de mes clients, afin de suivre leur patrimoine complet.

#### Acceptance Criteria

4.1 WHEN the user clicks "Ajouter un actif", THE System SHALL display a form with actif type selection (Immobilier, Financier, Professionnel, Autre)

4.2 THE System SHALL support indivision (shared ownership) by allowing multiple clients to be linked to one actif with ownership percentages

4.3 WHEN the user adds a passif (loan), THE System SHALL calculate and display the amortization schedule automatically

4.4 WHEN the user adds a contrat, THE System SHALL track renewal dates and display alerts 60 days before expiration

4.5 THE System SHALL display patrimoine allocation charts (by type, by category, by risk level)

4.6 THE System SHALL calculate total patrimoine géré vs non géré based on the managedByFirm flag

### Requirement 5: Documents et GED

**User Story:** En tant que conseiller, je veux gérer tous les documents clients avec une GED complète, afin d'assurer la conformité réglementaire.

#### Acceptance Criteria

5.1 THE System SHALL display a document completeness score based on required documents for the client's patrimoine level

5.2 THE System SHALL categorize documents into: Entrée en relation, Identité, Fiscal, Patrimoine, Réglementaire, Commercial, Autre

5.3 WHEN the user drags and drops a file, THE System SHALL upload it and prompt for document type and description

5.4 THE System SHALL support document versioning with automatic version numbering

5.5 THE System SHALL display alerts for documents expiring within 30 days

5.6 THE System SHALL allow linking documents from an external GED library

5.7 WHEN the user clicks "Prévisualiser", THE System SHALL open the document in a new tab

5.8 THE System SHALL track document upload date, uploaded by user, and last modified date

### Requirement 6: KYC et Conformité

**User Story:** En tant que conseiller, je veux gérer le KYC et la conformité MIF II de mes clients, afin de respecter les obligations réglementaires.

#### Acceptance Criteria

6.1 THE System SHALL display a KYC completion score (0-100%) based on required information

6.2 THE System SHALL display KYC status (Pending, In Progress, Completed, Expired, Rejected) with color-coded badges

6.3 WHEN the user clicks "Compléter le KYC", THE System SHALL display a modal form with sections for LCB-FT (PEP status, origin of funds) and MIF II (risk profile, investment horizon, financial knowledge, investment objectives)

6.4 THE System SHALL calculate a MIF II overall score based on the questionnaire responses

6.5 THE System SHALL display alerts when KYC is expiring within 30 days

6.6 THE System SHALL track KYC document validation status (Pending, Validated, Rejected, Expired)

6.7 THE System SHALL allow compliance officer to add notes on the KYC review

### Requirement 7: Objectifs et Projets

**User Story:** En tant que conseiller, je veux suivre les objectifs financiers et projets de mes clients, afin de les accompagner dans leur planification patrimoniale.

#### Acceptance Criteria

7.1 WHEN the user creates an objectif, THE System SHALL require type, name, target amount, target date, and priority

7.2 THE System SHALL calculate progress percentage automatically based on current amount vs target amount

7.3 THE System SHALL display objectifs with progress bars and color-coded priority badges

7.4 WHEN the user creates a projet, THE System SHALL allow linking multiple tâches to the projet

7.5 THE System SHALL track projet status (Planned, In Progress, Completed, Cancelled, On Hold)

7.6 THE System SHALL display AI-generated recommendations for achieving objectifs

### Requirement 8: Opportunités

**User Story:** En tant que conseiller, je veux détecter et suivre les opportunités commerciales, afin d'optimiser le développement de mon portefeuille.

#### Acceptance Criteria

8.1 THE System SHALL display detected opportunities with score, confidence level, and estimated value

8.2 THE System SHALL provide a pipeline view (Kanban) with stages: Détectée, Qualifiée, Contactée, Présentée, Acceptée, Convertie, Rejetée, Perdue

8.3 WHEN the user moves an opportunity to "Convertie", THE System SHALL prompt to create a projet

8.4 THE System SHALL display opportunity priority (Low, Medium, High, Urgent) with color-coded badges

8.5 THE System SHALL track action deadline and display alerts for overdue opportunities

### Requirement 9: Tâches et Agenda

**User Story:** En tant que conseiller, je veux gérer mes tâches et rendez-vous, afin d'organiser mon activité quotidienne.

#### Acceptance Criteria

9.1 THE System SHALL display a task list with filters for status (Todo, In Progress, Completed, Cancelled), priority, and due date

9.2 WHEN the user creates a tâche, THE System SHALL allow linking it to a client and/or projet

9.3 THE System SHALL display overdue tasks with red badges and alerts

9.4 THE System SHALL provide a calendar view for rendez-vous with day, week, and month views

9.5 WHEN the user creates a rendez-vous, THE System SHALL allow setting reminders and sending invitations

9.6 THE System SHALL sync rendez-vous with external calendars (Google, Outlook) if configured

### Requirement 10: Calculateurs et Simulateurs

**User Story:** En tant que conseiller, je veux utiliser des calculateurs et simulateurs avancés, afin de proposer des recommandations précises à mes clients.

#### Acceptance Criteria

10.1 THE System SHALL provide a calculators hub page with categories: Fiscalité, Budget, Objectifs

10.2 THE System SHALL provide a simulators hub page with categories: Retraite, Succession, Fiscalité

10.3 WHEN the user uses a calculator, THE System SHALL display results in real-time as inputs change

10.4 WHEN the user completes a simulation, THE System SHALL allow saving it to the client's dossier

10.5 THE System SHALL allow exporting calculation results in PDF, Excel, or CSV format

10.6 THE System SHALL integrate the following calculators: Income Tax, Capital Gains Tax, Wealth Tax (IFI), Donation Tax, Inheritance Tax, Budget Analyzer, Debt Capacity, Emergency Fund, Single Objective, Multiple Objectives, Education Funding, Home Purchase

10.7 THE System SHALL integrate the following simulators: Retirement Simulator, Pension Estimator, Retirement Comparison, Succession Simulator, Succession Comparison, Donation Optimizer, Tax Projector, Tax Strategy Comparison, Investment Vehicle Comparison

### Requirement 11: Exports et Reporting

**User Story:** En tant que conseiller, je veux générer des rapports professionnels, afin de les partager avec mes clients.

#### Acceptance Criteria

11.1 WHEN the user clicks "Exporter", THE System SHALL display format options (CSV, Excel, PDF)

11.2 THE System SHALL allow exporting client lists, patrimoine summaries, calculation results, and simulation reports

11.3 WHEN exporting to PDF, THE System SHALL include cabinet branding (logo, colors, contact info)

11.4 THE System SHALL generate professional reports with charts, tables, and formatted text

11.5 THE System SHALL support French and English locales for exports

### Requirement 12: Sécurité et Permissions

**User Story:** En tant qu'administrateur, je veux contrôler les accès et permissions, afin de garantir la sécurité des données.

#### Acceptance Criteria

12.1 THE System SHALL enforce Row Level Security (RLS) to isolate data by cabinetId

12.2 THE System SHALL respect user roles (ADMIN, ADVISOR, ASSISTANT) for feature access

12.3 WHEN an ASSISTANT user logs in, THE System SHALL only display clients assigned to their advisor

12.4 THE System SHALL log all sensitive actions (view, edit, delete, export) in the audit log

12.5 THE System SHALL display "Access Denied" message when a user attempts unauthorized actions

### Requirement 13: Performance et UX

**User Story:** En tant qu'utilisateur, je veux une interface rapide et réactive, afin de travailler efficacement.

#### Acceptance Criteria

13.1 THE System SHALL load the dashboard page in less than 2 seconds

13.2 THE System SHALL use optimistic UI updates for better perceived performance

13.3 THE System SHALL display loading skeletons while fetching data from PostgreSQL

13.4 THE System SHALL implement infinite scroll for long lists (clients, documents, tasks)

13.5 THE System SHALL cache frequently accessed data (client lists, navigation counters) using React Query

13.6 THE System SHALL be fully responsive and usable on tablets (iPad)

13.7 THE System SHALL fetch ALL data from PostgreSQL via Prisma (NO mock data allowed)

13.8 WHEN an API call fails, THE System SHALL display a clear error message and retry option

### Requirement 14: Mode Présentation

**User Story:** En tant que conseiller, je veux un mode présentation pour masquer les données sensibles, afin de partager mon écran en toute sécurité.

#### Acceptance Criteria

14.1 WHEN the user presses Ctrl+H, THE System SHALL toggle presentation mode

14.2 WHEN presentation mode is active, THE System SHALL mask sensitive data (amounts, account numbers, personal details)

14.3 THE System SHALL display a visual indicator when presentation mode is active

14.4 THE System SHALL persist presentation mode preference in localStorage

### Requirement 15: Notifications et Alertes

**User Story:** En tant que conseiller, je veux recevoir des notifications pour les événements importants, afin de ne rien manquer.

#### Acceptance Criteria

15.1 THE System SHALL display a notification center icon with unread count badge

15.2 WHEN the user clicks the notification icon, THE System SHALL display a dropdown with recent notifications

15.3 THE System SHALL categorize notifications by type (Task Due, KYC Expiring, Contract Renewal, Opportunity Detected, etc.)

15.4 WHEN the user clicks a notification, THE System SHALL navigate to the relevant page and mark it as read

15.5 THE System SHALL display toast notifications for real-time events (new task assigned, document uploaded)


### Requirement 16: Intégration Backend Réelle

**User Story:** En tant que développeur, je veux que toutes les données proviennent de PostgreSQL via Prisma, afin d'avoir un système 100% fonctionnel sans mocks.

#### Acceptance Criteria

16.1 THE System SHALL use ONLY the existing API routes in `alfi-crm/app/api/` for all data operations

16.2 THE System SHALL use ONLY the existing Prisma services in `alfi-crm/lib/services/` for business logic

16.3 THE System SHALL NOT use any mock data, fake data, or hardcoded arrays

16.4 THE System SHALL persist ALL user actions (create, update, delete) to PostgreSQL via Prisma

16.5 WHEN displaying a list, THE System SHALL fetch data from the corresponding API route (e.g., `/api/clients` for clients list)

16.6 WHEN creating a new entity, THE System SHALL send a POST request to the API and wait for the database response

16.7 WHEN updating an entity, THE System SHALL send a PATCH/PUT request to the API and refresh the data from the database

16.8 THE System SHALL respect Row Level Security (RLS) by including cabinetId in all queries

16.9 THE System SHALL handle database errors gracefully and display user-friendly messages

16.10 THE System SHALL log all sensitive operations to the AuditLog table via Prisma

### Requirement 17: Seed Data pour Tests

**User Story:** En tant que développeur, je veux pouvoir créer des données de test réelles en base, afin de tester l'application avec des données cohérentes.

#### Acceptance Criteria

17.1 THE System SHALL provide a seed script (`prisma/seed.ts`) that creates test data in PostgreSQL

17.2 THE seed script SHALL create at least: 1 cabinet, 2 users (admin + advisor), 5 clients (3 particuliers + 2 professionnels), 10 actifs, 5 passifs, 8 contrats, 15 documents, 5 objectifs, 3 projets, 10 tâches, 5 rendez-vous

17.3 THE seed script SHALL use realistic French names, addresses, and data

17.4 THE seed script SHALL be idempotent (can be run multiple times without errors)

17.5 THE seed script SHALL respect all Prisma schema constraints and relations

17.6 ALL seed data SHALL be persisted in PostgreSQL and accessible via API routes
