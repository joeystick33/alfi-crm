# Implementation Plan - Migration Frontend CRM vers alfi-crm

## Phase 1: Préparation et Audit

- [-] 1. Créer une branche Git et backup de sécurité
  - Créer la branche `migration-crm-frontend`
  - Faire un backup de la base de données Supabase
  - Créer un commit initial "Before migration - safe point"
  - Documenter les points de restauration
  - _Requirements: 17.5_

- [ ] 2. Analyser et documenter la structure du CRM source
  - Lister tous les composants à migrer (223 fichiers)
  - Lister toutes les pages dashboard (79 fichiers)
  - Identifier les dépendances MongoDB
  - Créer un mapping des modèles MongoDB → Prisma
  - Générer un rapport d'audit complet
  - _Requirements: 1.1, 2.1, 3.1, 17.1_

- [ ] 2.1 Créer le mapping MongoDB → Prisma
  - Documenter la correspondance ObjectId → cuid
  - Documenter les relations MongoDB → Prisma
  - Documenter les embedded documents → Json ou relations
  - Créer un guide de conversion des queries (find → findMany, populate → include)
  - Créer docs/migration/API_CHANGES.md
  - _Requirements: 3.1, 3.3, 17.2, 17.3_

- [ ] 2.2 Identifier les composants existants dans alfi-crm
  - Lister les composants déjà présents
  - Identifier les doublons potentiels (Button, Card, etc.)
  - Planifier la stratégie de fusion (keep-alfi, keep-crm, merge, copy)
  - Créer un script d'analyse des duplications
  - Créer docs/migration/COMPONENT_MAPPING.md
  - _Requirements: 1.2, 2.2, 17.1_

- [ ] 2.3 Créer la structure de documentation
  - Créer le dossier docs/migration/
  - Créer MIGRATION_GUIDE.md (template)
  - Créer API_CHANGES.md (template)
  - Créer COMPONENT_MAPPING.md (template)
  - Créer BREAKING_CHANGES.md (template)
  - Créer ROLLBACK_GUIDE.md (template)
  - Créer FILE_CHANGES.md (template)
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

## Phase 2: Création du Design System Bento Grid

- [ ] 3. Créer les composants Bento de base
  - Créer BentoGrid component avec responsive cols configuration
  - Créer BentoCard component avec span et variant props
  - Implémenter les 4 variants (default, hero, accent, gradient)
  - Ajouter le support dark mode
  - Tester les composants de base
  - _Requirements: Bento-1.1, Bento-1.2, Bento-1.3, Bento-1.4, Bento-13.1_

- [ ] 3.1 Créer les composants Bento spécialisés
  - Créer BentoKPI component pour afficher les KPIs
  - Créer BentoChart component pour wrapper les graphiques
  - Ajouter les animations hover et transitions
  - Implémenter les skeleton loaders
  - Tester les composants spécialisés
  - _Requirements: Bento-1.1, Bento-2.4, Bento-11.1_

- [ ] 3.2 Créer le template ChartHero
  - Créer ChartHeroTemplate pour calculateurs simples
  - Définir le layout: chart hero (4x3) + KPIs satellites (2x1)
  - Ajouter le support responsive (stack sur mobile)
  - Tester avec données de test
  - _Requirements: Bento-6.1, Bento-6.2, Bento-6.3, Bento-6.4_

- [ ] 3.3 Créer le template DualCharts
  - Créer DualChartsTemplate pour calculateurs complexes
  - Définir le layout: 2 charts (4x3 chacun) + KPIs
  - Ajouter le health indicator en hero card
  - Ajouter le support responsive (stack sur tablet)
  - Tester avec données de test
  - _Requirements: Bento-7.1, Bento-7.2, Bento-7.3, Bento-7.4_

- [ ] 3.4 Créer le template Timeline
  - Créer TimelineTemplate pour simulateurs
  - Définir le layout: timeline hero (6x4) + KPIs sidebar (2x2)
  - Ajouter le feasibility indicator en full-width
  - Ajouter le support responsive
  - Tester avec données de test
  - _Requirements: Bento-9.1, Bento-9.2, Bento-9.3, Bento-9.4_

