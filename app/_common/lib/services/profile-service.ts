 
/**
 * Profile Service
 * 
 * Service for managing Client 360 profile data including identity, family, legal rights, and fiscal info.
 * Implements Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6
 */

import type { PrismaClient } from '@prisma/client'
import { RULES } from '@/app/_common/lib/rules/fiscal-rules'
import type { 
  ProfileData, 
  ProfileIdentity, 
  ProfileLegalRights, 
  ProfileFiscalInfo,
  FamilyMember,
  FamilyRole,
  LegalStructure,
  Address
} from '@/app/_common/types/client360'

// ============================================================================
// Types
// ============================================================================

export interface FamilyMemberInput {
  role: FamilyRole
  firstName: string
  lastName: string
  birthDate?: string
  isFiscalDependent?: boolean
}

export interface ProfileUpdateInput {
  firstName?: string
  lastName?: string
  birthDate?: string
  nationality?: string
  email?: string
  phone?: string
  address?: Address
  matrimonialRegime?: string
  professionalStatus?: string
  legalStructures?: LegalStructure[]
}

// ============================================================================
// Fiscal Shares Calculation
// ============================================================================

/**
 * Calculates fiscal shares (parts fiscales) based on French tax rules
 * Property 5: Fiscal shares calculation
 * 
 * Rules:
 * - 1 share per adult (single person = 1, couple = 2)
 * - 0.5 share per dependent child (first two children)
 * - 1 share per additional dependent child (3rd and beyond)
 * - Additional 0.5 share for single parent with children
 * 
 * @param hasSpouse - Whether the client has a spouse
 * @param dependentChildren - Number of dependent children
 * @param isSingleParent - Whether the client is a single parent
 * @returns Number of fiscal shares
 */
export function calculateFiscalShares(
  hasSpouse: boolean,
  dependentChildren: number,
  isSingleParent: boolean = false
): number {
  // Base shares: 1 for single, 2 for couple
  let shares = hasSpouse ? 2 : 1
  
  // Add shares for dependent children
  if (dependentChildren > 0) {
    // First two children: 0.5 share each
    const firstTwoChildren = Math.min(dependentChildren, 2)
    shares += firstTwoChildren * 0.5
    
    // Additional children (3rd and beyond): 1 share each
    if (dependentChildren > 2) {
      shares += (dependentChildren - 2) * 1
    }
    
    // Single parent bonus: additional 0.5 share
    if (isSingleParent && !hasSpouse) {
      shares += 0.5
    }
  }
  
  return shares
}

/**
 * Validates fiscal shares calculation
 */
export function validateFiscalShares(
  shares: number,
  hasSpouse: boolean,
  dependentChildren: number,
  isSingleParent: boolean = false
): boolean {
  const expectedShares = calculateFiscalShares(hasSpouse, dependentChildren, isSingleParent)
  return Math.abs(shares - expectedShares) < 0.001
}

// ============================================================================
// IFI Calculation
// ============================================================================

/**
 * Calculates IFI taxable base from real estate assets
 * Property 6: IFI taxable base calculation
 * 
 * @param realEstateAssets - Array of real estate assets with values and IFI taxability
 * @param deductibleLiabilities - Total deductible liabilities (mortgages on taxable properties)
 * @returns IFI taxable base
 */
export function calculateIFITaxableBase(
  realEstateAssets: Array<{ value: number; isTaxable: boolean; abatement?: number }>,
  deductibleLiabilities: number = 0
): number {
  // Sum of taxable real estate assets (with any abatements applied)
  const totalTaxableAssets = realEstateAssets
    .filter(asset => asset.isTaxable)
    .reduce((sum, asset) => {
      const abatementRate = asset.abatement || 0
      const taxableValue = asset.value * (1 - abatementRate / 100)
      return sum + taxableValue
    }, 0)
  
  // Subtract deductible liabilities
  const taxableBase = Math.max(0, totalTaxableAssets - deductibleLiabilities)
  
  return taxableBase
}

/**
 * Validates IFI taxable base calculation
 */
export function validateIFITaxableBase(
  calculatedBase: number,
  realEstateAssets: Array<{ value: number; isTaxable: boolean; abatement?: number }>,
  deductibleLiabilities: number = 0
): boolean {
  const expectedBase = calculateIFITaxableBase(realEstateAssets, deductibleLiabilities)
  return Math.abs(calculatedBase - expectedBase) < 0.01
}

/**
 * Calculates IFI amount based on taxable base
 * IFI threshold: 1,300,000€
 * IFI brackets (2024):
 * - 0 to 800,000€: 0%
 * - 800,001€ to 1,300,000€: 0.50%
 * - 1,300,001€ to 2,570,000€: 0.70%
 * - 2,570,001€ to 5,000,000€: 1.00%
 * - 5,000,001€ to 10,000,000€: 1.25%
 * - Above 10,000,000€: 1.50%
 */
export function calculateIFIAmount(taxableBase: number): number {
  const IFI_THRESHOLD = RULES.ifi.seuil_assujettissement
  
  if (taxableBase < IFI_THRESHOLD) {
    return 0
  }
  
  const brackets = RULES.ifi.bareme.map(t => ({
    max: t.max,
    rate: t.taux,
  }))
  
  let tax = 0
  let remainingBase = taxableBase
  let previousMax = 0
  
  for (const bracket of brackets) {
    const taxableInBracket = Math.min(remainingBase, bracket.max - previousMax)
    if (taxableInBracket <= 0) break
    
    tax += taxableInBracket * bracket.rate
    remainingBase -= taxableInBracket
    previousMax = bracket.max
  }
  
  return Math.round(tax)
}

