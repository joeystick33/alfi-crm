# Implementation Plan - CRM Frontend Complet

## Phase 1: Infrastructure & Composants de Base

- [x] 1. Setup projet et dépendances
  - Installer les dépendances UI (Radix UI, Recharts, React Query, Framer Motion)
  - Configurer Tailwind CSS avec le design system
  - Configurer TypeScript strict mode
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 2. Créer les composants UI de base
  - Créer `components/ui/Button.tsx` avec variants (primary, secondary, outline, ghost)
  - Créer `components/ui/Input.tsx` avec validation
  - Créer `components/ui/Select.tsx` avec recherche
  - Créer `components/ui/Card.tsx` avec header/content/footer
  - Créer `components/ui/Badge.tsx` avec variants de couleur
  - Créer `components/ui/Modal.tsx` (Dialog) avec animations
  - Créer `components/ui/Toast.tsx` pour notifications
  - Créer `components/ui/Skeleton.tsx` pour loading states
  - Créer `components/ui/DataTable.tsx` avec tri/filtres/pagination
  - Créer `components/ui/Tabs.tsx` pour navigation par onglets
  - _Requirements: 13.3, 13.6_

- [x] 3. Créer le client API
  - Créer `lib/api-client.ts` avec fonction `apiCall()`
  - Gérer les erreurs HTTP (401, 403, 404, 500)
  - Ajouter retry logic pour erreurs réseau
  - Intégrer avec NextAuth pour authentification
  - _Requirements: 16.1, 16.9_

- [x] 4. Configurer React Query
  - Créer `lib/react-query-config.ts` avec QueryClient
  - Configurer cache times et stale times
  - Créer hooks personnalisés (`useClients`, `useClient`, etc.)
  - _Requirements: 13.5_

## Phase 2: Layout Dashboard & Navigation

- [x] 5. Créer le layout dashboard principal
  - Créer `app/dashboard/layout.tsx` avec structure 2 sidebars
  - Gérer l'état d'expansion des sidebars (hover)
  - Intégrer NextAuth pour session utilisateur
  - Charger les compteurs temps réel depuis `/api/dashboard/counters`
  - _Requirements: 1.1, 1.2, 1.7_

- [x] 6. Créer la sidebar de navigation (gauche)
  - Créer `components/dashboard/NavigationSidebar.tsx`
  - Implémenter les 6 sections (Pilotage, Portefeuille, Commercial, Organisation, Outils, Conformité)
  - Afficher les badges avec compteurs dynamiques
  - Gérer l'état actif et l'expansion des sous-menus
  - Ajouter les icônes Lucide pour chaque item
  - _Requirements: 1.3, 1.4_

- [x] 7. Créer la sidebar de services (droite)
  - Créer `components/dashboard/ServicesSidebar.tsx`
  - Afficher les statistiques des services
  - Implémenter les actions contextuelles selon la page
  - Gérer l'état d'expansion
  - _Requirements: 1.1_

- [x] 8. Créer le header dashboard
  - Créer `components/dashboard/DashboardHeader.tsx`
  - Intégrer la recherche globale
  - Ajouter les boutons d'actions rapides
  - Afficher les notifications avec badge
  - Intégrer le mode présentation (Ctrl+H)
  - _Requirements: 1.5, 1.6, 14.1, 14.2, 14.3_

- [x] 9. Créer la command palette
  - Créer `components/dashboard/CommandPalette.tsx`
  - Implémenter la recherche fuzzy
  - Ajouter les raccourcis clavier (Ctrl+K)
  - Navigation rapide vers clients, documents, tâches
  - _Requirements: 1.5_

- [x] 10. Créer le centre de notifications
  - Créer `components/dashboard/NotificationCenter.tsx`
  - Charger les notifications depuis `/api/notifications`
  - Catégoriser par type (Task, KYC, Contract, etc.)
  - Marquer comme lu au clic
  - Afficher les toasts pour notifications temps réel
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

## Phase 3: Gestion des Clients

- [ ] 11. Créer la page liste clients
  - Créer `app/dashboard/clients/page.tsx`
  - Charger les clients depuis `/api/clients` avec pagination
  - Implémenter les filtres (type, statut, conseiller)
  - Ajouter la recherche par nom/email
  - Afficher les cartes clients avec infos clés
  - _Requirements: 2.1, 2.6_

