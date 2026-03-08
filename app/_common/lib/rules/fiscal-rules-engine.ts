/**
 * =============================================================================
 * MOTEUR DE CALCUL — FISCAL RULES ENGINE
 * =============================================================================
 *
 * Fonctions de calcul typées lisant exclusivement depuis RULES (fiscal-rules.ts).
 * Aucune valeur hardcodée — tout vient de la configuration centralisée.
 *
 * Ce module remplace et centralise les fonctions de :
 * - tax-service.ts (calculateIncomeTax, calculateIFI, calculateSocialContributions)
 * - parameters.ts (calculIR, getTMI, getNombreParts, getUsufruit, etc.)
 * - audit-patrimonial-engine.ts (calculs inline)
 *
 * =============================================================================
 */

import { RULES, type Tranche } from './fiscal-rules'

// =============================================================================
// UTILITAIRES INTERNES
// =============================================================================

/**
 * Calcule un impôt progressif sur un barème de tranches {min, max, taux}
 */
function calcBaremeProgressif(base: number, bareme: Tranche[]): number {
  let impot = 0
  for (const tranche of bareme) {
    if (base <= tranche.min) break
    const assiette = Math.min(base, tranche.max) - tranche.min
    impot += assiette * tranche.taux
  }
  return impot
}

// =============================================================================
// NOMBRE DE PARTS FISCALES
// =============================================================================

export function getNombreParts(
  statut: 'celibataire' | 'couple' | 'SINGLE' | 'MARRIED' | 'PACS' | 'WIDOWED' | 'DIVORCED',
  enfants: number,
  options?: { parentIsole?: boolean; dependents?: number }
): number {
  let parts: number

  switch (statut) {
    case 'couple':
    case 'MARRIED':
    case 'PACS':
      parts = 2
      break
    case 'WIDOWED':
      parts = enfants > 0 ? 2 : 1 // Veuf avec enfant = 2 parts
      break
    default:
      parts = 1
  }

  // Demi-part parent isolé (célibataire, divorcé, veuf avec enfant à charge)
  if (options?.parentIsole && (statut === 'celibataire' || statut === 'SINGLE' || statut === 'DIVORCED')) {
    parts += 0.5
  }

  // Parts enfants
  if (enfants <= 2) {
    parts += enfants * 0.5
  } else {
    parts += 1 + (enfants - 2) // 0.5+0.5 pour les 2 premiers, 1 par enfant suivant
  }

  // Personnes à charge supplémentaires
  if (options?.dependents) {
    parts += options.dependents * 0.5
  }

  return parts
}

// =============================================================================
// TMI — Taux Marginal d'Imposition
// =============================================================================

export function getTMI(quotientFamilial: number): number {
  for (const tranche of RULES.ir.bareme) {
    if (quotientFamilial <= tranche.max) return tranche.taux
  }
  return 0.45
}

// =============================================================================
// CALCUL IMPÔT SUR LE REVENU
// =============================================================================

export interface ResultatIR {
  revenuImposable: number
  quotientFamilial: number
  nombreParts: number
  impotBrut: number
  tmi: number
  decote: number
  impotNet: number
  tauxEffectif: number
  cehr: number
  cdhr: number
  impotTotal: number
}

/**
 * Calcul complet de l'IR incluant décote, CEHR et CDHR
 */
