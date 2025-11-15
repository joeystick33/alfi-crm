# Guide de Migration CRM → alfi-crm

## Vue d'ensemble

Ce document guide la migration complète du CRM MongoDB vers alfi-crm avec Prisma/Supabase.

## Objectifs de la Migration

- Migrer de MongoDB vers PostgreSQL (Supabase)
- Adopter Prisma comme ORM
- Implémenter le design system Bento Grid
- Moderniser l'architecture frontend
- Améliorer les performances et la scalabilité

## Prérequis

### Environnement
- Node.js 18+
- PostgreSQL (Supabase)
- Git

### Connaissances requises
- Next.js 14+
- TypeScript
- Prisma
- React Query
- Tailwind CSS

## Structure de la Migration

La migration est divisée en 11 phases:

1. **Phase 1**: Préparation et Audit
2. **Phase 2**: Création du Design System Bento Grid
3. **Phase 3**: Migration des Utilitaires et Services
4. **Phase 4**: Migration des Composants UI de Base
5. **Phase 5**: Migration des API Routes
6. **Phase 6**: Migration des Calculateurs et Simulateurs
7. **Phase 7**: Migration des Pages Dashboard
8. **Phase 8**: Migration des Fonctionnalités Avancées
9. **Phase 9**: Migration des Styles et Configuration
10. **Phase 10**: Migration des Interfaces SuperAdmin et Client
11. **Phase 11**: Tests et Validation

## Processus de Migration

### Étape 1: Backup et Sécurité

```bash
# Créer une branche de migration
git checkout -b migration-crm-frontend

# Backup de la base de données
npm run backup:db

# Commit initial
git add .
git commit -m "Before migration - safe point"
```

### Étape 2: Analyse de la Structure

Voir [COMPONENT_MAPPING.md](./COMPONENT_MAPPING.md) pour le mapping des composants.

### Étape 3: Migration des Modèles

Voir [API_CHANGES.md](./API_CHANGES.md) pour les changements d'API.

### Étape 4: Migration des Composants

1. Copier les composants du CRM source
2. Adapter les imports
3. Convertir en TypeScript si nécessaire
4. Adapter les appels API pour Prisma
5. Tester les composants

### Étape 5: Migration des Pages

1. Copier les pages du CRM source
2. Adapter les imports
3. Convertir en TypeScript
4. Adapter les appels API
5. Appliquer le design system Bento Grid
6. Tester les pages

### Étape 6: Migration des API Routes

1. Copier les routes API
2. Remplacer connectDB() par Prisma client
3. Convertir les queries MongoDB en Prisma
4. Ajouter la validation Zod
5. Tester les endpoints

## Points d'Attention

### Changements de Structure

- **ObjectId → cuid**: Tous les IDs MongoDB sont remplacés par des cuid
- **Embedded documents**: Convertis en relations ou champs Json
- **Populate → Include**: Les relations sont chargées avec `include`

### Changements d'API

Voir [API_CHANGES.md](./API_CHANGES.md) pour la liste complète.

### Breaking Changes

Voir [BREAKING_CHANGES.md](./BREAKING_CHANGES.md) pour les changements incompatibles.

## Validation

### Tests à Effectuer

- [ ] Toutes les pages se chargent sans erreur
- [ ] Les opérations CRUD fonctionnent
- [ ] Les calculateurs produisent les bons résultats
- [ ] Les exports fonctionnent
- [ ] L'authentification fonctionne
- [ ] Les permissions sont respectées
- [ ] Les performances sont acceptables

### Métriques de Performance

- Time to Interactive (TTI): < 3s
- First Contentful Paint (FCP): < 1.5s
- Cumulative Layout Shift (CLS): < 0.1

## Rollback

En cas de problème, voir [ROLLBACK_GUIDE.md](./ROLLBACK_GUIDE.md).

## Support

Pour toute question ou problème:
1. Consulter la documentation
2. Vérifier les logs d'erreur
3. Consulter l'équipe de développement

## Ressources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Bento Grid Design System](../design-system/BENTO_GRID.md)

## Changelog

### Version 1.0.0 - Initial Migration
- Migration complète de MongoDB vers Prisma
- Implémentation du design system Bento Grid
- Modernisation de l'architecture frontend