- [ ] 12. Créer le modal de création client
  - Créer `components/clients/CreateClientModal.tsx`
  - Étape 1: Sélection type (Particulier/Professionnel)
  - Étape 2: Formulaire adapté au type
  - Valider les champs requis
  - Envoyer POST `/api/clients` avec les données
  - Rafraîchir la liste après création
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [ ] 13. Créer les composants clients
  - Créer `components/clients/ClientCard.tsx` pour affichage carte
  - Créer `components/clients/ClientFilters.tsx` pour filtres
  - Créer `components/clients/ClientTable.tsx` pour vue tableau
  - Créer `components/clients/ClientBadges.tsx` pour type/statut
  - _Requirements: 2.6_

## Phase 4: Vue Client 360°

- [ ] 14. Créer la page Client 360°
  - Créer `app/dashboard/clients/[id]/page.tsx`
  - Charger le client enrichi depuis `/api/clients/[id]?include=all`
  - Afficher le header client avec photo, infos, KPIs
  - Implémenter la navigation par onglets
  - Gérer les actions contextuelles (Éditer, Exporter, etc.)
  - _Requirements: 3.1, 3.2, 3.7_

- [ ] 15. Créer l'onglet Vue d'ensemble
  - Créer `components/client360/TabOverview.tsx`
  - Afficher les KPIs (Patrimoine net, géré, score KYC)
  - Intégrer Recharts pour graphiques (Pie, Line)
  - Afficher les alertes prioritaires
  - Afficher la timeline récente
  - _Requirements: 3.3_

- [ ] 16. Créer l'onglet Profil & Famille
  - Créer `components/client360/TabProfile.tsx`
  - Afficher les informations personnelles
  - Afficher les membres de la famille
  - Afficher le profil investisseur MIF II
  - Afficher les informations fiscales
  - Permettre l'édition inline avec auto-save
  - _Requirements: 3.4, 3.7_

- [ ] 17. Créer l'onglet Patrimoine
  - Créer `components/client360/TabWealth.tsx`
  - Implémenter les sous-onglets (Actifs, Passifs, Contrats, Synthèse)
  - Charger les actifs depuis `/api/clients/[id]/actifs`
  - Charger les passifs depuis `/api/clients/[id]/passifs`
  - Charger les contrats depuis `/api/clients/[id]/contrats`
  - Calculer et afficher le patrimoine net automatiquement
  - Afficher les graphiques d'allocation
  - _Requirements: 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 18. Créer l'onglet Documents (GED)
  - Créer `components/client360/TabDocuments.tsx`
  - Charger les documents depuis `/api/clients/[id]/documents`
  - Afficher le score de complétude documentaire
  - Catégoriser les documents (7 catégories)
  - Implémenter le drag & drop pour upload
  - Gérer le versioning automatique
  - Afficher les alertes d'expiration
  - Permettre la liaison avec GED externe
  - Implémenter la prévisualisation et téléchargement
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [ ] 19. Créer l'onglet KYC & Conformité
  - Créer `components/client360/TabKYC.tsx`
  - Charger les données KYC depuis `/api/clients/[id]/kyc`
  - Afficher le score de complétion KYC
  - Afficher le statut avec badges colorés
  - Afficher le profil MIF II complet
  - Afficher les informations LCB-FT (PEP, origine fonds)
  - Afficher les documents justificatifs avec statuts
  - Créer le formulaire de mise à jour KYC
  - Envoyer PATCH `/api/clients/[id]/kyc` pour mise à jour
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 20. Créer l'onglet Objectifs & Projets
  - Créer `components/client360/TabObjectives.tsx`
  - Charger les objectifs depuis `/api/clients/[id]/objectifs`
  - Charger les projets depuis `/api/clients/[id]/projets`
  - Afficher les objectifs avec progress bars
  - Afficher les projets avec statuts
  - Permettre la création/édition d'objectifs et projets
  - Afficher les recommandations IA
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 21. Créer l'onglet Opportunités
  - Créer `components/client360/TabOpportunities.tsx`
  - Charger les opportunités depuis `/api/clients/[id]/opportunites`
  - Afficher le score et la confiance
  - Implémenter la vue pipeline (Kanban)
  - Permettre le changement de statut par drag & drop
  - Gérer la conversion en projet
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 22. Créer l'onglet Activité & Historique
  - Créer `components/client360/TabTimeline.tsx`
  - Charger la timeline depuis `/api/clients/[id]/timeline`
  - Afficher les événements chronologiquement
  - Filtrer par type d'événement
  - Afficher les détails au clic
  - _Requirements: 3.3_

