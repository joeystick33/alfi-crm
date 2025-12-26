# INDEX SPÉCIFICATIONS TECHNIQUES - INTÉGRATION COMPLÈTE

**Version** : 1.0  
**Date** : 25 novembre 2024  
**Statut** : EN COURS

---

## 📚 DOCUMENTS DE SPÉCIFICATIONS

### Documents généraux

1. **`PLAN_INTEGRATION_MASTERPLAN.md`** ✅
   - Vision globale 10 semaines
   - Principes d'intégration
   - Planning macro
   - Checklist complétude

2. **`AUDIT_COMPARATIF_ANCIEN_VS_NOUVEAU_CRM.md`** ✅
   - Comparaison chiffrée complète
   - Tab par tab
   - Manques identifiés
   - Verdict brutal

3. **`AUDIT_ULTRA_DETAILLE_FINAL.md`** ✅
   - Audit exhaustif tous fichiers
   - ~300KB code à récupérer
   - Priorisation

4. **`PRISMA_ENRICHISSEMENTS_DETAILLES.md`** ✅
   - Analyse schéma existant
   - Modèles à créer vs enrichir
   - Checklist migration

---

### Spécifications techniques par semaine

#### ✅ SEMAINE 0 - PRÉPARATION (3j)

**`SPEC_WEEK_0_PRISMA_MIGRATION.md`** ✅

**Contenu** :
- Schémas Prisma détaillés (3 nouveaux modèles)
- Enrichissements (4 modèles existants)
- Commandes migration
- Types TypeScript complets
- Schemas Zod validation
- Tests unitaires

**Livrables** :
- ClientBudget (model)
- ClientTaxation (model)
- TaxOptimization (model)
- Client enrichi (8 champs)
- FamilyMember enrichi (7 champs)
- Actif enrichi (9 champs)
- Passif enrichi (1 champ)

---

#### ✅ SEMAINE 1-2 - BUDGET & FISCALITÉ (10j)

**`SPEC_WEEK_1-2_BUDGET_FISCALITE.md`** ✅

**Contenu** :
- Services (budget-service.ts, tax-service.ts)
- API Routes (7 endpoints)
- Components UI (TabBudget, TabTaxation)
- Tests E2E

**Livrables** :
- TabBudget (0% → 100%)
  - KPI Cards (4)
  - Graphiques (2)
  - Formulaires revenus (5 sections)
  - Formulaires charges (10 catégories)
  - Analyse automatique
- TabTaxation (0% → 100%)
  - Section IR complet
  - Section IFI
  - Prélèvements sociaux
  - Optimisations fiscales

---

#### ⏳ SEMAINE 3-4 - PATRIMOINE & FAMILLE (10j)

**`SPEC_WEEK_3-4_PATRIMOINE_FAMILLE.md`** (À CRÉER)

**Contenu prévu** :
- Enrichissement TabWealth
  - Linkage bidirectionnel actif↔passif
  - Fiscal Data IFI
  - Management tracking
  - Prefill auto passif
  - Tab "Liens" dédié
- Création TabFamily dédié
  - CRUD complet
  - Groupement par type
  - Calcul âge auto
  - Badge "À charge"

**Livrables** :
- TabWealth enrichi (40% → 100%)
- TabFamily dédié (10% → 100%)
- wealth-service.ts
- 6 API endpoints

---

#### ⏳ SEMAINE 5-6 - CONTRATS, KYC, OBJECTIFS (10j)

**`SPEC_WEEK_5-6_ENRICHISSEMENTS.md`** (À CRÉER)

**Contenu prévu** :
- Enrichissement TabContracts
  - 9 types contrats
  - Catégorisation (EPARGNE, CREDIT, etc.)
  - Badge "Géré"
- Enrichissement TabKYC
  - Progress bar + %
  - Alertes expiration
  - Score MIF II /100
  - Recommandations
- Enrichissement TabObjectives
  - Stats globales (4 KPI)
  - Calcul temps restant
  - 9 types objectifs

**Livrables** :
- TabContracts (35% → 100%)
- TabKYC (50% → 100%)
- TabObjectives (50% → 100%)

---

#### ⏳ SEMAINE 7-8 - FORMULAIRE & OPPORTUNITÉS (10j)

**`SPEC_WEEK_7-8_FORMULAIRE_OPPORTUNITIES.md`** (À CRÉER)

