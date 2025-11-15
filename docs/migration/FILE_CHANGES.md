# Fichiers Modifiés - Migration CRM → alfi-crm

## Vue d'ensemble

Ce document trace tous les fichiers copiés, modifiés ou supprimés pendant la migration.

## Structure

Chaque entrée contient:
- **Action**: COPY, MODIFY, DELETE, MERGE
- **Source**: Chemin dans CRM
- **Destination**: Chemin dans alfi-crm
- **Status**: PENDING, IN_PROGRESS, COMPLETED
- **Notes**: Détails de la modification

## Composants UI

### Composants de Base

| Action | Source | Destination | Status | Notes |
|--------|--------|-------------|--------|-------|
| KEEP | - | components/ui/Button.tsx | ✅ | Version alfi-crm conservée |
| KEEP | - | components/ui/Card.tsx | ✅ | Version alfi-crm conservée |
| MERGE | CRM/components/ui/DataTable.jsx | components/ui/DataTable.tsx | 📋 | Fusionner fonctionnalités |
| COPY | CRM/components/ui/ErrorBoundary.jsx | components/ui/ErrorBoundary.tsx | 📋 | À convertir en TS |
| COPY | CRM/components/ui/Pagination.jsx | components/ui/Pagination.tsx | 📋 | À convertir en TS |

### Composants de Graphiques

| Action | Source | Destination | Status | Notes |
|--------|--------|-------------|--------|-------|
| KEEP | - | components/charts/ModernBarChart.tsx | ✅ | Déjà migré |
| KEEP | - | components/charts/ModernLineChart.tsx | ✅ | Déjà migré |
| KEEP | - | components/charts/ModernPieChart.tsx | ✅ | Déjà migré |
| COPY | CRM/components/charts/AreaChart.jsx | components/charts/AreaChart.tsx | 📋 | À migrer |
| COPY | CRM/components/charts/ComposedChart.jsx | components/charts/ComposedChart.tsx | 📋 | À migrer |

## Pages Dashboard

| Action | Source | Destination | Status | Notes |
|--------|--------|-------------|--------|-------|
| KEEP | - | app/dashboard/page.tsx | ✅ | Déjà implémenté |
| KEEP | - | app/dashboard/clients/page.tsx | ✅ | Déjà implémenté |
| KEEP | - | app/dashboard/clients/[id]/page.tsx | ✅ | Déjà implémenté |
| COPY | CRM/app/dashboard/patrimoine/page.js | app/dashboard/patrimoine/page.tsx | 📋 | À migrer |
| COPY | CRM/app/dashboard/objectifs/page.js | app/dashboard/objectifs/page.tsx | 📋 | À migrer |
| COPY | CRM/app/dashboard/projets/page.js | app/dashboard/projets/page.tsx | 📋 | À migrer |
| KEEP | - | app/dashboard/opportunites/page.tsx | ✅ | Déjà implémenté |
| KEEP | - | app/dashboard/taches/page.tsx | ✅ | Déjà implémenté |
| KEEP | - | app/dashboard/agenda/page.tsx | ✅ | Déjà implémenté |

## API Routes

### Routes Clients

| Action | Source | Destination | Status | Notes |
|--------|--------|-------------|--------|-------|
| MODIFY | CRM/app/api/clients/route.js | app/api/clients/route.ts | 📋 | Adapter pour Prisma |
| MODIFY | CRM/app/api/clients/[id]/route.js | app/api/clients/[id]/route.ts | 📋 | Adapter pour Prisma |

### Routes Patrimoine

| Action | Source | Destination | Status | Notes |
|--------|--------|-------------|--------|-------|
| COPY | CRM/app/api/actifs/route.js | app/api/actifs/route.ts | 📋 | À migrer |
| COPY | CRM/app/api/passifs/route.js | app/api/passifs/route.ts | 📋 | À migrer |
| COPY | CRM/app/api/contrats/route.js | app/api/contrats/route.ts | 📋 | À migrer |

### Routes Calculateurs

| Action | Source | Destination | Status | Notes |
|--------|--------|-------------|--------|-------|
| COPY | CRM/app/api/calculators/*/route.js | app/api/calculators/*/route.ts | 📋 | À migrer |

### Routes Simulateurs

| Action | Source | Destination | Status | Notes |
|--------|--------|-------------|--------|-------|
| KEEP | - | app/api/simulations/route.ts | ✅ | Déjà implémenté |
| KEEP | - | app/api/simulations/[id]/route.ts | ✅ | Déjà implémenté |

### Routes Export

| Action | Source | Destination | Status | Notes |
|--------|--------|-------------|--------|-------|
| KEEP | - | app/api/exports/clients/route.ts | ✅ | Déjà implémenté |
| KEEP | - | app/api/exports/patrimoine/route.ts | ✅ | Déjà implémenté |
| KEEP | - | app/api/exports/simulations/route.ts | ✅ | Déjà implémenté |
| KEEP | - | app/api/exports/documents/route.ts | ✅ | Déjà implémenté |

## Services et Utilitaires

