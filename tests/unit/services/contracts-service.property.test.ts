/**
 * Property-Based Tests - Contracts Service
 * 
 * Tests for Client 360 Contracts tab service functions.
 * **Feature: client360-evolution**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  calculateContractsSummary,
  validateManagedStatusConsistency,
  validateManagedStatus,
  validateContractCompleteness,
  isValidContractType,
  isValidContractStatus,
  mapContractType,
  mapContractStatus,
  VALID_CONTRACT_TYPES,
  VALID_CONTRACT_STATUSES
} from '@/app/_common/lib/services/contracts-data-service'
import type { Contract, ContractType } from '@/app/_common/types/client360'

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for valid contract types
 */
const validContractTypeArb = fc.constantFrom(...VALID_CONTRACT_TYPES)

/**
 * Generator for valid contract statuses
 */
const validContractStatusArb = fc.constantFrom(...VALID_CONTRACT_STATUSES)

/**
 * Generator for invalid contract types
 */
const invalidContractTypeArb = fc.string({ minLength: 1, maxLength: 20 })
  .filter(s => !VALID_CONTRACT_TYPES.includes(s as any))

/**
 * Generator for invalid contract statuses
 */
const invalidContractStatusArb = fc.string({ minLength: 1, maxLength: 20 })
  .filter(s => !VALID_CONTRACT_STATUSES.includes(s as any))

/**
 * Generator for positive monetary values (realistic range)
 */
const monetaryValueArb = fc.double({ 
  min: 0.01, 
  max: 10000000, // 10M max
  noNaN: true,
  noDefaultInfinity: true
}).map(v => Math.round(v * 100) / 100)

/**
 * Generator for non-negative monetary values
 */
const nonNegativeMonetaryArb = fc.double({ 
  min: 0, 
  max: 10000000,
  noNaN: true,
  noDefaultInfinity: true
}).map(v => Math.round(v * 100) / 100)

/**
 * Generator for valid ISO date strings
 */