**Contenu prévu** :
- Wizard création client 7 étapes
  - Stepper visuel
  - Validation Zod par étape
  - Sauvegarde progressive
  - 50+ champs collectés
- Moteur opportunités
  - 8 règles détection
  - Scoring intelligent
  - Priorités

**Livrables** :
- CreateClientWizard.tsx (15% → 100%)
- opportunities-service.ts (0% → 100%)
- 4 API endpoints

---

#### ⏳ SEMAINE 9-10 - DASHBOARD & POLISHING (10j)

**`SPEC_WEEK_9-10_DASHBOARD_POLISH.md`** (À CRÉER)

**Contenu prévu** :
- Page Appointments
  - Calendrier visuel
  - CRUD complet
  - Filtres
- Page Tasks
  - Liste tâches
  - Kanban
  - Assignation
- Tests E2E complets
- Polish UI/UX
- Documentation

**Livrables** :
- Page Appointments (0% → 100%)
- Page Tasks (0% → 100%)
- Tests E2E 100%
- Documentation complète

---

## 🗂️ STRUCTURE FICHIERS PROJET

### Documentation

```
docs/
├── PLAN_INTEGRATION_MASTERPLAN.md                 ✅
├── AUDIT_COMPARATIF_ANCIEN_VS_NOUVEAU_CRM.md     ✅
├── AUDIT_ULTRA_DETAILLE_FINAL.md                 ✅
├── PRISMA_ENRICHISSEMENTS_DETAILLES.md           ✅
├── SPEC_INDEX_INTEGRATION.md                     ✅ (ce fichier)
├── SPEC_WEEK_0_PRISMA_MIGRATION.md               ✅
├── SPEC_WEEK_1-2_BUDGET_FISCALITE.md             ✅
├── SPEC_WEEK_3-4_PATRIMOINE_FAMILLE.md           ⏳
├── SPEC_WEEK_5-6_ENRICHISSEMENTS.md              ⏳
├── SPEC_WEEK_7-8_FORMULAIRE_OPPORTUNITIES.md     ⏳
└── SPEC_WEEK_9-10_DASHBOARD_POLISH.md            ⏳
```

### Code à créer/modifier

```
app/
├── _common/
│   ├── lib/
│   │   ├── api-types.ts                          ⏳ ENRICHIR (types budget, tax)
│   │   ├── validation-schemas.ts                 ⏳ CRÉER (Zod schemas)
│   │   └── services/
│   │       ├── budget-service.ts                 ⏳ CRÉER
│   │       ├── tax-service.ts                    ⏳ CRÉER
│   │       ├── opportunities-service.ts          ⏳ CRÉER
│   │       └── wealth-service.ts                 ⏳ CRÉER
│   └── components/
│       └── ui/                                    ✅ EXISTANT (conserver)
│
└── (advisor)/
    ├── (backend)/
    │   └── api/
    │       └── advisor/
    │           └── clients/
    │               └── [id]/
    │                   ├── budget/
    │                   │   ├── route.ts          ⏳ CRÉER
    │                   │   └── metrics/
    │                   │       └── route.ts      ⏳ CRÉER
    │                   ├── taxation/
    │                   │   ├── route.ts          ⏳ CRÉER
    │                   │   └── calculations/
    │                   │       └── route.ts      ⏳ CRÉER
    │                   ├── tax-optimizations/
    │                   │   └── route.ts          ⏳ CRÉER
    │                   ├── wealth/
    │                   │   └── links/
    │                   │       └── route.ts      ⏳ CRÉER
    │                   ├── family/
    │                   │   └── route.ts          ⏳ CRÉER
    │                   └── opportunities/
    │                       └── detect/
    │                           └── route.ts      ⏳ CRÉER
    │
    └── (frontend)/
        ├── components/
        │   └── client360/
        │       ├── TabBudget.tsx                 ⏳ CRÉER
        │       ├── TabTaxation.tsx               ⏳ CRÉER
        │       ├── TabFamily.tsx                 ⏳ CRÉER
        │       ├── TabWealth.tsx                 ⏳ ENRICHIR
        │       ├── TabContracts.tsx              ⏳ ENRICHIR
        │       ├── TabKYC.tsx                    ⏳ ENRICHIR
        │       └── TabObjectives.tsx             ⏳ ENRICHIR
        │
        └── dashboard/
            ├── clients/
            │   ├── [id]/
            │   │   └── page.tsx                  ⏳ ENRICHIR (intégrer tabs)
            │   └── nouveau/
            │       └── wizard/
            │           └── page.tsx              ⏳ CRÉER
            ├── appointments/
            │   └── page.tsx                      ⏳ CRÉER
            └── tasks/
                └── page.tsx                      ⏳ CRÉER

prisma/
├── schema.prisma                                  ⏳ ENRICHIR
└── migrations/
    └── [timestamp]_add_budget_taxation_enrichments/
        └── migration.sql                          ⏳ AUTO-GÉNÉRÉ

tests/
├── services/
│   ├── budget-service.test.ts                    ⏳ CRÉER
│   └── tax-service.test.ts                       ⏳ CRÉER
├── api/
│   ├── budget.test.ts                            ⏳ CRÉER
│   └── taxation.test.ts                          ⏳ CRÉER
└── e2e/
    ├── tab-budget.test.ts                        ⏳ CRÉER
    └── tab-taxation.test.ts                      ⏳ CRÉER
```

