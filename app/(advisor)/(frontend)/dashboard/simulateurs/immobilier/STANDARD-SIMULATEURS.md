# 📋 STANDARD TECHNIQUE - SIMULATEURS IMMOBILIER

> **⚠️ DOCUMENT OBSOLÈTE - Voir les nouveaux standards V2**
>
> - **Frontend** : `/app/(advisor)/(frontend)/dashboard/simulateurs/STANDARD-SIMULATEURS-V2.md`
> - **Backend** : `/app/(advisor)/(backend)/api/advisor/simulators/STANDARD-BACKEND-SIMULATEURS.md`

---

> **Document de référence basé sur le simulateur LMNP**  
> Toute refonte doit suivre cette structure intégralement.

---

## 🎯 OBJECTIF

Garantir une qualité homogène, une pédagogie rigoureuse et une précision fiscale sur tous les simulateurs immobiliers.

---

## 📦 STRUCTURE DU FICHIER

### 1. IMPORTS OBLIGATOIRES

```typescript
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'
import Script from 'next/script'
import { SimulatorGate } from '@/app/_common/components/FeatureGate'
import { 
  // Constantes du simulateur
  LOCATION_NUE, LMNP, PRELEVEMENTS_SOCIAUX, 
  // Fonctions de calcul PV
  calculAbattementPVIR, calculAbattementPVPS, calculImpotPlusValue,
  // Fonctions profil client
  calculNombreParts, calculIRDetaille, calculIFI, BAREME_IFI,
  // Types
  type ClasseDPE 
} from '../parameters-immobilier-2025'
```

### 2. FONCTIONS UTILITAIRES

```typescript
const fmtEur = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
const fmtPct = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '%'
```

### 3. TYPES OBLIGATOIRES

```typescript
type SituationFamiliale = 'CELIBATAIRE' | 'MARIE_PACSE' | 'VEUF'
```

---

## 👤 ÉTAPE 1 : PROFIL CLIENT (OBLIGATOIRE)

### Variables d'état

```typescript
// Situation familiale
const [situationFamiliale, setSituationFamiliale] = useState<SituationFamiliale>('MARIE_PACSE')
const [enfantsACharge, setEnfantsACharge] = useState(2)
const [enfantsGardeAlternee, setEnfantsGardeAlternee] = useState(0)
const [parentIsole, setParentIsole] = useState(false)

// Revenus existants du foyer fiscal
const [revenusSalaires, setRevenusSalaires] = useState(60000)
const [revenusFonciersExistants, setRevenusFonciersExistants] = useState(0)
const [autresRevenus, setAutresRevenus] = useState(0)

// Patrimoine existant (pour IFI)
const [patrimoineImmobilierExistant, setPatrimoineImmobilierExistant] = useState(350000)
const [dettesImmobilieres, setDettesImmobilieres] = useState(150000)
const [valeurRP, setValeurRP] = useState(350000) // Abattement 30% IFI
```

### Calculs automatiques

```typescript
// Calcul nombre de parts fiscales
const nombreParts = calculNombreParts({ situationFamiliale, enfantsACharge, enfantsGardeAlternee, parentIsole })

// Revenu total avant investissement
const revenuTotalAvant = revenusSalaires + revenusFonciersExistants + autresRevenus

// IR avant investissement
const irAvant = calculIRDetaille(revenuTotalAvant, nombreParts)
const tmi = irAvant.tmi

// IFI avant investissement
const ifiAvant = calculIFI({
  patrimoineImmobilierBrut: patrimoineImmobilierExistant,
  dettesDeductibles: dettesImmobilieres,
  valeurRP: valeurRP
})
```

### Interface utilisateur

```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <div className="form-group">
    <label>Situation familiale</label>
    <select value={situationFamiliale} onChange={e=>setSituationFamiliale(e.target.value as SituationFamiliale)}>
      <option value="CELIBATAIRE">Célibataire</option>
      <option value="MARIE_PACSE">Marié / Pacsé</option>
      <option value="VEUF">Veuf</option>
    </select>
  </div>
  <div className="form-group">
    <label>Enfants à charge</label>
    <input type="number" value={enfantsACharge} onChange={e=>setEnfantsACharge(+e.target.value)} min={0}/>
  </div>
  {/* ... autres champs */}
</div>

{/* Récapitulatif calculé */}
<div className="info-box mt-4 grid grid-cols-4 gap-4 text-sm">
  <div><span className="text-gray-500">Parts fiscales</span><div className="font-bold text-lg">{nombreParts}</div></div>
  <div><span className="text-gray-500">Revenu imposable</span><div className="font-bold text-lg">{fmtEur(revenuTotalAvant)}</div></div>
  <div><span className="text-gray-500">TMI</span><div className="font-bold text-lg text-blue-600">{tmi}%</div></div>
  <div><span className="text-gray-500">Patrimoine net IFI</span><div className={`font-bold text-lg ${...}`}>{fmtEur(patrimoineImmobilierExistant - dettesImmobilieres)}</div></div>
</div>

{/* Pédagogie */}
<div className="pedagogy-box mt-4">
  <p className="text-sm text-blue-700"><strong>Pourquoi ces informations ?</strong> Elles permettent de calculer l'impact RÉEL sur votre IR (barème progressif) et votre IFI, pas juste une estimation avec un TMI fixe.</p>
</div>
```

