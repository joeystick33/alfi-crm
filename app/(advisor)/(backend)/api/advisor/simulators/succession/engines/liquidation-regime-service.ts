// ============================================================
// LiquidationRegimeService — porté depuis LiquidationRegimeService.java
// Liquidation du régime matrimonial
// ============================================================

import type { LiquidationResult } from '../types'

function safe(v: number | null | undefined): number {
  return v ?? 0
}

function scale2(v: number): number {
  return Math.round(v * 100) / 100
}

/**
 * Calcule la liquidation du régime matrimonial.
 */
export function liquidate(
  regime: string | null,
  grossAsset: number,
  totalPassif: number,
  separateAsset: number | null,
  commonAsset: number | null
): LiquidationResult {
  const gross = safe(grossAsset)
  const passif = safe(totalPassif)
  const netTotal = Math.max(0, gross - passif)

  if (!regime || regime.trim() === '') {
    return simple(netTotal)
  }

  const r = regime.toLowerCase().trim()

  if (r.includes('universelle') && r.includes('clause')) {
    return universalCommunityWithClause(netTotal)
  }
  if (r.includes('universelle')) {
    return universalCommunity(netTotal)
  }
  if (r.includes('séparation') || r.includes('separation')) {
    return separateProperty(netTotal, separateAsset)
  }
  if (r.includes('participation')) {
    return participationInAcquisitions(netTotal, separateAsset, commonAsset)
  }

  // Default: communauté réduite aux acquêts
  return communityProperty(netTotal, separateAsset, commonAsset)
}

/** Communauté réduite aux acquêts: propres + 50% communs */
function communityProperty(netTotal: number, separateAsset: number | null, commonAsset: number | null): LiquidationResult {
  let own = safe(separateAsset)
  let common = safe(commonAsset)

  if (own === 0 && common === 0) {
    common = netTotal
  }

  const deceasedShare = own + common / 2
  const spouseShare = common / 2

  return {
    separateAsset: scale2(own),
    commonAsset: scale2(common),
    deceasedShare: scale2(deceasedShare),
    spouseShare: scale2(spouseShare),
    estateEnteringSuccession: scale2(deceasedShare),
  }
}

/** Communauté universelle sans clause: chaque époux 50% */
function universalCommunity(netTotal: number): LiquidationResult {
  const half = netTotal / 2
  return {
    separateAsset: 0,
    commonAsset: scale2(netTotal),
    deceasedShare: scale2(half),
    spouseShare: scale2(half),
    estateEnteringSuccession: scale2(half),
  }
}

/** Communauté universelle avec clause d'attribution intégrale: tout au conjoint */
function universalCommunityWithClause(netTotal: number): LiquidationResult {
  return {
    separateAsset: 0,
    commonAsset: scale2(netTotal),
    deceasedShare: 0,
    spouseShare: scale2(netTotal),
    estateEnteringSuccession: 0,
  }
}

/** Séparation de biens: seuls les biens propres du défunt entrent en succession */
function separateProperty(netTotal: number, separateAsset: number | null): LiquidationResult {
  let own = safe(separateAsset)
  if (own === 0) own = netTotal
  const spouseShare = Math.max(0, netTotal - own)
  return {
    separateAsset: scale2(own),
    commonAsset: 0,
    deceasedShare: scale2(own),
    spouseShare: scale2(spouseShare),
    estateEnteringSuccession: scale2(own),
  }
}

/** Participation aux acquêts: traité comme communauté réduite pour la succession */
function participationInAcquisitions(netTotal: number, separateAsset: number | null, commonAsset: number | null): LiquidationResult {
  return communityProperty(netTotal, separateAsset, commonAsset)
}

/** Pas de régime: tout le net entre en succession */
function simple(netTotal: number): LiquidationResult {
  return {
    separateAsset: null,
    commonAsset: null,
    deceasedShare: null,
    spouseShare: null,
    estateEnteringSuccession: scale2(netTotal),
  }
}