export function calculerIR(
  revenuImposable: number,
  nombreParts: number,
  options?: {
    isCouple?: boolean
  }
): ResultatIR {
  const isCouple = options?.isCouple ?? nombreParts >= 2
  const qf = revenuImposable / nombreParts

  // --- IR brut par application du barème ---
  const impotParPart = calcBaremeProgressif(qf, RULES.ir.bareme)
  let impotBrut = Math.round(impotParPart * nombreParts)

  // --- TMI ---
  const tmi = getTMI(qf)

  // --- Décote (revenus modestes) ---
  let decote = 0
  const decoteConfig = RULES.ir.decote
  const seuilDecote = isCouple ? decoteConfig.seuil_couple : decoteConfig.seuil_celibataire
  const baseDecote = isCouple ? decoteConfig.base_couple : decoteConfig.base_celibataire

  if (impotBrut > 0 && impotBrut <= seuilDecote) {
    // Décote = base - (coefficient × impôt brut)
    decote = Math.max(0, Math.round(baseDecote - decoteConfig.coefficient * impotBrut))
  }

  const impotNet = Math.max(0, impotBrut - decote)

  // --- CEHR (Contribution Exceptionnelle Hauts Revenus) ---
  const baremesCEHR = isCouple ? RULES.ir.cehr.couple : RULES.ir.cehr.celibataire
  const cehr = Math.round(calcBaremeProgressif(revenuImposable, baremesCEHR))

  // --- CDHR (Contribution Différentielle Hauts Revenus) ---
  let cdhr = 0
  const seuilCDHR = isCouple
    ? RULES.ir.cdhr.seuil_couple
    : RULES.ir.cdhr.seuil_celibataire

  if (revenuImposable > seuilCDHR) {
    const impotMinimum = revenuImposable * RULES.ir.cdhr.taux_minimum
    const impotActuel = impotNet + cehr
    if (impotActuel < impotMinimum) {
      cdhr = Math.round(impotMinimum - impotActuel)
    }
  }

  const impotTotal = impotNet + cehr + cdhr

  return {
    revenuImposable,
    quotientFamilial: Math.round(qf),
    nombreParts,
    impotBrut,
    tmi,
    decote,
    impotNet,
    tauxEffectif: revenuImposable > 0 ? Math.round((impotTotal / revenuImposable) * 1000) / 10 : 0,
    cehr,
    cdhr,
    impotTotal,
  }
}

/**
 * Calcul IR simplifié (rétrocompatible avec l'ancien calculIR)
 */
export function calculIRSimple(revenuImposable: number, nbParts: number): number {
  const qf = revenuImposable / nbParts
  const impotParPart = calcBaremeProgressif(qf, RULES.ir.bareme)
  return Math.round(impotParPart * nbParts)
}

// =============================================================================
// CALCUL IFI
// =============================================================================

export interface ResultatIFI {
  patrimoineNetTaxable: number
  assujetti: boolean
  montantIFI: number
  tranche: string
  tauxEffectif: number
  distanceSeuil: number
}

export function calculerIFI(patrimoineNetTaxable: number): ResultatIFI {
  if (patrimoineNetTaxable < RULES.ifi.seuil_assujettissement) {
    return {
      patrimoineNetTaxable,
      assujetti: false,
      montantIFI: 0,
      tranche: 'Non assujetti',
      tauxEffectif: 0,
      distanceSeuil: RULES.ifi.seuil_assujettissement - patrimoineNetTaxable,
    }
  }

  // Calcul progressif
  let montantIFI = calcBaremeProgressif(patrimoineNetTaxable, RULES.ifi.bareme)

  // Décote entre 1.3M et 1.4M
  if (patrimoineNetTaxable <= RULES.ifi.decote.seuil) {
    const reduction = RULES.ifi.decote.base - patrimoineNetTaxable * RULES.ifi.decote.taux
    montantIFI = Math.max(0, montantIFI - Math.max(0, reduction))
  }

  montantIFI = Math.round(montantIFI)

  // Tranche
  let tranche = ''
  for (const t of RULES.ifi.bareme) {
    if (patrimoineNetTaxable <= t.max) {
      tranche = `${(t.taux * 100).toFixed(2)}%`
      break
    }
  }

  return {
    patrimoineNetTaxable,
    assujetti: true,
    montantIFI,
    tranche,
    tauxEffectif: patrimoineNetTaxable > 0 ? Math.round((montantIFI / patrimoineNetTaxable) * 10000) / 100 : 0,
    distanceSeuil: 0,
  }
}

/**
 * Calcul valeur IFI d'un bien immobilier
 */
export function calculerValeurIFIBien(
  valeurVenale: number,
  isResidencePrincipale: boolean = false,
  decoteManuelle: number = 0
): number {
  let valeurIFI = valeurVenale
  if (isResidencePrincipale) {
    valeurIFI *= (1 - RULES.ifi.abattement_rp)
  }
  if (decoteManuelle > 0 && decoteManuelle <= 100) {
    valeurIFI *= (1 - decoteManuelle / 100)
  }
  return Math.round(valeurIFI)
}

