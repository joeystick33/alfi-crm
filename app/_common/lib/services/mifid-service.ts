/**
 * MiFID Service - Gestion de la conformité MIF2
 * Questionnaires, profils, adéquation
 */

import { prisma } from '@/app/_common/lib/prisma'

export type RiskProfile = 'DEFENSIVE' | 'CONSERVATIVE' | 'BALANCED' | 'DYNAMIC' | 'AGGRESSIVE'
export type InvestmentHorizon = 'COURT' | 'MOYENNE' | 'LONG' | 'VERY_LONG'
export type InvestmentObjective = 'CAPITAL_PRESERVATION' | 'INCOME' | 'GROWTH' | 'SPECULATION'

export interface MiFIDProfile {
  clientId: string
  
  // Connaissances et expérience
  financialKnowledge: 'NONE' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'
  investmentExperience: number // années
  productExperience: {
    stocks: boolean
    bonds: boolean
    funds: boolean
    derivatives: boolean
    structuredProducts: boolean
    realEstate: boolean
    crypto: boolean
  }
  
  // Situation financière
  annualIncome: number
  liquidAssets: number
  totalWealth: number
  monthlyExpenses: number
  financialCommitments: number
  incomeStability: 'STABLE' | 'VARIABLE' | 'UNCERTAIN'
  
  // Objectifs et tolérance
  riskProfile: RiskProfile
  investmentHorizon: InvestmentHorizon
  objectives: InvestmentObjective[]
  maxAcceptableLoss: number // pourcentage
  
  // Scores
  knowledgeScore: number
  experienceScore: number
  financialScore: number
  riskToleranceScore: number
  overallScore: number
  
  // Méta
  completedAt: Date
  expiresAt: Date
  version: number
}

export interface SuitabilityAssessment {
  clientId: string
  productId: string
  productRisk: number
  clientProfile: MiFIDProfile
  isSuitable: boolean
  reasons: string[]
  warnings: string[]
  recommendation: 'SUITABLE' | 'UNSUITABLE' | 'REVIEW_REQUIRED'
}

export interface MiFIDQuestionnaire {
  // Section 1: Connaissances
  q1_financialEducation: 'NONE' | 'BASIC' | 'PROFESSIONAL' | 'EXPERT'
  q2_investmentKnowledge: 1 | 2 | 3 | 4 | 5
  q3_marketUnderstanding: boolean
  q4_riskUnderstanding: boolean
  
  // Section 2: Expérience
  q5_yearsInvesting: number
  q6_frequencyTrading: 'NEVER' | 'RARELY' | 'OCCASIONALLY' | 'REGULARLY'
  q7_productTypes: string[]
  q8_largestInvestment: number
  
  // Section 3: Situation financière
  q9_annualIncome: number
  q10_liquidAssets: number
  q11_totalWealth: number
  q12_monthlyExpenses: number
  q13_debts: number
  q14_incomeSource: string
  
  // Section 4: Objectifs
  q15_primaryGoal: InvestmentObjective
  q16_investmentHorizon: InvestmentHorizon
  q17_maxLoss: number
  q18_reactionToLoss: 'SELL' | 'HOLD' | 'BUY_MORE'
  
  // Section 5: Préférences
  q19_esgPreference: boolean
  q20_liquidityNeeds: 'HAUTE' | 'MOYENNE' | 'BASSE'
}

