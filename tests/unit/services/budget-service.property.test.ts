/**
 * Property-Based Tests - Budget Service
 * 
 * **Feature: client360-repair, Property 1: Budget metrics calculation consistency**
 * **Validates: Requirements 1.3, 1.6**
 * 
 * Tests that budget metrics calculations are consistent:
 * - Savings capacity = total monthly income - total monthly expenses
 * - Savings rate = (savings capacity / monthly income) * 100
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { 
  calculateBudgetMetrics, 
  transformExpensesToPieChartData,
  calculateTotalMonthlyExpenses 
} from '@/app/_common/lib/services/budget-service'
import type { ClientBudget, MonthlyExpenses } from '@/app/_common/lib/api-types'

// ============================================================================
// GENERATORS
// ============================================================================

/**
 * Generator for professional income with realistic values
 */
const professionalIncomeArb = fc.record({
  netSalary: fc.integer({ min: 0, max: 20000 }),
  selfEmployedIncome: fc.integer({ min: 0, max: 15000 }),
  bonuses: fc.integer({ min: 0, max: 50000 }), // Annual bonuses
  other: fc.integer({ min: 0, max: 5000 }),
})

/**
 * Generator for asset income (annual values)
 */
const assetIncomeArb = fc.record({
  rentalIncome: fc.integer({ min: 0, max: 60000 }),
  dividends: fc.integer({ min: 0, max: 30000 }),
  interest: fc.integer({ min: 0, max: 10000 }),
  capitalGains: fc.integer({ min: 0, max: 50000 }),
})

/**
 * Generator for spouse income
 */
const spouseIncomeArb = fc.record({
  netSalary: fc.integer({ min: 0, max: 15000 }),
  other: fc.integer({ min: 0, max: 3000 }),
})

/**
 * Generator for retirement pensions (annual)
 */
const retirementPensionsArb = fc.record({
  total: fc.integer({ min: 0, max: 60000 }),
})

/**
 * Generator for allowances (annual)
 */
const allowancesArb = fc.record({
  total: fc.integer({ min: 0, max: 24000 }),
})

/**
 * Generator for expense category
 */
const expenseCategoryArb = fc.record({
  total: fc.integer({ min: 0, max: 5000 }),
})

/**
 * Generator for monthly expenses
 */
const monthlyExpensesArb = fc.record({
  housing: expenseCategoryArb,
  utilities: expenseCategoryArb,
  food: expenseCategoryArb,
  transportation: expenseCategoryArb,
  insurance: expenseCategoryArb,
  leisure: expenseCategoryArb,
  health: expenseCategoryArb,
  education: expenseCategoryArb,
  loans: expenseCategoryArb,
  other: expenseCategoryArb,
})

/**
 * Generator for a complete ClientBudget
 */
const clientBudgetArb = fc.record({
  id: fc.string(),
  clientId: fc.uuid(),
  professionalIncome: fc.option(professionalIncomeArb, { nil: undefined }),
  assetIncome: fc.option(assetIncomeArb, { nil: undefined }),
  spouseIncome: fc.option(spouseIncomeArb, { nil: undefined }),
  retirementPensions: fc.option(retirementPensionsArb, { nil: undefined }),
  allowances: fc.option(allowancesArb, { nil: undefined }),
  monthlyExpenses: fc.option(monthlyExpensesArb, { nil: undefined }),
  createdAt: fc.date(),
  updatedAt: fc.date(),
}) as fc.Arbitrary<ClientBudget>

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate expected monthly income from budget data
 * This mirrors the calculation in calculateBudgetMetrics
 */
function calculateExpectedMonthlyIncome(budget: ClientBudget): number {
  const profIncome = budget.professionalIncome || {}
  const professionalMonthly =
    (profIncome.netSalary || 0) +
    (profIncome.selfEmployedIncome || 0) +
    (profIncome.bonuses || 0) / 12 +
    (profIncome.other || 0)

  const assetInc = budget.assetIncome || {}
  const assetMonthly =
    (assetInc.rentalIncome || 0) / 12 +
    (assetInc.dividends || 0) / 12 +
    (assetInc.interest || 0) / 12 +
    (assetInc.capitalGains || 0) / 12

  const spouseInc = budget.spouseIncome || {}
  const spouseMonthly = (spouseInc.netSalary || 0) + (spouseInc.other || 0)

  const pension = budget.retirementPensions || {}
  const pensionMonthly = (pension.total || 0) / 12

  const allow = budget.allowances || {}
  const allowanceMonthly = (allow.total || 0) / 12

  return professionalMonthly + assetMonthly + spouseMonthly + pensionMonthly + allowanceMonthly
}

