# PLAN DE RÉCUPÉRATION - ANCIEN CRM → NOUVEAU CRM

**Date** : 24 novembre 2024  
**Objectif** : Récupérer les 70% de fonctionnalités manquantes  
**Source** : `/app/(advisor)/a-implementer/crm-saas-FIN3-main`  
**Durée estimée** : 5-8 semaines

---

## 🎯 PRIORITÉS DE RÉCUPÉRATION

### PHASE R1 - CRITIQUE (Semaine 1-2) - 40h

**Objectif** : Récupérer Budget & Fiscalité (fonctionnalités 0% actuellement)

#### R1.1 - TabBudget complet (15h)
**Fichier source** : `components/client360/TabBudget.jsx` (636 lignes)

**Actions** :
1. Copier `TabBudget.jsx` → `app/(advisor)/(frontend)/components/client360/TabBudget.tsx` (3h)
2. Adapter Mongoose → Prisma schema (2h)
   ```prisma
   model ClientBudget {
     id String @id @default(cuid())
     clientId String @unique
     
     // REVENUS
     professionalIncome Json // { netSalary, selfEmployedIncome, bonuses, other }
     assetIncome Json        // { rentalIncome, dividends, interest, capitalGains }
     spouseIncome Json       // { netSalary, other }
     retirementPensions Json // { total }
     allowances Json         // { total }
     
     // CHARGES
     monthlyExpenses Json    // { housing, utilities, food, transportation, insurance, leisure, health, education, loans, other }
     
     // MÉTRIQUES (auto-calculées)
     totalRevenue Decimal @db.Decimal(12, 2)
     totalExpenses Decimal @db.Decimal(12, 2)
     savingsCapacity Decimal @db.Decimal(12, 2)
     savingsRate Decimal @db.Decimal(5, 2)
     
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     
     @@map("client_budgets")
   }
   ```

3. Créer API endpoints (4h)
   - `GET /api/advisor/clients/[id]/budget`
   - `POST /api/advisor/clients/[id]/budget`
   - `PATCH /api/advisor/clients/[id]/budget`

4. Adapter composants UI (4h)
   - Remplacer imports Mongoose par Prisma
   - Adapter apiCall par fetch + useQuery/useMutation
   - Adapter Card/Button à design system actuel

5. Intégrer dans Client360 (2h)
   - Ajouter tab "Budget" dans `dashboard/clients/[id]/page.tsx`
   - Import TabBudget
   - Navigation

**Livrables** :
- ✅ Tab Budget fonctionnel avec KPI
- ✅ Graphiques (BarChart, PieChart)
- ✅ Mode édition revenus/charges
- ✅ Calculs auto (capacité épargne, taux)

---

#### R1.2 - TabTaxation complet (12h)
**Fichier source** : `components/client360/TabTaxation.jsx` (325 lignes)

**Actions** :
1. Copier `TabTaxation.jsx` → `TabTaxation.tsx` (2h)
2. Adapter schema Prisma (2h)
   ```prisma
   model ClientTaxation {
     id String @id @default(cuid())
     clientId String @unique
     
     // IMPÔT SUR LE REVENU
     incomeTax Json // { fiscalReferenceIncome, taxShares, quotientFamilial, taxBracket, annualAmount, monthlyPayment, taxCredits, taxReductions }
     
     // IFI
     ifi Json? // { taxableRealEstateAssets, deductibleLiabilities, netTaxableIFI, ifiAmount, bracket }
     
     // PRÉLÈVEMENTS SOCIAUX
     socialContributions Json // { taxableAssetIncome, rate, amount }
     
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
     
     @@map("client_taxation")
   }
   
   model TaxOptimization {
     id String @id @default(cuid())
     clientId String
     
     priority String // HIGH, MEDIUM, LOW
     category String
     title String
     description String @db.Text
     potentialSavings Decimal? @db.Decimal(10, 2)
     recommendation String @db.Text
     status String @default("DETECTED")
     
     createdAt DateTime @default(now())
     
     @@map("tax_optimizations")
   }
   ```

3. Créer API endpoints (3h)
   - `GET /api/advisor/clients/[id]/taxation`
   - `POST /api/advisor/clients/[id]/taxation`
   - `GET /api/advisor/clients/[id]/calculations` (calculs IR, IFI)

4. Adapter UI (3h)
5. Intégrer dans Client360 (2h)

**Livrables** :
- ✅ Tab Fiscalité avec IR complet
- ✅ Section IFI si patrimoine > 1.3M€
- ✅ Prélèvements sociaux
- ✅ Optimisations fiscales avec priorités

---

#### R1.3 - budget-calculator.js (8h)
**Fichier source** : `lib/budget-calculator.js` (235 lignes)

