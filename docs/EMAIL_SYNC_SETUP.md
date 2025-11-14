# Configuration de la Synchronisation Email

## Vue d'Ensemble

Le système de synchronisation email permet aux conseillers de connecter leurs comptes Gmail ou Outlook pour :
- ✅ Synchroniser automatiquement leurs emails
- ✅ Classifier automatiquement les emails (CLIENT, PROSPECT, INTERNAL, IMPORTANT)
- ✅ Lier automatiquement les emails aux clients
- ✅ Consulter tous leurs emails depuis le CRM
- ✅ Envoyer des emails depuis le CRM

## Prérequis

### 1. Configuration Gmail OAuth

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou sélectionner un projet existant
3. Activer l'API Gmail :
   - Aller dans "APIs & Services" > "Library"
   - Rechercher "Gmail API"
   - Cliquer sur "Enable"

4. Créer des credentials OAuth 2.0 :
   - Aller dans "APIs & Services" > "Credentials"
   - Cliquer sur "Create Credentials" > "OAuth client ID"
   - Type d'application : "Web application"
   - Nom : "ALFI CRM Email Sync"
   - Authorized redirect URIs :
     - `http://localhost:3000/api/email/gmail/callback` (développement)
     - `https://votre-domaine.com/api/email/gmail/callback` (production)
   - Cliquer sur "Create"

5. Copier le Client ID et Client Secret

6. Configurer l'écran de consentement OAuth :
   - Aller dans "APIs & Services" > "OAuth consent screen"
   - Type d'utilisateur : "External" (ou "Internal" si G Suite)
   - Remplir les informations requises
   - Scopes : Ajouter les scopes Gmail nécessaires
   - Ajouter des utilisateurs de test si en mode "Testing"

### 2. Configuration Outlook OAuth

1. Aller sur [Azure Portal](https://portal.azure.com/)
2. Aller dans "Azure Active Directory" > "App registrations"
3. Cliquer sur "New registration"
   - Nom : "ALFI CRM Email Sync"
   - Supported account types : "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI : 
     - Type : "Web"
     - URL : `http://localhost:3000/api/email/outlook/callback` (développement)
   - Cliquer sur "Register"

4. Copier l'Application (client) ID

5. Créer un Client Secret :
   - Aller dans "Certificates & secrets"
   - Cliquer sur "New client secret"
   - Description : "ALFI CRM"
   - Expiration : Choisir la durée
   - Cliquer sur "Add"
   - **IMPORTANT** : Copier immédiatement la valeur du secret (elle ne sera plus visible)

6. Configurer les permissions API :
   - Aller dans "API permissions"
   - Cliquer sur "Add a permission"
   - Sélectionner "Microsoft Graph"
   - Sélectionner "Delegated permissions"
   - Ajouter les permissions :
     - `Mail.Read`
     - `Mail.Send`
     - `Mail.ReadWrite`
     - `User.Read`
   - Cliquer sur "Add permissions"

7. Ajouter les Redirect URIs pour la production :
   - Aller dans "Authentication"
   - Ajouter `https://votre-domaine.com/api/email/outlook/callback`

## Configuration de l'Application

### 1. Variables d'Environnement

Créer ou mettre à jour le fichier `.env` :

```env
# Gmail OAuth
GMAIL_CLIENT_ID="votre-client-id.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="votre-client-secret"
GMAIL_REDIRECT_URI="http://localhost:3000/api/email/gmail/callback"

# Outlook OAuth
OUTLOOK_CLIENT_ID="votre-application-id"
OUTLOOK_CLIENT_SECRET="votre-client-secret"
OUTLOOK_REDIRECT_URI="http://localhost:3000/api/email/outlook/callback"

# NextAuth (requis)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="votre-secret-key-genere"
```

### 2. Installation des Dépendances

```bash
npm install googleapis @microsoft/microsoft-graph-client
```

### 3. Migration de la Base de Données

```bash
npx prisma migrate dev --name add_email_sync
```

## Utilisation

### Pour les Développeurs

#### 1. Routes API Disponibles

**Gmail**
- `GET /api/email/gmail/connect` - Obtenir l'URL d'autorisation Gmail
- `GET /api/email/gmail/callback` - Callback OAuth Gmail (automatique)

**Outlook**
- `GET /api/email/outlook/connect` - Obtenir l'URL d'autorisation Outlook
- `GET /api/email/outlook/callback` - Callback OAuth Outlook (automatique)

**Gestion des Emails**
- `GET /api/email` - Liste des emails synchronisés (avec filtres)
- `DELETE /api/email` - Déconnecter l'intégration email
- `PATCH /api/email/[id]` - Marquer comme lu / Lier à un client

**Synchronisation**
- `POST /api/email/sync` - Déclencher une synchronisation manuelle
- `GET /api/email/sync` - Obtenir le statut de synchronisation

#### 2. Exemple d'Utilisation Frontend

```typescript
// Connecter Gmail
const connectGmail = async () => {
  const response = await fetch('/api/email/gmail/connect')
  const { authUrl } = await response.json()
  window.location.href = authUrl // Rediriger vers Google OAuth
}

// Connecter Outlook
const connectOutlook = async () => {
  const response = await fetch('/api/email/outlook/connect')
  const { authUrl } = await response.json()
  window.location.href = authUrl // Rediriger vers Microsoft OAuth
}

// Récupérer les emails
const getEmails = async () => {
  const response = await fetch('/api/email?limit=50&isRead=false')
  const { emails, total } = await response.json()
  return emails
}

// Synchroniser manuellement
const syncEmails = async () => {
  const response = await fetch('/api/email/sync', { method: 'POST' })
  const { synced, errors } = await response.json()
  console.log(`Synced ${synced} emails, ${errors} errors`)
}

// Marquer comme lu
const markAsRead = async (emailId: string) => {
  await fetch(`/api/email/${emailId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isRead: true })
  })
}