/**
 * Calculate expected monthly expenses from budget data
 */
function calculateExpectedMonthlyExpenses(budget: ClientBudget): number {
  const expenses = budget.monthlyExpenses || {}
  return (
    (expenses.housing?.total || 0) +
    (expenses.utilities?.total || 0) +
    (expenses.food?.total || 0) +
    (expenses.transportation?.total || 0) +
    (expenses.insurance?.total || 0) +
    (expenses.leisure?.total || 0) +
    (expenses.health?.total || 0) +
    (expenses.education?.total || 0) +
    (expenses.loans?.total || 0) +
    (expenses.other?.total || 0)
  )
}

// ============================================================================
// PROPERTY TESTS
// ============================================================================

describe('Budget Service - Property-Based Tests', () => {
  /**
   * **Feature: client360-repair, Property 1: Budget metrics calculation consistency**
   * **Validates: Requirements 1.3, 1.6**
   * 
   * For any valid budget data with income and expenses:
   * - Savings capacity SHALL equal (total monthly income - total monthly expenses)
   * - Savings rate SHALL equal (savings capacity / monthly income * 100)
   */
  describe('Property 1: Budget metrics calculation consistency', () => {
    it('savings capacity equals monthly income minus monthly expenses', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const metrics = calculateBudgetMetrics(budget)
          
          const expectedIncome = calculateExpectedMonthlyIncome(budget)
          const expectedExpenses = calculateExpectedMonthlyExpenses(budget)
          const expectedSavingsCapacity = expectedIncome - expectedExpenses
          
          // Account for rounding (the function rounds to integers)
          expect(metrics.capaciteEpargneMensuelle).toBe(Math.round(expectedSavingsCapacity))
        }),
        { numRuns: 100 }
      )
    })

    it('savings rate equals (savings capacity / monthly income) * 100', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const metrics = calculateBudgetMetrics(budget)
          
          const expectedIncome = calculateExpectedMonthlyIncome(budget)
          const expectedExpenses = calculateExpectedMonthlyExpenses(budget)
          const expectedSavingsCapacity = expectedIncome - expectedExpenses
          
          // Calculate expected savings rate
          const expectedSavingsRate = expectedIncome > 0
            ? (expectedSavingsCapacity / expectedIncome) * 100
            : 0
          
          // Account for rounding (the function rounds to 1 decimal place)
          expect(metrics.tauxEpargne).toBe(Math.round(expectedSavingsRate * 10) / 10)
        }),
        { numRuns: 100 }
      )
    })

    it('annual values are approximately 12x monthly values (within rounding tolerance)', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const metrics = calculateBudgetMetrics(budget)
          
          // The implementation calculates annual = monthly * 12 BEFORE rounding
          // Then both are rounded separately, so there can be small differences
          // due to rounding. The difference should be at most 11 (worst case rounding).
          expect(Math.abs(metrics.revenusAnnuels - metrics.revenusMensuels * 12)).toBeLessThanOrEqual(11)
          expect(Math.abs(metrics.chargesAnnuelles - metrics.chargesMensuelles * 12)).toBeLessThanOrEqual(11)
          expect(Math.abs(metrics.capaciteEpargneAnnuelle - metrics.capaciteEpargneMensuelle * 12)).toBeLessThanOrEqual(11)
        }),
        { numRuns: 100 }
      )
    })

    it('emergency fund bounds are based on monthly expenses', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const metrics = calculateBudgetMetrics(budget)
          
          // Emergency fund min = 3 months of expenses
          expect(metrics.epargneSecuriteMin).toBe(Math.round(metrics.chargesMensuelles * 3))
          
          // Emergency fund max = 6 months of expenses
          expect(metrics.epargneSecuriteMax).toBe(Math.round(metrics.chargesMensuelles * 6))
        }),
        { numRuns: 100 }
      )
    })

    it('reste à vivre equals savings capacity', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const metrics = calculateBudgetMetrics(budget)
          
          // In the implementation, resteAVivre = capaciteEpargneMensuelle
          expect(metrics.resteAVivre).toBe(metrics.capaciteEpargneMensuelle)
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: client360-repair, Property 3: Expense pie chart data transformation**
   * **Validates: Requirements 1.2**
   * 
   * For any budget with monthly expenses:
   * - The pie chart data SHALL contain only categories with value > 0
   * - The sum of all slice values SHALL equal total monthly expenses
   */
  describe('Property 3: Expense pie chart data transformation', () => {
    /**
     * Generator for monthly expenses with some categories having zero values
     * This ensures we test the filtering behavior
     */
    const monthlyExpensesWithZerosArb = fc.record({
      housing: fc.record({ total: fc.integer({ min: 0, max: 5000 }) }),
      utilities: fc.record({ total: fc.integer({ min: 0, max: 1000 }) }),
      food: fc.record({ total: fc.integer({ min: 0, max: 2000 }) }),
      transportation: fc.record({ total: fc.integer({ min: 0, max: 1500 }) }),
      insurance: fc.record({ total: fc.integer({ min: 0, max: 1000 }) }),
      leisure: fc.record({ total: fc.integer({ min: 0, max: 1500 }) }),
      health: fc.record({ total: fc.integer({ min: 0, max: 1000 }) }),
      education: fc.record({ total: fc.integer({ min: 0, max: 2000 }) }),
      loans: fc.record({ total: fc.integer({ min: 0, max: 3000 }) }),
      other: fc.record({ total: fc.integer({ min: 0, max: 1000 }) }),
    }) as fc.Arbitrary<MonthlyExpenses>

    it('pie chart data contains only categories with value > 0', () => {
      fc.assert(
        fc.property(monthlyExpensesWithZerosArb, (monthlyExpenses) => {
          const pieChartData = transformExpensesToPieChartData(monthlyExpenses)
          
          // All items in the result should have value > 0
          for (const item of pieChartData) {
            expect(item.value).toBeGreaterThan(0)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('sum of all slice values equals total monthly expenses', () => {
      fc.assert(
        fc.property(monthlyExpensesWithZerosArb, (monthlyExpenses) => {
          const pieChartData = transformExpensesToPieChartData(monthlyExpenses)
          const totalFromPieChart = pieChartData.reduce((sum, item) => sum + item.value, 0)
          const expectedTotal = calculateTotalMonthlyExpenses(monthlyExpenses)
          
          expect(totalFromPieChart).toBe(expectedTotal)
        }),
        { numRuns: 100 }
      )
    })

    it('returns empty array when monthlyExpenses is null or undefined', () => {
      const resultNull = transformExpensesToPieChartData(null as unknown as MonthlyExpenses)
      const resultUndefined = transformExpensesToPieChartData(undefined)
      
      expect(resultNull).toEqual([])
      expect(resultUndefined).toEqual([])
    })

    it('returns empty array when all expense categories are zero', () => {
      const allZeroExpenses: MonthlyExpenses = {
        housing: { total: 0 },
        utilities: { total: 0 },
        food: { total: 0 },
        transportation: { total: 0 },
        insurance: { total: 0 },
        leisure: { total: 0 },
        health: { total: 0 },
        education: { total: 0 },
        loans: { total: 0 },
        other: { total: 0 },
      }
      
      const pieChartData = transformExpensesToPieChartData(allZeroExpenses)
      expect(pieChartData).toEqual([])
    })

    it('each pie chart item has required properties (name, value, color)', () => {
      fc.assert(
        fc.property(monthlyExpensesWithZerosArb, (monthlyExpenses) => {
          const pieChartData = transformExpensesToPieChartData(monthlyExpenses)
          
          for (const item of pieChartData) {
            expect(item).toHaveProperty('name')
            expect(item).toHaveProperty('value')
            expect(item).toHaveProperty('color')
            expect(typeof item.name).toBe('string')
            expect(typeof item.value).toBe('number')
            expect(typeof item.color).toBe('string')
            // Color should be a valid hex color
            expect(item.color).toMatch(/^#[0-9a-fA-F]{6}$/)
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
