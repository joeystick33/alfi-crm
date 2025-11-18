# Page d'Administration des Logs d'Audit

## Vue d'ensemble

Cette page permet aux administrateurs de consulter et analyser l'historique complet de toutes les actions sensibles effectuées dans le système CRM.

## Fonctionnalités

### 1. Affichage des Logs
- **Table paginée** avec 50 logs par page
- **Colonnes**: Date, Utilisateur, Action, Type d'entité, Détails
- **Tri** par date et action
- **Expansion des lignes** pour voir les changements JSON détaillés

### 2. Statistiques
Affichage de 4 KPIs principaux:
- Total d'actions
- Nombre de créations (vert)
- Nombre de modifications (bleu)
- Nombre de suppressions (rouge)

Statistiques supplémentaires:
- Top 5 des types d'entités les plus modifiés
- Répartition par action (CREATE, UPDATE, DELETE, VIEW, EXPORT, etc.)

### 3. Filtres
- **Action**: Dropdown avec toutes les actions disponibles
- **Type d'entité**: Champ texte libre (ex: Client, Document, Actif)
- **Date de début**: Date picker
- **Date de fin**: Date picker
- **Bouton Réinitialiser**: Efface tous les filtres

### 4. Export CSV
- Bouton "Exporter les logs" dans le header
- Génère un fichier CSV avec toutes les données filtrées
- Colonnes: Date, Utilisateur, Action, Type, ID Entité, Adresse IP
- Nom du fichier: `audit-logs-YYYY-MM-DD.csv`

### 5. Sécurité
- **Vérification de permission**: `canViewAuditLogs`
- **Message "Accès refusé"** si l'utilisateur n'a pas la permission
- Seuls les rôles ADMIN et SUPERADMIN (OWNER, ADMIN) peuvent accéder

## API Endpoints Utilisés

### GET /api/audit/logs
Récupère les logs d'audit avec filtres et pagination.

**Query Parameters:**
- `action`: Action à filtrer (CREATE, UPDATE, DELETE, etc.)
- `entityType`: Type d'entité à filtrer
- `userId`: ID de l'utilisateur à filtrer
- `startDate`: Date de début (ISO 8601)
- `endDate`: Date de fin (ISO 8601)
- `limit`: Nombre de résultats (défaut: 50)
- `offset`: Offset pour pagination

**Response:**
```json
{
  "logs": [
    {
      "id": "log_123",
      "action": "CREATE",
      "entityType": "Client",
      "entityId": "client_456",
      "changes": { "firstName": "Jean", "lastName": "Dupont" },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-11-14T10:30:00Z",
      "user": {
        "id": "user_789",
        "firstName": "Marie",
        "lastName": "Martin",
        "email": "marie@example.com"
      }
    }
  ],
  "total": 1234,
  "limit": 50,
  "offset": 0
}
```

### GET /api/audit/stats
Récupère les statistiques d'audit.

**Query Parameters:**
- `startDate`: Date de début (ISO 8601)
- `endDate`: Date de fin (ISO 8601)

**Response:**
```json
{
  "total": 1234,
  "byAction": {
    "creates": 456,
    "updates": 678,
    "deletes": 100,
    "views": 0,
    "exports": 0,
    "shares": 0,
    "signs": 0,
    "approves": 0,
    "rejects": 0
  },
  "byEntityType": [
    { "entityType": "Client", "count": 500 },
    { "entityType": "Document", "count": 300 },
    { "entityType": "Actif", "count": 200 }
  ],
  "topUsers": [
    { "userId": "user_123", "count": 400 },
    { "userId": "user_456", "count": 300 }
  ]
}
```

## Composants Utilisés

- **DataTable**: Table réutilisable avec tri et pagination
- **Button**: Boutons d'action (Export, Réinitialiser)
- **Input**: Champs de saisie pour les filtres
- **Select**: Dropdown pour sélection d'action
- **Badge**: Badges colorés pour les actions
- **Card**: Cartes pour les statistiques et sections

