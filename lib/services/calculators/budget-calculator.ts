/**
 * Budget Calculator Service
 * Comprehensive budget analysis and debt capacity calculation service
 * 
 * Supports:
 * - Complete budget analysis with health classification
 * - Debt capacity calculation
 * - Emergency fund recommendations
 * - Budget allocation optimization (50/30/20 rule)
 * - Project financing analysis
 * - Retirement budget planning
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface IncomeBreakdown {
  salary: number;
  bonuses: number;
  rentalIncome: number;
  investmentIncome: number;
  otherIncome: number;
}

export interface ExpenseBreakdown {
  housing: number;
  utilities: number;
  food: number;
  transportation: number;
  insurance: number;
  healthcare: number;
  education: number;
  entertainment: number;
  savings: number;
  otherExpenses: number;
}

export interface DebtBreakdown {
  mortgage: number;
  consumerLoans: number;
  creditCards: number;
  studentLoans: number;
  otherDebts: number;
}

export interface BudgetAnalysis {
  income: {
    total: number;
    breakdown: IncomeBreakdown;
  };
  expenses: {
    total: number;
    breakdown: ExpenseBreakdown;
  };
  debts: {
    total: number;
    breakdown: DebtBreakdown;
  };
  metrics: {
    disposableIncome: number;
    savingsRate: number;
    debtRatio: number;
    remainingCapacity: number;
  };
  budgetHealth: 'excellent' | 'good' | 'warning' | 'critical';
  recommendations: string[];
  alerts: string[];
}

export interface DebtCapacity {
  monthlyIncome: number;
  currentDebts: number;
  maxDebtRatio: number;
  maxMonthlyPayment: number;
  remainingCapacity: number;
  loanDetails: {
    interestRate: number;
    loanTerm: number;
    maxLoanAmount: number;
    monthlyPayment: number;
    totalInterest: number;
    totalCost: number;
  };
  affordability: 'excellent' | 'good' | 'limited' | 'insufficient';
  recommendations: string[];
}

export interface EmergencyFundRecommendation {
  monthlyExpenses: number;
  riskProfile: 'low' | 'medium' | 'high';
  recommendedMonths: number;
  recommendedAmount: number;
  currentAmount?: number;
  shortfall?: number;
  monthlySavingsNeeded?: number;
  timeToReach?: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface BudgetAllocationRecommendation {
  monthlyIncome: number;
  currentAge: number;
  allocation: {
    needs: { amount: number; percentage: number };
    wants: { amount: number; percentage: number };
    savings: { amount: number; percentage: number };
  };
  breakdown: {
    housing: number;
    transportation: number;
    food: number;
    utilities: number;
    insurance: number;
    entertainment: number;
    personalCare: number;
    retirement: number;
    emergencyFund: number;
    investments: number;
  };
  recommendations: string[];
}

export interface ProjectFinancing {
  projectCost: number;
  downPayment: number;
  loanAmount: number;
  interestRate: number;
  loanTerm: number;
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  debtRatio: number;
  affordability: 'excellent' | 'good' | 'tight' | 'unaffordable';
  recommendations: string[];
}

export interface RetirementBudget {
  currentAge: number;
  retirementAge: number;
  currentExpenses: number;
  estimatedRetirementExpenses: number;
  replacementRatio: number;
  inflationAdjustment: number;
  recommendations: string[];
}

// ============================================================================
// Budget Calculator Class
// ============================================================================

export class BudgetCalculator {
  // Maximum debt ratio (French banking standard)
  private static readonly MAX_DEBT_RATIO = 0.33; // 33%
  
  // Budget health thresholds
  private static readonly HEALTH_THRESHOLDS = {
    excellent: { savingsRate: 0.20, debtRatio: 0.25 },
    good: { savingsRate: 0.10, debtRatio: 0.33 },
    warning: { savingsRate: 0.05, debtRatio: 0.40 }
  };

  /**
   * Analyze complete budget situation
   * @param data - Income, expenses, and debt breakdown
   */
  static analyzeBudget(data: {
    income: IncomeBreakdown;
    expenses: ExpenseBreakdown;
    debts: DebtBreakdown;
  }): BudgetAnalysis {
    // Calculate totals
    const totalIncome = this.calculateTotalIncome(data.income);
    const totalExpenses = this.calculateTotalExpenses(data.expenses);
    const totalDebts = this.calculateTotalDebts(data.debts);

    // Calculate metrics
    const disposableIncome = totalIncome - totalExpenses - totalDebts;
    const savingsRate = totalIncome > 0 ? data.expenses.savings / totalIncome : 0;
    const debtRatio = totalIncome > 0 ? totalDebts / totalIncome : 0;
    const remainingCapacity = Math.max(0, (totalIncome * this.MAX_DEBT_RATIO) - totalDebts);

    // Determine budget health
    const budgetHealth = this.classifyBudgetHealth(savingsRate, debtRatio, disposableIncome);

    // Generate recommendations
    const recommendations = this.generateBudgetRecommendations(
      budgetHealth,
      savingsRate,
      debtRatio,
      disposableIncome,
      totalIncome,
      data.expenses
    );

    // Generate alerts
    const alerts = this.generateBudgetAlerts(
      debtRatio,
      disposableIncome,
      savingsRate,
      data.expenses
    );

    return {
      income: {
        total: totalIncome,
        breakdown: data.income
      },
      expenses: {
        total: totalExpenses,
        breakdown: data.expenses
      },
      debts: {
        total: totalDebts,
        breakdown: data.debts
      },
      metrics: {
        disposableIncome,
        savingsRate,
        debtRatio,
        remainingCapacity
      },
      budgetHealth,
      recommendations,
      alerts
    };
  }

  /**
   * Calculate debt capacity
   * @param monthlyIncome - Monthly gross income
   * @param currentDebts - Current monthly debt payments
   * @param interestRate - Annual interest rate (as decimal)
   * @param loanTerm - Loan term in years
   */
  static calculateDebtCapacity(
    monthlyIncome: number,
    currentDebts: number,
    interestRate: number,
    loanTerm: number
  ): DebtCapacity {
    if (monthlyIncome <= 0) throw new Error('Monthly income must be positive');
    if (currentDebts < 0) throw new Error('Current debts cannot be negative');
    if (interestRate < 0) throw new Error('Interest rate cannot be negative');
    if (loanTerm <= 0) throw new Error('Loan term must be positive');

    const maxDebtRatio = this.MAX_DEBT_RATIO;
    const maxMonthlyPayment = monthlyIncome * maxDebtRatio;
    const remainingCapacity = Math.max(0, maxMonthlyPayment - currentDebts);

    // Calculate maximum loan amount using remaining capacity
    const monthlyRate = interestRate / 12;
    const numPayments = loanTerm * 12;
    
    let maxLoanAmount = 0;
    let totalInterest = 0;
    
    if (monthlyRate > 0) {
      // PMT formula: P = (r * PV) / (1 - (1 + r)^-n)
      // Solving for PV: PV = PMT * (1 - (1 + r)^-n) / r
      maxLoanAmount = remainingCapacity * (1 - Math.pow(1 + monthlyRate, -numPayments)) / monthlyRate;
      totalInterest = (remainingCapacity * numPayments) - maxLoanAmount;
    } else {
      // No interest case
      maxLoanAmount = remainingCapacity * numPayments;
      totalInterest = 0;
    }

    const totalCost = maxLoanAmount + totalInterest;

    // Determine affordability
    const debtRatio = currentDebts / monthlyIncome;
    let affordability: 'excellent' | 'good' | 'limited' | 'insufficient';
    
    if (debtRatio < 0.15) {
      affordability = 'excellent';
    } else if (debtRatio < 0.25) {
      affordability = 'good';
    } else if (debtRatio < 0.33) {
      affordability = 'limited';
    } else {
      affordability = 'insufficient';
    }

    // Generate recommendations
    const recommendations = this.generateDebtCapacityRecommendations(
      affordability,
      debtRatio,
      remainingCapacity,
      monthlyIncome
    );

    return {
      monthlyIncome,
      currentDebts,
      maxDebtRatio,
      maxMonthlyPayment,
      remainingCapacity,
      loanDetails: {
        interestRate,
        loanTerm,
        maxLoanAmount,
        monthlyPayment: remainingCapacity,
        totalInterest,
        totalCost
      },
      affordability,
      recommendations
    };
  }

  /**
   * Calculate emergency fund recommendation
   * @param monthlyExpenses - Average monthly expenses
   * @param riskProfile - Employment/income risk profile
   */
  static calculateEmergencyFund(
    monthlyExpenses: number,
    riskProfile: 'low' | 'medium' | 'high' = 'medium'
  ): EmergencyFundRecommendation {
    if (monthlyExpenses < 0) throw new Error('Monthly expenses cannot be negative');

    // Determine recommended months based on risk profile
    let recommendedMonths: number;
    let priority: 'critical' | 'high' | 'medium' | 'low';

    switch (riskProfile) {
      case 'low':
        recommendedMonths = 3;
        priority = 'medium';
        break;
      case 'medium':
        recommendedMonths = 6;
        priority = 'high';
        break;
      case 'high':
        recommendedMonths = 12;
        priority = 'critical';
        break;
    }

    const recommendedAmount = monthlyExpenses * recommendedMonths;

    return {
      monthlyExpenses,
      riskProfile,
      recommendedMonths,
      recommendedAmount,
      priority
    };
  }

  /**
   * Calculate project financing analysis
   * @param projectCost - Total project cost
   * @param downPaymentPercent - Down payment as percentage (0-1)
   * @param interestRate - Annual interest rate (as decimal)
   * @param loanTerm - Loan term in years
   * @param monthlyIncome - Monthly gross income
   */
  static calculateProjectFinancing(
    projectCost: number,
    downPaymentPercent: number,
    interestRate: number,
    loanTerm: number,
    monthlyIncome: number
  ): ProjectFinancing {
    if (projectCost <= 0) throw new Error('Project cost must be positive');
    if (downPaymentPercent < 0 || downPaymentPercent > 1) {
      throw new Error('Down payment percent must be between 0 and 1');
    }
    if (interestRate < 0) throw new Error('Interest rate cannot be negative');
    if (loanTerm <= 0) throw new Error('Loan term must be positive');
    if (monthlyIncome <= 0) throw new Error('Monthly income must be positive');

    const downPayment = projectCost * downPaymentPercent;
    const loanAmount = projectCost - downPayment;

    // Calculate monthly payment
    const monthlyRate = interestRate / 12;
    const numPayments = loanTerm * 12;
    
    let monthlyPayment = 0;
    let totalInterest = 0;
    
    if (monthlyRate > 0 && loanAmount > 0) {
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                       (Math.pow(1 + monthlyRate, numPayments) - 1);
      totalInterest = (monthlyPayment * numPayments) - loanAmount;
    } else if (loanAmount > 0) {
      monthlyPayment = loanAmount / numPayments;
      totalInterest = 0;
    }

    const totalCost = projectCost + totalInterest;
    const debtRatio = monthlyPayment / monthlyIncome;

    // Determine affordability
    let affordability: 'excellent' | 'good' | 'tight' | 'unaffordable';
    
    if (debtRatio < 0.20) {
      affordability = 'excellent';
    } else if (debtRatio < 0.28) {
      affordability = 'good';
    } else if (debtRatio < 0.33) {
      affordability = 'tight';
    } else {
      affordability = 'unaffordable';
    }

    // Generate recommendations
    const recommendations = this.generateProjectFinancingRecommendations(
      affordability,
      debtRatio,
      downPaymentPercent,
      interestRate
    );

    return {
      projectCost,
      downPayment,
      loanAmount,
      interestRate,
      loanTerm,
      monthlyPayment,
      totalInterest,
      totalCost,
      debtRatio,
      affordability,
      recommendations
    };
  }

  /**
   * Calculate retirement budget needs
   * @param data - Retirement budget input data
   */
  static calculateRetirementBudget(data: {
    currentAge: number;
    retirementAge: number;
    currentExpenses: number;
    replacementRatio?: number;
    inflationRate?: number;
  }): RetirementBudget {
    const {
      currentAge,
      retirementAge,
      currentExpenses,
      replacementRatio = 0.70, // 70% of current expenses
      inflationRate = 0.02 // 2% annual inflation
    } = data;

    if (currentAge < 0 || currentAge > 120) throw new Error('Invalid current age');
    if (retirementAge < currentAge) throw new Error('Retirement age must be after current age');
    if (currentExpenses < 0) throw new Error('Current expenses cannot be negative');

    const yearsToRetirement = retirementAge - currentAge;
    
    // Adjust for inflation
    const inflationAdjustment = Math.pow(1 + inflationRate, yearsToRetirement);
    const adjustedExpenses = currentExpenses * inflationAdjustment;
    
    // Apply replacement ratio
    const estimatedRetirementExpenses = adjustedExpenses * replacementRatio;

    const recommendations = [
      `Prévoir un budget mensuel de ${estimatedRetirementExpenses.toFixed(0)}€ à la retraite`,
      `Tenir compte d'une inflation de ${(inflationRate * 100).toFixed(1)}% par an`,
      `Réduire les dépenses non essentielles avant la retraite`,
      `Anticiper la baisse de certaines dépenses (transport, vêtements professionnels)`,
      `Prévoir une augmentation des dépenses de santé et loisirs`
    ];

    return {
      currentAge,
      retirementAge,
      currentExpenses,
      estimatedRetirementExpenses,
      replacementRatio,
      inflationAdjustment,
      recommendations
    };
  }

  /**
   * Optimize budget allocation using 50/30/20 rule
   * @param monthlyIncome - Monthly net income
   * @param currentAge - Current age for age-appropriate recommendations
   */
  static optimizeBudgetAllocation(
    monthlyIncome: number,
    currentAge: number
  ): BudgetAllocationRecommendation {
    if (monthlyIncome <= 0) throw new Error('Monthly income must be positive');
    if (currentAge < 18 || currentAge > 120) throw new Error('Invalid age');

    // Adjust savings rate based on age
    let savingsPercentage = 0.20; // Base 20%
    
    if (currentAge < 30) {
      savingsPercentage = 0.25; // 25% for young adults
    } else if (currentAge > 50) {
      savingsPercentage = 0.30; // 30% for pre-retirees
    }

    const needsPercentage = 0.50;
    const wantsPercentage = 1 - needsPercentage - savingsPercentage;

    const allocation = {
      needs: {
        amount: monthlyIncome * needsPercentage,
        percentage: needsPercentage
      },
      wants: {
        amount: monthlyIncome * wantsPercentage,
        percentage: wantsPercentage
      },
      savings: {
        amount: monthlyIncome * savingsPercentage,
        percentage: savingsPercentage
      }
    };

    // Detailed breakdown
    const breakdown = {
      housing: monthlyIncome * 0.30,
      transportation: monthlyIncome * 0.10,
      food: monthlyIncome * 0.10,
      utilities: monthlyIncome * 0.05,
      insurance: monthlyIncome * 0.05,
      entertainment: monthlyIncome * wantsPercentage * 0.50,
      personalCare: monthlyIncome * wantsPercentage * 0.50,
      retirement: monthlyIncome * savingsPercentage * 0.60,
      emergencyFund: monthlyIncome * savingsPercentage * 0.20,
      investments: monthlyIncome * savingsPercentage * 0.20
    };

    const recommendations = [
      `Allouer ${(needsPercentage * 100).toFixed(0)}% aux besoins essentiels (${allocation.needs.amount.toFixed(0)}€)`,
      `Limiter les dépenses de loisirs à ${(wantsPercentage * 100).toFixed(0)}% (${allocation.wants.amount.toFixed(0)}€)`,
      `Épargner ${(savingsPercentage * 100).toFixed(0)}% du revenu (${allocation.savings.amount.toFixed(0)}€)`,
      `Maintenir le logement sous 30% du revenu (${breakdown.housing.toFixed(0)}€)`,
      `Prioriser l'épargne retraite (${breakdown.retirement.toFixed(0)}€/mois)`
    ];

    return {
      monthlyIncome,
      currentAge,
      allocation,
      breakdown,
      recommendations
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private static calculateTotalIncome(income: IncomeBreakdown): number {
    return income.salary + income.bonuses + income.rentalIncome + 
           income.investmentIncome + income.otherIncome;
  }

  private static calculateTotalExpenses(expenses: ExpenseBreakdown): number {
    return expenses.housing + expenses.utilities + expenses.food + 
           expenses.transportation + expenses.insurance + expenses.healthcare +
           expenses.education + expenses.entertainment + expenses.savings + 
           expenses.otherExpenses;
  }

  private static calculateTotalDebts(debts: DebtBreakdown): number {
    return debts.mortgage + debts.consumerLoans + debts.creditCards + 
           debts.studentLoans + debts.otherDebts;
  }

  private static classifyBudgetHealth(
    savingsRate: number,
    debtRatio: number,
    disposableIncome: number
  ): 'excellent' | 'good' | 'warning' | 'critical' {
    if (disposableIncome < 0 || debtRatio > 0.40) {
      return 'critical';
    }
    
    if (savingsRate >= this.HEALTH_THRESHOLDS.excellent.savingsRate && 
        debtRatio <= this.HEALTH_THRESHOLDS.excellent.debtRatio) {
      return 'excellent';
    }
    
    if (savingsRate >= this.HEALTH_THRESHOLDS.good.savingsRate && 
        debtRatio <= this.HEALTH_THRESHOLDS.good.debtRatio) {
      return 'good';
    }
    
    if (savingsRate >= this.HEALTH_THRESHOLDS.warning.savingsRate && 
        debtRatio <= this.HEALTH_THRESHOLDS.warning.debtRatio) {
      return 'warning';
    }
    
    return 'critical';
  }

  private static generateBudgetRecommendations(
    health: string,
    savingsRate: number,
    debtRatio: number,
    disposableIncome: number,
    totalIncome: number,
    expenses: ExpenseBreakdown
  ): string[] {
    const recommendations: string[] = [];

    if (health === 'critical') {
      recommendations.push('🚨 Situation critique : réduire immédiatement les dépenses non essentielles');
      recommendations.push('Contacter un conseiller financier pour restructurer les dettes');
    }

    if (savingsRate < 0.10) {
      recommendations.push(`Augmenter le taux d'épargne à au moins 10% (actuellement ${(savingsRate * 100).toFixed(1)}%)`);
    }

    if (debtRatio > 0.33) {
      recommendations.push(`Réduire le taux d'endettement en dessous de 33% (actuellement ${(debtRatio * 100).toFixed(1)}%)`);
    }

    if (expenses.housing / totalIncome > 0.35) {
      recommendations.push('Le logement représente plus de 35% du revenu, envisager une réduction');
    }

    if (expenses.entertainment / totalIncome > 0.15) {
      recommendations.push('Les dépenses de loisirs sont élevées, possibilité d\'optimisation');
    }

    if (health === 'excellent') {
      recommendations.push('✅ Excellente santé financière, continuer sur cette voie');
      recommendations.push('Envisager d\'augmenter les investissements à long terme');
    }

    return recommendations;
  }

  private static generateBudgetAlerts(
    debtRatio: number,
    disposableIncome: number,
    savingsRate: number,
    expenses: ExpenseBreakdown
  ): string[] {
    const alerts: string[] = [];

    if (disposableIncome < 0) {
      alerts.push('⚠️ Revenu disponible négatif : dépenses supérieures aux revenus');
    }

    if (debtRatio > 0.40) {
      alerts.push('⚠️ Taux d\'endettement critique (>40%)');
    }

    if (savingsRate < 0.05) {
      alerts.push('⚠️ Taux d\'épargne très faible (<5%)');
    }

    if (expenses.savings === 0) {
      alerts.push('⚠️ Aucune épargne mensuelle détectée');
    }

    return alerts;
  }

  private static generateDebtCapacityRecommendations(
    affordability: string,
    debtRatio: number,
    remainingCapacity: number,
    monthlyIncome: number
  ): string[] {
    const recommendations: string[] = [];

    if (affordability === 'insufficient') {
      recommendations.push('Capacité d\'endettement insuffisante');
      recommendations.push('Réduire les dettes existantes avant de contracter un nouveau prêt');
      recommendations.push('Augmenter les revenus ou réduire les charges fixes');
    } else if (affordability === 'limited') {
      recommendations.push('Capacité d\'endettement limitée');
      recommendations.push('Privilégier un apport personnel important');
      recommendations.push('Négocier le meilleur taux d\'intérêt possible');
    } else if (affordability === 'good') {
      recommendations.push('Bonne capacité d\'endettement');
      recommendations.push(`Capacité mensuelle disponible : ${remainingCapacity.toFixed(0)}€`);
    } else {
      recommendations.push('Excellente capacité d\'endettement');
      recommendations.push(`Large marge de manœuvre : ${remainingCapacity.toFixed(0)}€/mois`);
    }

    return recommendations;
  }

  private static generateProjectFinancingRecommendations(
    affordability: string,
    debtRatio: number,
    downPaymentPercent: number,
    interestRate: number
  ): string[] {
    const recommendations: string[] = [];

    if (affordability === 'unaffordable') {
      recommendations.push('⚠️ Projet non finançable avec les conditions actuelles');
      recommendations.push('Augmenter l\'apport personnel à au moins 20%');
      recommendations.push('Réduire le montant du projet ou augmenter les revenus');
    } else if (affordability === 'tight') {
      recommendations.push('Financement serré, peu de marge de manœuvre');
      recommendations.push('Constituer une épargne de précaution avant de s\'engager');
    } else if (affordability === 'good') {
      recommendations.push('Financement équilibré');
      if (downPaymentPercent < 0.20) {
        recommendations.push('Envisager d\'augmenter l\'apport à 20% pour de meilleures conditions');
      }
    } else {
      recommendations.push('Excellentes conditions de financement');
      recommendations.push('Possibilité de négocier des conditions avantageuses');
    }

    if (interestRate > 0.04) {
      recommendations.push('Comparer les offres de plusieurs établissements bancaires');
    }

    return recommendations;
  }
}

export default BudgetCalculator;
