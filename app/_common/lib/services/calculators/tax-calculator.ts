/**
 * Tax Calculator Service
 * Comprehensive tax calculation service with French tax law compliance
 * 
 * Supports:
 * - Income tax (Impôt sur le revenu)
 * - Wealth tax (IFI - Impôt sur la Fortune Immobilière)
 * - Capital gains tax
 * - Donation tax (Droits de donation)
 * - Inheritance tax (Droits de succession)
 * - Tax optimization strategies
 */

import { RULES } from '@/app/_common/lib/rules/fiscal-rules'

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
// Tax Brackets 2025 - Source: Althémis Chiffres-Clés Patrimoine 2025
// CGI art. 197 - Imposition des revenus 2025 (barème 2026 revalorisé +0,9%)
// ============================================================================

const INCOME_TAX_BRACKETS_2024: TaxBracket[] = RULES.ir.bareme.map(t => ({
  min: t.min,
  max: t.max === Infinity ? null : t.max,
  rate: t.taux,
}));

// ============================================================================
// Décote IR 2026 - CGI art. 197 I-4° (revalorisation +0,9%)
// Applicable si IR brut < seuil
// ============================================================================
const IR_DECOTE_2025 = {
  seul: {
    seuil: RULES.ir.decote.seuil_celibataire,
    plafond: RULES.ir.decote.base_celibataire,
    taux: RULES.ir.decote.coefficient,
  },
  couple: {
    seuil: RULES.ir.decote.seuil_couple,
    plafond: RULES.ir.decote.base_couple,
    taux: RULES.ir.decote.coefficient,
  }
};

// ============================================================================
// Plafonnement du Quotient Familial 2026 - CGI art. 197 I-2° (revalorisation +0,9%)
// ============================================================================
const PLAFOND_QF_2025 = {
  parDemiPart: RULES.ir.quotient_familial.plafond_demi_part,
  parentIsole: RULES.ir.quotient_familial.demi_part_parent_isole,
  invalidite: RULES.ir.quotient_familial.plafond_demi_part_invalidite,
  ancienCombattant: RULES.ir.quotient_familial.plafond_demi_part_invalidite,
};

// CGI art. 977 - Barème IFI 2025
// Seuil de déclenchement: 1 300 000 € (CGI art. 964)
const WEALTH_TAX_BRACKETS_2024: TaxBracket[] = RULES.ifi.bareme.map(t => ({
  min: t.min,
  max: t.max === Infinity ? null : t.max,
  rate: t.taux,
}));

// ============================================================================
// Barèmes Donations & Successions 2025 - CGI art. 777
// Source: Althémis Chiffres-Clés Patrimoine 2025
// ============================================================================

// Droits de donation/succession en ligne directe
const DONATION_TAX_BRACKETS: Record<string, TaxBracket[]> = {
  // Ligne directe (enfants, ascendants)
  child: [
    { min: 0, max: 8072, rate: 0.05 },           // 5%
    { min: 8072, max: 12109, rate: 0.10 },       // 10%
    { min: 12109, max: 15932, rate: 0.15 },      // 15%
    { min: 15932, max: 552324, rate: 0.20 },     // 20%
    { min: 552324, max: 902838, rate: 0.30 },    // 30%
    { min: 902838, max: 1805677, rate: 0.40 },   // 40%
    { min: 1805677, max: null, rate: 0.45 }      // 45%
  ],
  // Même barème pour petits-enfants
  grandchild: [
    { min: 0, max: 8072, rate: 0.05 },
    { min: 8072, max: 12109, rate: 0.10 },
    { min: 12109, max: 15932, rate: 0.15 },
    { min: 15932, max: 552324, rate: 0.20 },
    { min: 552324, max: 902838, rate: 0.30 },
    { min: 902838, max: 1805677, rate: 0.40 },
    { min: 1805677, max: null, rate: 0.45 }
  ],
  // Époux et pacsés (donations entre vifs)
  spouse: [
    { min: 0, max: 8072, rate: 0.05 },
    { min: 8072, max: 15932, rate: 0.10 },
    { min: 15932, max: 31865, rate: 0.15 },
    { min: 31865, max: 552324, rate: 0.20 },
    { min: 552324, max: 902838, rate: 0.30 },
    { min: 902838, max: 1805677, rate: 0.40 },
    { min: 1805677, max: null, rate: 0.45 }
  ],
  // Frères et soeurs
  sibling: [
    { min: 0, max: 24430, rate: 0.35 },          // 35%
    { min: 24430, max: null, rate: 0.45 }        // 45%
  ],
  // Parents jusqu'au 4e degré
  fourth_degree: [
    { min: 0, max: null, rate: 0.55 }            // 55%
  ],
  // Au-delà du 4e degré ou non-parents
  other: [
    { min: 0, max: null, rate: 0.60 }            // 60%
  ]
};

