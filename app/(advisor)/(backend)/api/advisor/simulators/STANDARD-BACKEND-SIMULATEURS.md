# 📘 Standard Backend des Simulateurs Patrimoniaux

> **Document de référence** pour le développement des APIs de simulation.
> Basé sur le simulateur LMNP optimisé (décembre 2024).

---

## 🏗️ Architecture des Fichiers

```
/app/(advisor)/(backend)/api/advisor/simulators/
├── immobilier/
│   ├── _shared/
│   │   └── constants.ts          # Constantes partagées (barèmes, taux)
│   ├── lmnp/
│   │   └── route.ts              # API LMNP
│   ├── pinel/
│   │   └── route.ts              # API Pinel
│   ├── scpi/
│   │   └── route.ts              # API SCPI
│   └── deficit-foncier/
│       └── route.ts              # API Déficit Foncier
├── epargne/
│   ├── per-salaries/
│   ├── per-tns/
│   └── assurance-vie/
└── STANDARD-BACKEND-SIMULATEURS.md
```

---

## 📜 Constantes Fiscales Partagées

### Fichier : `_shared/constants.ts`

```typescript
// ══════════════════════════════════════════════════════════════════════════════
// BARÈME IR 2025 (CGI art. 197)
// Source: Aura Chiffres-clés Patrimoine 2025
// ══════════════════════════════════════════════════════════════════════════════

export const BAREME_IR_2025 = [
  { min: 0, max: 11497, taux: 0 },
  { min: 11497, max: 29315, taux: 0.11 },
  { min: 29315, max: 83823, taux: 0.30 },
  { min: 83823, max: 180294, taux: 0.41 },
  { min: 180294, max: Infinity, taux: 0.45 },
]

// Plafonnement du quotient familial (CGI art. 197)
export const PLAFOND_QF_2025 = 1759 // € par demi-part

// ══════════════════════════════════════════════════════════════════════════════
// PRÉLÈVEMENTS SOCIAUX 2025
// ══════════════════════════════════════════════════════════════════════════════

export const PRELEVEMENTS_SOCIAUX = {
  TAUX_GLOBAL: 0.172,        // 17.2%
  CSG: 0.092,                // 9.2%
  CRDS: 0.005,               // 0.5%
  PS: 0.045,                 // 4.5%
  CASA: 0.003,               // 0.3%
  SOLIDARITE: 0.027,         // 2.7% (prélèvement de solidarité)
  CSG_DEDUCTIBLE: 0.068,     // 6.8% (déductible du revenu imposable)
}

// ══════════════════════════════════════════════════════════════════════════════
// BARÈME IFI 2025 (CGI art. 977)
// ══════════════════════════════════════════════════════════════════════════════

export const BAREME_IFI_2025 = {
  SEUIL: 1300000,
  TRANCHES: [
    { min: 0, max: 800000, taux: 0 },
    { min: 800000, max: 1300000, taux: 0.005 },
    { min: 1300000, max: 2570000, taux: 0.007 },
    { min: 2570000, max: 5000000, taux: 0.01 },
    { min: 5000000, max: 10000000, taux: 0.0125 },
    { min: 10000000, max: Infinity, taux: 0.015 },
  ],
  DECOTE: {
    SEUIL_MIN: 1300000,
    SEUIL_MAX: 1400000,
    FORMULE: (patrimoine: number) => 17500 - 0.0125 * patrimoine,
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// PLUS-VALUE IMMOBILIÈRE (CGI art. 150 U et suivants)
// ══════════════════════════════════════════════════════════════════════════════

export const PLUS_VALUE_IMMO = {
  // Forfaits majorant le prix d'acquisition (CGI art. 150 VB II 4°)
  FORFAIT_ACQUISITION: 0.075,   // 7.5% du prix d'achat
  FORFAIT_TRAVAUX: 0.15,        // 15% du prix d'achat (si détention > 5 ans)
  
  // Taux d'imposition
  TAUX_IR: 0.19,                // 19%
  TAUX_PS: 0.172,               // 17.2%
  
  // Abattements pour durée de détention (CGI art. 150 VC)
  ABATTEMENT_IR: {
    // Exonération totale à 22 ans
    DEBUT: 6,                   // Début des abattements à partir de l'année 6
    TAUX_ANNUEL_6_21: 0.06,     // 6% par an de l'année 6 à 21
    TAUX_ANNEE_22: 0.04,        // 4% la 22e année
    EXONERATION_TOTALE: 22,
  },
  ABATTEMENT_PS: {
    // Exonération totale à 30 ans
    DEBUT: 6,
    TAUX_ANNUEL_6_21: 0.0165,   // 1.65% par an de l'année 6 à 21
    TAUX_ANNEE_22: 0.016,       // 1.60% la 22e année
    TAUX_ANNUEL_23_30: 0.09,    // 9% par an de l'année 23 à 30
    EXONERATION_TOTALE: 30,
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// MICRO-BIC 2025 (CGI art. 50-0)
// ══════════════════════════════════════════════════════════════════════════════

export const MICRO_BIC_2025 = {
  MEUBLE_CLASSIQUE: {
    plafond: 77700,
    abattement: 50,
  },
  MEUBLE_TOURISME_CLASSE: {
    plafond: 188700,
    abattement: 71,
  },
  MEUBLE_TOURISME_NON_CLASSE: {
    plafond: 15000,    // Nouveau LF 2024
    abattement: 30,    // Nouveau LF 2024
  },
  CHAMBRE_HOTE: {
    plafond: 188700,
    abattement: 71,
  },
}

// ══════════════════════════════════════════════════════════════════════════════
// SEUILS LMNP / LMP (CGI art. 155 IV)
// ══════════════════════════════════════════════════════════════════════════════

export const LMNP_PARAMS = {
  SEUIL_RECETTES_LMNP: 23000,  // Seuil de recettes pour rester LMNP
  // LMP si : recettes > 23 000€ ET recettes > autres revenus d'activité
}

// ══════════════════════════════════════════════════════════════════════════════
// DÉMEMBREMENT (CGI art. 669)
// ══════════════════════════════════════════════════════════════════════════════

export const BAREME_DEMEMBREMENT = [
  { ageMax: 20, usufruit: 90, nuePropriete: 10 },
  { ageMax: 30, usufruit: 80, nuePropriete: 20 },
  { ageMax: 40, usufruit: 70, nuePropriete: 30 },
  { ageMax: 50, usufruit: 60, nuePropriete: 40 },
  { ageMax: 60, usufruit: 50, nuePropriete: 50 },
  { ageMax: 70, usufruit: 40, nuePropriete: 60 },
  { ageMax: 80, usufruit: 30, nuePropriete: 70 },
  { ageMax: 90, usufruit: 20, nuePropriete: 80 },
  { ageMax: Infinity, usufruit: 10, nuePropriete: 90 },
]
```

