# Scripts de Test RLS (Row Level Security)

Ce dossier contient les scripts pour tester l'isolation multi-tenant (RLS) de l'application ALFI CRM.

## Scripts Disponibles

### 1. `test-rls.ts` - Test Complet
Script de test complet qui crée ses propres données de test temporaires.

**Caractéristiques**:
- Crée 2 cabinets de test (Cabinet A et Cabinet B)
- Crée des utilisateurs et clients pour chaque cabinet
- Exécute 8 tests d'isolation
- Nettoie les données de test après exécution

**Prérequis**:
- Base de données synchronisée avec le schéma Prisma
- Variables d'environnement configurées dans `.env`

**Exécution**:
```bash
bash scripts/run-rls-tests-full.sh
```

### 2. `test-rls-simple.ts` - Test Simplifié
Script de test qui utilise les données existantes dans la base.

**Caractéristiques**:
- Utilise les cabinets et clients existants
- Ne crée ni ne supprime de données
- Tests basiques d'isolation
- Fonctionne même si le schéma n'est pas 100% synchronisé

**Prérequis**:
- Au moins 1 cabinet avec des clients dans la base
- Variables d'environnement configurées dans `.env`

**Exécution**:
```bash
bash scripts/run-rls-tests.sh
```

### 3. `run-rls-tests.sh` - Lanceur pour test simplifié
Script bash qui charge les variables d'environnement et exécute le test simplifié.

### 4. `run-rls-tests-full.sh` - Lanceur pour test complet
Script bash qui charge les variables d'environnement et exécute le test complet.

## Tests Effectués

### Test Complet (test-rls.ts)

1. **Filtrage par cabinetId**: Vérifie que chaque cabinet ne voit que ses propres données
2. **setRLSContext**: Vérifie que la fonction de contexte RLS fonctionne
3. **Injection automatique**: Vérifie que le cabinetId est injecté automatiquement lors des créations
4. **Filtrage des mises à jour**: Vérifie qu'un cabinet ne peut pas modifier les données d'un autre
5. **Filtrage des suppressions**: Vérifie qu'un cabinet ne peut pas supprimer les données d'un autre
6. **Mode SuperAdmin**: Vérifie que les SuperAdmins peuvent accéder à toutes les données
7. **Autres modèles**: Vérifie l'isolation sur Tache, Objectif, etc.
8. **Relations**: Vérifie que l'isolation fonctionne avec les relations Prisma

### Test Simplifié (test-rls-simple.ts)

1. **Isolation de base**: Vérifie que chaque cabinet voit uniquement ses clients
2. **Aucun chevauchement**: Vérifie qu'il n'y a pas de clients partagés entre cabinets
3. **Accès inter-cabinets**: Vérifie qu'un cabinet ne peut pas accéder aux clients d'un autre
4. **Mode SuperAdmin**: Vérifie que les SuperAdmins voient tous les clients

## Résolution des Problèmes

### Erreur: "The column `xxx` does not exist in the current database"

**Cause**: Le schéma Prisma n'est pas synchronisé avec la base de données.

**Solution**:
```bash
# Option 1: Synchroniser sans créer de migration
npx prisma db push

# Option 2: Créer une migration
npx prisma migrate dev --name sync_schema
```

### Erreur: "Aucun cabinet trouvé dans la base de données"

**Cause**: La base de données est vide.

**Solution**:
```bash
# Créer des données de seed
npx tsx prisma/seed.ts

# OU utiliser le test complet qui crée ses propres données
bash scripts/run-rls-tests-full.sh
```

### Erreur: "Environment variable not found: DATABASE_URL"

**Cause**: Le fichier `.env` n'existe pas ou n'est pas chargé.

**Solution**:
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer avec vos credentials
nano .env

# Vérifier que les variables sont définies
cat .env | grep DATABASE_URL
```

## Architecture RLS

L'isolation multi-tenant est implémentée via:

1. **Middleware Prisma** (`lib/prisma-middleware.ts`)
   - Intercepte toutes les requêtes
   - Injecte automatiquement le `cabinetId` dans les filtres WHERE
   - Injecte automatiquement le `cabinetId` lors des créations

2. **Factory Prisma Client** (`lib/prisma.ts`)
   - `getPrismaClient(cabinetId, isSuperAdmin)`: Crée un client avec middleware
   - `setRLSContext(cabinetId, isSuperAdmin)`: Configure les variables de session PostgreSQL

3. **Auth Helpers** (`lib/auth-helpers.ts`)
   - Extrait le contexte d'authentification (cabinetId, userId, role)
   - Protège les routes API

## Documentation Complète

Pour plus de détails, consultez:
- `docs/RLS_TESTING.md` - Documentation complète des tests RLS
- `lib/prisma-middleware.ts` - Implémentation du middleware
- `lib/permissions.ts` - Système de permissions RBAC

## Maintenance

### Ajouter un nouveau modèle avec isolation

1. Ajouter le champ `cabinetId` dans `prisma/schema.prisma`
2. Ajouter le modèle dans `MODELS_WITH_CABINET_ID` dans `lib/prisma-middleware.ts`
3. Ajouter un index sur `cabinetId`
4. Créer une migration: `npx prisma migrate dev`
5. Ajouter un test dans `scripts/test-rls.ts`

### Déboguer les problèmes d'isolation

1. Activer le logging Prisma dans `lib/prisma.ts`:
   ```typescript
   log: ['query', 'error', 'warn']
   ```

2. Vérifier les requêtes SQL générées
3. Vérifier que le middleware est bien appliqué
4. Vérifier que `cabinetId` est bien passé au client Prisma

---

**Dernière mise à jour**: 2024-11-14  
**Version**: 1.0
