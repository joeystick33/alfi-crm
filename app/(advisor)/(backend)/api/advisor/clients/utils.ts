 
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

/** Type pour le body brut de création/mise à jour client */
interface RawClientBody {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  mobile?: string
  clientType?: string
  conseillerId?: string
  conseillerRemplacantId?: string
  apporteurId?: string
  birthDate?: string
  birthPlace?: string
  nationality?: string
  address?: unknown
  maritalStatus?: string
  marriageRegime?: string
  numberOfChildren?: number | string
  profession?: string
  employerName?: string
  professionalStatus?: string
  companyName?: string
  siret?: string
  legalForm?: string
  activitySector?: string
  companyCreationDate?: string
  numberOfEmployees?: number | string
  annualRevenue?: number | string
  annualIncome?: number | string
  taxBracket?: string
  fiscalResidence?: string
  irTaxRate?: number | string
  ifiSubject?: boolean
  ifiAmount?: number | string
  taxOptimizations?: unknown
  fiscalNotes?: string
  riskProfile?: string
  investmentHorizon?: string
  investmentGoals?: unknown
  investmentKnowledge?: string
  investmentExperience?: string
  managedByFirm?: boolean
  managementStartDate?: string
  managementFees?: number | string
  managementType?: string
  kycStatus?: string
  kycCompletedAt?: string
  kycNextReviewDate?: string
  status?: string
  portalAccess?: boolean
  portalPassword?: string
}

// ══════════════════════════════════════════════════════════════════════════════
// MAPPERS: Convertir les valeurs du wizard vers les enums Prisma
// ══════════════════════════════════════════════════════════════════════════════

/** Mapper InvestmentHorizon vers valeurs FR */
export const mapInvestmentHorizon = (value: string | undefined): InvestmentHorizon | undefined => {
  if (!value) return undefined
  const mapping: Record<string, InvestmentHorizon> = {
    // Nouvelles valeurs FR
    'COURT': 'COURT',
    'MOYEN': 'MOYEN',
    'LONG': 'LONG',
    // Anciennes valeurs EN (rétrocompatibilité)
    'SHORT': 'COURT',
    'MOYENNE': 'MOYEN',
  }
  return mapping[value] || undefined
}

/** Mapper RiskProfile: supporte les valeurs FR et EN */
export const mapRiskProfile = (value: string | undefined): RiskProfile | undefined => {
  if (!value) return undefined
  const mapping: Record<string, RiskProfile> = {
    // Valeurs wizard FR
    'PRUDENT': 'PRUDENT',
    'EQUILIBRE': 'EQUILIBRE',
    'DYNAMIQUE': 'DYNAMIQUE',
    'OFFENSIF': 'OFFENSIF',
    // Valeurs alternatives
    'CONSERVATEUR': 'CONSERVATEUR',
    'CONSERVATIVE': 'CONSERVATEUR',
    'MODERATE': 'EQUILIBRE',
    'BALANCED': 'EQUILIBRE',
    'AGGRESSIVE': 'OFFENSIF',
  }
  return mapping[value] || undefined
}

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
 * Pour les champs non requis, une chaîne vide retourne undefined
 */
