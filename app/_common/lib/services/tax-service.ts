/**
 * Tax Service (Fiscalité)
 * Calculs IR, IFI, Prélèvements Sociaux, Optimisations
 * Aura CRM - Barèmes 2024 - Aucune simplification
 */

import type { IFI, TaxOptimization } from '../api-types'

// ============================================================================
// BARÈMES FISCAUX 2024
// ============================================================================

/**
 * Barème Impôt sur le Revenu 2024
 * Tranches du revenu imposable par part
 */
export const TAX_BRACKETS_2024 = [
  { limit: 11294, rate: 0 }, // 0%
  { limit: 28797, rate: 0.11 }, // 11%
  { limit: 82341, rate: 0.30 }, // 30%
  { limit: 177106, rate: 0.41 }, // 41%
  { limit: Infinity, rate: 0.45 }, // 45%
] as const

/**
 * Barème IFI 2024
 * Tranches du patrimoine net taxable
 */
export const IFI_BRACKETS_2024 = [
  { limit: 800000, rate: 0 }, // Pas d'IFI
  { limit: 1300000, rate: 0 }, // Franchise entre 800k et 1.3M
  { limit: 1300000, rate: 0.005 }, // 0.5% au-dessus de 1.3M
  { limit: 2570000, rate: 0.007 }, // 0.7%
  { limit: 5000000, rate: 0.01 }, // 1%
  { limit: 10000000, rate: 0.0125 }, // 1.25%
  { limit: Infinity, rate: 0.015 }, // 1.5%
] as const

/**
 * Seuil IFI 2024
 */
export const IFI_THRESHOLD = 1300000 // Seuil d'assujettissement
export const IFI_FRANCHISE_MIN = 800000 // En dessous = pas d'IFI

/**
 * Taux prélèvements sociaux 2024
 */
export const SOCIAL_CONTRIBUTIONS_RATE = 0.172 // 17.2%

/**
 * Abattements et réductions
 */
export const TAX_CONSTANTS = {
  RP_ABATEMENT_IFI: 0.30, // Abattement 30% résidence principale
  DECOTE_CELIBATAIRE: 833, // Décote IR célibataire
  DECOTE_COUPLE: 1378, // Décote IR couple
  DECOTE_COEFF_1: 1929, // Coefficient décote 1
  DECOTE_COEFF_2: 0.7525, // Coefficient décote 2
} as const

// ============================================================================
// CALCUL IMPÔT SUR LE REVENU (IR)
// ============================================================================

/**
 * Calcule le nombre de parts fiscales
 * @param maritalStatus - Statut marital (SINGLE, MARRIED, etc.)
 * @param numberOfChildren - Nombre d'enfants
 * @param dependents - Personnes à charge supplémentaires
 * @returns Nombre de parts fiscales
 */
export function calculateTaxShares(
  maritalStatus: string,
  numberOfChildren: number = 0,
  dependents: number = 0
): number {
  let shares = 1

  // Parts pour le statut marital
  if (maritalStatus === 'MARRIED' || maritalStatus === 'PACS') {
    shares = 2
  } else if (maritalStatus === 'WIDOWED') {
    shares = 1 // Veuf sans enfant = 1 part
  }

  // Parts pour les enfants
  if (numberOfChildren > 0) {
    if (numberOfChildren === 1) {
      shares += 0.5
    } else if (numberOfChildren === 2) {
      shares += 1 // 2 enfants = 1 part complète
    } else {
      // 3+ enfants : 1 part pour les 2 premiers, 1 part par enfant suivant
      shares += 1 + (numberOfChildren - 2) * 1
    }
  }

  // Parts pour personnes à charge supplémentaires
  shares += dependents * 0.5

  return shares
}

