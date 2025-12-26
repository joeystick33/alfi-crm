# AURA CRM - Guide Redis & BullMQ

## Vue d'ensemble

Ce document décrit l'architecture Redis et BullMQ du CRM Aura.

---

## 1. Configuration

### Variables d'environnement

```bash
# .env
REDIS_URL="redis://localhost:6379"
CRON_SECRET="your-secret-here"
EMAIL_PROVIDER="console"
```

### Providers Redis recommandés

| Provider | Gratuit | Recommandé pour |
|----------|---------|-----------------|
| **Upstash** | 10K cmd/jour | Vercel, Serverless |
| **Redis Cloud** | 30MB | Production |
| **Local** | Oui | Développement |

---

## 2. Cache Redis

### Préfixes

| Préfixe | TTL | Usage |
|---------|-----|-------|
| `ref:` | 1h | Données de référence |
| `client:` | 5min | Données client |
| `dashboard:` | 1min | Dashboard |
| `ratelimit:` | 1min | Rate limiting |
| `lock:` | 30s | Locks distribués |

### Utilisation

```typescript
import { cacheGetOrSet, checkRateLimit, withLock } from '@/lib/redis/cache'

// Cache-aside pattern
const result = await cacheGetOrSet('key', async () => await dbQuery(), 300)

// Rate limiting
const { allowed } = await checkRateLimit(`user:${userId}`, 100, 60)

// Lock distribué
await withLock('import-xxx', async () => { /* code */ })
```

---

## 3. Queues BullMQ

### Queues disponibles

| Queue | Usage |
|-------|-------|
| `patrimoine-snapshot` | Calcul patrimoine |
| `patrimoine-update` | MAJ après modif |
| `notification-send` | Notifications |
| `email-send` | Envoi emails |
| `email-campaign` | Campagnes |
| `audit-log` | Logs d'audit |
| `cleanup` | Nettoyage |

### Helpers

```typescript
import { 
  queueNotification,
  queueEmail,
  queuePatrimoineUpdate,
  logAudit
} from '@/lib/queues/helpers'

// Notification
await queueNotification({
  cabinetId, userId,
  type: 'TACHE_ECHEANCE',
  title: 'Rappel',
  message: 'Votre tâche...',
  channels: ['app', 'email'],
})

// Mise à jour patrimoine
await queuePatrimoineUpdate(clientId, cabinetId, 'actif', actifId)

// Audit log
await logAudit('CREATE', 'Client', clientId, { cabinetId, userId })

// Email
await queueEmail({ to: 'x@x.com', subject: 'Test', html: '...', cabinetId })
```

---

## 4. Workers

### Structure

```
lib/queues/workers/
├── index.ts           # Gestionnaire workers
├── patrimoine.worker.ts
├── notification.worker.ts
├── email.worker.ts
└── cleanup.worker.ts
```

### Démarrage

```typescript
import { startAllWorkers, stopAllWorkers } from '@/lib/queues/workers'

await startAllWorkers()
await stopAllWorkers()
```

---

## 5. Intégration CRON

Les jobs CRON utilisent maintenant BullMQ:

```typescript
// Dans /api/cron/patrimoine-snapshot
import { patrimoineSnapshotQueue } from '@/lib/queues'

await patrimoineSnapshotQueue.add('monthly-snapshot', {
  type: 'all',
  notes: 'CRON mensuel',
})
```

---

## 6. Monitoring

### API Admin

```
GET  /api/admin/queues - Stats des queues
POST /api/admin/queues - Actions (pause, resume, drain)
```

### Stats Redis

```typescript
import { getCacheStats, redisHealthCheck } from '@/lib/redis'

const health = await redisHealthCheck()
const stats = await getCacheStats()
```

---

## 7. Règles d'utilisation

1. **Toujours utiliser les helpers** plutôt que les queues directement
2. **Invalider le cache** après modification de données
3. **Utiliser les locks** pour éviter les doublons
4. **Logger les erreurs** dans les workers
5. **Définir des TTL** appropriés pour le cache
6. **Limiter la concurrency** des workers selon les ressources
