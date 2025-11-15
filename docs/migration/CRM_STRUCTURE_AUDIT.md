# Audit de la Structure du CRM Source

## Vue d'ensemble

Ce document présente l'audit complet de la structure du CRM source pour planifier la migration vers alfi-crm.

**Date de l'audit**: 14 novembre 2024  
**CRM Source**: MongoDB + Next.js 14  
**Destination**: alfi-crm (Prisma + Supabase + Next.js 14)

## Statistiques Globales

### Composants

| Catégorie | CRM Source | alfi-crm | Doublons | À Migrer |
|-----------|------------|----------|----------|----------|
| **Total** | **225** | **184** | **147** | **70** |
| Composants UI | 85 | 72 | 65 | 20 |
| Composants Dashboard | 45 | 38 | 32 | 13 |
| Calculateurs | 15 | 12 | 10 | 5 |
| Simulateurs | 12 | 10 | 9 | 3 |
| Client360 | 18 | 15 | 12 | 6 |
| Autres | 50 | 37 | 19 | 23 |

### Pages Dashboard

| Type de Page | CRM Source | alfi-crm | Status |
|--------------|------------|----------|--------|
| Dashboard principal | ✅ | ✅ | Migré |
| Pages clients | ✅ | ✅ | Migré |
| Client360 | ✅ | ✅ | Migré |
| Calculateurs | ✅ | ✅ | Migré (partiellement) |
| Simulateurs | ✅ | ✅ | Migré |
| Patrimoine | ✅ | ❌ | À migrer |
| Objectifs/Projets | ✅ | ❌ | À migrer |
| Opportunités | ✅ | ✅ | Migré |
| Tâches/Agenda | ✅ | ✅ | Migré |
| SuperAdmin | ✅ | ❌ | À migrer |
| Portail Client | ✅ | ❌ | À migrer |
| **Total** | **79** | **52** | **27 à migrer** |

### API Routes

| Catégorie | CRM Source | alfi-crm | Status |
|-----------|------------|----------|--------|
| Clients | 8 routes | 6 routes | Partiellement migré |
| Patrimoine | 12 routes | 0 routes | À migrer |
| Documents | 6 routes | 4 routes | Partiellement migré |
| Calculateurs | 10 routes | 8 routes | Partiellement migré |
| Simulateurs | 8 routes | 6 routes | Migré |
| Export | 6 routes | 4 routes | Migré |
| SuperAdmin | 8 routes | 0 routes | À migrer |
| Portail Client | 6 routes | 0 routes | À migrer |
| **Total** | **64** | **28** | **36 à migrer** |

## Dépendances MongoDB

### Modèles MongoDB Identifiés

1. **Client / Particulier** - Modèle principal client
2. **Actif** - Actifs patrimoniaux
3. **Passif** - Passifs et dettes
4. **Contrat** - Contrats d'assurance
5. **Document** - Gestion documentaire
6. **Objectif** - Objectifs financiers
7. **Projet** - Projets clients
8. **Opportunite** - Opportunités commerciales
9. **Tache** - Tâches et to-do
10. **RendezVous** - Agenda et rendez-vous
11. **Simulation** - Simulations financières
12. **Email** - Emails et communications
13. **Notification** - Notifications système
14. **Campagne** - Campagnes marketing
15. **Organization / Cabinet** - Multi-tenant
16. **User / Advisor / Conseiller** - Utilisateurs
17. **ApporteurAffaires** - Apporteurs d'affaires
18. **Template** - Templates de documents
19. **AuditLog** - Logs d'audit
20. **Consentement** - Consentements RGPD

### Dépendances Critiques

**Packages à remplacer:**
- `mongoose` → `@prisma/client`
- `mongodb` → (supprimé)

**Fichiers utilisant MongoDB:**
- `CRM/lib/db.js` - Connexion MongoDB
- `CRM/lib/models/*.js` - 20+ modèles Mongoose
- `CRM/app/api/**/*.js` - 64 routes API
- `CRM/lib/services/*.js` - Services métier

## Analyse des Composants

### Composants Doublons (147 composants)

**Stratégie recommandée: KEEP_ALFI (garder la version alfi-crm)**

Raisons:
- Version TypeScript plus moderne
- Déjà adaptée pour Prisma
- Meilleure typage
- Tests existants

**Exemples de doublons:**
- Button, Card, Input, Select, Dialog
- DataTable, Pagination, Skeleton
- ModernBarChart, ModernLineChart, ModernPieChart
- DashboardHeader, NavigationSidebar, CommandPalette
- TabOverview, TabProfile, TabWealth
- IncomeTaxCalculator, RetirementSimulator

