// ============================================================
// ForcedHeirshipCalculator — porté depuis ForcedHeirshipCalculator.java
// Art. 913 C.civ : réserve héréditaire et quotité disponible
// ============================================================

/**
 * Fraction de la réserve héréditaire selon le nombre d'enfants.
 * Art. 913 C.civ:
 *   1 enfant  → réserve = 1/2
 *   2 enfants → réserve = 2/3
 *   3+ enfants → réserve = 3/4
 *   0 enfant  → réserve = 0
 */
export function reserveFraction(numberOfChildren: number): number {
  switch (numberOfChildren) {
    case 0: return 0
    case 1: return 0.50
    case 2: return 0.666667
    default: return 0.75
  }
}

/**
 * Fraction de la quotité disponible.
 */
export function availableQuotaFraction(numberOfChildren: number): number {
  return 1 - reserveFraction(numberOfChildren)
}

/**
 * Montant de la réserve héréditaire.
 */
export function reserveAmount(estateValue: number, numberOfChildren: number): number {
  return Math.round(estateValue * reserveFraction(numberOfChildren) * 100) / 100
}

/**
 * Montant de la quotité disponible.
 */
export function availableQuotaAmount(estateValue: number, numberOfChildren: number): number {
  return Math.round(estateValue * availableQuotaFraction(numberOfChildren) * 100) / 100
}
