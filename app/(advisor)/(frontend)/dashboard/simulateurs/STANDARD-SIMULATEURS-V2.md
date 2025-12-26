# 📘 Standard des Simulateurs Immobiliers - V2

> **Document de référence** pour le développement et la maintenance des simulateurs patrimoniaux.
> Basé sur le simulateur LMNP optimisé (décembre 2024).

---

## 🎯 Principes Fondamentaux

### 1. Précision Fiscale
- **Aucune approximation** : tous les calculs doivent être conformes au CGI
- **Sources citées** : chaque règle fiscale doit référencer l'article de loi
- **Données 2025** : utiliser `parameters-2025.ts` pour les barèmes

### 2. Transparence
- **Calculs explicables** : tout résultat doit pouvoir être justifié étape par étape
- **Toggles de détail** : permettre à l'utilisateur de voir "comment c'est calculé"
- **Pas de boîte noire** : éviter les formules magiques sans explication

### 3. UX Professionnelle
- **Palette bleue** : couleurs cohérentes (bleu principal, emerald positif, amber alerte, red négatif)
- **Hiérarchie claire** : indicateurs clés → détails → explications
- **Responsive** : fonctionnel sur desktop et tablette

---

## 🏗️ Architecture Backend

### Structure de fichier (`/api/advisor/simulators/[domaine]/[dispositif]/route.ts`)

```typescript
// ══════════════════════════════════════════════════════════════════════════════
// IMPORTS & CONSTANTES
// ══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'

// Constantes fiscales avec source légale
const PARAMS = {
  // Barèmes IR 2025 (CGI art. 197)
  BAREME_IR: [
    { min: 0, max: 11497, taux: 0 },
    { min: 11497, max: 29315, taux: 0.11 },
    { min: 29315, max: 83823, taux: 0.30 },
    { min: 83823, max: 180294, taux: 0.41 },
    { min: 180294, max: Infinity, taux: 0.45 },
  ],
  
  // Plafonnement quotient familial (CGI art. 197)
  PLAFOND_QF: 1759,
  
  // Prélèvements sociaux
  PS: {
    TAUX_GLOBAL: 0.172,
    CSG_DEDUCTIBLE: 0.068,
  },
  
  // Seuils spécifiques au dispositif
  // ...
}

// ══════════════════════════════════════════════════════════════════════════════
// VALIDATION DES ENTRÉES
// ══════════════════════════════════════════════════════════════════════════════

interface SimulationInput {
  // Profil client (OBLIGATOIRE pour tout simulateur)
  situationFamiliale: 'CELIBATAIRE' | 'MARIE_PACSE' | 'DIVORCE' | 'VEUF'
  enfantsACharge: number
  enfantsGardeAlternee: number
  parentIsole: boolean
  
  // Revenus existants
  revenusSalaires: number
  // ... autres revenus selon le dispositif
  
  // Paramètres spécifiques au dispositif
  // ...
}

function validateInput(input: any): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Validations obligatoires
  if (!input.situationFamiliale) errors.push('Situation familiale requise')
  if (input.enfantsACharge < 0) errors.push('Nombre d\'enfants invalide')
  
  // Validations spécifiques au dispositif
  // ...
  
  return { valid: errors.length === 0, errors }
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCULS FISCAUX COMMUNS
// ══════════════════════════════════════════════════════════════════════════════

function calculNombreParts(input: SimulationInput): number {
  let parts = input.situationFamiliale === 'MARIE_PACSE' ? 2 : 1
  
  // Enfants à charge
  if (input.enfantsACharge >= 1) parts += 0.5
  if (input.enfantsACharge >= 2) parts += 0.5
  if (input.enfantsACharge >= 3) parts += (input.enfantsACharge - 2) * 1
  
  // Garde alternée (demi-part divisée par 2)
  parts += input.enfantsGardeAlternee * 0.25
  
  // Parent isolé
  if (input.parentIsole && input.enfantsACharge > 0) parts += 0.5
  
  return parts
}

function calculIR(revenuImposable: number, nombreParts: number): {
  impotBrut: number
  impotNet: number
  plafonnementApplique: number
  tmi: number
} {
  const quotient = revenuImposable / nombreParts
  
  // Calcul IR par tranche
  let impotParPart = 0
  let tmi = 0
  
  for (const tranche of PARAMS.BAREME_IR) {
    if (quotient > tranche.min) {
      const base = Math.min(quotient, tranche.max) - tranche.min
      impotParPart += base * tranche.taux
      if (quotient >= tranche.min) tmi = tranche.taux * 100
    }
  }
  
  const impotBrut = impotParPart * nombreParts
  
  // Plafonnement du quotient familial (CGI art. 197)
  const partsSupplementaires = nombreParts - (input.situationFamiliale === 'MARIE_PACSE' ? 2 : 1)
  const avantageQF = partsSupplementaires * PARAMS.PLAFOND_QF
  const impotSansQF = calculIRSansQF(revenuImposable)
  const plafonnement = Math.max(0, (impotSansQF - impotBrut) - avantageQF)
  
  return {
    impotBrut,
    impotNet: impotBrut + plafonnement,
    plafonnementApplique: plafonnement,
    tmi,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCULS SPÉCIFIQUES AU DISPOSITIF
// ══════════════════════════════════════════════════════════════════════════════

// À implémenter selon le dispositif (LMNP, Pinel, SCPI, etc.)

// ══════════════════════════════════════════════════════════════════════════════
// GÉNÉRATION DES ALERTES
// ══════════════════════════════════════════════════════════════════════════════

function generateAlertes(input: SimulationInput, resultats: any): Alerte[] {
  const alertes: Alerte[] = []
  
  // Alertes communes
  if (resultats.cashFlowMoyen < -500) {
    alertes.push({
      type: 'warning',
      titre: 'Effort d\'épargne important',
      message: `Un effort mensuel de ${Math.abs(resultats.cashFlowMoyen)}€ est à prévoir.`,
    })
  }
  
  // Alertes spécifiques au dispositif
  // ...
  
  return alertes
}

// ══════════════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const input = await request.json()
    
    // Validation
    const validation = validateInput(input)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors }, { status: 400 })
    }
    
    // Calculs
    const nombreParts = calculNombreParts(input)
    const irAvant = calculIR(input.revenusTotaux, nombreParts)
    
    // Calculs spécifiques...
    
    // Réponse structurée
    return NextResponse.json({
      synthese: {
        investTotal: ...,
        rendBrut: ...,
        tri: ...,
        cashFlowMoyen: ...,
        // ...
      },
      projections: [...],
      profilClient: {
        nombreParts,
        tmi: irAvant.tmi,
        irAvant: irAvant.impotNet,
        plafonnementQF: irAvant.plafonnementApplique,
        // ...
      },
      alertes: generateAlertes(input, resultats),
    })
    
  } catch (error) {
    console.error('Erreur simulation:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
```

