# Mapping des Composants - CRM → alfi-crm

## Vue d'ensemble

Ce document liste tous les composants à migrer et leur stratégie de fusion.

## Stratégies de Fusion

- **KEEP_ALFI**: Garder le composant existant dans alfi-crm
- **KEEP_CRM**: Remplacer par le composant du CRM source
- **MERGE**: Fusionner les deux versions
- **COPY**: Copier tel quel (pas de doublon)

## Composants UI de Base

### Composants Existants dans les Deux Projets

| Composant | CRM Source | alfi-crm | Stratégie | Raison |
|-----------|------------|----------|-----------|--------|
| Button | ✅ | ✅ | KEEP_ALFI | Version alfi-crm plus moderne avec variants TypeScript |
| Card | ✅ | ✅ | KEEP_ALFI | Déjà bien implémenté dans alfi-crm |
| Input | ✅ | ✅ | KEEP_ALFI | Version alfi-crm avec meilleure validation |
| Select | ✅ | ✅ | KEEP_ALFI | Version alfi-crm plus complète |
| Dialog | ✅ | ✅ | KEEP_ALFI | Implémentation moderne dans alfi-crm |
| Toast | ✅ | ✅ | KEEP_ALFI | Système de notifications déjà en place |
| Skeleton | ✅ | ✅ | KEEP_ALFI | Version alfi-crm suffisante |
| Badge | ✅ | ✅ | KEEP_ALFI | Déjà implémenté dans alfi-crm |
| Avatar | ✅ | ✅ | KEEP_ALFI | Version alfi-crm moderne |
| Tabs | ✅ | ✅ | KEEP_ALFI | Implémentation complète dans alfi-crm |

### Composants Uniques au CRM Source

| Composant | Chemin CRM | Destination alfi-crm | Stratégie |
|-----------|------------|---------------------|-----------|
| DataTable | components/ui/DataTable.jsx | components/ui/DataTable.tsx | MERGE |
| ErrorBoundary | components/ui/ErrorBoundary.jsx | components/ui/ErrorBoundary.tsx | COPY |
| LoadingSpinner | components/ui/LoadingSpinner.jsx | components/ui/LoadingSpinner.tsx | KEEP_ALFI |
| Modal | components/ui/Modal.jsx | components/ui/Modal.tsx | KEEP_ALFI |
| Pagination | components/ui/Pagination.jsx | components/ui/Pagination.tsx | ✅ Migré (Task 5) |
| VirtualList | components/ui/VirtualList.jsx | components/ui/VirtualList.tsx | ✅ Migré (Task 5) |
| LazyImage | components/ui/LazyImage.jsx | components/ui/LazyImage.tsx | ✅ Migré (Task 5) |
| Stepper | components/ui/Stepper.jsx | components/ui/Stepper.tsx | ✅ Migré (Task 5) |
| Combobox | components/ui/Combobox.jsx | components/ui/Combobox.tsx | ✅ Migré (Task 5) |

## Composants de Graphiques

| Composant | CRM Source | alfi-crm | Stratégie | Notes |
|-----------|------------|----------|-----------|-------|
| ModernBarChart | ✅ | ✅ | KEEP_ALFI | Version alfi-crm déjà migrée |
| ModernLineChart | ✅ | ✅ | KEEP_ALFI | Version alfi-crm déjà migrée |
| ModernPieChart | ✅ | ✅ | KEEP_ALFI | Version alfi-crm déjà migrée |
| AreaChart | ✅ | ❌ | COPY | Manquant dans alfi-crm |
| ComposedChart | ✅ | ❌ | COPY | Manquant dans alfi-crm |

## Composants Dashboard

