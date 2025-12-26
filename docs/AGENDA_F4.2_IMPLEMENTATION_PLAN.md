# F4.2 Agenda / Rendez-vous — Plan d'Implémentation Détaillé

**Date**: 23 novembre 2024  
**Statut**: 🚧 EN COURS  
**Phase du plan**: F4.2 (Consolider modules métier transverses)

---

## 📋 Checklist d'Exécution (Plan F4.2)

Selon `CRM_MARKET_READY_PLAN.md` lignes 1457-1467 :

- [ ] **Améliorer les vues calendrier (jour/semaine/mois) pour usage réel**
- [ ] **Gérer les récurrences si le produit le demande**
- [ ] **Tester les cas de conflit, replanification, annulation**

### Critère de Validation

> "Un conseiller peut gérer un agenda réel dans l'outil, sans bugs fonctionnels majeurs."

---

## 🔍 Analyse de l'Existant

### ✅ Déjà Implémenté

#### Backend
1. **Routes API complètes** :
   - `GET /api/advisor/appointments` : Liste avec filtres (view, date, clientId, status, type)
   - `GET /api/advisor/appointments/[id]` : Détails
   - `POST /api/advisor/appointments` : Création avec validation
   - `PUT /api/advisor/appointments/[id]` : Mise à jour
   - `DELETE /api/advisor/appointments/[id]` : Annulation (soft delete)

2. **RendezVousService** :
   - `createRendezVous()` : Avec détection conflits (lignes 113-140)
   - `getRendezVous()` : Filtres multiples
   - `getRendezVousById()` : Récupération unique
   - `updateRendezVous()` : Mise à jour
   - `cancelRendezVous()` : Annulation
   - Création automatique TimelineEvent pour traçabilité

3. **Détection de Conflits** :
   - Vérification overlapping des créneaux (OR clauses Prisma)
   - Status pris en compte (`SCHEDULED`, `CONFIRMED`)
   - Erreur `409 Conflict` retournée

4. **Validation Zod** :
   - `appointmentQuerySchema` : Params GET
   - `createAppointmentSchema` : POST body
   - `updateAppointmentSchema` : PUT body
   - Vérifications: date passée, endDate > startDate

#### Frontend
1. **Vues Calendrier** :
   - Toggle day/week/month (`viewMode` state)
   - Composant `CalendarCentralWidget` avec `controlledView`
   - Navigation dates (ChevronLeft/Right)

2. **UI Complète** :
   - Création rendez-vous (drawer/dialog)
   - Édition rendez-vous
   - Filtres (status, type, search)
   - Stats overview
   - Today widget

### ❌ Manquant (À Implémenter)

#### 1. Récurrences (Priorité HAUTE)
**Problème** : Le modèle `RendezVous` ne supporte pas les récurrences.

