# PLAN D'ACTION - CLIENT 360 COMPLET

**Date** : 24 novembre 2024  
**Objectif** : Passer de 7% à 95%+ de complétude pour un outil CGP professionnel  
**Durée estimée** : 3-4 semaines

---

## 📊 GAPS IDENTIFIÉS

| Module | Actuel | Cible | Écart |
|--------|--------|-------|-------|
| Formulaire Particulier | 7% (11/150 champs) | 95% | +139 champs |
| Formulaire Professionnel | 6.5% (13/200 champs) | 95% | +177 champs |
| Tab Budget/Revenus | **0%** | 95% | **Création complète** |
| Tab Fiscalité | 10% | 95% | +85% |
| Tab Projections | **0%** | 95% | **Création complète** |
| Tab Performance | 5% | 95% | +90% |

---

## 🎯 PHASES D'IMPLÉMENTATION

### PHASE A - BUDGET & REVENUS/CHARGES (1 semaine) ⚠️ CRITIQUE
**Impact** : CRITIQUE - Base conseil patrimonial  
**Estimation** : 40h

**Livrables** :
- Modèle `ClientBudget` (revenus détaillés, charges détaillées, épargne)
- API `/clients/[id]/budget` (GET/POST/PUT + calculs auto)
- UI `TabBudget.tsx` (KPI, graphiques, formulaire édition)
- Calculs auto : capacité épargne, taux épargne, reste à vivre

### PHASE B - FISCALITÉ DÉTAILLÉE (1 semaine) ⚠️ HAUTE
**Impact** : HAUTE - Optimisation fiscale = valeur ajoutée  
**Estimation** : 32h

**Livrables** :
- Modèle `ClientFiscalite` + `DefiscalisationClient`
- API `/clients/[id]/fiscalite` + `/defiscalisations`
- UI `TabFiscalite.tsx` (déclaration, simulations IR, IFI, défiscalisations)
- Calculs IR 2024, quotient familial, niche fiscale

### PHASE C - FORMULAIRES ENRICHIS (1 semaine) ⚠️ HAUTE
**Impact** : HAUTE - Data quality + première impression  
**Estimation** : 32h

**Livrables** :
- Wizard `CreateClientParticulierWizard.tsx` (8 étapes, 150+ champs)
- Wizard `CreateClientProfessionnelWizard.tsx` (10 étapes, 200+ champs)
- Validation Zod stricte, sauvegarde progressive
- Sections : identité, famille, professionnel, budget, fiscalité, MiFID, projets

### PHASE D - PROJECTIONS & PERFORMANCE (3-5 jours)
**Impact** : MOYENNE - Valeur ajoutée conseil  
**Estimation** : 24h

**Livrables** :
- UI `TabProjections.tsx` (évolution patrimoine 5/10/20/30 ans)
- UI `TabPerformance.tsx` (rendements, benchmarks, volatilité)
- Calculs projections Monte Carlo
- Graphiques évolution temporelle

---

## 📋 DÉTAILS TECHNIQUES - PHASE A (Budget)

### Modèle données
```prisma
model ClientBudget {
  id String @id @default(cuid())
  clientId String @unique
  
  // REVENUS (15 champs)
  salairesNetsMensuels Decimal
  primesAnnuelles Decimal
  revenusFonciersAnnuels Decimal
  dividendesAnnuels Decimal
  // ... + 11 autres
  
  // CHARGES (20 champs)
  loyerMensuel Decimal
  mensualitesPretsTotal Decimal
  impotRevenuAnnuel Decimal
  assuranceHabitation Decimal
  alimentationCourses Decimal
  // ... + 15 autres
  
  // ÉPARGNE (auto-calculés)
  capaciteEpargneMensuelle Decimal?
  tauxEpargne Decimal?
  objectifEpargneSecurite Decimal?
  
  @@map("client_budgets")
}
```