/**
 * Calcule l'impôt sur le revenu selon le barème progressif 2024
 * @param fiscalReferenceIncome - Revenu fiscal de référence
 * @param taxShares - Nombre de parts fiscales
 * @returns Objet avec montant IR, TMI, quotient familial
 */
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
  // Revenu imposable par part (quotient familial)
  const quotientFamilial = fiscalReferenceIncome / taxShares

  let grossTax = 0
  let previousLimit = 0
  let taxBracket = 0

  // Calcul de l'impôt brut selon le barème progressif
  for (const bracket of TAX_BRACKETS_2024) {
    if (quotientFamilial > previousLimit) {
      const taxableInThisBracket = Math.min(
        quotientFamilial - previousLimit,
        bracket.limit - previousLimit
      )
      grossTax += taxableInThisBracket * bracket.rate
      taxBracket = bracket.rate * 100 // TMI en %

      if (quotientFamilial <= bracket.limit) {
        break
      }
    }
    previousLimit = bracket.limit
  }

  // Multiplier par le nombre de parts
  grossTax = grossTax * taxShares

  // Calcul de la décote (pour faibles revenus)
  let decote = 0
  const decoteThreshold =
    taxShares === 1
      ? TAX_CONSTANTS.DECOTE_CELIBATAIRE
      : TAX_CONSTANTS.DECOTE_COUPLE

  if (grossTax < decoteThreshold) {
    decote =
      (TAX_CONSTANTS.DECOTE_COEFF_1 * taxShares -
        grossTax * TAX_CONSTANTS.DECOTE_COEFF_2) /
      taxShares
    decote = Math.max(0, decote) * taxShares
  }

  const netTax = Math.max(0, grossTax - decote)

  // Taux effectif d'imposition
  const effectiveRate =
    fiscalReferenceIncome > 0 ? (netTax / fiscalReferenceIncome) * 100 : 0

  return {
    quotientFamilial: Math.round(quotientFamilial),
    taxBracket: Math.round(taxBracket),
    grossTax: Math.round(grossTax),
    decote: Math.round(decote),
    netTax: Math.round(netTax),
    effectiveRate: Math.round(effectiveRate * 10) / 10,
  }
}

/**
 * Calcule le prélèvement mensuel à la source
 * @param annualTax - Impôt annuel
 * @returns Prélèvement mensuel
 */
export function calculateMonthlyPayment(annualTax: number): number {
  return Math.round(annualTax / 12)
}

// ============================================================================
// CALCUL IFI (IMPÔT FORTUNE IMMOBILIÈRE)
// ============================================================================

/**
 * Calcule l'IFI selon le barème 2024
 * @param netTaxableWealth - Patrimoine net taxable
 * @returns Montant IFI, tranche, détails
 */
export function calculateIFI(netTaxableWealth: number): {
  ifiAmount: number
  bracket: string
  isSubjectToIFI: boolean
  distanceFromThreshold: number
} {
  // Pas d'IFI en dessous du seuil
  if (netTaxableWealth < IFI_THRESHOLD) {
    return {
      ifiAmount: 0,
      bracket: 'Non assujetti',
      isSubjectToIFI: false,
      distanceFromThreshold: IFI_THRESHOLD - netTaxableWealth,
    }
  }

  let ifiAmount = 0
  const previousLimit = IFI_THRESHOLD
  let bracket = ''

  // Application du barème progressif
  if (netTaxableWealth <= 1400000) {
    ifiAmount = netTaxableWealth * 0.005
    bracket = '0-1.4M€ : 0.5%'
  } else if (netTaxableWealth <= 2570000) {
    ifiAmount = 1400000 * 0.005 + (netTaxableWealth - 1400000) * 0.007
    bracket = '1.4M-2.57M€ : 0.7%'
  } else if (netTaxableWealth <= 5000000) {
    ifiAmount =
      1400000 * 0.005 +
      (2570000 - 1400000) * 0.007 +
      (netTaxableWealth - 2570000) * 0.01
    bracket = '2.57M-5M€ : 1%'
  } else if (netTaxableWealth <= 10000000) {
    ifiAmount =
      1400000 * 0.005 +
      (2570000 - 1400000) * 0.007 +
      (5000000 - 2570000) * 0.01 +
      (netTaxableWealth - 5000000) * 0.0125
    bracket = '5M-10M€ : 1.25%'
  } else {
    ifiAmount =
      1400000 * 0.005 +
      (2570000 - 1400000) * 0.007 +
      (5000000 - 2570000) * 0.01 +
      (10000000 - 5000000) * 0.0125 +
      (netTaxableWealth - 10000000) * 0.015
    bracket = '>10M€ : 1.5%'
  }

  // Réduction pour faible patrimoine (entre 1.3M et 1.4M)
  if (netTaxableWealth < 1400000) {
    const reduction = 17500 - netTaxableWealth * 0.0125
    ifiAmount = Math.max(0, ifiAmount - reduction)
  }

  return {
    ifiAmount: Math.round(ifiAmount),
    bracket,
    isSubjectToIFI: true,
    distanceFromThreshold: 0,
  }
}

/**
 * Calcule la valeur IFI d'un bien immobilier
 * @param marketValue - Valeur vénale
 * @param isResidencePrincipale - Est-ce la résidence principale ?
 * @param manualDiscount - Décote manuelle (%)
 * @returns Valeur IFI après abattements
 */
