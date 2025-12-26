/**
 * Fonctions d'affichage simplifiées pour les simulateurs immobiliers
 * Les vrais calculs sont effectués côté serveur via les API
 * Ces fonctions servent uniquement à l'aperçu dans les formulaires
 */

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES D'AFFICHAGE (valeurs publiques, pas de formules sensibles)
// ══════════════════════════════════════════════════════════════════════════════

export const BAREME_IFI_DISPLAY = {
  SEUIL_IMPOSITION: 1300000,
  SEUIL_DECLENCHEMENT: 800000,
}

export const PRELEVEMENTS_SOCIAUX_DISPLAY = {
  TAUX_GLOBAL: 17.2,
  CSG: 9.2,
  CRDS: 0.5,
  CSG_DEDUCTIBLE: 6.8,
}

export const DISPOSITIFS_FISCAUX_DISPLAY = {
  PINEL: {
    TAUX_6ANS: 9,
    TAUX_9ANS: 12,
    TAUX_12ANS: 14,
    TAUX_REDUCTION: { 6: 9, 9: 12, 12: 14 },
    TAUX_REDUCTION_PLUS: { 6: 12, 9: 18, 12: 21 },
    PLAFOND_INVESTISSEMENT: 300000,
    PLAFOND_M2: 5500,
    PLAFOND_PAR_M2: 5500,
    PLAFONDS_LOYER_M2: { A_BIS: 18.25, A: 13.56, B1: 10.93, B2: 9.50 },
    ZONES_AUTORISEES_PLUS: ['A_BIS', 'A', 'B1'],
    SURFACE_MIN_PINEL_PLUS: 28,
    ANNEE_FIN_STANDARD: 2024,
  },
  DENORMANDIE: {
    TAUX_6ANS: 12,
    TAUX_9ANS: 18,
    TAUX_12ANS: 21,
    TAUX_REDUCTION: { 6: 12, 9: 18, 12: 21 } as Record<number, number>,
    PART_TRAVAUX_MIN: 25,
    PLAFOND_INVESTISSEMENT: 300000,
    PLAFOND_PAR_M2: 5500,
  },
  MALRAUX: {
    TAUX_SPR: 30,
    TAUX_PVAP: 22,
    TAUX_QAD: 22,
    PLAFOND_TRAVAUX: 400000,
  },
  MONUMENTS_HISTORIQUES: {
    DEDUCTION_SANS_PLAFOND: true,
    MINIMUM_JOURS_OUVERTURE: 50, // CGI art. 156-II-1° ter : 50 jours/an ou 40 jours été
  },
  DEFICIT_FONCIER: {
    PLAFOND_IMPUTATION_RG: 10700,
    PLAFOND_RENOVATION_ENERGETIQUE: 21400,
  },
  PLAFOND_NICHES_FISCALES: 10000,
}

export const LMP_DISPLAY = {
  CONDITIONS: { SEUIL_RECETTES: 23000 },
  AVANTAGES: { SEUIL_EXONERATION_TOTALE: 90000, SEUIL_EXONERATION_PARTIELLE: 126000 },
}

export const LMNP_DISPLAY = {
  // Réforme LF 2024 pour revenus 2025
  MICRO_BIC: {
    ABATTEMENT_CLASSIQUE: 30,
    ABATTEMENT_TOURISME_CLASSE: 50,
    ABATTEMENT_TOURISME_NON_CLASSE: 30,
    ABATTEMENT_CHAMBRE_HOTES: 71,
    PLAFOND_RECETTES_CLASSIQUE: 15000,
    PLAFOND_RECETTES_TOURISME_CLASSE: 77700,
    PLAFOND_RECETTES_TOURISME_NON_CLASSE: 15000,
    PLAFOND_RECETTES_CHAMBRE_HOTES: 188700,
  },
}

export const SCPI_DISPLAY = {
  FRAIS_SOUSCRIPTION_MOYEN: 10,
  DELAI_JOUISSANCE_MOIS: 3,
}

export const LOCATION_NUE_DISPLAY = {
  ABATTEMENT_MICRO_FONCIER: 30,
  PLAFOND_MICRO_FONCIER: 15000,
  MICRO_FONCIER: {
    ABATTEMENT: 30,
    PLAFOND: 15000,
    PLAFOND_RECETTES: 15000,
  },
  DEFICIT_FONCIER: {
    PLAFOND_IMPUTATION_RG: 10700,
    PLAFOND_RENOVATION_ENERGETIQUE: 21400,
    PLAFOND_IMPUTATION_RG_RENOVATION_ENERGETIQUE: 21400,
  },
}

export const PLAFOND_NICHES = 10000

