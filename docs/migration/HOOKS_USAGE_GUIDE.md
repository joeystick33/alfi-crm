# Guide d'Utilisation des Hooks - ALFI CRM

## Vue d'Ensemble

Ce guide présente les hooks personnalisés disponibles dans ALFI CRM pour gérer les données avec React Query et Prisma.

## Hooks Principaux

### 1. `use-client.ts` - Gestion des Clients

#### Queries (Lecture)

```typescript
import { useClient, useClients, useClientSearch } from '@/hooks/use-client'

// Récupérer un client par ID
const { data: client, isLoading } = useClient(clientId, true) // true = include relations

// Liste des clients avec filtres
const { data: clients } = useClients({
  status: 'ACTIVE',
  clientType: 'PARTICULIER',
  search: 'Dupont',
  limit: 50
})

// Recherche de clients
const { data: results } = useClientSearch('Jean', 20)

// Timeline d'un client
const { data: timeline } = useClientTimeline(clientId)

// Statistiques d'un client
const { data: stats } = useClientStats(clientId)
```

#### Mutations (Écriture)

```typescript
import { 
  useCreateClient, 
  useUpdateClient, 
  useUpdateClientStatus 
} from '@/hooks/use-client'

// Créer un client
const { mutate: createClient, isPending } = useCreateClient()
createClient({
  clientType: 'PARTICULIER',
  conseillerId: userId,
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean.dupont@example.com',
  // ...
})

// Mettre à jour un client
const { mutate: updateClient } = useUpdateClient()
updateClient({
  id: clientId,
  data: {
    phone: '+33612345678',
    address: { /* ... */ }
  }
})

// Changer le statut
const { mutate: updateStatus } = useUpdateClientStatus()
updateStatus({ id: clientId, status: 'ACTIVE' })
```

### 2. `use-patrimoine.ts` - Gestion du Patrimoine

#### Actifs

```typescript
import { 
  useActifs, 
  useClientActifs, 
  useCreateActif,
  useLinkActifToClient 
} from '@/hooks/use-patrimoine'

// Liste des actifs
const { data: actifs } = useActifs({
  type: 'IMMOBILIER',
  category: 'IMMOBILIER',
  managedByFirm: true
})

// Actifs d'un client
const { data: clientActifs } = useClientActifs(clientId)

// Créer un actif
const { mutate: createActif } = useCreateActif()
createActif({
  type: 'IMMOBILIER',
  category: 'IMMOBILIER',
  name: 'Appartement Paris 15e',
  value: 450000,
  managedByFirm: false
})

// Lier un actif à un client
const { mutate: linkActif } = useLinkActifToClient()
linkActif({
  actifId: actifId,
  clientId: clientId,
  ownershipPercentage: 100,
  ownershipType: 'PLEINE_PROPRIETE'
})
```

#### Passifs

```typescript
import { 
  usePassifs, 
  useClientPassifs, 
  useCreatePassif 
} from '@/hooks/use-patrimoine'

// Liste des passifs
const { data: passifs } = usePassifs({
  clientId: clientId,
  type: 'PRET_IMMOBILIER',
  isActive: true
})

// Créer un passif
const { mutate: createPassif } = useCreatePassif()
createPassif({
  clientId: clientId,
  type: 'PRET_IMMOBILIER',
  name: 'Prêt immobilier résidence principale',
  initialAmount: 300000,
  remainingAmount: 250000,
  interestRate: 1.5,
  monthlyPayment: 1200,
  startDate: new Date('2020-01-01'),
  endDate: new Date('2040-01-01')
})
```

#### Contrats

```typescript
import { 
  useContrats, 
  useClientContrats, 
  useCreateContrat,
  useRenewContrat 
} from '@/hooks/use-patrimoine'

// Liste des contrats
const { data: contrats } = useContrats({
  clientId: clientId,
  type: 'ASSURANCE_VIE',
  status: 'ACTIVE',
  renewalDueSoon: true
})

// Créer un contrat
const { mutate: createContrat } = useCreateContrat()
createContrat({
  clientId: clientId,
  type: 'ASSURANCE_VIE',
  name: 'Contrat Assurance Vie',
  provider: 'AXA',
  startDate: new Date(),
  premium: 5000,
  coverage: 100000
})

// Renouveler un contrat
const { mutate: renewContrat } = useRenewContrat()
renewContrat({
  id: contratId,
  newEndDate: new Date('2025-12-31'),
  newPremium: 5500
})
```

#### Calculs Patrimoniaux