---

## 🔢 Fonctions de Calcul Communes

### Fichier : `_shared/calculators.ts`

```typescript
import { BAREME_IR_2025, PLAFOND_QF_2025, BAREME_IFI_2025, PLUS_VALUE_IMMO } from './constants'

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL DU NOMBRE DE PARTS
// ══════════════════════════════════════════════════════════════════════════════

export type SituationFamiliale = 'CELIBATAIRE' | 'MARIE_PACSE' | 'DIVORCE' | 'VEUF'

export interface ProfilFiscal {
  situationFamiliale: SituationFamiliale
  enfantsACharge: number
  enfantsGardeAlternee: number
  parentIsole: boolean
}

export function calculNombreParts(profil: ProfilFiscal): number {
  // Base selon situation
  let parts = profil.situationFamiliale === 'MARIE_PACSE' ? 2 : 1
  
  // Majoration veuf avec enfant à charge
  if (profil.situationFamiliale === 'VEUF' && profil.enfantsACharge > 0) {
    parts = 2 // Comme un couple marié
  }
  
  // Enfants à charge pleine
  const enfants = profil.enfantsACharge
  if (enfants >= 1) parts += 0.5
  if (enfants >= 2) parts += 0.5
  if (enfants >= 3) parts += (enfants - 2) * 1 // 1 part par enfant à partir du 3e
  
  // Enfants en garde alternée (demi-part divisée par 2)
  const gardeAlt = profil.enfantsGardeAlternee
  if (gardeAlt >= 1) parts += 0.25
  if (gardeAlt >= 2) parts += 0.25
  if (gardeAlt >= 3) parts += (gardeAlt - 2) * 0.5
  
  // Parent isolé (T ou L sur déclaration)
  if (profil.parentIsole && (profil.enfantsACharge > 0 || profil.enfantsGardeAlternee > 0)) {
    parts += 0.5
  }
  
  return parts
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL DE L'IMPÔT SUR LE REVENU
// ══════════════════════════════════════════════════════════════════════════════

export interface ResultatIR {
  revenuImposable: number
  nombreParts: number
  quotientFamilial: number
  impotBrut: number
  impotNet: number
  plafonnementApplique: number
  tmi: number
}

export function calculIR(revenuImposable: number, nombreParts: number): ResultatIR {
  const quotient = revenuImposable / nombreParts
  
  // Calcul IR par le barème progressif
  let impotParPart = 0
  let tmi = 0
  
  for (const tranche of BAREME_IR_2025) {
    if (quotient > tranche.min) {
      const base = Math.min(quotient, tranche.max) - tranche.min
      impotParPart += base * tranche.taux
      if (quotient > tranche.min) tmi = tranche.taux * 100
    }
  }
  
  const impotBrut = impotParPart * nombreParts
  
  // Plafonnement du quotient familial (CGI art. 197 I.2)
  // Calcul de l'impôt comme si célibataire ou couple sans enfant
  const partsBase = nombreParts >= 2 ? 2 : 1 // couple = 2, seul = 1
  const partsSupp = nombreParts - partsBase
  
  // Impôt avec parts de base uniquement
  let impotBase = 0
  const quotientBase = revenuImposable / partsBase
  for (const tranche of BAREME_IR_2025) {
    if (quotientBase > tranche.min) {
      const base = Math.min(quotientBase, tranche.max) - tranche.min
      impotBase += base * tranche.taux
    }
  }
  impotBase *= partsBase
  
  // Avantage maximal autorisé
  const avantageMax = partsSupp * PLAFOND_QF_2025 * 2 // *2 car c'est par demi-part
  const avantageReel = impotBase - impotBrut
  
  // Plafonnement si avantage réel > max
  const plafonnement = Math.max(0, avantageReel - avantageMax)
  
  return {
    revenuImposable,
    nombreParts,
    quotientFamilial: quotient,
    impotBrut,
    impotNet: Math.round(impotBrut + plafonnement),
    plafonnementApplique: Math.round(plafonnement),
    tmi,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL DE L'IFI
// ══════════════════════════════════════════════════════════════════════════════

export interface ResultatIFI {
  patrimoineNet: number
  assujetti: boolean
  impotBrut: number
  decote: number
  impotNet: number
}

export function calculIFI(patrimoineNetImposable: number): ResultatIFI {
  const { SEUIL, TRANCHES, DECOTE } = BAREME_IFI_2025
  
  // Non assujetti si patrimoine < seuil
  if (patrimoineNetImposable < SEUIL) {
    return {
      patrimoineNet: patrimoineNetImposable,
      assujetti: false,
      impotBrut: 0,
      decote: 0,
      impotNet: 0,
    }
  }
  
  // Calcul par tranches
  let impot = 0
  for (const tranche of TRANCHES) {
    if (patrimoineNetImposable > tranche.min) {
      const base = Math.min(patrimoineNetImposable, tranche.max) - tranche.min
      impot += base * tranche.taux
    }
  }
  
  // Décote pour patrimoines entre 1.3M et 1.4M
  let decote = 0
  if (patrimoineNetImposable >= DECOTE.SEUIL_MIN && patrimoineNetImposable <= DECOTE.SEUIL_MAX) {
    decote = Math.max(0, DECOTE.FORMULE(patrimoineNetImposable))
  }
  
  return {
    patrimoineNet: patrimoineNetImposable,
    assujetti: true,
    impotBrut: Math.round(impot),
    decote: Math.round(decote),
    impotNet: Math.max(0, Math.round(impot - decote)),
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL DE LA PLUS-VALUE IMMOBILIÈRE
// ══════════════════════════════════════════════════════════════════════════════

export interface ParamsPlusValue {
  prixCession: number
  prixAcquisition: number
  fraisAcquisitionReels: number
  travauxReels: number
  dureeDetention: number
  amortissementsReintegres?: number // LF 2024 pour LMNP
}

export interface ResultatPlusValue {
  prixCession: number
  prixAcquisitionMajore: number
  prixAcquisitionRectifie: number
  plusValueBrute: number
  plusValueBruteSansReforme: number
  abattementIR: number
  abattementPS: number
  pvImposableIR: number
  pvImposablePS: number
  impotIR: number
  impotPS: number
  impotTotal: number
  plusValueNette: number
}

export function calculPlusValue(params: ParamsPlusValue): ResultatPlusValue {
  const { FORFAIT_ACQUISITION, FORFAIT_TRAVAUX, TAUX_IR, TAUX_PS, ABATTEMENT_IR, ABATTEMENT_PS } = PLUS_VALUE_IMMO
  
  // 1. Prix d'acquisition majoré
  const forfaitAcq = Math.round(params.prixAcquisition * FORFAIT_ACQUISITION)
  const forfaitTrav = params.dureeDetention > 5 ? Math.round(params.prixAcquisition * FORFAIT_TRAVAUX) : 0
  
  // On prend le MAX entre forfait et réel
  const majorationAcquisition = Math.max(forfaitAcq, params.fraisAcquisitionReels)
  const majorationTravaux = Math.max(forfaitTrav, params.travauxReels)
  
  const prixAcquisitionMajore = params.prixAcquisition + majorationAcquisition + majorationTravaux
  
  // 2. Réintégration amortissements (LF 2024 - LMNP uniquement)
  const amortReintegres = params.amortissementsReintegres || 0
  const prixAcquisitionRectifie = prixAcquisitionMajore - amortReintegres
  
  // 3. Plus-value brute
  const pvBrute = Math.max(0, params.prixCession - prixAcquisitionRectifie)
  const pvBruteSansReforme = Math.max(0, params.prixCession - prixAcquisitionMajore)
  
  // 4. Abattements pour durée de détention
  let abattIR = 0
  if (params.dureeDetention >= ABATTEMENT_IR.EXONERATION_TOTALE) {
    abattIR = 100
  } else if (params.dureeDetention >= ABATTEMENT_IR.DEBUT) {
    const anneesEligibles = params.dureeDetention - ABATTEMENT_IR.DEBUT + 1
    abattIR = Math.min(anneesEligibles, 16) * ABATTEMENT_IR.TAUX_ANNUEL_6_21 * 100
    if (params.dureeDetention >= 22) abattIR += ABATTEMENT_IR.TAUX_ANNEE_22 * 100
  }
  
  let abattPS = 0
  if (params.dureeDetention >= ABATTEMENT_PS.EXONERATION_TOTALE) {
    abattPS = 100
  } else if (params.dureeDetention >= ABATTEMENT_PS.DEBUT) {
    const anneesPhase1 = Math.min(params.dureeDetention - ABATTEMENT_PS.DEBUT + 1, 16)
    abattPS = anneesPhase1 * ABATTEMENT_PS.TAUX_ANNUEL_6_21 * 100
    if (params.dureeDetention >= 22) {
      abattPS += ABATTEMENT_PS.TAUX_ANNEE_22 * 100
      if (params.dureeDetention > 22) {
        abattPS += Math.min(params.dureeDetention - 22, 8) * ABATTEMENT_PS.TAUX_ANNUEL_23_30 * 100
      }
    }
  }
  
  // 5. Plus-values imposables
  const pvImposableIR = pvBrute * (1 - abattIR / 100)
  const pvImposablePS = pvBrute * (1 - abattPS / 100)
  
  // 6. Impôts
  const impotIR = Math.round(pvImposableIR * TAUX_IR)
  const impotPS = Math.round(pvImposablePS * TAUX_PS)
  
  return {
    prixCession: params.prixCession,
    prixAcquisitionMajore,
    prixAcquisitionRectifie,
    plusValueBrute: pvBrute,
    plusValueBruteSansReforme: pvBruteSansReforme,
    abattementIR: Math.round(abattIR * 10) / 10,
    abattementPS: Math.round(abattPS * 10) / 10,
    pvImposableIR: Math.round(pvImposableIR),
    pvImposablePS: Math.round(pvImposablePS),
    impotIR,
    impotPS,
    impotTotal: impotIR + impotPS,
    plusValueNette: pvBrute - impotIR - impotPS,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL DU TRI (Taux de Rentabilité Interne)
// ══════════════════════════════════════════════════════════════════════════════

export function calculTRI(cashFlows: number[], iterations: number = 100): number {
  // Méthode de Newton-Raphson
  let taux = 0.1 // Estimation initiale 10%
  
  for (let i = 0; i < iterations; i++) {
    let van = 0
    let derivee = 0
    
    for (let t = 0; t < cashFlows.length; t++) {
      const facteur = Math.pow(1 + taux, t)
      van += cashFlows[t] / facteur
      derivee -= t * cashFlows[t] / Math.pow(1 + taux, t + 1)
    }
    
    if (Math.abs(derivee) < 1e-10) break
    
    const nouveauTaux = taux - van / derivee
    if (Math.abs(nouveauTaux - taux) < 1e-8) break
    
    taux = nouveauTaux
  }
  
  return Math.round(taux * 10000) / 100 // Arrondi à 2 décimales
}
```