export const PEDAGOGIE_DISPLAY = {
  PINEL: { DESCRIPTION: 'Investissement locatif neuf avec réduction d\'impôt' },
  DENORMANDIE: { DESCRIPTION: 'Investissement dans l\'ancien avec travaux' },
  LMNP: { DESCRIPTION: 'Location meublée non professionnelle' },
  LMP: { DESCRIPTION: 'Location meublée professionnelle' },
  SCPI: { DESCRIPTION: 'Pierre papier - revenus fonciers' },
  DEFICIT_FONCIER: { DESCRIPTION: 'Déficit imputable sur revenus globaux' },
  MALRAUX: { DESCRIPTION: 'Réduction d\'impôt pour travaux en secteur sauvegardé' },
  MONUMENTS_HISTORIQUES: { DESCRIPTION: 'Déduction travaux sans plafond' },
}

// ══════════════════════════════════════════════════════════════════════════════
// FONCTIONS D'AFFICHAGE SIMPLIFIÉES
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Calcul simplifié du nombre de parts fiscales (art. 194 CGI)
 */
export function calculNombreParts(params: {
  situationFamiliale: string
  enfantsACharge: number
  enfantsGardeAlternee?: number
  parentIsole?: boolean
}): number {
  let parts = params.situationFamiliale === 'CELIBATAIRE' ? 1 : 2
  parts += params.enfantsACharge * (params.enfantsACharge <= 2 ? 0.5 : 1)
  parts += (params.enfantsGardeAlternee || 0) * 0.25
  if (params.parentIsole && params.enfantsACharge > 0) parts += 0.5
  return parts
}

/**
 * Estimation simplifiée de l'IR et TMI (art. 197 CGI)
 * Les vrais calculs sont côté serveur
 */
export function calculIRDetaille(revenu: number, nbParts: number): { impotNet: number; tmi: number } {
  const quotient = revenu / nbParts
  let tmi = 0
  if (quotient > 180294) tmi = 45
  else if (quotient > 83823) tmi = 41
  else if (quotient > 29315) tmi = 30
  else if (quotient > 11497) tmi = 11
  // Estimation grossière de l'impôt (le vrai calcul est sur le serveur)
  return { impotNet: Math.round(revenu * tmi / 100 * 0.5), tmi }
}

/**
 * Estimation simplifiée de l'IFI (art. 977 CGI)
 */
export function calculIFI(params: {
  patrimoineImmobilierBrut: number
  dettesDeductibles: number
  valeurRP?: number
}): { impotNet: number; assujetti: boolean } {
  const abattementRP = (params.valeurRP || 0) * 0.3
  const base = params.patrimoineImmobilierBrut - params.dettesDeductibles - abattementRP
  const assujetti = base >= BAREME_IFI_DISPLAY.SEUIL_IMPOSITION
  // Estimation grossière
  return { impotNet: assujetti ? Math.round(Math.max(0, base - 800000) * 0.007) : 0, assujetti }
}

/**
 * Estimation amortissement LMNP/LMP
 */
export function calculAmortissementLMNP(
  prixAchat: number,
  travaux: number,
  mobilier: number,
  partTerrain: number
) {
  const valeurAmortissable = (prixAchat + travaux) * (100 - partTerrain) / 100
  const amortImmo = valeurAmortissable / 25 // Moyenne simplifiée ~4%
  const amortMob = mobilier / 7
  return {
    amortissementAnnuelTotal: Math.round(amortImmo + amortMob),
    valeurTerrain: Math.round(prixAchat * partTerrain / 100),
  }
}

/**
 * Abattement plus-value IR (art. 150 VC CGI)
 */
export function calculAbattementPVIR(dureeDetention: number): number {
  if (dureeDetention <= 5) return 0
  if (dureeDetention >= 22) return 100
  return Math.min(100, (dureeDetention - 5) * 6)
}

/**
 * Abattement plus-value PS (art. 150 VC CGI)
 */
export function calculAbattementPVPS(dureeDetention: number): number {
  if (dureeDetention <= 5) return 0
  if (dureeDetention >= 30) return 100
  if (dureeDetention <= 21) return (dureeDetention - 5) * 1.65
  return 28.05 + (dureeDetention - 21) * 9
}

/**
 * Vérification plafond niches fiscales (art. 200-0 A CGI)
 */
export function verifierPlafondNiches(params: {
  pinel?: number
  denormandie?: number
  malraux?: number
  autresReductions?: number
}): {
  depasse: boolean
  plafond: number
  depassement: number
  plafondRestant: number
  totalReductions: number
} {
  const plafond = 10000
  const totalReductions = (params.pinel || 0) + (params.denormandie || 0) + (params.malraux || 0) + (params.autresReductions || 0)
  const depasse = totalReductions > plafond
  const depassement = Math.max(0, totalReductions - plafond)
  const plafondRestant = Math.max(0, plafond - totalReductions)
  return { depasse, plafond, depassement, plafondRestant, totalReductions }
}