```typescript
import { 
  useClientWealth, 
  useClientPatrimoine,
  usePatrimoineOpportunities 
} from '@/hooks/use-patrimoine'

// Calculer le patrimoine
const { data: wealth } = useClientWealth(clientId)
console.log(wealth.totalActifs) // 1,500,000
console.log(wealth.totalPassifs) // 300,000
console.log(wealth.netWealth) // 1,200,000
console.log(wealth.allocationPercentages.immobilier) // 60%

// Patrimoine complet (actifs + passifs + contrats + wealth)
const { data: patrimoine } = useClientPatrimoine(clientId)

// Détecter les opportunités
const { data: opportunities } = usePatrimoineOpportunities(clientId)
```

### 3. `use-simulation.ts` - Gestion des Simulations

#### Queries

```typescript
import { 
  useSimulation, 
  useSimulations,
  useClientSimulationHistory,
  useRecentSimulations,
  useSimulationStatistics 
} from '@/hooks/use-simulation'

// Récupérer une simulation
const { data: simulation } = useSimulation(simulationId)

// Liste des simulations
const { data: simulations } = useSimulations({
  clientId: clientId,
  type: 'RETIREMENT',
  status: 'COMPLETED'
})

// Historique des simulations d'un client
const { data: history } = useClientSimulationHistory(clientId)

// Simulations récentes
const { data: recent } = useRecentSimulations(10)

// Statistiques
const { data: stats } = useSimulationStatistics()
```

#### Mutations

```typescript
import { 
  useCreateSimulation, 
  useUpdateSimulation,
  useShareSimulation,
  useArchiveSimulation 
} from '@/hooks/use-simulation'

// Créer une simulation
const { mutate: createSimulation } = useCreateSimulation()
createSimulation({
  clientId: clientId,
  type: 'RETIREMENT',
  name: 'Simulation Retraite 2024',
  description: 'Projection de la retraite à 65 ans',
  parameters: {
    currentAge: 45,
    retirementAge: 65,
    currentSalary: 60000,
    // ...
  },
  results: {
    monthlyPension: 2500,
    replacementRate: 0.65,
    // ...
  },
  feasibilityScore: 85,
  sharedWithClient: false
})

// Mettre à jour une simulation
const { mutate: updateSimulation } = useUpdateSimulation()
updateSimulation({
  id: simulationId,
  data: {
    name: 'Simulation Retraite 2024 (Mise à jour)',
    feasibilityScore: 90
  }
})

// Partager avec le client
const { mutate: shareSimulation } = useShareSimulation()
shareSimulation(simulationId)

// Archiver
const { mutate: archiveSimulation } = useArchiveSimulation()
archiveSimulation(simulationId)
```

#### Helpers

```typescript
import { 
  useCanShareSimulation,
  useCanEditSimulation,
  useSimulationTypeLabel,
  useSimulationStatusLabel,
  useSimulationStatusColor 
} from '@/hooks/use-simulation'

// Vérifier les permissions
const canShare = useCanShareSimulation(simulation)
const canEdit = useCanEditSimulation(simulation)

// Obtenir les labels
const typeLabel = useSimulationTypeLabel('RETIREMENT') // "Retraite"
const statusLabel = useSimulationStatusLabel('COMPLETED') // "Terminée"
const statusColor = useSimulationStatusColor('COMPLETED') // "green"
```

## Patterns Communs

### 1. Loading States

```typescript
const { data, isLoading, error } = useClient(clientId)

if (isLoading) {
  return <Skeleton />
}

if (error) {
  return <ErrorMessage error={error} />
}

return <ClientDetails client={data} />
```

### 2. Mutations avec Toast

```typescript
import { toast } from '@/hooks/use-toast'

const { mutate: createClient, isPending } = useCreateClient()

const handleSubmit = (data: CreateClientData) => {
  createClient(data, {
    onSuccess: (client) => {
      toast({
        title: 'Succès',
        description: `Client ${client.firstName} ${client.lastName} créé`,
      })
      router.push(`/dashboard/clients/${client.id}`)
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
```

### 3. Optimistic Updates

```typescript
const { mutate: updateStatus } = useUpdateClientStatus()
const optimisticUpdate = useOptimisticClientUpdate()

const handleStatusChange = (newStatus: ClientStatus) => {
  // Mise à jour optimiste immédiate
  optimisticUpdate(clientId, { status: newStatus })
  
  // Mutation serveur
  updateStatus({ id: clientId, status: newStatus })
}
```

### 4. Dependent Queries

