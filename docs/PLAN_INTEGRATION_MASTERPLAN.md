# MASTERPLAN INTÉGRATION - VERS 100-200% COMPLÉTUDE

**Date** : 25 novembre 2024  
**Durée** : 10 semaines  
**Méthode** : Rigoureuse, pas de simplification, pas de doublon

---

## 🎯 PRINCIPES D'INTÉGRATION

### 1. HARMONISATION (pas de remplacement brutal)
- ✅ Enrichir l'existant
- ❌ Ne pas supprimer et remplacer

### 2. TYPAGE STRICT
- ✅ JavaScript → TypeScript
- ✅ Types exhaustifs

### 3. PRISMA (pas de Mongoose)
- ✅ Tous modèles en Prisma
- ✅ Migrations propres

### 4. DESIGN SYSTEM
- ✅ Composants UI existants
- ❌ Pas de CSS custom

### 5. NEXT.JS 14
- ✅ Route Handlers
- ✅ Server Components

---

## 📊 MAPPING FICHIERS

### CE QU'ON GARDE DU NOUVEAU CRM

**Architecture** ✅ :
- Prisma, TypeScript, Next.js 14
- Design System (`_common/components/ui/`)
- Auth (`_common/lib/auth/`)
- API helpers (`_common/lib/api-helpers`)

**Composants déjà bons** ✅ :
- TabOverview, TabDocuments, TabTimeline
- Dashboard, Simulateurs
- Card, Button, Input, etc.

### CE QU'ON RÉCUPÈRE DE L'ANCIEN CRM

**Client 360** (7 tabs à migrer) :
```
Source ancien                                  → Destination nouveau
components/client360/TabBudget.jsx (636L)     → (frontend)/components/client360/TabBudget.tsx
components/client360/TabTaxation.jsx (325L)   → (frontend)/components/client360/TabTaxation.tsx
components/client360/TabWealth.jsx (1156L)    → ENRICHIR TabWealth.tsx existant
components/client360/TabFamily.jsx (448L)     → (frontend)/components/client360/TabFamily.tsx (NOUVEAU TAB)
components/client360/TabContracts.jsx (548L)  → ENRICHIR TabContracts existant
components/client360/TabKYC.jsx (515L)        → ENRICHIR TabKYC existant
components/client360/TabObjectives.jsx (485L) → ENRICHIR TabObjectives existant
```

**Lib/Services** (10 fichiers critiques) :
```
lib/budget-calculator.js (235L)         → _common/lib/services/budget-service.ts
lib/opportunities-engine.js (384L)      → _common/lib/services/opportunities-service.ts
lib/fiscalite-complete.js (375L)        → _common/lib/services/tax-service.ts
lib/advanced-kpis.js (10KB)             → _common/lib/services/kpi-service.ts
lib/compliance-handlers.js (8KB)        → _common/lib/services/compliance-service.ts
lib/kyc-validator.js (8.7KB)            → ENRICHIR _common/lib/services/kyc-service.ts
lib/mifid.js (8.8KB)                    → ENRICHIR _common/lib/services/mifid-service.ts
lib/workflow-handlers.js (4.8KB)        → _common/lib/services/workflow-service.ts
lib/task-handlers.js (7.5KB)            → _common/lib/services/task-service.ts
lib/analytics.js (5.2KB)                → ENRICHIR _common/lib/services/analytics-service.ts
```

**Formulaires** :
```
app/dashboard/clients/nouveau/page.js (866L) → (frontend)/dashboard/clients/nouveau/page.tsx
```

---

## 🗓️ PLAN 10 SEMAINES

### SEMAINE 0 : PRÉPARATION (3j)

**Objectif** : Préparer sans casser

**Actions** :
1. Créer branche `feature/integration-ancien-crm`
2. Audit conflits (1j)
3. Créer nouveaux schémas Prisma (2j)
   - ClientBudget, ClientTaxation, TaxOptimization
   - Appointment, Task
   - Enrichir Client, Actif, Passif, FamilyMember
4. Migration : `npx prisma migrate dev --name add_missing_models`
5. Tests : schéma valide, anciens tests passent

**Livrables** :
- ✅ Schémas Prisma créés
- ✅ Migration exécutée
- ✅ Pas de régression

---

### SEMAINE 1-2 : BUDGET & FISCALITÉ

**Objectif** : Ajouter TabBudget + TabTaxation (0% → 100%)

#### SEMAINE 1 : TabBudget

**Jour 1-2 : Services**
- Créer `_common/lib/services/budget-service.ts`
- Types dans `_common/lib/api-types.ts`
- Fonctions : calculateBudgetMetrics, detectAnomalies, generateRecommendations
- Tests unitaires