function ensureString(value: unknown, field: string, required = false): string | undefined {
  if (value === null || value === undefined) {
    if (required) throw new Error(`Missing field: ${field}`)
    return undefined
  }

  if (typeof value !== 'string') {
    throw new Error(`Invalid string for field: ${field}`)
  }

  const trimmed = value.trim()
  
  // Chaîne vide : erreur si requis, sinon undefined
  if (!trimmed) {
    if (required) throw new Error(`Missing field: ${field}`)
    return undefined
  }

  return trimmed
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
 * Pour les champs non requis, chaîne vide → undefined
 */
function ensureDate(value: unknown, field: string, required = false): Date | undefined {
  if (value === null || value === undefined) {
    if (required) throw new Error(`Missing field: ${field}`)
    return undefined
  }

  // Accepter chaîne vide pour champs optionnels
  if (typeof value === 'string' && value.trim() === '') {
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
  const search = ensureString(searchParams.get('search') || searchParams.get('q'), 'search')
  
  // Support both limit/offset AND page/pageSize
  let limit = ensureNumber(searchParams.get('limit'), 'limit')
  let offset = ensureNumber(searchParams.get('offset'), 'offset')
  
  // Convert page/pageSize to limit/offset if provided
  const page = ensureNumber(searchParams.get('page'), 'page')
  const pageSize = ensureNumber(searchParams.get('pageSize'), 'pageSize')
  
  if (page !== undefined && pageSize !== undefined) {
    limit = pageSize
    offset = (page - 1) * pageSize
  }

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

  const data = body as RawClientBody

  const firstName = ensureString(data.firstName, 'firstName', true)!
  const lastName = ensureString(data.lastName, 'lastName', true)!
  
  const email = ensureString(data.email, 'email')
  const phone = ensureString(data.phone, 'phone')
  const mobile = ensureString(data.mobile, 'mobile')
  
  const clientType = ensureEnumValue<ClientType>(
    data.clientType,
    'clientType',
    CLIENT_TYPE_VALUES
  )
  
  const conseillerId = ensureString(data.conseillerId, 'conseillerId')
  const conseillerRemplacantId = ensureString(data.conseillerRemplacantId, 'conseillerRemplacantId')
  const apporteurId = ensureString(data.apporteurId, 'apporteurId')
  
  const birthDate = ensureDate(data.birthDate, 'birthDate')
  const birthPlace = ensureString(data.birthPlace, 'birthPlace')
  const nationality = ensureString(data.nationality, 'nationality')
  
  const maritalStatus = ensureEnumValue<MaritalStatus>(
    data.maritalStatus,
    'maritalStatus',
    MARITAL_STATUS_VALUES
  )
  
  const marriageRegime = ensureString(data.marriageRegime, 'marriageRegime')
  const numberOfChildren = ensureNumber(data.numberOfChildren, 'numberOfChildren')
  
  const profession = ensureString(data.profession, 'profession')
  const employerName = ensureString(data.employerName, 'employerName')
  const professionalStatus = ensureString(data.professionalStatus, 'professionalStatus')
  
  // Professional client fields
  const companyName = ensureString(data.companyName, 'companyName')
  const siret = ensureString(data.siret, 'siret')
  const legalForm = ensureString(data.legalForm, 'legalForm')
  const activitySector = ensureString(data.activitySector, 'activitySector')
  const companyCreationDate = ensureDate(data.companyCreationDate, 'companyCreationDate')
  const numberOfEmployees = ensureNumber(data.numberOfEmployees, 'numberOfEmployees')
  const annualRevenue = ensureNumber(data.annualRevenue, 'annualRevenue')
  
  // Financial fields
  const annualIncome = ensureNumber(data.annualIncome, 'annualIncome')
  const taxBracket = ensureString(data.taxBracket, 'taxBracket')
  const fiscalResidence = ensureString(data.fiscalResidence, 'fiscalResidence')
  const irTaxRate = ensureNumber(data.irTaxRate, 'irTaxRate')
  const ifiAmount = ensureNumber(data.ifiAmount, 'ifiAmount')
  const fiscalNotes = ensureString(data.fiscalNotes, 'fiscalNotes')
  
  // Investment profile - Utiliser les mappers pour convertir les valeurs du wizard
  // Le wizard envoie COURT/MOYEN/LONG, Prisma attend SHORT/MEDIUM/LONG
  const rawInvestmentHorizon = data.investmentHorizon
  const investmentHorizon = rawInvestmentHorizon 
    ? mapInvestmentHorizon(rawInvestmentHorizon) 
    : undefined
  
  // Le wizard peut envoyer des valeurs FR ou EN pour le profil de risque
  const rawRiskProfile = data.riskProfile
  const riskProfile = rawRiskProfile 
    ? mapRiskProfile(rawRiskProfile)
    : undefined
  
  const investmentKnowledge = ensureString(data.investmentKnowledge, 'investmentKnowledge')
  const investmentExperience = ensureString(data.investmentExperience, 'investmentExperience')
  
  // Management
  const managementStartDate = ensureDate(data.managementStartDate, 'managementStartDate')
  const managementFees = ensureNumber(data.managementFees, 'managementFees')
  const managementType = ensureString(data.managementType, 'managementType')
  
  // KYC
  const kycStatus = ensureEnumValue<KYCStatus>(
    data.kycStatus,
    'kycStatus',
    KYC_STATUS_VALUES
  )
  
  const kycCompletedAt = ensureDate(data.kycCompletedAt, 'kycCompletedAt')
  const kycNextReviewDate = ensureDate(data.kycNextReviewDate, 'kycNextReviewDate')
  
  // Status
  const status = ensureEnumValue<ClientStatus>(
    data.status,
    'status',
    CLIENT_STATUS_VALUES
  )
  
  const portalPassword = ensureString(data.portalPassword, 'portalPassword')

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
  if (data.address !== undefined) {
    payload.address = data.address
  }
  
  if (data.taxOptimizations !== undefined) {
    payload.taxOptimizations = data.taxOptimizations
  }
  
  if (data.investmentGoals !== undefined) {
    payload.investmentGoals = data.investmentGoals
  }
  
  if (data.ifiSubject !== undefined) {
    payload.ifiSubject = Boolean(data.ifiSubject)
  }
  
  if (data.managedByFirm !== undefined) {
    payload.managedByFirm = Boolean(data.managedByFirm)
  }
  
  if (data.portalAccess !== undefined) {
    payload.portalAccess = Boolean(data.portalAccess)
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

  const data = body as RawClientBody
  const update: UpdateClientPayload = {}

  const firstName = ensureString(data.firstName, 'firstName')
  if (firstName !== undefined) update.firstName = firstName

  const lastName = ensureString(data.lastName, 'lastName')
  if (lastName !== undefined) update.lastName = lastName

  const email = ensureString(data.email, 'email')
  if (email !== undefined) update.email = email

  const phone = ensureString(data.phone, 'phone')
  if (phone !== undefined) update.phone = phone

  const mobile = ensureString(data.mobile, 'mobile')
  if (mobile !== undefined) update.mobile = mobile

  const clientType = ensureEnumValue<ClientType>(
    data.clientType,
    'clientType',
    CLIENT_TYPE_VALUES
  )
  if (clientType !== undefined) update.clientType = clientType

  const conseillerId = ensureString(data.conseillerId, 'conseillerId')
  if (conseillerId !== undefined) update.conseillerId = conseillerId

  const conseillerRemplacantId = ensureString(data.conseillerRemplacantId, 'conseillerRemplacantId')
  if (conseillerRemplacantId !== undefined) update.conseillerRemplacantId = conseillerRemplacantId

  const apporteurId = ensureString(data.apporteurId, 'apporteurId')
  if (apporteurId !== undefined) update.apporteurId = apporteurId

  const birthDate = ensureDate(data.birthDate, 'birthDate')
  if (birthDate !== undefined) update.birthDate = birthDate

  const birthPlace = ensureString(data.birthPlace, 'birthPlace')
  if (birthPlace !== undefined) update.birthPlace = birthPlace

  const nationality = ensureString(data.nationality, 'nationality')
  if (nationality !== undefined) update.nationality = nationality

  const maritalStatus = ensureEnumValue<MaritalStatus>(
    data.maritalStatus,
    'maritalStatus',
    MARITAL_STATUS_VALUES
  )
  if (maritalStatus !== undefined) update.maritalStatus = maritalStatus

  const marriageRegime = ensureString(data.marriageRegime, 'marriageRegime')
  if (marriageRegime !== undefined) update.marriageRegime = marriageRegime

  const numberOfChildren = ensureNumber(data.numberOfChildren, 'numberOfChildren')
  if (numberOfChildren !== undefined) {
    if (numberOfChildren < 0) {
      throw new Error('numberOfChildren must be non-negative')
    }
    update.numberOfChildren = numberOfChildren
  }

  const profession = ensureString(data.profession, 'profession')
  if (profession !== undefined) update.profession = profession

  const employerName = ensureString(data.employerName, 'employerName')
  if (employerName !== undefined) update.employerName = employerName

  const professionalStatus = ensureString(data.professionalStatus, 'professionalStatus')
  if (professionalStatus !== undefined) update.professionalStatus = professionalStatus

  // Professional client fields
  const companyName = ensureString(data.companyName, 'companyName')
  if (companyName !== undefined) update.companyName = companyName

  const siret = ensureString(data.siret, 'siret')
  if (siret !== undefined) update.siret = siret

  const legalForm = ensureString(data.legalForm, 'legalForm')
  if (legalForm !== undefined) update.legalForm = legalForm

  const activitySector = ensureString(data.activitySector, 'activitySector')
  if (activitySector !== undefined) update.activitySector = activitySector

  const companyCreationDate = ensureDate(data.companyCreationDate, 'companyCreationDate')
  if (companyCreationDate !== undefined) update.companyCreationDate = companyCreationDate

  const numberOfEmployees = ensureNumber(data.numberOfEmployees, 'numberOfEmployees')
  if (numberOfEmployees !== undefined) {
    if (numberOfEmployees < 0) {
      throw new Error('numberOfEmployees must be non-negative')
    }
    update.numberOfEmployees = numberOfEmployees
  }

  const annualRevenue = ensureNumber(data.annualRevenue, 'annualRevenue')
  if (annualRevenue !== undefined) update.annualRevenue = annualRevenue

  // Financial fields
  const annualIncome = ensureNumber(data.annualIncome, 'annualIncome')
  if (annualIncome !== undefined) update.annualIncome = annualIncome

  const taxBracket = ensureString(data.taxBracket, 'taxBracket')
  if (taxBracket !== undefined) update.taxBracket = taxBracket

  const fiscalResidence = ensureString(data.fiscalResidence, 'fiscalResidence')
  if (fiscalResidence !== undefined) update.fiscalResidence = fiscalResidence

  const irTaxRate = ensureNumber(data.irTaxRate, 'irTaxRate')
  if (irTaxRate !== undefined) {
    if (irTaxRate < 0 || irTaxRate > 100) {
      throw new Error('irTaxRate must be between 0 and 100')
    }
    update.irTaxRate = irTaxRate
  }

  const ifiAmount = ensureNumber(data.ifiAmount, 'ifiAmount')
  if (ifiAmount !== undefined) update.ifiAmount = ifiAmount

  const fiscalNotes = ensureString(data.fiscalNotes, 'fiscalNotes')
  if (fiscalNotes !== undefined) update.fiscalNotes = fiscalNotes

  // Investment profile - Utiliser les mappers pour convertir les valeurs du wizard
  const rawRiskProfile = data.riskProfile
  if (rawRiskProfile !== undefined) {
    const riskProfile = mapRiskProfile(rawRiskProfile)
    if (riskProfile) update.riskProfile = riskProfile
  }

  const rawInvestmentHorizon = data.investmentHorizon
  if (rawInvestmentHorizon !== undefined) {
    const investmentHorizon = mapInvestmentHorizon(rawInvestmentHorizon)
    if (investmentHorizon) update.investmentHorizon = investmentHorizon
  }

  const investmentKnowledge = ensureString(data.investmentKnowledge, 'investmentKnowledge')
  if (investmentKnowledge !== undefined) update.investmentKnowledge = investmentKnowledge

  const investmentExperience = ensureString(data.investmentExperience, 'investmentExperience')
  if (investmentExperience !== undefined) update.investmentExperience = investmentExperience

  // Management
  const managementStartDate = ensureDate(data.managementStartDate, 'managementStartDate')
  if (managementStartDate !== undefined) update.managementStartDate = managementStartDate

  const managementFees = ensureNumber(data.managementFees, 'managementFees')
  if (managementFees !== undefined) {
    if (managementFees < 0 || managementFees > 100) {
      throw new Error('managementFees must be between 0 and 100')
    }
    update.managementFees = managementFees
  }

  const managementType = ensureString(data.managementType, 'managementType')
  if (managementType !== undefined) update.managementType = managementType

  // KYC
  const kycStatus = ensureEnumValue<KYCStatus>(
    data.kycStatus,
    'kycStatus',
    KYC_STATUS_VALUES
  )
  if (kycStatus !== undefined) update.kycStatus = kycStatus

  const kycCompletedAt = ensureDate(data.kycCompletedAt, 'kycCompletedAt')
  if (kycCompletedAt !== undefined) update.kycCompletedAt = kycCompletedAt

  const kycNextReviewDate = ensureDate(data.kycNextReviewDate, 'kycNextReviewDate')
  if (kycNextReviewDate !== undefined) update.kycNextReviewDate = kycNextReviewDate

  // Status
  const status = ensureEnumValue<ClientStatus>(
    data.status,
    'status',
    CLIENT_STATUS_VALUES
  )
  if (status !== undefined) update.status = status

  const portalPassword = ensureString(data.portalPassword, 'portalPassword')
  if (portalPassword !== undefined) update.portalPassword = portalPassword

  // Handle JSON fields
  if (data.address !== undefined) {
    update.address = data.address
  }

  if (data.taxOptimizations !== undefined) {
    update.taxOptimizations = data.taxOptimizations
  }

  if (data.investmentGoals !== undefined) {
    update.investmentGoals = data.investmentGoals
  }

  if (data.ifiSubject !== undefined) {
    update.ifiSubject = Boolean(data.ifiSubject)
  }

  if (data.managedByFirm !== undefined) {
    update.managedByFirm = Boolean(data.managedByFirm)
  }

  if (data.portalAccess !== undefined) {
    update.portalAccess = Boolean(data.portalAccess)
  }

  if (Object.keys(update).length === 0) {
    throw new Error('No valid fields provided for update')
  }

  return update
}
