# Guide de Test des Styles Migrés

## Tests Visuels Rapides

### 1. Test des Classes Premium

Ajouter ce code dans n'importe quelle page pour tester :

```tsx
// Test Glass Effects
<div className="glass-card p-6 m-4">
  <h3>Glass Card Effect</h3>
  <p>Ceci est un effet de verre avec backdrop blur</p>
</div>

// Test Hover Effects
<div className="hover-lift card-premium p-6 m-4">
  <h3>Hover Lift Effect</h3>
  <p>Survolez pour voir l'effet de levée</p>
</div>

// Test Gradients
<div className="gradient-premium p-6 m-4 rounded-lg">
  <h3 className="text-white">Gradient Premium</h3>
</div>

// Test Stats Card
<div className="stat-card">
  <div className="stat-value">€1,234,567</div>
  <div className="stat-label">Total Assets</div>
  <div className="stat-change stat-change-positive">+12.5%</div>
</div>
```

### 2. Test Responsive Mobile

```tsx
// Test Mobile Layout
<div className="mobile-single-column">
  <div className="mobile-card">Card 1</div>
  <div className="mobile-card">Card 2</div>
  <div className="mobile-card">Card 3</div>
</div>

// Test Safe Areas
<div className="safe-area-inset-top safe-area-inset-bottom">
  <p>Contenu avec safe areas</p>
</div>

// Test Mobile Modal
<div className="mobile-modal">
  <h2>Modal Mobile</h2>
  <p>Full screen sur mobile</p>
</div>
```

### 3. Test Accessibilité

```tsx
// Test Focus Visible
<button className="focus-visible btn-primary">
  Bouton avec focus visible
</button>

// Test Screen Reader Only
<span className="sr-only">
  Texte pour lecteurs d'écran uniquement
</span>

// Test Skip Link
<a href="#main-content" className="skip-link">
  Aller au contenu principal
</a>

// Test ARIA
<div role="alert" className="alert alert-info">
  <p>Ceci est une alerte informative</p>
</div>
```

### 4. Test WCAG Colors

```tsx
// Test Alert Severity
<div className="alert-urgent p-4 m-2 rounded">Urgent Alert</div>
<div className="alert-high p-4 m-2 rounded">High Priority</div>
<div className="alert-medium p-4 m-2 rounded">Medium Priority</div>
<div className="alert-low p-4 m-2 rounded">Low Priority</div>

// Test Status
<span className="status-success p-2 rounded">Success</span>
<span className="status-warning p-2 rounded">Warning</span>
<span className="status-error p-2 rounded">Error</span>
<span className="status-info p-2 rounded">Info</span>

// Test Priority
<div className="priority-urgent p-4 m-2 rounded border">Urgent</div>
<div className="priority-high p-4 m-2 rounded border">High</div>
<div className="priority-normal p-4 m-2 rounded border">Normal</div>
<div className="priority-low p-4 m-2 rounded border">Low</div>
```

### 5. Test Premium Components

```tsx
// Test Premium Panel
<div className="panel-premium">
  <div className="panel-premium-header">
    <h3 className="panel-premium-title">Panel Title</h3>
    <p className="panel-premium-description">Panel description</p>
  </div>
  <div>Panel content</div>
</div>

// Test Premium Table
<table className="table-premium">
  <thead>
    <tr>
      <th>Name</th>
      <th>Value</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Item 1</td>
      <td>€1,000</td>
      <td><span className="badge-success">Active</span></td>
    </tr>
  </tbody>
</table>

// Test Premium Form
<div className="form-group">
  <label className="form-label">Label</label>
  <input type="text" className="form-input" placeholder="Enter text" />
  <p className="form-helper">Helper text</p>
</div>
```

## Tests de Navigation au Clavier

### Checklist

1. **Tab Navigation**
   - [ ] Tab traverse tous les éléments interactifs
   - [ ] L'ordre de tabulation est logique
   - [ ] Le focus est visible sur tous les éléments

2. **Skip Links**
   - [ ] Skip link apparaît au focus
   - [ ] Skip link fonctionne correctement

3. **ARIA Support**
   - [ ] Les rôles ARIA sont corrects
   - [ ] Les états ARIA sont mis à jour
   - [ ] Les labels ARIA sont présents

4. **Keyboard Shortcuts**
   - [ ] Les raccourcis clavier fonctionnent
   - [ ] Les hints de clavier s'affichent

## Tests Responsive

### Breakpoints à Tester

