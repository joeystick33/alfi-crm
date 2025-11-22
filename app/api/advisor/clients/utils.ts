/**
 * Validation utilities for clients API routes
 * 
 * Provides functions to parse query parameters and normalize request payloads.
 * All functions throw descriptive errors for invalid input.
 */

import { 
  ClientStatus, 
  ClientType, 
  MaritalStatus, 
  RiskProfile, 
  InvestmentHorizon, 
  KYCStatus 
} from '@prisma/client'

export type ClientFilters = {
  status?: ClientStatus
  clientType?: ClientType
  conseillerId?: string
  search?: string
  kycStatus?: KYCStatus
  riskProfile?: RiskProfile
  maritalStatus?: MaritalStatus
  limit?: number
  offset?: number
}

export type CreateClientPayload = {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  mobile?: string
  clientType?: ClientType
  conseillerId?: string
  conseillerRemplacantId?: string
  apporteurId?: string
  birthDate?: Date
  birthPlace?: string
  nationality?: string
  address?: any
  maritalStatus?: MaritalStatus
  marriageRegime?: string
  numberOfChildren?: number
  profession?: string
  employerName?: string
  professionalStatus?: string
  // Professional client fields
  companyName?: string
  siret?: string
  legalForm?: string
  activitySector?: string
  companyCreationDate?: Date
  numberOfEmployees?: number
  annualRevenue?: number
  // Financial fields
  annualIncome?: number
  taxBracket?: string
  fiscalResidence?: string
  irTaxRate?: number
  ifiSubject?: boolean
  ifiAmount?: number
  taxOptimizations?: any
  fiscalNotes?: string
  // Investment profile
  riskProfile?: RiskProfile
  investmentHorizon?: InvestmentHorizon
  investmentGoals?: any
  investmentKnowledge?: string
  investmentExperience?: string
  // Management
  managedByFirm?: boolean
  managementStartDate?: Date
  managementFees?: number
  managementType?: string
  // KYC
  kycStatus?: KYCStatus
  kycCompletedAt?: Date
  kycNextReviewDate?: Date
  // Status
  status?: ClientStatus
  // Portal
  portalAccess?: boolean
  portalPassword?: string
}

export type UpdateClientPayload = Partial<CreateClientPayload>

const CLIENT_STATUS_VALUES = new Set<string>(Object.values(ClientStatus))
const CLIENT_TYPE_VALUES = new Set<string>(Object.values(ClientType))
const MARITAL_STATUS_VALUES = new Set<string>(Object.values(MaritalStatus))
const RISK_PROFILE_VALUES = new Set<string>(Object.values(RiskProfile))
const INVESTMENT_HORIZON_VALUES = new Set<string>(Object.values(InvestmentHorizon))
const KYC_STATUS_VALUES = new Set<string>(Object.values(KYCStatus))

/**
 * Ensures a value is a valid string
 */
function ensureString(value: unknown, field: string, required = false): string | undefined {
  if (value === null || value === undefined) {
    if (required) throw new Error(`Missing field: ${field}`)
    return undefined
  }

  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Invalid string for field: ${field}`)
  }

  return value.trim()
}

/**
 * Ensures a value is a valid number
 */
function ensureNumber(value: unknown, field: string, required = false): number | undefined {
  if (value === null || value === undefined) {
    if (required) throw new Error(`Missing field: ${field}`)
    return undefined
  }

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid number for field: ${field}`)
  }

  return parsed
}

/**
 * Ensures a value is a valid date
 */
