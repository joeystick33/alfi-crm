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
  - Créer `components/providers/QueryProvider.tsx` avec QueryClient
  - Configurer cache times et stale times
  - Créer hooks personnalisés dans `hooks/use-api.ts`
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

- [x] 11. Créer la page liste clients
  - Créer `app/dashboard/clients/page.tsx`
  - Charger les clients depuis `/api/clients` avec pagination
  - Implémenter les filtres (type, statut, conseiller)
  - Ajouter la recherche par nom/email
  - Afficher les cartes clients avec infos clés
  - _Requirements: 2.1, 2.6_

- [x] 12. Créer le modal de création client
  - Créer `components/clients/CreateClientModal.tsx`
  - Étape 1: Sélection type (Particulier/Professionnel)
  - Étape 2: Formulaire adapté au type
  - Valider les champs requis
  - Envoyer POST `/api/clients` avec les données
  - Rafraîchir la liste après création
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

- [x] 13. Créer les composants clients
  - Créer `components/clients/ClientCard.tsx` pour affichage carte
  - Créer `components/clients/ClientFilters.tsx` pour filtres
  - Créer `components/clients/ClientTable.tsx` pour vue tableau (si nécessaire)
  - Créer `components/clients/ClientBadges.tsx` pour type/statut (si nécessaire)
  - _Requirements: 2.6_

## Phase 4: Vue Client 360°

- [x] 14. Créer la page Client 360°
  - Créer `app/dashboard/clients/[id]/page.tsx`
  - Charger le client enrichi depuis `/api/clients/[id]?include=all`
  - Afficher le header client avec photo, infos, KPIs
  - Implémenter la navigation par onglets
  - Gérer les actions contextuelles (Éditer, Exporter, etc.)
  - _Requirements: 3.1, 3.2, 3.7_

- [x] 15. Créer l'onglet Vue d'ensemble
  - Créer `components/client360/TabOverview.tsx`
  - Afficher les KPIs (Patrimoine net, géré, score KYC)
  - Intégrer Recharts pour graphiques (Pie, Line)
  - Afficher les alertes prioritaires
  - Afficher la timeline récente
  - _Requirements: 3.3_

- [x] 16. Créer l'onglet Profil & Famille
  - Créer `components/client360/TabProfile.tsx`
  - Afficher les informations personnelles
  - Afficher les membres de la famille
  - Afficher le profil investisseur MIF II
  - Afficher les informations fiscales
  - Permettre l'édition inline avec auto-save
  - _Requirements: 3.4, 3.7_

- [x] 17. Créer l'onglet Patrimoine
  - Créer `components/client360/TabWealth.tsx`
  - Implémenter les sous-onglets (Actifs, Passifs, Contrats, Synthèse)
  - Charger les actifs depuis `/api/actifs?clientId=[id]`
  - Charger les passifs depuis `/api/passifs?clientId=[id]`
  - Charger les contrats depuis `/api/contrats?clientId=[id]`
  - Calculer et afficher le patrimoine net automatiquement
  - Afficher les graphiques d'allocation
  - _Requirements: 3.5, 3.6, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 18. Créer l'onglet Documents (GED)
  - Créer `components/client360/TabDocuments.tsx`
  - Charger les documents depuis `/api/documents?clientId=[id]`
  - Afficher le score de complétude documentaire
  - Catégoriser les documents (7 catégories)
  - Implémenter le drag & drop pour upload
  - Gérer le versioning automatique
  - Afficher les alertes d'expiration
  - Permettre la liaison avec GED externe
  - Implémenter la prévisualisation et téléchargement
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 19. Créer l'onglet KYC & Conformité
  - Créer `components/client360/TabKYC.tsx`
  - Charger les données KYC depuis `/api/kyc?clientId=[id]`
  - Afficher le score de complétion KYC
  - Afficher le statut avec badges colorés
  - Afficher le profil MIF II complet
  - Afficher les informations LCB-FT (PEP, origine fonds)
  - Afficher les documents justificatifs avec statuts
  - Créer le formulaire de mise à jour KYC
  - Envoyer PATCH `/api/kyc/[id]` pour mise à jour
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [x] 20. Créer l'onglet Objectifs & Projets
  - Créer `components/client360/TabObjectives.tsx`
  - Charger les objectifs depuis `/api/objectifs?clientId=[id]`
  - Charger les projets depuis `/api/projets?clientId=[id]`
  - Afficher les objectifs avec progress bars
  - Afficher les projets avec statuts
  - Permettre la création/édition d'objectifs et projets
  - Afficher les recommandations IA
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [x] 21. Créer l'onglet Opportunités
  - Créer `components/client360/TabOpportunities.tsx`
  - Charger les opportunités depuis `/api/opportunites?clientId=[id]`
  - Afficher le score et la confiance
  - Implémenter la vue pipeline (Kanban)
  - Permettre le changement de statut par drag & drop
  - Gérer la conversion en projet
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 22. Créer l'onglet Activité & Historique
  - Créer `components/client360/TabTimeline.tsx`
  - Charger la timeline depuis API timeline service
  - Afficher les événements chronologiquement
  - Filtrer par type d'événement
  - Afficher les détails au clic
  - _Requirements: 3.3_

