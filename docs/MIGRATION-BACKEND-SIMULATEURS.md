# 🔒 Migration des Simulateurs vers Backend API

## Objectif
Sécuriser les calculs fiscaux en les déplaçant du frontend (exposé) vers le backend (protégé).

---

## Architecture Actuelle (❌ Non sécurisée)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                          │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  • Formulaire utilisateur                                │ │
│  │  • CALCULS FISCAUX (exposés dans le bundle JS)          │ │
│  │  • Constantes fiscales visibles                          │ │
│  │  • Barèmes IR/IFI accessibles                           │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ❌ Pas de backend
```

**Problèmes :**
- Code de calcul visible dans DevTools
- Constantes fiscales exposées
- Facilement modifiable par un utilisateur malveillant
- Pas de validation serveur

---

## Architecture Cible (✅ Sécurisée)

```
┌─────────────────────────┐         ┌─────────────────────────┐
│   FRONTEND (React)      │         │   BACKEND (Next.js API) │
│                         │         │                         │
│  • Formulaire UI        │  POST   │  • Validation Zod       │
│  • Affichage résultats  │ ──────► │  • Auth JWT             │
│  • PAS de calculs       │         │  • Calculs sécurisés    │
│                         │ ◄────── │  • Constantes privées   │
│                         │  JSON   │  • Logging/Audit        │
└─────────────────────────┘         └─────────────────────────┘
```

---

## Structure des fichiers

### Backend (API Routes)

```
app/(advisor)/(backend)/api/advisor/simulators/immobilier/
├── lmnp/route.ts               ✅ Créé
├── lmp/route.ts                ✅ Créé
├── pinel/route.ts              ✅ Créé
├── denormandie/route.ts        ✅ Créé
├── deficit-foncier/route.ts    ✅ Créé
├── malraux/route.ts            ✅ Créé
├── monuments-historiques/route.ts ✅ Créé
├── scpi/route.ts               ✅ Créé
├── nue-propriete/route.ts      ✅ Créé
├── saisonnier/route.ts         ✅ Créé
├── location-nue/route.ts       ✅ Créé
├── colocation/route.ts         ✅ Créé
└── _shared/
    ├── constants.ts            ✅ Créé - Constantes fiscales 2025
    ├── calculations.ts         ✅ Créé - Fonctions de calcul partagées
    └── validators.ts           ✅ Créé - Schémas Zod communs
```

### Frontend (Pages refactorisées)

```
app/(advisor)/(frontend)/dashboard/simulateurs/immobilier/
├── lmnp/page.tsx          # Formulaire + fetch API
├── ...
└── _hooks/
    └── useSimulator.ts    # Hook générique pour appels API
```

---

## Exemple de migration

### AVANT (Frontend avec calculs)

```typescript
// ❌ page.tsx - Calculs exposés côté client
const lancerSimulation = useCallback(() => {
  // Tous ces calculs sont visibles dans le bundle JS
  const nombreParts = calculNombreParts(...)
  const irAvant = calculIRDetaille(revenusTotaux, nombreParts)
  const amortissement = valeurAmortissable / 30
  // ...200 lignes de calculs exposés
}, [...])
```

### APRÈS (Frontend avec appel API)

```typescript
// ✅ page.tsx - Seulement l'UI
const lancerSimulation = useCallback(async () => {
  setLoading(true)
  try {
    const response = await fetch('/api/advisor/simulators/immobilier/lmnp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        situationFamiliale,
        enfantsACharge,
        revenusSalaires,
        prixAcquisition,
        loyerMensuel,
        // ... tous les inputs
      }),
    })
    
    if (!response.ok) throw new Error('Erreur serveur')
    
    const data = await response.json()
    setProjections(data.projections)
    setSynthese(data.synthese)
    setAlertes(data.alertes)
  } catch (error) {
    setError('Erreur lors de la simulation')
  } finally {
    setLoading(false)
  }
}, [/* seulement les inputs */])
```

---

## Étapes de migration pour chaque simulateur

### 1. Créer la route API

```typescript
// app/(advisor)/(backend)/api/advisor/simulators/immobilier/[simulateur]/route.ts

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/app/_common/lib/auth-helpers'

// Schéma de validation
const inputSchema = z.object({
  // ... définir tous les champs avec validation
})

// Fonction de calcul (privée, non exportée)
function simuler(input: z.infer<typeof inputSchema>) {
  // Tous les calculs ici - NON EXPOSÉS
  return { synthese, projections, alertes }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request) // Vérifie le JWT
    
    const body = await request.json()
    const input = inputSchema.parse(body) // Validation stricte
    
    const resultat = simuler(input)
    
    return createSuccessResponse(resultat)
  } catch (error) {
    // Gestion d'erreur centralisée
  }
}
```

### 2. Refactoriser le frontend

```typescript
// Supprimer :
// - Toutes les fonctions de calcul
// - Les constantes fiscales
// - Les imports de parameters-immobilier-2025.ts

// Garder :
// - useState pour les inputs
// - L'interface utilisateur (formulaire, affichage)
// - useEffect pour les graphiques