**Actions** :
1. Copier vers `app/_common/lib/services/budget-service.ts` (2h)
2. Adapter JS → TypeScript + Prisma (3h)
3. Tests unitaires (2h)
4. Intégration dans API budget (1h)

**Fonctions** :
```typescript
// 1. Calcul budget mensuel
calculateMonthlyBudget(client: Client, transactions?: Transaction[]): BudgetMetrics

// 2. Prévisionnel 12 mois
generateForecast(client: Client, currentBudget: Budget, assumptions?: ForecastAssumptions): MonthlyForecast[]

// 3. Détection anomalies
detectBudgetAnomalies(budget: Budget): BudgetAlert[]

// 4. Recommandations
generateBudgetRecommendations(client: Client, budget: Budget, forecast: MonthlyForecast[]): BudgetRecommendation[]

// 5. Export CSV
exportBudgetCSV(budget: Budget, forecast: MonthlyForecast[]): string
```

**Livrables** :
- ✅ Service budget complet
- ✅ Calculs auto revenus/charges
- ✅ Détection anomalies (épargne négative, logement >35%, etc.)
- ✅ Recommandations intelligentes

---

#### R1.4 - fiscalite-complete.js (5h)
**Fichier source** : `lib/simulators/fiscalite-complete.js` (375 lignes)

**Actions** :
1. Copier vers `app/_common/lib/services/tax-service.ts` (2h)
2. Adapter + TypeScript (2h)
3. Tests (1h)

**Fonctions** :
```typescript
// Calcul IR 2024 complet
calculateIRComplete(params: IRParams): IRResult
  - Parts fiscales (avec handicap, anciens combattants)
  - Quotient familial
  - Impôt par tranches
  - Plafonnement QF
  - Décote
  - Réductions/Crédits d'impôt
  - TMI, taux moyen

// Calcul IFI 2024 complet
calculateIFIComplete(params: IFIParams): IFIResult
  - Patrimoine net taxable
  - Abattement résidence principale 30%
  - Seuil 1.3M€
  - Calcul par tranches
  - Décote
```

**Livrables** :
- ✅ Calculs fiscaux exacts (barème 2024)
- ✅ IR complet avec mécanismes
- ✅ IFI complet
- ✅ Prélèvements sociaux

---

### PHASE R2 - HAUTE (Semaine 3-4) - 32h

**Objectif** : Formulaire enrichi + Tab Famille

#### R2.1 - Formulaire création 7 étapes (16h)
**Fichier source** : `app/dashboard/clients/nouveau/page.js` (866 lignes)

**Actions** :
1. Créer `CreateClientWizard.tsx` (8h)
   - Stepper 7 étapes
   - Validation Zod par étape
   - Sauvegarde progressive
   
2. Adapter schema Client Prisma (4h)
   - Ajouter champs manquants (civilite, nomUsage, taxResidence, etc.)
   - Migration BDD
   
3. Adapter API POST /clients (2h)
4. Tests & validation (2h)

**7 Étapes** :
1. Type relation (PROSPECT/CLIENT, INDIVIDUAL/PROFESSIONAL)
2. Identification (civilité, nom, prénom, nomUsage, birthDate, birthPlace, nationality, taxResidence)
3. Coordonnées (email, phone, mobile, address structuré)
4. Situation familiale (maritalStatus, matrimonialRegime, numberOfChildren, dependents)
5. Situation professionnelle (profession, employerName, professionCategory, employmentType, employmentSince)
6. Patrimoine estimé (netWealth, financialAssets, realEstateAssets, annualIncome)
7. KYC/MIFID (riskProfile, investmentHorizon, investmentObjective, investmentKnowledge, notes)

**Livrables** :
- ✅ Wizard 7 étapes fonctionnel
- ✅ Validation stricte
- ✅ 50+ champs collectés
- ✅ UX fluide avec stepper visuel

---

#### R2.2 - TabFamily dédié (10h)
**Fichier source** : `components/client360/TabFamily.jsx` (15KB)

**Actions** :
1. Copier TabFamily (3h)
2. Adapter schema FamilyMember (2h)
3. API CRUD membres famille (3h)
4. Intégration Client360 (2h)

**Livrables** :
- ✅ Tab Famille séparé de Profil
- ✅ Gestion conjoint détaillé
- ✅ Gestion enfants (array)
- ✅ Autres personnes à charge

---

#### R2.3 - TabWealth enrichi (6h)
**Fichier source** : `components/client360/TabWealth.jsx` (44KB)

**Actions** :
1. Comparer avec TabWealth actuel (2h)
2. Récupérer fonctionnalités manquantes (3h)
3. Tests (1h)