- [ ] 3.5 Configurer le responsive behavior
  - Configurer les breakpoints (mobile: 1 col, tablet: 4 cols, desktop: 6 cols)
  - Implémenter les transitions smooth (300ms)
  - Tester sur différentes tailles d'écran
  - Valider que les charts restent lisibles
  - _Requirements: Bento-10.1, Bento-10.2, Bento-10.3, Bento-10.4, Bento-10.5_

- [ ] 3.6 Implémenter l'accessibilité
  - Ajouter les ARIA labels et roles appropriés
  - Implémenter les focus indicators pour navigation clavier
  - Ajouter les ARIA live regions pour changements de layout
  - Tester avec screen readers
  - Valider le zoom à 200%
  - _Requirements: Bento-12.1, Bento-12.2, Bento-12.3, Bento-12.4, Bento-12.5_

- [ ] 3.7 Écrire les tests des composants Bento
  - Tests unitaires BentoGrid (layout calculations)
  - Tests unitaires BentoCard (variants, spans)
  - Tests responsive (tous les breakpoints)
  - Tests des templates avec données de test
  - Atteindre 80% code coverage
  - _Requirements: Bento-15.1, Bento-15.2, Bento-15.3, Bento-15.4, Bento-15.5_

## Phase 3: Migration des Utilitaires et Services

- [ ] 4. Migrer les utilitaires de base
  - Copier les fichiers de CRM/lib/utils/ vers alfi-crm/lib/
  - Adapter les imports pour utiliser Prisma
  - Supprimer les références à MongoDB/Mongoose
  - Tester les utilitaires adaptés
  - _Requirements: 4.3, 4.4, 4.5_

- [ ] 4.1 Créer les services Prisma
  - Créer ClientService avec méthodes CRUD
  - Créer PatrimoineService pour calculs patrimoine
  - Créer DocumentService pour gestion documents
  - Créer OpportuniteService pour détection opportunités
  - _Requirements: 3.2, 3.5, 9.2, 9.3_

- [ ] 4.2 Migrer les hooks personnalisés
  - Copier les hooks de CRM/hooks/ vers alfi-crm/hooks/
  - Adapter les hooks pour utiliser les API Prisma
  - Créer useClient, usePatrimoine, useSimulation
  - Tester les hooks avec TypeScript
  - _Requirements: 4.1, 4.2, 4.5_

## Phase 4: Migration des Composants UI de Base

- [ ] 5. Migrer les composants UI génériques
  - Copier CRM/components/ui/ vers alfi-crm/components/ui/
  - Fusionner avec les composants existants
  - Convertir en TypeScript si nécessaire
  - Tester les composants UI
  - _Requirements: 1.1, 1.2, 1.4, 7.1_

- [ ] 3.1 Migrer les composants de formulaires
  - Copier les composants de formulaires
  - Adapter pour utiliser React Hook Form
  - Ajouter la validation Zod
  - Tester les formulaires
  - _Requirements: 1.1, 1.4_

- [ ] 3.2 Migrer les composants de tableaux
  - Copier les composants DataTable
  - Adapter pour utiliser les données Prisma
  - Ajouter pagination et tri
  - Tester les tableaux
  - _Requirements: 1.1, 1.4_

- [ ] 3.3 Migrer les composants de graphiques
  - Copier CRM/components/charts/ vers alfi-crm/components/charts/
  - Vérifier la compatibilité avec Recharts
  - Adapter les données pour Prisma
  - Tester les graphiques
  - _Requirements: 1.1, 1.4, 5.1_

## Phase 4: Migration des API Routes

- [ ] 4. Migrer les routes API clients
  - Copier CRM/app/api/clients/ vers alfi-crm/app/api/clients/
  - Remplacer connectDB() par prisma client
  - Convertir les queries MongoDB en Prisma
  - Ajouter la validation Zod
  - Tester les endpoints clients
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 13.2_

- [ ] 4.1 Adapter GET /api/clients
  - Remplacer Client.find() par prisma.client.findMany()
  - Ajouter include pour relations
  - Ajouter filtres et pagination
  - Tester la récupération de clients
  - _Requirements: 6.2, 6.3, 13.2_

- [ ] 4.2 Adapter POST /api/clients
  - Remplacer Client.create() par prisma.client.create()
  - Ajouter validation Zod
  - Gérer les erreurs Prisma
  - Tester la création de clients
  - _Requirements: 6.2, 6.3, 13.2_