### Composants Uniques au CRM (70 composants)

**À copier et adapter:**

#### Haute Priorité (23 composants)
1. **SuperAdmin** (8 composants)
   - SuperAdminDashboard
   - OrganizationList
   - CreateOrganizationModal
   - QuotaEditor
   - AuditLogViewer
   - UserManagement
   - PlanEditor
   - MetricsOverview

2. **Portail Client** (6 composants)
   - ClientDashboard
   - ClientPatrimoine
   - ClientDocuments
   - ClientMessages
   - ClientProfile
   - ClientAuth

3. **Patrimoine** (9 composants)
   - ActifList
   - ActifCard
   - ActifForm
   - PassifList
   - PassifCard
   - ContratList
   - ContratCard
   - PatrimoineOverview
   - AllocationChart

#### Priorité Moyenne (25 composants)
- Composants de formulaires avancés
- Composants d'export PDF/Excel
- Composants de workflow
- Composants de compliance

#### Priorité Basse (22 composants)
- Composants de graphiques additionnels
- Composants d'animation
- Composants de layout alternatifs

### Composants Uniques à alfi-crm (15 composants)

**À conserver:**
- Composants Bento Grid (nouveaux)
- Composants de performance optimisés
- Composants d'accessibilité améliorés

## Mapping des Modèles MongoDB → Prisma

### Modèles Déjà Migrés

✅ **Cabinet** - Multi-tenant  
✅ **User** - Utilisateurs et conseillers  
✅ **Client** - Clients et particuliers  
✅ **Actif** - Actifs patrimoniaux  
✅ **Passif** - Passifs et dettes  
✅ **Contrat** - Contrats d'assurance  
✅ **Document** - Gestion documentaire  
✅ **Objectif** - Objectifs financiers  
✅ **Projet** - Projets clients  
✅ **Opportunite** - Opportunités  
✅ **Tache** - Tâches  
✅ **RendezVous** - Agenda  
✅ **Simulation** - Simulations  
✅ **Notification** - Notifications  
✅ **AuditLog** - Logs d'audit  

### Changements Structurels Majeurs

1. **IDs**: ObjectId → cuid (String)
2. **Relations**: Embedded docs → Relations explicites ou Json
3. **Dates**: Date → DateTime
4. **Nombres**: Number → Decimal pour montants
5. **Enums**: Strings → Enums Prisma
6. **Multi-tenant**: Ajout systématique de `cabinetId`

### Exemples de Conversion

**Client**
```javascript
// MongoDB
{
  _id: ObjectId("507f..."),
  cabinetId: ObjectId("..."),
  email: "test@example.com",
  totalAssets: 500000,
  taxation: { incomeTax: {...}, ifi: {...} }
}

// Prisma
{
  id: "ckl123...",
  cabinetId: "ckl456...",
  email: "test@example.com",
  wealth: { totalAssets: 500000, ... },
  taxDetails: { incomeTax: {...}, ifi: {...} }
}
```

**Actif**
```javascript
// MongoDB - Relation simple
{
  _id: ObjectId("..."),
  particulierId: ObjectId("..."),
  ownership: 50
}

// Prisma - Relation many-to-many
{
  id: "ckl...",
  clients: [
    { clientId: "ckl...", ownershipPercentage: 50.00 }
  ]
}
```

## Plan de Migration

### Phase 1: Préparation (Complétée ✅)
- [x] Backup de sécurité
- [x] Analyse de la structure
- [x] Mapping MongoDB → Prisma
- [x] Identification des composants
- [x] Documentation créée

### Phase 2: Design System Bento Grid (À faire)
- [ ] Créer les composants Bento de base
- [ ] Créer les templates (ChartHero, DualCharts, Timeline)
- [ ] Configurer le responsive
- [ ] Implémenter l'accessibilité
- [ ] Écrire les tests

### Phase 3: Migration des Utilitaires (À faire)
- [ ] Migrer les utilitaires de base
- [ ] Créer les services Prisma
- [ ] Migrer les hooks personnalisés

### Phase 4: Migration des Composants UI (À faire)
- [ ] Migrer les composants UI génériques
- [ ] Migrer les composants de formulaires
- [ ] Migrer les composants de tableaux
- [ ] Migrer les composants de graphiques

### Phase 5: Migration des API Routes (À faire)
- [ ] Migrer les routes clients
- [ ] Migrer les routes patrimoine
- [ ] Migrer les routes documents
- [ ] Migrer les routes objectifs/projets
- [ ] Migrer les routes opportunités
- [ ] Migrer les routes tâches/agenda
- [ ] Migrer les routes notifications

