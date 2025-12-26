/**
 * PARAMÈTRES FISCAUX ET SOCIAUX 2025
 * ===================================
 * Source : Althémis Chiffres-clés Patrimoine 2025
 * Mis à jour : Janvier 2025
 * 
 * Pour mettre à jour :
 * 1. Copier ce fichier en parameters-2026.ts
 * 2. Modifier les valeurs selon les nouveaux barèmes
 * 3. Mettre à jour l'import dans chaque simulateur
 */

// =============================================================================
// BARÈME IMPÔT SUR LE REVENU 2025 (CGI art. 197)
// =============================================================================
export const BAREME_IR_2025 = [
  { min: 0, max: 11497, taux: 0.00 },
  { min: 11497, max: 29315, taux: 0.11 },
  { min: 29315, max: 83823, taux: 0.30 },
  { min: 83823, max: 180294, taux: 0.41 },
  { min: 180294, max: Infinity, taux: 0.45 },
] as const

// =============================================================================
// PLAFONDS ÉPARGNE RETRAITE 2025 (CGI art. 163 quatervicies)
// =============================================================================
export const PLAFONDS_EPARGNE_RETRAITE = {
  /** PASS 2025 */
  PASS: 46368,
  /** Plafond plancher (10% PASS) */
  PLANCHER: 4637,
  /** Plafond max (10% de 8 PASS) */
  PLAFOND_MAX: 37094,
  /** Report possible sur 3 ans */
  ANNEES_REPORT: 3,
  /** Plafond conjoint si marié/pacsé */
  MUTUALISATION_CONJOINT: true,
}

// =============================================================================
// PARAMÈTRES PER SALARIÉS
// =============================================================================
export const PER_SALARIES = {
  /** Taux de charges salariales moyen */
  TAUX_CHARGES_SALARIALES: 0.22,
  /** Taux de charges patronales moyen */
  TAUX_CHARGES_PATRONALES: 0.45,
  /** Abondement max entreprise (300% versement salarié plafonné) */
  ABONDEMENT_MAX: 7418,
  /** Participation/intéressement max vers PER */
  PARTICIPATION_MAX: 37094,
}

// =============================================================================
// PARAMÈTRES PER TNS (Madelin / art. 154 bis)
// =============================================================================
export const PER_TNS = {
  /** Disponible fiscal = 10% bénéfice + 15% bénéfice > PASS */
  TAUX_BASE: 0.10,
  /** Taux additionnel au-delà du PASS */
  TAUX_ADDITIONNEL: 0.15,
  /** Plafond base (10% de 8 PASS) */
  PLAFOND_BASE: 37094,
  /** Plafond additionnel (15% de 7 PASS) */
  PLAFOND_ADDITIONNEL: 48686,
  /** Plafond total max */
  PLAFOND_MAX: 85780,
  /** Plancher mini (10% PASS) */
  PLANCHER: 4637,
}

// =============================================================================
// PRÉLÈVEMENTS SOCIAUX
// =============================================================================
export const PRELEVEMENTS_SOCIAUX = {
  /** CSG */
  CSG: 0.092,
  /** CRDS */
  CRDS: 0.005,
  /** Prélèvement de solidarité */
  SOLIDARITE: 0.075,
  /** Total PS */
  TOTAL: 0.172,
  /** CSG déductible sur revenus du patrimoine */
  CSG_DEDUCTIBLE: 0.068,
}

// =============================================================================
// ASSURANCE-VIE - RACHAT (CGI art. 125-0 A)
// =============================================================================
export const ASSURANCE_VIE_RACHAT = {
  /** Taux PFU (hors PS) */
  PFU: 0.128,
  /** Taux forfaitaire prélèvement libératoire < 4 ans (avant 2017) */
  PFL_MOINS_4_ANS: 0.35,
  /** Taux forfaitaire 4-8 ans (avant 2017) */
  PFL_4_8_ANS: 0.15,
  /** Taux réduit > 8 ans */
  TAUX_REDUIT_8_ANS: 0.075,
  /** Abattement célibataire > 8 ans */
  ABATTEMENT_SEUL: 4600,
  /** Abattement couple > 8 ans */
  ABATTEMENT_COUPLE: 9200,
  /** Seuil primes post-2017 pour taux 12.8% */
  SEUIL_PRIMES_150K: 150000,
}

