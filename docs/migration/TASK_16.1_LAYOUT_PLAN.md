# Task 16.1 - Migration Layout Dashboard Complet

## 🎯 Objectif

Migrer TOUT le layout du dashboard CRM vers alfi-crm pour avoir une expérience complète identique au CRM original, avec adaptation Prisma.

## 📋 Composants à Créer/Migrer

### 1. Navigation Sidebar Complète
**Fichier**: `alfi-crm/components/dashboard/NavigationSidebar.tsx` (à remplacer)

**Fonctionnalités**:
- ✅ Toutes les sections (Pilotage, Portefeuille, Commercial, Organisation, Outils, Conformité)
- ✅ Sub-items expandables avec animation
- ✅ Badges avec compteurs temps réel
- ✅ Hover expand/collapse (w-20 → w-72)
- ✅ Footer avec Settings et User profile
- ✅ Couleurs par section (blue, cyan, emerald, violet, amber, red)
- ✅ Tooltips sur hover collapsed
- ✅ Active item detection
- ✅ Auto-expand sur navigation

**Adaptation Prisma**:
- Compteurs depuis `/api/dashboard/counters`
- User info depuis session NextAuth

### 2. Top Bar Complète
**Fichier**: `alfi-crm/components/dashboard/DashboardHeader.tsx` (à remplacer)

**Fonctionnalités**:
- ✅ GlobalSearch component
- ✅ Command Palette button (Ctrl+K)
- ✅ Notifications button avec badge
- ✅ Quick Actions button (Ctrl+N)
- ✅ Mode Présentation toggle (Ctrl+H)
- ✅ ThemeToggle
- ✅ Boutons rapides (Projets, Réclamations, RDV, Tâches) avec badges

**Composants à créer**:
- `GlobalSearch.tsx`
- `QuickActions.tsx` (modal)

**Composants existants à intégrer**:
- `CommandPalette.tsx` ✅ existe
- `NotificationCenter.tsx` ✅ existe

### 3. Services Sidebar
**Fichier**: `alfi-crm/components/dashboard/ServicesSidebar.tsx` (à améliorer)

**Fonctionnalités**:
- ✅ Stats contextuelles selon la page
- ✅ Actions contextuelles
- ✅ Expand/collapse (w-20 → w-[22rem])
- ✅ Badges de compteurs

### 4. Layout Principal
**Fichier**: `alfi-crm/app/dashboard/layout.tsx` (à remplacer complètement)

**Fonctionnalités**:
- ✅ QueryClientProvider pour React Query
- ✅ Raccourcis clavier (useHotkeys)
- ✅ Chargement compteurs temps réel (30s interval)
- ✅ Mode Présentation avec overlay
- ✅ Background effects (gradients)
- ✅ Responsive margins selon sidebars

### 5. Modals/Overlays

#### GlobalSearch
**Fichier**: `alfi-crm/components/dashboard/GlobalSearch.tsx`

**Fonctionnalités**:
- Recherche clients, documents, opportunités
- Raccourci Ctrl+K (ou bouton)
- Résultats groupés par type
- Navigation clavier
- API: `/api/search?q=...`

#### QuickActions
**Fichier**: `alfi-crm/components/dashboard/QuickActions.tsx`

**Fonctionnalités**:
- Modal avec actions rapides
- Raccourci Ctrl+N
- Actions: Nouveau client, RDV, Tâche, Document, etc.
- Navigation vers formulaires

#### Mode Présentation Overlay
**Dans layout.tsx**

**Fonctionnalités**:
- Overlay avec message "Mode Présentation Actif"
- Blur du contenu
- Toggle avec Ctrl+H
- Bouton fermeture

## 🔧 Adaptations Prisma

### API Routes Nécessaires

#### `/api/dashboard/counters` ✅ EXISTE
Retourne:
```typescript
{
  clients: { total, active, prospects },
  tasks: { total, overdue, today },
  appointments: { total, today, thisWeek },
  opportunities: { total, qualified },
  alerts: { total, kycExpiring, contractsRenewing },
  notifications: { unread }
}
```

#### `/api/search` (À CRÉER)
```typescript
GET /api/search?q=query
Response: {
  clients: Client[],
  documents: Document[],
  opportunities: Opportunite[]
}
```

### Hooks Nécessaires

#### `useDashboardCounters` ✅ EXISTE
Dans `hooks/use-api.ts`

#### `useSearch` (À CRÉER)
```typescript
export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: () => apiCall(`/api/search?q=${query}`),
    enabled: query.length > 2
  })
}
```