export class MiFIDService {
  /**
   * Calcule le profil MiFID à partir du questionnaire
   */
  calculateProfile(questionnaire: MiFIDQuestionnaire, clientId: string): MiFIDProfile {
    // Calcul des scores
    const knowledgeScore = this.calculateKnowledgeScore(questionnaire)
    const experienceScore = this.calculateExperienceScore(questionnaire)
    const financialScore = this.calculateFinancialScore(questionnaire)
    const riskToleranceScore = this.calculateRiskToleranceScore(questionnaire)
    
    const overallScore = Math.round(
      (knowledgeScore * 0.2) +
      (experienceScore * 0.2) +
      (financialScore * 0.3) +
      (riskToleranceScore * 0.3)
    )
    
    // Détermination du profil de risque
    const riskProfile = this.determineRiskProfile(overallScore, questionnaire)
    
    return {
      clientId,
      financialKnowledge: this.mapEducationToKnowledge(questionnaire.q1_financialEducation),
      investmentExperience: questionnaire.q5_yearsInvesting,
      productExperience: {
        stocks: questionnaire.q7_productTypes.includes('stocks'),
        bonds: questionnaire.q7_productTypes.includes('bonds'),
        funds: questionnaire.q7_productTypes.includes('funds'),
        derivatives: questionnaire.q7_productTypes.includes('derivatives'),
        structuredProducts: questionnaire.q7_productTypes.includes('structured'),
        realEstate: questionnaire.q7_productTypes.includes('real_estate'),
        crypto: questionnaire.q7_productTypes.includes('crypto'),
      },
      annualIncome: questionnaire.q9_annualIncome,
      liquidAssets: questionnaire.q10_liquidAssets,
      totalWealth: questionnaire.q11_totalWealth,
      monthlyExpenses: questionnaire.q12_monthlyExpenses,
      financialCommitments: questionnaire.q13_debts,
      incomeStability: 'STABLE', // À déduire de q14
      riskProfile,
      investmentHorizon: questionnaire.q16_investmentHorizon,
      objectives: [questionnaire.q15_primaryGoal],
      maxAcceptableLoss: questionnaire.q17_maxLoss,
      knowledgeScore,
      experienceScore,
      financialScore,
      riskToleranceScore,
      overallScore,
      completedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
      version: 1,
    }
  }

  private calculateKnowledgeScore(q: MiFIDQuestionnaire): number {
    let score = 0
    
    // Education financière
    switch (q.q1_financialEducation) {
      case 'EXPERT': score += 40; break
      case 'PROFESSIONAL': score += 30; break
      case 'BASIC': score += 15; break
      default: score += 0
    }
    
    // Connaissance investissement (1-5)
    score += q.q2_investmentKnowledge * 8
    
    // Compréhension marché et risques
    if (q.q3_marketUnderstanding) score += 10
    if (q.q4_riskUnderstanding) score += 10
    
    return Math.min(100, score)
  }

  private calculateExperienceScore(q: MiFIDQuestionnaire): number {
    let score = 0
    
    // Années d'investissement
    score += Math.min(40, q.q5_yearsInvesting * 4)
    
    // Fréquence de trading
    switch (q.q6_frequencyTrading) {
      case 'REGULARLY': score += 30; break
      case 'OCCASIONALLY': score += 20; break
      case 'RARELY': score += 10; break
      default: score += 0
    }
    
    // Diversité des produits
    score += Math.min(30, q.q7_productTypes.length * 5)
    
    return Math.min(100, score)
  }

  private calculateFinancialScore(q: MiFIDQuestionnaire): number {
    let score = 0
    
    // Ratio liquidités / patrimoine
    const liquidityRatio = q.q10_liquidAssets / Math.max(1, q.q11_totalWealth)
    score += Math.min(30, liquidityRatio * 100)
    
    // Ratio patrimoine / revenus
    const wealthIncomeRatio = q.q11_totalWealth / Math.max(1, q.q9_annualIncome)
    score += Math.min(30, wealthIncomeRatio * 3)
    
    // Capacité d'épargne (revenus - dépenses) / revenus
    const savingsRate = (q.q9_annualIncome / 12 - q.q12_monthlyExpenses) / Math.max(1, q.q9_annualIncome / 12)
    score += Math.min(40, savingsRate * 100)
    
    return Math.min(100, Math.max(0, score))
  }

  private calculateRiskToleranceScore(q: MiFIDQuestionnaire): number {
    let score = 0
    
    // Perte maximale acceptable
    score += Math.min(50, q.q17_maxLoss * 2)
    
    // Réaction à la perte
    switch (q.q18_reactionToLoss) {
      case 'BUY_MORE': score += 40; break
      case 'HOLD': score += 20; break
      default: score += 0
    }
    
    // Horizon d'investissement
    switch (q.q16_investmentHorizon) {
      case 'VERY_LONG': score += 10; break
      case 'LONG': score += 7; break
      case 'MOYENNE': score += 4; break
      default: score += 0
    }
    
    return Math.min(100, score)
  }

