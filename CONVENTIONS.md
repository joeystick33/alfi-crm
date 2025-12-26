# AURA CRM - Conventions de Code

## 1. Prisma & Base de données

### Nommage des modèles
- **PascalCase** pour les modèles : `Client`, `Actif`, `Passif`
- **camelCase** pour les champs : `firstName`, `lastName`, `createdAt`
- **SCREAMING_SNAKE_CASE** pour les enums : `ACTIF`, `EN_ATTENTE`, `CREDIT_IMMOBILIER`

### Types monétaires
```prisma
// Montants en euros
amount      Decimal @db.Decimal(15, 2)  // Jusqu'à 9 999 999 999 999,99 €

// Pourcentages
rate        Decimal @db.Decimal(5, 2)   // 0,00% à 999,99%

// Taux précis (taux d'intérêt)
interestRate Decimal @db.Decimal(6, 4)  // 0,0000% à 99,9999%
```

### Relations
```prisma
// Relation obligatoire
client    Client @relation(fields: [clientId], references: [id], onDelete: Cascade)
clientId  String

// Relation optionnelle
conseiller   User?   @relation(fields: [conseillerId], references: [id], onDelete: SetNull)
conseillerId String?
```

### Soft Delete
- Utiliser `isActive: false` au lieu de supprimer
- Ajouter un index sur `isActive` pour les requêtes filtrées

```prisma
model Entity {
  isActive  Boolean  @default(true)
  
  @@index([cabinetId, isActive])
}
```

### Index composites
Toujours créer des index composites pour les requêtes fréquentes :
```prisma
@@index([cabinetId, status])
@@index([cabinetId, conseillerId, status])
@@index([dueDate, status])
```

---

## 2. Multi-Tenant

### Principe
Toutes les requêtes doivent être filtrées par `cabinetId` automatiquement.

### Utilisation
```typescript
import { createPrismaWithContext } from '@/lib/prisma'

// Dans un route handler
const db = createPrismaWithContext({ cabinetId, userId })
const clients = await db.client.findMany() // Filtré automatiquement
```

### Modèles concernés
Tous les modèles métier ont un champ `cabinetId` :
- `Client`, `Actif`, `Passif`, `Contrat`
- `Document`, `Tache`, `RendezVous`
- `Opportunite`, `Objectif`, `Projet`
- `Notification`, `AuditLog`, etc.

---

## 3. Validation (Zod)

### Structure des schémas
```typescript
// lib/validations/schemas/client.schema.ts

import { z } from 'zod'

// Enums
export const ClientStatusSchema = z.enum(['PROSPECT', 'ACTIF', 'INACTIF'])

// Create schema
export const CreateClientSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide').optional().nullable(),
})

// Update schema (tous les champs optionnels)
export const UpdateClientSchema = CreateClientSchema.partial()

// Types inférés
export type CreateClientInput = z.infer<typeof CreateClientSchema>
```

### Utilisation dans les routes API
```typescript
import { withValidation } from '@/lib/api/with-validation'
import { CreateClientSchema } from '@/lib/validations/schemas'

export async function POST(request: NextRequest) {
  return withValidation(CreateClientSchema, request, async ({ body }) => {
    const client = await createClient(body)
    return NextResponse.json(client, { status: 201 })
  })
}
```

---

## 4. Services

### Structure
```typescript
// lib/services/client.service.ts

import { prisma } from '@/lib/prisma'
import { CreateClientInput } from '@/lib/validations/schemas'

export async function createClient(
  cabinetId: string,
  data: CreateClientInput
): Promise<Client> {
  return prisma.client.create({
    data: {
      ...data,
      cabinetId,
    },
  })
}
```

### Gestion des erreurs
```typescript
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

// Usage
throw new ServiceError('Client not found', 'CLIENT_NOT_FOUND', 404)
```

---

## 5. Routes API

### Structure des réponses

**Succès**
```json
{
  "data": { ... },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

**Erreur**
```json
{
  "error": "Validation failed",
  "details": [
    { "path": "email", "message": "Email invalide", "code": "invalid_string" }
  ]
}
```

### Codes HTTP
- `200` : Succès (GET, PUT, PATCH)
- `201` : Création réussie (POST)
- `204` : Suppression réussie (DELETE)
- `400` : Erreur de validation
- `401` : Non authentifié
- `403` : Non autorisé
- `404` : Ressource non trouvée
- `500` : Erreur serveur

---

## 6. Enums - Status vs Type

### Règle
- `status` : État qui évolue dans le temps (`EN_ATTENTE` → `ACTIF` → `TERMINE`)
- `type` : Catégorie fixe qui ne change pas (`PARTICULIER`, `PROFESSIONNEL`)

### Exemples
```prisma
enum ClientStatus {
  PROSPECT   // Peut devenir ACTIF
  ACTIF      // Peut devenir INACTIF
  INACTIF    // Peut être réactivé
  ARCHIVE    // État final
}

enum ClientType {
  PARTICULIER    // Ne change jamais
  PROFESSIONNEL  // Ne change jamais
}
```

---

## 7. Dates

### Conventions
- Toujours utiliser `DateTime` de Prisma
- Stocker en UTC dans la base
- Convertir côté client avec `date-fns-tz`

### Nommage
```prisma
createdAt     DateTime @default(now())
updatedAt     DateTime @updatedAt
startDate     DateTime
endDate       DateTime
dueDate       DateTime
completedAt   DateTime?
```

---

## 8. Cache

### ReferenceData
```typescript
import { getReferenceData } from '@/lib/services/reference-data.service'

// Données mises en cache pendant 1h
const types = await getReferenceData('ACTIF_TYPE')
```

### Invalidation
```typescript
import { invalidateReferenceDataCache } from '@/lib/services/reference-data.service'

// Après modification des données de référence
invalidateReferenceDataCache()
```

---

## 9. Jobs CRON

### Configuration (vercel.json)
```json
{
  "crons": [
    {
      "path": "/api/cron/patrimoine-snapshot",
      "schedule": "0 3 1 * *"
    }
  ]
}
```

### Sécurité
```typescript
// Vérifier CRON_SECRET
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## 10. Checklist Pré-déploiement

### Base de données
- [ ] Migration Prisma testée en local
- [ ] Index utilisés (vérifier avec EXPLAIN)
- [ ] Pas de N+1 queries
- [ ] Pas d'include profond (>3 niveaux)

### Performance
- [ ] Cache activé pour ReferenceData
- [ ] Champs dénormalisés à jour
- [ ] Snapshots patrimoine créés

### Sécurité
- [ ] Middleware multi-tenant actif
- [ ] Authentification sur toutes les routes
- [ ] CRON_SECRET configuré
- [ ] Pas de données sensibles dans les logs

### Tests
- [ ] Tous les tests passent
- [ ] Validation Zod sur toutes les routes POST/PUT

---

## 11. Checklist Post-déploiement

- [ ] Application accessible
- [ ] Login fonctionne
- [ ] Dashboard charge en <2s
- [ ] Pas d'erreurs dans les logs
- [ ] Jobs CRON exécutés
- [ ] Snapshots patrimoine créés
- [ ] Pas de requêtes >1s dans les logs
- [ ] Utilisation mémoire stable
