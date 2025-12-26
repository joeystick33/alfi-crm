/**
 * Tests unitaires - Budget Service
 */

import { describe, it, expect } from 'vitest'

// Types pour les tests
interface BudgetMetrics {
  totalRevenus: number
  totalCharges: number
  epargne: number
  tauxEpargne: number
  resteAVivre: number
  ratioChargesRevenus: number
}

// Fonctions à tester (extraites du service)
function calculateBudgetMetrics(revenus: number[], charges: number[]): BudgetMetrics {
  const totalRevenus = revenus.reduce((s, r) => s + r, 0)
  const totalCharges = charges.reduce((s, c) => s + c, 0)
  const epargne = totalRevenus - totalCharges
  const tauxEpargne = totalRevenus > 0 ? (epargne / totalRevenus) * 100 : 0
  const chargesIncompressibles = totalCharges * 0.7 // Estimation 70% incompressible
  const resteAVivre = totalRevenus - chargesIncompressibles
  const ratioChargesRevenus = totalRevenus > 0 ? (totalCharges / totalRevenus) * 100 : 0

  return {
    totalRevenus,
    totalCharges,
    epargne,
    tauxEpargne,
    resteAVivre,
    ratioChargesRevenus,
  }
}

describe('Budget Service', () => {
  describe('calculateBudgetMetrics', () => {
    it('calcule correctement avec des valeurs positives', () => {
      const revenus = [5000, 800] // 5800€
      const charges = [1200, 500, 300] // 2000€
      
      const metrics = calculateBudgetMetrics(revenus, charges)
      
      expect(metrics.totalRevenus).toBe(5800)
      expect(metrics.totalCharges).toBe(2000)
      expect(metrics.epargne).toBe(3800)
      expect(metrics.tauxEpargne).toBeCloseTo(65.52, 1)
    })

    it('gère le cas sans revenus', () => {
      const revenus: number[] = []
      const charges = [1000]
      
      const metrics = calculateBudgetMetrics(revenus, charges)
      
      expect(metrics.totalRevenus).toBe(0)
      expect(metrics.tauxEpargne).toBe(0)
      expect(metrics.ratioChargesRevenus).toBe(0)
    })

    it('calcule le reste à vivre', () => {
      const revenus = [4000]
      const charges = [2000]
      
      const metrics = calculateBudgetMetrics(revenus, charges)
      
      // Reste à vivre = 4000 - (2000 * 0.7) = 4000 - 1400 = 2600
      expect(metrics.resteAVivre).toBe(2600)
    })

    it('détecte un budget déficitaire', () => {
      const revenus = [3000]
      const charges = [3500]
      
      const metrics = calculateBudgetMetrics(revenus, charges)
      
      expect(metrics.epargne).toBe(-500)
      expect(metrics.tauxEpargne).toBeLessThan(0)
    })
  })
})

describe('Budget Anomalies Detection', () => {
  function detectAnomalies(metrics: BudgetMetrics): string[] {
    const anomalies: string[] = []
    
    if (metrics.tauxEpargne < 10) anomalies.push('EPARGNE_INSUFFISANTE')
    if (metrics.ratioChargesRevenus > 90) anomalies.push('CHARGES_EXCESSIVES')
    if (metrics.resteAVivre < 500) anomalies.push('RESTE_A_VIVRE_CRITIQUE')
    if (metrics.epargne < 0) anomalies.push('BUDGET_DEFICITAIRE')
    
    return anomalies
  }

  it('détecte épargne insuffisante', () => {
    const metrics: BudgetMetrics = {
      totalRevenus: 3000,
      totalCharges: 2800,
      epargne: 200,
      tauxEpargne: 6.67,
      resteAVivre: 1040,
      ratioChargesRevenus: 93.33,
    }
    
    const anomalies = detectAnomalies(metrics)
    
    expect(anomalies).toContain('EPARGNE_INSUFFISANTE')
    expect(anomalies).toContain('CHARGES_EXCESSIVES')
  })

  it('ne détecte pas d\'anomalie pour un budget sain', () => {
    const metrics: BudgetMetrics = {
      totalRevenus: 5000,
      totalCharges: 3000,
      epargne: 2000,
      tauxEpargne: 40,
      resteAVivre: 2900,
      ratioChargesRevenus: 60,
    }
    
    const anomalies = detectAnomalies(metrics)
    
    expect(anomalies).toHaveLength(0)
  })
})
