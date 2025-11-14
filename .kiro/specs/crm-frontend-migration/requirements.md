# Requirements Document - Migration Frontend CRM vers alfi-crm

## Introduction

Ce document définit les exigences pour la migration complète du frontend du projet CRM/ vers alfi-crm/, en adaptant le code pour utiliser Prisma/Supabase au lieu de MongoDB, tout en préservant toutes les fonctionnalités existantes.

## Glossaire

- **CRM Source**: Le projet CRM/ existant utilisant MongoDB/Mongoose
- **alfi-crm**: Le projet de destination avec Prisma/Supabase déjà configuré
- **Frontend**: Composants React, pages Next.js, hooks, et utilitaires UI
- **Backend Adapter**: Couche d'adaptation des appels API MongoDB vers Prisma
- **Prisma Client**: Client de base de données généré par Prisma
- **Supabase**: Service PostgreSQL hébergé utilisé comme base de données

## Requirements

### Requirement 1: Migration des Composants UI

**User Story:** En tant que développeur, je veux migrer tous les composants UI du CRM source vers alfi-crm, afin de conserver l'interface utilisateur complète.

#### Acceptance Criteria

1. WHEN THE System migrates components, THE System SHALL copy all files from CRM/components/ to alfi-crm/components/
2. WHEN THE System encounters duplicate components, THE System SHALL preserve existing alfi-crm components and merge functionality
3. WHEN THE System copies components, THE System SHALL maintain the directory structure
4. WHEN THE System migrates UI components, THE System SHALL update import paths to match alfi-crm structure
5. THE System SHALL migrate 223 component files without data loss

### Requirement 2: Migration des Pages Dashboard

**User Story:** En tant qu'utilisateur, je veux accéder à toutes les pages du dashboard CRM, afin de gérer mon activité complète.

#### Acceptance Criteria

1. WHEN THE System migrates dashboard pages, THE System SHALL copy all files from CRM/app/dashboard/ to alfi-crm/app/dashboard/
2. WHEN THE System encounters existing pages, THE System SHALL preserve alfi-crm pages and add missing CRM pages
3. THE System SHALL migrate 79 dashboard page files
4. WHEN THE System migrates pages, THE System SHALL update API route calls to use Prisma endpoints
5. THE System SHALL maintain Next.js App Router structure

### Requirement 3: Adaptation des Appels API MongoDB vers Prisma

**User Story:** En tant que développeur, je veux adapter tous les appels API pour utiliser Prisma, afin que le frontend fonctionne avec la nouvelle base de données.

#### Acceptance Criteria

1. WHEN THE System encounters MongoDB queries, THE System SHALL replace them with equivalent Prisma queries
2. WHEN THE System adapts API calls, THE System SHALL use the existing Prisma schema without modification
3. WHEN THE System converts data models, THE System SHALL map MongoDB ObjectId to Prisma cuid
4. WHEN THE System adapts queries, THE System SHALL maintain query performance
5. THE System SHALL preserve all business logic during adaptation

### Requirement 4: Migration des Hooks et Utilitaires

**User Story:** En tant que développeur, je veux migrer tous les hooks et utilitaires, afin de conserver la logique métier du CRM.

#### Acceptance Criteria

1. WHEN THE System migrates hooks, THE System SHALL copy all files from CRM/hooks/ to alfi-crm/hooks/
2. WHEN THE System encounters duplicate hooks, THE System SHALL merge functionality
3. WHEN THE System migrates utilities, THE System SHALL copy all files from CRM/lib/ to alfi-crm/lib/
4. WHEN THE System adapts utilities, THE System SHALL update database access to use Prisma
5. THE System SHALL maintain all custom business logic

### Requirement 5: Migration des Calculateurs et Simulateurs

**User Story:** En tant qu'utilisateur, je veux accéder à tous les calculateurs et simulateurs, afin de réaliser mes analyses financières.

#### Acceptance Criteria

1. WHEN THE System migrates calculators, THE System SHALL preserve all calculation logic
2. WHEN THE System migrates simulators, THE System SHALL maintain all simulation features
3. THE System SHALL migrate retirement, tax, succession, and budget calculators
4. THE System SHALL migrate all simulator components without functional loss
5. WHEN THE System saves simulations, THE System SHALL use Prisma to store results

### Requirement 6: Adaptation des Routes API

**User Story:** En tant que développeur, je veux adapter toutes les routes API, afin qu'elles utilisent Prisma au lieu de MongoDB.

#### Acceptance Criteria

1. WHEN THE System migrates API routes, THE System SHALL copy all files from CRM/app/api/ to alfi-crm/app/api/
2. WHEN THE System adapts routes, THE System SHALL replace connectDB() with Prisma client
3. WHEN THE System adapts routes, THE System SHALL replace Mongoose models with Prisma models
4. WHEN THE System adapts routes, THE System SHALL maintain all API endpoints
5. THE System SHALL preserve authentication and authorization logic

### Requirement 7: Migration des Styles et Thèmes

**User Story:** En tant qu'utilisateur, je veux conserver l'apparence visuelle du CRM, afin de maintenir la cohérence de l'interface.

#### Acceptance Criteria

1. WHEN THE System migrates styles, THE System SHALL copy all CSS files from CRM/styles/ to alfi-crm/
2. WHEN THE System migrates global styles, THE System SHALL merge with existing alfi-crm styles
3. THE System SHALL preserve Tailwind configuration
4. THE System SHALL maintain responsive design
5. THE System SHALL preserve accessibility features

### Requirement 8: Migration de la Configuration

**User Story:** En tant que développeur, je veux migrer la configuration du projet, afin de maintenir les paramètres nécessaires.