export function calculatePropertyIFIValue(
  marketValue: number,
  isResidencePrincipale: boolean = false,
  manualDiscount: number = 0
): number {
  let ifiValue = marketValue

  // Abattement 30% résidence principale
  if (isResidencePrincipale) {
    ifiValue *= 1 - TAX_CONSTANTS.RP_ABATEMENT_IFI
  }

  // Décote manuelle (indivision, usufruit, etc.)
  if (manualDiscount > 0 && manualDiscount <= 100) {
    ifiValue *= 1 - manualDiscount / 100
  }

  return Math.round(ifiValue)
}

// ============================================================================
// PRÉLÈVEMENTS SOCIAUX
// ============================================================================

/**
 * Calcule les prélèvements sociaux sur revenus du patrimoine
 * @param taxableAssetIncome - Revenus du patrimoine soumis à PS
 * @returns Montant PS
 */
export function calculateSocialContributions(
  taxableAssetIncome: number
): number {
  return Math.round(taxableAssetIncome * SOCIAL_CONTRIBUTIONS_RATE)
}

// ============================================================================
// DÉTECTION OPPORTUNITÉS FISCALES
// ============================================================================

/**
 * Détecte les opportunités d'optimisation fiscale
 * @param client - Données client (revenus, patrimoine, IR, IFI)
 * @returns Liste d'optimisations fiscales détectées
 */