// Barèmes succession (même que donation sauf exonération conjoint)
const INHERITANCE_TAX_BRACKETS = DONATION_TAX_BRACKETS;

// ============================================================================
// Abattements 2025 - Source: Althémis
// Renouvelables tous les 15 ans
// ============================================================================

const DONATION_ALLOWANCES: Record<string, number> = {
  spouse: 80724,           // Conjoint ou pacsé
  child: 100000,           // Enfant vivant ou représenté
  grandchild: 31865,       // Petit-enfant
  great_grandchild: 5310,  // Arrière-petit-enfant
  ascendant: 100000,       // Ascendant en ligne directe
  sibling: 15932,          // Frère & soeur
  nephew_niece: 7967,      // Neveu & nièce
  disabled: 159325,        // Héritier handicapé (abattement supplémentaire)
  cash_gift: 31865,        // Don de sommes d'argent (CGI art. 790 G)
  other: 0                 // À défaut d'autre abattement
};

const INHERITANCE_ALLOWANCES: Record<string, number> = {
  spouse: Infinity,        // Exonération totale
  child: 100000,           // Enfant vivant ou représenté
  grandchild: 1594,        // Petit-enfant
  great_grandchild: 1594,  // Arrière-petit-enfant
  ascendant: 100000,       // Ascendant en ligne directe
  sibling: 15932,          // Frère & soeur (ou exonération sous conditions CGI 796-0 ter)
  nephew_niece: 7967,      // Neveu & nièce
  disabled: 159325,        // Héritier handicapé (abattement supplémentaire)
  other: 1594              // À défaut d'autre abattement
};

// ============================================================================
// Assurance-Vie 2025 - CGI art. 990 I
// Source: Althémis Chiffres-Clés Patrimoine 2025
// ============================================================================

const LIFE_INSURANCE_TAX = {
  allowancePerBeneficiary: RULES.assurance_vie.deces.abattement_990i,
  brackets: [
    { min: 0, max: RULES.assurance_vie.deces.seuil_990i, rate: RULES.assurance_vie.deces.taux_990i_1 },
    { min: RULES.assurance_vie.deces.seuil_990i, max: null, rate: RULES.assurance_vie.deces.taux_990i_2 }
  ],
  allowanceAfter70: RULES.assurance_vie.deces.abattement_757b,
};

// ============================================================================
// Barème Démembrement - CGI art. 669
// Source: Althémis Chiffres-Clés Patrimoine 2025
// ============================================================================

// Usufruit viager selon l'âge de l'usufruitier
const USUFRUCT_VALUATION = RULES.demembrement.bareme_art669.map(t => ({
  maxAge: t.age_max,
  usufruct: t.usufruit / 100,
  bareOwnership: t.nue_propriete / 100,
}));

// Usufruit temporaire: 23% de la pleine propriété par période de 10 ans
const TEMPORARY_USUFRUCT_RATE_PER_10_YEARS = 0.23;

// Droit d'usage et d'habitation = 60% de l'usufruit viager
const RIGHT_OF_USE_RATE = 0.60;