const validDateStringArb = fc.integer({ min: 2000, max: 2025 }).chain(year =>
  fc.integer({ min: 1, max: 12 }).chain(month =>
    fc.integer({ min: 1, max: 28 }).map(day => 
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`
    )
  )
)

/**
 * Generator for beneficiaries
 */
const beneficiaryArb = fc.record({
  name: fc.string({ minLength: 1, maxLength: 100 }),
  percentage: fc.integer({ min: 0, max: 100 }),
  clause: fc.string({ minLength: 0, maxLength: 200 })
})

/**
 * Generator for contract fees
 */
const feesArb = fc.record({
  entryFee: fc.double({ min: 0, max: 10, noNaN: true }),
  managementFee: fc.double({ min: 0, max: 5, noNaN: true }),
  arbitrageFee: fc.double({ min: 0, max: 2, noNaN: true })
})

/**
 * Generator for versements
 */
const versementArb = fc.record({
  date: validDateStringArb,
  amount: monetaryValueArb,
  type: fc.constantFrom('INITIAL', 'SCHEDULED', 'EXCEPTIONAL') as fc.Arbitrary<'INITIAL' | 'SCHEDULED' | 'EXCEPTIONAL'>
})

/**
 * Generator for complete contracts
 */
const contractArb: fc.Arbitrary<Contract> = fc.record({
  id: fc.uuid(),
  type: validContractTypeArb,
  provider: fc.string({ minLength: 1, maxLength: 100 }),
  name: fc.string({ minLength: 1, maxLength: 100 }),
  value: monetaryValueArb,
  beneficiaries: fc.array(beneficiaryArb, { minLength: 0, maxLength: 5 }),
  fees: feesArb,
  performance: fc.double({ min: -20, max: 50, noNaN: true }),
  versements: fc.array(versementArb, { minLength: 0, maxLength: 10 }),
  status: validContractStatusArb,
  isManaged: fc.boolean(),
  openDate: validDateStringArb
})

/**
 * Generator for arrays of contracts
 */
const contractsArrayArb = fc.array(contractArb, { minLength: 0, maxLength: 20 })

/**
 * Generator for non-empty arrays of contracts
 */
const nonEmptyContractsArrayArb = fc.array(contractArb, { minLength: 1, maxLength: 20 })

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Contracts Service - Property-Based Tests', () => {
  /**
   * **Feature: client360-evolution, Property 11: Contract managed status consistency**
   * **Validates: Requirements 9.3**
   * 
   * For any set of contracts, the count of managed contracts plus non-managed 
   * contracts SHALL equal the total contract count.
   */
  describe('Property 11: Contract managed status consistency', () => {
    it('managedCount + nonManagedCount equals total contracts', () => {
      fc.assert(
        fc.property(contractsArrayArb, (contracts) => {
          const summary = calculateContractsSummary(contracts)
          
          expect(summary.managedCount + summary.nonManagedCount).toBe(contracts.length)
        }),
        { numRuns: 100 }
      )
    })

    it('validateManagedStatusConsistency returns true for valid summaries', () => {
      fc.assert(
        fc.property(contractsArrayArb, (contracts) => {
          const summary = calculateContractsSummary(contracts)
          
          expect(validateManagedStatusConsistency(summary, contracts.length)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('managedCount equals count of contracts with isManaged=true', () => {
      fc.assert(
        fc.property(contractsArrayArb, (contracts) => {
          const summary = calculateContractsSummary(contracts)
          const actualManagedCount = contracts.filter(c => c.isManaged).length
          
          expect(summary.managedCount).toBe(actualManagedCount)
        }),
        { numRuns: 100 }
      )
    })

    it('nonManagedCount equals count of contracts with isManaged=false', () => {
      fc.assert(
        fc.property(contractsArrayArb, (contracts) => {
          const summary = calculateContractsSummary(contracts)
          const actualNonManagedCount = contracts.filter(c => !c.isManaged).length
          
          expect(summary.nonManagedCount).toBe(actualNonManagedCount)
        }),
        { numRuns: 100 }
      )
    })

    it('empty contracts array has zero managed and non-managed counts', () => {
      const summary = calculateContractsSummary([])
      
      expect(summary.managedCount).toBe(0)
      expect(summary.nonManagedCount).toBe(0)
      expect(validateManagedStatusConsistency(summary, 0)).toBe(true)
    })

    it('all managed contracts results in nonManagedCount = 0', () => {
      fc.assert(
        fc.property(
          fc.array(
            contractArb.map(c => ({ ...c, isManaged: true })),
            { minLength: 1, maxLength: 10 }
          ),
          (contracts) => {
            const summary = calculateContractsSummary(contracts)
            
            expect(summary.managedCount).toBe(contracts.length)
            expect(summary.nonManagedCount).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('all non-managed contracts results in managedCount = 0', () => {
      fc.assert(
        fc.property(
          fc.array(
            contractArb.map(c => ({ ...c, isManaged: false })),
            { minLength: 1, maxLength: 10 }
          ),
          (contracts) => {
            const summary = calculateContractsSummary(contracts)
            
            expect(summary.managedCount).toBe(0)
            expect(summary.nonManagedCount).toBe(contracts.length)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: client360-evolution, Property 4: Entity completeness**
   * **Validates: Requirements 4.3, 9.2, 10.4, 11.2, 13.5**
   * 
   * For any entity with required fields (contract details, document metadata, 
   * project info, activity record), all required fields SHALL be present and non-null.
   */
  describe('Property 4: Entity completeness (contracts)', () => {
    it('all generated contracts have complete required fields', () => {
      fc.assert(
        fc.property(contractArb, (contract) => {
          const { isComplete, missingFields } = validateContractCompleteness(contract)
          
          expect(isComplete).toBe(true)
          expect(missingFields).toHaveLength(0)
        }),
        { numRuns: 100 }
      )
    })

    it('contracts missing id are incomplete', () => {
      fc.assert(
        fc.property(contractArb, (contract) => {
          const incompleteContract = { ...contract, id: undefined }
          const { isComplete, missingFields } = validateContractCompleteness(incompleteContract as any)
          
          expect(isComplete).toBe(false)
          expect(missingFields).toContain('id')
        }),
        { numRuns: 100 }
      )
    })

    it('contracts missing type are incomplete', () => {
      fc.assert(
        fc.property(contractArb, (contract) => {
          const incompleteContract = { ...contract, type: undefined }
          const { isComplete, missingFields } = validateContractCompleteness(incompleteContract as any)
          
          expect(isComplete).toBe(false)
          expect(missingFields).toContain('type')
        }),
        { numRuns: 100 }
      )
    })

    it('contracts missing provider are incomplete', () => {
      fc.assert(
        fc.property(contractArb, (contract) => {
          const incompleteContract = { ...contract, provider: undefined }
          const { isComplete, missingFields } = validateContractCompleteness(incompleteContract as any)
          
          expect(isComplete).toBe(false)
          expect(missingFields).toContain('provider')
        }),
        { numRuns: 100 }
      )
    })

    it('contracts missing name are incomplete', () => {
      fc.assert(
        fc.property(contractArb, (contract) => {
          const incompleteContract = { ...contract, name: undefined }
          const { isComplete, missingFields } = validateContractCompleteness(incompleteContract as any)
          
          expect(isComplete).toBe(false)
          expect(missingFields).toContain('name')
        }),
        { numRuns: 100 }
      )
    })

    it('contracts missing value are incomplete', () => {
      fc.assert(
        fc.property(contractArb, (contract) => {
          const incompleteContract = { ...contract, value: undefined }
          const { isComplete, missingFields } = validateContractCompleteness(incompleteContract as any)
          
          expect(isComplete).toBe(false)
          expect(missingFields).toContain('value')
        }),
        { numRuns: 100 }
      )
    })

    it('contracts missing status are incomplete', () => {
      fc.assert(
        fc.property(contractArb, (contract) => {
          const incompleteContract = { ...contract, status: undefined }
          const { isComplete, missingFields } = validateContractCompleteness(incompleteContract as any)
          
          expect(isComplete).toBe(false)
          expect(missingFields).toContain('status')
        }),
        { numRuns: 100 }
      )
    })

    it('contracts missing isManaged are incomplete', () => {
      fc.assert(
        fc.property(contractArb, (contract) => {
          const incompleteContract = { ...contract, isManaged: undefined }
          const { isComplete, missingFields } = validateContractCompleteness(incompleteContract as any)
          
          expect(isComplete).toBe(false)
          expect(missingFields).toContain('isManaged')
        }),
        { numRuns: 100 }
      )
    })

    it('contracts missing openDate are incomplete', () => {
      fc.assert(
        fc.property(contractArb, (contract) => {
          const incompleteContract = { ...contract, openDate: undefined }
          const { isComplete, missingFields } = validateContractCompleteness(incompleteContract as any)
          
          expect(isComplete).toBe(false)
          expect(missingFields).toContain('openDate')
        }),
        { numRuns: 100 }
      )
    })

    it('contracts with null required fields are incomplete', () => {
      fc.assert(
        fc.property(contractArb, (contract) => {
          const incompleteContract = { ...contract, id: null, type: null }
          const { isComplete, missingFields } = validateContractCompleteness(incompleteContract as any)
          
          expect(isComplete).toBe(false)
          expect(missingFields).toContain('id')
          expect(missingFields).toContain('type')
        }),
        { numRuns: 100 }
      )
    })

    it('empty object is incomplete with all required fields missing', () => {
      const { isComplete, missingFields } = validateContractCompleteness({})
      
      expect(isComplete).toBe(false)
      expect(missingFields).toContain('id')
      expect(missingFields).toContain('type')
      expect(missingFields).toContain('provider')
      expect(missingFields).toContain('name')
      expect(missingFields).toContain('value')
      expect(missingFields).toContain('status')
      expect(missingFields).toContain('isManaged')
      expect(missingFields).toContain('openDate')
    })
  })

  /**
   * Additional tests for contract type and status validation
   */
  describe('Contract type and status validation', () => {
    it('all valid contract types are recognized', () => {
      fc.assert(
        fc.property(validContractTypeArb, (type) => {
          expect(isValidContractType(type)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('all valid contract statuses are recognized', () => {
      fc.assert(
        fc.property(validContractStatusArb, (status) => {
          expect(isValidContractStatus(status)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('invalid contract types are rejected', () => {
      fc.assert(
        fc.property(invalidContractTypeArb, (type) => {
          expect(isValidContractType(type)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it('invalid contract statuses are rejected', () => {
      fc.assert(
        fc.property(invalidContractStatusArb, (status) => {
          expect(isValidContractStatus(status)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it('VALID_CONTRACT_TYPES contains exactly 5 types', () => {
      expect(VALID_CONTRACT_TYPES).toHaveLength(5)
      expect(VALID_CONTRACT_TYPES).toContain('ASSURANCE_VIE')
      expect(VALID_CONTRACT_TYPES).toContain('PER')
      expect(VALID_CONTRACT_TYPES).toContain('MADELIN')
      expect(VALID_CONTRACT_TYPES).toContain('PREVOYANCE')
      expect(VALID_CONTRACT_TYPES).toContain('BANCAIRE')
    })

    it('VALID_CONTRACT_STATUSES contains exactly 3 statuses', () => {
      expect(VALID_CONTRACT_STATUSES).toHaveLength(3)
      expect(VALID_CONTRACT_STATUSES).toContain('ACTIVE')
      expect(VALID_CONTRACT_STATUSES).toContain('CLOSED')
      expect(VALID_CONTRACT_STATUSES).toContain('TRANSFERRED')
    })
  })

  /**
   * Additional tests for contract summary calculations
   */
  describe('Contract summary calculations', () => {
    it('totalValue equals sum of all contract values', () => {
      fc.assert(
        fc.property(contractsArrayArb, (contracts) => {
          const summary = calculateContractsSummary(contracts)
          const expectedTotal = contracts.reduce((sum, c) => sum + c.value, 0)
          
          expect(Math.abs(summary.totalValue - expectedTotal)).toBeLessThan(0.01)
        }),
        { numRuns: 100 }
      )
    })

    it('byType array contains correct counts per type', () => {
      fc.assert(
        fc.property(nonEmptyContractsArrayArb, (contracts) => {
          const summary = calculateContractsSummary(contracts)
          
          // Count contracts by type manually
          const typeCounts = new Map<ContractType, number>()
          for (const contract of contracts) {
            typeCounts.set(contract.type, (typeCounts.get(contract.type) || 0) + 1)
          }
          
          // Verify summary byType matches
          for (const typeCount of summary.byType) {
            expect(typeCount.count).toBe(typeCounts.get(typeCount.type) || 0)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('byType array contains correct totalValue per type', () => {
      fc.assert(
        fc.property(nonEmptyContractsArrayArb, (contracts) => {
          const summary = calculateContractsSummary(contracts)
          
          // Calculate total value by type manually
          const typeValues = new Map<ContractType, number>()
          for (const contract of contracts) {
            typeValues.set(contract.type, (typeValues.get(contract.type) || 0) + contract.value)
          }
          
          // Verify summary byType matches
          for (const typeCount of summary.byType) {
            const expectedValue = typeValues.get(typeCount.type) || 0
            expect(Math.abs(typeCount.totalValue - expectedValue)).toBeLessThan(0.01)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('empty contracts array has zero totalValue', () => {
      const summary = calculateContractsSummary([])
      expect(summary.totalValue).toBe(0)
    })

    it('empty contracts array has empty byType array', () => {
      const summary = calculateContractsSummary([])
      expect(summary.byType).toHaveLength(0)
    })
  })

  /**
   * Tests for managed status validation
   */
  describe('Managed status validation', () => {
    it('all generated contracts have valid managed status', () => {
      fc.assert(
        fc.property(contractArb, (contract) => {
          expect(validateManagedStatus(contract)).toBe(true)
          expect(typeof contract.isManaged).toBe('boolean')
        }),
        { numRuns: 100 }
      )
    })

    it('contracts without isManaged field fail validation', () => {
      const contractWithoutManaged = { id: 'test', name: 'Test' }
      expect(validateManagedStatus(contractWithoutManaged)).toBe(false)
    })

    it('contracts with null isManaged fail validation', () => {
      const contractWithNull = { id: 'test', name: 'Test', isManaged: null }
      expect(validateManagedStatus(contractWithNull)).toBe(false)
    })

    it('contracts with non-boolean isManaged fail validation', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.string(),
            fc.integer(),
            fc.double(),
            fc.constant(null),
            fc.constant(undefined)
          ),
          (invalidValue) => {
            const contract = { id: 'test', name: 'Test', isManaged: invalidValue }
            expect(validateManagedStatus(contract)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Tests for type mapping functions
   */
  describe('Type mapping functions', () => {
    it('mapContractType maps LIFE_INSURANCE to ASSURANCE_VIE', () => {
      expect(mapContractType('LIFE_INSURANCE')).toBe('ASSURANCE_VIE')
    })

    it('mapContractType maps RETIREMENT_SAVINGS to PER', () => {
      expect(mapContractType('RETIREMENT_SAVINGS')).toBe('PER')
    })

    it('mapContractType maps unknown types to BANCAIRE', () => {
      fc.assert(
        fc.property(invalidContractTypeArb, (type) => {
          expect(mapContractType(type)).toBe('BANCAIRE')
        }),
        { numRuns: 100 }
      )
    })

    it('mapContractStatus maps TERMINATED to CLOSED', () => {
      expect(mapContractStatus('TERMINATED')).toBe('CLOSED')
    })

    it('mapContractStatus maps EXPIRED to CLOSED', () => {
      expect(mapContractStatus('EXPIRED')).toBe('CLOSED')
    })

    it('mapContractStatus maps unknown statuses to ACTIVE', () => {
      fc.assert(
        fc.property(invalidContractStatusArb, (status) => {
          expect(mapContractStatus(status)).toBe('ACTIVE')
        }),
        { numRuns: 100 }
      )
    })
  })
})