---

## 🖥️ Architecture Frontend

### Structure de page (`/dashboard/simulateurs/[domaine]/[dispositif]/page.tsx`)

```tsx
'use client'
import { useState } from 'react'

// ══════════════════════════════════════════════════════════════════════════════
// UTILITAIRES DE FORMATAGE (à externaliser dans un fichier commun)
// ══════════════════════════════════════════════════════════════════════════════

const fmtEur = (n: number | null | undefined) => 
  n == null || isNaN(n) ? '0 €' : n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

const fmtPct = (n: number | null | undefined) => 
  n == null || isNaN(n) ? '0%' : `${n.toFixed(2).replace('.', ',')}%`

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export default function SimulateurPage() {
  // États de navigation
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  
  // États de toggles (pour les détails)
  const [showDetailPV, setShowDetailPV] = useState(false)
  const [showScoreDetail, setShowScoreDetail] = useState(false)
  const [showDetailedTable, setShowDetailedTable] = useState(false)
  
  // ÉTAPE 1 : Profil Client (OBLIGATOIRE)
  const [situationFamiliale, setSituationFamiliale] = useState('MARIE_PACSE')
  const [enfantsACharge, setEnfantsACharge] = useState(0)
  // ...
  
  // ÉTAPE 2+ : Paramètres spécifiques au dispositif
  // ...
  
  // État des résultats
  const [synthese, setSynthese] = useState<any>(null)
  const [projections, setProjections] = useState<any[]>([])
  
  // ══════════════════════════════════════════════════════════════════════════
  // FONCTION DE SIMULATION
  // ══════════════════════════════════════════════════════════════════════════
  
  const lancerSimulation = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/advisor/simulators/...', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situationFamiliale,
          enfantsACharge,
          // ...tous les paramètres
        }),
      })
      
      const result = await response.json()
      
      // Mapping des résultats vers l'état local
      setSynthese({
        // Mapper les valeurs du backend vers le format frontend
      })
      setProjections(result.projections)
      setShowResults(true)
      
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // ══════════════════════════════════════════════════════════════════════════
  // RENDU
  // ══════════════════════════════════════════════════════════════════════════
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Simulateur [Dispositif]</h1>
          <p className="text-slate-600">Description du dispositif</p>
        </header>
        
        {/* BARRE DE PROGRESSION */}
        <ProgressBar step={step} totalSteps={5} />
        
        {/* FORMULAIRE PAR ÉTAPES */}
        {!showResults && (
          <main className="sim-card">
            {step === 1 && <StepProfilClient ... />}
            {step === 2 && <StepParametres ... />}
            {/* ... autres étapes */}
          </main>
        )}
        
        {/* RÉSULTATS */}
        {showResults && synthese && (
          <ResultatsSection 
            synthese={synthese} 
            projections={projections}
            // ... autres props
          />
        )}
      </div>
      
      {/* STYLES GLOBAUX */}
      <style jsx global>{`
        .sim-card { background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:24px; }
        .btn-primary { background:linear-gradient(135deg,#1e40af,#3b82f6); color:#fff; padding:12px 24px; border-radius:8px; font-weight:600; }
      `}</style>
    </div>
  )
}
```

---

## 📊 Structure des Résultats

### 1. Impact Fiscal Global
```tsx
<div className="sim-card">
  <h3>Impact fiscal global</h3>
  <div className="grid grid-cols-2 gap-4">
    <div>
      <span>IR avant</span>
      <span>{fmtEur(synthese.profilClient.irAvant)}</span>
    </div>
    <div>
      <span>IR après</span>
      <span>{fmtEur(synthese.profilClient.irApres)}</span>
    </div>
    {/* TMI, IFI si applicable */}
  </div>
</div>
```

### 2. Indicateurs Clés de Performance
```tsx
<div className="grid grid-cols-3 md:grid-cols-6 gap-4">
  <KPI label="Rendement brut" value={fmtPct(synthese.rendBrut)} color="blue" />
  <KPI label="TRI" value={fmtPct(synthese.tri)} color="emerald" />
  <KPI label="Cash-flow/mois" value={fmtEur(synthese.cfMoyMois)} color={synthese.cfMoyMois >= 0 ? 'emerald' : 'amber'} />
  <KPI label="IR total" value={fmtEur(synthese.totIR)} color="slate" />
  {/* ... autres KPIs selon le dispositif */}
</div>
```

### 3. Graphiques (séparés, full-width)
```tsx
{/* Graphique 1 : Cash-flow annuel */}
<div className="sim-card">
  <h3>Cash-flow annuel</h3>
  <BarChart data={projections} dataKey="cfApresImpots" />
  <div className="bg-blue-50 p-4 rounded-lg mt-4">
    <p className="text-blue-700">
      Analyse : {synthese.cfMoyMois >= 0 
        ? 'Opération autofinancée' 
        : `Effort mensuel de ${fmtEur(Math.abs(synthese.cfMoyMois))}`}
    </p>
  </div>
</div>

{/* Graphique 2 : Capital net */}
<div className="sim-card">
  <h3>Évolution du capital net</h3>
  <AreaChart data={projections} dataKey="capitalNet" />
  {/* Analyse commentée */}
</div>
```

### 4. Synthèse et Score

#### Système de notation (base 0, max 10)

```typescript
// Calcul du score selon critères pondérés
const calculScore = (synthese) => {
  let score = 0
  
  // TRI (max 3 pts) - Critère principal
  if (synthese.tri >= 10) score += 3
  else if (synthese.tri >= 8) score += 2.5
  else if (synthese.tri >= 6) score += 2
  else if (synthese.tri >= 5) score += 1.5
  else if (synthese.tri >= 4) score += 1
  else if (synthese.tri >= 3) score += 0.5
  
  // Cash-flow (max 2.5 pts)
  if (synthese.cfMoyMois >= 200) score += 2.5
  else if (synthese.cfMoyMois >= 100) score += 2
  else if (synthese.cfMoyMois >= 0) score += 1.5
  else if (synthese.cfMoyMois >= -150) score += 1
  else if (synthese.cfMoyMois >= -300) score += 0.5
  
  // Fiscalité (max 1.5 pts)
  if (synthese.totIR === 0) score += 1.5
  else if (synthese.totIR < 2000) score += 1
  else if (synthese.totIR < 5000) score += 0.5
  
  // Levier (max 1.5 pts)
  const levier = synthese.capFinal / synthese.apport
  if (levier >= 8) score += 1.5
  else if (levier >= 5) score += 1
  else if (levier >= 3) score += 0.5
  
  // Rendement brut (max 1.5 pts)
  if (synthese.rendBrut >= 7) score += 1.5
  else if (synthese.rendBrut >= 5) score += 1
  else if (synthese.rendBrut >= 4) score += 0.5
  
  // Pénalités
  if (synthese.dpe === 'G') score -= 1
  if (synthese.dpe === 'F') score -= 0.5
  
  return Math.min(10, Math.max(0, score))
}
```

#### Affichage avec toggle explicatif

```tsx
{/* Score avec barres de progression */}
<div className={`rounded-xl p-6 border-2 ${getScoreBg(score)}`}>
  <div className="flex items-center gap-6">
    <div className="text-center">
      <div className={`text-5xl font-black ${getScoreColor(score)}`}>{score.toFixed(1)}</div>
      <div className="text-slate-500 text-sm">/10</div>
    </div>
    <div className="flex-1">
      <div className="text-xl font-bold">{getScoreLabel(score)}</div>
      {/* Barres de critères */}
    </div>
  </div>
</div>

{/* Toggle explication */}
<button onClick={() => setShowScoreDetail(!showScoreDetail)}>
  {showScoreDetail ? '▼ Masquer' : '▶ Comprendre'} le calcul du score
</button>

{showScoreDetail && (
  <table>
    {/* Tableau détaillé des critères et points */}
  </table>
)}
```

### 5. Points Forts / Vigilance
```tsx
<div className="grid md:grid-cols-2 gap-4">
  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
    <h4>✓ Points forts</h4>
    <ul>
      {conditions.map(c => c.ok && <li key={c.id}>{c.message}</li>)}
    </ul>
  </div>
  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
    <h4>⚠ Points d'attention</h4>
    <ul>
      {alertes.map(a => <li key={a.id}>{a.message}</li>)}
    </ul>
  </div>
</div>
```

---

## 🎨 Palette de Couleurs

| Usage | Classe Tailwind | Hex |
|-------|-----------------|-----|
| **Primaire** | `blue-600` | #2563eb |
| **Primaire foncé** | `blue-800` | #1e40af |
| **Positif** | `emerald-600` | #059669 |
| **Alerte** | `amber-600` | #d97706 |
| **Négatif** | `red-600` | #dc2626 |
| **Neutre** | `slate-600` | #475569 |
| **Background** | `slate-50` | #f8fafc |
| **Card** | `white` | #ffffff |

---

## 📋 Checklist de Développement

### Backend
- [ ] Validation des entrées avec messages d'erreur clairs
- [ ] Calcul du nombre de parts correct (CGI)
- [ ] Calcul IR avec plafonnement QF
- [ ] Calculs spécifiques au dispositif documentés
- [ ] Génération des alertes contextuelles
- [ ] Réponse JSON structurée

### Frontend
- [ ] Formulaire par étapes avec progression
- [ ] Profil client en étape 1 (obligatoire)
- [ ] Appel API avec gestion d'erreurs
- [ ] Mapping correct backend → frontend
- [ ] Indicateurs clés visibles
- [ ] Graphiques séparés avec analyses
- [ ] Score avec toggle explicatif
- [ ] Points forts / vigilance
- [ ] Recommandation personnalisée
- [ ] Responsive design

### Fiscal
- [ ] Barèmes 2025 à jour
- [ ] Sources légales citées
- [ ] Calculs vérifiables manuellement

---

## 🔄 Adaptation par Dispositif

### LMNP
- Plus-value avec forfaits (7.5% + 15%)
- Réintégration amortissements (LF 2024)
- Seuil LMNP (23 000€)
- Abattements PV par durée

### Pinel
- Réduction d'IR selon durée (6/9/12 ans)
- Plafonds de loyer par zone
- Plafonds de ressources locataires
- Engagement de location

### SCPI
- Rendement distribué
- Report déficit foncier
- Fiscalité des revenus fonciers
- Frais de gestion

### Déficit Foncier
- Imputation sur revenus globaux (10 700€)
- Report sur revenus fonciers (10 ans)
- Travaux déductibles

---

## 📁 Fichiers de Référence

- **Backend LMNP** : `/app/(advisor)/(backend)/api/advisor/simulators/immobilier/lmnp/route.ts`
- **Frontend LMNP** : `/app/(advisor)/(frontend)/dashboard/simulateurs/immobilier/lmnp/page.tsx`
- **Paramètres fiscaux** : `/app/(advisor)/(frontend)/dashboard/simulateurs/parameters-2025.ts`
- **Ce document** : `/app/(advisor)/(frontend)/dashboard/simulateurs/STANDARD-SIMULATEURS-V2.md`

---

*Dernière mise à jour : Décembre 2024*
