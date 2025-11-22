# Scripts de génération de données

## Créer des opportunités de test

### Méthode recommandée : Via l'API

1. **Récupérer votre session token** :
   - Ouvrez http://localhost:3000 dans votre navigateur
   - Connectez-vous si nécessaire
   - Ouvrez DevTools (F12 ou Cmd+Option+I sur Mac)
   - Allez dans **Application** > **Cookies** > **localhost**
   - Copiez la valeur du cookie `next-auth.session-token`

2. **Créer le fichier de token** :
   ```bash
   echo "VOTRE_TOKEN_ICI" > .session-token
   ```

3. **Exécuter le script** :
   ```bash
   npx tsx scripts/seed-via-api.ts
   ```

Le script va :
- Récupérer vos clients existants
- Créer 3 opportunités par client
- Afficher un résumé des créations

### Méthode alternative : Script shell

```bash
./scripts/create-sample-opportunities.sh
```

Le script vous demandera votre session token interactivement.

### Méthode SQL : Génération de requêtes

Si vous préférez exécuter du SQL directement dans Supabase :

```bash
npx tsx scripts/generate-opportunities-sql.ts > opportunities.sql
```

Puis :
1. Ouvrez le fichier `opportunities.sql`
2. Remplacez les placeholders par vos IDs réels
3. Exécutez le SQL dans l'éditeur SQL de Supabase

## Dépannage

### "Can't reach database server"

Le script Prisma direct ne fonctionne pas à cause de la configuration multi-tenant avec RLS. Utilisez plutôt la méthode via l'API.

### "Unauthorized" ou erreur 401

Votre session token a expiré. Récupérez-en un nouveau depuis le navigateur.

### "No clients found"

Créez d'abord des clients dans l'application avant de générer des opportunités.

## Sécurité

⚠️ Le fichier `.session-token` est dans `.gitignore` pour éviter de commiter votre token.
