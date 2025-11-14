# Procédure de Backup - Migration CRM Frontend

## Backup Automatique Supabase

Supabase effectue des backups automatiques quotidiens:
- **Rétention**: 7 jours pour le plan gratuit, 30 jours pour les plans payants
- **Type**: Point-in-time recovery (PITR)
- **Accès**: Via le dashboard Supabase

## Backup Manuel Avant Migration

### 1. Backup de la Base de Données

#### Méthode 1: Via pg_dump (Recommandé)

```bash
# Créer le dossier de backup
mkdir -p alfi-crm/backups

# Backup complet avec structure et données
pg_dump "postgresql://postgres:nyTCP5vJEKKTUOb5@db.uhyzlcdbrbyaitlcavex.supabase.co:5432/postgres" \
  --format=custom \
  --file="alfi-crm/backups/backup-$(date +%Y%m%d-%H%M%S).dump"

# Backup en SQL plain text (plus lisible)
pg_dump "postgresql://postgres:nyTCP5vJEKKTUOb5@db.uhyzlcdbrbyaitlcavex.supabase.co:5432/postgres" \
  > "alfi-crm/backups/backup-$(date +%Y%m%d-%H%M%S).sql"
```

#### Méthode 2: Via Prisma

```bash
# Exporter le schéma actuel
npx prisma db pull --schema=./prisma/schema-backup.prisma

# Créer un snapshot des données (nécessite un script custom)
node scripts/export-data.js
```

### 2. Backup du Code Source

```bash
# Le commit Git sert de backup
git add -A
git commit -m "Before migration - safe point"

# Tag pour référence facile
git tag -a v-before-migration -m "État stable avant migration CRM"

# Pousser vers le remote (si configuré)
git push origin main --tags
```

### 3. Backup des Variables d'Environnement

```bash
# Copier le fichier .env
cp alfi-crm/.env alfi-crm/backups/.env.backup-$(date +%Y%m%d)

# Documenter la configuration
cat > alfi-crm/backups/config-backup-$(date +%Y%m%d).txt << EOF
Date: $(date)
Node Version: $(node --version)
NPM Version: $(npm --version)
Database: Supabase PostgreSQL
Project: uhyzlcdbrbyaitlcavex
EOF
```

## Vérification du Backup

### 1. Vérifier l'intégrité du backup SQL

```bash
# Compter les tables dans le backup
grep "CREATE TABLE" alfi-crm/backups/backup-*.sql | wc -l

# Vérifier la taille du fichier
ls -lh alfi-crm/backups/backup-*.sql
```

### 2. Test de restauration (sur une base de test)

```bash
# Créer une base de test locale
createdb test_restore

# Restaurer le backup
psql test_restore < alfi-crm/backups/backup-*.sql

# Vérifier les tables
psql test_restore -c "\dt"

# Nettoyer
dropdb test_restore
```

## Restauration d'un Backup

### Restauration Complète

```bash
# ATTENTION: Ceci écrase toutes les données actuelles!

# 1. Backup de sécurité de l'état actuel
pg_dump "postgresql://postgres:nyTCP5vJEKKTUOb5@db.uhyzlcdbrbyaitlcavex.supabase.co:5432/postgres" \
  > "alfi-crm/backups/backup-before-restore-$(date +%Y%m%d-%H%M%S).sql"

# 2. Restaurer le backup (format custom)
pg_restore --clean --if-exists \
  --dbname="postgresql://postgres:nyTCP5vJEKKTUOb5@db.uhyzlcdbrbyaitlcavex.supabase.co:5432/postgres" \
  alfi-crm/backups/backup-YYYYMMDD-HHMMSS.dump

# 3. Restaurer le backup (format SQL)
psql "postgresql://postgres:nyTCP5vJEKKTUOb5@db.uhyzlcdbrbyaitlcavex.supabase.co:5432/postgres" \
  < alfi-crm/backups/backup-YYYYMMDD-HHMMSS.sql
```

### Restauration Partielle (Tables Spécifiques)

```bash
# Restaurer uniquement certaines tables
pg_restore --table=Client --table=User \
  --dbname="postgresql://postgres:nyTCP5vJEKKTUOb5@db.uhyzlcdbrbyaitlcavex.supabase.co:5432/postgres" \
  alfi-crm/backups/backup-YYYYMMDD-HHMMSS.dump
```

## Checklist Avant Migration

- [ ] Backup de la base de données créé
- [ ] Backup vérifié (taille > 0, tables présentes)
- [ ] Commit Git "Before migration - safe point" créé
- [ ] Tag Git créé
- [ ] Variables d'environnement sauvegardées
- [ ] Documentation des points de restauration créée
- [ ] Test de restauration effectué (optionnel mais recommandé)
- [ ] Équipe informée du début de la migration

## Stockage des Backups

### Local
- **Emplacement**: `alfi-crm/backups/`
- **Rétention**: Garder les 3 derniers backups
- **Nommage**: `backup-YYYYMMDD-HHMMSS.sql`

### Remote (Recommandé pour Production)
- Supabase Dashboard (automatique)
- AWS S3 / Google Cloud Storage
- Service de backup dédié

## Automatisation (Optionnel)

Créer un script de backup automatique:

```bash
#!/bin/bash
# scripts/backup-database.sh

BACKUP_DIR="alfi-crm/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DATABASE_URL="postgresql://postgres:nyTCP5vJEKKTUOb5@db.uhyzlcdbrbyaitlcavex.supabase.co:5432/postgres"

mkdir -p $BACKUP_DIR

echo "🔄 Création du backup..."
pg_dump "$DATABASE_URL" > "$BACKUP_DIR/backup-$TIMESTAMP.sql"

if [ $? -eq 0 ]; then
  echo "✅ Backup créé: backup-$TIMESTAMP.sql"
  
  # Nettoyer les vieux backups (garder les 3 derniers)
  ls -t $BACKUP_DIR/backup-*.sql | tail -n +4 | xargs rm -f
  echo "🧹 Anciens backups nettoyés"
else
  echo "❌ Erreur lors de la création du backup"
  exit 1
fi
```

Rendre le script exécutable:
```bash
chmod +x scripts/backup-database.sh
```

## Notes de Sécurité

⚠️ **IMPORTANT**:
- Ne jamais commiter les fichiers de backup dans Git (contiennent des données sensibles)
- Ajouter `backups/` au `.gitignore`
- Chiffrer les backups si stockés en remote
- Limiter l'accès aux credentials de la base de données
- Tester régulièrement la procédure de restauration

## Support

En cas de problème:
1. Vérifier les logs Supabase
2. Consulter la documentation pg_dump/pg_restore
3. Contacter le support Supabase si nécessaire
