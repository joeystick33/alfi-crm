# Mapping MongoDB → Prisma - Guide Complet

## Vue d'ensemble

Ce document détaille le mapping complet entre les modèles MongoDB du CRM source et les modèles Prisma d'alfi-crm.

## Changements Fondamentaux

### 1. Type d'ID

| MongoDB | Prisma | Exemple |
|---------|--------|---------|
| `_id: ObjectId` | `id: String @id @default(cuid())` | `"507f..."` → `"ckl123..."` |

### 2. Relations

| MongoDB | Prisma | Notes |
|---------|--------|-------|
| `ref: 'Model'` | `@relation` | Relations explicites |
| `populate()` | `include: {}` | Chargement explicite |
| Embedded docs | Relations ou `Json` | Selon la complexité |

### 3. Dates

| MongoDB | Prisma | Notes |
|---------|--------|-------|
| `Date` | `DateTime` | Type natif PostgreSQL |
| `default: Date.now` | `@default(now())` | Fonction Prisma |

## Mapping des Modèles Principaux

### Client / Particulier

**MongoDB (CRM/lib/models/Client.js)**
```javascript
{
  _id: ObjectId,
  cabinetId: ObjectId,
  conseillerId: ObjectId,
  email: String,
  firstName: String,
  lastName: String,
  birthDate: Date,
  phone: String,
  address: String,  // String simple
  city: String,
  postalCode: String,
  maritalStatus: Enum,
  profession: String,
  annualIncome: Number,
  riskProfile: Enum,
  kycCompleted: Boolean,
  totalAssets: Number,  // Calculé
  totalLiabilities: Number,  // Calculé
  netWealth: Number,  // Calculé
  taxation: {  // Embedded document
    incomeTax: { ... },
    ifi: { ... }
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Prisma (alfi-crm/prisma/schema.prisma)**
```prisma
model Client {
  id                     String @id @default(cuid())
  cabinetId              String
  cabinet                Cabinet @relation(...)
  conseillerId           String
  conseiller             User @relation(...)
  email                  String?
  firstName              String
  lastName               String
  birthDate              DateTime?
  phone                  String?
  address                Json?  // Structure flexible
  maritalStatus          MaritalStatus?
  profession             String?
  annualIncome           Decimal? @db.Decimal(12, 2)
  riskProfile            RiskProfile?
  kycStatus              KYCStatus @default(PENDING)
  wealth                 Json?  // Calculé, stocké en Json
  status                 ClientStatus @default(PROSPECT)
  portalAccess           Boolean @default(false)
  portalPassword         String?
  createdAt              DateTime @default(now())
  updatedAt              DateTime @updatedAt
  
  // Relations
  actifs                 ClientActif[]
  passifs                Passif[]
  contrats               Contrat[]
  objectifs              Objectif[]
  simulations            Simulation[]
  documents              ClientDocument[]
}
```

**Changements clés:**
- `_id` → `id` (cuid)
- `cabinetId` ObjectId → String avec relation `@relation`
- `address` String → `Json` (structure flexible)
- `kycCompleted` Boolean → `kycStatus` Enum
- `totalAssets/Liabilities/netWealth` → `wealth` Json
- `taxation` embedded → `Json` ou modèle séparé
- Ajout de `status`, `portalAccess`, `portalPassword`

### Actif

**MongoDB (CRM/lib/models/Actif.js)**
```javascript
{
  _id: ObjectId,
  particulierId: ObjectId,
  cabinetId: ObjectId,
  conseillerId: ObjectId,
  type: Enum,
  name: String,
  currentValue: Number,
  purchaseValue: Number,
  purchaseDate: Date,
  annualIncome: Number,
  managed: Boolean,
  managedBy: ObjectId,
  valuationHistory: [{  // Embedded array
    date: Date,
    value: Number
  }],
  allocation: [{  // Embedded array
    assetClass: String,
    percentage: Number
  }],
  ownership: Number,  // 0-100
  isActive: Boolean
}
```

**Prisma**
```prisma
model Actif {
  id                   String @id @default(cuid())
  cabinetId            String
  cabinet              Cabinet @relation(...)
  type                 ActifType
  category             ActifCategory
  name                 String
  value                Decimal @db.Decimal(15, 2)
  acquisitionDate      DateTime?
  acquisitionValue     Decimal? @db.Decimal(15, 2)
  details              Json?  // valuationHistory, allocation
  annualIncome         Decimal? @db.Decimal(12, 2)
  managedByFirm        Boolean @default(false)
  managementFees       Decimal? @db.Decimal(5, 2)
  isActive             Boolean @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  
  // Relations many-to-many avec Client
  clients              ClientActif[]
  documents            ActifDocument[]
}