| Composant | CRM Source | alfi-crm | Stratégie | Notes |
|-----------|------------|----------|-----------|-------|
| DashboardHeader | ✅ | ✅ | KEEP_ALFI | Déjà implémenté |
| NavigationSidebar | ✅ | ✅ | KEEP_ALFI | Déjà implémenté |
| ServicesSidebar | ✅ | ✅ | KEEP_ALFI | Déjà implémenté |
| CommandPalette | ✅ | ✅ | KEEP_ALFI | Déjà implémenté |
| NotificationCenter | ✅ | ✅ | KEEP_ALFI | Déjà implémenté |
| KPICard | ✅ | ❌ | COPY | À migrer |
| StatCard | ✅ | ✅ | COPY | ✅ Migré (Task 5) |
| MetricCard | ✅ | ✅ | COPY | ✅ Migré (Task 5) |
| QuickActions | ✅ | ✅ | COPY | ✅ Migré (Task 5) |

## Composants Client360

| Composant | CRM Source | alfi-crm | Stratégie | Notes |
|-----------|------------|----------|-----------|-------|
| TabOverview | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| TabProfile | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| TabKYC | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| TabWealth | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| TabDocuments | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| TabObjectives | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| TabOpportunities | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| TabTimeline | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| ClientHeader | ✅ | ❌ | COPY | À migrer |
| WealthSummary | ✅ | ❌ | COPY | À migrer |
| AssetAllocation | ✅ | ❌ | COPY | À migrer |

## Composants Clients

| Composant | CRM Source | alfi-crm | Stratégie | Notes |
|-----------|------------|----------|-----------|-------|
| CreateClientModal | ✅ | ✅ | KEEP_ALFI | Déjà implémenté |
| ClientList | ✅ | ❌ | COPY | À migrer |
| ClientCard | ✅ | ❌ | COPY | À migrer |
| ClientFilters | ✅ | ❌ | COPY | À migrer |
| ClientSearch | ✅ | ❌ | COPY | À migrer |

## Calculateurs

| Composant | CRM Source | alfi-crm | Stratégie | Notes |
|-----------|------------|----------|-----------|-------|
| IncomeTaxCalculator | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| CapitalGainsTaxCalculator | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| WealthTaxCalculator | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| InheritanceTaxCalculator | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| DonationTaxCalculator | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| BudgetAnalyzer | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| DebtCapacityCalculator | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| ObjectiveCalculator | ✅ | ❌ | COPY | À migrer |
| MultiObjectiveCalculator | ✅ | ❌ | COPY | À migrer |
| HomePurchaseCalculator | ✅ | ❌ | COPY | À migrer |

## Simulateurs

| Composant | CRM Source | alfi-crm | Stratégie | Notes |
|-----------|------------|----------|-----------|-------|
| RetirementSimulator | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| PensionEstimator | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| RetirementComparison | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| SuccessionSimulator | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| SuccessionComparison | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| DonationOptimizer | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| TaxProjector | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| TaxStrategyComparison | ✅ | ✅ | KEEP_ALFI | Déjà migré |
| InvestmentVehicleComparison | ✅ | ✅ | KEEP_ALFI | Déjà migré |

## Composants d'Export

| Composant | CRM Source | alfi-crm | Stratégie | Notes |
|-----------|------------|----------|-----------|-------|
| ExportModal | ✅ | ✅ | KEEP_ALFI | Déjà implémenté |
| PDFExport | ✅ | ❌ | COPY | À migrer |
| ExcelExport | ✅ | ❌ | COPY | À migrer |
| CSVExport | ✅ | ❌ | COPY | À migrer |

## Composants SuperAdmin

| Composant | CRM Source | alfi-crm | Stratégie | Notes |
|-----------|------------|----------|-----------|-------|
| SuperAdminDashboard | ✅ | ❌ | COPY | À migrer |
| OrganizationList | ✅ | ❌ | COPY | À migrer |
| CreateOrganizationModal | ✅ | ❌ | COPY | À migrer |
| QuotaEditor | ✅ | ❌ | COPY | À migrer |
| AuditLogViewer | ✅ | ❌ | COPY | À migrer |

## Composants Portail Client