// ============================================================================
// Family Member Helpers
// ============================================================================

/**
 * Maps database family relationship to FamilyRole
 */
export function mapRelationshipToRole(relationship: string): FamilyRole {
  const mapping: Record<string, FamilyRole> = {
    SPOUSE: 'CONJOINT',
    CHILD: 'CHILD_MAJOR', // Default to major, will be determined by age
    PARENT: 'DEPENDENT',
    SIBLING: 'DEPENDENT',
    GRANDCHILD: 'CHILD_MINOR',
    ASCENDANT: 'DEPENDENT',
    OTHER: 'DEPENDENT'
  }
  return mapping[relationship] || 'DEPENDENT'
}

/**
 * Determines if a child is minor based on birth date
 */
export function isMinorChild(birthDate: Date | string | null): boolean {
  if (!birthDate) return false
  
  const birth = new Date(birthDate)
  const today = new Date()
  const age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 < 18
  }
  return age < 18
}

/**
 * Transforms database family member to ProfileData FamilyMember
 */
export function transformFamilyMember(dbMember: any): FamilyMember {
  let role: FamilyRole = mapRelationshipToRole(dbMember.relationship)
  
  // Determine if child is minor or major
  if (dbMember.relationship === 'ENFANT') {
    role = isMinorChild(dbMember.birthDate) ? 'CHILD_MINOR' : 'CHILD_MAJOR'
  }
  
  return {
    id: dbMember.id,
    role,
    firstName: dbMember.firstName,
    lastName: dbMember.lastName,
    birthDate: dbMember.birthDate?.toISOString().split('T')[0] || '',
    isFiscalDependent: dbMember.isDependent || false
  }
}

// ============================================================================
// Profile Data Calculation
// ============================================================================

/**
 * Calculates complete profile data for a client
 */
export async function calculateProfileData(
  client: any,
  prisma: PrismaClient,
  cabinetId: string
): Promise<ProfileData> {
  // Transform identity data
  const identity: ProfileIdentity = {
    firstName: client.firstName || '',
    lastName: client.lastName || '',
    birthDate: client.birthDate?.toISOString().split('T')[0] || '',
    nationality: client.nationality || '',
    email: client.email || '',
    phone: client.phone || client.mobile || '',
    address: client.address as Address || {}
  }
  
  // Transform family members
  const family: FamilyMember[] = (client.familyMembers || []).map(transformFamilyMember)
  
  // Parse legal structures from client data
  const legalStructures: LegalStructure[] = []
  if (client.legalStructures) {
    try {
      const structures = typeof client.legalStructures === 'string' 
        ? JSON.parse(client.legalStructures) 
        : client.legalStructures
      if (Array.isArray(structures)) {
        legalStructures.push(...structures)
      }
    } catch {
      // Ignore parsing errors
    }
  }
  
  // Build legal rights
  const legalRights: ProfileLegalRights = {
    matrimonialRegime: client.matrimonialRegime || client.marriageRegime || '',
    professionalStatus: client.professionalStatus || '',
    structures: legalStructures
  }
  
  // Calculate fiscal info
  const hasSpouse = family.some(m => m.role === 'CONJOINT')
  const dependentChildren = family.filter(
    m => (m.role === 'CHILD_MINOR' || m.role === 'CHILD_MAJOR') && m.isFiscalDependent
  ).length
  
  // Determine if single parent (has children but no spouse)
  const hasChildren = family.some(m => m.role === 'CHILD_MINOR' || m.role === 'CHILD_MAJOR')
  const isSingleParent = hasChildren && !hasSpouse
  
  const fiscalShares = calculateFiscalShares(hasSpouse, dependentChildren, isSingleParent)
  
  // Build fiscal household description
  let fiscalHousehold = hasSpouse ? 'Couple' : 'Célibataire'
  if (dependentChildren > 0) {
    fiscalHousehold += ` avec ${dependentChildren} enfant${dependentChildren > 1 ? 's' : ''} à charge`
  }
  
  const fiscalInfo: ProfileFiscalInfo = {
    fiscalShares,
    fiscalHousehold
  }
  
  return {
    identity,
    family,
    legalRights,
    fiscalInfo
  }
}

/**
 * Updates client identity information
 */
export async function updateClientIdentity(
  clientId: string,
  data: Partial<ProfileIdentity>,
  prisma: PrismaClient,
  cabinetId: string
): Promise<void> {
  await prisma.client.update({
    where: { id: clientId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      nationality: data.nationality,
      email: data.email,
      phone: data.phone,
      address: data.address as any
    }
  })
}

/**
 * Updates client legal rights
 */
export async function updateClientLegalRights(
  clientId: string,
  data: Partial<ProfileLegalRights>,
  prisma: PrismaClient,
  cabinetId: string
): Promise<void> {
  await prisma.client.update({
    where: { id: clientId },
    data: {
      matrimonialRegime: data.matrimonialRegime,
      professionalStatus: data.professionalStatus,
      // Store legal structures as JSON
      ...(data.structures && { legalStructures: data.structures as any })
    }
  })
}