---

## 📋 Structure de Réponse API Standard

```typescript
interface SimulationResponse {
  // Synthèse globale
  synthese: {
    investTotal: number
    apport: number
    montantCredit: number
    rentaBrute: number
    tri: number
    cashFlowCumule: number
    cashFlowMoyenMensuel: number
    irCumule: number
    psCumule: number
    gainTotal: number
    amortCumule?: number
    amortDiffereRestant?: number
  }
  
  // Détail plus-value (si applicable)
  plusValue?: {
    valeurRevente: number
    prixAchat: number
    forfaitAcquisition: number
    majorationAcquisition: number
    forfaitTravaux: number
    majorationTravaux: number
    prixAcquisitionMajore: number
    amortissementsReintegres?: number
    prixAcquisitionRectifie: number
    plusValueBrute: number
    plusValueBruteSansReforme?: number
    abattementIR: number
    abattementPS: number
    impotIR: number
    impotPS: number
    impotTotal: number
    capitalFinal: number
  }
  
  // Profil client
  profilClient: {
    nombreParts: number
    tmi: number
    irAvant: number
    irBrut: number
    plafonnementQF: number
    ifiAvant: number
    assujettiIFIAvant: boolean
    ifiApres: number
    assujettiIFIApres: boolean
  }
  
  // Fiscalité spécifique
  fiscalite: {
    regimeFiscal: string
    // ... autres paramètres selon dispositif
  }
  
  // Projections annuelles
  projections: Projection[]
  
  // Alertes contextuelles
  alertes: Alerte[]
}

interface Projection {
  annee: number
  loyer: number
  charges: number
  interets: number
  capitalRembourse: number
  capitalRestant: number
  amortissement?: number
  amortUtilise?: number
  amortDiffere?: number
  baseImposable: number
  ir: number
  ps: number
  cfAvantImpots: number
  cfApresImpots: number
  valeurBien: number
  capitalNet: number
}

interface Alerte {
  type: 'info' | 'warning' | 'error'
  code: string
  titre: string
  message: string
  valeur?: number
}
```