## Types d'Actions

| Action | Label | Couleur | Description |
|--------|-------|---------|-------------|
| CREATE | Création | Vert | Création d'une nouvelle entité |
| UPDATE | Modification | Bleu | Modification d'une entité existante |
| DELETE | Suppression | Rouge | Suppression d'une entité |
| VIEW | Consultation | Gris | Consultation d'une entité |
| EXPORT | Export | Orange | Export de données |
| SHARE | Partage | Bleu | Partage d'une entité |
| SIGN | Signature | Vert | Signature d'un document |
| APPROVE | Approbation | Vert | Approbation d'une action |
| REJECT | Rejet | Rouge | Rejet d'une action |

## Permissions Requises

### Rôles avec accès
- **SUPERADMIN (OWNER)**: Accès complet à tous les logs
- **SUPERADMIN (ADMIN)**: Accès complet à tous les logs
- **ADMIN (Cabinet)**: Accès aux logs de son cabinet

### Rôles sans accès
- **ADVISOR**: Pas d'accès
- **ASSISTANT**: Pas d'accès
- **SUPERADMIN (DEVELOPER)**: Accès en lecture seule
- **SUPERADMIN (SUPPORT)**: Accès en lecture seule

## TODO: Intégration Authentification

Actuellement, la page utilise un `mockUser` avec rôle ADMIN pour les tests.

**À faire:**
1. Intégrer avec NextAuth ou le système d'authentification choisi
2. Remplacer `mockUser` par la vraie session utilisateur
3. Récupérer le `cabinetId` depuis la session
4. Implémenter la vérification RLS (Row Level Security)

**Code à modifier:**
```typescript
// Remplacer:
const mockUser = {
  role: 'ADMIN',
  isSuperAdmin: false,
  superAdminRole: undefined,
}

// Par:
const { data: session } = useSession()
const user = session?.user
```

## Utilisation

### Accès à la page
```
/dashboard/admin/audit
```

### Exemple de filtrage
1. Sélectionner "Suppression" dans le dropdown Action
2. Entrer "Client" dans le champ Type d'entité
3. Sélectionner une date de début et de fin
4. Les logs sont automatiquement filtrés

### Exemple d'export
1. Appliquer les filtres souhaités
2. Cliquer sur "Exporter les logs"
3. Un fichier CSV est téléchargé avec tous les logs filtrés

### Voir les détails d'un changement
1. Cliquer sur l'icône chevron à droite d'une ligne
2. Les détails JSON s'affichent en dessous de la ligne
3. Cliquer à nouveau pour masquer

## Structure des Fichiers

```
alfi-crm/app/dashboard/admin/audit/
├── page.tsx          # Page principale
└── README.md         # Cette documentation
```

## Dépendances

- `@/lib/permissions`: Système de permissions RBAC
- `@/components/ui/*`: Composants UI réutilisables
- `lucide-react`: Icônes
- API routes: `/api/audit/logs` et `/api/audit/stats`

## Tests Recommandés

1. **Test de permission**: Vérifier que seuls les ADMIN peuvent accéder
2. **Test de filtrage**: Vérifier que tous les filtres fonctionnent
3. **Test de pagination**: Vérifier la navigation entre les pages
4. **Test d'export**: Vérifier que le CSV contient les bonnes données
5. **Test d'expansion**: Vérifier l'affichage des détails JSON
6. **Test de performance**: Vérifier avec 10,000+ logs

## Notes de Performance

- Pagination côté serveur (50 logs par page)
- Statistiques calculées côté serveur
- Export limité à 10,000 logs maximum
- Pas de cache (données sensibles)

## Améliorations Futures

1. **Recherche full-text** dans les changements JSON
2. **Filtres avancés** (combinaisons AND/OR)
3. **Graphiques temporels** (actions par jour/semaine)
4. **Alertes** sur actions suspectes
5. **Export PDF** avec graphiques
6. **Comparaison** de deux versions d'une entité
7. **Restauration** d'une version précédente (rollback)