---

## 🏠 ÉTAPE 2 : BIEN IMMOBILIER

### Variables obligatoires

```typescript
// Date d'acquisition (pour calcul abattements PV)
const [dateAcquisition, setDateAcquisition] = useState(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})
const [prixAchat, setPrixAchat] = useState(200000)
const [fraisNotaire, setFraisNotaire] = useState(16000)
const [fraisAgence, setFraisAgence] = useState(0)
const [travaux, setTravaux] = useState(0)
const [surface, setSurface] = useState(50)
const [dpe, setDpe] = useState<ClasseDPE>('D')
```

### Calcul des dates clés

```typescript
const [anneeAcq, moisAcq] = dateAcquisition.split('-').map(Number)
const anneeFinCredit = anneeAcq + dureeCredit
const anneeExonerationIR = anneeAcq + 22  // Exonération PV IR après 22 ans
const anneeExonerationPS = anneeAcq + 30  // Exonération PV PS après 30 ans
```

---

## 💳 ÉTAPE 3 : FINANCEMENT

### Variables

```typescript
const [apport, setApport] = useState(40000)
const [tauxCredit, setTauxCredit] = useState(3.5)
const [dureeCredit, setDureeCredit] = useState(20)
const [assuranceCredit, setAssuranceCredit] = useState(0.30)
```

### Calculs crédit

```typescript
const investissementTotal = prixAchat + fraisNotaire + fraisAgence + travaux
const montantEmprunte = Math.max(0, investissementTotal - apport)

const tauxMensuel = tauxCredit / 100 / 12
const nbMensualites = dureeCredit * 12
const mensualiteHorsAss = montantEmprunte > 0 && tauxMensuel > 0
  ? montantEmprunte * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMensualites)) / (Math.pow(1 + tauxMensuel, nbMensualites) - 1)
  : montantEmprunte / nbMensualites
const assuranceMens = montantEmprunte * assuranceCredit / 100 / 12
const mensualiteCredit = mensualiteHorsAss + assuranceMens
const coutTotalCredit = mensualiteCredit * nbMensualites - montantEmprunte
```

---

## 💰 ÉTAPE 4 : REVENUS LOCATIFS

### Variables

```typescript
const [loyerMensuel, setLoyerMensuel] = useState(800)
const [vacanceSemaines, setVacanceSemaines] = useState(2)
const [revalorisationLoyer, setRevalorisationLoyer] = useState(2)
```

### Calculs

```typescript
const loyerAnnuelBrut = loyerMensuel * 12
const tauxVacance = vacanceSemaines / 52
const loyerAnnuelNet = loyerAnnuelBrut * (1 - tauxVacance)
const rendementBrut = prixAchat > 0 ? (loyerAnnuelBrut / prixAchat) * 100 : 0
```

---

## 📊 ÉTAPE 5 : CHARGES (CGI art. 31)

### Variables charges courantes

```typescript
// CHARGES COURANTES ANNUELLES (récurrentes)
const [taxeFonciere, setTaxeFonciere] = useState(1200) // Hors TEOM
const [chargesCopro, setChargesCopro] = useState(1200) // Non récupérables
const [assurancePNO, setAssurancePNO] = useState(180)
const [assuranceGLI, setAssuranceGLI] = useState(3) // % du loyer
const [fraisGestion, setFraisGestion] = useState(0) // % du loyer (agence)
const [provisionTravaux, setProvisionTravaux] = useState(500) // Entretien/réparation

// CHARGES EXCEPTIONNELLES (année 1 uniquement)
const [fraisProcedure, setFraisProcedure] = useState(0) // Contentieux, huissier...
const [travauxAmelioration, setTravauxAmelioration] = useState(0) // Hors construction/agrandissement
```

### Calculs charges

```typescript
const gliAnnuel = loyerAnnuelNet * assuranceGLI / 100
const gestionAnnuel = loyerAnnuelNet * fraisGestion / 100
// Charges courantes annuelles (récurrentes)
const chargesCourantes = taxeFonciere + chargesCopro + assurancePNO + gliAnnuel + gestionAnnuel + provisionTravaux
// Charges exceptionnelles (année 1 uniquement)
const chargesExceptionnellesAn1 = fraisProcedure + travauxAmelioration
// Total pour affichage
const totalCharges = chargesCourantes
```

### Dans les projections

