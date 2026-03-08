// ============================================================
// Types fidèlement portés depuis le domaine Java (smp-domain)
// ============================================================

// --- Enums ---

export type RelationshipEnum =
  | 'DIRECT_LINE'
  | 'SIBLINGS'
  | 'NIECE_NEPHEW'
  | 'GRANDPARENT'
  | 'UNCLE_AUNT'
  | 'OTHERS'

export type MaritalStatusEnum = 'SINGLE' | 'MARRIED' | 'PACSED' | 'COHABITATION'

export type SpouseOptionEnum =
  | 'USUFRUIT_TOTAL'
  | 'QUART_PP_TROIS_QUART_US'
  | 'TOUTE_PLEINE_PROPRIETE'
  | 'QUART_PLEINE_PROPRIETE'

export type ScenarioTypeEnum = 'CLIENT_DECEASED' | 'SPOUSE_DECEASED'

export type RightReceivedEnum = 'PLEINE_PROPRIETE' | 'USUFRUIT' | 'NUE_PROPRIETE'

// --- Fiscal domain records ---

export interface Abatement {
  amount: number
}

export interface Slice {
  upperLimitInc: number | null // null = pas de plafond (dernière tranche)
  rate: number                  // ex: 0.05 pour 5%
}

export interface Scale {
  slices: Slice[]
}

export interface UsufructScaleEntry {
  maxAgeInclus: number
  pctUsufruit: number
}

export interface FiscalRules {
  year: number
  abatementsByLink: Partial<Record<RelationshipEnum, Abatement>>
  scalesByLink: Partial<Record<RelationshipEnum, Scale>>
  usufructLevels: UsufructScaleEntry[]
  abatementsPrincipalResidencePct: number  // 0.20
  lifeInsuranceBefore70GlobalAbatement: number  // 152500
  lifeInsuranceAfter70ReintegrationThreshold: number  // 30500
  disabilityAllowance: number  // 159325
  donationRecallYears: number  // 15
  lifeInsurance990IRate1: number  // 0.20
  lifeInsurance990IRate2: number  // 0.3125
  lifeInsurance990IThreshold: number  // 700000
}

// --- Succession input records ---

export interface HeirInput {
  name: string
  relationshipEnum: RelationshipEnum
  quotaPercentage: number  // [0;100]
  spouse: boolean
  exemptTax: boolean
  commonChild: boolean
  disabled: boolean
  inheritsOnBehalfOf: string | null  // non-null if representation
  coRepresentantsCount: number
}

export interface DonationInput {
  beneficiaryName: string
  relationship: RelationshipEnum
  montant: number
  dateDonation: string | null  // ISO date
  rapportable: boolean
}

export interface LifeInsuranceInput {
  beneficiaryName: string
  bonusesPaid: number
  deathBenefit: number
  subscriptionDate: string | null
  lastBonusPaymentDate: number | null
  ageOfInsuredAtPayment: number | null
  allowanceFraction: number  // 1.0 = PP
  owner?: string | null      // 'CLIENT' | 'CONJOINT' | null (null=CLIENT)
}

export interface LegInput {
  beneficiaryName: string
  amount: number
  description?: string | null
  relationship?: string | null
  owner?: string | null  // 'CLIENT' | 'CONJOINT' | null (null=CLIENT)
}

export interface InheritanceInput {
  fiscalYear: number
  scenarioType: ScenarioTypeEnum
  maritalStatusEnum: MaritalStatusEnum | null
  matrimonialRegime: string | null
  spouseOption: SpouseOptionEnum | null
  deceasedAge: number | null
  spouseAge: number | null
  grossAsset: number
  totalPassif: number
  deductibleDebt: number
  lifeInsuranceCapital: number
  heirs: HeirInput[]
  donations: DonationInput[]
  lifeInsurances: LifeInsuranceInput[]
  legs: LegInput[]
  dateOfDeath: string | null
  dateOfStudy: string | null
  hasLastSurvivorDonation: boolean
  hasWill: boolean
  deceasedSeparateAsset: number | null
  commonAsset: number | null
  hasAllCommonChildren: boolean
  principalResidenceValue: number | null
  residenceOccupiedBySpouse: boolean
}

// --- Succession result records ---

export interface HeirResult {
  name: string
  relationship: RelationshipEnum
  taxReceived: RightReceivedEnum
  quotaPercentage: number
  grossValueReceived: number
  taxableValue: number
  allowanceUsed: number
  baseTaxableAfterAllowance: number
  rights: number
  disabled: boolean
}

export interface InheritanceResult {
  scenarioTypeEnum: ScenarioTypeEnum
  netAsset: number
  fiscalInheritanceAsset: number
  totalRights: number
  heirs: HeirResult[]
}

// --- Scenario allocation ---

export interface AllocationLine {
  heirName: string
  rightReceived: RightReceivedEnum
  quotaPercentage: number
}

export interface ScenarioAllocation {
  lines: AllocationLine[]
}

// --- Liquidation result ---

export interface LiquidationResult {
  separateAsset: number | null
  commonAsset: number | null
  deceasedShare: number | null
  spouseShare: number | null
  estateEnteringSuccession: number | null
}