// Lier à un client
const linkToClient = async (emailId: string, clientId: string) => {
  await fetch(`/api/email/${emailId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId })
  })
}
```

### Pour les Utilisateurs

#### 1. Connecter un Compte Email

1. Aller dans **Paramètres** > **Intégrations**
2. Cliquer sur **Connecter Gmail** ou **Connecter Outlook**
3. Autoriser l'accès dans la fenêtre OAuth
4. Vous serez redirigé vers le CRM
5. La synchronisation initiale démarre automatiquement

#### 2. Consulter les Emails

1. Aller dans **Emails** dans le menu principal
2. Voir tous les emails synchronisés
3. Filtrer par :
   - Client
   - Lu/Non lu
   - Recherche par texte

#### 3. Synchronisation Automatique

- Les emails sont synchronisés automatiquement toutes les **5 minutes**
- Seuls les emails **non lus** sont synchronisés par défaut
- Les emails sont automatiquement **classifiés** et **liés aux clients**

#### 4. Déconnecter

1. Aller dans **Paramètres** > **Intégrations**
2. Cliquer sur **Déconnecter**
3. La synchronisation s'arrête immédiatement

## Fonctionnalités

### Classification Automatique

Les emails sont automatiquement classifiés selon leur contenu :

- **CLIENT** : Mots-clés liés aux clients (rdv, bilan, patrimoine, contrat, etc.)
- **PROSPECT** : Mots-clés liés aux prospects (nouveau, demande, information, etc.)
- **INTERNAL** : Mots-clés liés à l'équipe (équipe, réunion interne, staff, etc.)
- **IMPORTANT** : Mots-clés d'urgence (urgent, important, prioritaire, asap, etc.)

### Matching Automatique Client

Le système essaie automatiquement de lier les emails aux clients en comparant :
- L'adresse email de l'expéditeur
- Les adresses email des destinataires
- Les adresses email en copie

Si une correspondance est trouvée, l'email est automatiquement lié au client.

### Détection de Direction

- **INBOUND** : Email reçu (from ≠ email utilisateur)
- **OUTBOUND** : Email envoyé (from = email utilisateur)

## Sécurité

### Tokens OAuth

- Les tokens sont stockés **chiffrés** dans la base de données
- Les tokens sont automatiquement **rafraîchis** avant expiration
- Les tokens sont **supprimés** lors de la déconnexion

### Isolation Multi-Tenant

- Chaque cabinet a ses propres emails
- Les emails sont isolés par **Row Level Security (RLS)**
- Un conseiller ne voit que ses propres emails

### Permissions

- Seuls les utilisateurs **authentifiés** peuvent synchroniser des emails
- Les **SuperAdmins** peuvent voir tous les emails (pour support)

## Dépannage

### Erreur "Invalid Grant"

**Cause** : Le refresh token a expiré ou a été révoqué

**Solution** :
1. Déconnecter l'intégration
2. Reconnecter le compte email
3. Réautoriser l'accès

### Emails Non Synchronisés

**Vérifications** :
1. Vérifier que `syncEnabled = true` dans la base de données
2. Vérifier les logs de synchronisation (`lastSyncStatus`)
3. Vérifier que les tokens ne sont pas expirés
4. Déclencher une synchronisation manuelle via l'API

### Erreur "Quota Exceeded"

**Cause** : Trop de requêtes API Gmail/Outlook

**Solution** :
1. Réduire la fréquence de synchronisation
2. Limiter le nombre d'emails synchronisés par batch
3. Attendre quelques minutes avant de réessayer

## Limitations

### Gmail
- **Quota** : 1 milliard de requêtes par jour (largement suffisant)
- **Rate Limit** : 250 requêtes par seconde par utilisateur
- **Emails** : 50 emails par requête maximum

### Outlook
- **Quota** : Varie selon le type de compte
- **Rate Limit** : Varie selon le type de compte
- **Emails** : 50 emails par requête maximum

## Prochaines Étapes

### Fonctionnalités Futures

- [ ] Synchronisation bidirectionnelle (envoyer des emails depuis le CRM)
- [ ] Support des pièces jointes
- [ ] Recherche full-text dans les emails
- [ ] Filtres avancés (date, expéditeur, etc.)
- [ ] Notifications pour nouveaux emails importants
- [ ] Réponse rapide depuis le CRM
- [ ] Templates d'emails
- [ ] Tracking d'ouverture et de clics

## Support

Pour toute question ou problème :
- Consulter les logs : `lastSyncStatus` dans `email_integrations`
- Vérifier les erreurs dans les logs serveur
- Contacter le support technique

---

**Date de création** : 13 novembre 2024  
**Version** : 1.0.0  
**Statut** : ✅ Production Ready