```typescript
for (let an = 1; an <= dureeDetention; an++) {
  // Charges courantes + exceptionnelles (année 1 uniquement)
  const chargesAnnee = an === 1 
    ? chargesCourantes + chargesExceptionnellesAn1 
    : taxeFonciere + chargesCopro + assurancePNO + loyerNet * assuranceGLI / 100 + loyerNet * fraisGestion / 100 + provisionTravaux
  // ...
}
```

### Interface Step4 (Charges)

```tsx
<div className="animate-fadeIn">
  <h2 className="text-lg font-bold mb-1">📋 Charges déductibles (CGI art. 31)</h2>
  <p className="text-sm text-gray-500 mb-6">Charges non récupérables déductibles en régime réel</p>
  
  {/* CHARGES COURANTES */}
  <h3 className="font-semibold text-slate-700 mb-3">Charges courantes (récurrentes)</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {/* 6 champs : taxeFonciere, chargesCopro, assurancePNO, assuranceGLI, fraisGestion, provisionTravaux */}
  </div>
  
  {/* CHARGES EXCEPTIONNELLES ANNÉE 1 */}
  <h3 className="font-semibold text-slate-700 mb-3 mt-6">Charges exceptionnelles (année 1)</h3>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* 2 champs : fraisProcedure, travauxAmelioration */}
  </div>
  
  {/* RÉCAPITULATIF */}
  <div className="info-box mt-6 grid grid-cols-3 gap-4 text-sm">
    <div>Charges courantes/an : {fmtEur(totalCharges)}</div>
    <div>Exceptionnelles An1 : {fmtEur(chargesExceptionnellesAn1)}</div>
    <div>Ratio charges/loyers : {fmtPct(totalCharges / loyerAnnuelNet * 100)}</div>
  </div>
  
  {/* PÉDAGOGIE CGI art. 31 */}
  <div className="pedagogy-box mt-4">
    <h4 className="font-semibold text-blue-800 mb-2">📚 Charges déductibles vs non déductibles</h4>
    <div className="grid grid-cols-2 gap-4 text-sm">
      <div>
        <p className="font-medium text-emerald-700 mb-1">✅ Déductibles (art. 31 CGI)</p>
        <ul className="text-blue-700 space-y-0.5 text-xs">
          <li>• Intérêts d'emprunt + assurance</li>
          <li>• Taxe foncière (hors TEOM)</li>
          <li>• Charges copro non récupérables</li>
          <li>• Assurance PNO, GLI</li>
          <li>• Frais de gestion</li>
          <li>• Travaux entretien/amélioration</li>
          <li>• Frais de procédure</li>
        </ul>
      </div>
      <div>
        <p className="font-medium text-red-600 mb-1">❌ Non déductibles</p>
        <ul className="text-slate-600 space-y-0.5 text-xs">
          <li>• Travaux construction/agrandissement</li>
          <li>• Capital remboursé du crédit</li>
          <li>• Mobilier et équipements</li>
          <li>• TEOM (récupérable)</li>
          <li>• Charges récupérables</li>
        </ul>
      </div>
    </div>
  </div>
</div>
```

### Référence CGI

Source : `parameters-Aura-Chiffres-cle-patrimoine-2025.csv` > `LOCATION_NUE.REEL.CHARGES_DEDUCTIBLES`

---

## ÉTAPE 6 : FISCALITÉ

### Affichage TMI/IFI calculés (pas de sélection manuelle !)

```tsx
<div className="info-box mt-4 grid grid-cols-4 gap-4 text-sm">
  <div><span className="text-gray-500">TMI calculé</span><div className="font-bold text-lg text-blue-600">{tmi}%</div></div>
  <div><span className="text-gray-500">IR actuel</span><div className="font-bold text-lg">{fmtEur(irAvant.impotNet)}</div></div>
  <div><span className="text-gray-500">Revenus totaux</span><div className="font-bold text-lg">{fmtEur(revenuTotalAvant)}</div></div>
  <div><span className="text-gray-500">IFI actuel</span><div className={`font-bold text-lg ${ifiAvant.assujetti ? 'text-orange-600' : 'text-green-600'}`}>{ifiAvant.assujetti ? fmtEur(ifiAvant.impotNet) : 'Non assujetti'}</div></div>
</div>
```

---

## 📈 ÉTAPE 7 : PROJECTION

### Variables

```typescript
const [dureeDetention, setDureeDetention] = useState(20)
const [revalorisationBien, setRevalorisationBien] = useState(2)
const [fraisRevente, setFraisRevente] = useState(5)
```

---

## 🧮 STRUCTURE DU USEALLBACK lancerSimulation

### 1. Alertes et initialisation

```typescript
const lancerSimulation = useCallback(() => {
  setLoading(true)
  const newAlertes: typeof alertes = []
  const newConseils: string[] = []
  const newExplications: string[] = []
```

### 2. Calcul IFI après investissement