---

## 🔒 Validation des Entrées

```typescript
function validateSimulationInput(input: any): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  
  // === VALIDATIONS OBLIGATOIRES ===
  
  // Profil client
  if (!['CELIBATAIRE', 'MARIE_PACSE', 'DIVORCE', 'VEUF'].includes(input.situationFamiliale)) {
    errors.push('Situation familiale invalide')
  }
  
  if (typeof input.enfantsACharge !== 'number' || input.enfantsACharge < 0) {
    errors.push('Nombre d\'enfants à charge invalide')
  }
  
  // Revenus
  if (typeof input.revenusSalaires !== 'number' || input.revenusSalaires < 0) {
    errors.push('Revenus salaires invalides')
  }
  
  // === VALIDATIONS SPÉCIFIQUES AU DISPOSITIF ===
  
  // Exemple LMNP
  if (input.prixAchat <= 0) {
    errors.push('Prix d\'achat doit être positif')
  }
  
  if (input.loyerMensuel <= 0) {
    errors.push('Loyer mensuel doit être positif')
  }
  
  if (input.dureeCredit < 1 || input.dureeCredit > 30) {
    errors.push('Durée du crédit doit être entre 1 et 30 ans')
  }
  
  // === WARNINGS (non bloquants) ===
  
  if (input.tauxCredit > 6) {
    warnings.push('Taux de crédit élevé (> 6%)')
  }
  
  const rendementBrut = (input.loyerMensuel * 12) / input.prixAchat * 100
  if (rendementBrut < 3) {
    warnings.push('Rendement brut faible (< 3%)')
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
```

