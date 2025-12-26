/**
 * Tests unitaires - Opportunities Service
 */

import { describe, it, expect } from 'vitest'

type OpportunityType = 
  | 'DIVERSIFICATION_NEEDED'
  | 'RETIREMENT_PREPARATION'
  | 'TAX_OPTIMIZATION'
  | 'LIFE_INSURANCE_UNDERUSED'
  | 'SUCCESSION_PLANNING'
  | 'DEBT_CONSOLIDATION'
  | 'REAL_ESTATE_INVESTMENT'
  | 'PER_OPPORTUNITY'

interface ClientProfile {
  age: number
  netWealth: number
  financialAssets: number
  realEstateAssets: number
  liabilities: number
  annualIncome: number
  numberOfChildren: number
  hasLifeInsurance: boolean
  hasPER: boolean
  taxRate: number
  riskProfile: string
}

interface Opportunity {
  type: OpportunityType
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  score: number
}

function detectOpportunities(client: ClientProfile): Opportunity[] {
  const opportunities: Opportunity[] = []

  // Diversification
  const immoRatio = client.netWealth > 0 ? client.realEstateAssets / client.netWealth : 0
  if (immoRatio > 0.7) {
    opportunities.push({
      type: 'DIVERSIFICATION_NEEDED',
      priority: immoRatio > 0.85 ? 'HIGH' : 'MEDIUM',
      score: Math.round(70 + (immoRatio - 0.7) * 100),
    })
  }

  // Retraite
  if (client.age >= 50 && !client.hasPER && client.annualIncome > 40000) {
    opportunities.push({
      type: 'RETIREMENT_PREPARATION',
      priority: client.age >= 55 ? 'HIGH' : 'MEDIUM',
      score: Math.round(80 + (client.age - 50) * 2),
    })
  }

  // Optimisation fiscale
  if (client.taxRate >= 30) {
    opportunities.push({
      type: 'TAX_OPTIMIZATION',
      priority: client.taxRate >= 41 ? 'HIGH' : 'MEDIUM',
      score: Math.round(75 + (client.taxRate - 30) * 1.5),
    })
  }

  // Assurance-vie
  if (!client.hasLifeInsurance && client.netWealth > 50000) {
    opportunities.push({
      type: 'LIFE_INSURANCE_UNDERUSED',
      priority: client.netWealth > 200000 ? 'HIGH' : 'MEDIUM',
      score: 65,
    })
  }

  // Succession
  if (client.age >= 60 && client.netWealth > 300000 && client.numberOfChildren > 0) {
    opportunities.push({
      type: 'SUCCESSION_PLANNING',
      priority: client.age >= 70 ? 'HIGH' : 'MEDIUM',
      score: Math.round(70 + (client.age - 60) * 1.5),
    })
  }

  return opportunities.sort((a, b) => b.score - a.score)
}

describe('Opportunities Service', () => {
  describe('detectOpportunities', () => {
    it('détecte la diversification nécessaire', () => {
      const client: ClientProfile = {
        age: 45,
        netWealth: 500000,
        financialAssets: 50000,
        realEstateAssets: 450000, // 90% immo
        liabilities: 0,
        annualIncome: 60000,
        numberOfChildren: 2,
        hasLifeInsurance: true,
        hasPER: true,
        taxRate: 30,
        riskProfile: 'EQUILIBRE',
      }

      const opportunities = detectOpportunities(client)
      
      const diversification = opportunities.find(o => o.type === 'DIVERSIFICATION_NEEDED')
      expect(diversification).toBeDefined()
      expect(diversification?.priority).toBe('HIGH')
    })

    it('détecte la préparation retraite', () => {
      const client: ClientProfile = {
        age: 55,
        netWealth: 300000,
        financialAssets: 150000,
        realEstateAssets: 150000,
        liabilities: 0,
        annualIncome: 70000,
        numberOfChildren: 2,
        hasLifeInsurance: true,
        hasPER: false, // Pas de PER
        taxRate: 30,
        riskProfile: 'EQUILIBRE',
      }

      const opportunities = detectOpportunities(client)
      
      const retirement = opportunities.find(o => o.type === 'RETIREMENT_PREPARATION')
      expect(retirement).toBeDefined()
      expect(retirement?.priority).toBe('HIGH')
    })

    it('détecte l\'optimisation fiscale pour TMI élevée', () => {
      const client: ClientProfile = {
        age: 40,
        netWealth: 200000,
        financialAssets: 100000,
        realEstateAssets: 100000,
        liabilities: 0,
        annualIncome: 100000,
        numberOfChildren: 1,
        hasLifeInsurance: true,
        hasPER: true,
        taxRate: 41, // TMI 41%
        riskProfile: 'EQUILIBRE',
      }

      const opportunities = detectOpportunities(client)
      
      const taxOpt = opportunities.find(o => o.type === 'TAX_OPTIMIZATION')
      expect(taxOpt).toBeDefined()
      expect(taxOpt?.priority).toBe('HIGH')
    })

    it('détecte l\'absence d\'assurance-vie', () => {
      const client: ClientProfile = {
        age: 35,
        netWealth: 250000,
        financialAssets: 125000,
        realEstateAssets: 125000,
        liabilities: 0,
        annualIncome: 50000,
        numberOfChildren: 0,
        hasLifeInsurance: false, // Pas d'AV
        hasPER: true,
        taxRate: 30,
        riskProfile: 'EQUILIBRE',
      }

      const opportunities = detectOpportunities(client)
      
      const av = opportunities.find(o => o.type === 'LIFE_INSURANCE_UNDERUSED')
      expect(av).toBeDefined()
      expect(av?.priority).toBe('HIGH')
    })

    it('détecte la planification successorale', () => {
      const client: ClientProfile = {
        age: 70,
        netWealth: 800000,
        financialAssets: 400000,
        realEstateAssets: 400000,
        liabilities: 0,
        annualIncome: 40000,
        numberOfChildren: 3,
        hasLifeInsurance: true,
        hasPER: true,
        taxRate: 14,
        riskProfile: 'PRUDENT',
      }

      const opportunities = detectOpportunities(client)
      
      const succession = opportunities.find(o => o.type === 'SUCCESSION_PLANNING')
      expect(succession).toBeDefined()
      expect(succession?.priority).toBe('HIGH')
    })

    it('ne détecte rien pour un profil optimisé', () => {
      const client: ClientProfile = {
        age: 35,
        netWealth: 200000,
        financialAssets: 100000,
        realEstateAssets: 100000, // 50/50
        liabilities: 0,
        annualIncome: 40000,
        numberOfChildren: 0,
        hasLifeInsurance: true,
        hasPER: true,
        taxRate: 11, // TMI faible
        riskProfile: 'EQUILIBRE',
      }

      const opportunities = detectOpportunities(client)
      
      expect(opportunities).toHaveLength(0)
    })
  })
})
