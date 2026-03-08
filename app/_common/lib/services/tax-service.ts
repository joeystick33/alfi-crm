/**
 * Tax Service (Fiscalité)
 * Calculs IR, IFI, Prélèvements Sociaux, Optimisations
 * Aura CRM - Barèmes 2026 (revenus 2025) - Config centralisée
 */

import type { IFI, TaxOptimization } from '../api-types'
import {
  RULES,
  TAX_BRACKETS as TAX_BRACKETS_COMPAT,
  IFI_THRESHOLD as IFI_THRESHOLD_IMPORT,
  IFI_FRANCHISE_MIN as IFI_FRANCHISE_MIN_IMPORT,
  SOCIAL_CONTRIBUTIONS_RATE as SOCIAL_CONTRIBUTIONS_RATE_IMPORT,
  TAX_CONSTANTS as TAX_CONSTANTS_IMPORT,
} from '../rules/fiscal-rules'

// ============================================================================
// BARÈMES FISCAUX — Importés depuis la config centralisée (fiscal-rules.ts)
// ============================================================================

/** Barème IR 2026 (revenus 2025) — {limit, rate} format */
export const TAX_BRACKETS_2024 = TAX_BRACKETS_COMPAT

/** Seuil IFI */
export const IFI_THRESHOLD = IFI_THRESHOLD_IMPORT
export const IFI_FRANCHISE_MIN = IFI_FRANCHISE_MIN_IMPORT

/** Taux prélèvements sociaux */
export const SOCIAL_CONTRIBUTIONS_RATE = SOCIAL_CONTRIBUTIONS_RATE_IMPORT