- [ ] 4.3 Adapter PUT /api/clients/[id]
  - Remplacer findByIdAndUpdate() par prisma.client.update()
  - Ajouter validation Zod
  - Gérer les erreurs Prisma
  - Tester la mise à jour de clients
  - _Requirements: 6.2, 6.3, 13.2_

- [ ] 4.4 Adapter DELETE /api/clients/[id]
  - Remplacer findByIdAndDelete() par prisma.client.delete()
  - Gérer les contraintes de clés étrangères
  - Tester la suppression de clients
  - _Requirements: 6.2, 6.3, 13.2_

- [ ] 5. Migrer les routes API patrimoine
  - Copier CRM/app/api/patrimoine/ vers alfi-crm/app/api/patrimoine/
  - Adapter les routes actifs, passifs, contrats
  - Convertir les queries MongoDB en Prisma
  - Tester les endpoints patrimoine
  - _Requirements: 6.1, 6.2, 6.3, 9.2_

- [ ] 5.1 Adapter les routes actifs
  - Convertir les queries Actif MongoDB → Prisma
  - Gérer les relations ClientActif
  - Calculer les pourcentages de propriété
  - Tester CRUD actifs
  - _Requirements: 6.2, 6.3, 9.2_

- [ ] 5.2 Adapter les routes passifs
  - Convertir les queries Passif MongoDB → Prisma
  - Calculer les montants restants
  - Gérer les échéanciers
  - Tester CRUD passifs
  - _Requirements: 6.2, 6.3, 9.2_

- [ ] 5.3 Adapter les routes contrats
  - Convertir les queries Contrat MongoDB → Prisma
  - Gérer les renouvellements
  - Calculer les commissions
  - Tester CRUD contrats
  - _Requirements: 6.2, 6.3, 9.2_

- [ ] 6. Migrer les routes API documents
  - Copier CRM/app/api/documents/ vers alfi-crm/app/api/documents/
  - Adapter pour utiliser Prisma Document model
  - Gérer les relations ClientDocument
  - Tester upload et récupération documents
  - _Requirements: 6.1, 6.2, 12.2, 12.3_

- [ ] 7. Migrer les routes API objectifs et projets
  - Copier CRM/app/api/objectifs/ et /projets/
  - Adapter les queries pour Prisma
  - Calculer les progressions
  - Tester CRUD objectifs et projets
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 8. Migrer les routes API opportunités
  - Copier CRM/app/api/opportunites/
  - Adapter le moteur de détection
  - Convertir les queries en Prisma
  - Tester la détection d'opportunités
  - _Requirements: 6.1, 6.2, 6.3, 9.4_

- [ ] 9. Migrer les routes API tâches et agenda
  - Copier CRM/app/api/taches/ et /rendezvous/
  - Adapter pour Prisma
  - Gérer les rappels
  - Tester CRUD tâches et rendez-vous
  - _Requirements: 6.1, 6.2, 6.3, 11.2_

- [ ] 10. Migrer les routes API notifications
  - Copier CRM/app/api/notifications/
  - Adapter pour Prisma Notification model
  - Gérer les notifications temps réel
  - Tester création et récupération notifications
  - _Requirements: 6.1, 6.2, 11.2, 11.3_

## Phase 5: Migration des Calculateurs et Simulateurs avec Bento Grid

- [ ] 11. Migrer les calculateurs fiscaux simples avec Chart Hero
  - Copier CRM/components/calculators/ vers alfi-crm/components/calculators/
  - Appliquer ChartHeroTemplate sur IncomeTaxCalculator
  - Appliquer ChartHeroTemplate sur CapitalGainsTaxCalculator
  - Appliquer ChartHeroTemplate sur WealthTaxCalculator
  - Appliquer ChartHeroTemplate sur InheritanceTaxCalculator
  - Appliquer ChartHeroTemplate sur DonationTaxCalculator
  - Vérifier que les calculs sont préservés
  - Adapter le stockage des résultats pour Prisma
  - Tester tous les calculateurs simples
  - _Requirements: 5.1, 5.2, 5.3, Bento-5.1, Bento-5.2, Bento-6.1_

