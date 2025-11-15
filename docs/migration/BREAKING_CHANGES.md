# Breaking Changes - Migration CRM → alfi-crm

## Vue d'ensemble

Ce document liste tous les changements incompatibles introduits par la migration.

## Changements de Base de Données

### 1. Type d'ID

**Breaking Change**: Les IDs passent de ObjectId MongoDB à cuid PostgreSQL

**Impact**: 
- Tous les IDs dans l'API changent de format
- Les références entre tables utilisent des cuid
- Les URLs avec IDs changent de format

**Migration**:
```typescript
// Avant
const id = "507f1f77bcf86cd799439011"; // ObjectId

// Après  
const id = "ckl1234567890"; // cuid
```

### 2. Structure des Relations

**Breaking Change**: Les embedded documents deviennent des relations ou Json

**Impact**:
- Les requêtes doivent utiliser `include` au lieu de récupérer automatiquement les sous-documents
- Certaines structures de données changent

**Migration**:
```typescript
// Avant - embedded document
const client = await Client.findById(id);
// client.adresse est automatiquement disponible

// Après - relation
const client = await prisma.client.findUnique({
  where: { id },
  include: { adresse: true }
});
```

## Changements d'API

### 1. Format des Réponses

**Breaking Change**: Les réponses API utilisent des cuid au lieu d'ObjectId

**Impact**: Les clients frontend doivent adapter le parsing des IDs

**Avant**:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "nom": "Dupont"
}
```

**Après**:
```json
{
  "id": "ckl1234567890",
  "nom": "Dupont"
}
```

### 2. Endpoints Modifiés

| Endpoint | Avant | Après | Changement |
|----------|-------|-------|------------|
| GET /api/clients/:id | ObjectId | cuid | Format ID |
| POST /api/clients | Embedded docs | Relations | Structure |
| GET /api/patrimoine/:clientId | Auto-populate | Explicit include | Relations |

### 3. Paramètres de Query

**Breaking Change**: Les filtres et la pagination changent de syntaxe

**Avant**:
```javascript
GET /api/clients?skip=10&limit=10&sort=-createdAt
```

**Après**:
```typescript
GET /api/clients?skip=10&take=10&orderBy=createdAt:desc
```

## Changements de Composants

### 1. Props des Composants

**Breaking Change**: Les composants reçoivent des objets avec `id` au lieu de `_id`

**Impact**: Tous les composants doivent être mis à jour

**Migration**:
```typescript
// Avant
interface ClientProps {
  client: {
    _id: string;
    nom: string;
  }
}

// Après
interface ClientProps {
  client: {
    id: string;
    nom: string;
  }
}
```

### 2. Hooks Personnalisés

**Breaking Change**: Les hooks utilisent React Query avec Prisma

**Impact**: La syntaxe des hooks change

**Avant**:
```javascript
const { data: clients } = useClients();
```

**Après**:
```typescript
const { data: clients } = useQuery({
  queryKey: ['clients'],
  queryFn: () => apiClient.clients.list()
});
```

## Changements d'Authentification

### 1. Session Structure

**Breaking Change**: La structure de session NextAuth change

**Impact**: Les callbacks et la gestion de session doivent être adaptés

**Avant**:
```javascript
session.user = {
  id: user._id.toString(),
  // ...
}
```

**Après**:
```typescript
session.user = {
  id: user.id, // déjà un string (cuid)
  // ...
}
```

## Changements de Configuration

### 1. Variables d'Environnement

**Breaking Change**: Nouvelles variables requises pour Supabase

**Avant**:
```env
MONGODB_URI=mongodb://...
```

**Après**:
```env
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
```

### 2. Dépendances

**Breaking Change**: Suppression de mongoose, ajout de Prisma

**Impact**: Le package.json change significativement

**Packages supprimés**:
- mongoose
- mongodb

**Packages ajoutés**:
- @prisma/client
- prisma

## Changements de Performance

### 1. Queries N+1

**Breaking Change**: Les relations ne sont plus auto-chargées

**Impact**: Nécessite l'utilisation explicite de `include`

**Avant**:
```javascript
// Charge automatiquement les relations
const clients = await Client.find();
```

**Après**:
```typescript
// Doit spécifier les relations
const clients = await prisma.client.findMany({
  include: { actifs: true, passifs: true }
});
```

### 2. Transactions

**Breaking Change**: Syntaxe des transactions change

**Avant**:
```javascript
const session = await mongoose.startSession();
session.startTransaction();
// ...
await session.commitTransaction();
```

**Après**:
```typescript
await prisma.$transaction(async (tx) => {
  // ...
});
```

## Changements de Validation

### 1. Schémas de Validation

**Breaking Change**: Utilisation de Zod au lieu de Mongoose schemas

**Impact**: Tous les schémas de validation doivent être réécrits

**Avant**:
```javascript
const clientSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true, unique: true }
});
```

**Après**:
```typescript
const clientSchema = z.object({
  nom: z.string().min(1),
  email: z.string().email()
});
```

## Changements de Sécurité

### 1. Row Level Security (RLS)

**Breaking Change**: Implémentation de RLS au niveau base de données

**Impact**: Les queries doivent respecter les politiques RLS

**Migration**: Toutes les queries incluent automatiquement le filtre `cabinetId`

### 2. Isolation Multi-tenant

**Breaking Change**: Isolation stricte au niveau base de données

**Impact**: Impossible d'accéder aux données d'autres cabinets

## Plan de Migration

### Phase 1: Préparation
1. Backup complet de la base MongoDB
2. Export des données en JSON
3. Création de la branche de migration

### Phase 2: Migration des Données
1. Création du schéma Prisma
2. Migration des données MongoDB → PostgreSQL
3. Conversion des ObjectId en cuid
4. Validation de l'intégrité des données

### Phase 3: Migration du Code
1. Mise à jour des modèles
2. Conversion des queries
3. Adaptation des composants
4. Mise à jour des tests

### Phase 4: Tests
1. Tests unitaires
2. Tests d'intégration
3. Tests de performance
4. Tests de sécurité

### Phase 5: Déploiement
1. Déploiement en staging
2. Tests de validation
3. Déploiement en production
4. Monitoring

## Rollback

En cas de problème critique, voir [ROLLBACK_GUIDE.md](./ROLLBACK_GUIDE.md)

## Support

Pour toute question sur les breaking changes:
1. Consulter ce document
2. Vérifier [API_CHANGES.md](./API_CHANGES.md)
3. Contacter l'équipe de développement
