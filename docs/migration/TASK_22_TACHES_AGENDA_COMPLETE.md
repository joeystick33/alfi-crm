# Task 22: Migration des Pages Tâches et Agenda - Terminée

## Résumé

Migration complète des pages de gestion des tâches et de l'agenda depuis le CRM MongoDB vers alfi-crm avec Prisma/PostgreSQL.

## Fichiers Créés

### API Routes

1. **`/app/api/advisor/tasks/route.ts`**
   - GET: Liste des tâches avec filtres (status, priority, type, clientId, overdue, dueToday)
   - POST: Création d'une nouvelle tâche
   - Authentification via `requireAuth`
   - Validation avec Zod
   - Support des statistiques (byStatus, byPriority, overdue)

2. **`/app/api/advisor/tasks/[id]/route.ts`**
   - GET: Récupération d'une tâche spécifique
   - PUT: Mise à jour complète d'une tâche
   - PATCH: Mise à jour partielle (optimistic updates)
   - DELETE: Suppression soft (status = CANCELLED)
   - Gestion automatique de `completedAt` lors du changement de statut

3. **`/app/api/advisor/appointments/route.ts`**
   - GET: Liste des rendez-vous avec filtres de date (day, week, month)
   - POST: Création avec détection de conflits
   - Support des vues calendrier (jour, semaine, mois)
   - Validation des dates (pas dans le passé, fin après début)

4. **`/app/api/advisor/appointments/[id]/route.ts`**
   - GET: Récupération d'un rendez-vous spécifique
   - PUT: Mise à jour avec vérification de conflits
   - DELETE: Annulation (status = CANCELLED, cancelledAt)

### Pages Frontend

5. **`/app/dashboard/taches/page.tsx`**
   - Liste des tâches avec DataTable
   - Checkbox pour marquer comme terminée
   - Badges de priorité et statut
   - Indicateur de tâches en retard
   - Compteur de tâches actives
   - Bouton "Nouvelle Tâche" (TODO: modal)

6. **`/app/dashboard/agenda/page.tsx`**
   - Vue hebdomadaire des rendez-vous
   - Groupement par date
   - Badges de statut et type
   - Affichage des informations client
   - Support visioconférence et lieu physique
   - Bouton "Nouveau RDV" (TODO: modal)

## Adaptations MongoDB → Prisma

### Modèle Tache
```typescript
// MongoDB: Task
_id → id (cuid)
assignedTo → assignedToId (relation User)
relatedParticulierId → clientId (relation Client)
status: A_FAIRE/EN_COURS/TERMINEE/ANNULEE → TODO/IN_PROGRESS/COMPLETED/CANCELLED
priority: BASSE/NORMALE/HAUTE/URGENTE → LOW/MEDIUM/HIGH/URGENT
```

### Modèle RendezVous
```typescript
// MongoDB: RendezVous
_id → id (cuid)
conseillerId → conseillerId (relation User)
particulierId → clientId (relation Client)
dateDebut → startDate
dateFin → endDate
statut → status
```

## Fonctionnalités Implémentées

### Tâches
- ✅ Liste avec filtres multiples
- ✅ Tri par date, priorité, statut
- ✅ Toggle rapide du statut (checkbox)
- ✅ Indicateur de retard
- ✅ Statistiques (total, par statut, par priorité)
- ✅ Soft delete (annulation)
- ✅ Gestion automatique de `completedAt`

### Agenda
- ✅ Vues calendrier (jour, semaine, mois)
- ✅ Détection de conflits
- ✅ Validation des dates
- ✅ Groupement par date
- ✅ Support visioconférence
- ✅ Affichage des informations client
- ✅ Badges de statut et type

## Patterns Utilisés

### Authentification
```typescript
const context = await requireAuth(request);
if (!isRegularUser(context.user)) {
  return createErrorResponse('Invalid user type', 400);
}
```

### Validation Zod
```typescript
const taskQuerySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50),
  status: z.string().optional(),
  // ...
});
```

### Réponses API
```typescript
return createSuccessResponse({ tasks, stats, count });
return createErrorResponse('Tâche non trouvée', 404);
```

## Tests Requis

### API
- [ ] GET /api/advisor/tasks (avec différents filtres)
- [ ] POST /api/advisor/tasks (création valide)
- [ ] PATCH /api/advisor/tasks/[id] (toggle status)
- [ ] GET /api/advisor/appointments?view=week
- [ ] POST /api/advisor/appointments (avec conflit)
- [ ] DELETE /api/advisor/appointments/[id]

### Frontend
- [ ] Affichage de la liste des tâches
- [ ] Toggle checkbox pour marquer terminée
- [ ] Affichage des rendez-vous groupés par date
- [ ] Indicateurs de retard
- [ ] Badges de statut et priorité

## Améliorations Futures

### Tâches
- [ ] Modal de création/édition de tâche
- [ ] Filtres avancés (par client, par projet)
- [ ] Vue Kanban
- [ ] Assignation à d'autres utilisateurs
- [ ] Récurrence des tâches
- [ ] Checklist dans les tâches

### Agenda
- [ ] Modal de création/édition de RDV
- [ ] Vue calendrier complète (FullCalendar)
- [ ] Drag & drop pour déplacer les RDV
- [ ] Synchronisation avec calendriers externes
- [ ] Rappels automatiques
- [ ] Génération de lien visio automatique
- [ ] Compte-rendu de réunion

## Dépendances

- `@/lib/auth-helpers` - Authentification
- `@/lib/prisma` - Client Prisma
- `@/lib/api-client` - Client API frontend
- `@/components/ui/*` - Composants UI
- `zod` - Validation des schémas

## Notes Techniques

1. **Soft Delete**: Les tâches et rendez-vous ne sont jamais supprimés, seulement annulés
2. **Optimistic Updates**: PATCH pour les mises à jour rapides (toggle status)
3. **Détection de Conflits**: Vérification automatique des chevauchements de RDV
4. **Validation Stricte**: Dates, statuts, types validés avec Zod
5. **Isolation Multi-tenant**: Filtrage automatique par cabinetId

## Statut: ✅ TERMINÉ

Date: 2024-11-15
Durée: ~1h
Fichiers créés: 6
Lignes de code: ~1500
