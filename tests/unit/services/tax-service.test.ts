/**
 * Tests unitaires - Tax Service
 */

import { describe, it, expect } from 'vitest'

// Barèmes IR 2024
const IR_BRACKETS_2024 = [
  { limit: 11294, rate: 0 },
  { limit: 28797, rate: 0.11 },
  { limit: 82341, rate: 0.30 },
  { limit: 177106, rate: 0.41 },
  { limit: Infinity, rate: 0.45 },
]

function calculateIncomeTax(revenuImposable: number, parts: number = 1): {
  impotBrut: number
  tmi: number
  tauxMoyen: number
} {
  const revenuParPart = revenuImposable / parts
  let impotParPart = 0
  let tmi = 0
  let previousLimit = 0

  for (const bracket of IR_BRACKETS_2024) {
    if (revenuParPart <= previousLimit) break
    
    const taxableInBracket = Math.min(revenuParPart, bracket.limit) - previousLimit
    impotParPart += taxableInBracket * bracket.rate
    
    if (revenuParPart <= bracket.limit) {
      tmi = bracket.rate * 100
      break
    }
    previousLimit = bracket.limit
  }

  const impotBrut = impotParPart * parts
  const tauxMoyen = revenuImposable > 0 ? (impotBrut / revenuImposable) * 100 : 0

  return { impotBrut, tmi, tauxMoyen }
}

describe('Tax Service - IR', () => {
  describe('calculateIncomeTax', () => {
    it('calcule correctement pour un revenu dans la tranche 0%', () => {
      const result = calculateIncomeTax(10000, 1)
      
      expect(result.impotBrut).toBe(0)
      expect(result.tmi).toBe(0)
    })

    it('calcule correctement pour un revenu dans la tranche 11%', () => {
      const result = calculateIncomeTax(20000, 1)
      
      // (20000 - 11294) * 0.11 = 957.66
      expect(result.impotBrut).toBeCloseTo(957.66, 0)
      expect(result.tmi).toBe(11)
    })

    it('calcule correctement pour un revenu dans la tranche 30%', () => {
      const result = calculateIncomeTax(50000, 1)
      
      // Tranche 11%: (28797 - 11294) * 0.11 = 1925.33
      // Tranche 30%: (50000 - 28797) * 0.30 = 6360.9
      // Total: 8286.23
      expect(result.impotBrut).toBeCloseTo(8286, 0)
      expect(result.tmi).toBe(30)
    })

    it('applique correctement le quotient familial', () => {
      const single = calculateIncomeTax(60000, 1)
      const couple = calculateIncomeTax(60000, 2)
      
      // Le couple paie moins grâce au quotient familial
      expect(couple.impotBrut).toBeLessThan(single.impotBrut)
    })

    it('gère les hauts revenus (TMI 45%)', () => {
      const result = calculateIncomeTax(200000, 1)
      
      expect(result.tmi).toBe(45)
      expect(result.impotBrut).toBeGreaterThan(50000)
    })
  })
})

describe('Tax Service - IFI', () => {
  const IFI_THRESHOLD = 1300000
  const IFI_BRACKETS = [
    { limit: 800000, rate: 0 },
    { limit: 1300000, rate: 0.005 },
    { limit: 2570000, rate: 0.007 },
    { limit: 5000000, rate: 0.01 },
    { limit: 10000000, rate: 0.0125 },
    { limit: Infinity, rate: 0.015 },
  ]

  function calculateIFI(patrimoineImmobilier: number): number {
    if (patrimoineImmobilier < IFI_THRESHOLD) return 0
    
    let ifi = 0
    let previousLimit = 0

    for (const bracket of IFI_BRACKETS) {
      const taxableInBracket = Math.min(patrimoineImmobilier, bracket.limit) - previousLimit
      if (taxableInBracket <= 0) break
      
      ifi += taxableInBracket * bracket.rate
      previousLimit = bracket.limit
      
      if (patrimoineImmobilier <= bracket.limit) break
    }

    return ifi
  }

  it('ne taxe pas sous le seuil de 1.3M€', () => {
    expect(calculateIFI(1200000)).toBe(0)
    expect(calculateIFI(1299999)).toBe(0)
  })

  it('calcule l\'IFI au seuil', () => {
    const ifi = calculateIFI(1300000)
    // 1300000 - 800000 = 500000 * 0.005 = 2500
    expect(ifi).toBeCloseTo(2500, 0)
  })

  it('calcule l\'IFI pour un patrimoine de 2M€', () => {
    const ifi = calculateIFI(2000000)
    // Tranche 0.5%: 500000 * 0.005 = 2500
    // Tranche 0.7%: 700000 * 0.007 = 4900
    // Total: 7400
    expect(ifi).toBeCloseTo(7400, 0)
  })
})