// Ajouter :
// - fetch vers l'API
// - Gestion du loading/error
```

### 3. Créer un hook générique

```typescript
// _hooks/useSimulator.ts
export function useSimulator<TInput, TResult>(endpoint: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<TResult | null>(null)

  const simulate = useCallback(async (input: TInput) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/advisor/simulators/immobilier/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Erreur serveur')
      }
      const data = await res.json()
      setResult(data)
      return data
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
      return null
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  return { simulate, loading, error, result }
}
```

---

## Avantages de cette architecture

| Aspect | Avant | Après |
|--------|-------|-------|
| **Sécurité** | ❌ Calculs exposés | ✅ Calculs serveur |
| **Validation** | ❌ Côté client seulement | ✅ Double validation |
| **Audit** | ❌ Aucun | ✅ Logs serveur |
| **Maintenance** | ❌ Dupliquer les changements | ✅ Un seul endroit |
| **Performance** | ❌ Charge client | ✅ Serveur optimisé |
| **Tests** | ❌ Difficile | ✅ Tests unitaires API |

---

## Checklist de migration

### ✅ Phase 1 : Backend API (TERMINÉ)
- [x] Créer fichier constantes partagées (`_shared/constants.ts`)
- [x] Créer fichier calculs partagés (`_shared/calculations.ts`)
- [x] Créer fichier validateurs Zod (`_shared/validators.ts`)
- [x] Route API LMNP
- [x] Route API LMP
- [x] Route API Pinel
- [x] Route API Denormandie
- [x] Route API Déficit Foncier
- [x] Route API Malraux
- [x] Route API Monuments Historiques
- [x] Route API SCPI
- [x] Route API Nue-Propriété
- [x] Route API Location Saisonnière
- [x] Route API Location Nue
- [x] Route API Colocation

### ✅ Phase 2 : Frontend Refactorisation (TERMINÉE - 100%)
- [x] Créer hook useSimulator générique (`_hooks/useSimulator.ts`)
- [x] Créer types API partagés (`_types/api-types.ts`)
- [x] Créer fichier display-helpers partagé (`_utils/display-helpers.ts`)
- [x] Migration LMNP - imports vers display-helpers, appel API ✅
- [x] Migration LMP - imports vers display-helpers, appel API ✅
- [x] Migration SCPI - imports vers display-helpers, appel API ✅
- [x] Migration Pinel - imports vers display-helpers, appel API ✅
- [x] Migration Denormandie - imports vers display-helpers, appel API ✅
- [x] Migration Déficit Foncier - imports vers display-helpers, appel API ✅
- [x] Migration Malraux - imports vers display-helpers, appel API ✅
- [x] Migration Monuments Historiques - imports vers display-helpers, appel API ✅
- [x] Migration Nue-Propriété - imports vers display-helpers, appel API ✅
- [x] Migration Saisonnier - imports vers display-helpers, appel API ✅
- [x] Migration Location Nue - imports vers display-helpers, appel API ✅
- [x] Migration Colocation - imports vers display-helpers, appel API ✅

**Tous les 12 simulateurs immobilier utilisent désormais l'API backend pour les calculs.**

### 🔲 Phase 3 : Nettoyage (À FAIRE)
- [ ] Tests unitaires API
- [ ] Tests E2E
- [ ] Supprimer parameters-immobilier-2025.ts du frontend (après migration complète)

---

## Guide de migration Frontend

### Étape 1 : Utiliser le hook wrapper

Chaque simulateur a un hook dédié qui appelle l'API et transforme les résultats :

```typescript
// Dans le composant frontend
import { useLMNPSimulator } from '../_hooks/useLMNPSimulator'

export default function LMNPPage() {
  const { simulate, isLoading, error, result } = useLMNPSimulator()
  
  const lancerSimulation = async () => {
    const input = {
      situationFamiliale,
      enfantsACharge,
      // ... autres champs du formulaire
    }
    
    const resultat = await simulate(input)
    
    if (resultat) {
      // Les résultats sont au format attendu par l'UI existante
      setSynthese(resultat.synthese)
      setProjections(resultat.projections)
      setAlertes(resultat.alertes)
      // ...
    }
  }
}
```

### Étape 2 : Mode hybride (recommandé)

Pour une transition en douceur, utilisez un flag pour basculer :

```typescript
const USE_API_BACKEND = process.env.NEXT_PUBLIC_USE_API_SIMULATORS === 'true'

const lancerSimulation = async () => {
  if (USE_API_BACKEND) {
    // Appel API backend
    const result = await simulate(input)
    // ...
  } else {
    // Calculs locaux existants (fallback)
    // ... code existant
  }
}
```

---

## Commande pour tester l'API

```bash
# Test de l'API LMNP
curl -X POST http://localhost:3000/api/advisor/simulators/immobilier/lmnp \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "situationFamiliale": "MARIE_PACSE",
    "enfantsACharge": 2,
    "revenusSalaires": 80000,
    "prixAcquisition": 200000,
    "loyerMensuel": 800,
    "tauxCredit": 3.5,
    "dureeCredit": 20,
    "regimeFiscal": "REEL",
    "dateAcquisition": "2025-01",
    "fraisNotaire": 16000,
    "apport": 50000,
    "dureeDetention": 20
  }'
```