- [ ] 23. Créer l'onglet Reporting
  - Créer `components/client360/TabReporting.tsx`
  - Lister les rapports disponibles (Fiche client, Patrimoine, Simulations)
  - Intégrer les boutons d'export PDF existants (ExportButton, ExportModal)
  - Permettre la génération de rapports PDF via `/api/exports/pdf/client`
  - Afficher l'historique des rapports générés
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 24. Créer l'onglet Paramètres
  - Créer `components/client360/TabSettings.tsx`
  - Gérer l'accès portail client (activer/désactiver)
  - Gérer les préférences de contact (email, SMS, appel)
  - Gérer l'assignation conseiller principal et remplaçant
  - Gérer l'assignation des assistants
  - Permettre l'archivage du client (changer status à INACTIVE)
  - Afficher les informations de création et dernière modification
  - _Requirements: 3.2_

## Phase 5: Opérationnel (Tâches, Agenda, Projets)

- [x] 25. Créer la page Tâches
  - Créer `app/dashboard/taches/page.tsx`
  - Charger les tâches depuis `/api/taches`
  - Filtrer par statut, priorité, date
  - Afficher les tâches en retard avec badges rouges
  - Permettre la création/édition de tâches
  - Lier les tâches aux clients et projets
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 26. Créer la page Agenda
  - Créer `app/dashboard/agenda/page.tsx`
  - Charger les rendez-vous depuis `/api/rendez-vous`
  - Implémenter les vues (jour, semaine, mois)
  - Permettre la création de rendez-vous
  - Gérer les rappels
  - Intégrer avec calendriers externes (Google, Outlook)
  - _Requirements: 9.4, 9.5, 9.6_

- [x] 27. Créer la page Projets
  - Créer `app/dashboard/projets/page.tsx`
  - Charger les projets depuis `/api/projets`
  - Afficher les projets avec statuts et progress
  - Permettre la création/édition de projets
  - Lier les tâches aux projets
  - _Requirements: 7.4, 7.5_

- [x] 28. Créer la page Opportunités
  - Créer `app/dashboard/opportunites/page.tsx`
  - Charger les opportunités depuis `/api/opportunites`
  - Implémenter la vue pipeline (Kanban)
  - Afficher les scores et priorités
  - Gérer la conversion en projet
  - _Requirements: 8.1, 8.2, 8.3_

## Phase 6: Calculateurs & Simulateurs

- [x] 29. Créer la page hub Calculateurs
  - Créer `app/dashboard/calculators/page.tsx`
  - Afficher les catégories (Fiscalité, Budget, Objectifs)
  - Lister tous les calculateurs disponibles
  - Permettre l'accès rapide à chaque calculateur
  - _Requirements: 10.1_

- [x] 30. Créer la page hub Simulateurs
  - Créer `app/dashboard/simulators/page.tsx`
  - Afficher les catégories (Retraite, Succession, Fiscalité)
  - Lister tous les simulateurs disponibles
  - Permettre l'accès rapide à chaque simulateur
  - _Requirements: 10.2_

