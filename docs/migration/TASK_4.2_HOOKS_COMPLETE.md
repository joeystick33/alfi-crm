# Task 4.2: Migration des Hooks Personnalisés - COMPLETE ✅

## Date
2024-11-14

## Objectif
Migrer les hooks personnalisés de CRM vers alfi-crm et créer trois nouveaux hooks TypeScript pour gérer les clients, le patrimoine et les simulations avec React Query et Prisma.

## Travail Effectué

### 1. Analyse des Hooks Existants
- ✅ Tous les hooks de `CRM/hooks/` ont déjà été copiés vers `alfi-crm/hooks/`
- ✅ Les hooks existants utilisent déjà des appels API (pas de dépendances MongoDB directes)
- ✅ Les hooks sont compatibles avec l'architecture Prisma via les API routes

### 2. Création des Nouveaux Hooks TypeScript

#### 2.1 `use-client.ts` - Gestion des Clients
**Fichier**: `alfi-crm/hooks/use-client.ts`

**Fonctionnalités**:
- **Queries**:
  - `useClient(id)` - Récupérer un client par ID
  - `useClients(filters)` - Liste des clients avec filtres
  - `useClientSearch(query)` - Recherche de clients
  - `useClientTimeline(id)` - Timeline d'un client
  - `useClientStats(id)` - Statistiques d'un client

- **Mutations**:
  - `useCreateClient()` - Créer un nouveau client
  - `useUpdateClient()` - Mettre à jour un client
  - `useUpdateClientStatus()` - Changer le statut d'un client
  - `useArchiveClient()` - Archiver un client
  - `useChangeConseiller()` - Changer le conseiller d'un client
  - `useTogglePortalAccess()` - Activer/désactiver l'accès portail

- **Helpers**:
  - `useOptimisticClientUpdate()` - Mise à jour optimiste du cache

**Caractéristiques**:
- Cache intelligent avec React Query (staleTime: 2-5 minutes)
- Invalidation automatique des caches liés
- Types TypeScript complets depuis Prisma
- Gestion d'erreurs intégrée via `api-client.ts`

#### 2.2 `use-patrimoine.ts` - Gestion du Patrimoine
**Fichier**: `alfi-crm/hooks/use-patrimoine.ts`

**Fonctionnalités**:

**Actifs**:
- `useActif(id)` - Récupérer un actif
- `useActifs(filters)` - Liste des actifs
- `useClientActifs(clientId)` - Actifs d'un client
- `useCreateActif()` - Créer un actif
- `useLinkActifToClient()` - Lier un actif à un client
- `useUpdateActif()` - Mettre à jour un actif
- `useDeleteActif()` - Supprimer un actif

**Passifs**:
- `usePassif(id)` - Récupérer un passif
- `usePassifs(filters)` - Liste des passifs
- `useClientPassifs(clientId)` - Passifs d'un client
- `useCreatePassif()` - Créer un passif
- `useUpdatePassif()` - Mettre à jour un passif
- `useDeletePassif()` - Supprimer un passif

**Contrats**:
- `useContrat(id)` - Récupérer un contrat
- `useContrats(filters)` - Liste des contrats
- `useClientContrats(clientId)` - Contrats d'un client
- `useCreateContrat()` - Créer un contrat
- `useUpdateContrat()` - Mettre à jour un contrat
- `useRenewContrat()` - Renouveler un contrat

**Calculs Patrimoniaux**:
- `useClientWealth(clientId)` - Calculer le patrimoine d'un client
- `useClientPatrimoine(clientId)` - Patrimoine complet (actifs + passifs + contrats + wealth)
- `usePatrimoineOpportunities(clientId)` - Détecter les opportunités patrimoniales

