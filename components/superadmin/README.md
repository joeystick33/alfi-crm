# SuperAdmin Components

Interface de gestion super administrateur pour ALFI CRM.

## Composants

### SuperAdminDashboard

Dashboard principal affichant les métriques globales et la liste des cabinets.

**Fonctionnalités:**
- Métriques en temps réel (cabinets, conseillers, clients, MRR)
- Liste des cabinets avec statistiques
- Répartition des plans d'abonnement
- Santé de la plateforme
- Création de nouveaux cabinets

**Usage:**
```tsx
import SuperAdminDashboard from '@/components/superadmin/SuperAdminDashboard';

export default function SuperAdminPage() {
  return <SuperAdminDashboard />;
}
```

### CreateOrganizationModal

Modal de création de cabinet en 3 étapes.

**Props:**
- `onClose: () => void` - Callback de fermeture
- `onSuccess: () => void` - Callback de succès

**Fonctionnalités:**
- Étape 1: Informations du cabinet
- Étape 2: Compte administrateur
- Étape 3: Affichage des identifiants
- Génération automatique de slug et mot de passe
- Copie des identifiants en un clic

**Usage:**
```tsx
import CreateOrganizationModal from '@/components/superadmin/CreateOrganizationModal';

const [showModal, setShowModal] = useState(false);

{showModal && (
  <CreateOrganizationModal
    onClose={() => setShowModal(false)}
    onSuccess={() => {
      loadData();
      setShowModal(false);
    }}
  />
)}
```

## Routes API

### GET /api/superadmin/metrics

Récupère les métriques globales de la plateforme.

**Réponse:**
```json
{
  "totalOrganizations": 10,
  "activeOrganizations": 8,
  "totalAdvisors": 45,
  "totalClients": 1250,
  "mrr": 1490,
  "avgClientsPerOrg": 125,
  "activationRate": 80,
  "planDistribution": {
    "TRIAL": 2,
    "STARTER": 3,
    "BUSINESS": 4,
    "PREMIUM": 1
  }
}
```

### GET /api/superadmin/organizations

Liste tous les cabinets avec leurs statistiques.

**Réponse:**
```json
{
  "organizations": [
    {
      "id": "clx...",
      "name": "Cabinet Dupont",
      "slug": "cabinet-dupont",
      "email": "contact@cabinet-dupont.fr",
      "plan": "BUSINESS",
      "status": "ACTIVE",
      "advisorsCount": 5,
      "clientsCount": 150,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### POST /api/superadmin/organizations

Crée un nouveau cabinet avec un utilisateur admin.

**Body:**
```json
{
  "name": "Cabinet Dupont",
  "slug": "cabinet-dupont",
  "email": "contact@cabinet-dupont.fr",
  "phone": "+33123456789",
  "plan": "TRIAL",
  "trialDays": 30,
  "adminUser": {
    "email": "admin@cabinet-dupont.fr",
    "firstName": "Jean",
    "lastName": "Dupont",
    "password": "SecurePass123!"
  }
}
```

**Réponse:**
```json
{
  "success": true,
  "cabinet": {
    "id": "clx...",
    "name": "Cabinet Dupont",
    "slug": "cabinet-dupont"
  },
  "adminUser": {
    "id": "cly...",
    "email": "admin@cabinet-dupont.fr",
    "firstName": "Jean",
    "lastName": "Dupont"
  }
}
```

### PUT /api/superadmin/organizations/[id]/quotas

Met à jour les quotas d'un cabinet.

**Body:**
```json
{
  "maxUsers": 10,
  "maxClients": 500,
  "maxStorage": 10240,
  "maxSimulations": 1000
}
```

### POST /api/superadmin/organizations/[id]/plan

Change le plan d'abonnement d'un cabinet.

**Body:**
```json
{
  "plan": "BUSINESS",
  "subscriptionStart": "2024-01-01T00:00:00Z",
  "subscriptionEnd": "2024-12-31T23:59:59Z",
  "updateQuotas": true
}
```

### PUT /api/superadmin/organizations/[id]/status

Modifie le statut d'un cabinet.

**Body:**
```json
{
  "status": "SUSPENDED",
  "reason": "Non-paiement"
}
```

### GET /api/superadmin/organizations/[id]/audit

Récupère les logs d'audit d'un cabinet.

**Query params:**
- `page` (default: 1)
- `limit` (default: 50)

**Réponse:**
```json
{
  "logs": [
    {
      "id": "clz...",
      "action": "UPDATE",
      "entityType": "Cabinet",
      "entityId": "clx...",
      "changes": {
        "field": "plan",
        "oldValue": "TRIAL",
        "newValue": "BUSINESS"
      },
      "superAdmin": {
        "email": "admin@alfi-crm.com"
      },
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3
  }
}
```

## Sécurité

Toutes les routes SuperAdmin vérifient:
1. Authentification NextAuth valide
2. Existence dans la table `SuperAdmin`
3. Statut `isActive = true`

Si l'une de ces conditions échoue, l'accès est refusé (401 ou 403).

## Quotas par Défaut

| Plan | Users | Clients | Storage | Simulations |
|------|-------|---------|---------|-------------|
| TRIAL | 2 | 50 | 1 GB | 100 |
| STARTER | 5 | 200 | 5 GB | 500 |
| BUSINESS | 15 | 1000 | 20 GB | 2000 |
| PREMIUM | 50 | 5000 | 100 GB | 10000 |
| ENTERPRISE | ∞ | ∞ | ∞ | ∞ |

## Tarification

| Plan | Prix Mensuel |
|------|--------------|
| TRIAL | 0€ |
| STARTER | 49€ |
| BUSINESS | 149€ |
| PREMIUM | 299€ |
| ENTERPRISE | 599€ |
| CUSTOM | Variable |

## Développement

### Ajouter un Nouveau Composant

1. Créer le fichier dans `/components/superadmin/`
2. Utiliser TypeScript et Tailwind CSS
3. Suivre les patterns existants
4. Ajouter la documentation dans ce README

### Ajouter une Nouvelle Route API

1. Créer le fichier dans `/app/api/superadmin/`
2. Vérifier l'authentification SuperAdmin
3. Utiliser Zod pour la validation
4. Créer des logs d'audit pour les actions critiques
5. Documenter dans ce README

## Tests

```bash
# Tester l'authentification SuperAdmin
npm run test:superadmin-auth

# Tester les routes API
npm run test:superadmin-api

# Tester les composants
npm run test:superadmin-components
```

## Support

Pour toute question ou problème, consulter:
- Documentation Prisma: https://www.prisma.io/docs
- Documentation NextAuth: https://next-auth.js.org
- Documentation Tailwind: https://tailwindcss.com