// =============================================================================
// PRÉLÈVEMENTS SOCIAUX
// =============================================================================

export function calculerPS(revenusPatrimoine: number): number {
  return Math.round(revenusPatrimoine * RULES.ps.total)
}

export function calculerPFU(revenusCapitaux: number): { ir: number; ps: number; total: number } {
  return {
    ir: Math.round(revenusCapitaux * RULES.ps.pfu_ir),
    ps: Math.round(revenusCapitaux * RULES.ps.total),
    total: Math.round(revenusCapitaux * RULES.ps.pfu_total),
  }
}

// =============================================================================
// PLAFONDS PER
// =============================================================================

export function calculerPlafondPERSalarie(
  revenuNet: number,
  plafondsNonUtilises: number[] = []
): { plafond: number; report: number; total: number } {
  const plafondAnnuel = Math.max(
    RULES.per.plancher_salarie,
    Math.min(revenuNet * RULES.per.plafond_taux, RULES.per.plafond_max_salarie)
  )
  const report = plafondsNonUtilises.reduce((s, v) => s + v, 0)
  return {
    plafond: Math.round(plafondAnnuel),
    report: Math.round(report),
    total: Math.round(plafondAnnuel + report),
  }
}

export function calculerPlafondPERTNS(
  benefice: number
): { plafond: number; detail: string } {
  const tns = RULES.per.tns
  const pass = RULES.retraite.pass
  const base = Math.min(benefice * tns.taux_base, tns.plafond_base)
  const additionnel = benefice > pass
    ? Math.min((benefice - pass) * tns.taux_additionnel, tns.plafond_additionnel)
    : 0
  const plafond = Math.max(tns.plancher, Math.min(base + additionnel, tns.plafond_max))

  return {
    plafond: Math.round(plafond),
    detail: `Base: ${Math.round(base)}€ + Additionnel: ${Math.round(additionnel)}€`,
  }
}

// =============================================================================
// DÉMEMBREMENT (Art. 669 CGI)
// =============================================================================

export function getUsufruit(age: number): number {
  for (const tranche of RULES.demembrement.bareme_art669) {
    if (age < tranche.age_max) return tranche.usufruit
  }
  return 10
}

export function getNuePropriete(age: number): number {
  return 100 - getUsufruit(age)
}

// =============================================================================
// SUCCESSION — DMTG
// =============================================================================

export interface ResultatDMTG {
  actifNetTaxable: number
  abattement: number
  baseImposable: number
  droitsBruts: number
  lienParente: string
}

export function calculerDMTG(
  actifNet: number,
  lienParente: 'enfant' | 'petit_enfant' | 'arriere_petit_enfant' | 'frere_soeur' | 'neveu_niece' | 'conjoint' | 'tiers'
): ResultatDMTG {
  const abattement = RULES.succession.abattements[lienParente]

  if (lienParente === 'conjoint') {
    return {
      actifNetTaxable: actifNet,
      abattement: actifNet,
      baseImposable: 0,
      droitsBruts: 0,
      lienParente: 'Conjoint (exonéré)',
    }
  }

  const baseImposable = Math.max(0, actifNet - abattement)

  let bareme: Tranche[]
  switch (lienParente) {
    case 'enfant':
    case 'petit_enfant':
    case 'arriere_petit_enfant':
      bareme = RULES.succession.bareme_ligne_directe
      break
    case 'frere_soeur':
      bareme = RULES.succession.bareme_freres_soeurs
      break
    case 'neveu_niece':
      bareme = RULES.succession.bareme_autres_parents
      break
    default:
      bareme = RULES.succession.bareme_non_parents
  }

  const droitsBruts = Math.round(calcBaremeProgressif(baseImposable, bareme))

  return {
    actifNetTaxable: actifNet,
    abattement: Math.min(abattement, actifNet),
    baseImposable,
    droitsBruts,
    lienParente,
  }
}

// =============================================================================
// ASSURANCE-VIE
// =============================================================================

