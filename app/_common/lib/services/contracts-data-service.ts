 
/**
 * Contracts Data Service
 * Aggregates contract data for Client 360 TabContrats
 * 
 * Requirements: 9.1, 9.3
 */

import { getPrismaClient } from '../prisma'
import type { PrismaClient } from '@prisma/client'
import type {
  ContratsData,
  Contract,
  ContractsSummary,
  ContractType,
  ContractStatus,
  Beneficiary,
  ContractFees,
  Versement,
  VersementType,
  ContractTypeCount
} from '../../types/client360'

// Valid contract types
export const VALID_CONTRACT_TYPES: ContractType[] = [
  'ASSURANCE_VIE',
  'PER',
  'MADELIN',
  'PREVOYANCE',
  'BANCAIRE'
]

// Valid contract statuses
export const VALID_CONTRACT_STATUSES: ContractStatus[] = ['ACTIF', 'CLOSED', 'TRANSFERRED']

// Contract type labels
export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  ASSURANCE_VIE: 'Assurance-vie',
  PER: 'Plan Épargne Retraite',
  MADELIN: 'Contrat Madelin',
  PREVOYANCE: 'Prévoyance',
  BANCAIRE: 'Produit Bancaire'
}

// Contract type colors
export const CONTRACT_TYPE_COLORS: Record<ContractType, string> = {
  ASSURANCE_VIE: '#3B82F6',
  PER: '#10B981',
  MADELIN: '#F59E0B',
  PREVOYANCE: '#8B5CF6',
  BANCAIRE: '#6B7280'
}

const VALID_VERSEMENT_TYPES: VersementType[] = ['INITIAL', 'PLANIFIE', 'EXCEPTIONAL']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isVersementType(value: unknown): value is VersementType {
  return typeof value === 'string' && (VALID_VERSEMENT_TYPES as readonly string[]).includes(value)
}

/**
 * Converts Prisma Decimal to number
 */
