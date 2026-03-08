// ============================================================
// LegalDevolutionEngine — porté depuis LegalDevolutionEngine.java
// Dévolution légale selon le Code civil français (art. 731-767)
// ============================================================

import type { HeirInput, MaritalStatusEnum, SpouseOptionEnum, RelationshipEnum } from '../types'

const HUNDRED = 100
const FIFTY = 50
const TWENTY_FIVE = 25
const SEVENTY_FIVE = 75

interface BuildHeirsParams {
  maritalStatus: MaritalStatusEnum | null
  hasSpouse: boolean
  spouseName: string
  children: string[]
  hasAllCommonChildren: boolean
  hasLastSurvivorDonation: boolean
  hasWill: boolean
  fatherAlive: boolean
  motherAlive: boolean
  fatherName: string
  motherName: string
  aliveSiblings: string[]
  representationMap?: Record<string, string[]>
  disabledChildren?: Set<string>
  spouseOption?: SpouseOptionEnum | null
  childSoucheMap?: Record<string, string>
  ordinaryAscendants?: string[]
  ordinaryCollaterals?: string[]
}

export function buildHeirs(params: BuildHeirsParams): HeirInput[] {
  const {
    maritalStatus,
    hasSpouse,
    spouseName,
    children,
    hasAllCommonChildren,
    hasLastSurvivorDonation,
    hasWill,
    fatherAlive,
    motherAlive,
    fatherName,
    motherName,
    aliveSiblings = [],
    representationMap = {},
    disabledChildren = new Set<string>(),
    spouseOption,
    childSoucheMap = {},
    ordinaryAscendants = [],
    ordinaryCollaterals = [],
  } = params

  const nbChildren = children.length
  const isMarried = maritalStatus === 'MARRIED'
  const isPacsed = maritalStatus === 'PACSED'

  // CASE 1: With children
  if (nbChildren > 0) {
    return buildWithChildren(
      isMarried, isPacsed, hasSpouse, spouseName,
      children, hasAllCommonChildren, hasLastSurvivorDonation, hasWill,
      disabledChildren, spouseOption ?? null, childSoucheMap
    )
  }

  // CASE 2: No children — with spouse (married)
  if (hasSpouse && isMarried) {
    return buildMarriedNoChildren(spouseName, fatherAlive, motherAlive, fatherName, motherName)
  }

  // PACS without children
  if (hasSpouse && isPacsed) {
    return buildPacsNoChildren(
      spouseName, hasWill, fatherAlive, motherAlive, fatherName, motherName, aliveSiblings
    )
  }

  // CASE 3: No spouse — legal devolution by order
  return buildNoSpouse(
    fatherAlive, motherAlive, fatherName, motherName,
    aliveSiblings, representationMap, ordinaryAscendants, ordinaryCollaterals
  )
}

/**
 * Options conjoint disponibles selon la situation familiale.
 */
export function availableOptions(
  maritalStatus: MaritalStatusEnum | null,
  hasChildren: boolean,
  hasAllCommonChildren: boolean,
  hasLastSurvivorDonation: boolean
): SpouseOptionEnum[] {
  if (maritalStatus !== 'MARRIED' || !hasChildren) return []

  const options: SpouseOptionEnum[] = []

  if (hasAllCommonChildren) {
    options.push('USUFRUIT_TOTAL')
  }

  if (hasLastSurvivorDonation) {
    options.push('QUART_PP_TROIS_QUART_US')
    options.push('TOUTE_PLEINE_PROPRIETE')
  }

  return options
}

// --- Private builders ---