/** Constantes IR (décote, abattements) */
export const TAX_CONSTANTS = TAX_CONSTANTS_IMPORT

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

  // Calcul de l'impôt brut selon le barème progressif 2026
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

  // Calcul de la décote (pour faibles revenus) — Formule 2026
  // Décote = base - (coefficient × impôt brut)
  let decote = 0
  const isCouple = taxShares >= 2
  const seuilDecote = isCouple
    ? RULES.ir.decote.seuil_couple
    : RULES.ir.decote.seuil_celibataire
  const baseDecote = isCouple
    ? RULES.ir.decote.base_couple
    : RULES.ir.decote.base_celibataire

  if (grossTax > 0 && grossTax <= seuilDecote) {
    decote = Math.max(0, Math.round(baseDecote - RULES.ir.decote.coefficient * grossTax))
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
  // LF 2026 : versements non déductibles après 70 ans

  if (taxBracket >= 30 && annualIncome > 30000) {
    const maxContribution = Math.min(annualIncome * RULES.per.plafond_taux, RULES.per.plafond_max_salarie)
    const taxSavings = maxContribution * (taxBracket / 100)
    const ageLimit = RULES.per.age_max_deduction
    const isOverAgeLimit = ageLimit && client.age && client.age >= ageLimit

    if (isOverAgeLimit) {
      optimizations.push({
        priority: 'HAUTE',
        category: 'RETRAITE',
        title: '⚠️ PER — Fin de la déductibilité après 70 ans (LF 2026)',
        description: `Depuis la LF 2026, les versements effectués sur un PER après 70 ans ne sont plus déductibles du revenu imposable. Cette mesure vise à recentrer le PER sur son objectif de financement de la retraite.`,
        potentialSavings: undefined,
        recommendation: `Privilégiez désormais l'assurance-vie pour la transmission (abattement 152 500 €/bénéficiaire art. 990 I) ou des versements PER avant la date limite si vous n'avez pas encore 70 ans.`,
        status: 'DETECTEE',
      })
    } else {
      optimizations.push({
        priority: 'HAUTE',
        category: 'RETRAITE',
        title: 'PER pour réduction IR immédiate',
        description: `Avec un TMI de ${taxBracket}%, chaque euro versé sur un PER réduit l'impôt de ${taxBracket} centimes. Plafond disponible : ${maxContribution.toLocaleString(
          'fr-FR'
        )} €. Report sur ${RULES.per.report_annees} ans (LF 2026).`,
        potentialSavings: Math.round(taxSavings),
        recommendation: `Versement recommandé : ${Math.min(
          10000,
          maxContribution
        ).toLocaleString(
          'fr-FR'
        )} € pour commencer. Économie fiscale immédiate tout en épargnant pour la retraite.${ageLimit && client.age && client.age >= 65 ? ` Attention : la déductibilité PER cessera à 70 ans (LF 2026). Maximisez les versements d'ici là.` : ''}`,
        status: 'DETECTEE',
      })
    }
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
    const abatementPerChild = RULES.succession.abattements.enfant
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
        `Travaux de rénovation sur biens locatifs déductibles du revenu global (limite ${RULES.immobilier.deficit_foncier.plafond_imputation_revenu_global.toLocaleString('fr-FR')} €/an, illimité pour intérêts d'emprunt).`,
      potentialSavings: Math.round(RULES.immobilier.deficit_foncier.plafond_imputation_revenu_global * (taxBracket / 100)),
      recommendation:
        'Réaliser travaux éligibles (isolation, chauffage, toiture) sur biens locatifs pour créer du déficit foncier imputable sur le revenu global.',
      status: 'DETECTEE',
    })
  }

  // === 6. INVESTISSEMENT DENORMANDIE (Pinel supprimé 31/12/2024) ===

  if (taxBracket >= 30 && annualIncome > 50000 && annualIncome < 150000) {
    optimizations.push({
      priority: 'MOYENNE',
      category: 'REAL_ESTATE',
      title: 'Loi Denormandie — Investissement locatif ancien rénové',
      description:
        'Investissement locatif dans l\'ancien avec travaux (≥25% du coût total) en zone éligible. Réduction IR de 12% à 21% du prix selon durée (6, 9 ou 12 ans). Pinel supprimé depuis le 31/12/2024.',
      potentialSavings: 21000,
      recommendation:
        'Zones éligibles : centres-villes Action Cœur de Ville. Engagement location 6, 9 ou 12 ans. Plafonds loyers et ressources locataires. Dispositif prolongé jusqu\'au 31/12/2027.',
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

  // === 9. CDHR — Contribution Différentielle Hauts Revenus (LF 2025, reconduite LF 2026) ===

  const seuilCDHR = annualIncome > (client.age ? RULES.ir.cdhr.seuil_celibataire : RULES.ir.cdhr.seuil_couple)
  if (seuilCDHR && annualIncome > 200000) {
    optimizations.push({
      priority: 'HAUTE',
      category: 'TAX',
      title: 'CDHR — Contribution Différentielle Hauts Revenus',
      description: `${RULES.ir.cdhr.description} Votre revenu de ${annualIncome.toLocaleString('fr-FR')} € est potentiellement concerné par un taux minimum d'imposition de ${(RULES.ir.cdhr.taux_minimum * 100).toFixed(0)}%.`,
      potentialSavings: undefined,
      recommendation: 'Vérifier si votre imposition effective (IR + CEHR) atteint bien 20% du RFR. Si non, la CDHR comblera le différentiel. Stratégies : réduire l\'écart via PER, déficit foncier, ou investissements productifs.',
      status: 'DETECTEE',
    })
  }

  // === 10. RÉDUCTION COLUCHE DOUBLÉE EN 2026 ===

  if (taxBracket >= 30) {
    optimizations.push({
      priority: 'MOYENNE',
      category: 'TAX',
      title: 'Dons Coluche — Plafond doublé à 2 000 € en 2026',
      description: `La LF 2026 double le plafond de la réduction d'impôt « Coluche » à ${RULES.donation.reduction_coluche_2026.toLocaleString('fr-FR')} € (au lieu de ${RULES.donation.reduction_coluche_standard.toLocaleString('fr-FR')} €). Réduction de 75% sur les dons aux organismes d'aide aux personnes en difficulté.`,
      potentialSavings: Math.round(RULES.donation.reduction_coluche_2026 * 0.75),
      recommendation: 'Effectuer des dons aux organismes éligibles (Restos du Cœur, Secours populaire, etc.) pour bénéficier de la réduction de 75% jusqu\'au plafond de 2 000 € en 2026.',
      status: 'DETECTEE',
    })
  }

  return optimizations
}