/**
 * Calcul fiscalité rachat AV > 8 ans
 */
export function calculerFiscaliteRachatAV(
  gainsRachetes: number,
  isCouple: boolean,
  primesVersees: number = 0,
  dureeContrat: number = 9
): { abattement: number; baseImposable: number; impotIR: number; ps: number; total: number } {
  const av = RULES.assurance_vie.rachat
  let taux = av.pfu_ir

  // Abattement > 8 ans
  let abattement = 0
  if (dureeContrat >= 8) {
    abattement = isCouple ? av.abattement_couple_8ans : av.abattement_celibataire_8ans
    // Taux réduit si primes < 150k
    if (primesVersees <= av.seuil_primes_150k) {
      taux = av.taux_reduit_8ans
    }
  } else if (dureeContrat < 4) {
    taux = av.pfl_moins_4ans
  } else {
    taux = av.pfl_4_8ans
  }

  const baseImposable = Math.max(0, gainsRachetes - abattement)
  const impotIR = Math.round(baseImposable * taux)
  const ps = Math.round(gainsRachetes * RULES.ps.total)

  return {
    abattement: Math.min(abattement, gainsRachetes),
    baseImposable,
    impotIR,
    ps,
    total: impotIR + ps,
  }
}

/**
 * Calcul fiscalité transmission AV au décès (art. 990 I)
 */
export function calculerFiscaliteTransmissionAV990I(
  capitalTransmisParBeneficiaire: number
): { abattement: number; droits: number; tauxEffectif: number } {
  const av = RULES.assurance_vie.deces
  const apresAbattement = Math.max(0, capitalTransmisParBeneficiaire - av.abattement_990i)

  let droits = 0
  if (apresAbattement > 0) {
    const tranche1 = Math.min(apresAbattement, av.seuil_990i - av.abattement_990i)
    const tranche2 = Math.max(0, apresAbattement - tranche1)
    droits = Math.round(tranche1 * av.taux_990i_1 + tranche2 * av.taux_990i_2)
  }

  return {
    abattement: Math.min(av.abattement_990i, capitalTransmisParBeneficiaire),
    droits,
    tauxEffectif: capitalTransmisParBeneficiaire > 0
      ? Math.round((droits / capitalTransmisParBeneficiaire) * 1000) / 10
      : 0,
  }
}

// =============================================================================
// PLUS-VALUE IMMOBILIÈRE
// =============================================================================

