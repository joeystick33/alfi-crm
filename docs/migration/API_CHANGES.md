# Changements d'API - MongoDB → Prisma

## Vue d'ensemble

Ce document détaille tous les changements d'API lors de la migration de MongoDB/Mongoose vers Prisma.

## Changements de Types

### IDs

**Avant (MongoDB)**
```javascript
_id: ObjectId("507f1f77bcf86cd799439011")
```

**Après (Prisma)**
```typescript
id: string // cuid format: "ckl1234567890"
```

### Dates

**Avant (MongoDB)**
```javascript
createdAt: ISODate("2024-01-01T00:00:00.000Z")
```

**Après (Prisma)**
```typescript
createdAt: Date // JavaScript Date object
```

## Conversion des Queries

### Récupération de Données

#### Find All

**Avant (MongoDB)**
```javascript
const clients = await Client.find({ cabinetId })
  .populate('assignedTo')
  .sort({ createdAt: -1 })
  .limit(10);
```

**Après (Prisma)**
```typescript
const clients = await prisma.client.findMany({
  where: { cabinetId },
  include: { assignedTo: true },
  orderBy: { createdAt: 'desc' },
  take: 10
});
```

#### Find One

**Avant (MongoDB)**
```javascript
const client = await Client.findById(id).populate('assignedTo');
```

**Après (Prisma)**
```typescript
const client = await prisma.client.findUnique({
  where: { id },
  include: { assignedTo: true }
});
```

#### Find with Conditions

**Avant (MongoDB)**
```javascript
const clients = await Client.find({
  cabinetId,
  status: 'ACTIVE',
  createdAt: { $gte: startDate }
});
```

**Après (Prisma)**
```typescript
const clients = await prisma.client.findMany({
  where: {
    cabinetId,
    status: 'ACTIVE',
    createdAt: { gte: startDate }
  }
});
```

### Création de Données

**Avant (MongoDB)**
```javascript
const client = await Client.create({
  nom,
  prenom,
  email,
  cabinetId,
  assignedToId
});
```

**Après (Prisma)**
```typescript
const client = await prisma.client.create({
  data: {
    nom,
    prenom,
    email,
    cabinetId,
    assignedToId
  }
});
```

### Mise à Jour de Données

**Avant (MongoDB)**
```javascript
const client = await Client.findByIdAndUpdate(
  id,
  { nom, prenom, email },
  { new: true }
);
```

**Après (Prisma)**
```typescript
const client = await prisma.client.update({
  where: { id },
  data: { nom, prenom, email }
});
```

### Suppression de Données

**Avant (MongoDB)**
```javascript
await Client.findByIdAndDelete(id);
```

**Après (Prisma)**
```typescript
await prisma.client.delete({
  where: { id }
});
```

## Relations

### One-to-Many

**Avant (MongoDB)**
```javascript
// Client model
const client = await Client.findById(id).populate('actifs');

// Actif model
const actif = await Actif.findById(id).populate('client');
```

**Après (Prisma)**
```typescript
// Get client with actifs
const client = await prisma.client.findUnique({
  where: { id },
  include: { actifs: true }
});

// Get actif with client
const actif = await prisma.actif.findUnique({
  where: { id },
  include: { client: true }
});
```

### Many-to-Many

**Avant (MongoDB)**
```javascript
// Using array of ObjectIds
const client = await Client.findById(id).populate('documents');
```

**Après (Prisma)**
```typescript
// Using explicit join table
const client = await prisma.client.findUnique({
  where: { id },
  include: {
    documents: {
      include: { document: true }
    }
  }
});
```

## Embedded Documents → Relations ou Json

### Option 1: Relations (Recommandé pour données structurées)

**Avant (MongoDB)**
```javascript
const client = {
  nom: "Dupont",
  adresse: {
    rue: "123 Main St",
    ville: "Paris",
    codePostal: "75001"
  }
};
```

**Après (Prisma)**
```typescript
// Créer un modèle Adresse séparé
const client = await prisma.client.create({
  data: {
    nom: "Dupont",
    adresse: {
      create: {
        rue: "123 Main St",
        ville: "Paris",
        codePostal: "75001"
      }
    }
  }
});
```

