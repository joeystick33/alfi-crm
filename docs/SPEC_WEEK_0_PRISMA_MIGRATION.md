# SPEC TECHNIQUE - SEMAINE 0 : PRISMA & MIGRATION

**Version** : 1.0  
**Durée** : 3 jours  
**Objectif** : Créer fondations BDD sans casser l'existant

---

## 📋 SOMMAIRE

1. [Schémas Prisma détaillés](#schemas)
2. [Commandes migration](#migration)
3. [Types TypeScript](#types)
4. [Validation Zod](#validation)
5. [Tests](#tests)

---

## <a name="schemas"></a>1. SCHÉMAS PRISMA DÉTAILLÉS

### Fichier modifié
`prisma/schema.prisma`

### Backup obligatoire
```bash
cp prisma/schema.prisma prisma/schema.prisma.backup.$(date +%Y%m%d_%H%M%S)
```

---

### 1.1 ClientBudget (NOUVEAU - ligne ~430)

```prisma
model ClientBudget {
  id        String   @id @default(cuid())
  clientId  String   @unique
  client    Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  
  professionalIncome   Json?
  assetIncome          Json?
  spouseIncome         Json?
  retirementPensions   Json?
  allowances           Json?
  monthlyExpenses      Json?
  
  totalRevenue         Decimal?  @db.Decimal(12, 2)
  totalExpenses        Decimal?  @db.Decimal(12, 2)
  savingsCapacity      Decimal?  @db.Decimal(12, 2)
  savingsRate          Decimal?  @db.Decimal(5, 2)
  
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  
  @@map("client_budgets")
}
```

---

### 1.2 ClientTaxation (NOUVEAU - après ClientBudget)

```prisma
model ClientTaxation {
  id                   String    @id @default(cuid())
  clientId             String    @unique
  client               Client    @relation(fields: [clientId], references: [id], onDelete: Cascade)
  anneeFiscale         Int       @default(2024)
  incomeTax            Json?
  ifi                  Json?
  socialContributions  Json?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  
  @@map("client_taxation")
}
```

---

### 1.3 TaxOptimization (NOUVEAU - après ClientTaxation)

```prisma
enum TaxOptimizationPriority {
  HIGH
  MEDIUM
  LOW
}

enum TaxOptimizationStatus {
  DETECTED
  REVIEWED
  IN_PROGRESS
  COMPLETED
  DISMISSED
}

model TaxOptimization {
  id                String                      @id @default(cuid())
  clientId          String
  client            Client                      @relation(fields: [clientId], references: [id], onDelete: Cascade)
  priority          TaxOptimizationPriority     @default(MEDIUM)
  category          String
  title             String
  description       String                      @db.Text
  potentialSavings  Decimal?                    @db.Decimal(10, 2)
  recommendation    String                      @db.Text
  status            TaxOptimizationStatus       @default(DETECTED)
  reviewedAt        DateTime?
  reviewedBy        String?
  completedAt       DateTime?
  dismissedAt       DateTime?
  dismissReason     String?                     @db.Text
  createdAt         DateTime                    @default(now())
  updatedAt         DateTime                    @updatedAt
  
  @@index([clientId])
  @@index([clientId, status])
  @@index([priority])
  @@map("tax_optimizations")
}
```

---

### 1.4 Client (ENRICHIR - ligne ~285)

**Ajouter APRÈS les champs existants** :

```prisma
model Client {
  // ... CHAMPS EXISTANTS ...
  
  // NOUVEAUX CHAMPS
  civilite             String?
  nomUsage             String?
  taxResidenceCountry  String?
  matrimonialRegime    String?
  dependents           Int?     @default(0)
  professionCategory   String?
  employmentType       String?
  employmentSince      DateTime?
  
  // NOUVELLES RELATIONS
  budget               ClientBudget?
  taxation             ClientTaxation?
  taxOptimizations     TaxOptimization[]
  
  // ... RELATIONS EXISTANTES ...
}
```

---

### 1.5 FamilyMember (ENRICHIR - ligne ~414)

```prisma
model FamilyMember {
  // ... CHAMPS EXISTANTS ...
  
  // NOUVEAUX CHAMPS
  civility         String?
  profession       String?
  annualIncome     Decimal?  @db.Decimal(10, 2)
  isDependent      Boolean   @default(false)
  email            String?
  phone            String?
  notes            String?   @db.Text
  
  // ... DATES EXISTANTES ...
}
```

---

### 1.6 Actif (ENRICHIR - ligne ~468)

```prisma
model Actif {
  // ... CHAMPS EXISTANTS ...
  
  // NOUVEAUX CHAMPS
  location                String?
  managementAdvisor       String?
  managementSince         DateTime?
  fiscalPropertyType      String?
  fiscalRpAbatement       Boolean   @default(false)
  fiscalManualDiscount    Decimal?  @db.Decimal(5, 2)
  fiscalIfiValue          Decimal?  @db.Decimal(15, 2)
  linkedPassifId          String?
  
  // ... CHAMPS EXISTANTS ...
}
```

---

### 1.7 Passif (ENRICHIR - ligne ~525)

```prisma
model Passif {
  // ... CHAMPS EXISTANTS ...
  
  // NOUVEAU CHAMP
  insuranceRate        Decimal?  @db.Decimal(5, 2)
  
  // ... CHAMPS EXISTANTS ...
}
```

---

### 1.8 FamilyRelationship (ENRICHIR enum)

```prisma
enum FamilyRelationship {
  SPOUSE
  CHILD
  PARENT
  SIBLING
  GRANDCHILD
  OTHER
  ASCENDANT  // AJOUTER
}
```

---

## <a name="migration"></a>2. MIGRATION

### 2.1 Commandes

```bash
# Validation
npx prisma validate

# Format
npx prisma format

# Migration
npx prisma migrate dev --name add_budget_taxation_enrichments

# Generate client
npx prisma generate

# Status
npx prisma migrate status
```

### 2.2 Tests post-migration

```bash
# Vérifier tables créées
psql $DATABASE_URL -c "\dt client_budgets"
psql $DATABASE_URL -c "\dt client_taxation"
psql $DATABASE_URL -c "\dt tax_optimizations"

# Vérifier colonnes ajoutées
psql $DATABASE_URL -c "\d clients" | grep civilite
psql $DATABASE_URL -c "\d family_members" | grep civility
psql $DATABASE_URL -c "\d actifs" | grep fiscalPropertyType
psql $DATABASE_URL -c "\d passifs" | grep insuranceRate
```

---

## <a name="types"></a>3. TYPES TYPESCRIPT

### Fichier : `app/_common/lib/api-types.ts`

Ajouter EN FIN de fichier :

```typescript
// BUDGET
export interface ClientBudget {
  id: string;
  clientId: string;
  professionalIncome?: {
    netSalary: number;
    selfEmployedIncome: number;
    bonuses: number;
    other: number;
  };
  assetIncome?: {
    rentalIncome: number;
    dividends: number;
    interest: number;
    capitalGains: number;
  };
  spouseIncome?: {
    netSalary: number;
    other: number;
  };
  retirementPensions?: { total: number };
  allowances?: { total: number };
  monthlyExpenses?: {
    housing: { total: number };
    utilities: { total: number };
    food: { total: number };
    transportation: { total: number };
    insurance: { total: number };
    leisure: { total: number };
    health: { total: number };
    education: { total: number };
    loans: { total: number };
    other: { total: number };
  };
  totalRevenue?: number;
  totalExpenses?: number;
  savingsCapacity?: number;
  savingsRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

// TAXATION
export interface ClientTaxation {
  id: string;
  clientId: string;
  anneeFiscale: number;
  incomeTax?: {
    fiscalReferenceIncome: number;
    taxShares: number;
    quotientFamilial: number;
    taxBracket: number;
    annualAmount: number;
    monthlyPayment: number;
    taxCredits: number;
    taxReductions: number;
  };
  ifi?: {
    taxableRealEstateAssets: number;
    deductibleLiabilities: number;
    netTaxableIFI: number;
    ifiAmount: number;
    bracket: string;
    threshold: number;
  };
  socialContributions?: {
    taxableAssetIncome: number;
    rate: number;
    amount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type TaxOptimizationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TaxOptimizationStatus = 'DETECTED' | 'REVIEWED' | 'IN_PROGRESS' | 'COMPLETED' | 'DISMISSED';

export interface TaxOptimization {
  id: string;
  clientId: string;
  priority: TaxOptimizationPriority;
  category: string;
  title: string;
  description: string;
  potentialSavings?: number;
  recommendation: string;
  status: TaxOptimizationStatus;
  reviewedAt?: Date;
  reviewedBy?: string;
  completedAt?: Date;
  dismissedAt?: Date;
  dismissReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## <a name="validation"></a>4. VALIDATION ZOD

### Fichier : `app/_common/lib/validation-schemas.ts` (CRÉER)

```typescript
import { z } from 'zod';

export const clientBudgetSchema = z.object({
  professionalIncome: z.object({
    netSalary: z.number().min(0).default(0),
    selfEmployedIncome: z.number().min(0).default(0),
    bonuses: z.number().min(0).default(0),
    other: z.number().min(0).default(0),
  }).optional(),
  assetIncome: z.object({
    rentalIncome: z.number().min(0).default(0),
    dividends: z.number().min(0).default(0),
    interest: z.number().min(0).default(0),
    capitalGains: z.number().min(0).default(0),
  }).optional(),
  spouseIncome: z.object({
    netSalary: z.number().min(0).default(0),
    other: z.number().min(0).default(0),
  }).optional(),
  retirementPensions: z.object({
    total: z.number().min(0).default(0),
  }).optional(),
  allowances: z.object({
    total: z.number().min(0).default(0),
  }).optional(),
  monthlyExpenses: z.object({
    housing: z.object({ total: z.number().min(0).default(0) }).optional(),
    utilities: z.object({ total: z.number().min(0).default(0) }).optional(),
    food: z.object({ total: z.number().min(0).default(0) }).optional(),
    transportation: z.object({ total: z.number().min(0).default(0) }).optional(),
    insurance: z.object({ total: z.number().min(0).default(0) }).optional(),
    leisure: z.object({ total: z.number().min(0).default(0) }).optional(),
    health: z.object({ total: z.number().min(0).default(0) }).optional(),
    education: z.object({ total: z.number().min(0).default(0) }).optional(),
    loans: z.object({ total: z.number().min(0).default(0) }).optional(),
    other: z.object({ total: z.number().min(0).default(0) }).optional(),
  }).optional(),
});

export const clientTaxationSchema = z.object({
  anneeFiscale: z.number().int().min(2020).max(2030).default(2024),
  incomeTax: z.object({
    fiscalReferenceIncome: z.number().min(0),
    taxShares: z.number().min(0.5).max(10),
    quotientFamilial: z.number().min(0),
    taxBracket: z.number().int().min(0).max(45),
    annualAmount: z.number().min(0),
    monthlyPayment: z.number().min(0),
    taxCredits: z.number().min(0).default(0),
    taxReductions: z.number().min(0).default(0),
  }).optional(),
  ifi: z.object({
    taxableRealEstateAssets: z.number().min(0),
    deductibleLiabilities: z.number().min(0),
    netTaxableIFI: z.number().min(0),
    ifiAmount: z.number().min(0),
    bracket: z.string(),
    threshold: z.number().default(1300000),
  }).optional(),
  socialContributions: z.object({
    taxableAssetIncome: z.number().min(0),
    rate: z.number().min(0).max(1).default(0.172),
    amount: z.number().min(0),
  }).optional(),
});

export const taxOptimizationSchema = z.object({
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).default('MEDIUM'),
  category: z.string().min(1),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  potentialSavings: z.number().min(0).optional(),
  recommendation: z.string().min(1),
  status: z.enum(['DETECTED', 'REVIEWED', 'IN_PROGRESS', 'COMPLETED', 'DISMISSED']).default('DETECTED'),
});
```

---

## <a name="tests"></a>5. TESTS

### Fichier : `tests/prisma-migration.test.ts` (CRÉER)

```typescript
import { describe, test, expect } from 'vitest';
import { prisma } from '@/app/_common/lib/prisma';

describe('Prisma Migration - Week 0', () => {
  test('ClientBudget model exists', async () => {
    const count = await prisma.clientBudget.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('ClientTaxation model exists', async () => {
    const count = await prisma.clientTaxation.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('TaxOptimization model exists', async () => {
    const count = await prisma.taxOptimization.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('Client has new fields', async () => {
    const client = await prisma.client.findFirst({
      select: {
        civilite: true,
        nomUsage: true,
        matrimonialRegime: true,
        dependents: true,
        professionCategory: true,
        employmentType: true,
        employmentSince: true,
      },
    });
    // Should not throw
    expect(client).toBeDefined();
  });

  test('FamilyMember has new fields', async () => {
    const member = await prisma.familyMember.findFirst({
      select: {
        civility: true,
        profession: true,
        annualIncome: true,
        isDependent: true,
        email: true,
        phone: true,
        notes: true,
      },
    });
    expect(member).toBeDefined();
  });

  test('Actif has new fields', async () => {
    const actif = await prisma.actif.findFirst({
      select: {
        location: true,
        managementAdvisor: true,
        managementSince: true,
        fiscalPropertyType: true,
        fiscalRpAbatement: true,
        fiscalManualDiscount: true,
        fiscalIfiValue: true,
        linkedPassifId: true,
      },
    });
    expect(actif).toBeDefined();
  });

  test('Passif has insuranceRate field', async () => {
    const passif = await prisma.passif.findFirst({
      select: { insuranceRate: true },
    });
    expect(passif).toBeDefined();
  });
});
```

---

## ✅ CHECKLIST SEMAINE 0

- [ ] Backup schema.prisma
- [ ] Ajouter 3 nouveaux modèles
- [ ] Enrichir 4 modèles existants
- [ ] Enrichir 1 enum
- [ ] Valider schéma
- [ ] Créer migration
- [ ] Generate client
- [ ] Tester migration
- [ ] Créer types TypeScript
- [ ] Créer schemas Zod
- [ ] Tests unitaires passent
- [ ] Documenter changements

---

## 🚀 NEXT: SEMAINE 1 - Services Budget

Voir `SPEC_WEEK_1_BUDGET_SERVICE.md`
