// ============================================================
// FiscalCalculator — porté depuis FiscalCalculator.java
// ============================================================

import type { FiscalRules, RelationshipEnum, Scale, Slice, Abatement } from '../types'

export function maxZero(x: number): number {
  return x > 0 ? x : 0
}

/**
 * Base taxable après abattement selon le lien de parenté
 */
export function baseTaxableAfterAllowance(
  base: number,
  link: RelationshipEnum,
  rules: FiscalRules
): number {
  const abatement = rules.abatementsByLink[link]
  const amount = abatement?.amount ?? 0
  return maxZero(base - amount)
}

/**
 * Application du barème progressif par tranches (borne incluse, dernière tranche null = ∞)
 */
export function rightsPerSlice(taxable: number, scale: Scale | undefined): number {
  if (!scale || !scale.slices || scale.slices.length === 0 || taxable == null || taxable <= 0) {
    return 0
  }

  let previousBase = 0
  let rights = 0

  for (const slice of scale.slices) {
    const upperLimit = slice.upperLimitInc

    // Effective limit = min(taxable, upperLimit) ; null = open (∞)
    const effectiveLimit = upperLimit === null ? taxable : Math.min(upperLimit, taxable)

    // Slice base
    const baseSlice = effectiveLimit - previousBase
    if (baseSlice > 0) {
      const rate = slice.rate ?? 0
      rights += baseSlice * rate
      previousBase = effectiveLimit
    }

    // If entire taxable base reached, exit
    if (upperLimit === null || previousBase >= taxable) {
      break
    }
  }

  return Math.round(rights * 100) / 100
}

/**
 * Pourcentage d'usufruit selon l'âge (barème art. 669 CGI)
 */
export function usufructPctForAge(age: number, rules: FiscalRules): number {
  for (const entry of rules.usufructLevels) {
    if (age <= entry.maxAgeInclus) {
      return entry.pctUsufruit
    }
  }
  // Fallback: dernière entrée
  const last = rules.usufructLevels[rules.usufructLevels.length - 1]
  return last?.pctUsufruit ?? 10
}

/**
 * Valeur fiscale de l'usufruit ou de la nue-propriété
 */
export function valueRights(
  baseFullProperty: number,
  isUsufruct: boolean,
  usufructAge: number,
  rules: FiscalRules
): number {
  if (baseFullProperty <= 0) return 0

  const pctUs = usufructPctForAge(usufructAge, rules) / 100
  const pctNp = 1 - pctUs

  return isUsufruct
    ? baseFullProperty * pctUs
    : baseFullProperty * pctNp
}