- [ ] 11.1 Migrer les pages calculateurs
  - Copier CRM/app/dashboard/calculators/ vers alfi-crm/app/dashboard/calculators/
  - Adapter les appels API
  - Tester toutes les pages calculateurs
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 12. Migrer les simulateurs retraite avec Timeline Template
  - Copier RetirementSimulator et appliquer TimelineTemplate
  - Copier PensionEstimator et appliquer TimelineTemplate
  - Copier RetirementComparison et appliquer TimelineTemplate
  - Positionner la timeline en large hero card (6x4)
  - Ajouter les KPIs en sidebar vertical (2x2 chacun)
  - Ajouter le feasibility indicator en full-width hero
  - Adapter le stockage des simulations pour Prisma
  - Tester les calculs de retraite
  - Tester le responsive (timeline + KPIs stack sur mobile)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, Bento-8.1, Bento-8.2, Bento-9.1_

- [ ] 12.1 Migrer les pages simulateurs retraite
  - Copier les pages simulateurs retraite
  - Adapter les appels API
  - Tester les simulations
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 13. Migrer les simulateurs succession avec Timeline Template
  - Copier SuccessionSimulator et appliquer TimelineTemplate
  - Copier DonationOptimizer et appliquer TimelineTemplate
  - Copier SuccessionComparison et appliquer TimelineTemplate
  - Positionner la projection en large hero card (6x4)
  - Ajouter les KPIs succession en sidebar (2x2)
  - Ajouter les recommendations en full-width card
  - Adapter le stockage des simulations pour Prisma
  - Tester les calculs de succession
  - Tester le responsive
  - _Requirements: 5.1, 5.2, 5.3, 5.4, Bento-8.1, Bento-8.3, Bento-9.1_

- [ ] 13.1 Migrer les pages simulateurs succession
  - Copier les pages simulateurs succession
  - Adapter les appels API
  - Tester les simulations
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 14. Migrer les calculateurs complexes avec Dual Charts
  - Copier BudgetAnalyzer et appliquer DualChartsTemplate
  - Copier DebtCapacityCalculator et appliquer DualChartsTemplate
  - Ajouter le health indicator en hero card
  - Positionner les 2 charts principaux côte à côte (4x3 chacun)
  - Ajouter les KPIs en small cards
  - Copier les calculateurs d'objectifs (layout standard)
  - Adapter le stockage pour Prisma
  - Tester tous les calculateurs complexes
  - Tester le responsive (charts stack sur tablet)
  - _Requirements: 5.1, 5.2, 5.3, Bento-5.1, Bento-7.1, Bento-7.2_

- [ ] 15. Créer les routes API pour sauvegarder les simulations
  - Créer POST /api/simulations
  - Créer GET /api/simulations/[id]
  - Utiliser Prisma Simulation model
  - Tester la sauvegarde et récupération
  - _Requirements: 5.5, 6.1, 6.2_

## Phase 6: Migration des Pages Dashboard

- [ ] 16. Migrer la page dashboard principale avec Bento Grid
  - Copier CRM/app/dashboard/page.js vers alfi-crm/app/dashboard/page.tsx
  - Remplacer le layout uniforme par BentoGrid
  - Créer 6 KPIs en layout asymétrique (1 hero + 5 normaux)
  - Adapter les appels API pour Prisma
  - Ajouter les skeleton loaders Bento
  - Tester l'affichage responsive (mobile, tablet, desktop)
  - _Requirements: 2.1, 2.2, 2.4, Bento-2.1, Bento-2.2, Bento-2.3_

- [ ] 17. Migrer les pages clients
  - Copier CRM/app/dashboard/clients/ vers alfi-crm/app/dashboard/clients/
  - Adapter la liste des clients
  - Adapter la création/édition de clients
  - Tester toutes les fonctionnalités clients
  - _Requirements: 2.1, 2.2, 2.4, 9.1_

- [ ] 18. Migrer la page Client360 avec Bento Grid
  - Copier CRM/app/dashboard/clients/[id]/page.js
  - Migrer tous les composants client360
  - Appliquer Bento Grid sur TabOverview et TabWealth
  - Adapter TabProfile, TabKYC, TabDocuments (layout standard)
  - Adapter TabObjectives, TabOpportunities, TabTimeline (layout standard)
  - Tester la vue complète Client360
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, Bento-3.1, Bento-4.1_