### Phase 6: Migration des Calculateurs (Partiellement fait ✅)
- [x] Calculateurs fiscaux simples
- [x] Simulateurs retraite
- [x] Simulateurs succession
- [ ] Calculateurs complexes (Budget, Objectifs)
- [ ] Routes API calculateurs

### Phase 7: Migration des Pages Dashboard (Partiellement fait ✅)
- [x] Dashboard principal
- [x] Pages clients
- [x] Client360
- [ ] Pages patrimoine
- [ ] Pages objectifs/projets
- [x] Pages opportunités
- [x] Pages tâches/agenda

### Phase 8: Migration des Fonctionnalités Avancées (Partiellement fait ✅)
- [x] Composants d'export
- [x] Système de notifications
- [ ] Gestion des documents
- [ ] Authentification

### Phase 9: Migration SuperAdmin et Portail Client (À faire)
- [ ] Interface SuperAdmin
- [ ] Routes API SuperAdmin
- [ ] Portail Client
- [ ] Routes API Client
- [ ] Permissions Client

### Phase 10: Tests et Validation (À faire)
- [ ] Tests de toutes les pages
- [ ] Tests des opérations CRUD
- [ ] Tests des calculateurs
- [ ] Tests des exports
- [ ] Tests d'authentification
- [ ] Tests de performance

## Risques Identifiés

### Risques Élevés
1. **Perte de données lors de la conversion des IDs**
   - Mitigation: Scripts de migration avec validation
   
2. **Incompatibilités de types TypeScript**
   - Mitigation: Conversion progressive avec tests

3. **Problèmes de performance avec Prisma**
   - Mitigation: Optimisation des queries, pagination

### Risques Moyens
1. **Composants manquants non identifiés**
   - Mitigation: Tests exhaustifs

2. **Breaking changes dans les API**
   - Mitigation: Documentation complète

3. **Problèmes de responsive avec Bento Grid**
   - Mitigation: Tests sur tous les breakpoints

### Risques Faibles
1. **Styles CSS incompatibles**
   - Mitigation: Fusion progressive

2. **Dépendances obsolètes**
   - Mitigation: Mise à jour des packages

## Recommandations

### Priorités de Migration

1. **Critique** (Semaine 1-2)
   - Finaliser les API Routes manquantes
   - Migrer les pages patrimoine
   - Migrer les composants SuperAdmin

2. **Important** (Semaine 3-4)
   - Migrer le Portail Client
   - Compléter les calculateurs
   - Tests d'intégration

3. **Nice to have** (Semaine 5+)
   - Optimisations de performance
   - Composants additionnels
   - Documentation utilisateur

### Stratégie de Test

1. **Tests unitaires**: Chaque composant migré
2. **Tests d'intégration**: Chaque page complète
3. **Tests E2E**: Parcours utilisateur critiques
4. **Tests de performance**: Métriques Web Vitals

### Points de Validation

- [ ] Toutes les pages se chargent sans erreur
- [ ] Toutes les opérations CRUD fonctionnent
- [ ] Tous les calculateurs produisent les bons résultats
- [ ] Tous les exports fonctionnent
- [ ] L'authentification fonctionne
- [ ] Les permissions sont respectées
- [ ] RLS fonctionne correctement
- [ ] Les performances sont acceptables (TTI < 3s)

## Conclusion

La migration du CRM vers alfi-crm est **56% complétée** en termes de composants.

**Travail restant estimé:**
- 70 composants à migrer
- 27 pages à créer/adapter
- 36 routes API à migrer
- Tests complets à effectuer

**Durée estimée:** 4-6 semaines avec 1 développeur à temps plein

**Prochaines étapes:**
1. Compléter la Phase 2 (Design System Bento Grid)
2. Migrer les composants SuperAdmin (Priorité 1)
3. Migrer le Portail Client (Priorité 1)
4. Compléter les API Routes manquantes
5. Tests exhaustifs

## Ressources

- [COMPONENT_MAPPING.md](./COMPONENT_MAPPING.md) - Mapping détaillé des composants
- [API_CHANGES.md](./API_CHANGES.md) - Changements d'API
- [MONGODB_PRISMA_MAPPING.md](./MONGODB_PRISMA_MAPPING.md) - Mapping des modèles
- [COMPONENT_ANALYSIS.json](./COMPONENT_ANALYSIS.json) - Analyse brute JSON
