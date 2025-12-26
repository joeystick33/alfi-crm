/**
 * Property-Based Tests - Budget Data Service
 * 
 * **Feature: client360-evolution, Property 7: Budget balance calculation**
 * **Validates: Requirements 6.3, 6.7**
 * 
 * **Feature: client360-evolution, Property 8: Budget projection consistency**
 * **Validates: Requirements 6.4**
 * 
 * Tests that:
 * - Monthly balance = total monthly revenues - total monthly expenses
 * - Annual balance = monthly balance * 12 for recurring + one-time items
 * - Projection contains exactly 12 data points
 * - Each projection point has balance = revenue - expense
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { 
  extractRevenues,
  extractExpenses,
  calculateBalance,
  validateBalanceCalculation,
  generateProjection,
  validateProjection,
  calculateBudgetData
} from '@/app/_common/lib/services/budget-data-service'
import type { ClientBudget } from '@/app/_common/lib/api-types'

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
 * Calculate expected monthly revenue from budget data
 */
function calculateExpectedMonthlyRevenue(budget: ClientBudget): number {
  const profIncome = budget.professionalIncome || {}
  const professionalMonthly =
    (profIncome.netSalary || 0) +
    (profIncome.selfEmployedIncome || 0) +
    (profIncome.other || 0)

  const assetInc = budget.assetIncome || {}
  const assetMonthly = (assetInc.rentalIncome || 0) / 12

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

describe('Budget Data Service - Property-Based Tests', () => {
  /**
   * **Feature: client360-evolution, Property 7: Budget balance calculation**
   * **Validates: Requirements 6.3, 6.7**
   * 
   * For any budget with revenues and expenses:
   * - Monthly balance SHALL equal (total monthly revenues - total monthly expenses)
   * - Annual balance SHALL equal (monthly balance * 12) for recurring items plus one-time items
   */
  describe('Property 7: Budget balance calculation', () => {
    it('monthly balance equals monthly revenues minus monthly expenses', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const revenues = extractRevenues(budget)
          const expenses = extractExpenses(budget)
          const balance = calculateBalance(revenues, expenses)
          
          const expectedMonthlyBalance = revenues.totalMonthly - expenses.totalMonthly
          
          // Allow small tolerance for rounding
          expect(Math.abs(balance.monthly - expectedMonthlyBalance)).toBeLessThanOrEqual(1)
        }),
        { numRuns: 100 }
      )
    })

    it('annual balance equals annual revenues minus annual expenses', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const revenues = extractRevenues(budget)
          const expenses = extractExpenses(budget)
          const balance = calculateBalance(revenues, expenses)
          
          const expectedAnnualBalance = revenues.totalAnnual - expenses.totalAnnual
          
          // Allow small tolerance for rounding
          expect(Math.abs(balance.annual - expectedAnnualBalance)).toBeLessThanOrEqual(1)
        }),
        { numRuns: 100 }
      )
    })

    it('savings rate equals (monthly balance / monthly revenue) * 100', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const revenues = extractRevenues(budget)
          const expenses = extractExpenses(budget)
          const balance = calculateBalance(revenues, expenses)
          
          if (revenues.totalMonthly === 0) {
            expect(balance.savingsRate).toBe(0)
          } else {
            const expectedSavingsRate = (balance.monthly / revenues.totalMonthly) * 100
            // Allow tolerance for rounding (1 decimal place)
            expect(Math.abs(balance.savingsRate - Math.round(expectedSavingsRate * 10) / 10)).toBeLessThanOrEqual(0.1)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('validateBalanceCalculation returns true for correctly calculated balances', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const revenues = extractRevenues(budget)
          const expenses = extractExpenses(budget)
          const balance = calculateBalance(revenues, expenses)
          
          expect(validateBalanceCalculation(revenues, expenses, balance)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('total monthly expenses equals sum of fixed and variable expenses', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const expenses = extractExpenses(budget)
          
          const fixedTotal = expenses.fixed.reduce((sum, e) => sum + e.amount, 0)
          const variableTotal = expenses.variable.reduce((sum, e) => sum + e.amount, 0)
          
          expect(expenses.totalMonthly).toBe(Math.round(fixedTotal + variableTotal))
        }),
        { numRuns: 100 }
      )
    })

    it('total monthly revenues equals sum of recurring revenues', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const revenues = extractRevenues(budget)
          
          const recurringTotal = revenues.recurring.reduce((sum, r) => sum + r.amount, 0)
          
          expect(revenues.totalMonthly).toBe(Math.round(recurringTotal))
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: client360-evolution, Property 8: Budget projection consistency**
   * **Validates: Requirements 6.4**
   * 
   * For any 12-month budget projection:
   * - Each month's projected balance SHALL be calculated from projected revenues minus projected expenses
   * - The projection SHALL contain exactly 12 data points
   */
  describe('Property 8: Budget projection consistency', () => {
    it('projection contains exactly 12 data points', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const revenues = extractRevenues(budget)
          const expenses = extractExpenses(budget)
          const projection = generateProjection(revenues, expenses)
          
          expect(projection.length).toBe(12)
        }),
        { numRuns: 100 }
      )
    })

    it('each projection point has balance equal to revenue minus expense', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const revenues = extractRevenues(budget)
          const expenses = extractExpenses(budget)
          const projection = generateProjection(revenues, expenses)
          
          for (const point of projection) {
            const expectedBalance = point.projectedRevenue - point.projectedExpense
            expect(point.projectedBalance).toBe(expectedBalance)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('validateProjection returns true for correctly generated projections', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const revenues = extractRevenues(budget)
          const expenses = extractExpenses(budget)
          const projection = generateProjection(revenues, expenses)
          
          expect(validateProjection(projection)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('each projection point has a month label', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const revenues = extractRevenues(budget)
          const expenses = extractExpenses(budget)
          const projection = generateProjection(revenues, expenses)
          
          for (const point of projection) {
            expect(point.month).toBeDefined()
            expect(typeof point.month).toBe('string')
            expect(point.month.length).toBeGreaterThan(0)
          }
        }),
        { numRuns: 100 }
      )
    })

    it('projection values are non-negative when budget has non-negative values', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const revenues = extractRevenues(budget)
          const expenses = extractExpenses(budget)
          const projection = generateProjection(revenues, expenses)
          
          for (const point of projection) {
            expect(point.projectedRevenue).toBeGreaterThanOrEqual(0)
            expect(point.projectedExpense).toBeGreaterThanOrEqual(0)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Additional tests for calculateBudgetData function
   */
  describe('calculateBudgetData integration', () => {
    it('returns valid budget data structure for any budget', () => {
      fc.assert(
        fc.property(clientBudgetArb, (budget) => {
          const budgetData = calculateBudgetData(budget)
          
          // Check structure
          expect(budgetData).toHaveProperty('revenues')
          expect(budgetData).toHaveProperty('expenses')
          expect(budgetData).toHaveProperty('balance')
          expect(budgetData).toHaveProperty('projection')
          expect(budgetData).toHaveProperty('alerts')
          
          // Check revenues structure
          expect(budgetData.revenues).toHaveProperty('recurring')
          expect(budgetData.revenues).toHaveProperty('oneTime')
          expect(budgetData.revenues).toHaveProperty('totalMonthly')
          expect(budgetData.revenues).toHaveProperty('totalAnnual')
          
          // Check expenses structure
          expect(budgetData.expenses).toHaveProperty('fixed')
          expect(budgetData.expenses).toHaveProperty('variable')
          expect(budgetData.expenses).toHaveProperty('totalMonthly')
          expect(budgetData.expenses).toHaveProperty('totalAnnual')
          
          // Check balance structure
          expect(budgetData.balance).toHaveProperty('monthly')
          expect(budgetData.balance).toHaveProperty('annual')
          expect(budgetData.balance).toHaveProperty('savingsRate')
          
          // Check projection has 12 points
          expect(budgetData.projection.length).toBe(12)
          
          // Check alerts is an array
          expect(Array.isArray(budgetData.alerts)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it('returns empty structure for null budget', () => {
      const budgetData = calculateBudgetData(null)
      
      expect(budgetData.revenues.totalMonthly).toBe(0)
      expect(budgetData.revenues.totalAnnual).toBe(0)
      expect(budgetData.expenses.totalMonthly).toBe(0)
      expect(budgetData.expenses.totalAnnual).toBe(0)
      expect(budgetData.balance.monthly).toBe(0)
      expect(budgetData.balance.annual).toBe(0)
      expect(budgetData.balance.savingsRate).toBe(0)
      expect(budgetData.projection.length).toBe(12)
      expect(budgetData.alerts.length).toBe(0)
    })
  })
})