```typescript
const ifiApres = calculIFI({
  patrimoineImmobilierBrut: patrimoineImmobilierExistant + prixAchat,
  dettesDeductibles: dettesImmobilieres + montantEmprunte,
  valeurRP: valeurRP
})
```

### 3. Alertes DPE

```typescript
if (dpe === 'G') newAlertes.push({ type: 'error', message: '🚨 DPE G : Location interdite depuis 2025. Travaux obligatoires.' })
if (dpe === 'F') newAlertes.push({ type: 'warning', message: '⚠️ DPE F : Location interdite à partir de 2028.' })
if (dpe === 'E') newAlertes.push({ type: 'info', message: '📋 DPE E : Location interdite à partir de 2034.' })
```

### 4. Tableau d'amortissement crédit

```typescript
const amort: { annee: number; interets: number; capital: number; restant: number }[] = []
let capitalRestant = montantEmprunte
for (let a = 1; a <= dureeCredit; a++) {
  // ... calcul intérêts/capital année par année
}
```

### 5. Projections année par année

```typescript
const proj: any[] = []
for (let an = 1; an <= dureeDetention; an++) {
  // Calculs annuels
  proj.push({
    annee: anneeAcq + an - 1,  // ⚠️ ANNÉES RÉELLES (2025, 2026...)
    anIndex: an,
    loyerNet: Math.round(loyerNet),
    charges: Math.round(charges),
    interets,
    // ... autres champs
  })
}
```

### 6. Plus-value (CGI art. 150 VB)

```typescript
// IMPORTANT : Utiliser les majorations forfaitaires (et non les valeurs réelles)
// pour bénéficier des forfaits fiscaux avantageux

// 1. Prix d'acquisition
const prixAchat = input.prixAcquisition

// 2. Frais d'acquisition - MAX(forfait 7.5%, frais réels)
const forfaitAcquisition = Math.round(prixAchat * 0.075)
const majorationAcquisition = Math.max(forfaitAcquisition, fraisNotaire)

// 3. Travaux - MAX(forfait 15% si détention > 5 ans, travaux réels)
const forfaitTravaux = dureeDetention > 5 ? Math.round(prixAchat * 0.15) : 0
const majorationTravaux = Math.max(forfaitTravaux, travaux)

// 4. Prix d'acquisition majoré
const prixAcquisitionMajore = prixAchat + majorationAcquisition + majorationTravaux

// 5. Plus-value brute
const pvBrute = Math.max(0, valeurRevente - prixAcquisitionMajore)

// 6. Calcul impôt avec les majorations (pas les valeurs réelles !)
const pvCalc = calculImpotPlusValue(
  prixAchat,
  valeurRevente,
  dureeDetention,
  majorationAcquisition,  // Forfait ou réel (le plus avantageux)
  majorationTravaux       // Forfait ou réel (le plus avantageux)
)
```

> ⚠️ **ERREUR FRÉQUENTE** : Ne pas passer `fraisNotaire` et `travaux` directement à `calculImpotPlusValue`. 
> Toujours passer les majorations calculées pour bénéficier des forfaits fiscaux.

### 7. TRI (Newton-Raphson)

```typescript
const flux = [-apport, ...proj.map(p => p.cfApres)]
flux[flux.length - 1] += capFinal
let tri = 0.05
for (let i = 0; i < 100; i++) {
  // ... itération Newton-Raphson
}
```

### 8. Synthèse et Gain Total

```typescript
// FORMULE STANDARD DU GAIN TOTAL (harmonisée tous simulateurs)
// Gain total = Cash-flow cumulé + Capital final - Apport
// C'est le gain réel par rapport à l'investissement de départ
const gainTotal = cashFlowCumule + capitalFinal - apport

setSynthese({
  investissementTotal, apport, montantEmprunte,
  cashFlowCumule,
  capitalFinal,
  gainTotal,  // = cashFlowCumule + capitalFinal - apport
  
  // Dates clés
  anneeAcquisition: anneeAcq,
  anneeFinCredit,
  anneeExonerationIR,
  anneeExonerationPS,
  anneeRevente: anneeAcq + dureeDetention - 1,
  
  // Profil client complet
  profilClient: {
    nombreParts,
    revenuTotalAvant,
    irAvant: irAvant.impotNet,
    tmiAvant: tmi,
    ifiAvant: ifiAvant.impotNet,
    assujettiIFIAvant: ifiAvant.assujetti,
    ifiApres: ifiApres.impotNet,
    assujettiIFIApres: ifiApres.assujetti,
    impactIFI: ifiApres.impotNet - ifiAvant.impotNet
  }
})
```