## 📦 Dépendances

### Packages à installer
```json
{
  "@tanstack/react-query": "^5.0.0",
  "react-hotkeys-hook": "^4.4.0",
  "framer-motion": "^10.16.0"
}
```

### Packages déjà présents
- next-auth ✅
- lucide-react ✅
- tailwindcss ✅

## 🎨 Structure des Sections Navigation

```typescript
const navigationSections = [
  {
    id: 'pilotage',
    title: 'Pilotage',
    color: 'blue',
    items: [
      { id: 'dashboard', name: 'Tableau de bord', href: '/dashboard', icon: Home },
      { id: 'mon-activite', name: 'Mon activité', href: '/dashboard/mon-activite', icon: Activity }
    ]
  },
  {
    id: 'portefeuille',
    title: 'Portefeuille',
    color: 'cyan',
    items: [
      { id: 'clients', name: 'Mes clients', href: '/dashboard/clients', icon: Users, badge: {...} },
      { id: 'prospects', name: 'Mes prospects', href: '/dashboard/prospects', icon: UserPlus },
      { id: 'dossiers', name: 'Mes dossiers', href: '/dashboard/dossiers', icon: FolderKanban, subItems: [...] }
    ]
  },
  // ... autres sections
]
```

## ✅ Checklist d'Implémentation

### Phase 1: Composants de Base
- [ ] Installer les dépendances manquantes
- [ ] Créer GlobalSearch component
- [ ] Créer QuickActions modal
- [ ] Créer useSearch hook
- [ ] Créer API route /api/search

### Phase 2: Navigation Sidebar
- [ ] Remplacer NavigationSidebar.tsx complètement
- [ ] Implémenter toutes les sections
- [ ] Ajouter les sub-items expandables
- [ ] Ajouter les badges avec compteurs
- [ ] Implémenter hover expand/collapse
- [ ] Ajouter le footer (Settings + User)
- [ ] Tester la navigation

### Phase 3: Top Bar
- [ ] Remplacer DashboardHeader.tsx complètement
- [ ] Intégrer GlobalSearch
- [ ] Intégrer CommandPalette button
- [ ] Intégrer NotificationCenter button
- [ ] Intégrer QuickActions button
- [ ] Ajouter Mode Présentation toggle
- [ ] Ajouter ThemeToggle
- [ ] Ajouter boutons rapides avec badges
- [ ] Tester tous les boutons

### Phase 4: Layout Principal
- [ ] Remplacer layout.tsx complètement
- [ ] Ajouter QueryClientProvider
- [ ] Implémenter raccourcis clavier (Ctrl+N, Ctrl+K, Ctrl+H)
- [ ] Ajouter chargement compteurs (30s interval)
- [ ] Implémenter Mode Présentation overlay
- [ ] Ajouter background effects
- [ ] Gérer les margins responsive
- [ ] Tester le layout complet

### Phase 5: Services Sidebar
- [ ] Améliorer ServicesSidebar.tsx
- [ ] Ajouter stats contextuelles
- [ ] Ajouter actions contextuelles
- [ ] Tester l'expand/collapse

### Phase 6: Tests et Validation
- [ ] Tester tous les raccourcis clavier
- [ ] Tester le responsive (mobile, tablet, desktop)
- [ ] Tester le Mode Présentation
- [ ] Tester la navigation entre pages
- [ ] Tester les compteurs temps réel
- [ ] Valider l'accessibilité
- [ ] Vérifier les performances

## 🚀 Ordre d'Exécution

1. **Dépendances** (5 min)
2. **API /api/search** (15 min)
3. **GlobalSearch component** (30 min)
4. **QuickActions modal** (20 min)
5. **Navigation Sidebar** (60 min)
6. **Top Bar** (45 min)
7. **Layout Principal** (45 min)
8. **Services Sidebar** (20 min)
9. **Tests** (30 min)

**Total estimé**: ~4h30

## 📝 Notes Importantes

- Garder le Bento Grid pour le dashboard page (déjà fait en tâche 16)
- Tout doit fonctionner avec Prisma
- Respecter le design system existant
- Maintenir l'accessibilité
- Documenter les changements

## 🔗 Références

- CRM/app/dashboard/layout.js (source)
- alfi-crm/app/dashboard/layout.tsx (destination)
- alfi-crm/app/dashboard/page.tsx (déjà migré avec Bento Grid)
- alfi-crm/components/dashboard/* (composants existants)
