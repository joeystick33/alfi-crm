/**
 * Opportunities Service - Moteur de détection d'opportunités
 * 8 règles de détection intelligentes avec scoring
 */

export type OpportunityType = 
  | 'DIVERSIFICATION_NEEDED'
  | 'PREPARATION_RETRAITE'
  | 'OPTIMISATION_FISCALE'
  | 'LIFE_INSURANCE_UNDERUSED'
  | 'PLANIFICATION_SUCCESSION'
  | 'DEBT_CONSOLIDATION'
  | 'INVESTISSEMENT_IMMOBILIER'
  | 'PER_OPPORTUNITY'

export interface Opportunity {
  type: OpportunityType
  priority: 'HAUTE' | 'MOYENNE' | 'BASSE'
  score: number
  title: string
  description: string
  recommendation: string
  potentialGain?: number
}

export interface ClientProfile {
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

const OPPORTUNITY_CONFIG: Record<OpportunityType, { title: string; base: number }> = {
  DIVERSIFICATION_NEEDED: { title: 'Diversification du patrimoine', base: 70 },
  PREPARATION_RETRAITE: { title: 'Préparation retraite', base: 80 },
  OPTIMISATION_FISCALE: { title: 'Optimisation fiscale', base: 75 },
  LIFE_INSURANCE_UNDERUSED: { title: 'Assurance-vie sous-utilisée', base: 65 },
  PLANIFICATION_SUCCESSION: { title: 'Planification successorale', base: 70 },
  DEBT_CONSOLIDATION: { title: 'Restructuration des dettes', base: 60 },
  INVESTISSEMENT_IMMOBILIER: { title: 'Investissement immobilier', base: 55 },
  PER_OPPORTUNITY: { title: 'Ouverture PER', base: 72 },
}

export function detectOpportunities(client: ClientProfile): Opportunity[] {
  const opportunities: Opportunity[] = []

  // 1. Diversification nécessaire (>70% immo ou >70% financier)
  const immoRatio = client.netWealth > 0 ? client.realEstateAssets / client.netWealth : 0
  const finRatio = client.netWealth > 0 ? client.financialAssets / client.netWealth : 0
  if (immoRatio > 0.7) {
    opportunities.push({
      type: 'DIVERSIFICATION_NEEDED',
      priority: immoRatio > 0.85 ? 'HAUTE' : 'MOYENNE',
      score: Math.round(70 + (immoRatio - 0.7) * 100),
      title: 'Diversification du patrimoine',
      description: `${Math.round(immoRatio * 100)}% du patrimoine est immobilier. Risque de concentration élevé.`,
      recommendation: 'Diversifier vers des actifs financiers (assurance-vie, PEA)',
    })
  }

  // 2. Préparation retraite (50+ ans sans épargne retraite suffisante)
  if (client.age >= 50 && !client.hasPER && client.annualIncome > 40000) {
    const yearsToRetirement = Math.max(0, 62 - client.age)
    opportunities.push({
      type: 'PREPARATION_RETRAITE',
      priority: client.age >= 55 ? 'HAUTE' : 'MOYENNE',
      score: Math.round(80 + (client.age - 50) * 2),
      title: 'Préparation retraite',
      description: `${yearsToRetirement} ans avant la retraite. Épargne retraite insuffisante.`,
      recommendation: 'Ouvrir un PER pour optimiser fiscalement et préparer la retraite',
      potentialGain: Math.round(client.annualIncome * 0.1 * client.taxRate / 100),
    })
  }

  // 3. Optimisation fiscale (TMI élevée)
  if (client.taxRate >= 30 && client.annualIncome > 50000) {
    opportunities.push({
      type: 'OPTIMISATION_FISCALE',
      priority: client.taxRate >= 41 ? 'HAUTE' : 'MOYENNE',
      score: Math.round(75 + (client.taxRate - 30) * 1.5),
      title: 'Optimisation fiscale',
      description: `TMI à ${client.taxRate}%. Potentiel d'optimisation significatif.`,
      recommendation: 'Investir en immobilier défiscalisant, PER, FCPI/FIP',
      potentialGain: Math.round(client.annualIncome * 0.05),
    })
  }

  // 4. Assurance-vie sous-utilisée
  if (!client.hasLifeInsurance && client.netWealth > 50000) {
    opportunities.push({
      type: 'LIFE_INSURANCE_UNDERUSED',
      priority: client.netWealth > 200000 ? 'HAUTE' : 'MOYENNE',
      score: 65,
      title: 'Assurance-vie à ouvrir',
      description: 'Pas d\'assurance-vie détectée. Outil patrimonial incontournable.',
      recommendation: 'Ouvrir une assurance-vie multisupport',
    })
  }

  // 5. Planification successorale (60+ avec patrimoine significatif)
  if (client.age >= 60 && client.netWealth > 300000 && client.numberOfChildren > 0) {
    opportunities.push({
      type: 'PLANIFICATION_SUCCESSION',
      priority: client.age >= 70 ? 'HAUTE' : 'MOYENNE',
      score: Math.round(70 + (client.age - 60) * 1.5),
      title: 'Planification successorale',
      description: `Patrimoine de ${(client.netWealth / 1000).toFixed(0)}k€ à transmettre.`,
      recommendation: 'Anticiper la transmission via donations, démembrement',
    })
  }

  // 6. Restructuration dettes (ratio dettes/revenus > 33%)
  const debtRatio = client.annualIncome > 0 ? client.liabilities / (client.annualIncome * 10) : 0
  if (debtRatio > 0.33 && client.liabilities > 50000) {
    opportunities.push({
      type: 'DEBT_CONSOLIDATION',
      priority: debtRatio > 0.5 ? 'HAUTE' : 'MOYENNE',
      score: Math.round(60 + debtRatio * 50),
      title: 'Restructuration des crédits',
      description: `Endettement de ${Math.round(debtRatio * 100)}% des revenus sur 10 ans.`,
      recommendation: 'Regrouper les crédits pour réduire les mensualités',
    })
  }

  // 7. Investissement immobilier (épargne disponible sans immo)
  if (client.financialAssets > 100000 && client.realEstateAssets === 0) {
    opportunities.push({
      type: 'INVESTISSEMENT_IMMOBILIER',
      priority: 'MOYENNE',
      score: 55,
      title: 'Investissement immobilier',
      description: 'Épargne financière importante sans immobilier.',
      recommendation: 'Diversifier vers l\'immobilier (SCPI, locatif)',
    })
  }

  // 8. PER Opportunity (salarié TMI 30%+ sans PER)
  if (!client.hasPER && client.taxRate >= 30 && client.age < 60) {
    opportunities.push({
      type: 'PER_OPPORTUNITY',
      priority: client.taxRate >= 41 ? 'HAUTE' : 'MOYENNE',
      score: Math.round(72 + (client.taxRate - 30)),
      title: 'Ouverture d\'un PER',
      description: 'Aucun Plan Épargne Retraite détecté.',
      recommendation: 'Ouvrir un PER pour déduire les versements du revenu imposable',
      potentialGain: Math.round(client.annualIncome * 0.1 * client.taxRate / 100),
    })
  }

  // Trier par score décroissant
  return opportunities.sort((a, b) => b.score - a.score)
}

export function calculateOpportunityScore(opportunities: Opportunity[]): number {
  if (opportunities.length === 0) return 0
  const total = opportunities.reduce((sum, o) => sum + o.score, 0)
  return Math.round(total / opportunities.length)
}
