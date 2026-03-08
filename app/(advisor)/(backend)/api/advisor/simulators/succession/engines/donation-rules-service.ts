// ============================================================
// DonationRulesService — porté depuis DonationRulesService.java
// Art. 784 CGI : rappel fiscal des donations < 15 ans
// ============================================================

import type { DonationInput } from '../types'

const DEFAULT_RECALL_YEARS = 15

/**
 * Total des donations rappelées (< recallYears) pour un héritier donné.
 */
export function recalledDonationsTotal(
  heirName: string,
  donations: DonationInput[],
  dateOfDeath: string | null,
  recallYears: number = DEFAULT_RECALL_YEARS
): number {
  if (!donations || donations.length === 0) return 0

  const reference = dateOfDeath ? new Date(dateOfDeath) : new Date()
  const lowerBound = new Date(reference)
  lowerBound.setFullYear(lowerBound.getFullYear() - recallYears)

  return donations
    .filter(d => d.beneficiaryName === heirName)
    .filter(d => d.rapportable)
    .filter(d => {
      if (!d.dateDonation) return false
      const dd = new Date(d.dateDonation)
      return dd >= lowerBound
    })
    .reduce((sum, d) => sum + (d.montant ?? 0), 0)
}

/**
 * Abattement restant après consommation par les donations rappelées.
 */
export function remainingAllowance(
  heirName: string,
  initialAllowance: number,
  donations: DonationInput[],
  dateOfDeath: string | null,
  recallYears: number = DEFAULT_RECALL_YEARS
): number {
  const consumed = recalledDonationsTotal(heirName, donations, dateOfDeath, recallYears)
  return Math.max(0, initialAllowance - consumed)
}