function toNumber(value: unknown): number {
  if (value === null || value === undefined) return 0
  if (isRecord(value) && typeof value.toNumber === 'function') {
    const n = (value.toNumber as () => unknown)()
    return typeof n === 'number' && Number.isFinite(n) ? n : 0
  }

  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

/**
 * Maps Prisma contract type to Client360 ContractType
 */
export function mapContractType(type: string): ContractType {
  const mapping: Record<string, ContractType> = {
    LIFE_INSURANCE: 'ASSURANCE_VIE',
    ASSURANCE_VIE: 'ASSURANCE_VIE',
    RETIREMENT_SAVINGS: 'PER',
    PER: 'PER',
    MADELIN: 'MADELIN',
    HEALTH_INSURANCE: 'PREVOYANCE',
    DEATH_INSURANCE: 'PREVOYANCE',
    DISABILITY_INSURANCE: 'PREVOYANCE',
    PREVOYANCE: 'PREVOYANCE',
    HOME_INSURANCE: 'BANCAIRE',
    CAR_INSURANCE: 'BANCAIRE',
    PROFESSIONAL_INSURANCE: 'BANCAIRE',
    BANCAIRE: 'BANCAIRE',
    OTHER: 'BANCAIRE'
  }
  // Use hasOwnProperty to avoid prototype pollution issues
  return Object.prototype.hasOwnProperty.call(mapping, type) ? mapping[type] : 'BANCAIRE'
}

/**
 * Maps Prisma contract status to Client360 ContractStatus
 */
export function mapContractStatus(status: string): ContractStatus {
  const mapping: Record<string, ContractStatus> = {
    ACTIF: 'ACTIF',
    ACTIVE: 'ACTIF',
    SUSPENDU: 'ACTIF',
    SUSPENDED: 'ACTIF',
    RESILIE: 'CLOSED',
    TERMINATED: 'CLOSED', // Legacy support
    CLOSED: 'CLOSED',
    EXPIRE: 'CLOSED',
    EXPIRED: 'CLOSED',
    TRANSFERRED: 'TRANSFERRED'
  }
  // Use hasOwnProperty to avoid prototype pollution issues
  return Object.prototype.hasOwnProperty.call(mapping, status) ? mapping[status] : 'ACTIF'
}

/**
 * Validates contract type
 */
export function isValidContractType(type: string): boolean {
  return VALID_CONTRACT_TYPES.includes(type as ContractType)
}

/**
 * Validates contract status
 */
export function isValidContractStatus(status: string): boolean {
  return VALID_CONTRACT_STATUSES.includes(status as ContractStatus)
}

/**
 * Validates that isManaged field is present and boolean
 */
export function validateManagedStatus(entity: { isManaged?: unknown }): boolean {
  return typeof entity.isManaged === 'boolean'
}

/**
 * Validates contract completeness - all required fields present
 */
export function validateContractCompleteness(contract: Partial<Contract>): {
  isComplete: boolean
  missingFields: string[]
} {
  const requiredFields = ['id', 'type', 'provider', 'name', 'value', 'status', 'isManaged', 'openDate']
  const missingFields: string[] = []

  for (const field of requiredFields) {
    if (contract[field as keyof Contract] === undefined || contract[field as keyof Contract] === null) {
      missingFields.push(field)
    }
  }

  return {
    isComplete: missingFields.length === 0,
    missingFields
  }
}

/**
 * Parses beneficiaries from JSON
 */
function parseBeneficiaries(data: unknown): Beneficiary[] {
  if (!data) return []
  if (Array.isArray(data)) {
    return data.map((b) => {
      const r = isRecord(b) ? b : {}
      return {
        name: typeof r.name === 'string' ? r.name : '',
        percentage: toNumber(r.percentage),
        clause: typeof r.clause === 'string' ? r.clause : '',
      }
    })
  }
  return []
}

/**
 * Parses fees from JSON
 */
function parseFees(data: unknown): ContractFees {
  if (!data) {
    return { entryFee: 0, managementFee: 0, arbitrageFee: 0 }
  }
  const r = isRecord(data) ? data : {}
  return {
    entryFee: toNumber(r.entryFee),
    managementFee: toNumber(r.managementFee),
    arbitrageFee: toNumber(r.arbitrageFee)
  }
}

/**
 * Parses versements from JSON
 */
function parseVersements(data: unknown): Versement[] {
  if (!data) return []
  if (Array.isArray(data)) {
    return data.map((v) => {
      const r = isRecord(v) ? v : {}
      const versementType = isVersementType(r.type) ? r.type : 'EXCEPTIONAL'
      return {
        date: typeof r.date === 'string' ? r.date : '',
        amount: toNumber(r.amount),
        type: versementType,
      }
    })
  }
  return []
}

/**
 * Transforms Prisma contract to Client360 Contract type
 */
function transformContract(contrat: Record<string, unknown>): Contract {
  const details = isRecord(contrat.details) ? contrat.details : null
  const beneficiaries = parseBeneficiaries(contrat.beneficiaries)
  const fees = parseFees((details && details.fees) || contrat.fees)
  const versements = parseVersements((details && details.versements) || contrat.versements)
  
  return {
    id: typeof contrat.id === 'string' ? contrat.id : '',
    type: mapContractType(typeof contrat.type === 'string' ? contrat.type : ''),
    provider: typeof contrat.provider === 'string' ? contrat.provider : '',
    name: typeof contrat.name === 'string' ? contrat.name : '',
    value: toNumber(contrat.value),
    beneficiaries,
    fees,
    performance: toNumber((details && details.performance) || 0),
    versements,
    status: mapContractStatus(typeof contrat.status === 'string' ? contrat.status : ''),
    isManaged: typeof contrat.isManaged === 'boolean' ? contrat.isManaged : false,
    openDate: contrat.startDate instanceof Date ? contrat.startDate.toISOString() : ''
  }
}

/**
 * Calculates contract summary statistics
 */
export function calculateContractsSummary(contracts: Contract[]): ContractsSummary {
  const totalValue = contracts.reduce((sum, c) => sum + c.value, 0)
  const managedCount = contracts.filter(c => c.isManaged).length
  const nonManagedCount = contracts.filter(c => !c.isManaged).length

  // Group by type
  const byTypeMap = new Map<ContractType, { count: number; totalValue: number }>()
  
  for (const contract of contracts) {
    const existing = byTypeMap.get(contract.type) || { count: 0, totalValue: 0 }
    byTypeMap.set(contract.type, {
      count: existing.count + 1,
      totalValue: existing.totalValue + contract.value
    })
  }

  const byType: ContractTypeCount[] = Array.from(byTypeMap.entries()).map(([type, data]) => ({
    type,
    count: data.count,
    totalValue: data.totalValue
  }))

  return {
    totalValue,
    managedCount,
    nonManagedCount,
    byType
  }
}

/**
 * Validates managed status consistency
 * Property 11: managedCount + nonManagedCount === total contracts
 */
export function validateManagedStatusConsistency(summary: ContractsSummary, totalContracts: number): boolean {
  return summary.managedCount + summary.nonManagedCount === totalContracts
}

/**
 * Calculates contracts data for a client
 */
export async function calculateContratsData(
  clientId: string,
  prisma: PrismaClient,
  cabinetId: string
): Promise<ContratsData> {
  // Fetch client with contracts
  const client = await prisma.client.findFirst({
    where: { id: clientId, cabinetId },
    include: {
      contrats: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!client) {
    throw new Error('Client not found')
  }

  // Transform contracts
  const contracts: Contract[] = (client.contrats || []).map((c) => transformContract(c as unknown as Record<string, unknown>))

  // Calculate summary
  const summary = calculateContractsSummary(contracts)

  return {
    contracts,
    summary
  }
}

export class ContractsDataService {
  private prisma: PrismaClient

  constructor(
    private cabinetId: string,
    private userId: string,
    private isSuperAdmin: boolean = false
  ) {
    this.prisma = getPrismaClient(cabinetId, isSuperAdmin)
  }

  /**
   * Get complete contracts data for a client
   */
  async getContratsData(clientId: string): Promise<ContratsData> {
    return calculateContratsData(clientId, this.prisma, this.cabinetId)
  }

  /**
   * Get contracts for a client
   */
  async getContracts(clientId: string): Promise<Contract[]> {
    const data = await this.getContratsData(clientId)
    return data.contracts
  }

  /**
   * Get contracts by type
   */
  async getContractsByType(clientId: string, type: ContractType): Promise<Contract[]> {
    const data = await this.getContratsData(clientId)
    return data.contracts.filter(c => c.type === type)
  }

  /**
   * Get contract by ID
   */
  async getContractById(clientId: string, contractId: string): Promise<Contract | null> {
    const data = await this.getContratsData(clientId)
    return data.contracts.find(c => c.id === contractId) || null
  }

  /**
   * Get summary metrics
   */
  async getSummary(clientId: string): Promise<ContractsSummary> {
    const data = await this.getContratsData(clientId)
    return data.summary
  }

  /**
   * Get managed contracts
   */
  async getManagedContracts(clientId: string): Promise<Contract[]> {
    const data = await this.getContratsData(clientId)
    return data.contracts.filter(c => c.isManaged)
  }

  /**
   * Get non-managed contracts
   */
  async getNonManagedContracts(clientId: string): Promise<Contract[]> {
    const data = await this.getContratsData(clientId)
    return data.contracts.filter(c => !c.isManaged)
  }
}
