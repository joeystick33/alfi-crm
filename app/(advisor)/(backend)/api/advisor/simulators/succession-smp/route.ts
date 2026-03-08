// ============================================================
// API Route: POST /api/advisor/simulators/succession-smp
// Simulateur de succession complet — porté depuis smp-api Java
// Fidèlement aligné sur InheritanceScenariosServiceImpl.java
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { simulate } from './engines/inheritance-simulation-engine'
import { buildHeirs } from './engines/legal-devolution-engine'
import { liquidate } from './engines/liquidation-regime-service'
import { rightsPerSlice } from './engines/fiscal-calculator'
import { getFiscalRules } from './fiscal-rules'
import { availableQuotaFraction } from './engines/forced-heirship-calculator'
import { logger } from '@/app/_common/lib/logger'
import type {
  InheritanceInput,
  HeirInput,
  HeirResult,
  DonationInput,
  LifeInsuranceInput,
  LegInput,
  LiquidationResult,
  MaritalStatusEnum,
  SpouseOptionEnum,
  RelationshipEnum,
} from './types'

// ============================================================
// Request DTO (aligné sur le frontend + référence Java)
// ============================================================
interface SimulationRequestDTO {
  fiscalYear?: number
  scenarioType?: 'CLIENT_DECEASED' | 'SPOUSE_DECEASED'

  // Identité
  deceasedName?: string
  deceasedAge?: number | null

  // Situation matrimoniale
  maritalStatus?: string | null
  matrimonialRegime?: string | null
  clauseAttributionIntegrale?: boolean

  // Conjoint
  spouseName?: string
  spouseAge?: number | null

  // Enfants
  children?: Array<{
    name: string
    commonChild?: boolean
    disabled?: boolean
    predeceased?: boolean
    representants?: Array<{ name: string; disabled?: boolean }>
  }>
  allCommonChildren?: boolean

  // Parents / fratrie
  fatherAlive?: boolean
  motherAlive?: boolean
  fatherName?: string
  motherName?: string
  siblings?: Array<{
    name: string
    alive?: boolean
    relationship?: string
    representants?: Array<{ name: string }>
  }>

  // Patrimoine
  grossAsset?: number
  totalPassif?: number
  principalResidenceValue?: number | null
  residenceOccupiedBySpouse?: boolean
  separateAsset?: number | null
  commonAsset?: number | null

  // Assets détaillés (pour calcul liquidation par ownership — ref: InheritanceScenariosServiceImpl.buildLiquidation)
  assets?: Array<{
    type?: string
    value?: number
    debt?: number
    ownership?: string  // PROPRE_CLIENT | PROPRE_CONJOINT | COMMUN | INDIVISION | null
  }>

  // Assurance-vie
  lifeInsurances?: Array<{
    beneficiaryName: string
    bonusesPaid?: number
    deathBenefit?: number
    ageOfInsuredAtPayment?: number | null
    allowanceFraction?: number
    owner?: string | null  // CLIENT | CONJOINT
  }>

  // Donations
  presenceDonations?: boolean
  donations?: Array<{
    beneficiaryName: string
    relationship?: string
    montant: number
    dateDonation?: string | null
    rapportable?: boolean
    owner?: string | null  // CLIENT | CONJOINT
  }>

  // Legs particuliers (ref: LegCommand.java)
  presenceLegs?: boolean
  legs?: Array<{
    beneficiaryName: string
    amount: number
    relationship?: string | null
    description?: string | null
    owner?: string | null  // CLIENT | CONJOINT
  }>

  // DDV / Testament
  hasLastSurvivorDonation?: boolean
  hasWill?: boolean
  spouseOption?: string | null

  // Date
  dateOfDeath?: string | null
  dateOfStudy?: string | null
}

// ============================================================
// Mapping helpers
// ============================================================

function mapMaritalStatus(s: string | null | undefined): MaritalStatusEnum | null {
  if (!s) return null
  const n = s.toLowerCase().trim()
  if (n === 'marié' || n === 'marie' || n === 'married') return 'MARRIED'
  if (n === 'pacsé' || n === 'pacse' || n === 'pacs' || n === 'pacsed') return 'PACSED'
  if (n.includes('concubin') || n === 'cohabitation') return 'COHABITATION'
  if (n === 'célibataire' || n === 'celibataire' || n === 'single') return 'SINGLE'
  return null
}