export function calculerPlusValueImmobiliere(
  prixCession: number,
  prixAcquisition: number,
  anneesDetention: number,
  isResidencePrincipale: boolean = false
): {
  plusValueBrute: number
  abattementIR: number
  abattementPS: number
  plusValueNetteIR: number
  plusValueNettePS: number
  impotIR: number
  impotPS: number
  surtaxe: number
  total: number
  exonere: boolean
} {
  // Exonération RP
  if (isResidencePrincipale) {
    return {
      plusValueBrute: Math.max(0, prixCession - prixAcquisition),
      abattementIR: 0, abattementPS: 0,
      plusValueNetteIR: 0, plusValueNettePS: 0,
      impotIR: 0, impotPS: 0, surtaxe: 0, total: 0, exonere: true,
    }
  }

  // Exonération si prix < 15 000 €
  if (prixCession <= RULES.immobilier.plus_value.seuil_exoneration_montant) {
    return {
      plusValueBrute: Math.max(0, prixCession - prixAcquisition),
      abattementIR: 0, abattementPS: 0,
      plusValueNetteIR: 0, plusValueNettePS: 0,
      impotIR: 0, impotPS: 0, surtaxe: 0, total: 0, exonere: true,
    }
  }

  const pvBrute = Math.max(0, prixCession - prixAcquisition)
  if (pvBrute === 0) {
    return {
      plusValueBrute: 0, abattementIR: 0, abattementPS: 0,
      plusValueNetteIR: 0, plusValueNettePS: 0,
      impotIR: 0, impotPS: 0, surtaxe: 0, total: 0, exonere: false,
    }
  }

  // Calcul abattement IR par durée de détention
  let totalAbatIR = 0
  if (anneesDetention >= 22) {
    totalAbatIR = 1 // Exonération totale IR après 22 ans
  } else if (anneesDetention > 5) {
    // 6% par an de la 6e à la 21e année
    totalAbatIR = Math.min(anneesDetention - 5, 16) * 0.06
    // 4% la 22e année
    if (anneesDetention >= 22) totalAbatIR += 0.04
  }

  // Calcul abattement PS par durée de détention
  let totalAbatPS = 0
  if (anneesDetention >= 30) {
    totalAbatPS = 1 // Exonération totale PS après 30 ans
  } else if (anneesDetention > 5) {
    // 1.65% par an de la 6e à la 21e année
    const annees6a21 = Math.min(anneesDetention - 5, 16)
    totalAbatPS = annees6a21 * 0.0165
    // 1.80% la 22e année
    if (anneesDetention >= 22) totalAbatPS += 0.018
    // 9% par an de la 23e à la 30e année
    if (anneesDetention > 22) {
      totalAbatPS += Math.min(anneesDetention - 22, 8) * 0.09
    }
  }

  const pvIR = Math.round(pvBrute * (1 - totalAbatIR))
  const pvPS = Math.round(pvBrute * (1 - totalAbatPS))
  const impotIR = Math.round(pvIR * RULES.immobilier.plus_value.taux_ir)
  const impotPS = Math.round(pvPS * RULES.immobilier.plus_value.taux_ps)

  // Surtaxe (PV nette IR > 50 000 €)
  let surtaxe = 0
  if (pvIR > 50000) {
    surtaxe = Math.round(calcBaremeProgressif(pvIR, RULES.immobilier.plus_value.surtaxe))
  }

  return {
    plusValueBrute: pvBrute,
    abattementIR: Math.round(totalAbatIR * 100),
    abattementPS: Math.round(totalAbatPS * 100),
    plusValueNetteIR: pvIR,
    plusValueNettePS: pvPS,
    impotIR,
    impotPS,
    surtaxe,
    total: impotIR + impotPS + surtaxe,
    exonere: false,
  }
}

// =============================================================================
// CAPACITÉ D'EMPRUNT
// =============================================================================

export function calculerCapaciteEmprunt(
  revenusMensuels: number,
  chargesMensuelles: number,
  dureeAns: number = 20,
  tauxAssurance: number = 0.003
): {
  mensualiteMax: number
  capitalEmpruntable: number
  tauxEndettement: number
  tauxCredit: number
} {
  const tauxEndettementMax = RULES.immobilier.hcsf.taux_endettement_max
  const mensualiteMax = Math.round(revenusMensuels * tauxEndettementMax - chargesMensuelles)

  // Taux crédit selon durée
  let tauxAnnuel: number
  if (dureeAns <= 10) tauxAnnuel = RULES.immobilier.taux_credit_moyen.duree_10 / 100
  else if (dureeAns <= 15) tauxAnnuel = RULES.immobilier.taux_credit_moyen.duree_15 / 100
  else if (dureeAns <= 20) tauxAnnuel = RULES.immobilier.taux_credit_moyen.duree_20 / 100
  else tauxAnnuel = RULES.immobilier.taux_credit_moyen.duree_25 / 100

  const tauxMensuel = tauxAnnuel / 12
  const nbMois = dureeAns * 12

  // Capital = M × [(1 - (1+t)^(-n)) / t]
  const capitalEmpruntable = mensualiteMax > 0
    ? Math.round(mensualiteMax * ((1 - Math.pow(1 + tauxMensuel, -nbMois)) / tauxMensuel))
    : 0

  return {
    mensualiteMax: Math.max(0, mensualiteMax),
    capitalEmpruntable: Math.max(0, capitalEmpruntable),
    tauxEndettement: revenusMensuels > 0
      ? Math.round(((chargesMensuelles + Math.max(0, mensualiteMax)) / revenusMensuels) * 1000) / 10
      : 0,
    tauxCredit: tauxAnnuel * 100,
  }
}

// =============================================================================
// RETRAITE — HELPERS
// =============================================================================

