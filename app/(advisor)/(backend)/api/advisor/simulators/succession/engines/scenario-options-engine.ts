// ============================================================
// ScenarioOptionsEngine — porté depuis ScenarioOptionsEngineImpl.java
// Génère l'allocation civile (PP/US/NP) selon l'option du conjoint
// ============================================================

import type {
  InheritanceInput,
  HeirInput,
  ScenarioAllocation,
  AllocationLine,
  RightReceivedEnum,
} from '../types'
import { availableQuotaFraction } from './forced-heirship-calculator'

function safe(v: number | null | undefined): number {
  return v ?? 0
}

/**
 * Génère le scénario d'allocation civile.
 */
export function generateScenario(input: InheritanceInput): ScenarioAllocation {
  const heirs = input.heirs ?? []
  const spouse = heirs.find(h => h.spouse) ?? null
  const children = heirs.filter(h => !h.spouse)

  // Pas de conjoint => tout en PP selon les quotas existants
  if (!spouse) {
    if (heirs.length === 0) return { lines: [] }
    validateQuotesSum(heirs)
    return allocationWithoutSpouse(children)
  }

  // Si pas d'option spécifiée, tout en PP selon quotas de buildHeirs
  if (!input.spouseOption) {
    return allocationAllInPP(spouse, children)
  }

  switch (input.spouseOption) {
    case 'USUFRUIT_TOTAL':
      return allocationTotalUsufruct(spouse, children)
    case 'QUART_PP_TROIS_QUART_US':
      return allocationQuarterPP_ThreeQuarterUs(spouse, children)
    case 'TOUTE_PLEINE_PROPRIETE':
      return allocationAllPP_QD(spouse, children)
    case 'QUART_PLEINE_PROPRIETE':
      return allocationQuarterPPOnly(spouse, children)
    default:
      return allocationAllInPP(spouse, children)
  }
}

// --- Scénarios privés ---

function allocationAllInPP(spouse: HeirInput, nonSpouseHeirs: HeirInput[]): ScenarioAllocation {
  const lines: AllocationLine[] = []
  lines.push({ heirName: spouse.name, rightReceived: 'PLEINE_PROPRIETE', quotaPercentage: safe(spouse.quotaPercentage) })
  for (const h of nonSpouseHeirs) {
    lines.push({ heirName: h.name, rightReceived: 'PLEINE_PROPRIETE', quotaPercentage: safe(h.quotaPercentage) })
  }
  return { lines }
}

function allocationWithoutSpouse(heirs: HeirInput[]): ScenarioAllocation {
  const lines: AllocationLine[] = heirs.map(h => ({
    heirName: h.name,
    rightReceived: 'PLEINE_PROPRIETE' as RightReceivedEnum,
    quotaPercentage: safe(h.quotaPercentage),
  }))
  return { lines }
}

function allocationTotalUsufruct(spouse: HeirInput, children: HeirInput[]): ScenarioAllocation {
  const lines: AllocationLine[] = []
  // Conjoint : 100% usufruit
  lines.push({ heirName: spouse.name, rightReceived: 'USUFRUIT', quotaPercentage: 100 })
  // Enfants : 100% nue-propriété répartie selon quotas
  for (const e of children) {
    lines.push({ heirName: e.name, rightReceived: 'NUE_PROPRIETE', quotaPercentage: safe(e.quotaPercentage) })
  }
  return { lines }
}

function allocationQuarterPP_ThreeQuarterUs(spouse: HeirInput, children: HeirInput[]): ScenarioAllocation {
  const lines: AllocationLine[] = []
  // Conjoint : 25% PP + 75% US
  lines.push({ heirName: spouse.name, rightReceived: 'PLEINE_PROPRIETE', quotaPercentage: 25 })
  lines.push({ heirName: spouse.name, rightReceived: 'USUFRUIT', quotaPercentage: 75 })
  // Enfants : NP sur 3/4
  for (const e of children) {
    const pctNP = safe(e.quotaPercentage) * 0.75
    lines.push({ heirName: e.name, rightReceived: 'NUE_PROPRIETE', quotaPercentage: pctNP })
  }
  return { lines }
}

function allocationQuarterPPOnly(spouse: HeirInput, children: HeirInput[]): ScenarioAllocation {
  const lines: AllocationLine[] = []
  // Conjoint : 25% PP
  lines.push({ heirName: spouse.name, rightReceived: 'PLEINE_PROPRIETE', quotaPercentage: 25 })
  // Enfants : 75% PP répartie
  for (const e of children) {
    const pctPP = safe(e.quotaPercentage) * 0.75
    lines.push({ heirName: e.name, rightReceived: 'PLEINE_PROPRIETE', quotaPercentage: pctPP })
  }
  return { lines }
}

function allocationAllPP_QD(spouse: HeirInput, children: HeirInput[]): ScenarioAllocation {
  const lines: AllocationLine[] = []
  const nbChildren = children.length

  if (nbChildren === 0) {
    lines.push({ heirName: spouse.name, rightReceived: 'PLEINE_PROPRIETE', quotaPercentage: 100 })
  } else {
    // Conjoint : quotité disponible en PP (art. 913 C.civ)
    const qdFraction = availableQuotaFraction(nbChildren)
    const qdPct = qdFraction * 100
    lines.push({ heirName: spouse.name, rightReceived: 'PLEINE_PROPRIETE', quotaPercentage: qdPct })

    // Enfants : réserve héréditaire en PP
    const reserveFrac = 1 - qdFraction
    for (const e of children) {
      const pctPP = safe(e.quotaPercentage) * reserveFrac
      lines.push({ heirName: e.name, rightReceived: 'PLEINE_PROPRIETE', quotaPercentage: pctPP })
    }
  }

  return { lines }
}

function validateQuotesSum(heirs: HeirInput[]): void {
  const sum = heirs.reduce((s, h) => s + safe(h.quotaPercentage), 0)
  if (Math.abs(sum - 100) > 0.01) {
    throw new Error(`La somme des quotes-parts doit être égale à 100 (actuelle=${sum.toFixed(2)})`)
  }
}
