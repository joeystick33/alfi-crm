# Migration Prisma F4.2 - Instructions Complètes

**Date** : 24 novembre 2024, 00h10  
**Statut** : ⚠️ BLOQUÉ - Shadow Database Inconsistency

---

## Problème Rencontré

```
Error: P3006
Migration `20251113_add_email_automation_models` failed to apply cleanly to the shadow database.
Error code: P1014
The underlying table for model `users` does not exist.
```

**Cause** : Une migration antérieure est dans un état incohérent dans la shadow database.

---

## Solutions Possibles

### Option 1 : Reset Shadow Database (DEV UNIQUEMENT)

```bash
cd /Users/randrianarison/Documents/aura-crm-main2

# 1. Supprimer shadow database
# Se connecter à Supabase et drop la shadow DB manuellement

# 2. Créer nouvelle migration
npx prisma migrate dev --name add_recurrence_and_reschedule_tracking

# 3. Générer client Prisma
npx prisma generate
```

### Option 2 : Push Direct (DEV RAPIDE)

```bash
# Bypass migrations, push schema directement
npx prisma db push

# Puis générer client
npx prisma generate
```

**⚠️ Attention** : `db push` ne crée pas de fichier de migration. À utiliser UNIQUEMENT en développement pour débloquer.

### Option 3 : Migration Manuelle SQL (PRODUCTION SAFE)

**Étape 1** : Créer le fichier migration manuellement

Fichier : `prisma/migrations/20241124000000_add_recurrence_tracking/migration.sql`

```sql
-- AlterTable
ALTER TABLE "rendez_vous" 
ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "recurrenceRule" TEXT,
ADD COLUMN IF NOT EXISTS "recurrenceEndDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "recurrenceExceptions" TEXT,
ADD COLUMN IF NOT EXISTS "parentRecurrenceId" TEXT,
ADD COLUMN IF NOT EXISTS "recurrenceOccurrenceDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "originalStartDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rescheduledAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rescheduledCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "rescheduledBy" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "rendez_vous_parentRecurrenceId_idx" ON "rendez_vous"("parentRecurrenceId");
CREATE INDEX IF NOT EXISTS "rendez_vous_recurrenceOccurrenceDate_idx" ON "rendez_vous"("recurrenceOccurrenceDate");
CREATE INDEX IF NOT EXISTS "rendez_vous_isRecurring_idx" ON "rendez_vous"("isRecurring");

-- AddForeignKey
ALTER TABLE "rendez_vous" 
ADD CONSTRAINT "rendez_vous_parentRecurrenceId_fkey" 
FOREIGN KEY ("parentRecurrenceId") 
REFERENCES "rendez_vous"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rendez_vous" 
ADD CONSTRAINT "rendez_vous_rescheduledBy_fkey" 
FOREIGN KEY ("rescheduledBy") 
REFERENCES "users"("id") 
ON DELETE SET NULL 
ON UPDATE CASCADE;
```

**Étape 2** : Appliquer manuellement

```bash
# Via psql ou interface Supabase
psql $DATABASE_URL < prisma/migrations/20241124000000_add_recurrence_tracking/migration.sql

# Ou via Supabase Dashboard > SQL Editor
```

**Étape 3** : Marquer comme appliquée

```bash
npx prisma migrate resolve --applied 20241124000000_add_recurrence_tracking
```

**Étape 4** : Générer client

```bash
npx prisma generate
```

---

## Modifications Schema Détaillées

### Champs Ajoutés au Modèle `RendezVous`

| Champ | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| `isRecurring` | Boolean | Non | false | Indique si RDV récurrent |
| `recurrenceRule` | String | Oui | null | RRULE RFC 5545 |
| `recurrenceEndDate` | DateTime | Oui | null | Date fin série |
| `recurrenceExceptions` | String | Oui | null | JSON array dates exclues |
| `parentRecurrenceId` | String | Oui | null | ID parent si occurrence modifiée |
| `recurrenceOccurrenceDate` | DateTime | Oui | null | Date occurrence spécifique |
| `originalStartDate` | DateTime | Oui | null | Date avant replanification |
| `rescheduledAt` | DateTime | Oui | null | Timestamp dernière replani |
| `rescheduledCount` | Int | Non | 0 | Nombre replanifications |
| `rescheduledBy` | String | Oui | null | User ID replanificateur |

### Relations Ajoutées

```prisma
model RendezVous {
  // ... champs existants ...
  
  parentRecurrence     RendezVous?  @relation("RecurrenceSeries", fields: [parentRecurrenceId], references: [id], onDelete: Cascade)
  recurrenceInstances  RendezVous[] @relation("RecurrenceSeries")
  rescheduledByUser    User?        @relation("RescheduledBy", fields: [rescheduledBy], references: [id])
}

model User {
  // ... champs existants ...
  
  rendezvous            RendezVous[]  @relation("ConseillerRendezVous")
  rendezVousRescheduled RendezVous[]  @relation("RescheduledBy")
}
```

### Index Ajoutés

1. `rendez_vous_parentRecurrenceId_idx` : Performance requêtes instances modifiées
2. `rendez_vous_recurrenceOccurrenceDate_idx` : Performance expand occurrences
3. `rendez_vous_isRecurring_idx` : Performance filtrage séries récurrentes