// ============================================================================
// Taux et Constantes Diverses 2025
// ============================================================================

// Prélèvements sociaux — LFSS 2026 : système DUAL
// 18,6% sur revenus financiers (dividendes, PV mobilières, LMNP/BIC, crypto, PEA)
// 17,2% INCHANGÉ sur revenus fonciers, PV immobilières, assurance-vie
const SOCIAL_CONTRIBUTIONS_RATE_FINANCIER = RULES.ps.pfu_per_2026;
const SOCIAL_CONTRIBUTIONS_RATE_FONCIER = RULES.ps.total;
const SOCIAL_CONTRIBUTIONS_RATE = RULES.ps.total; // Rétrocompatibilité — taux foncier par défaut

// Prélèvement Forfaitaire Unique (PFU / Flat Tax)
const FLAT_TAX_RATE = RULES.ps.pfu_ir + RULES.ps.pfu_per_2026;
const PFU_INCOME_TAX_RATE = RULES.ps.pfu_ir;

// Contribution Exceptionnelle sur les Hauts Revenus (CEHR) - CGI art. 223 sexies
const CEHR_BRACKETS = {
  single: RULES.ir.cehr.celibataire.map(t => ({ min: t.min, max: t.max === Infinity ? null : t.max, rate: t.taux })),
  couple: RULES.ir.cehr.couple.map(t => ({ min: t.min, max: t.max === Infinity ? null : t.max, rate: t.taux })),
};

// Abattement résidence principale IFI - CGI art. 973 I
const IFI_MAIN_RESIDENCE_ALLOWANCE = RULES.ifi.abattement_rp;

// Seuil IFI
const IFI_THRESHOLD = RULES.ifi.seuil_assujettissement;

// Décote IFI
const IFI_DISCOUNT = {
  minThreshold: RULES.ifi.seuil_assujettissement,
  maxThreshold: RULES.ifi.decote.seuil,
  baseAmount: RULES.ifi.decote.base,
  rate: RULES.ifi.decote.taux,
};

// ============================================================================
// Tax Calculator Class
// ============================================================================

