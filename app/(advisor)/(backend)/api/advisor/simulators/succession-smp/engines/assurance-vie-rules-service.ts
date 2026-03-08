// ============================================================
// AssuranceVieRulesService — porté depuis AssuranceVieRulesService.java
// Art. 990 I CGI (avant 70 ans) et Art. 757 B CGI (après 70 ans)
// ============================================================

import type { FiscalRules, LifeInsuranceInput } from '../types'

/**
 * Taxe art. 990 I CGI sur les primes versées avant 70 ans pour un bénéficiaire.
 * 152 500 € d'abattement par bénéficiaire, puis 20% jusqu'à 700 000 €, 31.25% au-delà.
 * Conjoint/PACS = exonéré.
 */
export function taxBefore70(
  beneficiaryName: string,
  lifeInsurances: LifeInsuranceInput[],
  rules: FiscalRules,
  spouseOrPacs: boolean
): number {
  if (spouseOrPacs || !lifeInsurances || lifeInsurances.length === 0) {
    return 0
  }

  const before70Entries = lifeInsurances.filter(
    a => a.beneficiaryName === beneficiaryName
      && a.ageOfInsuredAtPayment != null
      && a.ageOfInsuredAtPayment < 70
  )

  const totalBefore70 = before70Entries.reduce(
    (sum, a) => sum + (a.deathBenefit ?? 0), 0
  )

  if (totalBefore70 <= 0) return 0

  const baseAllowance = rules.lifeInsuranceBefore70GlobalAbatement ?? 0

  // Art. 990 I avec démembrement : abattement proratisé selon fraction
  let effectiveAllowance = 0
  for (const entry of before70Entries) {
    const fraction = entry.allowanceFraction ?? 1
    effectiveAllowance += baseAllowance * fraction
  }
  effectiveAllowance = Math.min(effectiveAllowance, baseAllowance)
  effectiveAllowance = Math.round(effectiveAllowance * 100) / 100

  const taxable = Math.max(0, totalBefore70 - effectiveAllowance)
  if (taxable === 0) return 0

  const rate1 = rules.lifeInsurance990IRate1 ?? 0.20
  const rate2 = rules.lifeInsurance990IRate2 ?? 0.3125
  const threshold = rules.lifeInsurance990IThreshold ?? 700_000

  let tax: number
  if (taxable <= threshold) {
    tax = taxable * rate1
  } else {
    tax = threshold * rate1 + (taxable - threshold) * rate2
  }

  return Math.round(tax * 100) / 100
}

/**
 * Montant des primes après 70 ans réintégrées dans l'actif successoral (art. 757 B CGI).
 * Abattement global de 30 500 € partagé entre tous les bénéficiaires.
 */
export function reintegratedAfter70(
  beneficiaryName: string,
  lifeInsurances: LifeInsuranceInput[],
  rules: FiscalRules,
  totalBeneficiaries: number
): number {
  if (!lifeInsurances || lifeInsurances.length === 0) return 0

  const totalAfter70 = lifeInsurances
    .filter(a => a.beneficiaryName === beneficiaryName
      && a.ageOfInsuredAtPayment != null
      && a.ageOfInsuredAtPayment >= 70)
    .reduce((sum, a) => sum + (a.bonusesPaid ?? 0), 0)

  if (totalAfter70 <= 0) return 0

  const globalAllowance = rules.lifeInsuranceAfter70ReintegrationThreshold ?? 0
  const nbBeneficiaries = Math.max(totalBeneficiaries, 1)
  const share = Math.round((globalAllowance / nbBeneficiaries) * 100) / 100

  return Math.round(Math.max(0, totalAfter70 - share) * 100) / 100
}