> 📊 **DÉFINITION DU GAIN TOTAL** :
> - `cashFlowCumule` : Somme des cash-flows annuels (peut être négatif = effort d'épargne)
> - `capitalFinal` : Valeur revente - Capital restant dû - Frais revente - Impôt PV
> - `apport` : Mise de départ
> - **Gain = ce qu'on récupère - ce qu'on a sorti de sa poche**

---

## 📊 GRAPHIQUES PLOTLY

### Configuration obligatoire

```typescript
useEffect(() => {
  if (!showResults || !projections.length) return
  const P = (window as any).Plotly
  if (!P) return
  
  // GRAPHIQUE 1 : Cash-flow
  if (chartCashflow.current) {
    P.newPlot(chartCashflow.current, [{ 
      x: projections.map(p => String(p.annee)),  // ⚠️ Années réelles
      y: projections.map(p => p.cfApres), 
      type: 'bar', 
      marker: { color: projections.map(p => p.cfApres >= 0 ? '#059669' : '#dc2626') } 
    }], { 
      title: 'Cash-flow après impôts (€)', 
      height: 280, 
      margin: { t: 40, b: 40, l: 60, r: 20 }, 
      paper_bgcolor: 'transparent',
      xaxis: { title: 'Année', tickangle: -45 }
    }, { displayModeBar: false })
  }
  
  // GRAPHIQUE 2 : Patrimoine
  if (chartPatrimoine.current) {
    P.newPlot(chartPatrimoine.current, [
      { x: projections.map(p => String(p.annee)), y: projections.map(p => p.valeurBien), name: 'Valeur bien', line: { color: '#1e40af' } },
      { x: projections.map(p => String(p.annee)), y: projections.map(p => p.capitalRest), name: 'Dette restante', line: { color: '#ef4444' } },
      { x: projections.map(p => String(p.annee)), y: projections.map(p => p.capitalConstitue), name: 'Capital net', line: { color: '#059669', width: 3 } },
    ], { 
      title: 'Évolution du patrimoine net (€)', 
      height: 280, 
      // ...
    }, { displayModeBar: false })
  }
}, [showResults, projections])
```

---

## 📋 STRUCTURE DES RÉSULTATS

### 1. ALERTES ET CONSEILS

```tsx
{alertes.map((a: any, i: number) => <div key={i} className={`alert-${a.type}`}>{a.message}</div>)}
{conseils.length > 0 && <div className="alert-info">{conseils.map((c: string, i: number) => <p key={i}>{c}</p>)}</div>}
```

### 2. IMPACT FISCAL GLOBAL

```tsx
<div className="sim-card">
  <h3 className="font-bold mb-4 text-slate-800">Impact fiscal sur votre situation personnelle</h3>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
    {/* IR actuel */}
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="text-slate-500 text-xs mb-1">IR actuel (hors investissement)</div>
      <div className="font-bold text-lg text-slate-800">{fmtEur(pc.irAvant)}</div>
      <div className="text-xs text-slate-400">Sur {fmtEur(pc.revenuTotalAvant)}/an</div>
      <div className="text-xs text-slate-400">TMI : {pc.tmiAvant}%</div>
    </div>
    
    {/* IR + PS générés - TOUJOURS préciser la durée */}
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="text-amber-600 text-xs mb-1">IR + PS fonciers</div>
      <div className="font-bold text-lg text-amber-600">{fmtEur(s.totalIR + s.totalPS)}</div>
      <div className="text-xs text-amber-400">sur {dureeDetention} ans ({fmtEur(Math.round((s.totalIR + s.totalPS) / dureeDetention))}/an)</div>
    </div>
    
    {/* IFI avant */}
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="text-slate-500 text-xs mb-1">IFI avant</div>
      <div className={`font-bold text-lg ${pc.assujettiIFIAvant ? 'text-amber-600' : 'text-emerald-600'}`}>
        {pc.assujettiIFIAvant ? fmtEur(pc.ifiAvant) : 'Non assujetti'}
      </div>
    </div>
    
    {/* IFI après */}
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="text-slate-500 text-xs mb-1">IFI après</div>
      <div className={`font-bold text-lg ${pc.assujettiIFIApres ? 'text-amber-600' : 'text-emerald-600'}`}>
        {pc.assujettiIFIApres ? fmtEur(pc.ifiApres) : 'Non assujetti'}
      </div>
      {pc.impactIFI > 0 && <div className="text-xs text-red-500">+{fmtEur(pc.impactIFI)}/an</div>}
    </div>
  </div>
  
  {/* Analyse pédagogique */}
  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <h4 className="font-semibold text-blue-800 mb-2">📊 Comprendre la fiscalité</h4>
    <div className="text-sm text-blue-700 space-y-1">
      <p>• <strong>IR actuel</strong> : Explication dynamique selon les valeurs</p>
      <p>• <strong>Régime fiscal</strong> : Explication du régime choisi</p>
      <p>• <strong>Imposition</strong> : TMI + PS = taux global</p>
    </div>
  </div>
</div>
```

### 3. INDICATEURS CLÉS DE PERFORMANCE (KPI)

```tsx
<div className="sim-card">
  <h3 className="font-bold mb-4 text-slate-800">Indicateurs clés de performance</h3>
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
    {/* Rendement brut */}
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center">
      <div className="text-xs text-slate-500 mb-1">Rendement brut</div>
      <div className={`text-xl font-bold ${s.rendementBrut >= 5 ? 'text-emerald-600' : 'text-slate-800'}`}>{fmtPct(s.rendementBrut)}</div>
      <div className="text-xs text-slate-400 mt-1">{s.rendementBrut >= 6 ? 'Excellent' : s.rendementBrut >= 5 ? 'Bon' : 'Moyen'}</div>
    </div>
    {/* TRI */}
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-center">
      <div className="text-xs text-blue-600 mb-1">TRI</div>
      <div className="text-xl font-bold text-blue-700">{fmtPct(s.tri)}</div>
      <div className="text-xs text-slate-400 mt-1">{s.tri > 8 ? 'Excellent' : s.tri > 5 ? 'Bon' : 'Correct'}</div>
    </div>
    {/* Cash-flow/mois */}
    <div className={`p-3 rounded-lg text-center ${s.cfMoyenMois >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
      <div className={`text-xs mb-1 ${s.cfMoyenMois >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Cash-flow/mois</div>
      <div className={`text-xl font-bold ${s.cfMoyenMois >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{s.cfMoyenMois >= 0 ? '+' : ''}{fmtEur(s.cfMoyenMois)}</div>
    </div>
    {/* ... autres KPI */}
  </div>
  
  {/* Analyse de l'opération - TOUJOURS expliquer la formule du gain */}
  <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
    <h4 className="font-semibold text-slate-700 mb-2">Analyse de l'opération</h4>
    <div className="text-sm text-slate-600 space-y-2">
      <p>• <strong>Rendement brut {fmtPct(s.rendementBrut)}</strong> : Analyse dynamique</p>
      <p>• <strong>TRI {fmtPct(s.tri)}</strong> : Analyse dynamique</p>
      <p>• <strong>Cash-flow</strong> : {s.cfMoyenMois >= 0 ? `Génère ${fmtEur(s.cfMoyenMois)}/mois net.` : `Effort de ${fmtEur(Math.abs(s.cfMoyenMois))}/mois, soit ${fmtEur(Math.abs(s.cfMoyenMois) * 12 * dureeDetention)} sur ${dureeDetention} ans.`}</p>
      <p>• <strong>Gain total</strong> : Capital final ({fmtEur(s.capitalFinal)}) − Effort trésorerie − Apport = <span className={s.gainTotal >= 0 ? 'text-emerald-600' : 'text-red-600'}>{fmtSignedEur(s.gainTotal)}</span></p>
    </div>
  </div>
</div>
```

### 4. TIMELINE DES ÉVÉNEMENTS

```tsx
<div className="sim-card">
  <h3 className="font-bold mb-4 text-slate-800">📅 Timeline des événements clés</h3>
  <div className="relative">
    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-blue-200" />
    <div className="space-y-4">
      {/* Acquisition */}
      <div className="relative flex items-start pl-10">
        <div className="absolute left-2.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
        <div className="flex-1 bg-blue-50 p-3 rounded-lg border border-blue-200">
          <div className="font-semibold text-blue-800">{s.anneeAcquisition}</div>
          <div className="text-sm text-blue-700">🏠 Acquisition du bien • Investissement {fmtEur(s.investissementTotal)}</div>
        </div>
      </div>
      {/* Fin crédit */}
      <div className="relative flex items-start pl-10">
        <div className="absolute left-2.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
        <div className="flex-1 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
          <div className="font-semibold text-emerald-800">{s.anneeFinCredit}</div>
          <div className="text-sm text-emerald-700">✅ Fin du crédit immobilier</div>
        </div>
      </div>
      {/* Exonération IR */}
      <div className="relative flex items-start pl-10">
        <div className="absolute left-2.5 w-3 h-3 bg-amber-500 rounded-full border-2 border-white" />
        <div className="flex-1 bg-amber-50 p-3 rounded-lg border border-amber-200">
          <div className="font-semibold text-amber-800">{s.anneeExonerationIR}</div>
          <div className="text-sm text-amber-700">🎯 Exonération PV IR (22 ans)</div>
        </div>
      </div>
      {/* Exonération PS */}
      <div className="relative flex items-start pl-10">
        <div className="absolute left-2.5 w-3 h-3 bg-slate-500 rounded-full border-2 border-white" />
        <div className="flex-1 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <div className="font-semibold text-slate-800">{s.anneeExonerationPS}</div>
          <div className="text-sm text-slate-700">🎯 Exonération PV PS (30 ans)</div>
        </div>
      </div>
      {/* Revente */}
      {s.anneeRevente && <div className="relative flex items-start pl-10">
        <div className="absolute left-2.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        <div className="flex-1 bg-red-50 p-3 rounded-lg border border-red-200">
          <div className="font-semibold text-red-800">{s.anneeRevente}</div>
          <div className="text-sm text-red-700">📤 Revente simulée • Valeur {fmtEur(s.valeurRevente)}</div>
        </div>
      </div>}
    </div>
  </div>
</div>
```

### 5. GRAPHIQUE 1 : CASH-FLOW (FULL WIDTH)

```tsx
<div className="sim-card">
  <h3 className="font-bold mb-2 text-slate-800">Évolution du cash-flow annuel</h3>
  <p className="text-sm text-slate-500 mb-4">Trésorerie nette après toutes charges et impôts.</p>
  <div ref={chartCashflow} className="mb-4"/>
  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
    <h4 className="font-semibold text-slate-700 mb-2">Analyse du cash-flow</h4>
    <div className="text-sm text-slate-600 space-y-2">
      {s.cfMoyenMois >= 0 ? (
        <p>L'opération génère un <strong className="text-emerald-600">cash-flow positif moyen de {fmtEur(s.cfMoyenMois)}/mois</strong>.</p>
      ) : (
        <p>L'opération présente un <strong className="text-red-600">effort d'épargne de {fmtEur(Math.abs(s.cfMoyenMois))}/mois</strong>.</p>
      )}
    </div>
  </div>
</div>
```

### 6. GRAPHIQUE 2 : PATRIMOINE (FULL WIDTH)

```tsx
<div className="sim-card">
  <h3 className="font-bold mb-2 text-slate-800">Constitution du patrimoine</h3>
  <p className="text-sm text-slate-500 mb-4">Valeur du bien - capital restant dû.</p>
  <div ref={chartPatrimoine} className="mb-4"/>
  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
    <h4 className="font-semibold text-slate-700 mb-2">Analyse patrimoniale</h4>
    <div className="text-sm text-slate-600 space-y-2">
      <p>Patrimoine net de <strong className="text-blue-600">{fmtEur(s.capitalFinal)}</strong> après {dureeDetention} ans.</p>
    </div>
  </div>
</div>
```

### 7. PLUS-VALUE À LA REVENTE

```tsx
<div className="sim-card">
  <h3 className="font-bold mb-4 text-slate-800">Plus-value à la revente ({dureeDetention} ans)</h3>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="text-slate-500 text-xs">Valeur estimée</div>
      <div className="font-bold text-slate-800">{fmtEur(s.valeurRevente)}</div>
    </div>
    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
      <div className="text-emerald-600 text-xs">PV brute</div>
      <div className="font-bold text-emerald-600">+{fmtEur(s.pvBrute)}</div>
    </div>
    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="text-amber-600 text-xs">Impôt PV</div>
      <div className="font-bold text-amber-600">{fmtEur(s.pvCalc?.impotTotal || 0)}</div>
    </div>
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="text-blue-600 text-xs">PV nette</div>
      <div className="font-bold text-blue-700">+{fmtEur(s.pvCalc?.plusValueNette || 0)}</div>
    </div>
  </div>
  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
    <p>Abattement IR : {calculAbattementPVIR(dureeDetention)}% • Abattement PS : {calculAbattementPVPS(dureeDetention).toFixed(1)}%</p>
    <p className="text-xs text-blue-500 mt-1">Exonération IR après 22 ans • Exonération PS après 30 ans</p>
  </div>
</div>
```

### 8. DÉTAIL DU CALCUL (COLLAPSIBLE)

```tsx
<div className="sim-card">
  <h3 className="font-bold mb-4 text-slate-800">Détail du calcul</h3>
  <details>
    <summary className="cursor-pointer font-medium text-slate-600 text-sm">Voir le détail du calcul fiscal</summary>
    <pre className="text-xs bg-slate-50 p-4 rounded-lg mt-2 whitespace-pre-wrap font-mono overflow-x-auto border border-slate-200">{explications.join('\n')}</pre>
  </details>
</div>
```

### 9. TABLEAU DES PROJECTIONS (AVEC TOGGLE)

```tsx
<div className="sim-card">
  <div className="flex justify-between items-center mb-4">
    <h3 className="font-bold text-slate-800">Projection sur {dureeDetention} ans</h3>
    <button onClick={() => setShowDetailedTable(!showDetailedTable)} className="text-sm text-blue-600 hover:underline">
      {showDetailedTable ? 'Vue simplifiée' : 'Vue détaillée'}
    </button>
  </div>
  <div className="overflow-x-auto max-h-96">
    <table className="w-full text-xs">
      <thead className="sticky top-0">
        <tr className="border-b border-slate-200 bg-slate-100">
          <th className="py-2 px-2 text-left font-semibold text-slate-600">Année</th>
          <th className="py-2 px-2 text-right font-semibold text-slate-600">Loyer</th>
          <th className="py-2 px-2 text-right font-semibold text-slate-600">Charges</th>
          {/* ... autres colonnes selon showDetailedTable */}
        </tr>
      </thead>
      <tbody>
        {projections.map((p: any) => (
          <tr key={p.annee} className="border-b border-slate-100 hover:bg-slate-50">
            <td className="py-2 px-2 font-medium text-slate-800">{p.annee}</td>
            {/* ... autres cellules */}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
```

### 10. AVIS PROFESSIONNEL

```tsx
<div className="sim-card bg-gradient-to-br from-slate-800 to-slate-900 text-white">
  <h3 className="font-bold mb-4 text-lg">💼 Avis professionnel</h3>
  <div className="text-sm space-y-3 text-slate-200">
    {s.tri > 8 && s.cfMoyenMois >= 0 ? (
      <p><strong className="text-emerald-400">✅ Excellente opération</strong> : TRI de {fmtPct(s.tri)} avec un cash-flow positif.</p>
    ) : s.tri > 5 ? (
      <p><strong className="text-blue-400">✅ Bonne opération</strong> : TRI de {fmtPct(s.tri)} satisfaisant.</p>
    ) : (
      <p><strong className="text-amber-400">⚠️ À optimiser</strong> : TRI de {fmtPct(s.tri)} en dessous des standards.</p>
    )}
    <p className="text-slate-400 text-xs mt-4"><em>Explication spécifique au type d'investissement.</em></p>
  </div>
</div>
```

---

## 🎨 PALETTE DE COULEURS OBLIGATOIRE

### Background
```css
bg-gradient-to-br from-slate-50 via-blue-50 to-sky-50
```

### Couleurs sémantiques
| Usage | Couleur | Classes Tailwind |
|-------|---------|------------------|
| Positif | Emerald | `text-emerald-600`, `bg-emerald-50`, `border-emerald-200` |
| Négatif | Red | `text-red-600`, `bg-red-50`, `border-red-200` |
| Alerte | Amber | `text-amber-600`, `bg-amber-50`, `border-amber-200` |
| Info/TMI | Blue | `text-blue-600`, `bg-blue-50`, `border-blue-200` |
| Neutre | Slate | `text-slate-600`, `bg-slate-50`, `border-slate-200` |

### ⚠️ INTERDIT
- Violet / Purple (réservé à d'autres simulateurs non-immo)

---

## 📝 CHECKLIST AVANT VALIDATION

- [ ] Profil client avec calcul automatique TMI/IFI
- [ ] Date d'acquisition (input type="month")
- [ ] Années réelles dans les projections (2025, 2026...)
- [ ] Graphiques avec années réelles
- [ ] IFI avant/après dans les résultats
- [ ] Timeline des événements clés
- [ ] Deux graphiques SÉPARÉS (full-width)
- [ ] Analyse pédagogique après chaque graphique
- [ ] Plus-value avec abattements calculés
- [ ] Tableau projections avec toggle détail/simplifié
- [ ] Avis professionnel dynamique
- [ ] Pas de sélection TMI manuelle
- [ ] Pas de violet/purple dans l'UI

---

## 📂 SIMULATEURS - STATUT

| Simulateur | Backend | Formule gainTotal | Frontend |
|------------|---------|-------------------|----------|
| LMNP | ✅ Référence | ✅ Standard | ✅ Complet |
| Location Nue | ✅ Aligné | ✅ Standard | ✅ Complet |
| LMP | ✅ Aligné | ✅ Standard | 🔄 À vérifier |
| Pinel | ✅ Aligné | ✅ Standard | 🔄 À vérifier |
| Denormandie | ✅ Aligné | ✅ Standard | 🔄 À vérifier |
| Malraux | ✅ Aligné | ✅ Standard | 🔄 À vérifier |
| Monuments Historiques | ✅ Aligné | ✅ Standard | 🔄 À vérifier |
| Déficit Foncier | ✅ Aligné | ✅ Standard | 🔄 À vérifier |
| SCPI | ✅ Aligné | ✅ Standard | 🔄 À vérifier |
| Nue-propriété | ✅ Aligné | ✅ Standard | 🔄 À vérifier |
| Saisonnier | ✅ Aligné | ✅ Standard | 🔄 À vérifier |
| Colocation | ✅ Aligné | ✅ Standard | 🔄 À vérifier |

### Formule standard appliquée à tous
```typescript
// Capital final = valeur revente - capital restant - frais revente - impôt PV
const capitalFinal = valeurRevente - capitalRestant - fraisReventeEur - impotPV

// Gain total = Cash-flows cumulés + Capital final - Apport
const gainTotal = cashFlowCumule + capitalFinal - apport
```

---

> **Version** : 1.0  
> **Date** : Décembre 2025  
> **Auteur** : Cascade AI  
> **Basé sur** : `/app/(advisor)/(frontend)/dashboard/simulateurs/immobilier/lmnp/page.tsx`