---

## 📊 AVANCEMENT GLOBAL

| Phase | Specs | Implémentation | Tests | Status |
|-------|-------|----------------|-------|--------|
| **SEMAINE 0** | ✅ 100% | ⏳ 0% | ⏳ 0% | SPEC PRÊTE |
| **SEMAINE 1-2** | ✅ 80% | ⏳ 0% | ⏳ 0% | SPEC EN COURS |
| **SEMAINE 3-4** | ⏳ 0% | ⏳ 0% | ⏳ 0% | À CRÉER |
| **SEMAINE 5-6** | ⏳ 0% | ⏳ 0% | ⏳ 0% | À CRÉER |
| **SEMAINE 7-8** | ⏳ 0% | ⏳ 0% | ⏳ 0% | À CRÉER |
| **SEMAINE 9-10** | ⏳ 0% | ⏳ 0% | ⏳ 0% | À CRÉER |

---

## 🎯 PROCHAINES ACTIONS

### Immédiat

1. ✅ Finaliser SPEC_WEEK_1-2_BUDGET_FISCALITE.md (partie fiscalité)
2. ⏳ Créer SPEC_WEEK_3-4_PATRIMOINE_FAMILLE.md
3. ⏳ Créer SPEC_WEEK_5-6_ENRICHISSEMENTS.md
4. ⏳ Créer SPEC_WEEK_7-8_FORMULAIRE_OPPORTUNITIES.md
5. ⏳ Créer SPEC_WEEK_9-10_DASHBOARD_POLISH.md

### Après validation specs

6. ⏳ Commencer implémentation SEMAINE 0 (Prisma)
7. ⏳ Tests migration
8. ⏳ Démarrer SEMAINE 1 (Services budget)

---

## 📝 CONVENTIONS

### Nommage fichiers

- **Specs techniques** : `SPEC_WEEK_X_TITRE.md`
- **Audits** : `AUDIT_TITRE.md`
- **Plans** : `PLAN_TITRE.md`
- **Documentation** : `TITRE.md`

### Format specs

Chaque spec DOIT contenir :
1. **Version & Durée**
2. **Objectifs clairs**
3. **Planning détaillé** (jours)
4. **Code complet** (pas de pseudo-code)
5. **Validation** (tests)
6. **Checklist**

### Format code

- **TypeScript strict** (pas de `any`)
- **Imports explicites**
- **Types documentés**
- **Validation Zod systématique**
- **Tests pour chaque feature**

---

## 🔄 MISE À JOUR

**Dernière mise à jour** : 25 novembre 2024  
**Prochaine révision** : Après création specs SEMAINE 3-4

**Statut** :
- ✅ Specs SEMAINE 0 : COMPLÈTE
- ✅ Specs SEMAINE 1-2 : 80% (manque partie fiscalité)
- ⏳ Specs SEMAINE 3-10 : À CRÉER

---

## 💡 NOTES

### Pas de simplification

Toutes les specs suivent le principe : **ULTRA-DÉTAILLÉ, PAS DE SIMPLIFICATION**.

Chaque spec contient :
- Code complet copiable-collable
- Tous les imports
- Toutes les validations
- Tous les tests

### Compatibilité

Toutes les specs respectent :
- Architecture existante
- Design system existant
- Conventions de nommage
- Structure dossiers

### Pas de doublons

Chaque spec vérifie :
- Pas de conflit avec existant
- Pas de doublon de code
- Pas de duplication de logique
- Harmonisation totale
