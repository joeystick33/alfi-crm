/**
 * Property-Based Tests - Chart Utilities
 * 
 * Tests for chart empty state and currency formatting utilities
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { isChartDataEmpty } from '@/app/_common/components/ui/ChartEmptyState'
import { formatCurrencyForTooltip } from '@/app/_common/lib/utils'

// ============================================================================
// PROPERTY 13: Empty Chart Placeholder
// ============================================================================

/**
 * **Feature: client360-repair, Property 13: Empty chart placeholder**
 * **Validates: Requirements 7.4**
 * 
 * For any chart component with empty data array, the component SHALL render 
 * a placeholder message instead of an empty chart.
 */
describe('Property 13: Empty chart placeholder', () => {
  describe('isChartDataEmpty helper function', () => {
    it('returns true for null data', () => {
      expect(isChartDataEmpty(null)).toBe(true)
    })

    it('returns true for undefined data', () => {
      expect(isChartDataEmpty(undefined)).toBe(true)
    })

    it('returns true for empty array', () => {
      expect(isChartDataEmpty([])).toBe(true)
    })

    it('returns false for non-empty arrays', () => {
      fc.assert(
        fc.property(
          fc.array(fc.anything(), { minLength: 1 }),
          (data) => {
            expect(isChartDataEmpty(data)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('correctly identifies empty vs non-empty arrays', () => {
      fc.assert(
        fc.property(
          fc.array(fc.anything()),
          (data) => {
            const isEmpty = isChartDataEmpty(data)
            // Property: isEmpty should be true if and only if data.length === 0
            expect(isEmpty).toBe(data.length === 0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})

// ============================================================================
// PROPERTY 14: Currency Tooltip Formatting
// ============================================================================

/**
 * **Feature: client360-repair, Property 14: Currency tooltip formatting**
 * **Validates: Requirements 7.5**
 * 
 * For any numeric value in a chart tooltip, the formatted output SHALL match 
 * the French currency format (e.g., "1 234,56 €").
 */
describe('Property 14: Currency tooltip formatting', () => {
  /**
   * Generator for valid numeric values (excluding edge cases)
   */
  const validNumberArb = fc.double({
    min: -1e12,
    max: 1e12,
    noNaN: true,
    noDefaultInfinity: true
  })

  it('formats valid numbers in French currency format', () => {
    fc.assert(
      fc.property(validNumberArb, (value) => {
        const formatted = formatCurrencyForTooltip(value)
        
        // Should end with € (Euro symbol)
        expect(formatted).toContain('€')
        
        // Should use comma as decimal separator (French format)
        // The format should be like "1 234,56 €" or "-1 234,56 €"
        expect(formatted).toMatch(/^-?[\d\s]+,\d{2}\s*€$/)
      }),
      { numRuns: 100 }
    )
  })

  // Note: French locale uses non-breaking space (\u00A0) before the Euro symbol
  const ZERO_EURO = '0,00\u00A0€'

  it('handles null values by returning "0,00 €"', () => {
    const result = formatCurrencyForTooltip(null)
    expect(result).toBe(ZERO_EURO)
  })

  it('handles undefined values by returning "0,00 €"', () => {
    const result = formatCurrencyForTooltip(undefined)
    expect(result).toBe(ZERO_EURO)
  })

  it('handles NaN by returning "0,00 €"', () => {
    const result = formatCurrencyForTooltip(NaN)
    expect(result).toBe(ZERO_EURO)
  })

  it('handles Infinity by returning "0,00 €"', () => {
    expect(formatCurrencyForTooltip(Infinity)).toBe(ZERO_EURO)
    expect(formatCurrencyForTooltip(-Infinity)).toBe(ZERO_EURO)
  })

  it('formats zero correctly', () => {
    const result = formatCurrencyForTooltip(0)
    expect(result).toBe(ZERO_EURO)
  })

  it('preserves sign for negative numbers', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -1e12, max: -0.01, noNaN: true, noDefaultInfinity: true }),
        (value) => {
          const formatted = formatCurrencyForTooltip(value)
          // Negative numbers should have a minus sign
          expect(formatted).toMatch(/^-/)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('formats positive numbers without sign', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 1e12, noNaN: true, noDefaultInfinity: true }),
        (value) => {
          const formatted = formatCurrencyForTooltip(value)
          // Positive numbers should not start with minus
          expect(formatted).not.toMatch(/^-/)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('always produces exactly 2 decimal places', () => {
    fc.assert(
      fc.property(validNumberArb, (value) => {
        const formatted = formatCurrencyForTooltip(value)
        // Should have exactly 2 digits after the comma
        expect(formatted).toMatch(/,\d{2}\s*€$/)
      }),
      { numRuns: 100 }
    )
  })

  it('uses space as thousands separator (French format)', () => {
    // Test with a number that has thousands
    const result = formatCurrencyForTooltip(1234567.89)
    // French format uses non-breaking space (or regular space) as thousands separator
    // The result should be something like "1 234 567,89 €"
    expect(result).toMatch(/1[\s\u00A0]234[\s\u00A0]567,89\s*€/)
  })

  it('round-trip: formatted value represents the original number (within precision)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000000000, max: 1000000000 }),
        (intValue) => {
          // Use integer cents to avoid floating point issues
          const value = intValue / 100
          const formatted = formatCurrencyForTooltip(value)
          
          // Parse the formatted value back
          // Remove € and spaces, replace comma with dot
          const parsed = parseFloat(
            formatted
              .replace(/\s*€\s*$/, '')
              .replace(/[\s\u00A0]/g, '')
              .replace(',', '.')
          )
          
          // Should be equal within floating point precision
          expect(Math.abs(parsed - value)).toBeLessThan(0.01)
        }
      ),
      { numRuns: 100 }
    )
  })
})