- [x] 31. Intégrer les calculateurs fiscaux
  - Créer `alfi-crm/components/calculators/` directory
  - Copier et adapter `IncomeTaxCalculator.tsx` depuis `CRM/components/calculators/`
  - Copier et adapter `CapitalGainsTaxCalculator.tsx`
  - Copier et adapter `WealthTaxCalculator.tsx`
  - Copier et adapter `DonationTaxCalculator.tsx`
  - Copier et adapter `InheritanceTaxCalculator.tsx`
  - Créer les routes de page pour chaque calculateur dans `app/dashboard/calculators/`
  - Adapter pour utiliser les services Prisma existants si nécessaire
  - _Requirements: 10.6_

- [x] 32. Intégrer les calculateurs budget/objectifs
  - Copier et adapter `BudgetAnalyzer.tsx` depuis `CRM/components/calculators/`
  - Copier et adapter `DebtCapacityCalculator.tsx`
  - Copier et adapter `ObjectiveCalculator.tsx`
  - Copier et adapter `MultiObjectivePlanner.tsx`
  - Copier et adapter `EducationFundingCalculator.tsx`
  - Copier et adapter `HomePurchaseCalculator.tsx`
  - Créer les routes de page pour chaque calculateur
  - Adapter pour utiliser les services Prisma existants si nécessaire
  - _Requirements: 10.6_

- [x] 33. Intégrer les simulateurs retraite
  - Créer `alfi-crm/components/simulators/` directory
  - Copier et adapter `RetirementSimulator.tsx` depuis `CRM/components/simulators/`
  - Copier et adapter `PensionEstimator.tsx`
  - Copier et adapter `RetirementComparison.tsx`
  - Créer les routes de page pour chaque simulateur dans `app/dashboard/simulators/`
  - Adapter pour utiliser les services Prisma existants si nécessaire
  - _Requirements: 10.7_

- [x] 34. Intégrer les simulateurs succession
  - Copier et adapter `SuccessionSimulator.jsx` depuis `CRM/components/simulators/`
  - Copier et adapter `SuccessionComparison.jsx`
  - Copier et adapter `DonationOptimizer.jsx`
  - Créer les routes de page pour chaque simulateur
  - Adapter pour utiliser les services Prisma existants si nécessaire
  - _Requirements: 10.7_

- [x] 35. Intégrer les simulateurs fiscaux
  - Copier et adapter `TaxProjector.tsx` depuis `CRM/components/simulators/`
  - Copier et adapter `TaxStrategyComparison.jsx`
  - Copier et adapter `InvestmentVehicleComparison.jsx`
  - Créer les routes de page pour chaque simulateur
  - Adapter pour utiliser les services Prisma existants si nécessaire
  - _Requirements: 10.7_

- [x] 36. Créer le système de sauvegarde des simulations
  - Créer le modèle Simulation dans Prisma schema (si pas déjà existant)
  - Créer `/api/simulations` route pour POST
  - Permettre de sauvegarder les résultats dans le dossier client
  - Lier la simulation au client
  - Afficher l'historique des simulations dans la vue client
  - _Requirements: 10.4_

## Phase 7: Exports & Reporting

- [x] 37. Créer les API routes d'export
  - Copier `CRM/lib/services/export-service.ts` vers `alfi-crm/lib/services/`
  - Adapter pour utiliser Prisma au lieu de MongoDB
  - Créer `/api/exports/clients` route
  - Créer `/api/exports/patrimoine` route
  - Créer `/api/exports/documents` route
  - Créer `/api/exports/simulations` route
  - _Requirements: 11.1, 11.2_

- [x] 38. Créer les composants d'export frontend
  - Créer `components/exports/ExportButton.tsx`
  - Créer `components/exports/ExportModal.tsx`
  - Permettre la sélection du format (CSV, Excel, PDF)
  - Intégrer avec les routes `/api/exports/*`
  - Gérer le téléchargement automatique
  - _Requirements: 11.1, 11.2_

- [x] 39. Implémenter les exports PDF
  - Intégrer le branding cabinet (logo, couleurs)
  - Générer des rapports professionnels
  - Inclure graphiques et tableaux
  - Support multi-langue (FR/EN)
  - _Requirements: 11.3, 11.4, 11.5_

## Phase 8: Sécurité & Permissions

