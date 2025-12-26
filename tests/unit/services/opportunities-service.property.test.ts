/**
 * Property-Based Tests - Opportunities Service
 * 
 * Tests for Client 360 Opportunities tab service functions.
 * **Feature: client360-evolution**
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  validateOpportunityObjectiveMatching,
  matchOpportunitiesWithObjectives,
  mapOpportunityCategory,
  mapOpportunityStatus,
  determineComplexity,
  generateOpportunityAnalysis,
} from '@/app/_common/lib/services/opportunities-data-service'
import type {
  Opportunity,
  Objective,
  OpportunityCategory,
  OpportunityStatus,
  OpportunityAnalysis,
  Complexity,
} from '@/app/_common/types/client360'

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for valid opportunity categories
 */
const validOpportunityCategoryArb = fc.constantFrom('FISCAL', 'INVESTMENT', 'REORGANIZATION') as fc.Arbitrary<OpportunityCategory>

/**
 * Generator for valid opportunity statuses
 */
const validOpportunityStatusArb = fc.constantFrom('NEW', 'REVIEWED', 'ACCEPTED', 'REJECTED') as fc.Arbitrary<OpportunityStatus>

/**
 * Generator for valid objective types
 */
const validObjectiveTypeArb = fc.constantFrom('RETIREMENT', 'REAL_ESTATE', 'TRANSMISSION', 'EDUCATION', 'OTHER') as fc.Arbitrary<Objective['type']>

/**
 * Generator for valid objective statuses
 */
const validObjectiveStatusArb = fc.constantFrom('ACTIVE', 'ACHIEVED', 'ABANDONED') as fc.Arbitrary<Objective['status']>

/**
 * Generator for valid priority values
 */
const validPriorityArb = fc.constantFrom('HIGH', 'MEDIUM', 'LOW') as fc.Arbitrary<'HIGH' | 'MEDIUM' | 'LOW'>

/**
 * Generator for valid complexity values
 */
const validComplexityArb = fc.constantFrom('HIGH', 'MEDIUM', 'LOW') as fc.Arbitrary<Complexity>

/**
 * Generator for valid ISO date strings
 */