function ensureDate(value: unknown, field: string, required = false): Date | undefined {
  if (value === null || value === undefined) {
    if (required) throw new Error(`Missing field: ${field}`)
    return undefined
  }

  const date = new Date(value as string)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date for field: ${field}`)
  }

  return date
}

/**
 * Ensures a value is a valid enum value
 */
function ensureEnumValue<T extends string>(
  value: unknown,
  field: string,
  allowed: Set<string>,
  required = false
): T | undefined {
  if (value === null || value === undefined) {
    if (required) throw new Error(`Missing field: ${field}`)
    return undefined
  }

  if (typeof value !== 'string' || !allowed.has(value)) {
    throw new Error(`Invalid ${field}: ${value}`)
  }

  return value as T
}

/**
 * Parses and validates URLSearchParams for client filters
 */
export function parseClientFilters(searchParams: URLSearchParams): ClientFilters {
  const status = ensureEnumValue<ClientStatus>(
    searchParams.get('status'),
    'status',
    CLIENT_STATUS_VALUES
  )
  
  const clientType = ensureEnumValue<ClientType>(
    searchParams.get('clientType'),
    'clientType',
    CLIENT_TYPE_VALUES
  )
  
  const kycStatus = ensureEnumValue<KYCStatus>(
    searchParams.get('kycStatus'),
    'kycStatus',
    KYC_STATUS_VALUES
  )
  
  const riskProfile = ensureEnumValue<RiskProfile>(
    searchParams.get('riskProfile'),
    'riskProfile',
    RISK_PROFILE_VALUES
  )
  
  const maritalStatus = ensureEnumValue<MaritalStatus>(
    searchParams.get('maritalStatus'),
    'maritalStatus',
    MARITAL_STATUS_VALUES
  )
  
  const conseillerId = ensureString(searchParams.get('conseillerId'), 'conseillerId')
  const search = ensureString(searchParams.get('search'), 'search')
  
  const limit = ensureNumber(searchParams.get('limit'), 'limit')
  const offset = ensureNumber(searchParams.get('offset'), 'offset')

  return {
    status,
    clientType,
    conseillerId,
    search,
    kycStatus,
    riskProfile,
    maritalStatus,
    limit,
    offset,
  }
}

/**
 * Validates and normalizes POST request body for client creation
 */
export function normalizeClientCreatePayload(body: unknown): CreateClientPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const firstName = ensureString((body as any).firstName, 'firstName', true)!
  const lastName = ensureString((body as any).lastName, 'lastName', true)!
  
  const email = ensureString((body as any).email, 'email')
  const phone = ensureString((body as any).phone, 'phone')
  const mobile = ensureString((body as any).mobile, 'mobile')
  
  const clientType = ensureEnumValue<ClientType>(
    (body as any).clientType,
    'clientType',
    CLIENT_TYPE_VALUES
  )
  
  const conseillerId = ensureString((body as any).conseillerId, 'conseillerId')
  const conseillerRemplacantId = ensureString((body as any).conseillerRemplacantId, 'conseillerRemplacantId')
  const apporteurId = ensureString((body as any).apporteurId, 'apporteurId')
  
  const birthDate = ensureDate((body as any).birthDate, 'birthDate')
  const birthPlace = ensureString((body as any).birthPlace, 'birthPlace')
  const nationality = ensureString((body as any).nationality, 'nationality')
  
  const maritalStatus = ensureEnumValue<MaritalStatus>(
    (body as any).maritalStatus,
    'maritalStatus',
    MARITAL_STATUS_VALUES
  )
  
  const marriageRegime = ensureString((body as any).marriageRegime, 'marriageRegime')
  const numberOfChildren = ensureNumber((body as any).numberOfChildren, 'numberOfChildren')
  
  const profession = ensureString((body as any).profession, 'profession')
  const employerName = ensureString((body as any).employerName, 'employerName')
  const professionalStatus = ensureString((body as any).professionalStatus, 'professionalStatus')
  
  // Professional client fields
  const companyName = ensureString((body as any).companyName, 'companyName')
  const siret = ensureString((body as any).siret, 'siret')
  const legalForm = ensureString((body as any).legalForm, 'legalForm')
  const activitySector = ensureString((body as any).activitySector, 'activitySector')
  const companyCreationDate = ensureDate((body as any).companyCreationDate, 'companyCreationDate')
  const numberOfEmployees = ensureNumber((body as any).numberOfEmployees, 'numberOfEmployees')
  const annualRevenue = ensureNumber((body as any).annualRevenue, 'annualRevenue')
  
  // Financial fields
  const annualIncome = ensureNumber((body as any).annualIncome, 'annualIncome')
  const taxBracket = ensureString((body as any).taxBracket, 'taxBracket')
  const fiscalResidence = ensureString((body as any).fiscalResidence, 'fiscalResidence')
  const irTaxRate = ensureNumber((body as any).irTaxRate, 'irTaxRate')
  const ifiAmount = ensureNumber((body as any).ifiAmount, 'ifiAmount')
  const fiscalNotes = ensureString((body as any).fiscalNotes, 'fiscalNotes')
  
  // Investment profile
  const riskProfile = ensureEnumValue<RiskProfile>(
    (body as any).riskProfile,
    'riskProfile',
    RISK_PROFILE_VALUES
  )
  
  const investmentHorizon = ensureEnumValue<InvestmentHorizon>(
    (body as any).investmentHorizon,
    'investmentHorizon',
    INVESTMENT_HORIZON_VALUES
  )
  
  const investmentKnowledge = ensureString((body as any).investmentKnowledge, 'investmentKnowledge')
  const investmentExperience = ensureString((body as any).investmentExperience, 'investmentExperience')
  
  // Management
  const managementStartDate = ensureDate((body as any).managementStartDate, 'managementStartDate')
  const managementFees = ensureNumber((body as any).managementFees, 'managementFees')
  const managementType = ensureString((body as any).managementType, 'managementType')
  
  // KYC
  const kycStatus = ensureEnumValue<KYCStatus>(
    (body as any).kycStatus,
    'kycStatus',
    KYC_STATUS_VALUES
  )
  
  const kycCompletedAt = ensureDate((body as any).kycCompletedAt, 'kycCompletedAt')
  const kycNextReviewDate = ensureDate((body as any).kycNextReviewDate, 'kycNextReviewDate')
  
  // Status
  const status = ensureEnumValue<ClientStatus>(
    (body as any).status,
    'status',
    CLIENT_STATUS_VALUES
  )
  
  const portalPassword = ensureString((body as any).portalPassword, 'portalPassword')

  // Validate percentage fields
  if (irTaxRate !== undefined && (irTaxRate < 0 || irTaxRate > 100)) {
    throw new Error('irTaxRate must be between 0 and 100')
  }
  
  if (managementFees !== undefined && (managementFees < 0 || managementFees > 100)) {
    throw new Error('managementFees must be between 0 and 100')
  }
  
  if (numberOfChildren !== undefined && numberOfChildren < 0) {
    throw new Error('numberOfChildren must be non-negative')
  }
  
  if (numberOfEmployees !== undefined && numberOfEmployees < 0) {
    throw new Error('numberOfEmployees must be non-negative')
  }

  const payload: CreateClientPayload = {
    firstName,
    lastName,
  }

  // Add optional fields
  if (email !== undefined) payload.email = email
  if (phone !== undefined) payload.phone = phone
  if (mobile !== undefined) payload.mobile = mobile
  if (clientType !== undefined) payload.clientType = clientType
  if (conseillerId !== undefined) payload.conseillerId = conseillerId
  if (conseillerRemplacantId !== undefined) payload.conseillerRemplacantId = conseillerRemplacantId
  if (apporteurId !== undefined) payload.apporteurId = apporteurId
  if (birthDate !== undefined) payload.birthDate = birthDate
  if (birthPlace !== undefined) payload.birthPlace = birthPlace
  if (nationality !== undefined) payload.nationality = nationality
  if (maritalStatus !== undefined) payload.maritalStatus = maritalStatus
  if (marriageRegime !== undefined) payload.marriageRegime = marriageRegime
  if (numberOfChildren !== undefined) payload.numberOfChildren = numberOfChildren
  if (profession !== undefined) payload.profession = profession
  if (employerName !== undefined) payload.employerName = employerName
  if (professionalStatus !== undefined) payload.professionalStatus = professionalStatus
  if (companyName !== undefined) payload.companyName = companyName
  if (siret !== undefined) payload.siret = siret
  if (legalForm !== undefined) payload.legalForm = legalForm
  if (activitySector !== undefined) payload.activitySector = activitySector
  if (companyCreationDate !== undefined) payload.companyCreationDate = companyCreationDate
  if (numberOfEmployees !== undefined) payload.numberOfEmployees = numberOfEmployees
  if (annualRevenue !== undefined) payload.annualRevenue = annualRevenue
  if (annualIncome !== undefined) payload.annualIncome = annualIncome
  if (taxBracket !== undefined) payload.taxBracket = taxBracket
  if (fiscalResidence !== undefined) payload.fiscalResidence = fiscalResidence
  if (irTaxRate !== undefined) payload.irTaxRate = irTaxRate
  if (ifiAmount !== undefined) payload.ifiAmount = ifiAmount
  if (fiscalNotes !== undefined) payload.fiscalNotes = fiscalNotes
  if (riskProfile !== undefined) payload.riskProfile = riskProfile
  if (investmentHorizon !== undefined) payload.investmentHorizon = investmentHorizon
  if (investmentKnowledge !== undefined) payload.investmentKnowledge = investmentKnowledge
  if (investmentExperience !== undefined) payload.investmentExperience = investmentExperience
  if (managementStartDate !== undefined) payload.managementStartDate = managementStartDate
  if (managementFees !== undefined) payload.managementFees = managementFees
  if (managementType !== undefined) payload.managementType = managementType
  if (kycStatus !== undefined) payload.kycStatus = kycStatus
  if (kycCompletedAt !== undefined) payload.kycCompletedAt = kycCompletedAt
  if (kycNextReviewDate !== undefined) payload.kycNextReviewDate = kycNextReviewDate
  if (status !== undefined) payload.status = status
  if (portalPassword !== undefined) payload.portalPassword = portalPassword

  // Handle JSON fields
  if ((body as any).address !== undefined) {
    payload.address = (body as any).address
  }
  
  if ((body as any).taxOptimizations !== undefined) {
    payload.taxOptimizations = (body as any).taxOptimizations
  }
  
  if ((body as any).investmentGoals !== undefined) {
    payload.investmentGoals = (body as any).investmentGoals
  }
  
  if ((body as any).ifiSubject !== undefined) {
    payload.ifiSubject = Boolean((body as any).ifiSubject)
  }
  
  if ((body as any).managedByFirm !== undefined) {
    payload.managedByFirm = Boolean((body as any).managedByFirm)
  }
  
  if ((body as any).portalAccess !== undefined) {
    payload.portalAccess = Boolean((body as any).portalAccess)
  }

  return payload
}

/**
 * Validates and normalizes PATCH request body for client updates
 */
export function normalizeClientUpdatePayload(body: unknown): UpdateClientPayload {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid payload')
  }

  const update: UpdateClientPayload = {}

  const firstName = ensureString((body as any).firstName, 'firstName')
  if (firstName !== undefined) update.firstName = firstName

  const lastName = ensureString((body as any).lastName, 'lastName')
  if (lastName !== undefined) update.lastName = lastName

  const email = ensureString((body as any).email, 'email')
  if (email !== undefined) update.email = email

  const phone = ensureString((body as any).phone, 'phone')
  if (phone !== undefined) update.phone = phone

  const mobile = ensureString((body as any).mobile, 'mobile')
  if (mobile !== undefined) update.mobile = mobile

  const clientType = ensureEnumValue<ClientType>(
    (body as any).clientType,
    'clientType',
    CLIENT_TYPE_VALUES
  )
  if (clientType !== undefined) update.clientType = clientType

  const conseillerId = ensureString((body as any).conseillerId, 'conseillerId')
  if (conseillerId !== undefined) update.conseillerId = conseillerId

  const conseillerRemplacantId = ensureString((body as any).conseillerRemplacantId, 'conseillerRemplacantId')
  if (conseillerRemplacantId !== undefined) update.conseillerRemplacantId = conseillerRemplacantId

  const apporteurId = ensureString((body as any).apporteurId, 'apporteurId')
  if (apporteurId !== undefined) update.apporteurId = apporteurId

  const birthDate = ensureDate((body as any).birthDate, 'birthDate')
  if (birthDate !== undefined) update.birthDate = birthDate

  const birthPlace = ensureString((body as any).birthPlace, 'birthPlace')
  if (birthPlace !== undefined) update.birthPlace = birthPlace

  const nationality = ensureString((body as any).nationality, 'nationality')
  if (nationality !== undefined) update.nationality = nationality

  const maritalStatus = ensureEnumValue<MaritalStatus>(
    (body as any).maritalStatus,
    'maritalStatus',
    MARITAL_STATUS_VALUES
  )
  if (maritalStatus !== undefined) update.maritalStatus = maritalStatus

  const marriageRegime = ensureString((body as any).marriageRegime, 'marriageRegime')
  if (marriageRegime !== undefined) update.marriageRegime = marriageRegime

  const numberOfChildren = ensureNumber((body as any).numberOfChildren, 'numberOfChildren')
  if (numberOfChildren !== undefined) {
    if (numberOfChildren < 0) {
      throw new Error('numberOfChildren must be non-negative')
    }
    update.numberOfChildren = numberOfChildren
  }

  const profession = ensureString((body as any).profession, 'profession')
  if (profession !== undefined) update.profession = profession

  const employerName = ensureString((body as any).employerName, 'employerName')
  if (employerName !== undefined) update.employerName = employerName

  const professionalStatus = ensureString((body as any).professionalStatus, 'professionalStatus')
  if (professionalStatus !== undefined) update.professionalStatus = professionalStatus

  // Professional client fields
  const companyName = ensureString((body as any).companyName, 'companyName')
  if (companyName !== undefined) update.companyName = companyName

  const siret = ensureString((body as any).siret, 'siret')
  if (siret !== undefined) update.siret = siret

  const legalForm = ensureString((body as any).legalForm, 'legalForm')
  if (legalForm !== undefined) update.legalForm = legalForm

  const activitySector = ensureString((body as any).activitySector, 'activitySector')
  if (activitySector !== undefined) update.activitySector = activitySector

  const companyCreationDate = ensureDate((body as any).companyCreationDate, 'companyCreationDate')
  if (companyCreationDate !== undefined) update.companyCreationDate = companyCreationDate

  const numberOfEmployees = ensureNumber((body as any).numberOfEmployees, 'numberOfEmployees')
  if (numberOfEmployees !== undefined) {
    if (numberOfEmployees < 0) {
      throw new Error('numberOfEmployees must be non-negative')
    }
    update.numberOfEmployees = numberOfEmployees
  }

  const annualRevenue = ensureNumber((body as any).annualRevenue, 'annualRevenue')
  if (annualRevenue !== undefined) update.annualRevenue = annualRevenue

  // Financial fields
  const annualIncome = ensureNumber((body as any).annualIncome, 'annualIncome')
  if (annualIncome !== undefined) update.annualIncome = annualIncome

  const taxBracket = ensureString((body as any).taxBracket, 'taxBracket')
  if (taxBracket !== undefined) update.taxBracket = taxBracket

  const fiscalResidence = ensureString((body as any).fiscalResidence, 'fiscalResidence')
  if (fiscalResidence !== undefined) update.fiscalResidence = fiscalResidence

  const irTaxRate = ensureNumber((body as any).irTaxRate, 'irTaxRate')
  if (irTaxRate !== undefined) {
    if (irTaxRate < 0 || irTaxRate > 100) {
      throw new Error('irTaxRate must be between 0 and 100')
    }
    update.irTaxRate = irTaxRate
  }

  const ifiAmount = ensureNumber((body as any).ifiAmount, 'ifiAmount')
  if (ifiAmount !== undefined) update.ifiAmount = ifiAmount

  const fiscalNotes = ensureString((body as any).fiscalNotes, 'fiscalNotes')
  if (fiscalNotes !== undefined) update.fiscalNotes = fiscalNotes

  // Investment profile
  const riskProfile = ensureEnumValue<RiskProfile>(
    (body as any).riskProfile,
    'riskProfile',
    RISK_PROFILE_VALUES
  )
  if (riskProfile !== undefined) update.riskProfile = riskProfile

  const investmentHorizon = ensureEnumValue<InvestmentHorizon>(
    (body as any).investmentHorizon,
    'investmentHorizon',
    INVESTMENT_HORIZON_VALUES
  )
  if (investmentHorizon !== undefined) update.investmentHorizon = investmentHorizon

  const investmentKnowledge = ensureString((body as any).investmentKnowledge, 'investmentKnowledge')
  if (investmentKnowledge !== undefined) update.investmentKnowledge = investmentKnowledge

  const investmentExperience = ensureString((body as any).investmentExperience, 'investmentExperience')
  if (investmentExperience !== undefined) update.investmentExperience = investmentExperience

  // Management
  const managementStartDate = ensureDate((body as any).managementStartDate, 'managementStartDate')
  if (managementStartDate !== undefined) update.managementStartDate = managementStartDate

  const managementFees = ensureNumber((body as any).managementFees, 'managementFees')
  if (managementFees !== undefined) {
    if (managementFees < 0 || managementFees > 100) {
      throw new Error('managementFees must be between 0 and 100')
    }
    update.managementFees = managementFees
  }

  const managementType = ensureString((body as any).managementType, 'managementType')
  if (managementType !== undefined) update.managementType = managementType

  // KYC
  const kycStatus = ensureEnumValue<KYCStatus>(
    (body as any).kycStatus,
    'kycStatus',
    KYC_STATUS_VALUES
  )
  if (kycStatus !== undefined) update.kycStatus = kycStatus

  const kycCompletedAt = ensureDate((body as any).kycCompletedAt, 'kycCompletedAt')
  if (kycCompletedAt !== undefined) update.kycCompletedAt = kycCompletedAt

  const kycNextReviewDate = ensureDate((body as any).kycNextReviewDate, 'kycNextReviewDate')
  if (kycNextReviewDate !== undefined) update.kycNextReviewDate = kycNextReviewDate

  // Status
  const status = ensureEnumValue<ClientStatus>(
    (body as any).status,
    'status',
    CLIENT_STATUS_VALUES
  )
  if (status !== undefined) update.status = status

  const portalPassword = ensureString((body as any).portalPassword, 'portalPassword')
  if (portalPassword !== undefined) update.portalPassword = portalPassword

  // Handle JSON fields
  if ((body as any).address !== undefined) {
    update.address = (body as any).address
  }

  if ((body as any).taxOptimizations !== undefined) {
    update.taxOptimizations = (body as any).taxOptimizations
  }

  if ((body as any).investmentGoals !== undefined) {
    update.investmentGoals = (body as any).investmentGoals
  }

  if ((body as any).ifiSubject !== undefined) {
    update.ifiSubject = Boolean((body as any).ifiSubject)
  }

  if ((body as any).managedByFirm !== undefined) {
    update.managedByFirm = Boolean((body as any).managedByFirm)
  }

  if ((body as any).portalAccess !== undefined) {
    update.portalAccess = Boolean((body as any).portalAccess)
  }

  if (Object.keys(update).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  return update
}