1. **Mobile (< 768px)**
   - [ ] Layout en colonne unique
   - [ ] Touch targets minimum 44x44px
   - [ ] Typography lisible
   - [ ] Modals en plein écran
   - [ ] Navigation mobile visible

2. **Tablet (768px - 1023px)**
   - [ ] Layout en 2 colonnes
   - [ ] Touch targets appropriés
   - [ ] Navigation adaptée

3. **Desktop (> 1024px)**
   - [ ] Layout complet
   - [ ] Hover effects fonctionnels
   - [ ] Sidebars visibles

## Tests de Contraste (WCAG)

### Outils Recommandés

1. **Chrome DevTools**
   - Lighthouse Accessibility Audit
   - Color Contrast Checker

2. **Extensions**
   - WAVE (Web Accessibility Evaluation Tool)
   - axe DevTools
   - Colour Contrast Analyser

3. **Tests Manuels**
   - [ ] Texte sur fond clair : ratio ≥ 4.5:1
   - [ ] Texte sur fond foncé : ratio ≥ 4.5:1
   - [ ] Large text : ratio ≥ 3:1
   - [ ] Éléments UI : ratio ≥ 3:1

## Tests Dark Mode

### Checklist

1. **Couleurs**
   - [ ] Toutes les couleurs sont lisibles
   - [ ] Contraste suffisant
   - [ ] Pas de couleurs trop vives

2. **Composants**
   - [ ] Cards visibles
   - [ ] Borders visibles
   - [ ] Shadows appropriées

3. **Transitions**
   - [ ] Transition smooth entre modes
   - [ ] Pas de flash

## Tests Touch Interactions

### Sur Mobile/Tablet

1. **Touch Targets**
   - [ ] Tous les boutons ≥ 44x44px
   - [ ] Espacement suffisant entre éléments
   - [ ] Pas de double-tap zoom

2. **Gestures**
   - [ ] Swipe horizontal fonctionne
   - [ ] Swipe vertical fonctionne
   - [ ] Pull to refresh (si implémenté)

3. **Scrolling**
   - [ ] Momentum scrolling iOS
   - [ ] Scroll snap fonctionne
   - [ ] Pas de scroll horizontal non désiré

## Tests de Performance

### Checklist

1. **Animations**
   - [ ] GPU acceleration active
   - [ ] Pas de jank
   - [ ] Smooth 60fps

2. **Reduced Motion**
   - [ ] Animations désactivées si préférence
   - [ ] Transitions instantanées

3. **Loading**
   - [ ] CSS chargé rapidement
   - [ ] Pas de FOUC (Flash of Unstyled Content)

## Commandes de Test

### Test Build
```bash
npm run build
```

### Test Dev
```bash
npm run dev
```

### Test Lighthouse
```bash
# Dans Chrome DevTools
1. Ouvrir DevTools (F12)
2. Aller dans l'onglet Lighthouse
3. Sélectionner "Accessibility"
4. Cliquer "Generate report"
```

## Résultats Attendus

### Lighthouse Scores
- **Accessibility**: ≥ 95/100
- **Best Practices**: ≥ 90/100
- **Performance**: ≥ 85/100

### WCAG Compliance
- **Level AA**: 100% conforme
- **Color Contrast**: Tous les ratios ≥ 4.5:1
- **Keyboard Navigation**: Toutes les fonctionnalités accessibles

### Responsive
- **Mobile**: Layout adapté, touch targets OK
- **Tablet**: Layout optimisé
- **Desktop**: Expérience complète

## Bugs Connus à Vérifier

1. **Safari iOS**
   - [ ] Safe areas fonctionnent
   - [ ] Backdrop blur fonctionne
   - [ ] Momentum scrolling OK

2. **Firefox**
   - [ ] Backdrop filter (peut nécessiter fallback)
   - [ ] Grid layout OK

3. **Edge**
   - [ ] Tous les styles appliqués
   - [ ] Pas de problèmes de compatibilité

## Rapport de Test

Après les tests, documenter :

1. **Fonctionnalités testées** : ✅ / ❌
2. **Bugs trouvés** : Description et sévérité
3. **Améliorations suggérées** : Liste
4. **Score Lighthouse** : Chiffres
5. **Compatibilité navigateurs** : Matrice

## Contact

Pour toute question sur les tests de styles :
- Voir `TASK_29_STYLES_MIGRATION_COMPLETE.md`
- Consulter les fichiers CSS dans `alfi-crm/styles/`