function mapSpouseOption(s: string | null | undefined): SpouseOptionEnum | null {
  if (!s) return null
  const n = s.toUpperCase().replace(/[\s-]/g, '_')
  if (n.includes('USUFRUIT_TOTAL') || n.includes('TOTALITE_USUFRUIT') || n.includes('TOTALITE_EN_USUFRUIT')) return 'USUFRUIT_TOTAL'
  if (n.includes('QUART_PP_TROIS') || n.includes('QUART_PP_ET_TROIS')) return 'QUART_PP_TROIS_QUART_US'
  if (n.includes('TOUTE_PLEINE') || n.includes('QUOTITE_DISPONIBLE') || n.includes('PP_QUOTITE')) return 'TOUTE_PLEINE_PROPRIETE'
  if (n.includes('QUART_PP') || n.includes('QUART_PLEINE')) return 'QUART_PLEINE_PROPRIETE'
  return null
}

function mapRelationship(s: string | null | undefined): RelationshipEnum {
  if (!s) return 'OTHERS'
  const n = s.toLowerCase().trim()
  if (n.includes('enfant') || n.includes('child') || n === 'direct_line' || n === 'ligne_directe' || n.includes('parent')) return 'DIRECT_LINE'
  if (n.includes('frère') || n.includes('frere') || n.includes('soeur') || n.includes('sœur') || n === 'siblings') return 'SIBLINGS'
  if (n.includes('neveu') || n.includes('nièce') || n.includes('niece') || n === 'niece_nephew') return 'NIECE_NEPHEW'
  if (n.includes('grand') || n === 'grandparent') return 'GRANDPARENT'
  if (n.includes('oncle') || n.includes('tante') || n.includes('cousin') || n === 'uncle_aunt') return 'UNCLE_AUNT'
  return 'OTHERS'
}

function mapLegRelationship(rel: string | null | undefined): RelationshipEnum {
  if (!rel) return 'OTHERS'
  const s = rel.toLowerCase().trim()
  if (s.includes('enfant') || s.includes('child') || s.includes('parent')) return 'DIRECT_LINE'
  if (s.includes('conjoint') || s.includes('pacs')) return 'OTHERS'
  if (s.includes('frere') || s.includes('frère') || s.includes('soeur') || s.includes('sœur') || s.includes('sibling')) return 'SIBLINGS'
  if (s.includes('neveu') || s.includes('nièce') || s.includes('niece')) return 'NIECE_NEPHEW'
  if (s.includes('grand-parent') || s.includes('grandparent') || s.includes('grand_parent') || s.includes('ascendant')) return 'GRANDPARENT'
  if (s.includes('oncle') || s.includes('tante') || s.includes('cousin') || s.includes('uncle') || s.includes('aunt')) return 'UNCLE_AUNT'
  return 'OTHERS'
}

function isSpouseOrPacs(rel: string | null | undefined): boolean {
  if (!rel) return false
  const s = rel.toLowerCase()
  return s.includes('conjoint') || s.includes('pacs') || s.includes('spouse')
}

// ============================================================
// Resolve default spouse option (ref: InheritanceScenariosServiceImpl.resolveDefaultSpouseOption)
// ============================================================
function resolveDefaultSpouseOption(
  isMarried: boolean, isPacsed: boolean, nbChildren: number,
  allCommonChildren: boolean, hasWill: boolean, rawSpouseOption: string | null | undefined
): SpouseOptionEnum | null {
  if (isMarried && nbChildren > 0) {
    if (rawSpouseOption) return mapSpouseOption(rawSpouseOption)
    return allCommonChildren ? 'USUFRUIT_TOTAL' : 'QUART_PLEINE_PROPRIETE'
  }
  if (isPacsed && hasWill && nbChildren > 0) return 'TOUTE_PLEINE_PROPRIETE'
  if (!isMarried && !isPacsed && hasWill && nbChildren > 0) return 'TOUTE_PLEINE_PROPRIETE'
  return null
}

