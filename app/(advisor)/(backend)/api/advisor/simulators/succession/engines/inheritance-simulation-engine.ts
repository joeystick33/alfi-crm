// ============================================================
// InheritanceSimulationEngine — porté depuis InheritanceSimulationEngineServiceImpl.java
// Moteur principal : allocation civile → valorisation fiscale → barème progressif
// ============================================================

import type {
  InheritanceInput,
  InheritanceResult,
  HeirInput,
  HeirResult,
  FiscalRules,
  RelationshipEnum,
  RightReceivedEnum,
  Scale,
} from '../types'
import { getFiscalRules } from '../fiscal-rules'
import { generateScenario } from './scenario-options-engine'
import { rightsPerSlice, valueRights } from './fiscal-calculator'
import { recalledDonationsTotal } from './donation-rules-service'
import { taxBefore70, reintegratedAfter70 } from './assurance-vie-rules-service'

interface MutableFiscalHeir {
  heir: HeirInput
  quotaPercentage: number
  grossValueReceived: number
  taxableValue: number
  rightsReceived: Set<RightReceivedEnum>
}

/**
 * Simule une succession complète.
 */
export function simulate(input: InheritanceInput): InheritanceResult {
  if (!input) throw new Error('inheritance input data must not be null')

  const fiscalRules = getFiscalRules(input.fiscalYear)

  // Civil net estate
  const civilNetAsset = Math.max(0, input.grossAsset - input.totalPassif)
  let fiscalNetAsset = civilNetAsset

  // Art. 764 bis CGI: 20% abatement on principal residence when occupied by surviving spouse/PACS
  const rpRate = fiscalRules.abatementsPrincipalResidencePct ?? 0.20
  if (
    input.principalResidenceValue != null &&
    input.principalResidenceValue > 0 &&
    input.residenceOccupiedBySpouse &&
    hasSpouseOrPacs(input)
  ) {
    const rpAbatement = Math.round(input.principalResidenceValue * rpRate * 100) / 100
    fiscalNetAsset = Math.max(0, fiscalNetAsset - rpAbatement)
  }
  const fiscalAsset = fiscalNetAsset

  // 1) Civil allocation (PP/US/NP) according to spouse option
  const allocation = generateScenario(input)

  // 2) Index heirs by name
  const heirByName = new Map<string, HeirInput>()
  for (const h of input.heirs) {
    heirByName.set(h.name, h)
  }

  // 3) Accumulate civil values & fiscal values per heir
  const acc = new Map<string, MutableFiscalHeir>()

  for (const line of allocation.lines) {
    const heir = heirByName.get(line.heirName)
    if (!heir) continue

    let fHeir = acc.get(heir.name)
    if (!fHeir) {
      fHeir = {
        heir,
        quotaPercentage: 0,
        grossValueReceived: 0,
        taxableValue: 0,
        rightsReceived: new Set(),
      }
      acc.set(heir.name, fHeir)
    }

    const grossValue = civilNetAsset * line.quotaPercentage / 100
    fHeir.grossValueReceived += grossValue

    const fiscalGrossValue = fiscalAsset * line.quotaPercentage / 100

    let taxable: number
    switch (line.rightReceived) {
      case 'PLEINE_PROPRIETE':
        taxable = fiscalGrossValue
        break
      case 'USUFRUIT':
        taxable = valueRights(fiscalGrossValue, true, usufructAge(input, heir), fiscalRules)
        break
      case 'NUE_PROPRIETE':
        taxable = valueRights(fiscalGrossValue, false, usufructAge(input, heir), fiscalRules)
        break
      default:
        taxable = fiscalGrossValue
    }

    fHeir.taxableValue += taxable
    fHeir.rightsReceived.add(line.rightReceived)
    fHeir.quotaPercentage += line.quotaPercentage
  }

  // Count non-exempt beneficiaries for AV art. 757 B global allowance split
  const avBeneficiaryCount = Array.from(acc.values()).filter(f => !f.heir.exemptTax).length

  // 4) Apply allowance (with donation recall) + progressive scale + life insurance
  let totalRights = 0
  const heirsResult: HeirResult[] = []

  for (const fHeir of acc.values()) {
    const link = fHeir.heir.relationshipEnum

    // Spouse/PACS exemption => inheritance rights = 0
    if (fHeir.heir.exemptTax) {
      const avTax = taxBefore70(fHeir.heir.name, input.lifeInsurances, fiscalRules, true)
      heirsResult.push(toHeirResult(fHeir, link, 0, 0, avTax))
      totalRights += avTax
      continue
    }

    // Full allowance for this relationship
    let fullAllowance = getAllowance(fiscalRules, link)
    // Disability allowance: +159 325 € (art. 779 II CGI), cumulative
    if (fHeir.heir.disabled) {
      const disab = fiscalRules.disabilityAllowance ?? 159_325
      fullAllowance += disab
    }

    // AV art. 757 B: reintegrated premiums after 70 added to taxable base
    const reintegrated757B = reintegratedAfter70(
      fHeir.heir.name, input.lifeInsurances, fiscalRules, avBeneficiaryCount
    )

    // ─── Art. 784 CGI — Rapport fiscal des donations < 15 ans ───
    const recalledDonations = recalledDonationsTotal(
      fHeir.heir.name, input.donations, input.dateOfDeath
    )
    const inheritanceBase = fHeir.taxableValue + reintegrated757B
    const totalCumulBase = inheritanceBase + recalledDonations

    // Apply full allowance on the cumulated base
    const allowanceUsed = Math.min(fullAllowance, totalCumulBase)
    const cumulAfterAllowance = Math.max(0, totalCumulBase - allowanceUsed)

    // Progressive scale on cumulated base
    const scale = getScale(fiscalRules, link)
    const taxOnCumul = rightsPerSlice(cumulAfterAllowance, scale)

    // Tax credit: theoretical tax on donations alone (with same full allowance)
    const donationAfterAllowance = Math.max(0, recalledDonations - fullAllowance)
    const taxCreditDonations = rightsPerSlice(donationAfterAllowance, scale)

    // Net inheritance rights = tax on cumul − credit for donations already taxed
    const inheritanceRights = Math.max(0, taxOnCumul - taxCreditDonations)

    // For display: baseAfterAllowance = net taxable base attributable to the inheritance
    const baseAfterAllowance = Math.max(0, cumulAfterAllowance - donationAfterAllowance)

    // AV art. 990 I: separate tax on premiums before 70
    const avTax = taxBefore70(fHeir.heir.name, input.lifeInsurances, fiscalRules, false)

    const totalHeirRights = inheritanceRights + avTax
    totalRights += totalHeirRights

    heirsResult.push(toHeirResult(fHeir, link, allowanceUsed, baseAfterAllowance, totalHeirRights))
  }

  return {
    scenarioTypeEnum: input.scenarioType,
    netAsset: round2(Math.max(0, input.grossAsset - input.totalPassif)),
    fiscalInheritanceAsset: round2(fiscalAsset),
    totalRights: round2(totalRights),
    heirs: heirsResult,
  }
}