// =============================================================================
// ASSURANCE-VIE - TRANSMISSION DÉCÈS
// =============================================================================
export const ASSURANCE_VIE_DECES = {
  /** Abattement art. 990 I (primes avant 70 ans) par bénéficiaire */
  ABATTEMENT_990I: 152500,
  /** Taux 990 I tranche 1 */
  TAUX_990I_1: 0.20,
  /** Taux 990 I tranche 2 */
  TAUX_990I_2: 0.3125,
  /** Seuil 990 I (après abattement) */
  SEUIL_990I: 700000,
  /** Abattement art. 757 B (primes après 70 ans) global */
  ABATTEMENT_757B: 30500,
}

// =============================================================================
// DÉMEMBREMENT (CGI art. 669)
// =============================================================================
export const BAREME_DEMEMBREMENT = [
  { ageMax: 21, usufruit: 90, nuePropriete: 10 },
  { ageMax: 31, usufruit: 80, nuePropriete: 20 },
  { ageMax: 41, usufruit: 70, nuePropriete: 30 },
  { ageMax: 51, usufruit: 60, nuePropriete: 40 },
  { ageMax: 61, usufruit: 50, nuePropriete: 50 },
  { ageMax: 71, usufruit: 40, nuePropriete: 60 },
  { ageMax: 81, usufruit: 30, nuePropriete: 70 },
  { ageMax: 91, usufruit: 20, nuePropriete: 80 },
  { ageMax: Infinity, usufruit: 10, nuePropriete: 90 },
] as const

// =============================================================================
// DROITS DE SUCCESSION / DONATION
// =============================================================================
export const ABATTEMENTS_SUCCESSION = {
  /** Abattement ligne directe (enfant) */
  ENFANT: 100000,
  /** Petit-enfant */
  PETIT_ENFANT: 31865,
  /** Arrière-petit-enfant */
  ARRIERE_PETIT_ENFANT: 5310,
  /** Frère/sœur */
  FRERE_SOEUR: 15932,
  /** Neveu/nièce */
  NEVEU_NIECE: 7967,
  /** Abattement handicapé (cumulable) */
  HANDICAPE: 159325,
  /** Conjoint (exonération totale depuis TEPA 2007) */
  CONJOINT: Infinity,
}

export const BAREME_SUCCESSION_LIGNE_DIRECTE = [
  { min: 0, max: 8072, taux: 0.05 },
  { min: 8072, max: 12109, taux: 0.10 },
  { min: 12109, max: 15932, taux: 0.15 },
  { min: 15932, max: 552324, taux: 0.20 },
  { min: 552324, max: 902838, taux: 0.30 },
  { min: 902838, max: 1805677, taux: 0.40 },
  { min: 1805677, max: Infinity, taux: 0.45 },
] as const

// =============================================================================
// IFI 2025 (CGI art. 977)
// =============================================================================
export const IFI = {
  /** Seuil d'assujettissement */
  SEUIL: 1300000,
  /** Seuil début taxation */
  SEUIL_DEBUT: 800000,
  /** Barème IFI */
  BAREME: [
    { min: 0, max: 800000, taux: 0 },
    { min: 800000, max: 1300000, taux: 0.0050 },
    { min: 1300000, max: 2570000, taux: 0.0070 },
    { min: 2570000, max: 5000000, taux: 0.0100 },
    { min: 5000000, max: 10000000, taux: 0.0125 },
    { min: 10000000, max: Infinity, taux: 0.0150 },
  ] as const,
  /** Décote 1.3M-1.4M : 17500 - 1.25% × patrimoine */
  DECOTE_SEUIL: 1400000,
  DECOTE_BASE: 17500,
  DECOTE_TAUX: 0.0125,
}

// =============================================================================
// CEHR - Contribution Exceptionnelle Hauts Revenus (CGI art. 223 sexies)
// =============================================================================
export const CEHR = {
  CELIBATAIRE: [
    { min: 0, max: 250000, taux: 0 },
    { min: 250000, max: 500000, taux: 0.03 },
    { min: 500000, max: Infinity, taux: 0.04 },
  ] as const,
  COUPLE: [
    { min: 0, max: 500000, taux: 0 },
    { min: 500000, max: 1000000, taux: 0.03 },
    { min: 1000000, max: Infinity, taux: 0.04 },
  ] as const,
}

// =============================================================================
// FONCTIONS UTILITAIRES
// =============================================================================

/**
 * Calcule le TMI à partir du quotient familial
 */
export function getTMI(quotientFamilial: number): number {
  for (const tranche of BAREME_IR_2025) {
    if (quotientFamilial <= tranche.max) return tranche.taux
  }
  return 0.45
}

/**
 * Calcule le nombre de parts fiscales
 */