**Jour 3 : API**
- `/api/advisor/clients/[id]/budget/route.ts` (GET/POST/PATCH)
- `/api/advisor/clients/[id]/budget/metrics/route.ts` (GET)
- Validation Zod

**Jour 4-5 : UI TabBudget**
- Créer `(frontend)/components/client360/TabBudget.tsx`
- KPI Cards (4), Graphiques (BarChart, PieChart)
- Formulaire édition (revenus 5 sections, charges 10 catégories)
- Hook `useBudget` pour data fetching
- Intégrer dans `dashboard/clients/[id]/page.tsx`

**Tests** :
- Backend API functional tests
- Frontend E2E avec données réelles

#### SEMAINE 2 : TabTaxation

**Jour 1-2 : Services**
- Créer `_common/lib/services/tax-service.ts`
- Fonctions : calculateIR, calculateIFI, calculateSocialContributions
- Barèmes 2024 (IR, IFI)
- Tests calculs fiscaux

**Jour 3 : API**
- `/api/advisor/clients/[id]/taxation/route.ts` (GET/POST/PATCH)
- `/api/advisor/clients/[id]/tax-optimizations/route.ts` (GET/POST)
- `/api/advisor/clients/[id]/calculations/route.ts` (GET - calculs temps réel)

**Jour 4-5 : UI TabTaxation**
- Créer `(frontend)/components/client360/TabTaxation.tsx`
- Section IR (RFR, parts, TMI, montant)
- Section IFI (patrimoine brut, dettes, net, montant)
- Section Prélèvements sociaux
- Section Optimisations (cards avec priorités)
- Intégrer dans Client360

**Tests** :
- Calculs IR/IFI corrects
- Alertes IFI si proche seuil

---

### SEMAINE 3-4 : PATRIMOINE ENRICHI & FAMILLE

**Objectif** : TabWealth +60%, TabFamily tab dédié

#### SEMAINE 3 : TabWealth enrichi

**Jour 1 : Enrichir modèles Prisma**
- Actif : management (isManaged, advisor, since), fiscalData (IFI), linkedLiabilityId
- Passif : insuranceRate, linkedAssetId

**Jour 2-3 : Services & API**
- `_common/lib/services/wealth-service.ts`
- Fonctions : syncAssetLink, buildFiscalData, prefillLiability, calculateIFI
- API PATCH pour actifs/passifs (ajouter nouveaux champs)
- API `/api/advisor/clients/[id]/wealth/links/route.ts` (sync linkage)

**Jour 4-5 : UI TabWealth**
- ENRICHIR `(frontend)/components/client360/TabWealth.tsx` existant
- Ajouter 3ème tab "Liens actifs↔crédits"
- Formulaire actif : management tracking, fiscal data IFI
- Formulaire passif : insuranceRate, linkedAssetId
- Linkage bidirectionnel avec Select
- Prefill auto passif depuis actif

**Tests** :
- Linkage fonctionne
- Calcul IFI correct (abattement RP 30%)
- Prefill auto OK

#### SEMAINE 4 : TabFamily dédié

**Jour 1 : Modèle FamilyMember**
- Vérifier si existe, sinon créer
- Champs complets (relationshipType, civility, profession, annualIncome, isDependent, etc.)

**Jour 2 : API**
- `/api/advisor/clients/[id]/family/route.ts` (GET/POST)
- `/api/advisor/family/[id]/route.ts` (PATCH/DELETE)

**Jour 3-5 : UI TabFamily**
- Créer `(frontend)/components/client360/TabFamily.tsx` (TAB DÉDIÉ)
- Dialogue CRUD complet
- Groupement par type (Conjoint, Enfants, Ascendants, Autres)
- Cards avec calcul âge auto, badge "À charge"
- Retirer section famille de TabProfile (déplacer vers tab dédié)
- Ajouter tab dans Client360

**Tests** :
- CRUD famille fonctionne
- Calcul âge correct

---

### SEMAINE 5-6 : CONTRATS, KYC, OBJECTIFS ENRICHIS

**Objectif** : Enrichir 3 tabs existants

#### SEMAINE 5 : TabContracts & TabKYC

**Jour 1-3 : TabContracts**
- Enrichir modèle Contract (si manque : category, isManaged, details)
- ENRICHIR `(frontend)/components/client360/TabContracts.tsx`
- Ajouter 9 types contrats (vs ~6 actuel)
- Ajouter catégories (EPARGNE, CREDIT, PREVOYANCE, AUTRE)
- Affichage adapté investment/loan
- Badge "Géré" si isManaged

