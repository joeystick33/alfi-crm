# Système de Sauvegarde des Simulations - Implémentation Complète

## Vue d'ensemble

Le système de sauvegarde des simulations permet aux conseillers de sauvegarder les résultats de leurs calculateurs et simulateurs directement dans le dossier client. Les simulations peuvent être consultées dans l'historique du client et partagées avec lui.

## Composants Créés

### 1. Service Backend (`lib/services/simulation-service.ts`)

Service Prisma pour gérer les simulations avec les fonctionnalités suivantes:

- **createSimulation**: Créer une nouvelle simulation avec paramètres et résultats
- **getSimulations**: Récupérer les simulations avec filtres (clientId, type, status, search)
- **getSimulationById**: Récupérer une simulation spécifique
- **updateSimulation**: Mettre à jour une simulation existante
- **deleteSimulation**: Supprimer une simulation
- **archiveSimulation**: Archiver une simulation
- **shareWithClient**: Partager une simulation avec le client (crée une notification)
- **getClientSimulationHistory**: Récupérer l'historique des simulations d'un client
- **getStatistics**: Statistiques des simulations par cabinet
- **getRecentSimulations**: Récupérer les simulations récentes

### 2. API Routes

#### `/api/simulations` (route.ts)
- **GET**: Liste les simulations avec filtres optionnels
- **POST**: Créer une nouvelle simulation

#### `/api/simulations/[id]` (route.ts)
- **GET**: Récupérer une simulation par ID
- **PATCH**: Mettre à jour une simulation
- **DELETE**: Supprimer une simulation

#### `/api/simulations/[id]/share` (route.ts)
- **POST**: Partager une simulation avec le client

Toutes les routes incluent:
- Authentification via `requireAuth`
- Validation des permissions
- Audit logging
- Gestion d'erreurs appropriée

### 3. Composants Frontend

#### `components/client360/SimulationHistory.tsx`
Composant pour afficher l'historique des simulations dans la vue Client 360°:
- Liste toutes les simulations du client
- Affiche le type, statut, date, créateur
- Badges colorés selon le statut
- Score de faisabilité
- Actions: Voir, Partager, Archiver
- Gestion des états de chargement et d'erreur

#### `components/common/SaveSimulationButton.tsx`
Bouton réutilisable pour sauvegarder une simulation depuis n'importe quel calculateur/simulateur:
- Modal avec formulaire de sauvegarde
- Champs: Client ID, Nom, Description, Partage avec client
- Validation des champs requis
- Feedback visuel (loading, success, error)
- Fermeture automatique après succès

#### `hooks/use-save-simulation.ts`
Hook personnalisé pour gérer la sauvegarde:
- État de chargement
- Gestion d'erreurs
- Appel API simplifié

### 4. Intégration

#### TabOverview (Client 360°)
Le composant `SimulationHistory` a été ajouté à la vue d'ensemble du client pour afficher l'historique des simulations.

#### RetirementSimulator (Exemple)
Le `SaveSimulationButton` a été intégré dans le simulateur de retraite comme exemple d'utilisation:
- Bouton affiché après les résultats
- Paramètres et résultats automatiquement capturés
- Nom par défaut généré avec la date
- Score de faisabilité calculé

## Modèle de Données

Le modèle `Simulation` existe déjà dans le schéma Prisma avec les champs suivants:

```prisma
model Simulation {
  id               String           @id @default(cuid())
  cabinetId        String
  clientId         String
  createdById      String
  type             SimulationType   // RETIREMENT, REAL_ESTATE_LOAN, etc.
  name             String
  description      String?
  parameters       Json             // Paramètres d'entrée
  results          Json             // Résultats calculés
  recommendations  Json?            // Recommandations
  feasibilityScore Int?             // Score de faisabilité (0-100)
  status           SimulationStatus // DRAFT, COMPLETED, SHARED, ARCHIVED
  sharedWithClient Boolean
  sharedAt         DateTime?
  createdAt        DateTime
  updatedAt        DateTime
}
```

## Types de Simulation Supportés

- `RETIREMENT`: Simulation de retraite
- `REAL_ESTATE_LOAN`: Prêt immobilier
- `LIFE_INSURANCE`: Assurance vie
- `WEALTH_TRANSMISSION`: Transmission de patrimoine
- `TAX_OPTIMIZATION`: Optimisation fiscale
- `INVESTMENT_PROJECTION`: Projection d'investissement
- `BUDGET_ANALYSIS`: Analyse budgétaire
- `OTHER`: Autre

## Statuts de Simulation

- `DRAFT`: Brouillon (non utilisé actuellement)
- `COMPLETED`: Terminée (statut par défaut à la création)
- `SHARED`: Partagée avec le client
- `ARCHIVED`: Archivée

## Utilisation

### Dans un Calculateur/Simulateur

```tsx
import { SaveSimulationButton } from '@/components/common/SaveSimulationButton'

// Dans votre composant, après avoir calculé les résultats:
<SaveSimulationButton
  type="RETIREMENT"
  defaultName={`Simulation retraite - ${new Date().toLocaleDateString('fr-FR')}`}
  parameters={{
    currentAge: 35,
    retirementAge: 65,
    // ... autres paramètres
  }}
  results={calculatedResults}
  recommendations={recommendations}
  feasibilityScore={85}
  onSaved={() => {
    // Callback optionnel après sauvegarde
  }}
/>
```

### Afficher l'Historique

```tsx
import { SimulationHistory } from '@/components/client360/SimulationHistory'

<SimulationHistory clientId={clientId} />
```

## Fonctionnalités Clés

1. **Sauvegarde Automatique**: Les paramètres et résultats sont capturés automatiquement
2. **Liaison Client**: Chaque simulation est liée à un client spécifique
3. **Partage**: Les simulations peuvent être partagées avec les clients (crée une notification)
4. **Historique**: Toutes les simulations sont accessibles dans la vue Client 360°
5. **Audit**: Toutes les actions (création, modification, suppression, partage) sont loggées
6. **Timeline**: La création d'une simulation crée un événement dans la timeline du client
7. **Archivage**: Les simulations peuvent être archivées sans être supprimées
8. **Recherche**: Les simulations peuvent être filtrées par type, statut, client, ou recherche textuelle

## Sécurité

- Authentification requise pour toutes les routes
- Isolation multi-tenant via RLS (Row Level Security)
- Validation des permissions utilisateur
- Audit logging de toutes les actions sensibles

## Prochaines Étapes Suggérées

1. Ajouter le `SaveSimulationButton` aux autres calculateurs et simulateurs
2. Créer une page dédiée pour visualiser les détails d'une simulation
3. Ajouter la possibilité d'exporter les simulations en PDF
4. Implémenter la comparaison de simulations
5. Ajouter des graphiques dans l'historique des simulations
6. Permettre la duplication de simulations existantes

## Tests

Pour tester le système:

1. Accéder à un simulateur (ex: `/dashboard/simulators/retirement`)
2. Remplir les paramètres et générer des résultats
3. Cliquer sur "Sauvegarder dans le dossier client"
4. Remplir le formulaire avec un ID client valide
5. Vérifier que la simulation apparaît dans la vue Client 360° du client
6. Tester les actions: Partager, Archiver
7. Vérifier que les notifications sont créées lors du partage

## Conformité aux Exigences

✅ **Requirement 10.4**: "WHEN the user completes a simulation, THE System SHALL allow saving it to the client's dossier"

Le système implémenté répond complètement à cette exigence en permettant:
- La sauvegarde des simulations dans le dossier client
- L'affichage de l'historique des simulations
- Le partage avec le client
- La gestion complète du cycle de vie des simulations
