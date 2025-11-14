# 📧 Synchronisation Email - Guide Rapide

## ✅ Statut : FONCTIONNEL

La synchronisation email Gmail/Outlook est **100% fonctionnelle** et prête à l'emploi.

---

## 🚀 Démarrage Rapide (5 minutes)

### Étape 1 : Installer les Dépendances

```bash
cd alfi-crm
npm install
```

Les packages `googleapis` et `@microsoft/microsoft-graph-client` sont déjà dans `package.json`.

### Étape 2 : Configurer OAuth

Vous devez créer des credentials OAuth pour Gmail et/ou Outlook.

**Gmail** : Suivre le guide dans `docs/EMAIL_SYNC_SETUP.md` section "Configuration Gmail OAuth"

**Outlook** : Suivre le guide dans `docs/EMAIL_SYNC_SETUP.md` section "Configuration Outlook OAuth"

### Étape 3 : Variables d'Environnement

Copier `.env.example` vers `.env` et remplir :

```env
# Gmail
GMAIL_CLIENT_ID="votre-client-id.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="votre-client-secret"

# Outlook
OUTLOOK_CLIENT_ID="votre-application-id"
OUTLOOK_CLIENT_SECRET="votre-client-secret"

# NextAuth (requis)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generer-avec-openssl-rand-base64-32"
```

### Étape 4 : Migration Base de Données

```bash
npx prisma migrate dev --name add_email_sync
npx prisma generate
```

### Étape 5 : Démarrer l'Application

```bash
npm run dev
```

Ouvrir http://localhost:3000

---

## 👤 Utilisation (Utilisateur Final)

### Connecter Gmail

1. Aller dans **Paramètres** > **Intégrations**
2. Cliquer sur **"Connecter Gmail"**
3. Autoriser l'accès dans la fenêtre Google
4. ✅ **Terminé !** Les emails se synchronisent automatiquement

### Connecter Outlook

1. Aller dans **Paramètres** > **Intégrations**
2. Cliquer sur **"Connecter Outlook"**
3. Autoriser l'accès dans la fenêtre Microsoft
4. ✅ **Terminé !** Les emails se synchronisent automatiquement

### Consulter les Emails

1. Aller dans **Emails** (menu principal)
2. Voir tous les emails synchronisés
3. Filtrer par client, statut, recherche
4. Cliquer pour voir les détails

---

## 🔧 API Endpoints

### Gmail OAuth

```bash
# Obtenir l'URL d'autorisation
GET /api/email/gmail/connect

# Callback (automatique)
GET /api/email/gmail/callback?code=xxx&state=xxx
```

### Outlook OAuth

```bash
# Obtenir l'URL d'autorisation
GET /api/email/outlook/connect

# Callback (automatique)
GET /api/email/outlook/callback?code=xxx&state=xxx
```

### Gestion des Emails

```bash
# Liste des emails
GET /api/email?clientId=xxx&isRead=false&search=contrat&limit=50

# Synchroniser manuellement
POST /api/email/sync

# Statut de synchronisation
GET /api/email/sync

# Marquer comme lu
PATCH /api/email/[id]
Body: { "isRead": true }

# Lier à un client
PATCH /api/email/[id]
Body: { "clientId": "xxx" }

# Déconnecter
DELETE /api/email
```

---

## 📚 Documentation Complète

- **`docs/EMAIL_SYNC_SETUP.md`** - Configuration OAuth détaillée
- **`EMAIL_SYNC_IMPLEMENTATION.md`** - Documentation technique complète
- **`FEATURE_COMPLETE_EMAIL_SYNC.md`** - Récapitulatif de l'implémentation

---

## ✨ Fonctionnalités

### 🤖 Automatique

- ✅ Synchronisation toutes les 5 minutes
- ✅ Classification automatique (CLIENT, PROSPECT, INTERNAL, IMPORTANT)
- ✅ Matching automatique avec les clients
- ✅ Rafraîchissement automatique des tokens OAuth

### 🔐 Sécurisé

- ✅ Tokens OAuth chiffrés
- ✅ Isolation multi-tenant (RLS)
- ✅ Permissions RBAC
- ✅ Authentification requise

### 📊 Complet

- ✅ Support Gmail et Outlook
- ✅ Filtres avancés
- ✅ Recherche full-text
- ✅ Liaison avec clients
- ✅ Direction (INBOUND/OUTBOUND)

---

## 🐛 Dépannage

### Erreur "Invalid Grant"

**Solution** : Déconnecter et reconnecter le compte email

### Emails Non Synchronisés

**Vérifications** :
1. Vérifier les variables d'environnement
2. Vérifier les credentials OAuth
3. Déclencher une sync manuelle : `POST /api/email/sync`
4. Consulter `lastSyncStatus` dans la base de données

### Erreur OAuth

**Vérifications** :
1. Vérifier que les redirect URIs sont corrects
2. Vérifier que les APIs sont activées (Gmail API, Microsoft Graph)
3. Vérifier que les scopes sont corrects

---

## 📞 Support

Pour toute question :
1. Consulter `docs/EMAIL_SYNC_SETUP.md`
2. Consulter `EMAIL_SYNC_IMPLEMENTATION.md`
3. Vérifier les logs serveur
4. Vérifier `lastSyncStatus` dans `email_integrations`

---

## 🎉 C'est Tout !

La synchronisation email est prête à l'emploi. Il suffit de :
1. Configurer OAuth (une fois)
2. Démarrer l'application
3. Connecter un compte email (2 clics)
4. ✅ **Profiter !**

---

**Version** : 1.0.0  
**Date** : 13 novembre 2024  
**Statut** : ✅ Production Ready
