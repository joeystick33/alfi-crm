# Architecture de Sécurité - Aura CRM

## Vue d'Ensemble

Le CRM Aura implémente une architecture de sécurité multi-couches pour garantir l'isolation complète des données entre les cabinets et un contrôle d'accès granulaire basé sur les rôles.

## Couches de Sécurité

### 1. Row Level Security (RLS) PostgreSQL

**Niveau**: Base de données

RLS est activé sur toutes les tables contenant un `cabinetId` pour garantir l'isolation au niveau de la base de données.

#### Politiques RLS

**Cabinet Isolation Policy**
- Les utilisateurs normaux ne peuvent accéder qu'aux données de leur cabinet
- Utilise `current_setting('app.current_cabinet_id')` pour filtrer

**SuperAdmin Access Policy**
- Les SuperAdmins peuvent accéder à toutes les données
- Utilise `current_setting('app.is_superadmin')` pour bypass

#### Configuration

Les politiques RLS sont définies dans:
```
prisma/migrations/20251113_enable_rls/migration.sql
```

Pour activer RLS dans une session:
```typescript
import { setRLSContext } from '@/app/_common/lib/prisma'

await setRLSContext(cabinetId, isSuperAdmin)
```

### 2. Middleware Prisma

**Niveau**: Application (ORM)

Le middleware Prisma ajoute automatiquement les filtres `cabinetId` à toutes les requêtes.

#### Fonctionnalités

- **Isolation automatique**: Filtre par `cabinetId` sur toutes les lectures
- **Injection automatique**: Ajoute `cabinetId` sur toutes les créations
- **SuperAdmin bypass**: Les SuperAdmins peuvent accéder à tous les cabinets
- **Logging**: En développement, log toutes les requêtes

#### Utilisation

```typescript
import { getPrismaClient } from '@/app/_common/lib/prisma'

// Client avec isolation
const prisma = getPrismaClient(cabinetId, false)

// Client SuperAdmin (accès à tout)
const prisma = getPrismaClient(cabinetId, true)
```

### 3. Système de Permissions

**Niveau**: Application (Business Logic)

Contrôle d'accès granulaire basé sur les rôles (RBAC).

#### Rôles SuperAdmin

- **OWNER**: Accès complet à tout
- **ADMIN**: Gestion des cabinets et utilisateurs
- **DEVELOPER**: Accès en lecture pour le debug
- **SUPPORT**: Support client avec accès limité

#### Rôles Utilisateur (Cabinet)

- **ADMIN**: Administrateur du cabinet, accès complet
- **ADVISOR**: Conseiller, gère ses propres clients
- **ASSISTANT**: Assistant, accès limité aux clients assignés

#### Permissions

Les permissions sont définies dans `lib/permissions.ts`:

```typescript
import { hasPermission, canAccessClient } from '@/app/_common/lib/permissions'

// Vérifier une permission
if (hasPermission(userRole, 'canManageClients')) {
  // Autoriser l'action
}

// Vérifier l'accès à un client
if (canAccessClient(userRole, userId, clientConseillerId)) {
  // Autoriser l'accès
}
```

### 4. Helpers d'Authentification

**Niveau**: API Routes

Middlewares pour protéger les routes API.

#### Utilisation

```typescript
import { requireAuth, requirePermission, requireSuperAdmin } from '@/app/_common/lib/auth-helpers'

// Route protégée (authentification requise)
export async function GET(request: NextRequest) {
  const context = await requireAuth(request)
  // ...
}

// Route avec permission spécifique
export async function POST(request: NextRequest) {
  const context = await requirePermission(request, 'canManageClients')
  // ...
}

// Route SuperAdmin uniquement
export async function DELETE(request: NextRequest) {
  const context = await requireSuperAdmin(request)
  // ...
}
```

## Flux de Sécurité

### Requête Utilisateur Normal

```
1. Requête HTTP → API Route
2. requireAuth() → Vérifie l'authentification
3. Extrait cabinetId de la session
4. getPrismaClient(cabinetId, false) → Client avec isolation
5. setRLSContext(cabinetId, false) → Active RLS
6. Middleware Prisma → Ajoute filtres cabinetId
7. RLS PostgreSQL → Vérifie les politiques
8. Retourne uniquement les données du cabinet
```

### Requête SuperAdmin

```
1. Requête HTTP → API Route
2. requireSuperAdmin() → Vérifie SuperAdmin
3. getPrismaClient(cabinetId, true) → Client sans isolation
4. setRLSContext(cabinetId, true) → Bypass RLS
5. Middleware Prisma → Bypass (isSuperAdmin = true)
6. RLS PostgreSQL → Bypass (is_superadmin = true)
7. Retourne toutes les données
```

## Bonnes Pratiques

### ✅ À FAIRE

1. **Toujours utiliser `getPrismaClient()`** au lieu du client global
2. **Toujours appeler `setRLSContext()`** au début des requêtes
3. **Vérifier les permissions** avant les actions sensibles
4. **Logger les actions sensibles** pour l'audit
5. **Valider les entrées utilisateur** avant les requêtes

### ❌ À ÉVITER

1. **Ne jamais utiliser le client Prisma global** dans les API routes
2. **Ne jamais bypass les permissions** sans raison valide
3. **Ne jamais exposer les IDs internes** dans les URLs publiques
4. **Ne jamais faire confiance aux données client** sans validation
5. **Ne jamais logger les données sensibles** (mots de passe, tokens)

## Audit et Conformité

### Audit Logs

Toutes les actions sensibles sont enregistrées dans `AuditLog`:

```typescript
import { createAuditMiddleware } from '@/app/_common/lib/prisma-middleware'

// Ajouter l'audit à un client Prisma
prisma.$use(createAuditMiddleware(userId, ipAddress, userAgent))
```

### RGPD

- **Consentements**: Enregistrés dans `Consentement`
- **Droit à l'oubli**: Soft delete avec anonymisation
- **Portabilité**: Export complet via `ExportJob`
- **Traçabilité**: Tous les accès sont loggés

## Tests de Sécurité

### Test d'Isolation

```typescript
// Vérifier qu'un utilisateur ne peut pas accéder aux données d'un autre cabinet
const prisma = getPrismaClient('cabinet-A', false)
const clients = await prisma.client.findMany()

// Tous les clients doivent avoir cabinetId = 'cabinet-A'
expect(clients.every(c => c.cabinetId === 'cabinet-A')).toBe(true)
```

### Test de Permissions

```typescript
// Vérifier qu'un ASSISTANT ne peut pas supprimer de clients
expect(hasPermission('ASSISTANT', 'canDeleteClients')).toBe(false)
```

## Migration et Déploiement

### Activer RLS en Production

```bash
# Exécuter la migration RLS
npm run db:migrate

# Vérifier que RLS est activé
psql $DATABASE_URL -c "SELECT tablename FROM pg_tables WHERE rowsecurity = true;"
```

### Variables d'Environnement

```env
# Base de données
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Authentification
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret-key"
```

## Support et Questions

Pour toute question sur la sécurité, contactez l'équipe de développement.

**⚠️ IMPORTANT**: Ne jamais désactiver RLS ou les middlewares en production sans approbation explicite.
