# API Routes Documentation

## Vue d'Ensemble

Cette documentation décrit toutes les routes API disponibles dans le CRM Aura. Toutes les routes sont protégées par authentification et respectent l'isolation multi-tenant.

## Base URL

```
http://localhost:3000/api
```

## Authentification

Toutes les routes (sauf `/api/auth/login`) nécessitent un token d'authentification dans le header:

```
Authorization: Bearer <token>
```

---

## Authentication

### POST /api/auth/login

Authentifie un utilisateur ou un SuperAdmin.

**Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "isSuperAdmin": false
}
```

**Response 200**:
```json
{
  "data": {
    "user": {
      "id": "user-id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "ADVISOR",
      "cabinetId": "cabinet-id",
      "cabinetName": "Cabinet XYZ",
      "permissions": ["canManageClients", "..."]
    },
    "message": "Login successful"
  },
  "timestamp": "2024-11-13T10:00:00.000Z"
}
```

**Errors**:
- `400`: Email and password are required
- `401`: Invalid credentials
- `403`: User or cabinet not active

---

## Clients

### GET /api/clients

Liste les clients avec filtres optionnels.

**Query Parameters**:
- `status` (optional): PROSPECT | ACTIVE | INACTIVE | ARCHIVED | LOST
- `clientType` (optional): PARTICULIER | PROFESSIONNEL
- `conseillerId` (optional): Filter by advisor ID
- `search` (optional): Search in name, email, company
- `kycStatus` (optional): PENDING | IN_PROGRESS | COMPLETED | EXPIRED | REJECTED
- `limit` (optional): Number of results (default: all)
- `offset` (optional): Pagination offset

**Response 200**:
```json
{
  "data": [
    {
      "id": "client-id",
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean.dupont@example.com",
      "status": "ACTIVE",
      "clientType": "PARTICULIER",
      "conseiller": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "_count": {
        "actifs": 5,
        "passifs": 2,
        "contrats": 3
      }
    }
  ],
  "timestamp": "2024-11-13T10:00:00.000Z"
}
```

### POST /api/clients

Crée un nouveau client.

**Body**:
```json
{
  "clientType": "PARTICULIER",
  "conseillerId": "advisor-id",
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@example.com",
  "phone": "0612345678",
  "maritalStatus": "MARRIED",
  "riskProfile": "EQUILIBRE"
}
```

**Response 201**:
```json
{
  "data": {
    "id": "client-id",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com",
    "status": "PROSPECT",
    "kycStatus": "PENDING",
    "conseiller": {
      "id": "advisor-id",
      "firstName": "John",
      "lastName": "Doe"
    }
  },
  "timestamp": "2024-11-13T10:00:00.000Z"
}
```

### GET /api/clients/[id]

Récupère un client par ID.

**Query Parameters**:
- `include` (optional): Set to "true" to include relations (actifs, passifs, etc.)

**Response 200**:
```json
{
  "data": {
    "id": "client-id",
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@example.com",
    "status": "ACTIVE",
    "wealth": {
      "totalAssets": 500000,
      "totalLiabilities": 200000,
      "netWealth": 300000
    },
    "actifs": [...],
    "passifs": [...],
    "contrats": [...]
  },
  "timestamp": "2024-11-13T10:00:00.000Z"
}
```

### PATCH /api/clients/[id]

Met à jour un client.

**Body**:
```json
{
  "phone": "0612345679",
  "status": "ACTIVE",
  "riskProfile": "DYNAMIQUE"
}
```

**Response 200**:
```json
{
  "data": {
    "id": "client-id",
    "firstName": "Jean",
    "lastName": "Dupont",
    "phone": "0612345679",
    "status": "ACTIVE"
  },
  "timestamp": "2024-11-13T10:00:00.000Z"
}
```

### DELETE /api/clients/[id]

Archive un client (soft delete).

**Response 200**:
```json
{
  "data": {
    "message": "Client archived successfully"
  },
  "timestamp": "2024-11-13T10:00:00.000Z"
}
```

---

## Wealth (Patrimoine)

### GET /api/clients/[id]/wealth

Récupère le patrimoine calculé d'un client.

**Response 200**:
```json
{
  "data": {
    "totalAssets": 500000,
    "totalLiabilities": 200000,
    "netWealth": 300000,
    "managedAssets": 400000,
    "unmanagedAssets": 100000,
    "lastCalculated": "2024-11-13T10:00:00.000Z",
    "breakdown": {
      "immobilier": 300000,
      "financier": 150000,
      "professionnel": 50000,
      "autre": 0
    }
  },
  "timestamp": "2024-11-13T10:00:00.000Z"
}
```

### POST /api/clients/[id]/wealth/recalculate

Recalcule le patrimoine d'un client.

**Response 200**:
```json
{
  "data": {
    "wealth": {
      "totalAssets": 500000,
      "totalLiabilities": 200000,
      "netWealth": 300000
    },
    "message": "Wealth recalculated successfully"
  },
  "timestamp": "2024-11-13T10:00:00.000Z"
}
```

---

## Actifs

### GET /api/actifs

Liste les actifs avec filtres.

**Query Parameters**:
- `type` (optional): REAL_ESTATE_MAIN | LIFE_INSURANCE | etc.
- `category` (optional): IMMOBILIER | FINANCIER | PROFESSIONNEL | AUTRE
- `isActive` (optional): true | false
- `search` (optional): Search in name, description
- `minValue` (optional): Minimum value
- `maxValue` (optional): Maximum value

**Response 200**:
```json
{
  "data": [
    {
      "id": "actif-id",
      "type": "REAL_ESTATE_MAIN",
      "category": "IMMOBILIER",
      "name": "Résidence principale",
      "value": 500000,
      "_count": {
        "clients": 2,
        "documents": 5
      }
    }
  ],
  "timestamp": "2024-11-13T10:00:00.000Z"
}
```

### POST /api/actifs

Crée un nouvel actif.

**Body (simple)**:
```json
{
  "type": "REAL_ESTATE_MAIN",
  "category": "IMMOBILIER",
  "name": "Résidence principale",
  "value": 500000,
  "acquisitionDate": "2020-01-01",
  "acquisitionValue": 400000
}
```

**Body (avec client)**:
```json
{
  "clientId": "client-id",
  "ownershipPercentage": 100,
  "type": "REAL_ESTATE_MAIN",
  "category": "IMMOBILIER",
  "name": "Résidence principale",
  "value": 500000
}
```

**Response 201**:
```json
{
  "data": {
    "id": "actif-id",
    "type": "REAL_ESTATE_MAIN",
    "name": "Résidence principale",
    "value": 500000
  },
  "timestamp": "2024-11-13T10:00:00.000Z"
}
```

---

## Actifs - Indivision

### POST /api/actifs/[id]/share

Partage un actif avec un autre client (indivision).

**Body**:
```json
{
  "clientId": "client-id",
  "ownershipPercentage": 50,
  "ownershipType": "Pleine propriété"
}
```

**Response 200**:
```json
{
  "data": {
    "id": "client-actif-id",
    "clientId": "client-id",
    "actifId": "actif-id",
    "ownershipPercentage": 50,
    "message": "Actif shared successfully"
  },
  "timestamp": "2024-11-13T10:00:00.000Z"
}
```

**Errors**:
- `400`: Total ownership cannot exceed 100%

### GET /api/actifs/[id]/share

Récupère les propriétaires d'un actif.

**Response 200**:
```json
{
  "data": [
    {
      "client": {
        "id": "client-1",
        "firstName": "Jean",
        "lastName": "Dupont"
      },
      "ownershipPercentage": 50,
      "ownershipType": "Pleine propriété"
    },
    {
      "client": {
        "id": "client-2",
        "firstName": "Marie",
        "lastName": "Dupont"
      },
      "ownershipPercentage": 50,
      "ownershipType": "Pleine propriété"
    }
  ],
  "timestamp": "2024-11-13T10:00:00.000Z"
}
```

---

## Documents

### GET /api/documents

Liste les documents avec filtres.

**Query Parameters**:
- `type` (optional): ID_CARD | CONTRACT | etc.
- `category` (optional): IDENTITE | FISCAL | etc.
- `isConfidential` (optional): true | false
- `uploadedById` (optional): Filter by uploader
- `search` (optional): Search in name, description

**Response 200**:
```json
{
  "data": [
    {
      "id": "document-id",
      "name": "Contrat assurance-vie",
      "type": "CONTRACT",
      "fileUrl": "/uploads/contrat.pdf",
      "fileSize": 1024000,
      "uploadedBy": {
        "firstName": "John",
        "lastName": "Doe"
      },
      "_count": {
        "clients": 1,
        "contrats": 1
      }
    }
  ],
  "timestamp": "2024-11-13T10:00:00.000Z"
}
```

### POST /api/documents

Crée un nouveau document.

**Body (simple)**:
```json
{
  "name": "Carte d'identité",
  "fileUrl": "/uploads/id-card.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "type": "ID_CARD",
  "category": "IDENTITE"
}
```

**Body (avec lien)**:
```json
{
  "name": "Carte d'identité",
  "fileUrl": "/uploads/id-card.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "type": "ID_CARD",
  "category": "IDENTITE",
  "linkTo": {
    "entityType": "client",
    "entityId": "client-id"
  }
}
```

**Response 201**:
```json
{
  "data": {
    "id": "document-id",
    "name": "Carte d'identité",
    "type": "ID_CARD",
    "version": 1
  },
  "timestamp": "2024-11-13T10:00:00.000Z"
}
```

---

## Error Responses

Toutes les erreurs suivent le même format:

```json
{
  "error": "Error message",
  "timestamp": "2024-11-13T10:00:00.000Z"
}
```

**Status Codes**:
- `400`: Bad Request - Invalid input
- `401`: Unauthorized - Authentication required
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource not found
- `500`: Internal Server Error

---

## Rate Limiting

TODO: Implémenter rate limiting

---

## Pagination

Pour les endpoints qui retournent des listes, utilisez les paramètres:
- `limit`: Nombre de résultats par page
- `offset`: Décalage pour la pagination

Exemple:
```
GET /api/clients?limit=20&offset=40
```

---

## Filtering

La plupart des endpoints de liste supportent des filtres via query parameters. Consultez la documentation de chaque endpoint pour les filtres disponibles.

---

## Notes

- Toutes les dates sont au format ISO 8601
- Tous les montants sont en euros (€)
- L'isolation multi-tenant est automatique
- Les SuperAdmins peuvent accéder à tous les cabinets

---

## Routes à Implémenter

Les routes suivantes sont prévues mais pas encore implémentées:

- [ ] `/api/users` - Gestion des utilisateurs
- [ ] `/api/passifs` - Gestion des passifs
- [ ] `/api/contrats` - Gestion des contrats
- [ ] `/api/documents/[id]/versions` - Versioning
- [ ] `/api/signatures` - Signature électronique
- [ ] `/api/kyc` - Gestion KYC
- [ ] `/api/family` - Gestion familiale
- [ ] `/api/apporteurs` - Apporteurs d'affaires
- [ ] `/api/stats` - Statistiques du cabinet

---

**Documentation générée le**: 13 novembre 2024