**Jour 4-5 : TabKYC**
- Enrichir modèle KYC (si manque : completionRate, isExpiringSoon, mifidOverallScore, mifidRecommendation)
- ENRICHIR `(frontend)/components/client360/TabKYC.tsx`
- Progress bar + %
- Alertes expiration
- Score MIF II /100
- Recommandations
- LCB-FT complet (PEP, origin of funds)

**Tests** :
- Contrats catégorisés
- KYC progress bar fonctionne

#### SEMAINE 6 : TabObjectives

**Jour 1-3 : Enrichir TabObjectives**
- Enrichir modèle Goal (si manque : priority, status détaillés)
- ENRICHIR `(frontend)/components/client360/TabObjectives.tsx`
- 9 types objectifs (vs ~6 actuel)
- 3 priorités (HIGH/MEDIUM/LOW avec émojis)
- 6 statuts (NOT_STARTED, IN_PROGRESS, ON_TRACK, AT_RISK, COMPLETED, ABANDONED)
- Stats globales (4 KPI cards en haut)
- Calcul temps restant (jours/mois/ans avec statut)
- Calcul progress % avec barre

**Jour 4-5 : Tests & polish**
- Tests E2E tous tabs enrichis
- Polish UI/UX

---

### SEMAINE 7-8 : FORMULAIRE 7 ÉTAPES & OPPORTUNITÉS

**Objectif** : Formulaire +85%, moteur opportunités

#### SEMAINE 7 : Formulaire 7 étapes

**Jour 1-2 : Enrichir modèle Client**
- Champs manquants : civilite, nomUsage, taxResidence, matrimonialRegime, dependents, professionCategory, employmentType, employmentSince

**Jour 3-5 : Wizard UI**
- Créer `(frontend)/dashboard/clients/nouveau/wizard/page.tsx`
- 7 étapes Stepper visuel
- Étape 1 : Type relation (PROSPECT/CLIENT, INDIVIDUAL/PROFESSIONAL)
- Étape 2 : Identification (civilité, nom, prénom, nomUsage, birthDate, nationality, taxResidence)
- Étape 3 : Coordonnées (email, phone, mobile, address structuré)
- Étape 4 : Famille (maritalStatus, matrimonialRegime, numberOfChildren, dependents)
- Étape 5 : Professionnel (professionCategory, employmentType, employer, since)
- Étape 6 : Patrimoine estimé (netWealth, financialAssets, realEstateAssets, annualIncome)
- Étape 7 : KYC/MIFID (riskProfile, investmentHorizon, investmentObjective, investmentKnowledge)
- Validation Zod par étape
- Sauvegarde progressive (brouillon)

**Tests** :
- Navigation entre étapes
- Validation fonctionne
- Création client OK

#### SEMAINE 8 : Moteur opportunités

**Jour 1-3 : Service**
- Créer `_common/lib/services/opportunities-service.ts`
- 8 règles détection (DIVERSIFICATION_NEEDED, RETIREMENT_PREPARATION, TAX_OPTIMIZATION, LIFE_INSURANCE_UNDERUSED, SUCCESSION_PLANNING, DEBT_CONSOLIDATION, REAL_ESTATE_INVESTMENT, PER_OPPORTUNITY)
- Scoring intelligent
- Fonction detectOpportunities(clientId)

**Jour 4-5 : API & UI**
- `/api/advisor/clients/[id]/opportunities/detect/route.ts` (POST - lance détection)
- ENRICHIR TabOpportunities existant
- Afficher opportunités détectées avec priorités
- Actions sur opportunités (REVIEWED, IN_PROGRESS, COMPLETED, DISMISSED)

**Tests** :
- Détection fonctionne
- Scoring correct

---

### SEMAINE 9-10 : DASHBOARD PAGES & POLISHING

**Objectif** : Pages manquantes + tests + polish

#### SEMAINE 9 : Pages Appointments & Tasks

**Jour 1-3 : Appointments**
- Modèle déjà créé semaine 0
- API `/api/advisor/appointments/route.ts` (GET/POST)
- API `/api/advisor/appointments/[id]/route.ts` (PATCH/DELETE)
- Page `(frontend)/dashboard/appointments/page.tsx`
- Calendrier visuel (react-big-calendar ou similaire)
- CRUD complet
- Filtres (par conseiller, par client, par statut)

**Jour 4-5 : Tasks**
- Modèle déjà créé semaine 0
- API `/api/advisor/tasks/route.ts` (GET/POST)
- API `/api/advisor/tasks/[id]/route.ts` (PATCH/DELETE)
- Page `(frontend)/dashboard/tasks/page.tsx`
- Liste tâches avec tri/filtres
- CRUD complet
- Assignation, deadlines, priorités
- Vue Kanban (optionnelle)