---

## 📊 Génération des Alertes

```typescript
function generateAlertes(input: SimulationInput, resultats: Synthese): Alerte[] {
  const alertes: Alerte[] = []
  
  // === ALERTES COMMUNES ===
  
  // Cash-flow négatif important
  if (resultats.cashFlowMoyenMensuel < -500) {
    alertes.push({
      type: 'warning',
      code: 'EFFORT_IMPORTANT',
      titre: 'Effort d\'épargne important',
      message: `Un effort mensuel de ${Math.abs(resultats.cashFlowMoyenMensuel)}€ est à prévoir pendant la durée du crédit.`,
      valeur: resultats.cashFlowMoyenMensuel,
    })
  }
  
  // TRI faible
  if (resultats.tri < 3) {
    alertes.push({
      type: 'warning',
      code: 'TRI_FAIBLE',
      titre: 'Rentabilité modeste',
      message: `Le TRI de ${resultats.tri}% est inférieur au taux sans risque. Envisagez des optimisations.`,
      valeur: resultats.tri,
    })
  }
  
  // Impact IFI
  if (resultats.profilClient.ifiApres > resultats.profilClient.ifiAvant) {
    const impact = resultats.profilClient.ifiApres - resultats.profilClient.ifiAvant
    alertes.push({
      type: 'info',
      code: 'IMPACT_IFI',
      titre: 'Impact IFI',
      message: `Cette acquisition augmente votre IFI de ${impact}€/an.`,
      valeur: impact,
    })
  }
  
  // === ALERTES SPÉCIFIQUES LMNP ===
  
  // Seuil LMNP
  const loyerAnnuel = input.loyerMensuel * 12
  if (loyerAnnuel + (input.revenusBICExistants || 0) > LMNP_PARAMS.SEUIL_RECETTES_LMNP) {
    alertes.push({
      type: 'warning',
      code: 'SEUIL_LMNP',
      titre: 'Seuil LMNP dépassé',
      message: `Avec ${loyerAnnuel + input.revenusBICExistants}€ de recettes BIC, vous dépassez le seuil de 23 000€. Risque de basculement en LMP.`,
    })
  }
  
  // Réintégration amortissements (LF 2024)
  if (resultats.amortCumule > 0) {
    alertes.push({
      type: 'info',
      code: 'LF_2024',
      titre: 'Réforme LF 2024',
      message: `Les amortissements pratiqués (${resultats.amortCumule}€) seront réintégrés au calcul de la plus-value à la revente.`,
      valeur: resultats.amortCumule,
    })
  }
  
  return alertes
}
```

---

## 📁 Checklist Backend

- [ ] Constantes fiscales 2025 à jour avec sources
- [ ] Calcul nombre de parts conforme CGI
- [ ] Calcul IR avec plafonnement QF
- [ ] Calcul IFI si applicable
- [ ] Calcul plus-value avec forfaits (7.5% / 15%)
- [ ] Réintégration amortissements si LMNP (LF 2024)
- [ ] Calcul TRI correct
- [ ] Validation des entrées exhaustive
- [ ] Génération d'alertes contextuelles
- [ ] Réponse JSON structurée et complète
- [ ] Gestion des erreurs avec codes HTTP appropriés
- [ ] Tests unitaires des fonctions de calcul

---

*Dernière mise à jour : Décembre 2024*