model ClientActif {
  id                   String @id @default(cuid())
  clientId             String
  actifId              String
  client               Client @relation(...)
  actif                Actif @relation(...)
  ownershipPercentage  Decimal @default(100.00) @db.Decimal(5, 2)
  ownershipType        String?
  createdAt            DateTime @default(now())
  
  @@unique([clientId, actifId])
}
```

**Changements clés:**
- `particulierId` → Relation many-to-many via `ClientActif`
- `currentValue` → `value` (Decimal)
- `valuationHistory` embedded → `details` Json
- `allocation` embedded → `details` Json
- `managed` + `managedBy` → `managedByFirm` + `managementFees`
- `ownership` → `ownershipPercentage` dans table de jointure

### Simulation

**MongoDB (CRM/lib/models/Simulation.js)**
```javascript
{
  _id: ObjectId,
  conseillerId: ObjectId,
  particulierId: ObjectId,
  type: Enum,
  name: String,
  description: String,
  inputs: Mixed,  // JSON libre
  outputs: Mixed,  // JSON libre
  resultSummary: String,
  savingsPotential: Number,
  status: Enum,
  sharedWithClient: Boolean,
  clientViewed: Boolean,
  clientViewedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Prisma**
```prisma
model Simulation {
  id                   String @id @default(cuid())
  cabinetId            String
  cabinet              Cabinet @relation(...)
  clientId             String
  client               Client @relation(...)
  createdById          String
  createdBy            User @relation(...)
  type                 SimulationType
  name                 String
  description          String?
  parameters           Json  // inputs
  results              Json  // outputs
  recommendations      Json?
  feasibilityScore     Int?
  status               SimulationStatus @default(DRAFT)
  sharedWithClient     Boolean @default(false)
  sharedAt             DateTime?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
}
```

**Changements clés:**
- `inputs` → `parameters` Json
- `outputs` → `results` Json
- `resultSummary` + `savingsPotential` → `recommendations` Json
- `clientViewed` + `clientViewedAt` → `sharedAt`
- Ajout de `feasibilityScore`
- Ajout de `cabinetId` pour RLS

## Mapping des Enums

### MaritalStatus

| MongoDB | Prisma |
|---------|--------|
| `CELIBATAIRE` | `SINGLE` |
| `MARIE` | `MARRIED` |
| `DIVORCE` | `DIVORCED` |
| `VEUF` | `WIDOWED` |
| `PACSE` | `PACS` |
| `UNION_LIBRE` | `COHABITATION` |

### RiskProfile

| MongoDB | Prisma |
|---------|--------|
| `PRUDENT` | `CONSERVATEUR` ou `PRUDENT` |
| `MODERE` | `PRUDENT` |
| `EQUILIBRE` | `EQUILIBRE` |
| `DYNAMIQUE` | `DYNAMIQUE` |
| `OFFENSIF` | `OFFENSIF` |

### ActifType

| MongoDB | Prisma |
|---------|--------|
| `REAL_ESTATE` | `REAL_ESTATE_MAIN` / `REAL_ESTATE_RENTAL` / `REAL_ESTATE_SECONDARY` |
| `BANK_ACCOUNT` | `BANK_ACCOUNT` |
| `SAVINGS_ACCOUNT` | `SAVINGS_ACCOUNT` |
| `LIFE_INSURANCE` | `LIFE_INSURANCE` |
| `RETIREMENT` | `PER` / `PERP` / `MADELIN` |
| `SECURITIES` | `SECURITIES_ACCOUNT` / `PEA` / `PEA_PME` |
| `SCPI` | `SCPI` |
| `BUSINESS` | `COMPANY_SHARES` / `PROFESSIONAL_REAL_ESTATE` |
| `PRECIOUS_METALS` | `PRECIOUS_METALS` |
| `ART` | `ART_COLLECTION` |
| `CRYPTO` | `CRYPTO` |
| `OTHER` | `OTHER` |

## Conversion des Queries

### Find All

**MongoDB**
```javascript
const clients = await Client.find({ cabinetId })
  .populate('conseillerId')
  .sort({ createdAt: -1 })
  .limit(10);
```

**Prisma**
```typescript
const clients = await prisma.client.findMany({
  where: { cabinetId },
  include: { conseiller: true },
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

### Find One with Relations

**MongoDB**
```javascript
const client = await Client.findById(id)
  .populate('conseillerId')
  .populate({
    path: 'actifs',
    populate: { path: 'managedBy' }
  });
```

**Prisma**
```typescript
const client = await prisma.client.findUnique({
  where: { id },
  include: {
    conseiller: true,
    actifs: {
      include: {
        actif: {
          include: { cabinet: true }
        }
      }
    }
  }
});
```

### Create with Relations

**MongoDB**
```javascript
const client = await Client.create({
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  cabinetId: cabinetObjectId,
  conseillerId: conseillerObjectId
});
```

**Prisma**
```typescript
const client = await prisma.client.create({
  data: {
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    cabinetId: cabinetId,  // cuid string
    conseillerId: conseillerId  // cuid string
  }
});
```

### Update

**MongoDB**
```javascript
const client = await Client.findByIdAndUpdate(
  id,
  { firstName: 'Jane', phone: '+33123456789' },
  { new: true }
);
```

**Prisma**
```typescript
const client = await prisma.client.update({
  where: { id },
  data: {
    firstName: 'Jane',
    phone: '+33123456789'
  }
});
```

### Delete

**MongoDB**
```javascript
await Client.findByIdAndDelete(id);
```

**Prisma**
```typescript
await prisma.client.delete({
  where: { id }
});
```

### Aggregations

**MongoDB - Count**
```javascript
const count = await Client.countDocuments({ cabinetId, status: 'ACTIVE' });
```

**Prisma**
```typescript
const count = await prisma.client.count({
  where: { cabinetId, status: 'ACTIVE' }
});
```

**MongoDB - Sum**
```javascript
const result = await Actif.aggregate([
  { $match: { particulierId: clientId } },
  { $group: { _id: null, total: { $sum: "$currentValue" } } }
]);
```

**Prisma**
```typescript
const result = await prisma.actif.aggregate({
  where: {
    clients: {
      some: { clientId }
    }
  },
  _sum: { value: true }
});
```

## Embedded Documents → Json ou Relations

### Option 1: Json (Données flexibles)

**MongoDB**
```javascript
{
  taxation: {
    incomeTax: { annualAmount: 5000, taxBracket: 30 },
    ifi: { ifiAmount: 2000, taxableWealth: 1500000 }
  }
}
```

**Prisma**
```typescript
// Stocker en Json
{
  taxDetails: {
    incomeTax: { annualAmount: 5000, taxBracket: 30 },
    ifi: { ifiAmount: 2000, taxableWealth: 1500000 }
  }
}
```

### Option 2: Relations (Données structurées)

**MongoDB**
```javascript
{
  address: {
    street: "123 Main St",
    city: "Paris",
    postalCode: "75001"
  }
}
```

**Prisma - Option A: Json**
```typescript
{
  address: {
    street: "123 Main St",
    city: "Paris",
    postalCode: "75001"
  }
}
```

**Prisma - Option B: Relation**
```prisma
model Client {
  id        String @id
  addressId String?
  address   Address? @relation(...)
}

model Address {
  id         String @id
  street     String
  city       String
  postalCode String
  clients    Client[]
}
```

## Transactions

**MongoDB**
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  await Client.create([{ ... }], { session });
  await Actif.create([{ ... }], { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

**Prisma**
```typescript
await prisma.$transaction(async (tx) => {
  await tx.client.create({ data: { ... } });
  await tx.actif.create({ data: { ... } });
});
```

## Gestion des Erreurs

**MongoDB**
```javascript
try {
  await Client.create({ email: 'duplicate@test.com' });
} catch (error) {
  if (error.code === 11000) {
    // Duplicate key
  }
}
```

**Prisma**
```typescript
import { Prisma } from '@prisma/client';

try {
  await prisma.client.create({ data: { email: 'duplicate@test.com' } });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint violation
    }
  }
}
```

## Checklist de Migration par Modèle

### Client
- [ ] Convertir `_id` → `id` (cuid)
- [ ] Convertir `cabinetId` ObjectId → String
- [ ] Convertir `address` String → Json
- [ ] Convertir `kycCompleted` → `kycStatus`
- [ ] Convertir `taxation` embedded → Json
- [ ] Ajouter `status`, `portalAccess`
- [ ] Tester les queries

### Actif
- [ ] Convertir relations many-to-many
- [ ] Convertir `valuationHistory` → Json
- [ ] Convertir `allocation` → Json
- [ ] Adapter `managed` → `managedByFirm`
- [ ] Tester les queries

### Simulation
- [ ] Convertir `inputs` → `parameters`
- [ ] Convertir `outputs` → `results`
- [ ] Ajouter `cabinetId` pour RLS
- [ ] Tester les queries

## Ressources

- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Client API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [MongoDB to Prisma Migration Guide](https://www.prisma.io/docs/guides/migrate-to-prisma/migrate-from-mongodb)