function buildWithChildren(
  isMarried: boolean,
  isPacsed: boolean,
  hasSpouse: boolean,
  spouseName: string,
  children: string[],
  hasAllCommonChildren: boolean,
  hasLastSurvivorDonation: boolean,
  hasWill: boolean,
  disabledChildren: Set<string>,
  spouseOption: SpouseOptionEnum | null,
  childSoucheMap: Record<string, string>
): HeirInput[] {
  const heirs: HeirInput[] = []

  if (hasSpouse && isMarried) {
    heirs.push(makeHeir(spouseName, 'OTHERS', HUNDRED, true, true))
  } else if (hasSpouse && isPacsed && hasWill) {
    heirs.push(makeHeir(spouseName, 'OTHERS', HUNDRED, true, true))
  } else if (hasSpouse && hasWill && !isMarried && !isPacsed) {
    heirs.push(makeHeir(spouseName, 'OTHERS', HUNDRED, true, false))
  }

  // Per-souche share calculation (art. 751 C.civ)
  const soucheGroups = new Map<string, string[]>()
  for (const childName of children) {
    const souche = childSoucheMap[childName] ?? null
    if (souche) {
      const group = soucheGroups.get(souche) ?? []
      group.push(childName)
      soucheGroups.set(souche, group)
    } else {
      const group = soucheGroups.get(childName) ?? []
      group.push(childName)
      soucheGroups.set(childName, group)
    }
  }

  const nbSouches = soucheGroups.size
  const soucheShare = HUNDRED / nbSouches

  for (const [soucheName, members] of soucheGroups) {
    const isRepresentation = !(members.length === 1 && members[0] === soucheName)
      && Object.values(childSoucheMap).includes(soucheName)

    if (!isRepresentation) {
      const childName = members[0]
      const isDisabled = disabledChildren.has(childName)
      heirs.push({
        name: childName,
        relationshipEnum: 'DIRECT_LINE',
        quotaPercentage: round6(soucheShare),
        spouse: false,
        exemptTax: false,
        commonChild: true,
        disabled: isDisabled,
        inheritsOnBehalfOf: null,
        coRepresentantsCount: 0,
      })
    } else {
      const repShare = soucheShare / members.length
      for (const repName of members) {
        const isDisabled = disabledChildren.has(repName)
        heirs.push({
          name: repName,
          relationshipEnum: 'DIRECT_LINE',
          quotaPercentage: round6(repShare),
          spouse: false,
          exemptTax: false,
          commonChild: true,
          disabled: isDisabled,
          inheritsOnBehalfOf: soucheName,
          coRepresentantsCount: members.length,
        })
      }
    }
  }

  return heirs
}

function buildMarriedNoChildren(
  spouseName: string,
  fatherAlive: boolean,
  motherAlive: boolean,
  fatherName: string,
  motherName: string
): HeirInput[] {
  const heirs: HeirInput[] = []
  const nbParents = (fatherAlive ? 1 : 0) + (motherAlive ? 1 : 0)

  if (nbParents === 2) {
    // Art. 757-1: conjoint 1/2, père 1/4, mère 1/4
    heirs.push(makeHeir(spouseName, 'OTHERS', FIFTY, true, true))
    heirs.push(makeHeir(fatherName, 'DIRECT_LINE', TWENTY_FIVE, false, false))
    heirs.push(makeHeir(motherName, 'DIRECT_LINE', TWENTY_FIVE, false, false))
  } else if (nbParents === 1) {
    // Art. 757-1: conjoint 3/4, parent survivant 1/4
    heirs.push(makeHeir(spouseName, 'OTHERS', SEVENTY_FIVE, true, true))
    const parentName = fatherAlive ? fatherName : motherName
    heirs.push(makeHeir(parentName, 'DIRECT_LINE', TWENTY_FIVE, false, false))
  } else {
    // Art. 757-2: conjoint hérite de tout
    heirs.push(makeHeir(spouseName, 'OTHERS', HUNDRED, true, true))
  }

  return heirs
}

function buildPacsNoChildren(
  spouseName: string,
  hasWill: boolean,
  fatherAlive: boolean,
  motherAlive: boolean,
  fatherName: string,
  motherName: string,
  siblings: string[]
): HeirInput[] {
  if (!hasWill) {
    return buildNoSpouse(fatherAlive, motherAlive, fatherName, motherName, siblings, {}, [], [])
  }
  // Avec testament + pas d'enfants : QD = 100%
  return [makeHeir(spouseName, 'OTHERS', HUNDRED, true, true)]
}