// --- Helpers ---

function hasSpouseOrPacs(input: InheritanceInput): boolean {
  if (!input.maritalStatusEnum) return false
  const isMarriedOrPacsed = input.maritalStatusEnum === 'MARRIED' || input.maritalStatusEnum === 'PACSED'
  return isMarriedOrPacsed && input.heirs?.some(h => h.spouse) === true
}

function usufructAge(input: InheritanceInput, heir: HeirInput): number {
  if (input.spouseAge != null) return input.spouseAge
  return input.deceasedAge ?? 70
}

function getAllowance(rules: FiscalRules, link: RelationshipEnum): number {
  const a = rules.abatementsByLink[link]
  return a?.amount ?? 0
}

function getScale(rules: FiscalRules, link: RelationshipEnum): Scale | undefined {
  return rules.scalesByLink[link]
}

function toHeirResult(
  fHeir: MutableFiscalHeir,
  link: RelationshipEnum,
  allowanceUsed: number,
  baseAfterAllowance: number,
  rights: number
): HeirResult {
  let right: RightReceivedEnum = 'NUE_PROPRIETE'
  if (fHeir.rightsReceived.has('PLEINE_PROPRIETE')) right = 'PLEINE_PROPRIETE'
  else if (fHeir.rightsReceived.has('USUFRUIT')) right = 'USUFRUIT'

  return {
    name: fHeir.heir.name,
    relationship: link,
    taxReceived: right,
    quotaPercentage: round2(fHeir.quotaPercentage),
    grossValueReceived: round2(fHeir.grossValueReceived),
    taxableValue: round2(fHeir.taxableValue),
    allowanceUsed: round2(allowanceUsed),
    baseTaxableAfterAllowance: round2(baseAfterAllowance),
    rights: round2(rights),
    disabled: fHeir.heir.disabled,
  }
}

function round2(v: number): number {
  return Math.round(v * 100) / 100
}