export class TaxCalculator {
  /**
   * Calculate income tax using French progressive brackets
   * Conforme CGI art. 197 - Imposition des revenus 2025
   * 
   * @param grossIncome - Total gross income (revenu brut global)
   * @param deductions - Total deductions (abattements, pensions alimentaires, etc.)
   * @param familyQuotient - Number of parts (quotient familial)
   * @param year - Tax year (default 2024)
   * @param options - Options supplémentaires (isCouple, applyDecote, applyCEHR)
   */
  static calculateIncomeTax(
    grossIncome: number,
    deductions: number = 0,
    familyQuotient: number = 1,
    _year: number = 2024,
    options: {
      isCouple?: boolean;           // Marié/Pacsé pour décote
      applyDecote?: boolean;        // Appliquer la décote (défaut: true)
      applyCEHR?: boolean;          // Appliquer CEHR (défaut: true)
      includePS?: boolean;          // Inclure PS (défaut: false pour salaires)
    } = {}
  ): TaxCalculationResult {
    const { 
      isCouple = familyQuotient >= 2,
      applyDecote = true,
      applyCEHR = true,
      includePS = false  // Les PS ne s'appliquent PAS sur les salaires
    } = options;

    // Validate inputs
    if (grossIncome < 0) throw new Error('Gross income cannot be negative');
    if (deductions < 0) throw new Error('Deductions cannot be negative');
    if (familyQuotient < 1) throw new Error('Family quotient must be at least 1');

    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 1 : Calcul du revenu imposable
    // ═══════════════════════════════════════════════════════════════════════════
    const taxableIncome = Math.max(0, grossIncome - deductions);
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 2 : Application du quotient familial (CGI art. 193 à 196)
    // ═══════════════════════════════════════════════════════════════════════════
    const quotientedIncome = taxableIncome / familyQuotient;
    
    // Calcul IR avec QF
    const { tax: quotientTax, breakdown: quotientBreakdown, marginalRate } = 
      this.calculateProgressiveTax(quotientedIncome, INCOME_TAX_BRACKETS_2024);
    
    const irAvantPlafonnement = quotientTax * familyQuotient;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 3 : Plafonnement du Quotient Familial (CGI art. 197 I-2°)
    // L'avantage fiscal du QF est limité à 1759€ par demi-part supplémentaire
    // ═══════════════════════════════════════════════════════════════════════════
    const partsDeBase = isCouple ? 2 : 1;
    const demiPartsSupp = Math.max(0, (familyQuotient - partsDeBase) * 2); // Nombre de demi-parts supp
    
    // Calculer l'IR sans les demi-parts supplémentaires
    const quotientedIncomeBase = taxableIncome / partsDeBase;
    const { tax: taxBase } = this.calculateProgressiveTax(quotientedIncomeBase, INCOME_TAX_BRACKETS_2024);
    const irSansQFSupp = taxBase * partsDeBase;
    
    // Avantage fiscal du QF = IR sans QF supp - IR avec QF
    const avantageQF = irSansQFSupp - irAvantPlafonnement;
    
    // Plafonnement
    const plafondAvantage = demiPartsSupp * PLAFOND_QF_2025.parDemiPart;
    let irApresPlafonnement = irAvantPlafonnement;
    let plafonnementApplique = 0;
    
    if (avantageQF > plafondAvantage) {
      // L'avantage est plafonné : IR = IR sans QF supp - plafond
      irApresPlafonnement = irSansQFSupp - plafondAvantage;
      plafonnementApplique = avantageQF - plafondAvantage;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 4 : Application de la décote (CGI art. 197 I-4°)
    // Applicable si IR brut < seuil
    // ═══════════════════════════════════════════════════════════════════════════
    let irApresDecote = irApresPlafonnement;
    let decote = 0;
    
    if (applyDecote) {
      const decoteParams = isCouple ? IR_DECOTE_2025.couple : IR_DECOTE_2025.seul;
      
      if (irApresPlafonnement > 0 && irApresPlafonnement < decoteParams.seuil) {
        // Décote = plafond - (IR × taux)
        decote = Math.max(0, decoteParams.plafond - irApresPlafonnement * decoteParams.taux);
        irApresDecote = Math.max(0, irApresPlafonnement - decote);
      }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 5 : CEHR - Contribution Exceptionnelle Hauts Revenus (CGI art. 223 sexies)
    // Applicable sur le RFR (revenu fiscal de référence)
    // ═══════════════════════════════════════════════════════════════════════════
    let cehr = 0;
    
    if (applyCEHR && taxableIncome > 0) {
      const cehrBrackets = isCouple ? CEHR_BRACKETS.couple : CEHR_BRACKETS.single;
      
      for (const bracket of cehrBrackets) {
        const bracketMin = bracket.min;
        const bracketMax = bracket.max ?? Infinity;
        
        if (taxableIncome > bracketMin) {
          const taxableInBracket = Math.min(taxableIncome, bracketMax) - bracketMin;
          cehr += taxableInBracket * bracket.rate;
        }
      }
    }
    
    // IR final
    const incomeTax = Math.round(irApresDecote + cehr);
    
    // Scale breakdown back to actual income
    const breakdown = quotientBreakdown.map((b) => ({
      ...b,
      taxableAmount: b.taxableAmount * familyQuotient,
      taxAmount: b.taxAmount * familyQuotient
    }));
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ÉTAPE 6 : Prélèvements sociaux (UNIQUEMENT si revenus du patrimoine)
    // Les PS ne s'appliquent PAS sur les revenus d'activité (salaires, etc.)
    // Ils s'appliquent sur : revenus fonciers, plus-values, dividendes, etc.
    // ═══════════════════════════════════════════════════════════════════════════
    const socialContributions = includePS ? taxableIncome * SOCIAL_CONTRIBUTIONS_RATE : 0;
    
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
    _year: number = 2024
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

    // Strategy 3: Déficit foncier (si revenus fonciers présumés)
    if (income > 50000) {
      const deficitMax = 10700; // Plafond annuel déductible
      const deficitSavings = deficitMax * (currentResult.marginalRate || 0.30);
      
      strategies.push({
        name: 'Déficit foncier',
        description: `Réaliser des travaux déductibles jusqu'à ${deficitMax.toFixed(0)}€ sur vos biens locatifs`,
        potentialSavings: deficitSavings,
        implementation: 'Effectuer des travaux de réparation ou d\'amélioration sur vos biens immobiliers locatifs',
        priority: 'medium'
      });
    }

    // Strategy 3b: Emploi à domicile
    const emploiDomicilePlafond = 12000;
    const emploiDomicileCredit = emploiDomicilePlafond * 0.50;
    
    strategies.push({
      name: 'Emploi à domicile',
      description: `Crédit d'impôt de 50% sur les dépenses d'emploi à domicile (ménage, jardinage, garde...)`,
      potentialSavings: emploiDomicileCredit,
      implementation: 'Employer une aide à domicile via CESU ou entreprise de services',
      priority: 'medium'
    });

    const optimizedTax = currentTax - totalPotentialSavings;
    const savingsPercentage = currentTax > 0 ? (totalPotentialSavings / currentTax) * 100 : 0;

    const recommendations = [
      'Maximiser les versements sur un PER pour réduire le revenu imposable (jusqu\'à 10% du revenu)',
      'Considérer les dons aux associations pour bénéficier de la réduction d\'impôt de 66%',
      'Exploiter le déficit foncier si vous possédez des biens locatifs (jusqu\'à 10 700€ déductibles)',
      'Utiliser le crédit d\'impôt emploi à domicile (50% des dépenses, plafond 12 000€)'
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
  static getTaxBrackets(_year: number = 2024): {
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

  /**
   * Calculate usufruct and bare ownership values based on age
   * CGI art. 669 I - Barème démembrement 2025
   * @param fullValue - Full property value
   * @param usufruitierAge - Age of the usufructuary
   */
  static calculateDismemberment(
    fullValue: number,
    usufruitierAge: number
  ): { usufructValue: number; bareOwnershipValue: number; usufructRate: number; bareOwnershipRate: number } {
    if (fullValue < 0) throw new Error('Full value cannot be negative');
    if (usufruitierAge < 0) throw new Error('Age cannot be negative');

    // Find the applicable rate based on age
    const bracket = USUFRUCT_VALUATION.find(b => usufruitierAge <= b.maxAge) || USUFRUCT_VALUATION[USUFRUCT_VALUATION.length - 1];

    return {
      usufructValue: fullValue * bracket.usufruct,
      bareOwnershipValue: fullValue * bracket.bareOwnership,
      usufructRate: bracket.usufruct,
      bareOwnershipRate: bracket.bareOwnership
    };
  }

  /**
   * Calculate temporary usufruct value
   * CGI art. 669 II - 23% per 10-year period
   * @param fullValue - Full property value
   * @param durationYears - Duration of usufruct in years
   * @param usufruitierAge - Age for max value comparison (optional)
   */
  static calculateTemporaryUsufruct(
    fullValue: number,
    durationYears: number,
    usufruitierAge?: number
  ): { usufructValue: number; bareOwnershipValue: number; rate: number } {
    if (fullValue < 0) throw new Error('Full value cannot be negative');
    if (durationYears <= 0) throw new Error('Duration must be positive');

    // Calculate periods of 10 years (without fraction)
    const periods = Math.floor(durationYears / 10);
    let rate = periods * TEMPORARY_USUFRUCT_RATE_PER_10_YEARS;

    // Cap at viager usufruct value if age provided
    if (usufruitierAge !== undefined) {
      const viager = this.calculateDismemberment(fullValue, usufruitierAge);
      rate = Math.min(rate, viager.usufructRate);
    }

    // Cap at 90% maximum
    rate = Math.min(rate, 0.90);

    return {
      usufructValue: fullValue * rate,
      bareOwnershipValue: fullValue * (1 - rate),
      rate
    };
  }

  /**
   * Calculate life insurance death tax
   * CGI art. 990 I - Fiscalité assurance-vie au décès
   * @param amount - Amount received by beneficiary
   * @param premiumsBefore70 - Whether premiums were paid before insured's 70th birthday
   */
  static calculateLifeInsuranceTax(
    amount: number,
    premiumsBefore70: boolean = true
  ): { taxableAmount: number; tax: number; netAmount: number; effectiveRate: number } {
    if (amount < 0) throw new Error('Amount cannot be negative');

    if (!premiumsBefore70) {
      // Primes after 70: subject to inheritance tax after 30,500€ global allowance
      // Simplified: return 0 tax here, actual inheritance tax calculation needed
      return {
        taxableAmount: Math.max(0, amount - LIFE_INSURANCE_TAX.allowanceAfter70),
        tax: 0, // Would need to apply inheritance tax brackets
        netAmount: amount,
        effectiveRate: 0
      };
    }

    // Primes before 70: specific brackets after 152,500€ allowance per beneficiary
    const taxableAmount = Math.max(0, amount - LIFE_INSURANCE_TAX.allowancePerBeneficiary);
    
    let tax = 0;
    if (taxableAmount > 0) {
      // First 700,000€ at 20%
      const bracket1 = Math.min(taxableAmount, 700000);
      tax += bracket1 * 0.20;
      
      // Above 700,000€ at 31.25%
      if (taxableAmount > 700000) {
        tax += (taxableAmount - 700000) * 0.3125;
      }
    }

    return {
      taxableAmount,
      tax,
      netAmount: amount - tax,
      effectiveRate: amount > 0 ? tax / amount : 0
    };
  }

  /**
   * Get IFI threshold and discount info
   */
  static getIFIInfo(): {
    threshold: number;
    mainResidenceAllowance: number;
    discount: typeof IFI_DISCOUNT;
  } {
    return {
      threshold: IFI_THRESHOLD,
      mainResidenceAllowance: IFI_MAIN_RESIDENCE_ALLOWANCE,
      discount: IFI_DISCOUNT
    };
  }

  /**
   * Get life insurance tax info
   */
  static getLifeInsuranceInfo(): typeof LIFE_INSURANCE_TAX {
    return LIFE_INSURANCE_TAX;
  }

  /**
   * Get dismemberment valuation table
   */
  static getDismembermentTable(): typeof USUFRUCT_VALUATION {
    return USUFRUCT_VALUATION;
  }

  /**
   * Get CEHR (Contribution Exceptionnelle Hauts Revenus) brackets
   */
  static getCEHRBrackets(): typeof CEHR_BRACKETS {
    return CEHR_BRACKETS;
  }
}

export default TaxCalculator;

// Export constants for external use
export {
  INCOME_TAX_BRACKETS_2024,
  IR_DECOTE_2025,
  PLAFOND_QF_2025,
  WEALTH_TAX_BRACKETS_2024,
  DONATION_TAX_BRACKETS,
  INHERITANCE_TAX_BRACKETS,
  DONATION_ALLOWANCES,
  INHERITANCE_ALLOWANCES,
  LIFE_INSURANCE_TAX,
  USUFRUCT_VALUATION,
  CEHR_BRACKETS,
  IFI_THRESHOLD,
  IFI_DISCOUNT,
  IFI_MAIN_RESIDENCE_ALLOWANCE,
  SOCIAL_CONTRIBUTIONS_RATE,
  FLAT_TAX_RATE,
  PFU_INCOME_TAX_RATE,
  TEMPORARY_USUFRUCT_RATE_PER_10_YEARS,
  RIGHT_OF_USE_RATE
};