**Tests** :
- Appointments CRUD OK
- Tasks CRUD OK

#### SEMAINE 10 : Tests, polish, documentation

**Jour 1-2 : Tests E2E complets**
- Parcours complet création client (formulaire 7 étapes)
- Client 360 tous tabs
- Budget édition
- Fiscalité calculs
- Patrimoine linkage
- Opportunités détection

**Jour 3-4 : Polish UI/UX**
- Responsive design tous nouveaux composants
- Loading states
- Error handling
- Toasts/notifications
- Accessibilité

**Jour 5 : Documentation**
- `INTEGRATION_COMPLETE.md` (ce qui a été fait)
- `GUIDE_UTILISATION_NOUVELLES_FONCTIONNALITES.md`
- Mise à jour `CRM_MARKET_READY_PLAN.md`

---

## 📋 CHECKLIST COMPLÉTUDE

### Client 360 (10 tabs)

| Tab | Avant | Après | État |
|-----|-------|-------|------|
| Overview | ✅ 100% | ✅ 100% | Conservé |
| Profile | ⚠️ 70% | ✅ 100% | Enrichi (famille déplacée) |
| **Budget** | ❌ 0% | ✅ 100% | **CRÉÉ** |
| **Fiscalité** | ❌ 0% | ✅ 100% | **CRÉÉ** |
| Patrimoine | ⚠️ 40% | ✅ 100% | Enrichi (linkage, fiscal, mgmt) |
| **Famille** | ⚠️ 10% | ✅ 100% | **TAB DÉDIÉ** |
| Contrats | ⚠️ 35% | ✅ 100% | Enrichi (9 types, catégories) |
| Objectifs | ⚠️ 50% | ✅ 100% | Enrichi (stats, temps) |
| KYC | ⚠️ 50% | ✅ 100% | Enrichi (progress, score) |
| Documents | ✅ 90% | ✅ 100% | Polish |
| Timeline | ✅ 80% | ✅ 100% | Polish |

### Fonctionnalités globales

| Fonctionnalité | Avant | Après | Action |
|----------------|-------|-------|--------|
| Formulaire création | 15% | ✅ 100% | Wizard 7 étapes |
| Budget & Cash-flow | 0% | ✅ 100% | Service + Tab |
| Fiscalité détaillée | 10% | ✅ 100% | Service + Tab |
| Moteur opportunités | 0% | ✅ 100% | Service + intégré |
| Appointments | 0% | ✅ 100% | Page dédiée |
| Tasks | 0% | ✅ 100% | Page dédiée |
| Simulateurs | ✅ 80% | ✅ 100% | Polish |
| Dashboard | ✅ 80% | ✅ 100% | KPIs enrichis |

### Services & Lib

| Service | Avant | Après |
|---------|-------|-------|
| budget-service | 0% | ✅ 100% |
| tax-service | 30% | ✅ 100% |
| opportunities-service | 0% | ✅ 100% |
| wealth-service | 50% | ✅ 100% |
| kyc-service | 50% | ✅ 100% |
| mifid-service | 50% | ✅ 100% |
| compliance-service | 0% | ✅ 100% |
| workflow-service | 0% | ✅ 100% |
| task-service | 0% | ✅ 100% |
| analytics-service | 40% | ✅ 100% |
| kpi-service | 0% | ✅ 100% |

---

## 🎯 RÉSULTAT FINAL

### Complétude estimée

**Avant intégration** : 30-40%
**Après intégration** : **100-110%**

**Gain** : +60 à +80 points

### Pourquoi 110% ?

On garde le meilleur du nouveau CRM (architecture moderne, design system, TypeScript) + tout de l'ancien CRM (fonctionnalités riches) = **supérieur à la somme des 2**.

**Avantages vs ancien CRM** :
- ✅ TypeScript (vs JS) - Type safety
- ✅ Prisma (vs Mongoose) - Migrations, typage
- ✅ Next.js 14 (vs Next.js 12) - Server Components
- ✅ Design system unifié
- ✅ Tests modernes

**Avantages vs nouveau CRM actuel** :
- ✅ +70% fonctionnalités
- ✅ Client 360 complet (10 tabs 100%)
- ✅ Budget & Fiscalité
- ✅ Formulaire 7 étapes
- ✅ Moteur opportunités
- ✅ Appointments, Tasks

---

## 🚀 PROCHAINE ÉTAPE

**Commencer SEMAINE 0 - PRÉPARATION (3 jours)**

1. Créer branche `feature/integration-ancien-crm`
2. Audit conflits
3. Schémas Prisma
4. Migration
5. Tests

Veux-tu que je commence par les schémas Prisma ?
