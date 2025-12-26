/**
 * Validation Schemas (Zod)
 * Aura CRM - Budget, Taxation & Enrichissements
 */

import { z } from 'zod'

// ============================================================================
// BUDGET SCHEMAS
// ============================================================================

export const professionalIncomeSchema = z.object({
  netSalary: z.number().min(0).default(0),
  selfEmployedIncome: z.number().min(0).default(0),
  bonuses: z.number().min(0).default(0),
  other: z.number().min(0).default(0),
})

export const assetIncomeSchema = z.object({
  rentalIncome: z.number().min(0).default(0),
  dividends: z.number().min(0).default(0),
  interest: z.number().min(0).default(0),
  capitalGains: z.number().min(0).default(0),
})

export const spouseIncomeSchema = z.object({
  netSalary: z.number().min(0).default(0),
  other: z.number().min(0).default(0),
})

export const retirementPensionsSchema = z.object({
  total: z.number().min(0).default(0),
})

export const allowancesSchema = z.object({
  total: z.number().min(0).default(0),
})

export const monthlyExpenseCategorySchema = z.object({
  total: z.number().min(0).default(0),
})

export const monthlyExpensesSchema = z.object({
  housing: monthlyExpenseCategorySchema.optional(),
  utilities: monthlyExpenseCategorySchema.optional(),
  food: monthlyExpenseCategorySchema.optional(),
  transportation: monthlyExpenseCategorySchema.optional(),
  insurance: monthlyExpenseCategorySchema.optional(),
  leisure: monthlyExpenseCategorySchema.optional(),
  health: monthlyExpenseCategorySchema.optional(),
  education: monthlyExpenseCategorySchema.optional(),
  loans: monthlyExpenseCategorySchema.optional(),
  other: monthlyExpenseCategorySchema.optional(),
})

export const clientBudgetSchema = z.object({
  professionalIncome: professionalIncomeSchema.optional(),
  assetIncome: assetIncomeSchema.optional(),
  spouseIncome: spouseIncomeSchema.optional(),
  retirementPensions: retirementPensionsSchema.optional(),
  allowances: allowancesSchema.optional(),
  monthlyExpenses: monthlyExpensesSchema.optional(),
})

// ============================================================================
// TAXATION SCHEMAS
// ============================================================================

export const incomeTaxSchema = z.object({
  fiscalReferenceIncome: z.number().min(0),
  taxShares: z.number().min(0.5).max(10),
  quotientFamilial: z.number().min(0),
  taxBracket: z.number().int().min(0).max(45),
  annualAmount: z.number().min(0),
  monthlyPayment: z.number().min(0),
  taxCredits: z.number().min(0).default(0),
  taxReductions: z.number().min(0).default(0),
})

export const ifiSchema = z.object({
  taxableRealEstateAssets: z.number().min(0),
  deductibleLiabilities: z.number().min(0),
  netTaxableIFI: z.number().min(0),
  ifiAmount: z.number().min(0),
  bracket: z.string(),
  threshold: z.number().default(1300000),
})

export const socialContributionsSchema = z.object({
  taxableAssetIncome: z.number().min(0),
  rate: z.number().min(0).max(1).default(0.172),
  amount: z.number().min(0),
})

export const clientTaxationSchema = z.object({
  anneeFiscale: z.number().int().min(2020).max(2030).default(2024),
  incomeTax: incomeTaxSchema.optional(),
  ifi: ifiSchema.optional(),
  socialContributions: socialContributionsSchema.optional(),
})

export const taxOptimizationSchema = z.object({
  priority: z.enum(['HAUTE', 'MOYENNE', 'BASSE']).default('MOYENNE'),
  category: z.string().min(1),
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  potentialSavings: z.number().min(0).optional(),
  recommendation: z.string().min(1),
  status: z
    .enum(['DETECTEE', 'EN_COURS', 'APPLIQUEE', 'REJETEE', 'EXPIREE'])
    .default('DETECTEE'),
  reviewedBy: z.string().optional(),
  dismissReason: z.string().optional(),
})

// ============================================================================
// PATRIMOINE ENRICHI SCHEMAS
// ============================================================================

export const managementTrackingSchema = z.object({
  isManaged: z.boolean().default(false),
  advisor: z.string().optional(),
  since: z.string().datetime().optional(),
  fees: z.number().min(0).max(100).optional(),
})

export const fiscalDataIFISchema = z.object({
  propertyType: z.enum(['RP', 'SECONDARY', 'RENTAL', 'COMMERCIAL']).optional(),
  rpAbatement: z.boolean().default(false),
  manualDiscount: z.number().min(0).max(100).optional(),
  ifiValue: z.number().min(0).optional(),
})

export const actifEnrichedSchema = z.object({
  location: z.string().optional(),
  managementAdvisor: z.string().optional(),
  managementSince: z.string().datetime().optional(),
  fiscalPropertyType: z
    .enum(['RP', 'SECONDARY', 'RENTAL', 'COMMERCIAL'])
    .optional(),
  fiscalRpAbatement: z.boolean().default(false),
  fiscalManualDiscount: z.number().min(0).max(100).optional(),
  fiscalIfiValue: z.number().min(0).optional(),
  linkedPassifId: z.string().optional(),
})

export const passifEnrichedSchema = z.object({
  insuranceRate: z.number().min(0).max(100).optional(),
})

// ============================================================================
// FAMILLE ENRICHIE SCHEMAS
// ============================================================================

export const familyMemberEnrichedSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  birthDate: z.string().datetime().optional(),
  relationship: z.enum([
    'CONJOINT',
    'ENFANT',
    'PARENT',
    'FRATRIE',
    'PETIT_ENFANT',
    'ASCENDANT',
    'AUTRE',
  ]),
  civility: z.enum(['M', 'MME', 'MLLE']).optional(),
  profession: z.string().max(200).optional(),
  annualIncome: z.number().min(0).optional(),
  isDependent: z.boolean().default(false),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  notes: z.string().optional(),
  linkedClientId: z.string().optional(),
  isBeneficiary: z.boolean().default(false),
})

// ============================================================================
// CLIENT ENRICHI SCHEMAS
// ============================================================================

export const clientEnrichedSchema = z.object({
  civilite: z.enum(['M', 'MME', 'MLLE']).optional(),
  nomUsage: z.string().max(100).optional(),
  taxResidenceCountry: z.string().length(2).optional(), // Code ISO
  matrimonialRegime: z
    .enum(['SEPARATION', 'COMMUNAUTE', 'UNIVERSELLE', 'PARTICIPATION'])
    .optional(),
  dependents: z.number().int().min(0).default(0),
  professionCategory: z
    .enum([
      'CADRE_SUP',
      'CADRE',
      'PROFESS_LIB',
      'CHEF_ENTR',
      'EMPLOYE',
      'OUVRIER',
      'AGRICULTEUR',
      'ARTISAN',
      'COMMERCANT',
      'RETRAITE',
      'ETUDIANT',
      'SANS_EMPLOI',
      'AUTRE',
    ])
    .optional(),
  employmentType: z
    .enum([
      'CDI',
      'CDD',
      'INDEPENDANT',
      'INTERIM',
      'STAGE',
      'ALTERNANCE',
      'FREELANCE',
    ])
    .optional(),
  employmentSince: z.string().datetime().optional(),
})