| Composant | CRM Source | alfi-crm | Stratégie | Notes |
|-----------|------------|----------|-----------|-------|
| ClientDashboard | ✅ | ❌ | COPY | À migrer |
| ClientPatrimoine | ✅ | ❌ | COPY | À migrer |
| ClientDocuments | ✅ | ❌ | COPY | À migrer |
| ClientMessages | ✅ | ❌ | COPY | À migrer |
| ClientProfile | ✅ | ❌ | COPY | À migrer |

## Composants de Formulaires

| Composant | CRM Source | alfi-crm | Stratégie | Notes |
|-----------|------------|----------|-----------|-------|
| FormField | ✅ | ✅ | KEEP_ALFI | Version alfi-crm avec React Hook Form |
| FormSelect | ✅ | ✅ | KEEP_ALFI | Déjà implémenté |
| FormDatePicker | ✅ | ❌ | COPY | À migrer |
| FormFileUpload | ✅ | ❌ | COPY | À migrer |
| FormMultiSelect | ✅ | ❌ | COPY | À migrer |

## Statistiques de Migration

### Composants par Catégorie

| Catégorie | Total CRM | Déjà dans alfi-crm | À Copier | À Merger | Migrés Task 5 |
|-----------|-----------|-------------------|----------|----------|---------------|
| UI Base | 15 | 10 | 3 | 2 | +8 ✅ |
| Graphiques | 5 | 3 | 2 | 0 | 0 |
| Dashboard | 8 | 5 | 3 | 0 | +3 ✅ |
| Client360 | 11 | 8 | 3 | 0 | 0 |
| Clients | 5 | 1 | 4 | 0 | 0 |
| Calculateurs | 10 | 7 | 3 | 0 | 0 |
| Simulateurs | 9 | 9 | 0 | 0 | 0 |
| Export | 4 | 1 | 3 | 0 | 0 |
| SuperAdmin | 5 | 0 | 5 | 0 | 0 |
| Portail Client | 5 | 0 | 5 | 0 | 0 |
| Formulaires | 5 | 2 | 3 | 0 | 0 |
| **TOTAL** | **82** | **46** | **34** | **2** | **+8** |

### Progression

- ✅ Composants déjà migrés: **54/82 (66%)** ⬆️ +8 depuis Task 5
- 📋 Composants à copier: **26/82 (32%)** ⬇️ -8 depuis Task 5
- 🔀 Composants à merger: **2/82 (2%)**

### Task 5 Complete ✅
- StatCard migré en TypeScript
- MetricCard migré en TypeScript
- QuickActions migré en TypeScript
- Pagination migré en TypeScript avec ARIA
- LazyImage migré en TypeScript
- VirtualList migré en TypeScript avec génériques
- Stepper migré en TypeScript
- Combobox migré en TypeScript avec ARIA

## Priorités de Migration

### Priorité 1 (Critique)
- DataTable (MERGE)
- ClientList, ClientCard, ClientFilters
- SuperAdmin components

### Priorité 2 (Important)
- Composants d'export (PDF, Excel, CSV)
- Composants de formulaires manquants
- Portail Client components

### Priorité 3 (Nice to have)
- Graphiques additionnels
- Composants de dashboard additionnels

## Notes de Migration

### DataTable
- Merger les fonctionnalités de tri/filtrage du CRM avec la version TypeScript d'alfi-crm
- Conserver la pagination côté serveur
- Ajouter le support des actions en masse

### Composants SuperAdmin
- Adapter pour utiliser Prisma
- Implémenter RLS pour l'isolation des données
- Ajouter les logs d'audit

### Portail Client
- Implémenter l'authentification séparée
- Restreindre les permissions en lecture seule
- Ajouter la messagerie sécurisée

## Checklist de Migration par Composant

Pour chaque composant à migrer:

- [ ] Copier le fichier source
- [ ] Convertir en TypeScript si nécessaire
- [ ] Adapter les imports
- [ ] Remplacer les appels MongoDB par Prisma
- [ ] Ajouter les types TypeScript
- [ ] Tester le composant
- [ ] Mettre à jour la documentation
- [ ] Marquer comme migré dans ce document