/**
 * Fiscalité SCPI simplifiée
 */
export function calculFiscaliteSCPI(params: {
  revenusPercus: number
  partFrance: number
  partEtranger: number
  tmi: number
  interetsEmprunt?: number
}) {
  const interets = params.interetsEmprunt || 0
  const revenusFrance = params.revenusPercus * params.partFrance / 100 - interets
  const revenusEtranger = params.revenusPercus * params.partEtranger / 100
  return {
    irFrance: Math.round(Math.max(0, revenusFrance) * params.tmi / 100),
    psFrance: Math.round(Math.max(0, revenusFrance) * PRELEVEMENTS_SOCIAUX_DISPLAY.TAUX_GLOBAL / 100),
    creditImpotEtranger: Math.round(revenusEtranger * params.tmi / 100),
  }
}

/**
 * Calcul impôt plus-value simplifié (art. 150 U et suivants CGI)
 */
export function calculImpotPlusValue(
  plusValueBrute: number,
  dureeDetention: number
): { impotIR: number; impotPS: number; impotTotal: number; abattementIR: number; abattementPS: number } {
  const abattementIR = calculAbattementPVIR(dureeDetention)
  const abattementPS = calculAbattementPVPS(dureeDetention)
  const impotIR = Math.round(plusValueBrute * (1 - abattementIR / 100) * 0.19)
  const impotPS = Math.round(plusValueBrute * (1 - abattementPS / 100) * 0.172)
  return { impotIR, impotPS, impotTotal: impotIR + impotPS, abattementIR, abattementPS }
}

/**
 * Calcul CSG déductible simplifiée (6.8% sur revenus patrimoine)
 */
export function calculCSGDeductible(baseImposable: number): number {
  return Math.round(baseImposable * 0.068)
}

/**
 * Vérification statut LMP simplifié (art. 155 IV CGI)
 */
export function verifierStatutLMP(recettes: number, autresRevenusPro: number): {
  estLMP: boolean
  condition1Remplie: boolean
  condition2Remplie: boolean
} {
  const condition1 = recettes > 23000
  const condition2 = recettes > autresRevenusPro
  return {
    estLMP: condition1 && condition2,
    condition1Remplie: condition1,
    condition2Remplie: condition2,
  }
}

/**
 * Calcul plus-value LMNP simplifié (avec réintégration amortissements LF 2024)
 */
export function calculPlusValueLMNP(
  prixAcquisition: number,
  fraisNotaire: number,
  travaux: number,
  prixRevente: number,
  fraisRevente: number,
  dureeDetention: number,
  amortissementsCumules: number,
  _options?: { utiliseForfaitFrais?: boolean; utiliseForfaitTravaux?: boolean }
): {
  plusValueBrute: number
  impotIR: number
  impotPS: number
  impotTotal: number
  abattementIR: number
  abattementPS: number
  explication: string[]
  alertes: string[]
  amortissementsReintegres: number
} {
  const prixAcquisitionMajore = prixAcquisition + fraisNotaire + travaux
  const plusValueBrute = prixRevente - fraisRevente - prixAcquisitionMajore + amortissementsCumules
  const abattementIR = calculAbattementPVIR(dureeDetention)
  const abattementPS = calculAbattementPVPS(dureeDetention)
  const impotIR = Math.max(0, Math.round(plusValueBrute * (1 - abattementIR / 100) * 0.19))
  const impotPS = Math.max(0, Math.round(plusValueBrute * (1 - abattementPS / 100) * 0.172))
  
  return {
    plusValueBrute: Math.round(plusValueBrute),
    impotIR,
    impotPS,
    impotTotal: impotIR + impotPS,
    abattementIR,
    abattementPS,
    explication: [
      `Prix acquisition majoré : ${prixAcquisitionMajore} €`,
      `Amortissements réintégrés : ${amortissementsCumules} €`,
      `Plus-value brute : ${plusValueBrute} €`,
    ],
    alertes: amortissementsCumules > 0 ? ['⚠️ LF 2024 : Amortissements réintégrés dans la PV'] : [],
    amortissementsReintegres: amortissementsCumules,
  }
}

// Constantes DPE
export const DPE_DISPLAY = {
  INTERDICTIONS: {
    G: 2025,
    F: 2028,
    E: 2034,
  },
}

// Types exportés
export type RegimeFiscalNue = 'MICRO_FONCIER' | 'REEL'
export type ClasseDPE = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

// Format helpers
export const fmtEur = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
export const fmtPct = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '%'