```typescript
// Charger le client d'abord
const { data: client } = useClient(clientId)

// Puis charger son patrimoine (seulement si le client est chargé)
const { data: patrimoine } = useClientPatrimoine(clientId, {
  enabled: !!client
})
```

### 5. Pagination

```typescript
const [page, setPage] = useState(1)
const pageSize = 20

const { data: clients } = useClients({
  limit: pageSize,
  offset: (page - 1) * pageSize
})
```

### 6. Filtres Dynamiques

```typescript
const [filters, setFilters] = useState<ClientFilters>({
  status: 'ACTIVE'
})

const { data: clients } = useClients(filters)

// Changer les filtres
const handleFilterChange = (newFilters: Partial<ClientFilters>) => {
  setFilters(prev => ({ ...prev, ...newFilters }))
}
```

## Gestion du Cache

### Invalidation Manuelle

```typescript
import { useQueryClient } from '@tanstack/react-query'
import { clientKeys } from '@/hooks/use-client'

const queryClient = useQueryClient()

// Invalider tous les clients
queryClient.invalidateQueries({ queryKey: clientKeys.all })

// Invalider un client spécifique
queryClient.invalidateQueries({ queryKey: clientKeys.detail(clientId) })

// Invalider les listes de clients
queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
```

### Prefetching

```typescript
const queryClient = useQueryClient()

// Prefetch un client avant navigation
const handleClientHover = (clientId: string) => {
  queryClient.prefetchQuery({
    queryKey: clientKeys.detail(clientId),
    queryFn: () => api.get(`/api/clients/${clientId}`)
  })
}
```

## Gestion d'Erreurs

### Erreurs Globales

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        console.error('Query error:', error)
        // Log to error tracking service
      },
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error)
        toast({
          title: 'Erreur',
          description: error.message,
          variant: 'destructive',
        })
      },
    },
  },
})
```

### Erreurs Spécifiques

```typescript
const { data, error, isError } = useClient(clientId)

if (isError) {
  if (error.status === 404) {
    return <NotFound />
  }
  if (error.status === 403) {
    return <Forbidden />
  }
  return <ErrorMessage error={error} />
}
```

## Performance

### Stale Time Configuration

```typescript
// Les données restent "fraîches" pendant 5 minutes
const { data } = useClient(clientId) // staleTime: 5 minutes

// Les données restent "fraîches" pendant 2 minutes
const { data } = useClients() // staleTime: 2 minutes
```

### Désactiver les Queries

```typescript
// Ne charger que si nécessaire
const { data } = useClient(clientId, {
  enabled: isModalOpen
})
```

### Retry Logic

```typescript
const { data } = useClient(clientId, {
  retry: 3, // Réessayer 3 fois
  retryDelay: 1000, // Attendre 1 seconde entre chaque essai
})
```

## Best Practices

### 1. Toujours Gérer les États de Chargement

```typescript
✅ GOOD
const { data, isLoading } = useClient(clientId)
if (isLoading) return <Skeleton />

❌ BAD
const { data } = useClient(clientId)
return <div>{data.firstName}</div> // Crash si data est undefined
```

### 2. Utiliser les Types TypeScript

```typescript
✅ GOOD
const { data: client } = useClient(clientId)
// client est typé comme Client | undefined

❌ BAD
const { data } = useClient(clientId)
// data est typé comme any
```

### 3. Gérer les Erreurs

```typescript
✅ GOOD
const { data, error } = useClient(clientId)
if (error) return <ErrorMessage error={error} />

❌ BAD
const { data } = useClient(clientId)
// Pas de gestion d'erreur
```

### 4. Utiliser les Callbacks de Mutation

```typescript
✅ GOOD
createClient(data, {
  onSuccess: () => router.push('/clients'),
  onError: (error) => toast({ title: 'Erreur', description: error.message })
})

❌ BAD
createClient(data)
// Pas de feedback utilisateur
```

### 5. Invalider le Cache Après Mutations

```typescript
✅ GOOD
// Les hooks le font automatiquement
const { mutate } = useCreateClient()

❌ BAD
// Invalider manuellement (sauf cas spéciaux)
queryClient.invalidateQueries({ queryKey: clientKeys.all })
```

## Ressources

- [React Query Documentation](https://tanstack.com/query/latest)
- [Prisma Documentation](https://www.prisma.io/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## Support

Pour toute question ou problème:
1. Consulter la documentation des hooks dans `alfi-crm/hooks/`
2. Vérifier les exemples dans `alfi-crm/docs/migration/TASK_4.2_HOOKS_COMPLETE.md`
3. Contacter l'équipe de développement