**Requis** :
- Champs Prisma :
  - `isRecurring` : boolean
  - `recurrenceRule` : string (format iCal RRULE)
  - `recurrenceEndDate` : DateTime nullable
  - `recurrenceExceptions` : DateTime[] (dates exclues)
  - `parentRecurrenceId` : string nullable (lien vers rdv parent)
  - `recurrenceOccurrenceDate` : DateTime nullable (date de l'occurrence spécifique)

- Service methods :
  - `createRecurringRendezVous()` : Créer rendez-vous récurrent
  - `expandRecurrenceInstances()` : Générer occurrences dans plage de dates
  - `updateRecurrenceInstance()` : Modifier une occurrence
  - `deleteRecurrenceInstance()` : Supprimer occurrence (ajouter exception)
  - `updateRecurringSeries()` : Modifier toute la série

- Frontend :
  - UI pour définir récurrence (quotidien, hebdomadaire, mensuel, custom RRULE)
  - Choix lors édition : "Cette occurrence" vs "Toute la série"
  - Affichage badge récurrence sur événement

#### 2. Replanification (Priorité HAUTE)
**Problème** : Pas de méthode `rescheduleRendezVous` dédiée.

**Requis** :
- Service method : `rescheduleRendezVous(id, newStartDate, newEndDate)` :
  - Vérifier conflits sur nouveau créneau
  - Mettre à jour dates
  - Créer TimelineEvent "Rendez-vous replanifié"
  - Notifier participants si intégration email

- Frontend :
  - Drag & drop sur calendrier (déjà présent dans CalendarCentralWidget ?)
  - Dialog "Replanifier" avec sélection date/heure
  - Historique des replanifications

#### 3. Gestion Conflits Avancée (Priorité MOYENNE)
**Problème** : Détection basique mais pas de suggestions alternatives.

**Requis** :
- Service method : `findAvailableSlots(date, duration, conseillerId)` :
  - Retourner créneaux libres
  - Prendre en compte horaires de travail
  - Éviter conflits existants

- Frontend :
  - Lors conflit, afficher créneaux alternatifs
  - "Créneaux suggérés" dans UI création

#### 4. Tests d'Intégration (Priorité HAUTE)
**Problème** : Pas de tests systématiques pour agenda.

**Requis** :
- Suite tests `/api/advisor/appointments` :
  - Création avec conflits
  - Récurrences (création, expansion, exceptions)
  - Replanification avec conflits
  - Annulation (soft delete check)
  - Filtres par vue (day/week/month)
  - Edge cases (dates passées, durée négative, etc.)

#### 5. Amélioration Vues Calendrier (Priorité MOYENNE)
**Problème** : Fonctionnel mais améliorations possibles.

**Requis** :
- Vue jour :
  - Grille horaire 7h-22h
  - Affichage durée exacte
  - Multi-conseillers (colonne par conseiller)

- Vue semaine :
  - Optimisation affichage overlapping
  - Indicateur week-end
  - Total heures par jour

- Vue mois :
  - Compteur rendez-vous par jour
  - Preview au survol
  - Badge status (confirmé/en attente)

- Toutes vues :
  - Export PDF/ICS
  - Impression optimisée
  - Sync avec calendriers externes (Google/Outlook)

---

## 🎯 Stratégie d'Implémentation (Priorités)

### Phase 1 : Récurrences (Base Solide)
**Durée estimée** : 3-4h

1. ✅ Migration Prisma : Ajouter champs récurrence
2. ✅ Service : Méthodes CRUD récurrences
3. ✅ Routes API : Endpoints récurrences
4. ✅ Frontend : UI sélection récurrence
5. ✅ Tests : Récurrences complètes

### Phase 2 : Replanification & Conflits
**Durée estimée** : 2h

1. ✅ Service : `rescheduleRendezVous()` + `findAvailableSlots()`
2. ✅ Routes API : POST `/api/advisor/appointments/[id]/reschedule`
3. ✅ Frontend : Dialog replanification + créneaux suggérés
4. ✅ Tests : Replanification avec conflits

### Phase 3 : Amélioration Vues & Tests
**Durée estimée** : 2h

1. ✅ Optimisation vues calendrier (jour/semaine/mois)
2. ✅ Tests d'intégration complets
3. ✅ Documentation API
4. ✅ Validation production-ready

---

## 📐 Spécifications Techniques

### Format Récurrence RRULE (RFC 5545)

**Exemples** :
```
FREQ=DAILY;COUNT=10
→ Tous les jours, 10 occurrences

FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20241231T235959Z
→ Lundi, Mercredi, Vendredi jusqu'au 31/12/2024

FREQ=MONTHLY;BYMONTHDAY=15;COUNT=12
→ Le 15 de chaque mois, 12 fois

FREQ=YEARLY;BYMONTH=6;BYMONTHDAY=21
→ Chaque année le 21 juin (anniversaire, etc.)
```

**Librairie recommandée** : `rrule` (NPM) pour parsing et expansion.

### Gestion Exceptions

**Cas d'usage** :
1. Utilisateur supprime une occurrence : Ajouter date dans `recurrenceExceptions`
2. Utilisateur modifie une occurrence : Créer nouveau RendezVous avec `parentRecurrenceId` + `recurrenceOccurrenceDate`

**Règle métier** :
- Exception = date dans tableau
- Modification = nouveau record lié au parent

### Détection Conflits avec Récurrences

**Algorithme** :
1. Si création récurrence : Générer toutes occurrences dans plage (ex: 1 an)
2. Pour chaque occurrence, vérifier conflits existants
3. Si conflit détecté, lister dates conflictuelles dans erreur
4. Frontend affiche liste conflits, demande confirmation ou modification

---

## 🧪 Plan de Tests

### Tests Unitaires (Service)
```typescript
describe('RendezVousService - Récurrences', () => {
  test('créer rendez-vous récurrent quotidien', async () => {
    // FREQ=DAILY;COUNT=5
    // Vérifier 5 occurrences créées
  })

  test('créer rendez-vous récurrent hebdomadaire avec fin', async () => {
    // FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=...
    // Vérifier occurrences uniquement lundi/mercredi
  })

  test('ajouter exception à récurrence', async () => {
    // Supprimer occurrence du 15/12
    // Vérifier date dans recurrenceExceptions
  })

  test('modifier occurrence spécifique', async () => {
    // Modifier heure occurrence du 20/12
    // Vérifier nouveau record avec parentRecurrenceId
  })

  test('détection conflit avec récurrence', async () => {
    // Créer récurrence qui overlap rendez-vous existant
    // Attendre erreur avec liste conflits
  })
})
```

### Tests d'Intégration (API)
```typescript
describe('POST /api/advisor/appointments - Récurrences', () => {
  test('créer rendez-vous récurrent valide', async () => {
    const body = {
      title: 'Réunion hebdo',
      startDate: '2024-12-01T10:00:00Z',
      endDate: '2024-12-01T11:00:00Z',
      isRecurring: true,
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=FR;COUNT=10'
    }
    const res = await POST('/api/advisor/appointments', body)
    expect(res.status).toBe(201)
    expect(res.data.appointment.isRecurring).toBe(true)
  })

  test('rejeter récurrence avec conflits', async () => {
    // Créer RDV existant vendredi 10h
    // Tenter créer récurrence FREQ=WEEKLY;BYDAY=FR
    const res = await POST('/api/advisor/appointments', body)
    expect(res.status).toBe(409)
    expect(res.error).toContain('Conflit')
  })
})

describe('POST /api/advisor/appointments/[id]/reschedule', () => {
  test('replanifier avec succès', async () => {
    const res = await POST(`/api/advisor/appointments/${id}/reschedule`, {
      newStartDate: '2024-12-10T14:00:00Z',
      newEndDate: '2024-12-10T15:00:00Z'
    })
    expect(res.status).toBe(200)
  })

  test('rejeter replanification avec conflit', async () => {
    // Replanifier sur créneau déjà pris
    const res = await POST(`/api/advisor/appointments/${id}/reschedule`, {...})
    expect(res.status).toBe(409)
  })
})
```

### Tests E2E (Frontend)
```typescript
describe('Agenda - Récurrences', () => {
  test('créer rendez-vous récurrent depuis UI', async () => {
    // 1. Ouvrir dialog création
    // 2. Remplir formulaire
    // 3. Cocher "Répéter"
    // 4. Sélectionner "Hebdomadaire - Lundi, Mercredi"
    // 5. Définir fin après 10 occurrences
    // 6. Soumettre
    // 7. Vérifier 10 occurrences affichées sur calendrier
  })

  test('modifier une occurrence spécifique', async () => {
    // 1. Cliquer sur occurrence
    // 2. Cliquer "Modifier"
    // 3. Choisir "Cette occurrence seulement"
    // 4. Changer heure
    // 5. Vérifier occurrence modifiée, autres inchangées
  })

  test('drag & drop replanification', async () => {
    // 1. Drag rendez-vous vers nouveau créneau
    // 2. Vérifier dialog confirmation
    // 3. Confirmer
    // 4. Vérifier rendez-vous déplacé
  })
})
```

---

## 📊 Schéma de Données (Proposition)

### Extension Model RendezVous

```prisma
model RendezVous {
  // ... champs existants ...
  
  // Récurrence
  isRecurring             Boolean   @default(false)
  recurrenceRule          String?   // Format RRULE iCal
  recurrenceEndDate       DateTime? // Fin de la récurrence
  recurrenceExceptions    DateTime[] // Dates exclues (occurrences supprimées)
  
  // Lien avec série récurrente
  parentRecurrenceId      String?   // ID du rendez-vous parent (si occurrence modifiée)
  parentRecurrence        RendezVous? @relation("RecurrenceSeries", fields: [parentRecurrenceId], references: [id], onDelete: Cascade)
  recurrenceInstances     RendezVous[] @relation("RecurrenceSeries")
  recurrenceOccurrenceDate DateTime? // Date de cette occurrence spécifique
  
  // Historique replanification
  originalStartDate       DateTime? // Date initiale (pour tracking)
  rescheduledAt           DateTime? // Timestamp dernière replanification
  rescheduledCount        Int       @default(0)
  
  @@index([parentRecurrenceId])
  @@index([recurrenceOccurrenceDate])
}
```

### Nouvelles Tables (Optionnel)

```prisma
// Pour tracking avancé des modifications
model RendezVousHistory {
  id              String   @id @default(cuid())
  rendezVousId    String
  rendezVous      RendezVous @relation(fields: [rendezVousId], references: [id], onDelete: Cascade)
  action          String   // 'CREATED', 'UPDATED', 'RESCHEDULED', 'CANCELLED'
  changedBy       String
  user            User     @relation(fields: [changedBy], references: [id])
  changes         Json     // Détails des modifications
  timestamp       DateTime @default(now())
  
  @@index([rendezVousId])
  @@map("rendez_vous_history")
}
```

---

## 🚀 Étapes d'Implémentation (Détaillées)

### Étape 1.1 : Migration Prisma
```bash
# Créer migration
npx prisma migrate dev --name add_recurrence_to_rendezvous

# Générer client Prisma
npx prisma generate
```

### Étape 1.2 : Service - Méthodes Récurrences
**Fichier** : `/app/_common/lib/services/rendez-vous-service.ts`

**Méthodes à ajouter** :
1. `createRecurringRendezVous(data, recurrenceRule, endDate)`
2. `expandRecurrenceInstances(rrule, startDate, endDate, duration)`
3. `addRecurrenceException(parentId, exceptionDate)`
4. `updateRecurrenceInstance(instanceId, data, applyToSeries)`
5. `deleteRecurrenceSeries(parentId)`

### Étape 1.3 : Routes API Récurrences
**Nouveaux endpoints** :
- `GET /api/advisor/appointments/recurring/expand` : Expand récurrence pour UI
- `POST /api/advisor/appointments/recurring` : Créer série
- `DELETE /api/advisor/appointments/recurring/[id]/exception` : Ajouter exception

### Étape 1.4 : Frontend UI Récurrence
**Composants à modifier** :
- `app/(advisor)/(frontend)/dashboard/agenda/page.tsx` :
  - Ajouter champs récurrence dans formulaire création
  - Dialog "Modifier récurrence" avec choix occurrence/série

**Nouveau composant** :
- `components/agenda/RecurrenceSelector.tsx` :
  - Radio buttons : Non répété / Quotidien / Hebdomadaire / Mensuel / Annuel / Custom
  - Si hebdo : Checkboxes jours (L,M,M,J,V,S,D)
  - Si mensuel : Select jour du mois ou énième jour (ex: 2e mardi)
  - Date fin ou nombre occurrences

### Étape 2.1 : Service - Replanification
```typescript
async rescheduleRendezVous(
  id: string, 
  newStartDate: Date, 
  newEndDate: Date, 
  notifyParticipants: boolean = true
) {
  // 1. Récupérer rendez-vous existant
  // 2. Vérifier conflits nouveau créneau
  // 3. Mettre à jour dates + rescheduledCount++ + rescheduledAt
  // 4. Créer TimelineEvent replanification
  // 5. Envoyer notifications si enabled
}

async findAvailableSlots(
  date: Date, 
  duration: number, 
  conseillerId: string,
  excludeId?: string
) {
  // 1. Récupérer rendez-vous conseiller sur date
  // 2. Définir plage horaire (8h-19h par défaut)
  // 3. Identifier trous libres >= duration
  // 4. Retourner array de créneaux [{start, end}]
}
```

### Étape 2.2 : Route Replanification
**Fichier** : `/app/(advisor)/(backend)/api/advisor/appointments/[id]/reschedule/route.ts`

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { newStartDate, newEndDate, notifyParticipants } = await request.json()
  // Validation
  // Appel service.rescheduleRendezVous()
  // Retour success
}
```

### Étape 3.1 : Optimisation Vues Calendrier
**Améliorations** :
- Vue jour : Affichage grille horaire 30min précision
- Vue semaine : Gestion overlapping events (décalage horizontal)
- Vue mois : Badge compteur + popover preview

### Étape 3.2 : Tests Complets
**Fichier** : `/tests/integration/api/advisor/appointments.test.ts`
- 50+ tests couvrant tous scénarios

---

## 🎯 Métriques de Succès

### Fonctionnelles
- ✅ Création rendez-vous récurrent avec RRULE standard
- ✅ Modification occurrence spécifique sans affecter série
- ✅ Suppression occurrence (exception) fonctionnelle
- ✅ Replanification détecte conflits et suggère alternatives
- ✅ Vues calendrier affichent correctement récurrences

### Techniques
- ✅ 95%+ couverture tests pour module agenda
- ✅ Temps réponse API < 200ms pour expansion récurrence
- ✅ Aucune erreur console frontend
- ✅ Migration Prisma sans perte de données

### UX
- ✅ Interface récurrence intuitive (< 3 clics)
- ✅ Feedback visuel immédiat lors drag & drop
- ✅ Messages d'erreur clairs et actionnables

---

## 📅 Roadmap

| Phase | Tâches | Durée | Statut |
|-------|--------|-------|--------|
| **Phase 1.1** | Migration Prisma récurrences | 30min | ⏳ À faire |
| **Phase 1.2** | Service méthodes récurrences | 2h | ⏳ À faire |
| **Phase 1.3** | Routes API récurrences | 1h | ⏳ À faire |
| **Phase 1.4** | Frontend UI récurrence | 1.5h | ⏳ À faire |
| **Phase 2.1** | Service replanification + conflits | 1h | ⏳ À faire |
| **Phase 2.2** | Route API reschedule | 30min | ⏳ À faire |
| **Phase 2.3** | Frontend replanification | 1h | ⏳ À faire |
| **Phase 3.1** | Optimisation vues | 1h | ⏳ À faire |
| **Phase 3.2** | Tests intégration complets | 2h | ⏳ À faire |
| **Phase 3.3** | Documentation & validation | 30min | ⏳ À faire |

**Total estimé** : ~11 heures  
**Livraison cible** : Production-ready

---

**Prochaine Action** : Démarrer Phase 1.1 - Migration Prisma pour récurrences