export function detectTaxOptimizations(client: {
  annualIncome?: number
  taxBracket?: number
  netWealth?: number
  ifiAmount?: number
  realEstateAssets?: number
  financialAssets?: number
  age?: number
  hasChildren?: boolean
  numberOfChildren?: number
}): Omit<TaxOptimization, 'id' | 'clientId' | 'createdAt' | 'updatedAt'>[] {
  const optimizations: Omit<
    TaxOptimization,
    'id' | 'clientId' | 'createdAt' | 'updatedAt'
  >[] = []

  const annualIncome = client.annualIncome || 0
  const taxBracket = client.taxBracket || 0
  const netWealth = client.netWealth || 0
  const ifiAmount = client.ifiAmount || 0

  // === 1. PER POUR RÉDUCTION IR (TMI >= 30%) ===

  if (taxBracket >= 30 && annualIncome > 30000) {
    const maxContribution = Math.min(annualIncome * 0.1, 35000) // Plafond 10% ou 35k€
    const taxSavings = maxContribution * (taxBracket / 100)

    optimizations.push({
      priority: 'HAUTE',
      category: 'RETRAITE',
      title: 'PER pour réduction IR immédiate',
      description: `Avec un TMI de ${taxBracket}%, chaque euro versé sur un PER réduit l'impôt de ${taxBracket} centimes. Plafond disponible : ${maxContribution.toLocaleString(
        'fr-FR'
      )} €.`,
      potentialSavings: Math.round(taxSavings),
      recommendation: `Versement recommandé : ${Math.min(
        10000,
        maxContribution
      ).toLocaleString(
        'fr-FR'
      )} € pour commencer. Économie fiscale immédiate tout en épargnant pour la retraite.`,
      status: 'DETECTEE',
    })
  }

  // === 2. PROCHE DU SEUIL IFI ===

  if (netWealth > 1000000 && netWealth < IFI_THRESHOLD && ifiAmount === 0) {
    const distanceFromThreshold = IFI_THRESHOLD - netWealth

    optimizations.push({
      priority: 'HAUTE',
      category: 'WEALTH',
      title: 'Proche du seuil IFI - Anticiper',
      description: `Patrimoine net de ${netWealth.toLocaleString(
        'fr-FR'
      )} €, à ${distanceFromThreshold.toLocaleString(
        'fr-FR'
      )} € du seuil IFI (1,3M€). Anticiper pour éviter l'assujettissement.`,
      potentialSavings: undefined,
      recommendation:
        "Stratégies : démembrement de propriété, donation avant seuil, répartition patrimoine entre conjoints, placement hors IFI (contrats d'assurance-vie rachetables).",
      status: 'DETECTEE',
    })
  }

  // === 3. IFI ÉLEVÉ - OPTIMISATION PATRIMOINE ===

  if (ifiAmount > 5000) {
    optimizations.push({
      priority: 'HAUTE',
      category: 'WEALTH',
      title: 'IFI élevé - Restructuration patrimoine',
      description: `IFI de ${ifiAmount.toLocaleString(
        'fr-FR'
      )} € payé. Optimisation possible via restructuration du patrimoine immobilier.`,
      potentialSavings: Math.round(ifiAmount * 0.2), // Économie potentielle 20%
      recommendation:
        "Options : démembrement de propriété (usufruit/nue-propriété), donation avec réserve d'usufruit, SCI avec holding, investissement hors IFI (contrats capitalisation, PEA, PER).",
      status: 'DETECTEE',
    })
  }

  // === 4. DONATIONS AUX ENFANTS (ABATTEMENTS) ===

  if (
    client.hasChildren &&
    client.numberOfChildren &&
    client.numberOfChildren > 0 &&
    netWealth > 200000
  ) {
    const abatementPerChild = 100000 // Abattement parent-enfant
    const totalAbatement = abatementPerChild * client.numberOfChildren

    optimizations.push({
      priority: 'MOYENNE',
      category: 'SUCCESSION',
      title: 'Donations aux enfants - Abattements fiscaux',
      description: `Abattement disponible : ${abatementPerChild.toLocaleString(
        'fr-FR'
      )} € par enfant tous les 15 ans. Total famille : ${totalAbatement.toLocaleString(
        'fr-FR'
      )} €.`,
      potentialSavings: undefined,
      recommendation:
        'Donation anticipée pour réduire la base taxable IFI et optimiser la transmission. Renouvellement tous les 15 ans. Stratégie progressive recommandée.',
      status: 'DETECTEE',
    })
  }

  // === 5. DÉFICIT FONCIER ===

  if (client.realEstateAssets && client.realEstateAssets > 200000) {
    optimizations.push({
      priority: 'MOYENNE',
      category: 'REAL_ESTATE',
      title: 'Déficit foncier - Déduction IR',
      description:
        "Travaux de rénovation sur biens locatifs déductibles du revenu global (limite 10 700 €/an, illimité pour intérêts d'emprunt).",
      potentialSavings: Math.round(10700 * (taxBracket / 100)),
      recommendation:
        'Réaliser travaux éligibles (isolation, chauffage, toiture) sur biens locatifs pour créer du déficit foncier imputable sur le revenu global.',
      status: 'DETECTEE',
    })
  }

  // === 6. INVESTISSEMENT PINEL/DENORMANDIE ===

  if (taxBracket >= 30 && annualIncome > 50000 && annualIncome < 150000) {
    optimizations.push({
      priority: 'MOYENNE',
      category: 'REAL_ESTATE',
      title: 'Loi Pinel+ / Denormandie',
      description:
        'Investissement locatif neuf (Pinel+) ou ancien à rénover (Denormandie) avec réduction IR de 10.5 à 17.5% du prix selon durée.',
      potentialSavings: 21000, // Ex: 200k€ sur 9 ans = 21k€
      recommendation:
        'Zones éligibles Pinel+ : A, A bis, B1. Denormandie : centres-villes Action Cœur de Ville. Engagement location 6, 9 ou 12 ans. Plafonds loyers et ressources locataires.',
      status: 'DETECTEE',
    })
  }

  // === 7. ASSURANCE-VIE APRÈS 8 ANS ===

  if (client.financialAssets && client.financialAssets > 50000) {
    optimizations.push({
      priority: 'BASSE',
      category: 'SAVINGS',
      title: 'Assurance-vie > 8 ans - Abattement',
      description:
        'Après 8 ans : abattement annuel de 4 600 € (célibataire) ou 9 200 € (couple) sur les gains. Fiscalité réduite à 7.5% + 17.2% PS.',
      potentialSavings: undefined,
      recommendation:
        "Privilégier les rachats partiels après 8 ans pour bénéficier de l'abattement annuel. Stratégie de sortie progressive optimisée fiscalement.",
      status: 'DETECTEE',
    })
  }

  // === 8. SOFICA (CINÉMA) POUR TRÈS HAUT TMI ===

  if (taxBracket >= 41 && annualIncome > 100000) {
    optimizations.push({
      priority: 'BASSE',
      category: 'TAX',
      title: 'SOFICA - Réduction IR 30 à 48%',
      description:
        'Investissement SOFICA (cinéma) : réduction IR de 30% (+ 18% si œuvres difficiles). Plafond 18 000 €/an.',
      potentialSavings: 8640, // 18k * 48%
      recommendation:
        'Risque élevé (capital non garanti), illiquidité 5-10 ans. Réservé aux hauts revenus cherchant forte défiscalisation. Diversifier avec autres niches fiscales.',
      status: 'DETECTEE',
    })
  }

  return optimizations
}