**Caractéristiques**:
- Gestion complète du patrimoine (actifs, passifs, contrats)
- Calculs automatiques du patrimoine net
- Invalidation en cascade (modification d'un actif → recalcul du patrimoine)
- Détection d'opportunités patrimoniales
- Types TypeScript complets avec Prisma Decimal

#### 2.3 `use-simulation.ts` - Gestion des Simulations
**Fichier**: `alfi-crm/hooks/use-simulation.ts`

**Fonctionnalités**:
- **Queries**:
  - `useSimulation(id)` - Récupérer une simulation
  - `useSimulations(filters)` - Liste des simulations
  - `useClientSimulationHistory(clientId)` - Historique des simulations d'un client
  - `useRecentSimulations(limit)` - Simulations récentes
  - `useSimulationStatistics()` - Statistiques des simulations

- **Mutations**:
  - `useCreateSimulation()` - Créer une simulation
  - `useUpdateSimulation()` - Mettre à jour une simulation
  - `useDeleteSimulation()` - Supprimer une simulation
  - `useArchiveSimulation()` - Archiver une simulation
  - `useShareSimulation()` - Partager une simulation avec le client

- **Helpers**:
  - `useOptimisticSimulationUpdate()` - Mise à jour optimiste
  - `useCanShareSimulation()` - Vérifier si une simulation peut être partagée
  - `useCanEditSimulation()` - Vérifier si une simulation peut être éditée
  - `useSimulationTypeLabel()` - Obtenir le label d'un type de simulation
  - `useSimulationStatusLabel()` - Obtenir le label d'un statut
  - `useSimulationStatusColor()` - Obtenir la couleur d'un statut

**Types de Simulations** (depuis Prisma):
- `RETIREMENT` - Retraite
- `REAL_ESTATE_LOAN` - Prêt immobilier
- `LIFE_INSURANCE` - Assurance-vie
- `WEALTH_TRANSMISSION` - Transmission de patrimoine
- `TAX_OPTIMIZATION` - Optimisation fiscale
- `INVESTMENT_PROJECTION` - Projection d'investissement
- `BUDGET_ANALYSIS` - Analyse budgétaire
- `OTHER` - Autre

**Statuts de Simulations**:
- `DRAFT` - Brouillon
- `COMPLETED` - Terminée
- `SHARED` - Partagée avec le client
- `ARCHIVED` - Archivée

**Caractéristiques**:
- Gestion complète du cycle de vie des simulations
- Partage avec les clients via portail
- Statistiques et historique
- Helpers pour l'UI (labels, couleurs, permissions)

## Architecture Technique

### Pattern React Query
Tous les hooks suivent le pattern React Query standard:

```typescript
// Query (lecture)
const { data, isLoading, error } = useClient(clientId)

// Mutation (écriture)
const { mutate, isPending } = useCreateClient()
mutate(clientData, {
  onSuccess: (data) => {
    // Handle success
  },
  onError: (error) => {
    // Handle error
  }
})
```

### Gestion du Cache
- **Query Keys**: Structure hiérarchique pour invalidation précise
- **Stale Time**: 1-5 minutes selon le type de données
- **Invalidation**: Automatique après mutations
- **Optimistic Updates**: Disponibles pour les opérations critiques

### Intégration avec Prisma
- Types générés automatiquement depuis le schéma Prisma
- Support des relations (include)
- Support des types spéciaux (Decimal, Json)
- Gestion des contraintes de clés étrangères

## Exemples d'Utilisation

### Exemple 1: Afficher un Client
```typescript
import { useClient } from '@/hooks/use-client'

function ClientProfile({ clientId }: { clientId: string }) {
  const { data: client, isLoading, error } = useClient(clientId, true)

  if (isLoading) return <div>Chargement...</div>
  if (error) return <div>Erreur: {error.message}</div>
  if (!client) return <div>Client non trouvé</div>

  return (
    <div>
      <h1>{client.firstName} {client.lastName}</h1>
      <p>Email: {client.email}</p>
      <p>Statut: {client.status}</p>
    </div>
  )
}
```

### Exemple 2: Créer un Client
```typescript
import { useCreateClient } from '@/hooks/use-client'
import { toast } from '@/hooks/use-toast'

function CreateClientForm() {
  const { mutate: createClient, isPending } = useCreateClient()

  const handleSubmit = (data: CreateClientData) => {
    createClient(data, {
      onSuccess: (client) => {
        toast({
          title: 'Client créé',
          description: `${client.firstName} ${client.lastName} a été créé avec succès`,
        })
      },
      onError: (error) => {
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        })
      },
    })
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### Exemple 3: Afficher le Patrimoine d'un Client
```typescript
import { useClientPatrimoine } from '@/hooks/use-patrimoine'

function ClientWealth({ clientId }: { clientId: string }) {
  const { data: patrimoine, isLoading } = useClientPatrimoine(clientId)

  if (isLoading) return <div>Chargement...</div>

  return (
    <div>
      <h2>Patrimoine</h2>
      <p>Total Actifs: {patrimoine.wealth.totalActifs.toLocaleString()} €</p>
      <p>Total Passifs: {patrimoine.wealth.totalPassifs.toLocaleString()} €</p>
      <p>Patrimoine Net: {patrimoine.wealth.netWealth.toLocaleString()} €</p>
      
      <h3>Actifs ({patrimoine.actifs.length})</h3>
      {patrimoine.actifs.map(ca => (
        <div key={ca.id}>
          {ca.actif.name}: {ca.actif.value.toString()} €
        </div>
      ))}
    </div>
  )
}
```

### Exemple 4: Créer et Partager une Simulation
```typescript
import { useCreateSimulation, useShareSimulation } from '@/hooks/use-simulation'

function SimulationCreator({ clientId }: { clientId: string }) {
  const { mutate: createSimulation } = useCreateSimulation()
  const { mutate: shareSimulation } = useShareSimulation()

  const handleCreate = () => {
    createSimulation({
      clientId,
      type: 'RETIREMENT',
      name: 'Simulation Retraite 2024',
      parameters: { /* ... */ },
      results: { /* ... */ },
      feasibilityScore: 85,
    }, {
      onSuccess: (simulation) => {
        // Partager immédiatement avec le client
        shareSimulation(simulation.id)
      },
    })
  }

  return <button onClick={handleCreate}>Créer et Partager</button>
}
```

## Tests

### Vérification TypeScript
```bash
# Aucune erreur TypeScript
✅ alfi-crm/hooks/use-client.ts: No diagnostics found
✅ alfi-crm/hooks/use-patrimoine.ts: No diagnostics found
✅ alfi-crm/hooks/use-simulation.ts: No diagnostics found
```

### Tests Manuels Recommandés
1. ✅ Importer les hooks dans un composant
2. ⏳ Tester les queries avec des données réelles
3. ⏳ Tester les mutations (create, update, delete)
4. ⏳ Vérifier l'invalidation du cache
5. ⏳ Tester les optimistic updates
6. ⏳ Vérifier la gestion d'erreurs

## Avantages de cette Implémentation

### 1. Type Safety
- Types générés automatiquement depuis Prisma
- Autocomplétion complète dans l'IDE
- Détection d'erreurs à la compilation

### 2. Performance
- Cache intelligent avec React Query
- Invalidation précise (pas de sur-invalidation)
- Optimistic updates pour UX fluide
- Stale-while-revalidate pattern

### 3. Maintenabilité
- Code DRY (Don't Repeat Yourself)
- Pattern cohérent pour tous les hooks
- Facile à étendre et modifier
- Documentation inline complète

### 4. Developer Experience
- API simple et intuitive
- Gestion d'erreurs automatique
- Loading states automatiques
- Retry logic intégré

## Prochaines Étapes

### Immédiat
1. ✅ Créer les API routes correspondantes (Task 4.1)
2. ⏳ Tester les hooks avec des composants réels
3. ⏳ Ajouter des tests unitaires avec Vitest

### Court Terme
1. ⏳ Créer des hooks similaires pour:
   - Objectifs (`use-objectif.ts`)
   - Projets (`use-projet.ts`)
   - Opportunités (`use-opportunite.ts`)
   - Documents (`use-document.ts`)
   - Tâches et Rendez-vous (déjà existants, à adapter)

### Moyen Terme
1. ⏳ Ajouter des hooks pour les fonctionnalités avancées:
   - Notifications temps réel
   - Synchronisation email
   - Exports PDF/Excel
   - Workflows automatisés

## Fichiers Créés

```
alfi-crm/hooks/
├── use-client.ts          (NEW - 330 lignes)
├── use-patrimoine.ts      (NEW - 550 lignes)
└── use-simulation.ts      (NEW - 400 lignes)
```

## Fichiers de Documentation

```
alfi-crm/docs/migration/
└── TASK_4.2_HOOKS_COMPLETE.md  (CE FICHIER)
```

## Conclusion

✅ **Task 4.2 COMPLETE**

Les trois hooks principaux (`useClient`, `usePatrimoine`, `useSimulation`) ont été créés avec succès. Ils fournissent une API TypeScript complète et type-safe pour interagir avec les données Prisma via React Query.

Ces hooks constituent la base de l'architecture frontend et seront utilisés dans tous les composants de l'application. Ils garantissent:
- Une gestion cohérente des données
- Des performances optimales grâce au cache
- Une excellente expérience développeur
- Une maintenabilité à long terme

Les hooks existants de CRM ont déjà été copiés et sont compatibles avec l'architecture Prisma car ils utilisent des appels API plutôt que des accès directs à MongoDB.

**Prêt pour la Phase 4: Migration des Composants UI de Base**