// ============================================================
// Liquidation builder (ref: InheritanceScenariosServiceImpl.buildLiquidation)
// Computes separate/common from ownership field when available
// ============================================================
function buildLiquidation(dto: SimulationRequestDTO): LiquidationResult | null {
  const maritalStatus = mapMaritalStatus(dto.maritalStatus)
  if (maritalStatus !== 'MARRIED' && maritalStatus !== 'PACSED') return null

  const grossAsset = dto.grossAsset ?? 0
  const regime = dto.matrimonialRegime ?? null

  let separateAsset = 0
  let commonAsset = 0
  let ownershipPassif = 0
  let hasOwnershipData = false

  if (dto.assets && dto.assets.length > 0) {
    for (const a of dto.assets) {
      const val = a.value ?? 0
      const debt = a.debt ?? 0
      const net = Math.max(0, val - debt)
      const own = a.ownership?.trim().toUpperCase() ?? ''
      if (own) {
        hasOwnershipData = true
        if (own.includes('PROPRE_CLIENT') || own === 'PROPRE') {
          separateAsset += net
          ownershipPassif += debt
        } else if (own.includes('PROPRE_CONJOINT')) {
          // Excluded from succession estate
        } else {
          // COMMUN, INDIVISION, or unrecognized → common pool
          commonAsset += net
          ownershipPassif += debt
        }
      } else {
        commonAsset += net
        ownershipPassif += debt
      }
    }
  }

  const passif = hasOwnershipData
    ? ownershipPassif
    : (dto.totalPassif ?? 0) + sumAssetsDebts(dto.assets)

  return liquidate(
    regime,
    grossAsset,
    passif,
    hasOwnershipData ? separateAsset : (dto.separateAsset ?? null),
    hasOwnershipData ? commonAsset : (dto.commonAsset ?? null)
  )
}

function sumAssetsDebts(assets?: Array<{ debt?: number }>): number {
  if (!assets) return 0
  return assets.reduce((s, a) => s + (a.debt ?? 0), 0)
}

// ============================================================
// Owner-based filtering (ref: InheritanceScenariosServiceImpl filter methods)
// ============================================================
function filterByDeceasedOwner<T extends { owner?: string | null }>(items: T[] | undefined): T[] {
  if (!items) return []
  return items.filter(d => !d.owner || d.owner.trim() === '' || d.owner.toUpperCase() === 'CLIENT')
}

function filterBySurvivorOwner<T extends { owner?: string | null }>(items: T[] | undefined): T[] {
  if (!items) return []
  return items.filter(d => d.owner && d.owner.toUpperCase() === 'CONJOINT')
}