### Option 2: Json (Pour données flexibles)

**Avant (MongoDB)**
```javascript
const client = {
  nom: "Dupont",
  metadata: {
    preferences: { theme: "dark" },
    settings: { notifications: true }
  }
};
```

**Après (Prisma)**
```typescript
const client = await prisma.client.create({
  data: {
    nom: "Dupont",
    metadata: {
      preferences: { theme: "dark" },
      settings: { notifications: true }
    }
  }
});
```

## Agrégations

### Count

**Avant (MongoDB)**
```javascript
const count = await Client.countDocuments({ cabinetId });
```

**Après (Prisma)**
```typescript
const count = await prisma.client.count({
  where: { cabinetId }
});
```

### Sum

**Avant (MongoDB)**
```javascript
const result = await Actif.aggregate([
  { $match: { clientId } },
  { $group: { _id: null, total: { $sum: "$valeur" } } }
]);
```

**Après (Prisma)**
```typescript
const result = await prisma.actif.aggregate({
  where: { clientId },
  _sum: { valeur: true }
});
```

### Group By

**Avant (MongoDB)**
```javascript
const result = await Client.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
]);
```

**Après (Prisma)**
```typescript
const result = await prisma.client.groupBy({
  by: ['status'],
  _count: true
});
```

## Transactions

**Avant (MongoDB)**
```javascript
const session = await mongoose.startSession();
session.startTransaction();
try {
  await Client.create([{ nom: "Test" }], { session });
  await Actif.create([{ type: "Test" }], { session });
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

**Après (Prisma)**
```typescript
await prisma.$transaction(async (tx) => {
  await tx.client.create({ data: { nom: "Test" } });
  await tx.actif.create({ data: { type: "Test" } });
});
```

## Gestion des Erreurs

**Avant (MongoDB)**
```javascript
try {
  await Client.create({ email: "duplicate@test.com" });
} catch (error) {
  if (error.code === 11000) {
    // Duplicate key error
  }
}
```

**Après (Prisma)**
```typescript
import { Prisma } from '@prisma/client';

try {
  await prisma.client.create({ data: { email: "duplicate@test.com" } });
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      // Unique constraint violation
    }
  }
}
```

## Codes d'Erreur Prisma

| Code | Description |
|------|-------------|
| P2002 | Unique constraint violation |
| P2003 | Foreign key constraint violation |
| P2025 | Record not found |
| P2016 | Query interpretation error |

## Pagination

**Avant (MongoDB)**
```javascript
const page = 1;
const limit = 10;
const clients = await Client.find()
  .skip((page - 1) * limit)
  .limit(limit);
```

**Après (Prisma)**
```typescript
const page = 1;
const limit = 10;
const clients = await prisma.client.findMany({
  skip: (page - 1) * limit,
  take: limit
});
```

## Recherche Texte

**Avant (MongoDB)**
```javascript
const clients = await Client.find({
  $text: { $search: "dupont" }
});
```

**Après (Prisma)**
```typescript
const clients = await prisma.client.findMany({
  where: {
    OR: [
      { nom: { contains: "dupont", mode: 'insensitive' } },
      { prenom: { contains: "dupont", mode: 'insensitive' } },
      { email: { contains: "dupont", mode: 'insensitive' } }
    ]
  }
});
```

## Checklist de Migration

- [ ] Remplacer tous les `ObjectId` par des `string` (cuid)
- [ ] Convertir `find()` en `findMany()`
- [ ] Convertir `findById()` en `findUnique()`
- [ ] Convertir `findByIdAndUpdate()` en `update()`
- [ ] Convertir `findByIdAndDelete()` en `delete()`
- [ ] Remplacer `populate()` par `include`
- [ ] Adapter les agrégations
- [ ] Gérer les embedded documents
- [ ] Mettre à jour la gestion des erreurs
- [ ] Tester toutes les queries

## Ressources

- [Prisma Query API](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference)
- [Prisma Error Reference](https://www.prisma.io/docs/reference/api-reference/error-reference)