- [ ] 18.1 Adapter TabProfile
  - Afficher les informations client depuis Prisma
  - Permettre l'édition des informations
  - Gérer les membres de la famille
  - Tester l'onglet Profile
  - _Requirements: 9.1, 9.2_

- [ ] 18.2 Adapter TabKYC
  - Afficher le statut KYC depuis Prisma
  - Gérer les documents KYC
  - Calculer la complétude KYC
  - Tester l'onglet KYC
  - _Requirements: 9.1, 9.2_

- [ ] 18.3 Adapter TabWealth avec Bento Grid
  - Calculer le patrimoine depuis Prisma actifs/passifs
  - Créer le layout Bento: KPIs summary + chart hero allocation
  - Afficher le graphique principal en large hero card (4x3)
  - Afficher les KPIs en small cards (2x1)
  - Afficher le breakdown en medium cards
  - Tester l'onglet Wealth responsive
  - _Requirements: 9.2, 9.3, Bento-4.1, Bento-4.2, Bento-4.3_

- [ ] 18.4 Adapter TabDocuments
  - Lister les documents depuis Prisma
  - Permettre l'upload de documents
  - Gérer les catégories
  - Tester l'onglet Documents
  - _Requirements: 9.1, 9.2, 12.1, 12.2_

- [ ] 18.5 Adapter TabObjectives
  - Lister les objectifs depuis Prisma
  - Calculer les progressions
  - Permettre la création d'objectifs
  - Tester l'onglet Objectives
  - _Requirements: 9.1, 9.2, 9.4_

- [ ] 18.6 Adapter TabOpportunities
  - Lister les opportunités depuis Prisma
  - Afficher le scoring
  - Permettre les actions sur opportunités
  - Tester l'onglet Opportunities
  - _Requirements: 9.1, 9.2, 9.4_

- [ ] 18.7 Adapter TabTimeline
  - Afficher la timeline depuis Prisma
  - Inclure tous les événements
  - Permettre l'ajout d'événements
  - Tester l'onglet Timeline
  - _Requirements: 9.1, 9.2, 9.5_

- [ ] 19. Migrer les pages patrimoine
  - Copier les pages actifs, passifs, contrats
  - Adapter les listes et formulaires
  - Tester CRUD patrimoine
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 20. Migrer les pages objectifs et projets
  - Copier CRM/app/dashboard/objectifs/ et /projets/
  - Adapter les listes et formulaires
  - Tester CRUD objectifs et projets
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 21. Migrer les pages opportunités
  - Copier CRM/app/dashboard/opportunites/
  - Adapter l'affichage des opportunités
  - Adapter le pipeline de conversion
  - Tester la gestion des opportunités
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 22. Migrer les pages tâches et agenda
  - Copier CRM/app/dashboard/taches/ et /agenda/
  - Adapter le calendrier
  - Adapter la liste des tâches
  - Tester tâches et rendez-vous
  - _Requirements: 2.1, 2.2, 2.4_

## Phase 7: Migration des Fonctionnalités Avancées

- [ ] 23. Migrer les composants d'export
  - Copier les composants d'export PDF/Excel
  - Adapter pour récupérer les données depuis Prisma
  - Tester l'export de clients
  - Tester l'export de patrimoine
  - Tester l'export de simulations
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 23.1 Adapter les routes API d'export
  - Adapter /api/exports/clients
  - Adapter /api/exports/patrimoine
  - Adapter /api/exports/simulations
  - Adapter /api/exports/documents
  - Tester tous les exports
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 24. Migrer le système de notifications
  - Copier les composants de notifications
  - Adapter NotificationCenter pour Prisma
  - Gérer les notifications temps réel
  - Tester les notifications
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 25. Migrer la gestion des documents
  - Copier les composants de GED
  - Adapter l'upload pour Prisma
  - Adapter la catégorisation
  - Adapter le versioning
  - Tester la GED complète
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 26. Migrer l'authentification
  - Vérifier NextAuth configuration
  - Adapter les callbacks pour Prisma User
  - Tester la connexion
  - Tester les rôles et permissions
  - Tester l'isolation multi-tenant
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

## Phase 8: Migration des Styles et Configuration