- [ ] 23. Créer l'onglet Reporting
  - Créer `components/client360/TabReporting.tsx`
  - Lister les rapports disponibles
  - Permettre la génération de rapports PDF
  - Intégrer avec le service d'export
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 24. Créer l'onglet Paramètres
  - Créer `components/client360/TabSettings.tsx`
  - Gérer l'accès portail client
  - Gérer les préférences de contact
  - Gérer l'assignation conseiller/remplaçant
  - Permettre l'archivage du client
  - _Requirements: 3.2_

## Phase 5: Opérationnel (Tâches, Agenda, Projets)

- [ ] 25. Créer la page Tâches
  - Créer `app/dashboard/taches/page.tsx`
  - Charger les tâches depuis `/api/taches`
  - Filtrer par statut, priorité, date
  - Afficher les tâches en retard avec badges rouges
  - Permettre la création/édition de tâches
  - Lier les tâches aux clients et projets
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 26. Créer la page Agenda
  - Créer `app/dashboard/agenda/page.tsx`
  - Charger les rendez-vous depuis `/api/rendez-vous`
  - Implémenter les vues (jour, semaine, mois)
  - Permettre la création de rendez-vous
  - Gérer les rappels
  - Intégrer avec calendriers externes (Google, Outlook)
  - _Requirements: 9.4, 9.5, 9.6_

- [ ] 27. Créer la page Projets
  - Créer `app/dashboard/projets/page.tsx`
  - Charger les projets depuis `/api/projets`
  - Afficher les projets avec statuts et progress
  - Permettre la création/édition de projets
  - Lier les tâches aux projets
  - _Requirements: 7.4, 7.5_

- [ ] 28. Créer la page Opportunités
  - Créer `app/dashboard/opportunites/page.tsx`
  - Charger les opportunités depuis `/api/opportunites`
  - Implémenter la vue pipeline (Kanban)
  - Afficher les scores et priorités
  - Gérer la conversion en projet
  - _Requirements: 8.1, 8.2, 8.3_

## Phase 6: Calculateurs & Simulateurs

- [ ] 29. Créer la page hub Calculateurs
  - Créer `app/dashboard/calculators/page.tsx`
  - Afficher les catégories (Fiscalité, Budget, Objectifs)
  - Lister tous les calculateurs disponibles
  - Permettre l'accès rapide à chaque calculateur
  - _Requirements: 10.1_

- [ ] 30. Créer la page hub Simulateurs
  - Créer `app/dashboard/simulators/page.tsx`
  - Afficher les catégories (Retraite, Succession, Fiscalité)
  - Lister tous les simulateurs disponibles
  - Permettre l'accès rapide à chaque simulateur
  - _Requirements: 10.2_

- [ ] 31. Intégrer les calculateurs fiscaux
  - Copier `IncomeTaxCalculator.tsx` depuis CRM ancien
  - Copier `CapitalGainsTaxCalculator.tsx`
  - Copier `WealthTaxCalculator.tsx`
  - Copier `DonationTaxCalculator.tsx`
  - Copier `InheritanceTaxCalculator.tsx`
  - Adapter pour utiliser les services Prisma existants
  - _Requirements: 10.6_

- [ ] 32. Intégrer les calculateurs budget/objectifs
  - Copier `BudgetAnalyzer.tsx` depuis CRM ancien
  - Copier `DebtCapacityCalculator.tsx`
  - Copier `ObjectiveCalculator.tsx`
  - Copier `MultiObjectivePlanner.tsx`
  - Copier `EducationFundingCalculator.tsx`
  - Copier `HomePurchaseCalculator.tsx`
  - Adapter pour utiliser les services Prisma existants
  - _Requirements: 10.6_

- [ ] 33. Intégrer les simulateurs retraite
  - Copier `RetirementSimulator.tsx` depuis CRM ancien
  - Copier `PensionEstimator.tsx`
  - Copier `RetirementComparison.tsx`
  - Adapter pour utiliser les services Prisma existants
  - _Requirements: 10.7_

- [ ] 34. Intégrer les simulateurs succession
  - Copier `SuccessionSimulator.jsx` depuis CRM ancien
  - Copier `SuccessionComparison.jsx`
  - Copier `DonationOptimizer.jsx`
  - Adapter pour utiliser les services Prisma existants
  - _Requirements: 10.7_

- [ ] 35. Intégrer les simulateurs fiscaux
  - Copier `TaxProjector.tsx` depuis CRM ancien
  - Copier `TaxStrategyComparison.jsx`
  - Copier `InvestmentVehicleComparison.jsx`
  - Adapter pour utiliser les services Prisma existants
  - _Requirements: 10.7_