- [x] 40. Implémenter le système de permissions
  - Le fichier `lib/permissions.ts` existe déjà avec vérifications RBAC
  - Gérer les rôles (ADMIN, ADVISOR, ASSISTANT, COMPLIANCE_OFFICER)
  - Masquer les fonctionnalités selon le rôle dans les composants
  - Afficher "Accès refusé" si non autorisé
  - _Requirements: 12.2, 12.3, 12.5_

- [x] 41. Implémenter l'audit logging
  - Le service `lib/services/audit-service.ts` existe déjà
  - Les routes `/api/audit/logs` et `/api/audit/stats` existent
  - Logger toutes les actions sensibles via le service
  - Créer une page admin pour afficher les logs
  - _Requirements: 12.4, 16.10_

- [x] 42. Créer la page admin des logs d'audit
  - Créer le dossier `app/dashboard/admin/audit/`
  - Créer `app/dashboard/admin/audit/page.tsx` avec vérification permission 'canViewAuditLogs'
  - Charger les logs depuis `/api/audit/logs` avec pagination
  - Afficher les statistiques depuis `/api/audit/stats` (total, par action, par entité, top users)
  - Créer des filtres pour: utilisateur (select), action (select), date range (date pickers), type d'entité (select)
  - Afficher les logs dans un DataTable avec colonnes: Date, Utilisateur, Action, Entité, Détails
  - Permettre l'expansion d'une ligne pour voir les changements (JSON)
  - Ajouter un bouton "Exporter les logs" qui télécharge un CSV
  - Afficher un message "Accès refusé" si l'utilisateur n'a pas la permission
  - _Requirements: 12.4, 16.10_

- [x] 43. Vérifier et tester l'isolation multi-tenant (RLS)
  - Créer un script de test `scripts/test-rls.ts` qui vérifie l'isolation
  - Tester que les requêtes API filtrent correctement par cabinetId
  - Vérifier que RLS fonctionne dans Prisma avec setRLSContext
  - Tester avec 2 cabinets différents (créer un 2ème cabinet de test)
  - Vérifier qu'un utilisateur du cabinet A ne peut pas voir les données du cabinet B
  - Tester les cas edge: admin, superadmin, assistant
  - Documenter les résultats des tests dans `docs/RLS_TESTING.md`
  - _Requirements: 12.1, 16.8_

## Phase 9: Performance & UX

- [x] 44. Optimiser les performances
  - Vérifier que React Query est bien configuré avec cache dans toutes les pages
  - Ajouter optimistic updates pour les mutations fréquentes (update client, create task, etc.)
  - Implémenter lazy loading avec React.lazy() pour calculateurs/simulateurs lourds
  - Ajouter infinite scroll pour listes longues (clients, documents, tasks)
  - Mesurer et optimiser les temps de chargement des pages principales
  - _Requirements: 13.2, 13.4, 13.5_

- [x] 45. Améliorer les loading states et error handling
  - Auditer toutes les pages pour vérifier la présence de skeletons pendant le chargement
  - Gérer les états vides (pas de données) avec messages appropriés et CTA
  - Afficher des messages d'erreur clairs et actionnables avec contexte
  - Ajouter des retry buttons sur les erreurs réseau
  - Implémenter des error boundaries pour capturer les erreurs React
  - _Requirements: 13.3, 13.8_

- [ ] 46. Rendre responsive pour tablettes et mobiles
  - Tester toutes les pages sur tablette (iPad) et ajuster si nécessaire
  - Adapter les tableaux pour mobile avec scroll horizontal ou cartes empilées
  - Adapter les graphiques Recharts pour petits écrans (responsive containers)
  - Tester les modals sur petit écran et ajuster la taille/position
  - Adapter la navigation (sidebars) pour mobile avec menu hamburger
  - Tester les formulaires sur mobile (taille des inputs, keyboard)
  - _Requirements: 13.6_

## Phase 10: Seed Data & Tests