- [ ] 29. Migrer les styles
  - Copier CRM/styles/ vers alfi-crm/
  - Fusionner avec globals.css existant
  - Vérifier Tailwind config
  - Tester le responsive design
  - Tester l'accessibilité
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 30. Migrer la configuration
  - Fusionner next.config.js
  - Fusionner tsconfig.json
  - Fusionner eslint config
  - Fusionner package.json dependencies
  - Vérifier qu'il n'y a pas de conflits
  - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [ ] 31. Nettoyer les dépendances MongoDB
  - Supprimer mongoose du package.json
  - Supprimer mongodb du package.json
  - Supprimer les imports MongoDB restants
  - Vérifier qu'aucune référence MongoDB ne reste
  - _Requirements: 3.1, 14.5_

## Phase 9: Migration des Interfaces SuperAdmin et Client

- [ ] 27. Migrer l'interface SuperAdmin
  - Copier CRM/app/superadmin/ vers alfi-crm/app/superadmin/
  - Copier CRM/components/superadmin/ vers alfi-crm/components/superadmin/
  - Adapter SuperAdminDashboard pour Prisma
  - Adapter les composants de gestion des organisations
  - _Requirements: 15.1, 15.2, 15.3_

- [ ] 27.1 Adapter les routes API SuperAdmin
  - Créer /api/superadmin/metrics pour métriques globales
  - Créer /api/superadmin/organizations pour CRUD cabinets
  - Créer /api/superadmin/organizations/[id]/quotas pour gestion quotas
  - Créer /api/superadmin/organizations/[id]/plan pour gestion plans
  - Créer /api/superadmin/organizations/[id]/status pour gestion statuts
  - Créer /api/superadmin/organizations/[id]/audit pour logs d'audit
  - Adapter toutes les queries pour utiliser Prisma
  - _Requirements: 15.3, 15.4_

- [ ] 27.2 Adapter les composants SuperAdmin
  - Adapter CreateOrganizationModal pour Prisma Cabinet
  - Adapter CreateUserModal pour Prisma User
  - Adapter QuotaEditor pour Prisma quotas Json
  - Adapter OrganizationSettingsModal
  - Adapter AuditLogViewer pour Prisma AuditLog
  - Tester toutes les fonctionnalités SuperAdmin
  - _Requirements: 15.2, 15.3, 15.4_

- [ ] 28. Migrer l'interface Client (Portail Client)
  - Copier CRM/app/client/ vers alfi-crm/app/client/
  - Adapter le layout client
  - Adapter l'authentification client (portalAccess, portalPassword)
  - Tester l'accès au portail client
  - _Requirements: 16.1, 16.2, 16.3, 16.4_

- [ ] 28.1 Migrer les pages du portail client
  - Adapter /client/dashboard - Vue d'ensemble client
  - Adapter /client/patrimoine - Consultation patrimoine
  - Adapter /client/objectifs - Suivi objectifs
  - Adapter /client/documents - Accès documents
  - Adapter /client/rendez-vous - Consultation rendez-vous
  - Adapter /client/messages - Messagerie avec conseiller
  - Adapter /client/profil - Gestion profil client
  - _Requirements: 16.2, 16.3_

- [ ] 28.2 Adapter les routes API Client
  - Créer /api/client/auth pour authentification client
  - Créer /api/client/dashboard pour données dashboard client
  - Créer /api/client/patrimoine pour consultation patrimoine
  - Créer /api/client/documents pour accès documents
  - Créer /api/client/messages pour messagerie
  - Adapter toutes les queries pour utiliser Prisma avec permissions client
  - _Requirements: 16.3, 16.4, 16.5_

- [ ] 28.3 Implémenter les permissions Client
  - Vérifier portalAccess dans toutes les routes client
  - Implémenter read-only access pour données client
  - Bloquer l'accès aux données d'autres clients
  - Tester l'isolation des données client
  - _Requirements: 16.4, 16.5_

## Phase 10: Tests et Validation

- [ ] 32. Tester toutes les pages
  - Tester le chargement de chaque page
  - Vérifier qu'il n'y a pas d'erreurs console
  - Vérifier que les données s'affichent
  - Tester la navigation
  - _Requirements: 14.1, 14.2_