- [ ] 36. Créer le système de sauvegarde des simulations
  - Permettre de sauvegarder les résultats dans le dossier client
  - Envoyer POST `/api/simulations` avec les données
  - Lier la simulation au client
  - Afficher l'historique des simulations
  - _Requirements: 10.4_

## Phase 7: Exports & Reporting

- [ ] 37. Créer le service d'export frontend
  - Créer `components/exports/ExportButton.tsx`
  - Créer `components/exports/ExportModal.tsx`
  - Permettre la sélection du format (CSV, Excel, PDF)
  - Intégrer avec `/api/exports/*`
  - Gérer le téléchargement automatique
  - _Requirements: 11.1, 11.2_

- [ ] 38. Implémenter les exports PDF
  - Intégrer le branding cabinet (logo, couleurs)
  - Générer des rapports professionnels
  - Inclure graphiques et tableaux
  - Support multi-langue (FR/EN)
  - _Requirements: 11.3, 11.4, 11.5_

## Phase 8: Sécurité & Permissions

- [ ] 39. Implémenter le système de permissions
  - Créer `lib/permissions.ts` avec vérifications RBAC
  - Gérer les rôles (ADMIN, ADVISOR, ASSISTANT)
  - Masquer les fonctionnalités selon le rôle
  - Afficher "Accès refusé" si non autorisé
  - _Requirements: 12.2, 12.3, 12.5_

- [ ] 40. Implémenter l'audit logging
  - Logger toutes les actions sensibles
  - Envoyer à `/api/audit` pour persistance
  - Afficher les logs dans l'interface admin
  - _Requirements: 12.4, 16.10_

- [ ] 41. Vérifier l'isolation multi-tenant
  - Tester que les données sont filtrées par cabinetId
  - Vérifier que RLS fonctionne correctement
  - Tester avec plusieurs cabinets
  - _Requirements: 12.1, 16.8_

## Phase 9: Performance & UX

- [ ] 42. Optimiser les performances
  - Implémenter React Query avec cache
  - Ajouter optimistic updates
  - Implémenter lazy loading pour composants lourds
  - Ajouter infinite scroll pour listes longues
  - _Requirements: 13.2, 13.4, 13.5_

- [ ] 43. Améliorer les loading states
  - Ajouter des skeletons partout
  - Gérer les états vides (pas de données)
  - Afficher des messages d'erreur clairs
  - Ajouter des retry buttons
  - _Requirements: 13.3, 13.8_

- [ ] 44. Rendre responsive
  - Tester sur tablette (iPad)
  - Adapter les tableaux pour mobile
  - Adapter les graphiques
  - Tester les modals sur petit écran
  - _Requirements: 13.6_

## Phase 10: Seed Data & Tests

- [ ] 45. Créer le script de seed
  - Créer `prisma/seed.ts`
  - Créer 1 cabinet de test
  - Créer 2 users (admin + advisor)
  - Créer 5 clients (3 particuliers + 2 professionnels)
  - Créer 10 actifs, 5 passifs, 8 contrats
  - Créer 15 documents, 5 objectifs, 3 projets
  - Créer 10 tâches, 5 rendez-vous
  - Utiliser des données françaises réalistes
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [ ]* 46. Écrire les tests unitaires
  - Tester les composants UI de base
  - Tester les hooks personnalisés
  - Tester les utilitaires
  - Viser 80% de couverture
  - _Requirements: 13.1_

- [ ]* 47. Écrire les tests d'intégration
  - Tester le flux de création client
  - Tester le flux de création document
  - Tester le flux de mise à jour KYC
  - Tester les calculs patrimoine
  - _Requirements: 13.1_

- [ ]* 48. Écrire les tests de sécurité
  - Tester l'isolation RLS
  - Tester les permissions RBAC
  - Tester l'audit logging
  - _Requirements: 12.1, 12.2, 12.4_

## Phase 11: Documentation & Déploiement

- [ ]* 49. Documenter le code
  - Ajouter JSDoc sur toutes les fonctions
  - Documenter les composants avec Storybook
  - Créer un guide de style
  - _Requirements: 13.1_

- [ ]* 50. Préparer le déploiement
  - Configurer les variables d'environnement
  - Optimiser le build Next.js
  - Tester les migrations Prisma
  - Créer un guide de déploiement
  - _Requirements: 13.1_