- [ ] 47. Créer le script de seed complet
  - Créer `alfi-crm/prisma/seed.ts` avec imports Prisma et bcryptjs
  - Créer 1 cabinet de test "Cabinet ALFI Test" avec configuration complète
  - Créer 2 users: admin@alfi.fr (ADMIN) + conseiller@alfi.fr (ADVISOR) avec mots de passe hashés
  - Créer 5 clients (3 particuliers + 2 professionnels) avec données françaises réalistes
  - Pour chaque client, créer des données liées:
    - 2-3 actifs variés (immobilier, financier, professionnel) avec valeurs réalistes
    - 1-2 passifs (prêts immobiliers, crédits) avec échéanciers
    - 1-2 contrats (assurance vie, PEA, compte-titres) avec dates de renouvellement
    - 3-5 documents avec catégories variées et dates d'expiration
    - 1-2 objectifs avec progress et dates cibles
    - 1 projet avec 2-3 tâches liées
  - Créer 10 tâches globales avec différents statuts (TODO, IN_PROGRESS, COMPLETED)
  - Créer 5 rendez-vous futurs avec rappels
  - Créer 3-5 opportunités avec différents statuts pipeline
  - Créer des données KYC complètes pour 2 clients
  - Utiliser des noms français réalistes (Dupont, Martin, Durand, etc.)
  - Utiliser des adresses françaises réalistes
  - Utiliser des SIRET valides pour professionnels
  - Ajouter script "db:seed": "tsx prisma/seed.ts" dans package.json
  - Rendre le script idempotent (vérifier existence avant création)
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6_

- [ ]* 48. Écrire les tests unitaires
  - Tester les composants UI de base (Button, Input, Select, etc.)
  - Tester les hooks personnalisés (use-api, etc.)
  - Tester les utilitaires (formatters, validators)
  - Viser 80% de couverture
  - _Requirements: 13.1_

- [ ]* 49. Écrire les tests d'intégration
  - Tester le flux de création client
  - Tester le flux de création document
  - Tester le flux de mise à jour KYC
  - Tester les calculs patrimoine
  - _Requirements: 13.1_

- [ ]* 50. Écrire les tests de sécurité
  - Tester l'isolation RLS
  - Tester les permissions RBAC
  - Tester l'audit logging
  - _Requirements: 12.1, 12.2, 12.4_

## Phase 11: Documentation & Déploiement

- [ ]* 51. Documenter le code et l'architecture
  - Ajouter JSDoc sur toutes les fonctions utilitaires dans `lib/`
  - Documenter les hooks personnalisés avec exemples d'utilisation
  - Créer `docs/ARCHITECTURE.md` expliquant la structure du projet
  - Créer `docs/API_INTEGRATION.md` documentant comment utiliser les API routes
  - Créer `docs/COMPONENTS.md` listant tous les composants UI et leur usage
  - Créer `docs/PERMISSIONS.md` expliquant le système RBAC
  - Mettre à jour le README.md principal avec guide de démarrage
  - _Requirements: 13.1_

- [ ]* 52. Préparer le déploiement production
  - Créer `.env.example` avec toutes les variables nécessaires
  - Documenter les variables d'environnement dans `docs/ENVIRONMENT.md`
  - Optimiser next.config.ts pour la production (compression, images, etc.)
  - Tester le build Next.js (`npm run build`) et corriger les erreurs
  - Vérifier que toutes les migrations Prisma sont appliquées
  - Créer `docs/DEPLOYMENT.md` avec guide de déploiement Vercel/Railway
  - Créer un script `scripts/pre-deploy-check.ts` qui vérifie la config
  - Documenter la procédure de rollback en cas de problème
  - _Requirements: 13.1_

---

## Résumé de l'état actuel

**Phases complétées (1-8):** ✅
- Infrastructure & composants de base
- Layout dashboard & navigation
- Gestion des clients
- Vue Client 360° (8/10 onglets)
- Opérationnel (tâches, agenda, projets, opportunités)
- Calculateurs & simulateurs (tous intégrés)
- Exports & reporting (API + composants)
- Sécurité & permissions (système RBAC implémenté)

**Tâches restantes (9-11):**
- 2 onglets Client 360° (Reporting, Paramètres)
- 1 page admin (Audit logs)
- Tests RLS multi-tenant
- Optimisations performance & UX
- Responsive design
- Script de seed complet
- Tests unitaires et d'intégration (optionnels)
- Documentation (optionnelle)

**Total:** 39/52 tâches complétées (75%)