- [ ] 33. Tester les opérations CRUD
  - Tester création de clients
  - Tester modification de clients
  - Tester suppression de clients
  - Tester CRUD patrimoine
  - Tester CRUD objectifs/projets
  - _Requirements: 14.2, 14.3_

- [ ] 34. Tester les calculateurs et simulateurs avec Bento Grid
  - Tester tous les calculateurs fiscaux avec ChartHeroTemplate
  - Tester tous les calculateurs complexes avec DualChartsTemplate
  - Tester tous les simulateurs avec TimelineTemplate
  - Vérifier que les calculs sont corrects
  - Vérifier que les sauvegardes fonctionnent
  - Tester le responsive des templates (mobile, tablet, desktop)
  - Vérifier que les charts restent lisibles à toutes les tailles
  - _Requirements: 14.2, 14.3, Bento-10.1, Bento-10.5_

- [ ] 35. Tester les exports
  - Tester export PDF clients
  - Tester export Excel patrimoine
  - Tester export simulations
  - Vérifier le formatage
  - _Requirements: 14.2, 14.3_

- [ ] 36. Tester l'authentification et les permissions
  - Tester la connexion
  - Tester les rôles (ADMIN, ADVISOR, ASSISTANT)
  - Tester l'isolation multi-tenant
  - Vérifier que RLS fonctionne
  - _Requirements: 14.2, 14.3, 14.4_

- [ ] 37. Tester l'interface SuperAdmin
  - Tester la connexion SuperAdmin
  - Tester la création de cabinets
  - Tester la gestion des quotas
  - Tester la gestion des plans
  - Tester les logs d'audit
  - Vérifier l'isolation des données entre cabinets
  - _Requirements: 15.4, 15.5, 14.2_

- [ ] 38. Tester l'interface Client (Portail)
  - Tester la connexion client avec portalPassword
  - Tester l'accès au dashboard client
  - Tester la consultation du patrimoine
  - Tester l'accès aux documents
  - Tester la messagerie
  - Vérifier que le client ne peut voir que ses propres données
  - _Requirements: 16.4, 16.5, 14.2_

- [ ] 39. Valider l'intégrité des données
  - Vérifier que toutes les relations fonctionnent
  - Vérifier que les calculs sont corrects
  - Vérifier qu'il n'y a pas de perte de données
  - Tester les contraintes de clés étrangères
  - _Requirements: 14.4_

- [ ] 40. Tests de performance et Bento Grid
  - Tester le temps de chargement des pages (< 3s TTI)
  - Tester First Contentful Paint (< 1.5s)
  - Mesurer Cumulative Layout Shift (< 0.1)
  - Vérifier que les animations sont à 60fps
  - Tester les queries Prisma complexes
  - Optimiser les queries N+1
  - Vérifier le lazy loading des charts hors viewport
  - Ajouter de la pagination si nécessaire
  - _Requirements: 14.2, 14.3, Bento-11.1, Bento-11.2, Bento-11.3, Bento-11.5_

## Phase 11: Documentation et Finalisation

- [ ] 41. Documenter les changements et Bento Grid
  - Créer un document de migration
  - Documenter tous les fichiers copiés
  - Documenter les adaptations MongoDB → Prisma
  - Créer un guide de mapping des modèles
  - Documenter le design system Bento Grid
  - Créer un guide d'utilisation des templates (ChartHero, DualCharts, Timeline)
  - Documenter les patterns responsive
  - Créer des exemples d'utilisation Bento Grid
  - _Requirements: 17.1, 17.2, 17.3, Bento-14.2, Bento-14.5_

- [ ] 42. Documenter les breaking changes
  - Lister les changements d'API
  - Lister les changements de structure
  - Documenter les nouvelles dépendances
  - _Requirements: 15.4_

- [ ] 43. Créer la documentation utilisateur
  - Mettre à jour le README
  - Documenter les nouvelles fonctionnalités
  - Créer des guides d'utilisation
  - _Requirements: 15.1, 15.2_

- [ ] 44. Créer un plan de rollback
  - Documenter comment revenir en arrière
  - Créer des scripts de backup
  - Documenter les points de restauration
  - _Requirements: 15.5_

- [ ] 45. Validation finale
  - Revue complète du code
  - Vérification de tous les tests
  - Validation par l'équipe
  - Préparation du déploiement
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_