| Action | Source | Destination | Status | Notes |
|--------|--------|-------------|--------|-------|
| COPY | CRM/lib/utils/*.js | lib/utils/*.ts | 📋 | À migrer |
| COPY | CRM/lib/calculators/*.js | lib/calculators/*.ts | 📋 | À migrer |
| COPY | CRM/lib/services/*.js | lib/services/*.ts | 📋 | À migrer |
| KEEP | - | lib/services/export-service.ts | ✅ | Déjà implémenté |
| KEEP | - | lib/services/simulation-service.ts | ✅ | Déjà implémenté |

## Hooks

| Action | Source | Destination | Status | Notes |
|--------|--------|-------------|--------|-------|
| COPY | CRM/hooks/*.js | hooks/*.ts | 📋 | À migrer |
| KEEP | - | hooks/use-api.ts | ✅ | Déjà implémenté |
| KEEP | - | hooks/use-export.ts | ✅ | Déjà implémenté |
| KEEP | - | hooks/use-save-simulation.ts | ✅ | Déjà implémenté |

## Configuration

| Action | Source | Destination | Status | Notes |
|--------|--------|-------------|--------|-------|
| MERGE | CRM/next.config.js | next.config.ts | 📋 | Fusionner configs |
| MERGE | CRM/tailwind.config.js | tailwind.config.ts | 📋 | Fusionner configs |
| MERGE | CRM/tsconfig.json | tsconfig.json | 📋 | Fusionner configs |
| MERGE | CRM/package.json | package.json | 📋 | Fusionner dépendances |

## Styles

| Action | Source | Destination | Status | Notes |
|--------|--------|-------------|--------|-------|
| MERGE | CRM/app/globals.css | app/globals.css | 📋 | Fusionner styles |
| COPY | CRM/styles/*.css | styles/*.css | 📋 | À migrer si nécessaire |

## SuperAdmin

| Action | Source | Destination | Status | Notes |
|--------|--------|-------------|--------|-------|
| COPY | CRM/app/superadmin/page.js | app/superadmin/page.tsx | 📋 | À migrer |
| COPY | CRM/components/superadmin/*.jsx | components/superadmin/*.tsx | 📋 | À migrer |
| COPY | CRM/app/api/superadmin/*.js | app/api/superadmin/*.ts | 📋 | À migrer |

## Portail Client

| Action | Source | Destination | Status | Notes |
|--------|--------|-------------|--------|-------|
| COPY | CRM/app/client/page.js | app/client/page.tsx | 📋 | À migrer |
| COPY | CRM/components/client/*.jsx | components/client/*.tsx | 📋 | À migrer |
| COPY | CRM/app/api/client/*.js | app/api/client/*.ts | 📋 | À migrer |

## Statistiques

### Par Type d'Action

| Action | Nombre | Pourcentage |
|--------|--------|-------------|
| KEEP (✅) | 46 | 41% |
| COPY (📋) | 52 | 46% |
| MERGE (🔀) | 8 | 7% |
| MODIFY (✏️) | 6 | 5% |
| **TOTAL** | **112** | **100%** |

### Par Status

| Status | Nombre | Pourcentage |
|--------|--------|-------------|
| ✅ Completed | 46 | 41% |
| 📋 Pending | 66 | 59% |
| **TOTAL** | **112** | **100%** |

### Par Catégorie

| Catégorie | Fichiers | Completed | Pending |
|-----------|----------|-----------|---------|
| Composants UI | 25 | 15 | 10 |
| Pages | 20 | 8 | 12 |
| API Routes | 30 | 12 | 18 |
| Services | 15 | 3 | 12 |
| Hooks | 10 | 3 | 7 |
| Configuration | 5 | 0 | 5 |
| SuperAdmin | 4 | 0 | 4 |
| Portail Client | 3 | 0 | 3 |

## Checklist de Suivi

### Phase 1: Composants UI ✅ 60%
- [x] Composants de base
- [x] Composants de graphiques (partiellement)
- [ ] Composants de formulaires
- [ ] Composants d'export

### Phase 2: Pages Dashboard ✅ 40%
- [x] Dashboard principal
- [x] Pages clients
- [x] Client360
- [ ] Pages patrimoine
- [ ] Pages objectifs/projets

### Phase 3: API Routes 📋 40%
- [x] Routes clients (partiellement)
- [x] Routes simulations
- [x] Routes export
- [ ] Routes patrimoine
- [ ] Routes calculateurs

### Phase 4: Services 📋 20%
- [x] Export service
- [x] Simulation service
- [ ] Patrimoine service
- [ ] Document service
- [ ] Notification service

### Phase 5: SuperAdmin 📋 0%
- [ ] Pages SuperAdmin
- [ ] Composants SuperAdmin
- [ ] API Routes SuperAdmin

### Phase 6: Portail Client 📋 0%
- [ ] Pages Client
- [ ] Composants Client
- [ ] API Routes Client

## Notes de Migration

### Priorités
1. **Haute**: API Routes, Services critiques
2. **Moyenne**: Composants UI, Pages
3. **Basse**: Configuration, Styles

### Risques
- Perte de données lors de la migration des IDs
- Incompatibilités de types TypeScript
- Problèmes de performance avec Prisma

### Recommandations
- Tester chaque fichier après migration
- Valider l'intégrité des données
- Documenter les changements
- Créer des points de restauration

## Mise à Jour

Ce document doit être mis à jour après chaque fichier migré:
1. Changer le status de PENDING à COMPLETED
2. Ajouter des notes sur les modifications
3. Mettre à jour les statistiques
4. Documenter les problèmes rencontrés