### API
```typescript
// Calculs automatiques
function calculateBudgetMetrics(budget: ClientBudget) {
  const revenusMensuels = 
    budget.salairesNetsMensuels +
    (budget.primesAnnuelles / 12) +
    (budget.revenusFonciersAnnuels / 12) +
    // ... tous revenus
  
  const chargesMensuelles = 
    budget.loyerMensuel +
    budget.mensualitesPretsTotal +
    (budget.impotRevenuAnnuel / 12) +
    // ... toutes charges
  
  const capaciteEpargneMensuelle = revenusMensuels - chargesMensuelles
  const tauxEpargne = (capaciteEpargneMensuelle / revenusMensuels) * 100
  
  return {
    revenusMensuels,
    revenusAnnuels: revenusMensuels * 12,
    chargesMensuelles,
    chargesAnnuelles: chargesMensuelles * 12,
    capaciteEpargneMensuelle,
    tauxEpargne,
    epargneSecuriteMin: chargesMensuelles * 3,
    epargneSecuriteMax: chargesMensuelles * 6,
  }
}
```

### UI
```typescript
export function TabBudget({ clientId }: TabBudgetProps) {
  // KPI Cards : Revenus, Charges, Capacité épargne, Reste à vivre
  // Graphique BarChart : Revenus vs Charges (mensuel + annuel)
  // Sections éditables : Détail revenus, Détail charges
  // Section épargne : Objectifs + recommandations
}
```

---

## 📋 DÉTAILS TECHNIQUES - PHASE B (Fiscalité)

### Modèle données
```prisma
model ClientFiscalite {
  id String @id @default(cuid())
  clientId String @unique
  
  anneeFiscale Int
  nombreParts Decimal // Auto-calculé
  revenuFiscalReference Decimal
  revenuImposable Decimal
  trancheMarginalImposition String
  montantImpotRevenu Decimal
  
  // IFI
  ifiAssujetti Boolean
  ifiBaseImposable Decimal?
  ifiMontantPaye Decimal?
  
  // Crédits
  creditImpotEmploiDomicile Decimal
  creditImpotDons Decimal
  
  // Niche fiscale
  nicheFiscaleConsommee Decimal
  
  @@map("client_fiscalite")
}

model DefiscalisationClient {
  id String @id @default(cuid())
  clientId String
  
  type String // PINEL, MALRAUX, PER, etc.
  montantInvesti Decimal
  reductionObtenue Decimal
  anneeDebut Int
  dureeEngagement Int
  
  @@map("defiscalisations_client")
}
```

### Calculs clés
```typescript
// Quotient familial
function calculateTaxShares(client: Client): number {
  let shares = ['SINGLE', 'DIVORCED', 'WIDOWED'].includes(client.maritalStatus) ? 1 : 2
  const children = client.numberOfChildren || 0
  if (children > 0) shares += 0.5
  if (children > 1) shares += 0.5
  if (children > 2) shares += (children - 2) * 1
  return shares
}

// IR 2024
function calculateIncomeTax(revenuImposable: number, shares: number) {
  const revenuParPart = revenuImposable / shares
  const TRANCHES_2024 = [
    { limit: 11294, rate: 0 },
    { limit: 28797, rate: 0.11 },
    { limit: 82341, rate: 0.30 },
    { limit: 177106, rate: 0.41 },
    { limit: Infinity, rate: 0.45 }
  ]
  // ... calcul par tranches
}
```

---

## 📋 DÉTAILS TECHNIQUES - PHASE C (Formulaires)

### Wizard Particulier (8 étapes)
1. Identité & Contact (10 champs)
2. Situation Familiale (conjoint, enfants array, autres à charge)
3. Situation Professionnelle (CSP, employeur, contrat, retraite)
4. Budget Revenus (15 champs)
5. Budget Charges (20 champs)
6. Fiscalité (foyer, déclaration, IFI, défiscalisations)
7. Profil Investisseur (questionnaire MiFID II complet)
8. Projets & Objectifs (array projets)

### Wizard Professionnel (10 étapes)
1. Identification Entreprise (SIRET, SIREN, NAF, capital)
2. Coordonnées & Sièges
3. Informations Financières (CA, résultats, bilan)
4. Fiscalité Entreprise (IS, crédits impôt)
5. Gouvernance (dirigeants, actionnariat)
6. RH (effectif, masse salariale)
7. Contacts (principal, secondaires, experts)
8. Banque & Assurances
9. Besoins Patrimoniaux
10. Prévoyance & Transmission

---

## 🚀 PROCHAINE ÉTAPE

**Commencer PHASE A - Budget & Revenus/Charges** (1 semaine)

Ordre recommandé :
1. Modèle Prisma (2h)
2. Migration BDD (30min)
3. API endpoints + calculs (3h)
4. UI TabBudget (5h)
5. Tests & validation (1h)

**Total estimé Phase A** : 11.5h (~1.5 jours)