  private determineRiskProfile(score: number, q: MiFIDQuestionnaire): RiskProfile {
    // Contraintes absolues
    if (q.q17_maxLoss <= 5) return 'DEFENSIVE'
    if (q.q18_reactionToLoss === 'SELL' && q.q17_maxLoss <= 10) return 'CONSERVATIVE'
    
    // Basé sur le score
    if (score >= 80) return 'AGGRESSIVE'
    if (score >= 60) return 'DYNAMIC'
    if (score >= 40) return 'BALANCED'
    if (score >= 20) return 'CONSERVATIVE'
    return 'DEFENSIVE'
  }

  private mapEducationToKnowledge(education: string): 'NONE' | 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' {
    switch (education) {
      case 'EXPERT': return 'ADVANCED'
      case 'PROFESSIONAL': return 'INTERMEDIATE'
      case 'BASIC': return 'BASIC'
      default: return 'NONE'
    }
  }

  /**
   * Évalue l'adéquation d'un produit pour un client
   */
  assessSuitability(
    profile: MiFIDProfile,
    productRisk: number, // 1-7 échelle SRRI
    productId: string
  ): SuitabilityAssessment {
    const warnings: string[] = []
    const reasons: string[] = []
    
    // Mapping profil -> risque max accepté
    const maxRiskByProfile: Record<RiskProfile, number> = {
      DEFENSIVE: 2,
      CONSERVATIVE: 3,
      BALANCED: 4,
      DYNAMIC: 5,
      AGGRESSIVE: 7,
    }
    
    const maxAcceptableRisk = maxRiskByProfile[profile.riskProfile]
    
    // Vérification risque
    if (productRisk > maxAcceptableRisk) {
      reasons.push(`Risque produit (${productRisk}) supérieur au profil client (max ${maxAcceptableRisk})`)
    }
    
    // Vérification connaissances pour produits complexes
    if (productRisk >= 5 && profile.knowledgeScore < 50) {
      warnings.push('Connaissances insuffisantes pour ce type de produit')
    }
    
    // Vérification expérience
    if (productRisk >= 6 && profile.experienceScore < 40) {
      warnings.push('Expérience limitée pour ce niveau de risque')
    }
    
    // Vérification horizon
    if (productRisk >= 5 && profile.investmentHorizon === 'COURT') {
      reasons.push('Horizon trop court pour ce niveau de risque')
    }
    
    // Vérification capacité financière
    if (profile.financialScore < 30 && productRisk >= 4) {
      warnings.push('Situation financière à surveiller')
    }
    
    const isSuitable = reasons.length === 0
    
    return {
      clientId: profile.clientId,
      productId,
      productRisk,
      clientProfile: profile,
      isSuitable,
      reasons,
      warnings,
      recommendation: isSuitable 
        ? (warnings.length > 0 ? 'REVIEW_REQUIRED' : 'SUITABLE')
        : 'UNSUITABLE'
    }
  }

  /**
   * Vérifie si le profil MiFID est à jour
   */
  isProfileValid(profile: MiFIDProfile): boolean {
    return new Date() < profile.expiresAt
  }

  /**
   * Récupère le profil MiFID d'un client depuis la base
   */
  async getClientMiFIDProfile(clientId: string): Promise<MiFIDProfile | null> {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        riskProfile: true,
        investmentHorizon: true,
        annualIncome: true,
      }
    })

    if (!client) {
      return null
    }

    return {
      clientId: client.id,
      financialKnowledge: 'BASIC',
      investmentExperience: 0,
      productExperience: {
        stocks: false, bonds: false, funds: false,
        derivatives: false, structuredProducts: false,
        realEstate: false, crypto: false,
      },
      annualIncome: Number(client.annualIncome) || 0,
      liquidAssets: 0,
      totalWealth: 0,
      monthlyExpenses: 0,
      financialCommitments: 0,
      incomeStability: 'STABLE',
      riskProfile: (client.riskProfile as RiskProfile) || 'BALANCED',
      investmentHorizon: (client.investmentHorizon as InvestmentHorizon) || 'MOYENNE',
      objectives: ['GROWTH'],
      maxAcceptableLoss: 20,
      knowledgeScore: 50,
      experienceScore: 50,
      financialScore: 50,
      riskToleranceScore: 50,
      overallScore: 50,
      completedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      version: 1,
    }
  }

  // ═══════════════════════════════════════════════════════════════════════
  // PERSISTANCE — Questionnaire MiFID II historisé (table mifid_questionnaires)
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Crée ou met à jour un questionnaire MiFID II historisé en BDD.
   * Expire au bout de 2 ans (recommandation AMF).
   */
  async saveQuestionnaire(input: {
    cabinetId: string
    clientId: string
    validatedBy?: string
    answers: MiFIDQuestionnaire
  }) {
    const profile = this.calculateProfile(input.answers, input.clientId)
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 2) // Validité 2 ans

    // Déterminer la version (incrémentale par client)
    const latest = await prisma.miFIDQuestionnaire.findFirst({
      where: { clientId: input.clientId, cabinetId: input.cabinetId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const version = (latest?.version || 0) + 1

    // Mapper le profil vers les champs Prisma
    const toleranceMap: Record<RiskProfile, string> = {
      DEFENSIVE: 'PRUDENT',
      CONSERVATIVE: 'MODERE',
      BALANCED: 'EQUILIBRE',
      DYNAMIC: 'DYNAMIQUE',
      AGGRESSIVE: 'OFFENSIF',
    }
    const horizonMap: Record<InvestmentHorizon, string> = {
      COURT: 'COURT_TERME',
      MOYENNE: 'MOYEN_TERME',
      LONG: 'LONG_TERME',
      VERY_LONG: 'TRES_LONG_TERME',
    }
    const objectiveMap: Record<InvestmentObjective, string> = {
      CAPITAL_PRESERVATION: 'PRESERVATION',
      INCOME: 'INCOME',
      GROWTH: 'CAPITAL_GROWTH',
      SPECULATION: 'CAPITAL_GROWTH',
    }
    const lossMap: Record<string, string> = {}
    if (profile.maxAcceptableLoss <= 0) lossMap.val = 'AUCUNE'
    else if (profile.maxAcceptableLoss <= 5) lossMap.val = 'MOINS_5'
    else if (profile.maxAcceptableLoss <= 10) lossMap.val = 'MOINS_10'
    else if (profile.maxAcceptableLoss <= 20) lossMap.val = 'MOINS_20'
    else if (profile.maxAcceptableLoss <= 30) lossMap.val = 'MOINS_30'
    else lossMap.val = 'PLUS_30'

    const knowledgeMap = (v: string): string => {
      switch (v) { case 'NONE': return 'AUCUNE'; case 'BASIC': return 'BASIQUE'; case 'INTERMEDIATE': return 'INTERMEDIAIRE'; case 'ADVANCED': return 'AVANCEE'; default: return 'AUCUNE' }
    }

    const questionnaire = await prisma.miFIDQuestionnaire.create({
      data: {
        cabinetId: input.cabinetId,
        clientId: input.clientId,
        version,
        status: input.validatedBy ? 'VALIDE' : 'COMPLETE',
        completedAt: new Date(),
        validatedBy: input.validatedBy,
        expiresAt,

        // Section 1
        connaissanceActions: profile.productExperience.stocks ? knowledgeMap(profile.financialKnowledge) : 'AUCUNE',
        connaissanceObligations: profile.productExperience.bonds ? knowledgeMap(profile.financialKnowledge) : 'AUCUNE',
        connaissanceOPCVM: profile.productExperience.funds ? knowledgeMap(profile.financialKnowledge) : 'AUCUNE',
        connaissanceProdStructures: profile.productExperience.structuredProducts ? knowledgeMap(profile.financialKnowledge) : 'AUCUNE',
        connaissanceImmobilier: profile.productExperience.realEstate ? knowledgeMap(profile.financialKnowledge) : 'AUCUNE',
        connaissanceCrypto: profile.productExperience.crypto ? knowledgeMap(profile.financialKnowledge) : 'AUCUNE',
        experienceNbOperations: input.answers.q5_yearsInvesting > 0 ? Math.round(input.answers.q5_yearsInvesting * 5) : 0,
        experienceMontantMoyen: input.answers.q8_largestInvestment || 0,
        experiencePertes: false,
        formationFinanciere: input.answers.q1_financialEducation === 'EXPERT' ? 'Diplôme' : input.answers.q1_financialEducation === 'PROFESSIONAL' ? 'Formation pro' : input.answers.q1_financialEducation === 'BASIC' ? 'Autodidacte' : 'Aucune',

        // Section 2
        revenusAnnuels: input.answers.q9_annualIncome,
        patrimoineFinancier: input.answers.q10_liquidAssets,
        patrimoineImmobilier: Math.max(0, input.answers.q11_totalWealth - input.answers.q10_liquidAssets),
        chargesMensuelles: input.answers.q12_monthlyExpenses,
        capaciteEpargneMensuelle: Math.max(0, input.answers.q9_annualIncome / 12 - input.answers.q12_monthlyExpenses),
        endettement: input.answers.q9_annualIncome > 0 ? Number(((input.answers.q13_debts / input.answers.q9_annualIncome) * 100).toFixed(2)) : 0,
        epargnePrecaution: input.answers.q10_liquidAssets * 0.2,
        epargnePrecautionMois: input.answers.q12_monthlyExpenses > 0 ? Math.round((input.answers.q10_liquidAssets * 0.2) / input.answers.q12_monthlyExpenses) : 0,

        // Section 3
        objectifPrincipal: objectiveMap[input.answers.q15_primaryGoal],
        horizonInvestissement: horizonMap[input.answers.q16_investmentHorizon],
        toleranceRisque: toleranceMap[profile.riskProfile],
        pertesAcceptables: lossMap.val,
        besoinLiquidite: input.answers.q20_liquidityNeeds === 'HAUTE' ? 'IMMEDIAT' : input.answers.q20_liquidityNeeds === 'MOYENNE' ? 'SOUS_1_AN' : 'PAS_DE_BESOIN',
        investissementResponsable: input.answers.q19_esgPreference,

        // Section 4 — Résultat
        profilCalcule: toleranceMap[profile.riskProfile],
        scoreRisque: profile.overallScore,
        recommandationAllocation: this.getAllocationRecommendation(profile.riskProfile) as any,
      },
    })

    // Mettre à jour le profil de risque du client
    await prisma.client.update({
      where: { id: input.clientId },
      data: {
        riskProfile: profile.riskProfile as any,
        investmentHorizon: input.answers.q16_investmentHorizon as any,
      },
    })

    return { questionnaire, profile }
  }

  /**
   * Récupère le dernier questionnaire MiFID II valide d'un client.
   */
  async getLatestQuestionnaire(clientId: string, cabinetId: string) {
    return prisma.miFIDQuestionnaire.findFirst({
      where: { clientId, cabinetId, status: { in: ['VALIDE', 'COMPLETE'] } },
      orderBy: { version: 'desc' },
    })
  }

  /**
   * Vérifie si le questionnaire MiFID est expiré ou absent.
   */
  async needsRenewal(clientId: string, cabinetId: string): Promise<boolean> {
    const latest = await this.getLatestQuestionnaire(clientId, cabinetId)
    if (!latest) return true
    if (latest.expiresAt && new Date() > latest.expiresAt) return true
    if (latest.status === 'EXPIRE') return true
    return false
  }

  /**
   * Historique complet des questionnaires MiFID d'un client.
   */
  async getHistory(clientId: string, cabinetId: string) {
    return prisma.miFIDQuestionnaire.findMany({
      where: { clientId, cabinetId },
      orderBy: { version: 'desc' },
    })
  }

  /**
   * Recommandation d'allocation selon le profil de risque (règle métier CGP).
   */
  private getAllocationRecommendation(profile: RiskProfile): Record<string, number> {
    const allocations: Record<RiskProfile, Record<string, number>> = {
      DEFENSIVE: { fondsEuros: 70, obligations: 20, actions: 5, immobilier: 5 },
      CONSERVATIVE: { fondsEuros: 50, obligations: 25, actions: 15, immobilier: 10 },
      BALANCED: { fondsEuros: 30, obligations: 20, actions: 30, immobilier: 15, alternatifs: 5 },
      DYNAMIC: { fondsEuros: 10, obligations: 15, actions: 45, immobilier: 15, alternatifs: 10, privateEquity: 5 },
      AGGRESSIVE: { fondsEuros: 0, obligations: 10, actions: 50, immobilier: 15, alternatifs: 15, privateEquity: 10 },
    }
    return allocations[profile]
  }
}

export const mifidService = new MiFIDService()
export default mifidService
