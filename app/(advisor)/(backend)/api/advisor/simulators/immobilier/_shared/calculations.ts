/**
 * Fonctions de calcul partagées - Simulateurs Immobilier
 * SÉCURISÉES - Côté serveur uniquement
 */

import {
  BAREME_IR_2025,
  DECOTE_IR_2025,
  CEHR_2025,
  PLAFOND_QF_2025,
  BAREME_IFI,
  PLUS_VALUE_IMMOBILIERE,
  BAREME_DEMEMBREMENT,
} from './constants'

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL DU NOMBRE DE PARTS FISCALES
// ══════════════════════════════════════════════════════════════════════════════

export interface ProfilFiscalInput {
  situationFamiliale: 'CELIBATAIRE' | 'MARIE_PACSE' | 'VEUF'
  enfantsACharge: number
  enfantsGardeAlternee?: number
  parentIsole?: boolean
}

export function calculNombreParts(input: ProfilFiscalInput): number {
  let parts = input.situationFamiliale === 'CELIBATAIRE' ? 1 : 2

  // Veuf avec enfant = 2.5 parts minimum
  if (input.situationFamiliale === 'VEUF' && input.enfantsACharge > 0) {
    parts = 2
  }

  // Enfants à charge
  const enfants = input.enfantsACharge
  if (enfants >= 1) parts += 0.5
  if (enfants >= 2) parts += 0.5
  if (enfants >= 3) parts += (enfants - 2) * 1

  // Enfants en garde alternée (demi-part)
  const gardeAlternee = input.enfantsGardeAlternee || 0
  if (gardeAlternee >= 1) parts += 0.25
  if (gardeAlternee >= 2) parts += 0.25
  if (gardeAlternee >= 3) parts += (gardeAlternee - 2) * 0.5

  // Parent isolé (case T)
  if (input.parentIsole && (input.enfantsACharge > 0 || gardeAlternee > 0)) {
    parts += 0.5
  }

  return parts
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL IR DÉTAILLÉ
// ══════════════════════════════════════════════════════════════════════════════

export interface ResultatIR {
  revenuImposable: number
  quotientFamilial: number
  nombreParts: number
  impotBrut: number
  impotNet: number
  tmi: number
  tauxMoyen: number
  plafonnementApplique: number
  detailTranches: Array<{
    tranche: string
    base: number
    taux: number
    impot: number
  }>
}

function calculIRBrutSansPlafond(revenuImposable: number, nombreParts: number) {
  const quotientFamilial = revenuImposable / nombreParts
  let impotParPart = 0

  for (const tranche of BAREME_IR_2025) {
    if (quotientFamilial > tranche.min) {
      const base = Math.min(quotientFamilial, tranche.max) - tranche.min
      impotParPart += base * (tranche.taux / 100)
    }
  }

  return Math.round(impotParPart * nombreParts)
}

export function calculIRDetaille(
  revenuImposable: number,
  nombreParts: number,
  options?: { 
    parentIsole?: boolean
    isCouple?: boolean      // Marié/Pacsé pour décote
    isVeufAvecEnfant?: boolean  // Veuf avec enfant (part non plafonnée)
    applyDecote?: boolean   // Appliquer la décote (défaut: true)
    applyCEHR?: boolean     // Appliquer CEHR (défaut: true)
  }
): ResultatIR {
  const {
    parentIsole = false,
    isCouple = nombreParts >= 2,
    isVeufAvecEnfant = false,
    applyDecote = true,
    applyCEHR = true
  } = options || {}

  const quotientFamilial = revenuImposable / nombreParts
  let impotParPart = 0
  let tmi = 0
  const detailTranches: ResultatIR['detailTranches'] = []

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 1 : Calcul IR brut par tranche progressive
  // ═══════════════════════════════════════════════════════════════════════════
  for (const tranche of BAREME_IR_2025) {
    if (quotientFamilial > tranche.min) {
      const base = Math.min(quotientFamilial, tranche.max) - tranche.min
      const impotTranche = base * (tranche.taux / 100)
      impotParPart += impotTranche

      if (tranche.taux > 0) {
        detailTranches.push({
          tranche: `${tranche.min.toLocaleString('fr-FR')} € - ${tranche.max === Infinity ? '∞' : tranche.max.toLocaleString('fr-FR')} €`,
          base: Math.round(base * nombreParts),
          taux: tranche.taux,
          impot: Math.round(impotTranche * nombreParts),
        })
      }

      if (quotientFamilial > tranche.min && tranche.taux > tmi) {
        tmi = tranche.taux
      }
    }
  }

  const impotBrut = Math.round(impotParPart * nombreParts)

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 2 : Plafonnement du quotient familial (CGI art. 197 I-2°)
  // ═══════════════════════════════════════════════════════════════════════════
  // Règles 2025 (revenus 2024) :
  // - Plafond général : 1 759 € par demi-part supplémentaire
  // - Parent isolé (case T) : 1ère demi-part pour 1er enfant = 4 149 €
  // - Veuf avec enfant : la part supplémentaire (1→2) n'est PAS plafonnée
  // - Quart de part (garde alternée) : 879,50 € (= 1759/2)
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Déterminer les parts de référence (sans avantages plafonnés)
  let partsReference = isCouple ? 2 : 1
  
  // Veuf avec enfant : la part supplémentaire n'est pas plafonnée
  if (isVeufAvecEnfant) {
    partsReference = 2 // Le veuf garde 2 parts, cette part n'entre pas dans le plafonnement
  }
  
  const impotReference = calculIRBrutSansPlafond(revenuImposable, partsReference)
  const avantageQF = Math.max(0, impotReference - impotBrut)
  
  // Calcul du plafond selon la composition du foyer
  const partsSupplémentaires = nombreParts - partsReference
  let plafondTotal = 0
  
  if (parentIsole && partsSupplémentaires > 0) {
    // Parent isolé : 1ère demi-part = 4 149 €, les autres = 1 759 €
    plafondTotal = PLAFOND_QF_2025.PARENT_ISOLE_PREMIERE
    const autresDemiParts = Math.max(0, partsSupplémentaires * 2 - 1)
    plafondTotal += autresDemiParts * PLAFOND_QF_2025.GENERAL
  } else {
    // Cas général : toutes les demi-parts au plafond général
    // Gestion des quarts de part (garde alternée)
    const demiPartsEntieres = Math.floor(partsSupplémentaires * 2)
    const aQuartDePart = (partsSupplémentaires * 2) % 1 !== 0
    
    plafondTotal = demiPartsEntieres * PLAFOND_QF_2025.GENERAL
    if (aQuartDePart) {
      plafondTotal += PLAFOND_QF_2025.GENERAL / 2 // 879,50 € par quart de part
    }
  }

  const avantageRetenu = Math.min(avantageQF, plafondTotal)
  const plafonnementApplique = Math.max(0, avantageQF - avantageRetenu)
  const impotApresPlafonnement = Math.max(0, impotReference - avantageRetenu)

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 3 : Application de la décote (CGI art. 197 I-4°)
  // ═══════════════════════════════════════════════════════════════════════════
  let decote = 0
  let impotApresDecote = impotApresPlafonnement

  if (applyDecote && impotApresPlafonnement > 0) {
    const decoteParams = isCouple ? DECOTE_IR_2025.COUPLE : DECOTE_IR_2025.SEUL
    
    if (impotApresPlafonnement < decoteParams.SEUIL) {
      // Décote = plafond - (IR × taux)
      decote = Math.max(0, decoteParams.PLAFOND - impotApresPlafonnement * decoteParams.TAUX)
      impotApresDecote = Math.max(0, impotApresPlafonnement - decote)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ÉTAPE 4 : CEHR - Contribution Exceptionnelle Hauts Revenus (CGI art. 223 sexies)
  // ═══════════════════════════════════════════════════════════════════════════
  let cehr = 0

  if (applyCEHR && revenuImposable > 0) {
    const cehrTranches = isCouple ? CEHR_2025.COUPLE : CEHR_2025.SEUL
    
    for (const tranche of cehrTranches) {
      if (revenuImposable > tranche.min) {
        const base = Math.min(revenuImposable, tranche.max) - tranche.min
        cehr += base * (tranche.taux / 100)
      }
    }
  }

  // IR final
  const impotNet = Math.round(impotApresDecote + cehr)

  const tauxMoyen = revenuImposable > 0 ? (impotNet / revenuImposable) * 100 : 0

  return {
    revenuImposable,
    quotientFamilial: Math.round(quotientFamilial),
    nombreParts,
    impotBrut,
    impotNet,
    tmi,
    tauxMoyen: Math.round(tauxMoyen * 100) / 100,
    plafonnementApplique: Math.round(plafonnementApplique),
    detailTranches,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL IFI
// ══════════════════════════════════════════════════════════════════════════════

export interface ResultatIFI {
  patrimoineNet: number
  assujetti: boolean
  impotBrut: number
  decote: number
  impotNet: number
  detailTranches: Array<{
    tranche: string
    base: number
    taux: number
    impot: number
  }>
}

export function calculIFI(params: {
  patrimoineImmobilierBrut: number
  dettesDeductibles: number
  valeurRP?: number
}): ResultatIFI {
  // Abattement 30% sur RP
  const rpNette = (params.valeurRP || 0) * (1 - BAREME_IFI.ABATTEMENT_RP)
  const patrimoineNet = params.patrimoineImmobilierBrut - params.dettesDeductibles - (params.valeurRP || 0) + rpNette

  if (patrimoineNet < BAREME_IFI.SEUIL) {
    return {
      patrimoineNet: Math.round(patrimoineNet),
      assujetti: false,
      impotBrut: 0,
      decote: 0,
      impotNet: 0,
      detailTranches: [],
    }
  }

  let impotBrut = 0
  const detailTranches: ResultatIFI['detailTranches'] = []

  for (const tranche of BAREME_IFI.TRANCHES) {
    if (patrimoineNet > tranche.min) {
      const base = Math.min(patrimoineNet, tranche.max) - tranche.min
      const impotTranche = base * (tranche.taux / 100)
      impotBrut += impotTranche

      if (tranche.taux > 0) {
        detailTranches.push({
          tranche: `${tranche.min.toLocaleString('fr-FR')} € - ${tranche.max === Infinity ? '∞' : tranche.max.toLocaleString('fr-FR')} €`,
          base: Math.round(base),
          taux: tranche.taux,
          impot: Math.round(impotTranche),
        })
      }
    }
  }

  // Décote entre 1.3M et 1.4M
  let decote = 0
  if (patrimoineNet >= BAREME_IFI.DECOTE.MIN && patrimoineNet <= BAREME_IFI.DECOTE.MAX) {
    decote = Math.max(0, BAREME_IFI.DECOTE.FORMULE(patrimoineNet))
  }

  const impotNet = Math.max(0, Math.round(impotBrut - decote))

  return {
    patrimoineNet: Math.round(patrimoineNet),
    assujetti: true,
    impotBrut: Math.round(impotBrut),
    decote: Math.round(decote),
    impotNet,
    detailTranches,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL MENSUALITÉ CRÉDIT
// ══════════════════════════════════════════════════════════════════════════════

export function calculMensualiteCredit(
  capital: number,
  tauxAnnuel: number,
  dureeAnnees: number
): number {
  if (capital <= 0 || dureeAnnees <= 0) return 0
  const tauxMensuel = tauxAnnuel / 100 / 12
  const nbMensualites = dureeAnnees * 12
  if (tauxMensuel === 0) return capital / nbMensualites
  return capital * (tauxMensuel * Math.pow(1 + tauxMensuel, nbMensualites)) /
    (Math.pow(1 + tauxMensuel, nbMensualites) - 1)
}

// ══════════════════════════════════════════════════════════════════════════════
// TABLEAU D'AMORTISSEMENT
// ══════════════════════════════════════════════════════════════════════════════

export interface LigneAmortissement {
  annee: number
  capitalDebut: number
  interets: number
  capitalRembourse: number
  capitalFin: number
  mensualite: number
}

export function calculTableauAmortissement(
  capital: number,
  tauxAnnuel: number,
  dureeAnnees: number
): LigneAmortissement[] {
  const tableau: LigneAmortissement[] = []
  const tauxMensuel = tauxAnnuel / 100 / 12
  const mensualite = calculMensualiteCredit(capital, tauxAnnuel, dureeAnnees)

  let capitalRestant = capital

  for (let annee = 1; annee <= dureeAnnees; annee++) {
    const capitalDebut = capitalRestant
    let interetsAnnee = 0
    let capitalAnnee = 0

    for (let mois = 1; mois <= 12; mois++) {
      if (capitalRestant <= 0) break
      const interetsMois = capitalRestant * tauxMensuel
      const capitalMois = Math.min(mensualite - interetsMois, capitalRestant)
      capitalRestant -= capitalMois
      interetsAnnee += interetsMois
      capitalAnnee += capitalMois
    }

    tableau.push({
      annee,
      capitalDebut: Math.round(capitalDebut),
      interets: Math.round(interetsAnnee),
      capitalRembourse: Math.round(capitalAnnee),
      capitalFin: Math.max(0, Math.round(capitalRestant)),
      mensualite: Math.round(mensualite),
    })
  }

  return tableau
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL PLUS-VALUE IMMOBILIÈRE
// ══════════════════════════════════════════════════════════════════════════════

export interface ResultatPlusValue {
  plusValueBrute: number
  dureeDetention: number
  abattementIR: number
  abattementPS: number
  plusValueImposableIR: number
  plusValueImposablePS: number
  impotIR: number
  prelevementsSociaux: number
  surtaxe: number
  impotTotal: number
  plusValueNette: number
}

export function calculImpotPlusValue(
  prixAcquisition: number,
  prixRevente: number,
  dureeDetention: number,
  fraisAcquisition?: number,
  travauxDeductibles?: number
): ResultatPlusValue {
  // Prix de revient = prix + frais + travaux
  const prixRevient = prixAcquisition + (fraisAcquisition || prixAcquisition * 0.075) + (travauxDeductibles || 0)
  const plusValueBrute = Math.max(0, prixRevente - prixRevient)

  if (plusValueBrute <= 0) {
    return {
      plusValueBrute: 0,
      dureeDetention,
      abattementIR: 0,
      abattementPS: 0,
      plusValueImposableIR: 0,
      plusValueImposablePS: 0,
      impotIR: 0,
      prelevementsSociaux: 0,
      surtaxe: 0,
      impotTotal: 0,
      plusValueNette: 0,
    }
  }

  const annees = Math.floor(dureeDetention)

  // Abattement IR (exonération totale après 22 ans)
  let abattementIR = 0
  if (annees >= 22) {
    abattementIR = 100
  } else if (annees > 5) {
    abattementIR = Math.min(100, 6 * (annees - 5))
  }

  // Abattement PS (exonération totale après 30 ans)
  let abattementPS = 0
  if (annees >= 30) {
    abattementPS = 100
  } else if (annees > 5) {
    if (annees <= 21) {
      abattementPS = 1.65 * (annees - 5)
    } else if (annees === 22) {
      abattementPS = 1.65 * 16 + 1.60
    } else {
      abattementPS = 1.65 * 16 + 1.60 + 9 * (annees - 22)
    }
    abattementPS = Math.min(100, abattementPS)
  }

  const plusValueImposableIR = plusValueBrute * (1 - abattementIR / 100)
  const plusValueImposablePS = plusValueBrute * (1 - abattementPS / 100)

  // Impôt IR (19%)
  const impotIR = plusValueImposableIR * (PLUS_VALUE_IMMOBILIERE.TAUX_IR / 100)

  // Prélèvements sociaux (17.2%)
  const prelevementsSociaux = plusValueImposablePS * (PLUS_VALUE_IMMOBILIERE.TAUX_PS / 100)

  // Surtaxe sur PV élevées
  let surtaxe = 0
  if (plusValueImposableIR > 50000) {
    if (plusValueImposableIR <= 100000) {
      surtaxe = (plusValueImposableIR - 50000) * 0.02
    } else if (plusValueImposableIR <= 150000) {
      surtaxe = plusValueImposableIR * 0.03
    } else if (plusValueImposableIR <= 200000) {
      surtaxe = plusValueImposableIR * 0.04
    } else if (plusValueImposableIR <= 250000) {
      surtaxe = plusValueImposableIR * 0.05
    } else {
      surtaxe = plusValueImposableIR * 0.06
    }
  }

  const impotTotal = Math.round(impotIR + prelevementsSociaux + surtaxe)
  const plusValueNette = plusValueBrute - impotTotal

  return {
    plusValueBrute: Math.round(plusValueBrute),
    dureeDetention,
    abattementIR: Math.round(abattementIR * 10) / 10,
    abattementPS: Math.round(abattementPS * 10) / 10,
    plusValueImposableIR: Math.round(plusValueImposableIR),
    plusValueImposablePS: Math.round(plusValueImposablePS),
    impotIR: Math.round(impotIR),
    prelevementsSociaux: Math.round(prelevementsSociaux),
    surtaxe: Math.round(surtaxe),
    impotTotal,
    plusValueNette: Math.round(plusValueNette),
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL TRI (Taux de Rentabilité Interne)
// ══════════════════════════════════════════════════════════════════════════════

export function calculTRI(fluxTresorerie: number[], maxIterations = 100): number {
  // Newton-Raphson
  let tri = 0.05
  const tolerance = 0.0001

  for (let i = 0; i < maxIterations; i++) {
    let van = 0
    let derivee = 0

    for (let t = 0; t < fluxTresorerie.length; t++) {
      van += fluxTresorerie[t] / Math.pow(1 + tri, t)
      derivee -= t * fluxTresorerie[t] / Math.pow(1 + tri, t + 1)
    }

    if (Math.abs(derivee) < 1e-10) break

    const nouveauTri = tri - van / derivee

    if (Math.abs(nouveauTri - tri) < tolerance) {
      return Math.round(nouveauTri * 10000) / 100
    }

    tri = nouveauTri
  }

  return Math.round(tri * 10000) / 100
}

// ══════════════════════════════════════════════════════════════════════════════
// UTILITAIRES DÉMEMBREMENT
// ══════════════════════════════════════════════════════════════════════════════

export function getUsufruit(age: number): number {
  const tranche = BAREME_DEMEMBREMENT.find(t => age <= t.ageMax)
  return tranche?.usufruit || 10
}

export function getNuePropriete(age: number): number {
  return 100 - getUsufruit(age)
}

// ══════════════════════════════════════════════════════════════════════════════
// VÉRIFICATION PLAFOND NICHES FISCALES
// ══════════════════════════════════════════════════════════════════════════════

export function verifierPlafondNiches(
  reductionsActuelles: number,
  nouvelleReduction: number,
  outreMer = false
): {
  respecte: boolean
  disponible: number
  exces: number
} {
  const plafond = outreMer ? 18000 : 10000
  const total = reductionsActuelles + nouvelleReduction
  const disponible = Math.max(0, plafond - reductionsActuelles)
  const exces = Math.max(0, total - plafond)

  return {
    respecte: total <= plafond,
    disponible,
    exces,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// CALCUL COTISATIONS SSI LMP (2025)
// Source : URSSAF - https://mon-entreprise.urssaf.fr
// ══════════════════════════════════════════════════════════════════════════════

import { LMP } from './constants'
import { logger } from '@/app/_common/lib/logger'
export interface SSICalculResult {
  estLMP: boolean
  cotisationsTotal: number
  cotisationsHorsCSG: number
  csgCrds: number
  details: {
    maladie: number
    retraiteBase: number
    retraiteComplementaire: number
    invaliditeDeces: number
    allocationsFamiliales: number
    cfp: number
    csgCrds: number
  }
  minimumApplied: boolean
  beneficeNet: number
  netApresCotisations: number
}

/**
 * Vérifie si les conditions du statut LMP sont remplies
 * - Recettes > 23 000 € ET
 * - Recettes > 50% des revenus professionnels du foyer
 */
export function verifierStatutLMP(
  recettesLocatives: number,
  autresRevenusProfessionnels: number
): boolean {
  const revenusTotaux = recettesLocatives + autresRevenusProfessionnels
  return (
    recettesLocatives > LMP.SEUIL_RECETTES &&
    recettesLocatives > revenusTotaux * LMP.SEUIL_PART_REVENUS
  )
}

/**
 * Calcule le taux global SSI selon le niveau de bénéfice
 * Taux progressif de 35% (bas revenus) à 45% (hauts revenus)
 */
function calculTauxSSI(beneficeNet: number): number {
  const PASS = LMP.SSI.PASS_2025
  
  // Taux progressif basé sur le rapport bénéfice / PASS
  if (beneficeNet <= 0) return 0
  if (beneficeNet <= PASS * 0.5) return LMP.SSI.TAUX_MIN // ~35%
  if (beneficeNet <= PASS) return (LMP.SSI.TAUX_MIN + LMP.SSI.TAUX_MOYEN) / 2 // ~37.5%
  if (beneficeNet <= PASS * 2) return LMP.SSI.TAUX_MOYEN // ~40%
  return LMP.SSI.TAUX_MAX // ~45%
}

/**
 * Calcule les cotisations SSI détaillées pour un LMP
 * 
 * @param recettes - Recettes locatives brutes annuelles
 * @param beneficeNetFiscal - Bénéfice BIC net (après amortissements et charges)
 * @param autresRevenusPro - Autres revenus professionnels du foyer
 * @returns Détail des cotisations SSI
 */
export function calculCotisationsSSI(
  recettes: number,
  beneficeNetFiscal: number,
  autresRevenusPro: number,
  forceCalcul: boolean = true // Par défaut, toujours calculer pour afficher les détails
): SSICalculResult {
  // Vérifier statut LMP
  const estLMP = verifierStatutLMP(recettes, autresRevenusPro)
  
  // Si pas LMP et pas de forçage, retourner zéros
  if (!estLMP && !forceCalcul) {
    return {
      estLMP: false,
      cotisationsTotal: 0,
      cotisationsHorsCSG: 0,
      csgCrds: 0,
      details: {
        maladie: 0,
        retraiteBase: 0,
        retraiteComplementaire: 0,
        invaliditeDeces: 0,
        allocationsFamiliales: 0,
        cfp: 0,
        csgCrds: 0,
      },
      minimumApplied: false,
      beneficeNet: beneficeNetFiscal,
      netApresCotisations: beneficeNetFiscal,
    }
  }
  
  // Base de calcul = bénéfice net fiscal (après amortissement)
  // En cas de déficit, base ramenée à 0 pour cotisations (pas de report)
  const baseCotisations = Math.max(0, beneficeNetFiscal)
  const PASS = LMP.SSI.PASS_2025
  
  // Calcul des cotisations par composante (taux moyens)
  const tauxMaladie = baseCotisations <= PASS * 0.4 
    ? LMP.SSI.MALADIE_TAUX_MIN 
    : (baseCotisations <= PASS ? 0.15 : LMP.SSI.MALADIE_TAUX_MAX)
  
  let maladie = baseCotisations * tauxMaladie
  let retraiteBase = baseCotisations * LMP.SSI.RETRAITE_BASE
  const retraiteComplementaire = baseCotisations * ((LMP.SSI.RETRAITE_COMPLEMENTAIRE_MIN + LMP.SSI.RETRAITE_COMPLEMENTAIRE_MAX) / 2)
  let invaliditeDeces = baseCotisations * ((LMP.SSI.INVALIDITE_DECES_MIN + LMP.SSI.INVALIDITE_DECES_MAX) / 2)
  const allocationsFamiliales = baseCotisations * ((LMP.SSI.ALLOCATIONS_FAMILIALES_MIN + LMP.SSI.ALLOCATIONS_FAMILIALES_MAX) / 2)
  let cfp = PASS * 0.0025 // Forfaitaire sur 1 PASS
  
  // Appliquer les minimums obligatoires
  let minimumApplied = false
  
  maladie = Math.max(maladie, LMP.SSI.MINIMUM_MALADIE_IJ)
  if (retraiteBase < LMP.SSI.MINIMUM_RETRAITE_BASE) {
    retraiteBase = LMP.SSI.MINIMUM_RETRAITE_BASE
    minimumApplied = true
  }
  invaliditeDeces = Math.max(invaliditeDeces, LMP.SSI.MINIMUM_INVALIDITE_DECES)
  cfp = Math.max(cfp, LMP.SSI.MINIMUM_CFP)
  
  // Total cotisations obligatoires (hors CSG/CRDS)
  const cotisationsHorsCSG = maladie + retraiteBase + retraiteComplementaire + invaliditeDeces + allocationsFamiliales + cfp
  
  // CSG/CRDS : calculée sur (bénéfice + cotisations obligatoires)
  const assietteCSG = baseCotisations + cotisationsHorsCSG
  const csgCrds = assietteCSG * LMP.SSI.CSG_CRDS
  
  // Total global
  const cotisationsTotal = cotisationsHorsCSG + csgCrds
  
  // Vérifier si le total est inférieur au minimum global
  const cotisationsFinales = Math.max(cotisationsTotal, LMP.SSI.MINIMUM_TOTAL)
  if (cotisationsTotal < LMP.SSI.MINIMUM_TOTAL) {
    minimumApplied = true
  }
  
  return {
    estLMP, // Retourner le vrai statut
    cotisationsTotal: Math.round(cotisationsFinales),
    cotisationsHorsCSG: Math.round(cotisationsHorsCSG),
    csgCrds: Math.round(csgCrds),
    details: {
      maladie: Math.round(maladie),
      retraiteBase: Math.round(retraiteBase),
      retraiteComplementaire: Math.round(retraiteComplementaire),
      invaliditeDeces: Math.round(invaliditeDeces),
      allocationsFamiliales: Math.round(allocationsFamiliales),
      cfp: Math.round(cfp),
      csgCrds: Math.round(csgCrds),
    },
    minimumApplied,
    beneficeNet: baseCotisations,
    netApresCotisations: baseCotisations - cotisationsFinales,
  }
}

/**
 * Appel à l'API URSSAF Mon Entreprise pour calcul précis (fallback)
 * Endpoint : https://mon-entreprise.urssaf.fr/api/v2/simulateurs/independant
 */
export async function calculSSIViaAPIURSSAF(
  ca: number,
  beneficeNet: number
): Promise<SSICalculResult | null> {
  try {
    const response = await fetch('https://mon-entreprise.urssaf.fr/api/v2/simulateurs/independant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        periode: '2025',
        statut: 'artisanCommercant', // LMP = artisan/commerçant
        ca,
        bene: beneficeNet,
      }),
    })
    
    if (!response.ok) {
      logger.warn('[SSI] API URSSAF indisponible (status: ' + response.status + '), utilisation du calcul local')
      return null
    }
    
    // Vérifier que la réponse est du JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      logger.warn('[SSI] API URSSAF: réponse non-JSON, utilisation du calcul local')
      return null
    }
    
    const data = await response.json()
    
    return {
      estLMP: true,
      cotisationsTotal: Math.round(data.cotisations?.total || 0),
      cotisationsHorsCSG: Math.round((data.cotisations?.total || 0) - (data.cotisations?.details?.csgCrds || 0)),
      csgCrds: Math.round(data.cotisations?.details?.csgCrds || 0),
      details: {
        maladie: Math.round(data.cotisations?.details?.maladie || 0),
        retraiteBase: Math.round(data.cotisations?.details?.retraiteBase || 0),
        retraiteComplementaire: Math.round(data.cotisations?.details?.retraiteComplementaire || 0),
        invaliditeDeces: Math.round(data.cotisations?.details?.invaliditeDeces || 0),
        allocationsFamiliales: Math.round(data.cotisations?.details?.allocationsFamiliales || 0),
        cfp: Math.round(data.cotisations?.details?.cfp || 0),
        csgCrds: Math.round(data.cotisations?.details?.csgCrds || 0),
      },
      minimumApplied: data.cotisations?.minimumApplied || false,
      beneficeNet,
      netApresCotisations: Math.round(data.revenuNet || (beneficeNet - (data.cotisations?.total || 0))),
    }
  } catch (error) {
    logger.warn('Erreur appel API URSSAF:', error)
    return null
  }
}