export function getNombreParts(statut: 'celibataire' | 'couple', enfants: number, parentIsole = false): number {
  let parts = statut === 'couple' ? 2 : 1
  if (parentIsole) parts += 0.5 // demi-part parent isolé
  
  if (enfants <= 2) {
    parts += enfants * 0.5
  } else {
    parts += 1 + (enfants - 2) // 0.5 + 0.5 pour les 2 premiers, 1 par enfant suivant
  }
  
  return parts
}

/**
 * Calcule l'IR brut avant plafonnement du QF
 */
export function calculIR(revenuImposable: number, nbParts: number): number {
  const qf = revenuImposable / nbParts
  let impotParPart = 0
  
  for (let i = 0; i < BAREME_IR_2025.length; i++) {
    const tranche = BAREME_IR_2025[i]
    const tranchePrecedente = i > 0 ? BAREME_IR_2025[i - 1].max : 0
    
    if (qf > tranche.min) {
      const base = Math.min(qf, tranche.max) - tranche.min
      impotParPart += base * tranche.taux
    }
  }
  
  return Math.round(impotParPart * nbParts)
}

/**
 * Retourne le pourcentage d'usufruit selon l'âge (art. 669 CGI)
 */
export function getUsufruit(age: number): number {
  for (const tranche of BAREME_DEMEMBREMENT) {
    if (age < tranche.ageMax) return tranche.usufruit
  }
  return 10
}

/**
 * Calcule le plafond PER TNS disponible
 */
export function getPlafondPERTNS(benefice: number): { plafond: number; detail: string } {
  const base = Math.min(benefice * PER_TNS.TAUX_BASE, PER_TNS.PLAFOND_BASE)
  const additionnel = benefice > PLAFONDS_EPARGNE_RETRAITE.PASS 
    ? Math.min((benefice - PLAFONDS_EPARGNE_RETRAITE.PASS) * PER_TNS.TAUX_ADDITIONNEL, PER_TNS.PLAFOND_ADDITIONNEL)
    : 0
  
  const plafond = Math.max(PER_TNS.PLANCHER, Math.min(base + additionnel, PER_TNS.PLAFOND_MAX))
  
  return {
    plafond: Math.round(plafond),
    detail: `Base: ${Math.round(base)}€ + Additionnel: ${Math.round(additionnel)}€`
  }
}

/**
 * Calcule le plafond PER salarié disponible
 */
export function getPlafondPERSalarie(revenuNet: number, plafondNonUtiliseN1 = 0, plafondNonUtiliseN2 = 0, plafondNonUtiliseN3 = 0): number {
  const plafondAnnuel = Math.max(
    PLAFONDS_EPARGNE_RETRAITE.PLANCHER,
    Math.min(revenuNet * 0.10, PLAFONDS_EPARGNE_RETRAITE.PLAFOND_MAX)
  )
  
  return plafondAnnuel + plafondNonUtiliseN1 + plafondNonUtiliseN2 + plafondNonUtiliseN3
}

// =============================================================================
// EXPORT GLOBAL POUR COMPATIBILITÉ
// =============================================================================
export const PARAMS = {
  // Prélèvements sociaux
  PS: PRELEVEMENTS_SOCIAUX.TOTAL,
  
  // Assurance-vie rachat
  PFU: ASSURANCE_VIE_RACHAT.PFU,
  ABAT_SEUL: ASSURANCE_VIE_RACHAT.ABATTEMENT_SEUL,
  ABAT_COUPLE: ASSURANCE_VIE_RACHAT.ABATTEMENT_COUPLE,
  TAUX_75: ASSURANCE_VIE_RACHAT.TAUX_REDUIT_8_ANS,
  TAUX_PFL_MOINS4: ASSURANCE_VIE_RACHAT.PFL_MOINS_4_ANS,
  TAUX_PFL_4A8: ASSURANCE_VIE_RACHAT.PFL_4_8_ANS,
  
  // Assurance-vie décès
  ABAT_990I: ASSURANCE_VIE_DECES.ABATTEMENT_990I,
  TAUX_990I_1: ASSURANCE_VIE_DECES.TAUX_990I_1,
  TAUX_990I_2: ASSURANCE_VIE_DECES.TAUX_990I_2,
  SEUIL_990I: ASSURANCE_VIE_DECES.SEUIL_990I,
  ABAT_757B: ASSURANCE_VIE_DECES.ABATTEMENT_757B,
  
  // IR
  BAREME_IR: BAREME_IR_2025,
  
  // Démembrement
  DEMEMBREMENT: BAREME_DEMEMBREMENT.map(t => ({ age: t.ageMax, usufruit: t.usufruit })),
  
  // PASS
  PASS: PLAFONDS_EPARGNE_RETRAITE.PASS,
}

export default PARAMS