const validDateStringArb = fc.integer({ min: 2020, max: 2030 }).chain(year =>
  fc.integer({ min: 1, max: 12 }).chain(month =>
    fc.integer({ min: 1, max: 28 }).map(day =>
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00.000Z`
    )
  )
)

/**
 * Generator for opportunity analysis
 */
const opportunityAnalysisArb: fc.Arbitrary<OpportunityAnalysis> = fc.record({
  pros: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 1, maxLength: 5 }),
  cons: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
  requirements: fc.array(fc.string({ minLength: 1, maxLength: 100 }), { minLength: 0, maxLength: 5 }),
  timeline: fc.string({ minLength: 1, maxLength: 50 }),
  complexity: validComplexityArb,
})

/**
 * Generator for objectives
 */
const objectiveArb: fc.Arbitrary<Objective> = fc.record({
  id: fc.uuid(),
  type: validObjectiveTypeArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 0, maxLength: 200 }),
  targetAmount: fc.option(fc.integer({ min: 0, max: 10000000 }), { nil: undefined }),
  targetDate: fc.option(validDateStringArb, { nil: undefined }),
  priority: validPriorityArb,
  status: validObjectiveStatusArb,
})

/**
 * Generator for opportunities with valid matched objectives
 * (matched objectives are subset of provided objective IDs)
 */
const opportunityWithValidMatchesArb = (objectiveIds: string[]): fc.Arbitrary<Opportunity> => {
  const matchedObjectivesArb = objectiveIds.length > 0
    ? fc.subarray(objectiveIds, { minLength: 0, maxLength: objectiveIds.length })
    : fc.constant([])

  return fc.record({
    id: fc.uuid(),
    category: validOpportunityCategoryArb,
    title: fc.string({ minLength: 1, maxLength: 100 }),
    description: fc.string({ minLength: 0, maxLength: 200 }),
    potentialImpact: fc.integer({ min: 0, max: 1000000 }),
    relevanceScore: fc.integer({ min: 0, max: 100 }),
    matchedObjectives: matchedObjectivesArb,
    analysis: opportunityAnalysisArb,
    status: validOpportunityStatusArb,
  })
}

/**
 * Generator for opportunities with potentially invalid matched objectives
 * (may include IDs not in the objectives list)
 */
const opportunityWithPotentiallyInvalidMatchesArb: fc.Arbitrary<Opportunity> = fc.record({
  id: fc.uuid(),
  category: validOpportunityCategoryArb,
  title: fc.string({ minLength: 1, maxLength: 100 }),
  description: fc.string({ minLength: 0, maxLength: 200 }),
  potentialImpact: fc.integer({ min: 0, max: 1000000 }),
  relevanceScore: fc.integer({ min: 0, max: 100 }),
  matchedObjectives: fc.array(fc.uuid(), { minLength: 0, maxLength: 5 }),
  analysis: opportunityAnalysisArb,
  status: validOpportunityStatusArb,
})

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Opportunities Service - Property-Based Tests', () => {
  /**
   * **Feature: client360-evolution, Property 14: Opportunity objective matching**
   * **Validates: Requirements 12.3**
   * 
   * For any opportunity with matched objectives, each matched objective ID
   * SHALL exist in the client's objectives list.
   */
  describe('Property 14: Opportunity objective matching', () => {
    it('opportunities with valid matched objective IDs pass validation', () => {
      fc.assert(
        fc.property(
          fc.array(objectiveArb, { minLength: 0, maxLength: 10 }),
          (objectives) => {
            const objectiveIds = objectives.map(o => o.id)
            
            return fc.assert(
              fc.property(
                fc.array(opportunityWithValidMatchesArb(objectiveIds), { minLength: 0, maxLength: 10 }),
                (opportunities) => {
                  const isValid = validateOpportunityObjectiveMatching(opportunities, objectives)
                  expect(isValid).toBe(true)
                }
              ),
              { numRuns: 10 }
            )
          }
        ),
        { numRuns: 10 }
      )
    })

    it('opportunities with invalid matched objective IDs fail validation', () => {
      fc.assert(
        fc.property(
          fc.array(objectiveArb, { minLength: 1, maxLength: 5 }),
          fc.uuid(), // Invalid ID not in objectives
          (objectives, invalidId) => {
            // Ensure the invalid ID is not in the objectives list
            const objectiveIds = new Set(objectives.map(o => o.id))
            if (objectiveIds.has(invalidId)) {
              return // Skip this case
            }

            // Create an opportunity with the invalid ID
            const opportunity: Opportunity = {
              id: 'test-opp-id',
              category: 'FISCAL',
              title: 'Test Opportunity',
              description: '',
              potentialImpact: 1000,
              relevanceScore: 50,
              matchedObjectives: [invalidId],
              analysis: {
                pros: ['Test'],
                cons: [],
                requirements: [],
                timeline: '1 month',
                complexity: 'LOW',
              },
              status: 'NEW',
            }

            const isValid = validateOpportunityObjectiveMatching([opportunity], objectives)
            expect(isValid).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('empty opportunities list always passes validation', () => {
      fc.assert(
        fc.property(
          fc.array(objectiveArb, { minLength: 0, maxLength: 10 }),
          (objectives) => {
            const isValid = validateOpportunityObjectiveMatching([], objectives)
            expect(isValid).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('opportunities with empty matched objectives always pass validation', () => {
      fc.assert(
        fc.property(
          fc.array(objectiveArb, { minLength: 0, maxLength: 10 }),
          (objectives) => {
            const opportunity: Opportunity = {
              id: 'test-opp-id',
              category: 'FISCAL',
              title: 'Test Opportunity',
              description: '',
              potentialImpact: 1000,
              relevanceScore: 50,
              matchedObjectives: [], // Empty - should always pass
              analysis: {
                pros: ['Test'],
                cons: [],
                requirements: [],
                timeline: '1 month',
                complexity: 'LOW',
              },
              status: 'NEW',
            }

            const isValid = validateOpportunityObjectiveMatching([opportunity], objectives)
            expect(isValid).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('all matched objective IDs exist in objectives list', () => {
      fc.assert(
        fc.property(
          fc.array(objectiveArb, { minLength: 1, maxLength: 10 }),
          (objectives) => {
            const objectiveIds = objectives.map(o => o.id)
            
            return fc.assert(
              fc.property(
                fc.array(opportunityWithValidMatchesArb(objectiveIds), { minLength: 1, maxLength: 5 }),
                (opportunities) => {
                  const objectiveIdSet = new Set(objectiveIds)
                  
                  for (const opp of opportunities) {
                    for (const matchedId of opp.matchedObjectives) {
                      expect(objectiveIdSet.has(matchedId)).toBe(true)
                    }
                  }
                }
              ),
              { numRuns: 10 }
            )
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  /**
   * Tests for matchOpportunitiesWithObjectives function
   */
  describe('matchOpportunitiesWithObjectives', () => {
    it('returns empty array when no objectives provided', () => {
      fc.assert(
        fc.property(
          fc.array(opportunityWithPotentiallyInvalidMatchesArb, { minLength: 0, maxLength: 5 }),
          (opportunities) => {
            const matches = matchOpportunitiesWithObjectives(opportunities, [])
            expect(matches).toEqual([])
          }
        ),
        { numRuns: 100 }
      )
    })

    it('returns empty array when no opportunities provided', () => {
      fc.assert(
        fc.property(
          fc.array(objectiveArb, { minLength: 0, maxLength: 5 }),
          (objectives) => {
            const matches = matchOpportunitiesWithObjectives([], objectives)
            expect(matches).toEqual([])
          }
        ),
        { numRuns: 100 }
      )
    })

    it('match scores are sorted in descending order', () => {
      fc.assert(
        fc.property(
          fc.array(objectiveArb, { minLength: 1, maxLength: 5 }),
          (objectives) => {
            const objectiveIds = objectives.map(o => o.id)
            
            return fc.assert(
              fc.property(
                fc.array(opportunityWithValidMatchesArb(objectiveIds), { minLength: 1, maxLength: 5 }),
                (opportunities) => {
                  const matches = matchOpportunitiesWithObjectives(opportunities, objectives)
                  
                  // Verify descending order by match score
                  for (let i = 0; i < matches.length - 1; i++) {
                    expect(matches[i].matchScore).toBeGreaterThanOrEqual(matches[i + 1].matchScore)
                  }
                }
              ),
              { numRuns: 10 }
            )
          }
        ),
        { numRuns: 10 }
      )
    })

    it('each match contains valid objective ID', () => {
      fc.assert(
        fc.property(
          fc.array(objectiveArb, { minLength: 1, maxLength: 5 }),
          (objectives) => {
            const objectiveIds = objectives.map(o => o.id)
            const objectiveIdSet = new Set(objectiveIds)
            
            return fc.assert(
              fc.property(
                fc.array(opportunityWithValidMatchesArb(objectiveIds), { minLength: 1, maxLength: 5 }),
                (opportunities) => {
                  const matches = matchOpportunitiesWithObjectives(opportunities, objectives)
                  
                  for (const match of matches) {
                    expect(objectiveIdSet.has(match.objectiveId)).toBe(true)
                  }
                }
              ),
              { numRuns: 10 }
            )
          }
        ),
        { numRuns: 10 }
      )
    })
  })

  /**
   * Tests for mapOpportunityCategory function
   */
  describe('mapOpportunityCategory', () => {
    it('maps known types to valid categories', () => {
      const knownTypes = [
        'TAX_OPTIMIZATION',
        'PER_OPPORTUNITY',
        'RETIREMENT_PREPARATION',
        'DIVERSIFICATION_NEEDED',
        'REAL_ESTATE_INVESTMENT',
        'LIFE_INSURANCE_UNDERUSED',
        'SUCCESSION_PLANNING',
        'DEBT_CONSOLIDATION',
        'WEALTH_TRANSMISSION',
      ]

      for (const type of knownTypes) {
        const category = mapOpportunityCategory(type)
        expect(['FISCAL', 'INVESTMENT', 'REORGANIZATION']).toContain(category)
      }
    })

    it('unknown types default to INVESTMENT', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
            !['TAX_OPTIMIZATION', 'PER_OPPORTUNITY', 'RETIREMENT_PREPARATION',
              'DIVERSIFICATION_NEEDED', 'REAL_ESTATE_INVESTMENT', 'LIFE_INSURANCE_UNDERUSED',
              'SUCCESSION_PLANNING', 'DEBT_CONSOLIDATION', 'WEALTH_TRANSMISSION',
              'LIFE_INSURANCE', 'RETIREMENT_SAVINGS', 'SECURITIES_INVESTMENT',
              'LOAN_RESTRUCTURING', 'INSURANCE_REVIEW', 'OTHER',
              '__proto__', 'constructor', 'prototype', 'hasOwnProperty', 'toString'].includes(s)
          ),
          (unknownType) => {
            const category = mapOpportunityCategory(unknownType)
            expect(category).toBe('INVESTMENT')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Tests for mapOpportunityStatus function
   */
  describe('mapOpportunityStatus', () => {
    it('maps known statuses to valid statuses', () => {
      const statusMappings: [string, OpportunityStatus][] = [
        ['NEW', 'NEW'],
        ['DETECTED', 'NEW'],
        ['QUALIFIED', 'REVIEWED'],
        ['CONTACTED', 'REVIEWED'],
        ['PRESENTED', 'REVIEWED'],
        ['REVIEWED', 'REVIEWED'],
        ['ACCEPTED', 'ACCEPTED'],
        ['CONVERTED', 'ACCEPTED'],
        ['REJECTED', 'REJECTED'],
        ['LOST', 'REJECTED'],
      ]

      for (const [input, expected] of statusMappings) {
        const result = mapOpportunityStatus(input)
        expect(result).toBe(expected)
      }
    })

    it('unknown statuses default to NEW', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s =>
            !['NEW', 'DETECTED', 'QUALIFIED', 'CONTACTED', 'PRESENTED',
              'REVIEWED', 'ACCEPTED', 'CONVERTED', 'REJECTED', 'LOST'].includes(s)
          ),
          (unknownStatus) => {
            const status = mapOpportunityStatus(unknownStatus)
            expect(status).toBe('NEW')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Tests for determineComplexity function
   */
  describe('determineComplexity', () => {
    it('succession and reorganization types are HIGH complexity', () => {
      const highComplexityTypes = ['SUCCESSION_PLANNING', 'WEALTH_TRANSMISSION', 'DEBT_CONSOLIDATION']
      
      for (const type of highComplexityTypes) {
        const complexity = determineComplexity(type, 0)
        expect(complexity).toBe('HIGH')
      }
    })

    it('tax and real estate types are MEDIUM complexity', () => {
      const mediumComplexityTypes = ['TAX_OPTIMIZATION', 'REAL_ESTATE_INVESTMENT', 'PER_OPPORTUNITY']
      
      for (const type of mediumComplexityTypes) {
        const complexity = determineComplexity(type, 0)
        expect(complexity).toBe('MEDIUM')
      }
    })

    it('other types are LOW complexity', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s =>
            !['SUCCESSION_PLANNING', 'WEALTH_TRANSMISSION', 'DEBT_CONSOLIDATION',
              'TAX_OPTIMIZATION', 'REAL_ESTATE_INVESTMENT', 'PER_OPPORTUNITY'].includes(s)
          ),
          (otherType) => {
            const complexity = determineComplexity(otherType, 0)
            expect(complexity).toBe('LOW')
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Tests for generateOpportunityAnalysis function
   */
  describe('generateOpportunityAnalysis', () => {
    it('always returns valid analysis structure', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 50 }),
          fc.string({ minLength: 0, maxLength: 200 }),
          fc.string({ minLength: 0, maxLength: 200 }),
          (type, description, recommendation) => {
            const analysis = generateOpportunityAnalysis(type, description, recommendation)
            
            expect(Array.isArray(analysis.pros)).toBe(true)
            expect(Array.isArray(analysis.cons)).toBe(true)
            expect(Array.isArray(analysis.requirements)).toBe(true)
            expect(typeof analysis.timeline).toBe('string')
            expect(['LOW', 'MEDIUM', 'HIGH']).toContain(analysis.complexity)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('known types have non-empty pros', () => {
      const knownTypes = [
        'TAX_OPTIMIZATION',
        'PER_OPPORTUNITY',
        'DIVERSIFICATION_NEEDED',
        'SUCCESSION_PLANNING',
        'REAL_ESTATE_INVESTMENT',
        'LIFE_INSURANCE_UNDERUSED',
        'DEBT_CONSOLIDATION',
        'RETIREMENT_PREPARATION',
      ]

      for (const type of knownTypes) {
        const analysis = generateOpportunityAnalysis(type, '', '')
        expect(analysis.pros.length).toBeGreaterThan(0)
      }
    })
  })
})
