# 🎨 FIN3 CRM – Design System

> **Documentation complète du système de design**  
> Version: 1.0.0  
> Dernière mise à jour: Novembre 2024  
> Thème: **Light Only** (Professionnel, solide, sans glassmorphism)

---

## 📋 Table des matières

1. [Principes de design](#principes-de-design)
2. [Palette de couleurs](#palette-de-couleurs)
3. [Typographie](#typographie)
4. [Espacements](#espacements)
5. [Composants](#composants)
6. [États interactifs](#états-interactifs)
7. [Ombres et élévations](#ombres-et-élévations)
8. [Animations](#animations)
9. [Accessibilité](#accessibilité)
10. [Utilisation](#utilisation)

---

## 🎯 Principes de design

Le CRM FIN3 suit des principes stricts pour garantir une expérience professionnelle et cohérente :

### Philosophie

- **Clarté avant tout** : Chaque interface doit être immédiatement compréhensible
- **Professionnalisme** : Design sobre, élégant, adapté à la gestion de patrimoine
- **Consistance** : Tous les écrans partagent les mêmes patterns visuels
- **Performance** : Pas d'effets superflus, pas de glassmorphism, pas de dark mode

### Règles strictes

✅ **AUTORISÉ**
- Thème clair solide uniquement
- Ombres subtiles pour la profondeur
- Animations fluides et rapides (< 300ms)
- Palette de couleurs définie

❌ **INTERDIT**
- Dark mode
- Glassmorphism / effets de transparence
- Dégradés complexes
- Animations lentes (> 500ms)
- Couleurs non référencées dans la palette

---

## 🎨 Palette de couleurs

Toutes les couleurs sont définies en HSL et accessibles via CSS custom properties.

### Couleurs de base

| Variable | HSL | HEX | Usage |
|----------|-----|-----|-------|
| `--background` | `0 0% 98%` | `#F9FAFB` | Fond principal de l'application |
| `--foreground` | `222 47% 11%` | `#0F172A` | Texte principal (titres, corps) |
| `--card` | `0 0% 100%` | `#FFFFFF` | Fond des cartes |
| `--card-foreground` | `222 47% 11%` | `#0F172A` | Texte sur les cartes |

### Couleurs de marque

| Variable | HSL | HEX | Usage |
|----------|-----|-----|-------|
| `--primary` | `199 89% 48%` | `#0EA5E9` | Boutons principaux, liens, éléments actifs |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | Texte sur fond primary |
| `--secondary` | `210 40% 96%` | `#F1F5F9` | Boutons secondaires, fonds alternatifs |
| `--secondary-foreground` | `222 47% 11%` | `#0F172A` | Texte sur fond secondary |

### Couleurs sémantiques

| Variable | HSL | HEX | Usage | Exemple |
|----------|-----|-----|-------|---------|
| `--destructive` | `0 84% 60%` | `#EF4444` | Erreurs, suppressions | Bouton "Supprimer" |
| `--success` | `142 76% 36%` | `#10B981` | Succès, validations | Badge "Validé" |
| `--warning` | `43 96% 56%` | `#F59E0B` | Avertissements, attention | Badge "En attente" |
| `--info` | `217 91% 60%` | `#3B82F6` | Informations | Badge "Information" |

### Couleurs d'interface

| Variable | HSL | HEX | Usage |
|----------|-----|-----|-------|
| `--muted` | `210 40% 96%` | `#F1F5F9` | Fonds désactivés, placeholders |
| `--muted-foreground` | `215 16% 47%` | `#64748B` | Texte secondaire, métadonnées |
| `--accent` | `210 40% 96%` | `#F1F5F9` | Survols, états intermédiaires |
| `--border` | `214 32% 91%` | `#E2E8F0` | Bordures de tous les éléments |
| `--input` | `214 32% 91%` | `#E2E8F0` | Bordures des champs de saisie |
| `--ring` | `199 89% 48%` | `#0EA5E9` | Contour de focus (accessibilité) |

### Couleurs de graphiques

| Variable | HSL | HEX | Nom | Usage |
|----------|-----|-----|-----|-------|
| `--chart-1` | `199 89% 48%` | `#0EA5E9` | Sky Blue | Série 1 |
| `--chart-2` | `142 76% 36%` | `#10B981` | Emerald | Série 2 |
| `--chart-3` | `262 83% 58%` | `#8B5CF6` | Violet | Série 3 |
| `--chart-4` | `346 77% 50%` | `#F43F5E` | Rose | Série 4 |
| `--chart-5` | `43 96% 56%` | `#F59E0B` | Amber | Série 5 |

### Utilisation

```tsx
// ✅ Correct - Utiliser les variables CSS
<div className="bg-primary text-primary-foreground">Bouton</div>

// ❌ Incorrect - Couleurs hard-codées
<div className="bg-blue-500 text-white">Bouton</div>
```

---

## ✍️ Typographie

### Famille de polices

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 
             'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

**Rationale** : Stack système pour garantir des performances optimales et un rendu natif sur chaque plateforme.

### Hiérarchie des titres

| Élément | Taille | Line Height | Font Weight | Letter Spacing |
|---------|--------|-------------|-------------|----------------|
| `h1` | `2.25rem` (36px) | `2.5rem` (40px) | `600` | `-0.025em` |
| `h2` | `1.875rem` (30px) | `2.25rem` (36px) | `600` | `-0.025em` |
| `h3` | `1.5rem` (24px) | `2rem` (32px) | `600` | `-0.025em` |
| `h4` | `1.25rem` (20px) | `1.75rem` (28px) | `600` | `-0.025em` |
| `h5` | `1.125rem` (18px) | `1.75rem` (28px) | `600` | `-0.025em` |
| `h6` | `1rem` (16px) | `1.5rem` (24px) | `600` | `-0.025em` |
| `p` | `1rem` (16px) | `1.75` (28px) | `400` | `normal` |

### Classes utilitaires

```tsx
// Titres de pages
<h1 className="text-3xl font-bold text-slate-900">Titre principal</h1>

// Sous-titres
<h2 className="text-2xl font-semibold text-slate-900">Sous-titre</h2>

// Texte secondaire
<p className="text-sm text-muted-foreground">Métadonnées</p>

// Code
<code className="text-sm font-mono bg-muted px-1.5 py-0.5 rounded">Code</code>
```

---

## 📏 Espacements

Basés sur le système d'espacements Tailwind (rem) avec une cohérence stricte.

### Échelle d'espacements

| Classe | Valeur | Pixels (@16px) | Usage recommandé |
|--------|--------|----------------|------------------|
| `gap-1` / `p-1` | `0.25rem` | 4px | Espaces ultra-serrés |
| `gap-2` / `p-2` | `0.5rem` | 8px | Espaces entre éléments liés |
| `gap-3` / `p-3` | `0.75rem` | 12px | Padding interne léger |
| `gap-4` / `p-4` | `1rem` | 16px | **Standard par défaut** |
| `gap-5` / `p-5` | `1.25rem` | 20px | Espaces moyens |
| `gap-6` / `p-6` | `1.5rem` | 24px | Padding de cartes |
| `gap-8` / `p-8` | `2rem` | 32px | Grandes sections |

### Standards par composant

| Composant | Padding interne | Gap entre items |
|-----------|----------------|-----------------|
| **Card** | `p-6` (24px) | - |
| **Button** | `px-4 py-2` (16px / 8px) | - |
| **Input** | `px-3 py-1` (12px / 4px) | - |
| **Table Cell** | `px-4 py-3` (16px / 12px) | - |
| **Stats Grid** | - | `gap-4` (16px) |
| **Form Fields** | - | `gap-6` (24px) |

---

## 🧩 Composants

### Button

**Fichier** : `app/_common/components/ui/Button.tsx`

#### Variants

| Variant | Usage | Classe de base |
|---------|-------|----------------|
| `primary` | Actions principales | `bg-primary text-primary-foreground` |
| `secondary` | Actions secondaires | `bg-secondary text-secondary-foreground` |
| `outline` | Actions tertiaires | `border border-input bg-background` |
| `ghost` | Actions discrètes | `hover:bg-accent hover:text-accent-foreground` |
| `destructive` | Suppressions | `bg-destructive text-destructive-foreground` |
| `success` | Validations | `bg-success text-success-foreground` |
| `warning` | Avertissements | `bg-warning text-warning-foreground` |
| `link` | Liens textuels | `text-primary underline-offset-4` |

#### Tailles

| Size | Hauteur | Padding | Usage |
|------|---------|---------|-------|
| `sm` | `h-8` (32px) | `px-3` | Boutons compacts |
| `md` | `h-9` (36px) | `px-4 py-2` | **Taille par défaut** |
| `lg` | `h-10` (40px) | `px-8` | Boutons proéminents |
| `icon` | `h-9 w-9` (36x36px) | - | Boutons icône seule |

#### Exemples

```tsx
import { Button } from '@/app/_common/components/ui/Button'

// Bouton principal
<Button variant="primary" size="md">Enregistrer</Button>

// Bouton destructif
<Button variant="destructive" size="sm">Supprimer</Button>

// Bouton avec loading
<Button variant="primary" loading={isLoading}>Charger</Button>

// Bouton icône
<Button variant="ghost" size="icon"><Plus className="h-4 w-4" /></Button>
```

### Card

**Fichier** : `app/_common/components/ui/Card.tsx`

#### Structure

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/app/_common/components/ui/Card'

<Card>
  <CardHeader>
    <CardTitle>Titre de la carte</CardTitle>
    <CardDescription>Description optionnelle</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Contenu principal */}
  </CardContent>
  <CardFooter>
    {/* Actions optionnelles */}
  </CardFooter>
</Card>
```

#### Padding standards

- `CardHeader` : `p-6` + `space-y-1.5` (vertical)
- `CardContent` : `p-6 pt-0`
- `CardFooter` : `p-6 pt-0`

### Input

**Fichier** : `app/_common/components/ui/Input.tsx`

#### Props spécifiques

```tsx
interface InputProps {
  label?: string       // Label affiché au-dessus
  error?: string       // Message d'erreur (affiche bordure rouge)
  required?: boolean   // Ajoute astérisque rouge au label
}
```

#### Exemples

```tsx
import { Input } from '@/app/_common/components/ui/Input'

// Input simple
<Input placeholder="Saisir..." />

// Input avec label
<Input label="Nom du client" required />

// Input avec erreur
<Input label="Email" error="Email invalide" value={email} />
```

### Badge

**Fichier** : `app/_common/components/ui/Badge.tsx`

#### Variants

| Variant | Couleur | Usage |
|---------|---------|-------|
| `default` | Primary | Badges génériques |
| `secondary` | Secondary | Info secondaire |
| `destructive` | Destructive | Erreurs |
| `success` | Success | Validations |
| `warning` | Warning | Avertissements |
| `info` | Info | Informations |
| `outline` | Transparent | Badges neutres |

#### Exemples

```tsx
import { Badge } from '@/app/_common/components/ui/Badge'

<Badge variant="success">Actif</Badge>
<Badge variant="warning">En attente</Badge>
<Badge variant="destructive">Annulé</Badge>
```

---

## 🎭 États interactifs

### Hover

```css
/* Standard hover */
.hover\:bg-accent:hover {
  background-color: hsl(var(--accent));
}

/* Button hover avec élévation */
.btn-primary:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-2px);
}
```

### Focus

**Obligatoire pour l'accessibilité** : Tous les éléments interactifs doivent avoir un état focus visible.

```tsx
// Focus ring standard
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

// Focus sur Input
className="focus-visible:ring-2 focus-visible:ring-ring"
```

### Disabled

```tsx
// Bouton désactivé
<Button disabled>Action impossible</Button>

// Input désactivé
<Input disabled placeholder="Lecture seule" />

// Style appliqué automatiquement
className="disabled:pointer-events-none disabled:opacity-50"
```

---

## 🌑 Ombres et élévations

Utilisées pour créer de la profondeur sans glassmorphism.

| Variable | Valeur | Usage |
|----------|--------|-------|
| `--shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Très légère (badges, inputs) |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Cartes standards |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Cartes hover |
| `--shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1)` | Modals, dropdowns |
| `--shadow-2xl` | `0 25px 50px -12px rgb(0 0 0 / 0.25)` | Éléments flottants |

### Classes utilitaires

```tsx
<div className="shadow-sm">Légère</div>
<div className="shadow-md">Standard</div>
<div className="shadow-lg">Prononcée</div>
```

---

## ✨ Animations

**Principe** : Animations rapides (< 300ms), fluides, qui servent l'UX.

### Keyframes disponibles

| Animation | Durée | Usage |
|-----------|-------|-------|
| `fadeIn` | 300ms | Apparition simple |
| `fadeInUp` | 400ms | Apparition depuis le bas |
| `slideIn` | 300ms | Apparition latérale |
| `scaleIn` | 300ms | Apparition avec zoom |
| `shimmer` | 2s (loop) | Loading states |
| `pulse` | 3s (loop) | Loading lent |

### Classes utilitaires

```tsx
<div className="animate-fadeIn">Apparaît</div>
<div className="animate-fadeInUp">Monte</div>
<div className="animate-pulse-slow">Pulse</div>
```

### Transitions

```css
/* Standard (composants) */
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

/* Hover cards */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

---

## ♿ Accessibilité

### Contrastes WCAG 2.1

Tous les couples texte/fond respectent **WCAG AA minimum** :

| Combinaison | Ratio | Niveau |
|-------------|-------|--------|
| `foreground` / `background` | 15.1:1 | AAA |
| `primary` / `primary-foreground` | 4.8:1 | AA |
| `destructive` / `destructive-foreground` | 4.5:1 | AA |

### Focus visible

```tsx
// Toujours présent sur les éléments interactifs
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
```

### Labels

```tsx
// Toujours associer label et input
<label htmlFor="email">Email</label>
<input id="email" />

// Ou utiliser le composant Input qui le fait automatiquement
<Input label="Email" />
```

### Texte alternatif

```tsx
// Icônes décoratives
<Icon aria-hidden="true" />

// Icônes informatives
<Icon aria-label="Fermer" />
```

---

## 🛠️ Utilisation

### Import des composants

```tsx
// Composants de base
import { Button } from '@/app/_common/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Badge } from '@/app/_common/components/ui/Badge'

// Icônes
import { Plus, Edit, Trash2 } from 'lucide-react'
```

### Exemple complet

```tsx
'use client'

import { useState } from 'react'
import { Button } from '@/app/_common/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/app/_common/components/ui/Card'
import { Input } from '@/app/_common/components/ui/Input'
import { Badge } from '@/app/_common/components/ui/Badge'
import { Plus } from 'lucide-react'

export default function ExamplePage() {
  const [value, setValue] = useState('')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Page exemple</h1>
          <p className="text-slate-600 mt-1">Description de la page</p>
        </div>
        <Button variant="primary">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total</p>
              <p className="text-2xl font-bold mt-1">1,234</p>
            </div>
            <Badge variant="success">+12%</Badge>
          </div>
        </Card>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Formulaire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Nom"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Button variant="primary">Enregistrer</Button>
            <Button variant="outline">Annuler</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 📚 Ressources

- **Composants** : `/app/_common/components/ui/`
- **Styles globaux** : `/app/globals.css`
- **Variables CSS** : `:root` dans `globals.css`
- **Icônes** : [Lucide React](https://lucide.dev)

---

## ✅ Checklist validation

Avant de créer une nouvelle page :

- [ ] Utilisation exclusive des composants du design system
- [ ] Aucune couleur hard-codée (uniquement variables CSS)
- [ ] Espacements cohérents (gap-4, p-6, etc.)
- [ ] États focus visibles sur tous les éléments interactifs
- [ ] Contrastes WCAG AA minimum respectés
- [ ] Animations < 300ms
- [ ] Pas de glassmorphism
- [ ] Pas de dark mode
- [ ] Responsive (mobile, tablet, desktop)

---

**Dernière mise à jour** : Novembre 2024  
**Mainteneur** : Équipe CRM FIN3