#### Acceptance Criteria

1. WHEN THE System migrates configuration, THE System SHALL preserve Next.js configuration
2. WHEN THE System migrates configuration, THE System SHALL maintain TypeScript settings
3. WHEN THE System migrates configuration, THE System SHALL preserve ESLint rules
4. THE System SHALL keep Prisma and Supabase configuration intact
5. THE System SHALL merge package.json dependencies without conflicts

### Requirement 9: Adaptation du Client360

**User Story:** En tant qu'utilisateur, je veux accéder à la vue Client360 complète, afin de gérer toutes les informations client.

#### Acceptance Criteria

1. WHEN THE System migrates Client360, THE System SHALL preserve all tabs (Profile, KYC, Wealth, Documents, Objectives, Opportunities, Timeline)
2. WHEN THE System loads client data, THE System SHALL use Prisma relations
3. WHEN THE System displays wealth, THE System SHALL calculate from Prisma actifs and passifs
4. THE System SHALL maintain real-time updates
5. THE System SHALL preserve all client interactions

### Requirement 10: Migration des Fonctionnalités d'Export

**User Story:** En tant qu'utilisateur, je veux exporter des données en PDF et Excel, afin de générer des rapports.

#### Acceptance Criteria

1. WHEN THE System migrates export features, THE System SHALL preserve PDF generation
2. WHEN THE System migrates export features, THE System SHALL preserve Excel export
3. WHEN THE System exports data, THE System SHALL fetch from Prisma
4. THE System SHALL maintain export templates
5. THE System SHALL preserve export formatting

### Requirement 11: Migration du Système de Notifications

**User Story:** En tant qu'utilisateur, je veux recevoir des notifications, afin d'être informé des événements importants.

#### Acceptance Criteria

1. WHEN THE System migrates notifications, THE System SHALL preserve notification center
2. WHEN THE System creates notifications, THE System SHALL store in Prisma
3. WHEN THE System displays notifications, THE System SHALL fetch from Prisma
4. THE System SHALL maintain real-time notification updates
5. THE System SHALL preserve notification preferences

### Requirement 12: Migration de la Gestion des Documents

**User Story:** En tant qu'utilisateur, je veux gérer mes documents, afin d'organiser la documentation client.

#### Acceptance Criteria

1. WHEN THE System migrates document management, THE System SHALL preserve upload functionality
2. WHEN THE System stores documents, THE System SHALL use Prisma document model
3. WHEN THE System categorizes documents, THE System SHALL maintain taxonomy
4. THE System SHALL preserve document versioning
5. THE System SHALL maintain document security and access control

### Requirement 13: Migration de l'Authentification

**User Story:** En tant qu'utilisateur, je veux me connecter au système, afin d'accéder à mes données de manière sécurisée.

#### Acceptance Criteria

1. WHEN THE System migrates authentication, THE System SHALL preserve NextAuth configuration
2. WHEN THE System authenticates users, THE System SHALL query Prisma User model
3. WHEN THE System manages sessions, THE System SHALL maintain security
4. THE System SHALL preserve role-based access control
5. THE System SHALL maintain multi-tenant isolation

### Requirement 14: Tests et Validation

**User Story:** En tant que développeur, je veux tester la migration, afin de garantir que tout fonctionne correctement.

#### Acceptance Criteria

1. WHEN THE System completes migration, THE System SHALL verify all pages load
2. WHEN THE System tests features, THE System SHALL validate CRUD operations
3. WHEN THE System tests API routes, THE System SHALL verify Prisma queries work
4. THE System SHALL validate data integrity
5. THE System SHALL verify no MongoDB dependencies remain

### Requirement 15: Migration de l'Interface SuperAdmin

**User Story:** En tant que super administrateur, je veux accéder à l'interface de gestion multi-tenant, afin de gérer les cabinets et leurs quotas.

#### Acceptance Criteria

1. WHEN THE System migrates SuperAdmin interface, THE System SHALL copy all files from CRM/app/superadmin/ to alfi-crm/app/superadmin/
2. WHEN THE System migrates SuperAdmin components, THE System SHALL copy all components from CRM/components/superadmin/
3. WHEN THE System adapts SuperAdmin API, THE System SHALL convert to use Prisma SuperAdmin and Cabinet models
4. THE System SHALL preserve dashboard with metrics, organizations list, and audit logs
5. THE System SHALL maintain quota management, plan management, and organization settings

### Requirement 16: Migration de l'Interface Client (Portail Client)

**User Story:** En tant que client, je veux accéder à mon portail personnel, afin de consulter mon patrimoine et mes documents.

#### Acceptance Criteria

1. WHEN THE System migrates Client portal, THE System SHALL copy all files from CRM/app/client/ to alfi-crm/app/client/
2. WHEN THE System migrates Client portal, THE System SHALL preserve all 7 sections (dashboard, patrimoine, objectifs, documents, rendez-vous, messages, profil)
3. WHEN THE System adapts Client portal, THE System SHALL use Prisma Client model with portalAccess flag
4. THE System SHALL maintain client authentication separate from advisor authentication
5. THE System SHALL preserve read-only access to client data with appropriate permissions

### Requirement 17: Documentation de Migration

**User Story:** En tant que développeur, je veux une documentation de migration, afin de comprendre les changements effectués.

#### Acceptance Criteria

1. WHEN THE System completes migration, THE System SHALL document all file changes
2. WHEN THE System adapts code, THE System SHALL document API adaptations
3. THE System SHALL provide mapping MongoDB to Prisma
4. THE System SHALL document breaking changes
5. THE System SHALL provide rollback instructions