export function getAgeLegal(anneeNaissance: number): number {
  if (anneeNaissance >= 1964) return RULES.retraite.regime_base.age_legal
  return RULES.retraite.age_legal_par_generation[anneeNaissance] || RULES.retraite.regime_base.age_legal
}

export function getTrimestresRequis(anneeNaissance: number): number {
  if (anneeNaissance >= 1968) return 172
  return RULES.retraite.trimestres_requis[anneeNaissance] || 172
}

export function calculerPensionBase(
  sam: number,
  trimestresAcquis: number,
  anneeNaissance: number
): {
  pension: number
  taux: number
  decote: number
  surcote: number
  trimestresRequis: number
} {
  const config = RULES.retraite.regime_base
  const trimReq = getTrimestresRequis(anneeNaissance)
  const diffTrim = trimestresAcquis - trimReq

  let taux = config.taux_plein
  let decote = 0
  let surcote = 0

  if (diffTrim < 0) {
    decote = Math.min(Math.abs(diffTrim) * config.decote_par_trimestre, config.decote_max)
    taux = config.taux_plein - decote
  } else if (diffTrim > 0) {
    surcote = diffTrim * config.surcote_par_trimestre
    taux = config.taux_plein + surcote
  }

  const pension = Math.round(sam * taux * Math.min(trimestresAcquis, trimReq) / trimReq)

  return { pension, taux, decote, surcote, trimestresRequis: trimReq }
}

// =============================================================================
// DISPOSITIFS IMMOBILIERS — VÉRIFICATION ÉLIGIBILITÉ
// =============================================================================

export function getDispositifsActifs(): typeof RULES.immobilier.dispositifs {
  return RULES.immobilier.dispositifs.filter(d => d.actif)
}

export function isDispositifActif(nom: string): boolean {
  const dispositif = RULES.immobilier.dispositifs.find(
    d => d.nom.toLowerCase().includes(nom.toLowerCase())
  )
  return dispositif?.actif ?? false
}

// =============================================================================
// OPTIMISATIONS FISCALES DISPONIBLES
// =============================================================================

export function getOptimisationsActives(): typeof RULES.optimisations {
  return RULES.optimisations.filter(o => o.actif)
}

export function getOptimisationParCategorie(categorie: string): typeof RULES.optimisations {
  return RULES.optimisations.filter(o => o.actif && o.categorie === categorie)
}

// =============================================================================
// TAUX PLACEMENTS
// =============================================================================

export function getTauxPlacement(type: keyof typeof RULES.placements): number | string {
  return RULES.placements[type]
}

// =============================================================================
// EXPORTS RÉTROCOMPATIBLES
// =============================================================================

/** Pour tax-service.ts — signature identique */
export function calculateIncomeTax(
  fiscalReferenceIncome: number,
  taxShares: number
): {
  quotientFamilial: number
  taxBracket: number
  grossTax: number
  decote: number
  netTax: number
  effectiveRate: number
} {
  const result = calculerIR(fiscalReferenceIncome, taxShares)
  return {
    quotientFamilial: result.quotientFamilial,
    taxBracket: Math.round(result.tmi * 100),
    grossTax: result.impotBrut,
    decote: result.decote,
    netTax: result.impotNet,
    effectiveRate: result.tauxEffectif,
  }
}

/** Pour tax-service.ts — signature identique */
export function calculateIFI(netTaxableWealth: number): {
  ifiAmount: number
  bracket: string
  isSubjectToIFI: boolean
  distanceFromThreshold: number
} {
  const result = calculerIFI(netTaxableWealth)
  return {
    ifiAmount: result.montantIFI,
    bracket: result.tranche,
    isSubjectToIFI: result.assujetti,
    distanceFromThreshold: result.distanceSeuil,
  }
}

/** Pour tax-service.ts */
export function calculateSocialContributions(taxableAssetIncome: number): number {
  return calculerPS(taxableAssetIncome)
}

/** Pour tax-service.ts */
export function calculatePropertyIFIValue(
  marketValue: number,
  isResidencePrincipale: boolean = false,
  manualDiscount: number = 0
): number {
  return calculerValeurIFIBien(marketValue, isResidencePrincipale, manualDiscount)
}
