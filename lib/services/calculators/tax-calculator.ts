/**
 * Tax Calculator Service
 * Comprehensive tax calculation service with French tax law compliance (2024)
 * 
 * Supports:
 * - Income tax (Impôt sur le revenu)
 * - Wealth tax (IFI - Impôt sur la Fortune Immobilière)
 * - Capital gains tax
 * - Donation tax (Droits de donation)
 * - Inheritance tax (Droits de succession)
 * - Tax optimization strategies
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface TaxBracket {
  min: number;
  max: number | null;
  rate: number;
}

export interface TaxBracketBreakdown {
  bracket: number;
  min: number;
  max: number | null;
  rate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface TaxCalculationResult {
  grossIncome: number;
  deductions: number;
  taxableIncome: number;
  incomeTax: number;
  socialContributions: number;
  totalTax: number;
  netIncome: number;
  effectiveRate: number;
  marginalRate: number;
  breakdown: TaxBracketBreakdown[];
}

export interface CapitalGainsTaxResult {
  grossGain: number;
  holdingPeriod: number;
  assetType: 'stocks' | 'real_estate' | 'other';
  abatement: number;
  taxableGain: number;
  capitalGainsTax: number;
  socialContributions: number;
  totalTax: number;
  netGain: number;
  effectiveRate: number;
}

export interface WealthTaxResult {
  totalWealth: number;
  taxableWealth: number;
  wealthTax: number;
  effectiveRate: number;
  breakdown: TaxBracketBreakdown[];
}

export interface DonationTaxResult {
  donationAmount: number;
  relationship: string;
  allowance: number;
  previousDonations: number;
  remainingAllowance: number;
  taxableAmount: number;
  donationTax: number;
  effectiveRate: number;
  breakdown: TaxBracketBreakdown[];
}

export interface InheritanceTaxResult {
  inheritanceAmount: number;
  relationship: string;
  allowance: number;
  taxableAmount: number;
  inheritanceTax: number;
  netInheritance: number;
  effectiveRate: number;
  breakdown: TaxBracketBreakdown[];
}

export interface TaxOptimizationResult {
  currentTax: number;
  optimizedTax: number;
  savings: number;
  savingsPercentage: number;
  strategies: TaxStrategy[];
  recommendations: string[];
}

export interface TaxStrategy {
  name: string;
  description: string;
  potentialSavings: number;
  implementation: string;
  priority: 'high' | 'medium' | 'low';
}

// ============================================================================
// Tax Brackets (2024)
// ============================================================================

const INCOME_TAX_BRACKETS_2024: TaxBracket[] = [
  { min: 0, max: 10777, rate: 0 },
  { min: 10777, max: 27478, rate: 0.11 },
  { min: 27478, max: 78570, rate: 0.30 },
  { min: 78570, max: 168994, rate: 0.41 },
  { min: 168994, max: null, rate: 0.45 }
];

const WEALTH_TAX_BRACKETS_2024: TaxBracket[] = [
  { min: 0, max: 800000, rate: 0 },
  { min: 800000, max: 1300000, rate: 0.005 },
  { min: 1300000, max: 2570000, rate: 0.007 },
  { min: 2570000, max: 5000000, rate: 0.01 },
  { min: 5000000, max: 10000000, rate: 0.0125 },
  { min: 10000000, max: null, rate: 0.015 }
];

// Donation tax brackets by relationship
const DONATION_TAX_BRACKETS: Record<string, TaxBracket[]> = {
  child: [
    { min: 0, max: 8072, rate: 0.05 },
    { min: 8072, max: 12109, rate: 0.10 },
    { min: 12109, max: 15932, rate: 0.15 },
    { min: 15932, max: 552324, rate: 0.20 },
    { min: 552324, max: 902838, rate: 0.30 },
    { min: 902838, max: 1805677, rate: 0.40 },
    { min: 1805677, max: null, rate: 0.45 }
  ],
  grandchild: [
    { min: 0, max: 8072, rate: 0.05 },
    { min: 8072, max: 12109, rate: 0.10 },
    { min: 12109, max: 15932, rate: 0.15 },
    { min: 15932, max: 552324, rate: 0.20 },
    { min: 552324, max: 902838, rate: 0.30 },
    { min: 902838, max: 1805677, rate: 0.40 },
    { min: 1805677, max: null, rate: 0.45 }
  ],
  sibling: [
    { min: 0, max: 24430, rate: 0.35 },
    { min: 24430, max: null, rate: 0.45 }
  ],
  other: [
    { min: 0, max: null, rate: 0.60 }
  ]
};

// Inheritance tax brackets (same as donation for most relationships)
const INHERITANCE_TAX_BRACKETS = DONATION_TAX_BRACKETS;

// Allowances (2024)
const DONATION_ALLOWANCES: Record<string, number> = {
  child: 100000,
  grandchild: 31865,
  great_grandchild: 5310,
  sibling: 15932,
  nephew_niece: 7967,
  disabled: 159325,
  other: 0
};

const INHERITANCE_ALLOWANCES: Record<string, number> = {
  spouse: Infinity, // Full exemption
  child: 100000,
  grandchild: 1594,
  great_grandchild: 1594,
  sibling: 15932,
  nephew_niece: 7967,
  disabled: 159325,
  other: 1594
};

// Social contributions rate
const SOCIAL_CONTRIBUTIONS_RATE = 0.172; // 17.2%

// Capital gains flat tax rate
const FLAT_TAX_RATE = 0.30; // 30% (12.8% income tax + 17.2% social contributions)

// ============================================================================
// Tax Calculator Class
// ============================================================================

export class TaxCalculator {
  /**
   * Calculate income tax using French progressive brackets
   * @param grossIncome - Total gross income
   * @param deductions - Total deductions
   * @param familyQuotient - Number of parts (quotient familial)
   * @param year - Tax year (default 2024)
   */
  static calculateIncomeTax(
    grossIncome: number,
    deductions: number = 0,
    familyQuotient: number = 1,
    year: number = 2024
  ): TaxCalculationResult {
    // Validate inputs
    if (grossIncome < 0) throw new Error('Gross income cannot be negative');
    if (deductions < 0) throw new Error('Deductions cannot be negative');
    if (familyQuotient < 1) throw new Error('Family quotient must be at least 1');

    // Calculate taxable income
    const taxableIncome = Math.max(0, grossIncome - deductions);
    
    // Apply family quotient
    const quotientedIncome = taxableIncome / familyQuotient;
    
    // Calculate tax on quotient
    const { tax: quotientTax, breakdown: quotientBreakdown, marginalRate } = 
      this.calculateProgressiveTax(quotientedIncome, INCOME_TAX_BRACKETS_2024);
    
    // Multiply by family quotient to get total tax
    const incomeTax = quotientTax * familyQuotient;
    
    // Scale breakdown back to actual income
    const breakdown = quotientBreakdown.map(b => ({
      ...b,
      taxableAmount: b.taxableAmount * familyQuotient,
      taxAmount: b.taxAmount * familyQuotient
    }));
    
    // Calculate social contributions (CSG/CRDS) - simplified
    const socialContributions = taxableIncome * SOCIAL_CONTRIBUTIONS_RATE;
    
    const totalTax = incomeTax + socialContributions;
    const netIncome = grossIncome - totalTax;
    const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) : 0;

    return {
      grossIncome,
      deductions,
      taxableIncome,
      incomeTax,
      socialContributions,
      totalTax,
      netIncome,
      effectiveRate,
      marginalRate,
      breakdown
    };
  }

  /**
   * Calculate capital gains tax with holding period abatements
   * @param grossGain - Gross capital gain
   * @param holdingPeriod - Holding period in years
   * @param assetType - Type of asset
   */
  static calculateCapitalGainsTax(
    grossGain: number,
    holdingPeriod: number,
    assetType: 'stocks' | 'real_estate' | 'other' = 'stocks'
  ): CapitalGainsTaxResult {
    if (grossGain < 0) throw new Error('Gross gain cannot be negative');
    if (holdingPeriod < 0) throw new Error('Holding period cannot be negative');

    let abatement = 0;

    // Calculate abatement based on asset type and holding period
    if (assetType === 'stocks') {
      // Abatement for stocks (PEA or direct ownership)
      if (holdingPeriod >= 8) {
        abatement = 0.65; // 65% abatement after 8 years
      } else if (holdingPeriod >= 5) {
        abatement = 0.50; // 50% abatement after 5 years
      } else if (holdingPeriod >= 2) {
        abatement = 0.50; // 50% abatement after 2 years
      }
    } else if (assetType === 'real_estate') {
      // Abatement for real estate
      if (holdingPeriod >= 30) {
        abatement = 1.0; // Full exemption after 30 years
      } else if (holdingPeriod >= 22) {
        abatement = 0.06 * (holdingPeriod - 21); // 6% per year from 22 to 30
      } else if (holdingPeriod >= 6) {
        abatement = 0.06 * (holdingPeriod - 5); // 6% per year from 6 to 21
      }
    }

    const abatementAmount = grossGain * abatement;
    const taxableGain = grossGain - abatementAmount;

    // Apply flat tax (30%)
    const capitalGainsTax = taxableGain * (FLAT_TAX_RATE - SOCIAL_CONTRIBUTIONS_RATE);
    const socialContributions = taxableGain * SOCIAL_CONTRIBUTIONS_RATE;
    const totalTax = capitalGainsTax + socialContributions;
    const netGain = grossGain - totalTax;
    const effectiveRate = grossGain > 0 ? (totalTax / grossGain) : 0;

    return {
      grossGain,
      holdingPeriod,
      assetType,
      abatement: abatementAmount,
      taxableGain,
      capitalGainsTax,
      socialContributions,
      totalTax,
      netGain,
      effectiveRate
    };
  }

  /**
   * Calculate wealth tax (IFI - Impôt sur la Fortune Immobilière)
   * @param totalWealth - Total real estate wealth
   * @param year - Tax year (default 2024)
   */
  static calculateWealthTax(
    totalWealth: number,
    year: number = 2024
  ): WealthTaxResult {
    if (totalWealth < 0) throw new Error('Total wealth cannot be negative');

    // Wealth tax only applies above 1.3M with 30% reduction between 800K and 1.3M
    let taxableWealth = totalWealth;
    
    if (totalWealth > 800000 && totalWealth <= 1300000) {
      // Apply 30% reduction on the portion between 800K and 1.3M
      const reduction = (totalWealth - 800000) * 0.30;
      taxableWealth = totalWealth - reduction;
    }

    const { tax: wealthTax, breakdown } = 
      this.calculateProgressiveTax(taxableWealth, WEALTH_TAX_BRACKETS_2024);

    const effectiveRate = totalWealth > 0 ? (wealthTax / totalWealth) : 0;

    return {
      totalWealth,
      taxableWealth,
      wealthTax,
      effectiveRate,
      breakdown
    };
  }

  /**
   * Calculate donation tax with relationship-based allowances
   * @param donationAmount - Amount of donation
   * @param relationship - Relationship to donor
   * @param previousDonations - Previous donations in last 15 years
   */
  static calculateDonationTax(
    donationAmount: number,
    relationship: 'child' | 'grandchild' | 'sibling' | 'other',
    previousDonations: number = 0
  ): DonationTaxResult {
    if (donationAmount < 0) throw new Error('Donation amount cannot be negative');
    if (previousDonations < 0) throw new Error('Previous donations cannot be negative');

    const allowance = DONATION_ALLOWANCES[relationship] || 0;
    const usedAllowance = Math.min(previousDonations, allowance);
    const remainingAllowance = Math.max(0, allowance - usedAllowance);
    
    const taxableAmount = Math.max(0, donationAmount - remainingAllowance);
    
    const brackets = DONATION_TAX_BRACKETS[relationship] || DONATION_TAX_BRACKETS.other;
    const { tax: donationTax, breakdown } = 
      this.calculateProgressiveTax(taxableAmount, brackets);

    const effectiveRate = donationAmount > 0 ? (donationTax / donationAmount) : 0;

    return {
      donationAmount,
      relationship,
      allowance,
      previousDonations,
      remainingAllowance,
      taxableAmount,
      donationTax,
      effectiveRate,
      breakdown
    };
  }

  /**
   * Calculate inheritance tax
   * @param inheritanceAmount - Amount of inheritance
   * @param relationship - Relationship to deceased
   */
  static calculateInheritanceTax(
    inheritanceAmount: number,
    relationship: 'spouse' | 'child' | 'grandchild' | 'sibling' | 'other'
  ): InheritanceTaxResult {
    if (inheritanceAmount < 0) throw new Error('Inheritance amount cannot be negative');

    // Spouse is fully exempt
    if (relationship === 'spouse') {
      return {
        inheritanceAmount,
        relationship,
        allowance: Infinity,
        taxableAmount: 0,
        inheritanceTax: 0,
        netInheritance: inheritanceAmount,
        effectiveRate: 0,
        breakdown: []
      };
    }

    const allowance = INHERITANCE_ALLOWANCES[relationship] || INHERITANCE_ALLOWANCES.other;
    const taxableAmount = Math.max(0, inheritanceAmount - allowance);
    
    const brackets = INHERITANCE_TAX_BRACKETS[relationship] || INHERITANCE_TAX_BRACKETS.other;
    const { tax: inheritanceTax, breakdown } = 
      this.calculateProgressiveTax(taxableAmount, brackets);

    const netInheritance = inheritanceAmount - inheritanceTax;
    const effectiveRate = inheritanceAmount > 0 ? (inheritanceTax / inheritanceAmount) : 0;

    return {
      inheritanceAmount,
      relationship,
      allowance,
      taxableAmount,
      inheritanceTax,
      netInheritance,
      effectiveRate,
      breakdown
    };
  }

  /**
   * Optimize tax with various strategies
   * @param income - Annual income
   * @param currentDeductions - Current deductions
   */
  static optimizeTax(
    income: number,
    currentDeductions: number = 0
  ): TaxOptimizationResult {
    if (income < 0) throw new Error('Income cannot be negative');

    // Calculate current tax
    const currentResult = this.calculateIncomeTax(income, currentDeductions);
    const currentTax = currentResult.totalTax;

    const strategies: TaxStrategy[] = [];
    let totalPotentialSavings = 0;

    // Strategy 1: PER (Plan Épargne Retraite)
    const perLimit = Math.min(income * 0.10, 35194); // 10% of income, max 35,194€
    const perContribution = Math.min(perLimit, income * 0.05); // Suggest 5%
    const perResult = this.calculateIncomeTax(income, currentDeductions + perContribution);
    const perSavings = currentTax - perResult.totalTax;
    
    if (perSavings > 0) {
      strategies.push({
        name: 'PER (Plan Épargne Retraite)',
        description: `Contribuer ${perContribution.toFixed(0)}€ à un PER pour réduire le revenu imposable`,
        potentialSavings: perSavings,
        implementation: 'Ouvrir un PER et effectuer des versements déductibles',
        priority: 'high'
      });
      totalPotentialSavings += perSavings;
    }

    // Strategy 2: Charitable donations (66% reduction)
    const donationAmount = Math.min(income * 0.20, 5000); // Up to 20% of income
    const donationSavings = donationAmount * 0.66;
    
    if (donationSavings > 0) {
      strategies.push({
        name: 'Dons aux associations',
        description: `Faire un don de ${donationAmount.toFixed(0)}€ pour bénéficier de 66% de réduction d'impôt`,
        potentialSavings: donationSavings,
        implementation: 'Effectuer des dons à des associations reconnues d\'utilité publique',
        priority: 'medium'
      });
      totalPotentialSavings += donationSavings;
    }

    // Strategy 3: Real estate investment (Pinel)
    if (income > 50000) {
      const pinelInvestment = 300000;
      const pinelReduction = pinelInvestment * 0.12; // 12% over 6 years
      
      strategies.push({
        name: 'Investissement Pinel',
        description: `Investir ${pinelInvestment.toFixed(0)}€ dans l'immobilier neuf pour 12% de réduction`,
        potentialSavings: pinelReduction,
        implementation: 'Acheter un bien immobilier neuf éligible au dispositif Pinel',
        priority: 'low'
      });
    }

    // Strategy 4: Life insurance optimization
    if (income > 30000) {
      const lifeInsuranceContribution = income * 0.10;
      strategies.push({
        name: 'Assurance-vie',
        description: `Placer ${lifeInsuranceContribution.toFixed(0)}€ en assurance-vie pour optimiser la fiscalité`,
        potentialSavings: lifeInsuranceContribution * 0.15, // Estimated savings
        implementation: 'Ouvrir ou alimenter une assurance-vie avec fiscalité avantageuse après 8 ans',
        priority: 'medium'
      });
    }

    const optimizedTax = currentTax - totalPotentialSavings;
    const savingsPercentage = currentTax > 0 ? (totalPotentialSavings / currentTax) * 100 : 0;

    const recommendations = [
      'Maximiser les versements sur un PER pour réduire le revenu imposable',
      'Considérer les dons aux associations pour bénéficier de la réduction d\'impôt de 66%',
      'Évaluer les investissements immobiliers défiscalisants (Pinel, Malraux)',
      'Optimiser l\'utilisation de l\'assurance-vie pour la transmission et la fiscalité'
    ];

    return {
      currentTax,
      optimizedTax,
      savings: totalPotentialSavings,
      savingsPercentage,
      strategies,
      recommendations
    };
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Calculate progressive tax using brackets
   * @private
   */
  private static calculateProgressiveTax(
    amount: number,
    brackets: TaxBracket[]
  ): { tax: number; breakdown: TaxBracketBreakdown[]; marginalRate: number } {
    let tax = 0;
    let marginalRate = 0;
    const breakdown: TaxBracketBreakdown[] = [];

    for (let i = 0; i < brackets.length; i++) {
      const bracket = brackets[i];
      const bracketMin = bracket.min;
      const bracketMax = bracket.max ?? Infinity;

      if (amount > bracketMin) {
        const taxableInBracket = Math.min(amount, bracketMax) - bracketMin;
        const taxInBracket = taxableInBracket * bracket.rate;
        
        tax += taxInBracket;
        marginalRate = bracket.rate;

        breakdown.push({
          bracket: i + 1,
          min: bracketMin,
          max: bracket.max,
          rate: bracket.rate,
          taxableAmount: taxableInBracket,
          taxAmount: taxInBracket
        });

        if (amount <= bracketMax) {
          break;
        }
      }
    }

    return { tax, breakdown, marginalRate };
  }

  /**
   * Get current tax year
   */
  static getCurrentTaxYear(): number {
    return new Date().getFullYear();
  }

  /**
   * Get tax brackets for a specific year
   */
  static getTaxBrackets(year: number = 2024): {
    income: TaxBracket[];
    wealth: TaxBracket[];
  } {
    // For now, only 2024 brackets are available
    return {
      income: INCOME_TAX_BRACKETS_2024,
      wealth: WEALTH_TAX_BRACKETS_2024
    };
  }

  /**
   * Get allowances for donations and inheritance
   */
  static getAllowances(): {
    donation: Record<string, number>;
    inheritance: Record<string, number>;
  } {
    return {
      donation: DONATION_ALLOWANCES,
      inheritance: INHERITANCE_ALLOWANCES
    };
  }
}

export default TaxCalculator;