---

## Validation Post-Migration

### Tests SQL Basiques

```sql
-- 1. Vérifier colonnes ajoutées
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'rendez_vous'
AND column_name IN (
  'isRecurring', 'recurrenceRule', 'recurrenceEndDate', 
  'recurrenceExceptions', 'parentRecurrenceId', 
  'recurrenceOccurrenceDate', 'originalStartDate',
  'rescheduledAt', 'rescheduledCount', 'rescheduledBy'
);

-- 2. Vérifier index créés
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'rendez_vous'
AND indexname LIKE '%recurrence%' OR indexname LIKE '%rescheduled%';

-- 3. Vérifier contraintes FK
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'rendez_vous'
AND tc.constraint_type = 'FOREIGN KEY'
AND (kcu.column_name = 'parentRecurrenceId' OR kcu.column_name = 'rescheduledBy');
```

### Tests Prisma Client

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testMigration() {
  // Test 1: Créer RDV récurrent
  const recurring = await prisma.rendezVous.create({
    data: {
      cabinetId: 'test-cabinet',
      conseillerId: 'test-user',
      title: 'Test Récurrent',
      startDate: new Date('2025-01-01T10:00:00Z'),
      endDate: new Date('2025-01-01T11:00:00Z'),
      type: 'FOLLOW_UP',
      status: 'SCHEDULED',
      isRecurring: true,
      recurrenceRule: 'FREQ=DAILY;COUNT=5',
    }
  })
  console.log('✅ Création récurrent OK:', recurring.id)

  // Test 2: Créer instance modifiée
  const instance = await prisma.rendezVous.create({
    data: {
      cabinetId: 'test-cabinet',
      conseillerId: 'test-user',
      title: 'Occurrence Modifiée',
      startDate: new Date('2025-01-02T14:00:00Z'),
      endDate: new Date('2025-01-02T15:00:00Z'),
      type: 'FOLLOW_UP',
      status: 'SCHEDULED',
      parentRecurrenceId: recurring.id,
      recurrenceOccurrenceDate: new Date('2025-01-02T10:00:00Z'),
    }
  })
  console.log('✅ Instance modifiée OK:', instance.id)

  // Test 3: Replanification tracking
  const rescheduled = await prisma.rendezVous.update({
    where: { id: recurring.id },
    data: {
      startDate: new Date('2025-01-01T14:00:00Z'),
      endDate: new Date('2025-01-01T15:00:00Z'),
      originalStartDate: new Date('2025-01-01T10:00:00Z'),
      rescheduledAt: new Date(),
      rescheduledCount: { increment: 1 },
      rescheduledBy: 'test-user',
    }
  })
  console.log('✅ Replanification tracking OK, count:', rescheduled.rescheduledCount)

  // Cleanup
  await prisma.rendezVous.deleteMany({
    where: { cabinetId: 'test-cabinet' }
  })
}

testMigration()
  .then(() => console.log('✅ TOUS LES TESTS PASSÉS'))
  .catch(err => console.error('❌ ERREUR:', err))
  .finally(() => prisma.$disconnect())
```

---

## Impact et Rollback

### Impact Attendu

- **Downtime** : Aucun (ajout colonnes nullable)
- **Performance** : Légère amélioration grâce aux index
- **Data loss** : Aucun
- **Breaking changes** : Aucun pour code existant

### Rollback (Si Nécessaire)

```sql
-- Supprimer contraintes FK
ALTER TABLE "rendez_vous" DROP CONSTRAINT IF EXISTS "rendez_vous_parentRecurrenceId_fkey";
ALTER TABLE "rendez_vous" DROP CONSTRAINT IF EXISTS "rendez_vous_rescheduledBy_fkey";

-- Supprimer index
DROP INDEX IF EXISTS "rendez_vous_parentRecurrenceId_idx";
DROP INDEX IF EXISTS "rendez_vous_recurrenceOccurrenceDate_idx";
DROP INDEX IF EXISTS "rendez_vous_isRecurring_idx";

-- Supprimer colonnes
ALTER TABLE "rendez_vous"
DROP COLUMN IF EXISTS "isRecurring",
DROP COLUMN IF EXISTS "recurrenceRule",
DROP COLUMN IF EXISTS "recurrenceEndDate",
DROP COLUMN IF EXISTS "recurrenceExceptions",
DROP COLUMN IF EXISTS "parentRecurrenceId",
DROP COLUMN IF EXISTS "recurrenceOccurrenceDate",
DROP COLUMN IF EXISTS "originalStartDate",
DROP COLUMN IF EXISTS "rescheduledAt",
DROP COLUMN IF EXISTS "rescheduledCount",
DROP COLUMN IF EXISTS "rescheduledBy";
```

---

## Next Steps Après Migration Réussie

1. ✅ Générer client Prisma
2. ✅ Redémarrer serveur dev
3. ✅ Tester API routes récurrences
4. ✅ Lancer tests d'intégration
5. ✅ Valider UI avec données réelles

---

**Recommandation** : Utiliser **Option 2 (db push)** pour débloquer rapidement en DEV, puis créer migration propre pour PROD plus tard.

```bash
npx prisma db push && npx prisma generate
```