function buildNoSpouse(
  fatherAlive: boolean,
  motherAlive: boolean,
  fatherName: string,
  motherName: string,
  aliveSiblings: string[],
  representationMap: Record<string, string[]>,
  ordinaryAscendants: string[],
  ordinaryCollaterals: string[]
): HeirInput[] {
  const heirs: HeirInput[] = []
  const nbParents = (fatherAlive ? 1 : 0) + (motherAlive ? 1 : 0)
  const nbSouches = aliveSiblings.length + Object.keys(representationMap).length

  // ORDER 2: parents + privileged collaterals
  if (nbParents > 0 && nbSouches > 0) {
    const parentShare = TWENTY_FIVE
    if (fatherAlive) heirs.push(makeHeir(fatherName, 'DIRECT_LINE', parentShare, false, false))
    if (motherAlive) heirs.push(makeHeir(motherName, 'DIRECT_LINE', parentShare, false, false))
    const siblingTotal = HUNDRED - parentShare * nbParents
    addSiblingsAndNephews(heirs, aliveSiblings, representationMap, siblingTotal, nbSouches)
  } else if (nbParents > 0) {
    const parentShare = HUNDRED / nbParents
    if (fatherAlive) heirs.push(makeHeir(fatherName, 'DIRECT_LINE', round6(parentShare), false, false))
    if (motherAlive) heirs.push(makeHeir(motherName, 'DIRECT_LINE', round6(parentShare), false, false))
  } else if (nbSouches > 0) {
    addSiblingsAndNephews(heirs, aliveSiblings, representationMap, HUNDRED, nbSouches)
  }

  // ORDER 3: ascendants ordinaires
  if (heirs.length === 0 && ordinaryAscendants.length > 0) {
    const share = HUNDRED / ordinaryAscendants.length
    for (const asc of ordinaryAscendants) {
      heirs.push(makeHeir(asc, 'GRANDPARENT', round6(share), false, false))
    }
  }

  // ORDER 4: collatéraux ordinaires
  if (heirs.length === 0 && ordinaryCollaterals.length > 0) {
    const share = HUNDRED / ordinaryCollaterals.length
    for (const col of ordinaryCollaterals) {
      heirs.push(makeHeir(col, 'UNCLE_AUNT', round6(share), false, false))
    }
  }

  if (heirs.length === 0) {
    throw new Error('Données familiales insuffisantes: renseignez les ascendants/collatéraux ordinaires (ordre 3/4).')
  }

  return heirs
}

function addSiblingsAndNephews(
  heirs: HeirInput[],
  aliveSiblings: string[],
  representationMap: Record<string, string[]>,
  totalShare: number,
  nbSouches: number
): void {
  const soucheShare = totalShare / nbSouches
  for (const sib of aliveSiblings) {
    heirs.push(makeHeir(sib, 'SIBLINGS', round6(soucheShare), false, false))
  }
  for (const [, nephews] of Object.entries(representationMap)) {
    if (nephews.length > 0) {
      const nephewShare = soucheShare / nephews.length
      for (const nephew of nephews) {
        heirs.push(makeHeir(nephew, 'NIECE_NEPHEW', round6(nephewShare), false, false))
      }
    }
  }
}

// --- Helpers ---

function makeHeir(
  name: string,
  rel: RelationshipEnum,
  quota: number,
  spouse: boolean,
  exempt: boolean
): HeirInput {
  return {
    name,
    relationshipEnum: rel,
    quotaPercentage: quota,
    spouse,
    exemptTax: exempt,
    commonChild: false,
    disabled: false,
    inheritsOnBehalfOf: null,
    coRepresentantsCount: 0,
  }
}

function round6(v: number): number {
  return Math.round(v * 1_000_000) / 1_000_000
}