// ============================================================
// RP extraction for estate (ref: extractPrincipalResidenceValueForEstate)
// ============================================================
function extractPrincipalResidenceValueForEstate(
  dto: SimulationRequestDTO, estateNet: number
): number {
  if (!dto.residenceOccupiedBySpouse) return 0
  if (!dto.principalResidenceValue || dto.principalResidenceValue <= 0) return 0
  if (estateNet <= 0) return 0

  const rpVal = dto.principalResidenceValue

  // If detailed assets with ownership, compute included RP proportion
  if (dto.assets && dto.assets.length > 0) {
    const hasOwnershipData = dto.assets.some(a => a.ownership && a.ownership.trim() !== '')
    if (hasOwnershipData) {
      let includedRp = 0
      for (const a of dto.assets) {
        if (!a.type) continue
        const t = stripAccents(a.type).toUpperCase()
        if (!t.includes('RESIDENCE')) continue
        const net = Math.max(0, (a.value ?? 0) - (a.debt ?? 0))
        if (net <= 0) continue
        const own = (a.ownership ?? '').trim().toUpperCase()
        if (own.includes('PROPRE_CLIENT') || own === 'PROPRE') {
          includedRp += net
        } else if (own.includes('PROPRE_CONJOINT')) {
          // Not part of deceased estate
        } else {
          // COMMUN / INDIVISION → simplified 50%
          includedRp += net * 0.5
        }
      }
      return Math.round(Math.min(includedRp, estateNet) * 100) / 100
    }
  }

  // Fallback: capped by estate
  return Math.round(Math.min(rpVal, estateNet) * 100) / 100
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

// ============================================================
// Sum of legs amounts
// ============================================================
function sumLegs(legs: LegInput[]): number {
  return legs.reduce((s, l) => s + (l.amount ?? 0), 0)
}

// ============================================================
// Build InheritanceInput for first death (ref: buildFirstDeathInput)
// ============================================================
function buildFirstDeathInput(
  dto: SimulationRequestDTO,
  liquidation: LiquidationResult | null,
  spouseOption: SpouseOptionEnum | null
): InheritanceInput {
  const maritalStatus = mapMaritalStatus(dto.maritalStatus)
  const isMarried = maritalStatus === 'MARRIED'
  const isPacsed = maritalStatus === 'PACSED'
  const hasSpouse = (isMarried || isPacsed || maritalStatus === 'COHABITATION') && !!dto.spouseName

  // Children
  const childrenNames: string[] = []
  const childSoucheMap: Record<string, string> = {}
  const disabledChildren = new Set<string>()

  for (const child of dto.children ?? []) {
    if (child.predeceased && child.representants && child.representants.length > 0) {
      for (const rep of child.representants) {
        childrenNames.push(rep.name)
        childSoucheMap[rep.name] = child.name
        // P1 B-1: propagate handicap flag from representants (petits-enfants)
        if (rep.disabled) disabledChildren.add(rep.name)
      }
    } else {
      childrenNames.push(child.name)
      if (child.disabled) disabledChildren.add(child.name)
    }
  }

  // Siblings
  const aliveSiblings: string[] = []
  const representationMap: Record<string, string[]> = {}
  for (const sib of dto.siblings ?? []) {
    if (sib.alive !== false) {
      aliveSiblings.push(sib.name)
    } else if (sib.representants && sib.representants.length > 0) {
      representationMap[sib.name] = sib.representants.map(r => r.name)
    }
  }

  const allCommonChildren = dto.allCommonChildren ?? (dto.children ?? []).every(c => c.commonChild !== false)

  const heirs: HeirInput[] = buildHeirs({
    maritalStatus,
    hasSpouse,
    spouseName: dto.spouseName ?? 'Conjoint',
    children: childrenNames,
    hasAllCommonChildren: allCommonChildren,
    hasLastSurvivorDonation: dto.hasLastSurvivorDonation ?? false,
    hasWill: dto.hasWill ?? false,
    fatherAlive: dto.fatherAlive ?? false,
    motherAlive: dto.motherAlive ?? false,
    fatherName: dto.fatherName ?? 'Père',
    motherName: dto.motherName ?? 'Mère',
    aliveSiblings,
    representationMap,
    disabledChildren,
    spouseOption,
    childSoucheMap,
  })

  // --- CRITIQUE: Use liquidation result as gross asset (ref: lines 249-258) ---
  const grossTotal = dto.grossAsset ?? 0
  const passif = dto.totalPassif ?? 0
  let grossAsset: number
  let inputPassif: number
  if (liquidation && liquidation.estateEnteringSuccession != null && liquidation.estateEnteringSuccession > 0) {
    grossAsset = liquidation.estateEnteringSuccession
    inputPassif = 0
  } else {
    grossAsset = grossTotal
    inputPassif = passif
  }

  // --- CRITIQUE: Filter liberalities by deceased owner ---
  const deceasedDonations = filterByDeceasedOwner(dto.presenceDonations !== false ? dto.donations : undefined)
  const deceasedLegs = filterByDeceasedOwner(dto.presenceLegs !== false ? dto.legs : undefined)
  const deceasedAV = filterByDeceasedOwner(dto.lifeInsurances)

  // --- CRITIQUE: Deduct legs from gross estate (ref: lines 267-269) ---
  const legsInput: LegInput[] = deceasedLegs.map(l => ({
    beneficiaryName: l.beneficiaryName,
    amount: l.amount ?? 0,
    description: l.description ?? null,
    relationship: l.relationship ?? null,
    owner: l.owner ?? null,
  }))
  const totalLegs = sumLegs(legsInput)
  grossAsset = Math.max(0, grossAsset - totalLegs)

  // --- Map donations (only deceased's) ---
  const donations: DonationInput[] = deceasedDonations.map(d => ({
    beneficiaryName: d.beneficiaryName,
    relationship: mapRelationship(d.relationship),
    montant: d.montant ?? 0,
    dateDonation: d.dateDonation ?? null,
    rapportable: d.rapportable !== false,
  }))

  // --- Map life insurances (only deceased's) ---
  const lifeInsurances: LifeInsuranceInput[] = deceasedAV.map(li => ({
    beneficiaryName: li.beneficiaryName,
    bonusesPaid: li.bonusesPaid ?? 0,
    deathBenefit: li.deathBenefit ?? 0,
    subscriptionDate: null,
    lastBonusPaymentDate: null,
    ageOfInsuredAtPayment: li.ageOfInsuredAtPayment ?? null,
    allowanceFraction: li.allowanceFraction ?? 1,
    owner: li.owner ?? null,
  }))

  // --- MAJEUR: RP value conditioned on residenceOccupiedBySpouse ---
  const netTotal = Math.max(0, grossTotal - passif)
  const rpValue = extractPrincipalResidenceValueForEstate(dto, Math.min(grossAsset, netTotal))

  return {
    fiscalYear: dto.fiscalYear ?? 2026,
    scenarioType: 'CLIENT_DECEASED',
    maritalStatusEnum: maritalStatus,
    matrimonialRegime: dto.matrimonialRegime ?? null,
    spouseOption,
    deceasedAge: dto.deceasedAge ?? null,
    spouseAge: dto.spouseAge ?? null,
    grossAsset,
    totalPassif: inputPassif,
    deductibleDebt: inputPassif,
    lifeInsuranceCapital: lifeInsurances.reduce((s, li) => s + li.deathBenefit, 0),
    heirs,
    donations,
    lifeInsurances,
    legs: legsInput,
    dateOfDeath: dto.dateOfDeath ?? null,
    dateOfStudy: dto.dateOfStudy ?? new Date().toISOString().split('T')[0],
    hasLastSurvivorDonation: dto.hasLastSurvivorDonation ?? false,
    hasWill: dto.hasWill ?? false,
    deceasedSeparateAsset: dto.separateAsset ?? null,
    commonAsset: dto.commonAsset ?? null,
    hasAllCommonChildren: allCommonChildren,
    principalResidenceValue: rpValue > 0 ? rpValue : null,
    residenceOccupiedBySpouse: dto.residenceOccupiedBySpouse ?? false,
  }
}

// ============================================================
// Build InheritanceInput for second death — SPOUSE_DECEASED
// (ref: buildSecondDeathForOption)
// ============================================================
function buildSecondDeathInput(
  dto: SimulationRequestDTO,
  liquidation: LiquidationResult | null,
  firstDeathOption: SpouseOptionEnum | null
): InheritanceInput | null {
  if (!dto.spouseName) return null
  const maritalStatus = mapMaritalStatus(dto.maritalStatus)
  const isMarried = maritalStatus === 'MARRIED'
  const isPacsedWithWill = maritalStatus === 'PACSED' && (dto.hasWill ?? false)
  if (!isMarried && !isPacsedWithWill) return null

  const spouseOwnHalf = liquidation?.spouseShare ?? 0
  const deceasedShare = liquidation?.estateEnteringSuccession ?? 0
  const nbChildren = (dto.children ?? []).length

  // PP portion the spouse received at 1st death
  const ppReceived = computePPReceivedBySpouse(firstDeathOption, deceasedShare, nbChildren)

  // PROPRE_CONJOINT assets (excluded from 1st death, now part of 2nd death)
  let conjointPropreNet = 0
  if (dto.assets) {
    for (const a of dto.assets) {
      const own = (a.ownership ?? '').trim().toUpperCase()
      if (own.includes('PROPRE_CONJOINT')) {
        conjointPropreNet += Math.max(0, (a.value ?? 0) - (a.debt ?? 0))
      }
    }
  }

  const spousePatrimoine = spouseOwnHalf + conjointPropreNet + ppReceived

  // Children names for 2nd death — preserve disabled flag (P0 B-8 fix)
  const childrenNames: string[] = []
  const disabledChildren2nd = new Set<string>()
  const childSoucheMap2nd: Record<string, string> = {}
  for (const child of dto.children ?? []) {
    if (child.predeceased && child.representants && child.representants.length > 0) {
      for (const rep of child.representants) {
        childrenNames.push(rep.name)
        childSoucheMap2nd[rep.name] = child.name
      }
    } else {
      childrenNames.push(child.name)
      if (child.disabled) disabledChildren2nd.add(child.name)
    }
  }

  // Build heirs for 2nd death: spouse dies as single
  const heirs: HeirInput[] = buildHeirs({
    maritalStatus: 'SINGLE',
    hasSpouse: false,
    spouseName: '',
    children: childrenNames,
    hasAllCommonChildren: true,
    hasLastSurvivorDonation: false,
    hasWill: false,
    fatherAlive: false,
    motherAlive: false,
    fatherName: '',
    motherName: '',
    aliveSiblings: [],
    representationMap: {},
    disabledChildren: disabledChildren2nd,
    spouseOption: null,
    childSoucheMap: childSoucheMap2nd,
  })

  // Survivor's own donations (owner=CONJOINT) recalled at 2nd death
  const survivorDonations = filterBySurvivorOwner(dto.donations).map(d => ({
    beneficiaryName: d.beneficiaryName,
    relationship: mapRelationship(d.relationship),
    montant: d.montant ?? 0,
    dateDonation: d.dateDonation ?? null,
    rapportable: d.rapportable !== false,
  }))

  // Survivor's AV contracts
  const survivorAV = filterBySurvivorOwner(dto.lifeInsurances).map(li => ({
    beneficiaryName: li.beneficiaryName,
    bonusesPaid: li.bonusesPaid ?? 0,
    deathBenefit: li.deathBenefit ?? 0,
    subscriptionDate: null,
    lastBonusPaymentDate: null,
    ageOfInsuredAtPayment: li.ageOfInsuredAtPayment ?? null,
    allowanceFraction: li.allowanceFraction ?? 1,
    owner: li.owner ?? null,
  }))

  // RP at 2nd death: capped by spouse patrimoine
  const rpFull = dto.principalResidenceValue ?? 0
  const rpValue = Math.min(rpFull, spousePatrimoine)

  return {
    fiscalYear: dto.fiscalYear ?? 2026,
    scenarioType: 'SPOUSE_DECEASED',
    maritalStatusEnum: 'SINGLE',
    matrimonialRegime: null,
    spouseOption: null,
    deceasedAge: dto.spouseAge ?? null,
    spouseAge: null,
    grossAsset: spousePatrimoine,
    totalPassif: 0,
    deductibleDebt: 0,
    lifeInsuranceCapital: survivorAV.reduce((s, li) => s + li.deathBenefit, 0),
    heirs,
    donations: survivorDonations,
    lifeInsurances: survivorAV,
    legs: [],
    dateOfDeath: null,
    dateOfStudy: new Date().toISOString().split('T')[0],
    hasLastSurvivorDonation: false,
    hasWill: false,
    deceasedSeparateAsset: null,
    commonAsset: null,
    hasAllCommonChildren: true,
    principalResidenceValue: rpValue > 0 ? rpValue : null,
    residenceOccupiedBySpouse: false,
  }
}

function computePPReceivedBySpouse(
  option: SpouseOptionEnum | null, deceasedShare: number, nbChildren: number
): number {
  if (!option || deceasedShare <= 0) return 0
  switch (option) {
    case 'USUFRUIT_TOTAL': return 0
    case 'QUART_PP_TROIS_QUART_US':
    case 'QUART_PLEINE_PROPRIETE':
      return Math.round(deceasedShare * 0.25 * 100) / 100
    case 'TOUTE_PLEINE_PROPRIETE': {
      const qdFraction = availableQuotaFraction(nbChildren)
      return Math.round(deceasedShare * qdFraction * 100) / 100
    }
    default: return 0
  }
}

// ============================================================
// Legs taxation (ref: enrichWithLegsTax)
// Each legataire gets separate allowance + progressive scale
// ============================================================
function computeLegsTax(legs: LegInput[], fiscalYear: number): {
  legsHeirs: HeirResult[]
  totalLegsRights: number
} {
  if (!legs || legs.length === 0) return { legsHeirs: [], totalLegsRights: 0 }

  const fiscalRules = getFiscalRules(fiscalYear)
  const legsHeirs: HeirResult[] = []
  let totalLegsRights = 0

  for (const leg of legs) {
    if (!leg.amount || leg.amount <= 0) continue
    const name = leg.beneficiaryName || 'Légataire'
    const link = mapLegRelationship(leg.relationship)

    // Conjoint/PACS legataire is exempt
    if (isSpouseOrPacs(leg.relationship)) {
      legsHeirs.push({
        name,
        relationship: 'OTHERS',
        taxReceived: 'PLEINE_PROPRIETE',
        quotaPercentage: 0,
        grossValueReceived: Math.round(leg.amount * 100) / 100,
        taxableValue: Math.round(leg.amount * 100) / 100,
        allowanceUsed: 0,
        baseTaxableAfterAllowance: 0,
        rights: 0,
        disabled: false,
      })
      continue
    }

    const abatement = fiscalRules.abatementsByLink[link]
    const allowance = abatement?.amount ?? 0
    const baseAfterAllowance = Math.max(0, leg.amount - allowance)
    const scale = fiscalRules.scalesByLink[link]
    const legRights = scale ? rightsPerSlice(baseAfterAllowance, scale) : 0

    totalLegsRights += legRights

    legsHeirs.push({
      name,
      relationship: link,
      taxReceived: 'PLEINE_PROPRIETE',
      quotaPercentage: 0,
      grossValueReceived: Math.round(leg.amount * 100) / 100,
      taxableValue: Math.round(leg.amount * 100) / 100,
      allowanceUsed: Math.round(Math.min(allowance, leg.amount) * 100) / 100,
      baseTaxableAfterAllowance: Math.round(baseAfterAllowance * 100) / 100,
      rights: Math.round(legRights * 100) / 100,
      disabled: false,
    })
  }

  return { legsHeirs, totalLegsRights: Math.round(totalLegsRights * 100) / 100 }
}

// ============================================================
// POST handler
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const body: SimulationRequestDTO = await req.json()

    const maritalStatus = mapMaritalStatus(body.maritalStatus)
    const isMarried = maritalStatus === 'MARRIED'
    const isPacsed = maritalStatus === 'PACSED'
    const nbChildren = (body.children ?? []).length
    const allCommonChildren = body.allCommonChildren ?? (body.children ?? []).every(c => c.commonChild !== false)

    // 1) Compute liquidation FIRST (ref: deceasedClientScenario line 89)
    const liquidation = buildLiquidation(body)

    // 2) Resolve spouse option (ref: resolveDefaultSpouseOption)
    const spouseOption = resolveDefaultSpouseOption(
      isMarried, isPacsed, nbChildren, allCommonChildren,
      body.hasWill ?? false, body.spouseOption
    )

    // 3) Build 1st death input using liquidation result
    const input = buildFirstDeathInput(body, liquidation, spouseOption)
    const result = simulate(input)

    // 4) Enrich with legs taxation (ref: enrichWithLegsTax)
    const { legsHeirs, totalLegsRights } = computeLegsTax(input.legs, input.fiscalYear)
    const enrichedHeirs = [...result.heirs, ...legsHeirs]
    const enrichedTotalRights = Math.round((result.totalRights + totalLegsRights) * 100) / 100

    const enrichedResult = {
      ...result,
      heirs: enrichedHeirs,
      totalRights: enrichedTotalRights,
    }

    // 5) Build 2nd death result if applicable (ref: deceasedSpouseScenario)
    let secondDeathResult = null
    const secondDeathInput = buildSecondDeathInput(body, liquidation, spouseOption)
    if (secondDeathInput) {
      secondDeathResult = simulate(secondDeathInput)
    }

    // 6) Notary fees and net transmission (ref: toScenarioResult)
    const netAsset = enrichedResult.netAsset
    const notaryFees = Math.round(netAsset * 0.02 * 100) / 100
    const netTransmission = Math.max(0, Math.round((netAsset - enrichedTotalRights - notaryFees) * 100) / 100)
    const transmissionRate = netAsset > 0 ? Math.round(netTransmission / netAsset * 10000) / 100 : 0

    return NextResponse.json({
      success: true,
      result: enrichedResult,
      liquidation,
      secondDeathResult,
      scenarioMeta: {
        notaryFees,
        netTransmission,
        transmissionRate,
        spouseOption: spouseOption ?? null,
        legsCount: legsHeirs.length,
        totalLegsRights,
      },
      input: {
        fiscalYear: input.fiscalYear,
        scenarioType: input.scenarioType,
        maritalStatus: input.maritalStatusEnum,
        spouseOption: input.spouseOption,
        netAsset: Math.max(0, (body.grossAsset ?? 0) - (body.totalPassif ?? 0)),
        grossAsset: body.grossAsset ?? 0,
        totalPassif: body.totalPassif ?? 0,
        estateAfterLiquidation: input.grossAsset,
        legsDeducted: sumLegs(input.legs),
        nbHeirs: input.heirs.length,
        nbDonations: input.donations.length,
        nbLifeInsurances: input.lifeInsurances.length,
        nbLegs: input.legs.length,
      },
    })
  } catch (error: any) {
    logger.error('[succession-smp] Erreur:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur interne' },
      { status: 400 }
    )
  }
}