**Améliorations** :
- Graphiques supplémentaires
- Calculs avancés (liquidité, leverage)
- Analyse performance
- Benchmarks

---

### PHASE R3 - MOYENNE (Semaine 5-6) - 32h

**Objectif** : Pages Dashboard + Moteur opportunités

#### R3.1 - opportunities-engine.js (12h)
**Fichier source** : `lib/opportunities-engine.js` (384 lignes)

**Actions** :
1. Copier moteur opportunités (4h)
2. Adapter Mongoose → Prisma (4h)
3. Configurer règles détection (2h)
4. Tests (2h)

**8 Règles automatiques** :
1. DIVERSIFICATION_NEEDED (priorité 8)
2. RETIREMENT_PREPARATION (priorité 9)
3. TAX_OPTIMIZATION (priorité 7)
4. LIFE_INSURANCE_UNDERUSED (priorité 6)
5. SUCCESSION_PLANNING (priorité 8)
6. DEBT_CONSOLIDATION (priorité 7)
7. REAL_ESTATE_INVESTMENT (priorité 5)
8. PER_OPPORTUNITY (priorité 6)

**Livrables** :
- ✅ Détection auto opportunités
- ✅ Scoring intelligent
- ✅ Recommandations prioritaires

---

#### R3.2 - Page Appointments (8h)
**Fichier source** : `app/dashboard/appointments/page.js`

**Actions** :
1. Créer modèle Appointment Prisma (2h)
2. Page appointments + calendrier (4h)
3. API CRUD (2h)

**Livrables** :
- ✅ Gestion rendez-vous
- ✅ Calendrier visuel
- ✅ Notifications

---

#### R3.3 - Page Tasks (6h)
**Fichier source** : `app/dashboard/taches/page.js`

**Actions** :
1. Modèle Task Prisma (1h)
2. Page tâches (3h)
3. API CRUD (2h)

**Livrables** :
- ✅ Gestion tâches
- ✅ Assignation
- ✅ Deadlines

---

#### R3.4 - Page Pipeline (6h)
**Fichier source** : `app/dashboard/pipeline/page.js`

**Actions** :
1. Modèle Pipeline Prisma (1h)
2. Kanban pipeline (3h)
3. API (2h)

**Livrables** :
- ✅ Pipeline ventes
- ✅ Kanban drag & drop
- ✅ Suivi conversions

---

### PHASE R4 - BASSE (Semaine 7-8) - 24h

**Objectif** : Fonctionnalités avancées

#### R4.1 - Communication (8h)
- Module communication complet
- Emails, SMS, notifications

#### R4.2 - Conformité (8h)
- Gestion conformité
- Audits, rapports

#### R4.3 - Workflows (8h)
- Workflows automatisés
- Déclencheurs, actions

---

## 📊 RÉCAPITULATIF PLANNING

| Phase | Durée | Effort | Priorité | Gain Fonctionnalités |
|-------|-------|--------|----------|---------------------|
| **R1 - Budget & Fiscalité** | 2 sem | 40h | 🔴 CRITIQUE | +40% (0% → 40%) |
| **R2 - Formulaires & Famille** | 2 sem | 32h | 🟠 HAUTE | +20% (40% → 60%) |
| **R3 - Dashboard & Opportunités** | 2 sem | 32h | 🟡 MOYENNE | +20% (60% → 80%) |
| **R4 - Fonctionnalités avancées** | 2 sem | 24h | 🟢 BASSE | +20% (80% → 100%) |
| **TOTAL** | **8 sem** | **128h** | - | **+70%** |

---

## 🎯 LIVRABLE FINAL (8 semaines)

### Complétude CRM
- Formulaire Client : **15% → 95%** (+80%)
- Client 360 Tabs : **50% → 95%** (+45%)
- Budget & Fiscalité : **0% → 95%** (+95%)
- Dashboard Pages : **60% → 90%** (+30%)
- Lib/Calculateurs : **30% → 90%** (+60%)
- Simulateurs : **50% → 85%** (+35%)

### MOYENNE GLOBALE
- **Avant** : 30-40%
- **Après** : **90-95%**
- **GAIN** : **+60%**

---

## 🚀 PROCHAINE ACTION IMMÉDIATE

**COMMENCER PAR R1.1 - TabBudget (15h)**

1. ✅ Copier `TabBudget.jsx`
2. ✅ Créer schema `ClientBudget` Prisma
3. ✅ Migration BDD
4. ✅ Adapter composant React
5. ✅ API endpoints
6. ✅ Intégrer dans Client360
7. ✅ Tests

**Délai** : 2-3 jours pour avoir Tab Budget fonctionnel
