/**
 * Objective Calculator Service
 * Financial goal planning and multi-objective allocation service
 * 
 * Supports:
 * - Single objective calculation with time value of money
 * - Multiple objectives with priority-based allocation
 * - Investment strategy optimization
 * - Education funding calculator
 * - Home purchase planning
 * - Goal optimization based on risk tolerance
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface ObjectiveInput {
  name: string;
  targetAmount: number;
  currentAmount: number;
  timeHorizon: number; // in years
  priority: number; // 1-5, where 1 is highest
  category?: 'retirement' | 'education' | 'home' | 'travel' | 'other';
}

export interface ObjectiveCalculation {
  objectiveName: string;
  targetAmount: number;
  currentAmount: number;
  timeHorizon: number;
  expectedReturn: number;
  requiredMonthlyContribution: number;
  totalContributions: number;
  expectedGrowth: number;
  finalAmount: number;
  probability: number;
  recommendations: string[];
}

export interface MultiObjectiveAllocation {
  totalMonthlyBudget: number;
  totalRequired: number;
  budgetSufficient: boolean;
  objectives: ObjectiveAllocationResult[];
  unallocatedBudget: number;
  recommendations: string[];
}

export interface ObjectiveAllocationResult {
  name: string;
  priority: number;
  requiredMonthly: number;
  allocatedMonthly: number;
  fundingPercentage: number;
  status: 'fully_funded' | 'partially_funded' | 'unfunded';
}

export interface GoalOptimization {
  objectiveName: string;
  targetAmount: number;
  currentAmount: number;
  timeHorizon: number;
  riskTolerance: 'low' | 'medium' | 'high';
  recommendedStrategy: InvestmentStrategy;
  alternativeStrategies: InvestmentStrategy[];
  recommendations: string[];
}

export interface InvestmentStrategy {
  name: string;
  riskLevel: 'conservative' | 'balanced' | 'dynamic' | 'aggressive';
  expectedReturn: number;
  volatility: number;
  allocation: {
    stocks: number;
    bonds: number;
    cash: number;
    alternatives?: number;
  };
  requiredMonthlyContribution: number;
  probabilityOfSuccess: number;
}

export interface EducationFundingPlan {
  childAge: number;
  educationStartAge: number;
  yearsUntilStart: number;
  annualCost: number;
  educationDuration: number;
  inflationRate: number;
  totalCostAtStart: number;
  totalCostInflationAdjusted: number;
  requiredMonthlyContribution: number;
  currentSavings: number;
  expectedReturn: number;
  recommendations: string[];
}

export interface HomePurchasePlan {
  targetPrice: number;
  downPaymentPercent: number;
  downPaymentAmount: number;
  closingCosts: number;
  totalNeeded: number;
  currentSavings: number;
  timeHorizon: number;
  priceAppreciation: number;
  adjustedTargetPrice: number;
  adjustedTotalNeeded: number;
  requiredMonthlyContribution: number;
  recommendations: string[];
}

// ============================================================================
// Investment Strategy Definitions
// ============================================================================

const INVESTMENT_STRATEGIES = {
  conservative: {
    name: 'Conservateur',
    riskLevel: 'conservative' as const,
    expectedReturn: 0.03,
    volatility: 0.05,
    allocation: { stocks: 20, bonds: 60, cash: 20 }
  },
  balanced: {
    name: 'Équilibré',
    riskLevel: 'balanced' as const,
    expectedReturn: 0.05,
    volatility: 0.10,
    allocation: { stocks: 50, bonds: 40, cash: 10 }
  },
  dynamic: {
    name: 'Dynamique',
    riskLevel: 'dynamic' as const,
    expectedReturn: 0.07,
    volatility: 0.15,
    allocation: { stocks: 70, bonds: 20, cash: 0, alternatives: 10 }
  },
  aggressive: {
    name: 'Agressif',
    riskLevel: 'aggressive' as const,
    expectedReturn: 0.09,
    volatility: 0.20,
    allocation: { stocks: 85, bonds: 10, cash: 0, alternatives: 5 }
  }
};

// ============================================================================
// Objective Calculator Class
// ============================================================================

export class ObjectiveCalculator {
  /**
   * Calculate required contribution for a single objective
   * @param objectiveName - Name of the objective
   * @param targetAmount - Target amount to reach
   * @param currentAmount - Current savings
   * @param timeHorizon - Time horizon in years
   * @param expectedReturn - Expected annual return (as decimal)
   */
  static calculateObjective(
    objectiveName: string,
    targetAmount: number,
    currentAmount: number,
    timeHorizon: number,
    expectedReturn: number = 0.05
  ): ObjectiveCalculation {
    if (targetAmount <= 0) throw new Error('Target amount must be positive');
    if (currentAmount < 0) throw new Error('Current amount cannot be negative');
    if (timeHorizon <= 0) throw new Error('Time horizon must be positive');
    if (expectedReturn < 0) throw new Error('Expected return cannot be negative');

    // Calculate future value of current amount
    const futureValueOfCurrent = currentAmount * Math.pow(1 + expectedReturn, timeHorizon);
    
    // Calculate remaining amount needed
    const remainingNeeded = Math.max(0, targetAmount - futureValueOfCurrent);
    
    // Calculate required monthly contribution using FV of annuity formula
    // FV = PMT * ((1 + r)^n - 1) / r
    // Solving for PMT: PMT = FV * r / ((1 + r)^n - 1)
    const monthlyRate = expectedReturn / 12;
    const numMonths = timeHorizon * 12;
    
    let requiredMonthlyContribution = 0;
    
    if (monthlyRate > 0 && remainingNeeded > 0) {
      requiredMonthlyContribution = remainingNeeded * monthlyRate / 
                                    (Math.pow(1 + monthlyRate, numMonths) - 1);
    } else if (remainingNeeded > 0) {
      requiredMonthlyContribution = remainingNeeded / numMonths;
    }
    
    const totalContributions = requiredMonthlyContribution * numMonths;
    const expectedGrowth = totalContributions > 0 ? 
                          (remainingNeeded - totalContributions) : 0;
    const finalAmount = futureValueOfCurrent + remainingNeeded;
    
    // Calculate probability of success (simplified)
    const probability = this.calculateSuccessProbability(
      timeHorizon,
      expectedReturn,
      requiredMonthlyContribution,
      targetAmount
    );
    
    const recommendations = this.generateObjectiveRecommendations(
      objectiveName,
      timeHorizon,
      requiredMonthlyContribution,
      probability
    );

    return {
      objectiveName,
      targetAmount,
      currentAmount,
      timeHorizon,
      expectedReturn,
      requiredMonthlyContribution,
      totalContributions,
      expectedGrowth,
      finalAmount,
      probability,
      recommendations
    };
  }

  /**
   * Calculate allocation for multiple objectives
   * @param objectives - Array of objectives with priorities
   * @param totalMonthlyBudget - Total monthly budget available
   * @param expectedReturn - Expected annual return (as decimal)
   */
  static calculateMultipleObjectives(
    objectives: ObjectiveInput[],
    totalMonthlyBudget: number,
    expectedReturn: number = 0.05
  ): MultiObjectiveAllocation {
    if (totalMonthlyBudget < 0) throw new Error('Budget cannot be negative');
    if (objectives.length === 0) throw new Error('At least one objective required');

    // Calculate required contribution for each objective
    const objectivesWithRequirements = objectives.map(obj => {
      const calc = this.calculateObjective(
        obj.name,
        obj.targetAmount,
        obj.currentAmount,
        obj.timeHorizon,
        expectedReturn
      );
      
      return {
        ...obj,
        requiredMonthly: calc.requiredMonthlyContribution
      };
    });

    // Sort by priority (1 = highest priority)
    const sortedObjectives = [...objectivesWithRequirements].sort((a: any, b: any) => 
      a.priority - b.priority
    );

    // Allocate budget based on priority
    let remainingBudget = totalMonthlyBudget;
    const allocations: ObjectiveAllocationResult[] = [];
    
    for (const obj of sortedObjectives) {
      const allocatedMonthly = Math.min(obj.requiredMonthly, remainingBudget);
      const fundingPercentage = obj.requiredMonthly > 0 ? 
                                (allocatedMonthly / obj.requiredMonthly) : 1;
      
      let status: 'fully_funded' | 'partially_funded' | 'unfunded';
      if (fundingPercentage >= 0.99) {
        status = 'fully_funded';
      } else if (fundingPercentage > 0) {
        status = 'partially_funded';
      } else {
        status = 'unfunded';
      }
      
      allocations.push({
        name: obj.name,
        priority: obj.priority,
        requiredMonthly: obj.requiredMonthly,
        allocatedMonthly,
        fundingPercentage,
        status
      });
      
      remainingBudget -= allocatedMonthly;
    }

    const totalRequired = objectivesWithRequirements.reduce(
      (sum: any, obj: any) => sum + obj.requiredMonthly, 0
    );
    const budgetSufficient = totalMonthlyBudget >= totalRequired;
    
    const recommendations = this.generateMultiObjectiveRecommendations(
      allocations,
      budgetSufficient,
      remainingBudget,
      totalRequired
    );

    return {
      totalMonthlyBudget,
      totalRequired,
      budgetSufficient,
      objectives: allocations,
      unallocatedBudget: Math.max(0, remainingBudget),
      recommendations
    };
  }

  /**
   * Optimize objective with investment strategy
   * @param objectiveName - Name of the objective
   * @param targetAmount - Target amount
   * @param currentAmount - Current savings
   * @param timeHorizon - Time horizon in years
   * @param riskTolerance - Risk tolerance level
   */
  static optimizeObjective(
    objectiveName: string,
    targetAmount: number,
    currentAmount: number,
    timeHorizon: number,
    riskTolerance: 'low' | 'medium' | 'high'
  ): GoalOptimization {
    // Map risk tolerance to strategy
    let recommendedStrategyKey: keyof typeof INVESTMENT_STRATEGIES;
    
    if (timeHorizon < 3) {
      // Short term: always conservative
      recommendedStrategyKey = 'conservative';
    } else if (timeHorizon < 7) {
      // Medium term
      recommendedStrategyKey = riskTolerance === 'low' ? 'conservative' : 'balanced';
    } else {
      // Long term
      if (riskTolerance === 'low') {
        recommendedStrategyKey = 'balanced';
      } else if (riskTolerance === 'medium') {
        recommendedStrategyKey = 'dynamic';
      } else {
        recommendedStrategyKey = 'aggressive';
      }
    }
    
    const recommendedStrategyDef = INVESTMENT_STRATEGIES[recommendedStrategyKey];
    
    // Calculate for recommended strategy
    const recommendedCalc = this.calculateObjective(
      objectiveName,
      targetAmount,
      currentAmount,
      timeHorizon,
      recommendedStrategyDef.expectedReturn
    );
    
    const recommendedStrategy: InvestmentStrategy = {
      ...recommendedStrategyDef,
      requiredMonthlyContribution: recommendedCalc.requiredMonthlyContribution,
      probabilityOfSuccess: recommendedCalc.probability
    };
    
    // Calculate alternative strategies
    const alternativeStrategies: InvestmentStrategy[] = [];
    
    for (const [key, strategyDef] of Object.entries(INVESTMENT_STRATEGIES)) {
      if (key !== recommendedStrategyKey) {
        const calc = this.calculateObjective(
          objectiveName,
          targetAmount,
          currentAmount,
          timeHorizon,
          strategyDef.expectedReturn
        );
        
        alternativeStrategies.push({
          ...strategyDef,
          requiredMonthlyContribution: calc.requiredMonthlyContribution,
          probabilityOfSuccess: calc.probability
        });
      }
    }
    
    const recommendations = this.generateOptimizationRecommendations(
      recommendedStrategy,
      timeHorizon,
      riskTolerance
    );

    return {
      objectiveName,
      targetAmount,
      currentAmount,
      timeHorizon,
      riskTolerance,
      recommendedStrategy,
      alternativeStrategies,
      recommendations
    };
  }

  /**
   * Calculate education funding plan
   * @param childAge - Current age of child
   * @param educationStartAge - Age when education starts
   * @param annualCost - Annual cost in today's euros
   * @param educationDuration - Duration in years
   * @param inflationRate - Annual inflation rate (as decimal)
   * @param currentSavings - Current savings for education
   */
  static calculateEducationFunding(
    childAge: number,
    educationStartAge: number,
    annualCost: number,
    educationDuration: number,
    inflationRate: number = 0.02,
    currentSavings: number = 0
  ): EducationFundingPlan {
    if (childAge < 0 || childAge > 25) throw new Error('Invalid child age');
    if (educationStartAge <= childAge) throw new Error('Education start age must be after current age');
    if (annualCost <= 0) throw new Error('Annual cost must be positive');
    if (educationDuration <= 0) throw new Error('Education duration must be positive');
    if (currentSavings < 0) throw new Error('Current savings cannot be negative');

    const yearsUntilStart = educationStartAge - childAge;
    
    // Calculate total cost at start (present value)
    const totalCostAtStart = annualCost * educationDuration;
    
    // Adjust for inflation until education starts
    const inflationMultiplier = Math.pow(1 + inflationRate, yearsUntilStart);
    const adjustedAnnualCost = annualCost * inflationMultiplier;
    
    // Calculate total cost with inflation during education period
    let totalCostInflationAdjusted = 0;
    for (let year = 0; year < educationDuration; year++) {
      const yearInflation = Math.pow(1 + inflationRate, yearsUntilStart + year);
      totalCostInflationAdjusted += annualCost * yearInflation;
    }
    
    // Use balanced strategy for education (5% return)
    const expectedReturn = 0.05;
    
    const calc = this.calculateObjective(
      'Financement études',
      totalCostInflationAdjusted,
      currentSavings,
      yearsUntilStart,
      expectedReturn
    );
    
    const recommendations = [
      `Commencer à épargner ${calc.requiredMonthlyContribution.toFixed(0)}€/mois dès maintenant`,
      `Utiliser un plan d'épargne éducation (PEE) ou assurance-vie`,
      `Prévoir une inflation de ${(inflationRate * 100).toFixed(1)}% par an`,
      `Réévaluer le plan tous les 2-3 ans`,
      `Considérer les bourses et aides financières disponibles`
    ];

    return {
      childAge,
      educationStartAge,
      yearsUntilStart,
      annualCost,
      educationDuration,
      inflationRate,
      totalCostAtStart,
      totalCostInflationAdjusted,
      requiredMonthlyContribution: calc.requiredMonthlyContribution,
      currentSavings,
      expectedReturn,
      recommendations
    };
  }

  /**
   * Calculate home purchase plan
   * @param targetPrice - Target home price
   * @param downPaymentPercent - Down payment as percentage (0-1)
   * @param currentSavings - Current savings
   * @param timeHorizon - Time horizon in years
   * @param priceAppreciation - Annual price appreciation (as decimal)
   * @param closingCostsPercent - Closing costs as percentage (0-1)
   */
  static calculateHomePurchase(
    targetPrice: number,
    downPaymentPercent: number,
    currentSavings: number,
    timeHorizon: number,
    priceAppreciation: number = 0.03,
    closingCostsPercent: number = 0.08
  ): HomePurchasePlan {
    if (targetPrice <= 0) throw new Error('Target price must be positive');
    if (downPaymentPercent < 0 || downPaymentPercent > 1) {
      throw new Error('Down payment percent must be between 0 and 1');
    }
    if (currentSavings < 0) throw new Error('Current savings cannot be negative');
    if (timeHorizon <= 0) throw new Error('Time horizon must be positive');
    if (closingCostsPercent < 0 || closingCostsPercent > 1) {
      throw new Error('Closing costs percent must be between 0 and 1');
    }

    // Calculate down payment and closing costs
    const downPaymentAmount = targetPrice * downPaymentPercent;
    const closingCosts = targetPrice * closingCostsPercent;
    const totalNeeded = downPaymentAmount + closingCosts;
    
    // Adjust for price appreciation
    const adjustedTargetPrice = targetPrice * Math.pow(1 + priceAppreciation, timeHorizon);
    const adjustedDownPayment = adjustedTargetPrice * downPaymentPercent;
    const adjustedClosingCosts = adjustedTargetPrice * closingCostsPercent;
    const adjustedTotalNeeded = adjustedDownPayment + adjustedClosingCosts;
    
    // Use conservative strategy for home purchase (3% return)
    const expectedReturn = 0.03;
    
    const calc = this.calculateObjective(
      'Achat immobilier',
      adjustedTotalNeeded,
      currentSavings,
      timeHorizon,
      expectedReturn
    );
    
    const recommendations = [
      `Épargner ${calc.requiredMonthlyContribution.toFixed(0)}€/mois pour l'apport`,
      `Prévoir ${(downPaymentPercent * 100).toFixed(0)}% d'apport (${adjustedDownPayment.toFixed(0)}€)`,
      `Budgéter ${adjustedClosingCosts.toFixed(0)}€ pour les frais de notaire et taxes`,
      `Utiliser un livret A ou LDDS pour l'épargne court terme`,
      `Vérifier l'éligibilité aux prêts aidés (PTZ, PAS)`
    ];

    return {
      targetPrice,
      downPaymentPercent,
      downPaymentAmount,
      closingCosts,
      totalNeeded,
      currentSavings,
      timeHorizon,
      priceAppreciation,
      adjustedTargetPrice,
      adjustedTotalNeeded,
      requiredMonthlyContribution: calc.requiredMonthlyContribution,
      recommendations
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private static calculateSuccessProbability(
    timeHorizon: number,
    expectedReturn: number,
    monthlyContribution: number,
    targetAmount: number
  ): number {
    // Simplified probability calculation
    // Longer time horizon and higher returns = higher probability
    let probability = 0.70; // Base probability
    
    if (timeHorizon >= 10) probability += 0.15;
    else if (timeHorizon >= 5) probability += 0.10;
    
    if (expectedReturn >= 0.07) probability += 0.10;
    else if (expectedReturn >= 0.05) probability += 0.05;
    
    return Math.min(0.95, probability);
  }

  private static generateObjectiveRecommendations(
    objectiveName: string,
    timeHorizon: number,
    monthlyContribution: number,
    probability: number
  ): string[] {
    const recommendations: string[] = [];
    
    recommendations.push(
      `Épargner ${monthlyContribution.toFixed(0)}€/mois pour atteindre l'objectif "${objectiveName}"`
    );
    
    if (timeHorizon < 3) {
      recommendations.push('Horizon court terme : privilégier les placements sécurisés (Livret A, LDDS)');
    } else if (timeHorizon < 7) {
      recommendations.push('Horizon moyen terme : envisager un mix fonds euros/unités de compte');
    } else {
      recommendations.push('Horizon long terme : privilégier les actions pour maximiser le rendement');
    }
    
    if (probability < 0.80) {
      recommendations.push('⚠️ Probabilité de succès modérée, augmenter les contributions si possible');
    }
    
    recommendations.push('Réévaluer l\'objectif annuellement et ajuster si nécessaire');
    
    return recommendations;
  }

  private static generateMultiObjectiveRecommendations(
    allocations: ObjectiveAllocationResult[],
    budgetSufficient: boolean,
    remainingBudget: number,
    totalRequired: number
  ): string[] {
    const recommendations: string[] = [];
    
    if (budgetSufficient) {
      recommendations.push('✅ Budget suffisant pour financer tous les objectifs');
      if (remainingBudget > 0) {
        recommendations.push(
          `Budget excédentaire de ${remainingBudget.toFixed(0)}€/mois disponible pour d'autres objectifs`
        );
      }
    } else {
      const shortfall = totalRequired - (totalRequired - remainingBudget);
      recommendations.push(
        `⚠️ Budget insuffisant : manque ${shortfall.toFixed(0)}€/mois pour financer tous les objectifs`
      );
      recommendations.push('Augmenter les revenus ou réduire les dépenses non essentielles');
    }
    
    const partiallyFunded = allocations.filter((a: any) => a.status === 'partially_funded');
    if (partiallyFunded.length > 0) {
      recommendations.push(
        `${partiallyFunded.length} objectif(s) partiellement financé(s) : considérer l'ajustement des priorités`
      );
    }
    
    const unfunded = allocations.filter((a: any) => a.status === 'unfunded');
    if (unfunded.length > 0) {
      recommendations.push(
        `${unfunded.length} objectif(s) non financé(s) : reporter ou réduire le montant cible`
      );
    }
    
    return recommendations;
  }

  private static generateOptimizationRecommendations(
    strategy: InvestmentStrategy,
    timeHorizon: number,
    riskTolerance: string
  ): string[] {
    const recommendations: string[] = [];
    
    recommendations.push(
      `Stratégie recommandée : ${strategy.name} (${(strategy.expectedReturn * 100).toFixed(1)}% de rendement attendu)`
    );
    
    recommendations.push(
      `Allocation suggérée : ${strategy.allocation.stocks}% actions, ${strategy.allocation.bonds}% obligations, ${strategy.allocation.cash}% liquidités`
    );
    
    if (timeHorizon < 5 && strategy.riskLevel !== 'conservative') {
      recommendations.push('⚠️ Horizon court : considérer une stratégie plus conservatrice');
    }
    
    recommendations.push('Diversifier les investissements pour réduire le risque');
    recommendations.push('Rééquilibrer le portefeuille annuellement');
    
    if (strategy.volatility > 0.15) {
      recommendations.push('Volatilité élevée : être préparé aux fluctuations de marché');
    }
    
    return recommendations;
  }
}

export default ObjectiveCalculator;
