// FILE: lib/validations/schemas/passif.schema.ts

import { z } from 'zod'

// ===========================================
// ENUMS
// ===========================================

export const PassifTypeSchema = z.enum([
  'CREDIT_IMMOBILIER',
  'PTZ',
  'PRET_ACTION_LOGEMENT',
  'CREDIT_CONSOMMATION',
  'CREDIT_AUTO',
  'PRET_ETUDIANT',
  'PRET_PROFESSIONNEL',
  'CREDIT_REVOLVING',
  'PRET_RELAIS',
  'PRET_IN_FINE',
  'PRET_FAMILIAL',
  'DECOUVERT',
  'LEASING',
  'AUTRE',
])

// ===========================================
// CREATE PASSIF SCHEMA
// ===========================================

export const CreatePassifSchema = z.object({
  // Identification
  type: PassifTypeSchema,
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional().nullable(),
  
  // Montants
  initialAmount: z.number().min(0, 'Le montant initial doit être positif'),
  remainingAmount: z.number().min(0, 'Le capital restant dû doit être positif'),
  monthlyPayment: z.number().min(0, 'La mensualité doit être positive'),
  
  // Taux et conditions
  interestRate: z.number().min(0).max(100, 'Taux invalide'),
  effectiveRate: z.number().min(0).max(100).optional().nullable(),
  rateType: z.enum(['FIXED', 'VARIABLE', 'CAPPED_VARIABLE']).optional().nullable(),
  variableCap: z.number().min(0).max(100).optional().nullable(),
  deferralType: z.enum(['NONE', 'PARTIAL', 'TOTAL']).optional().nullable(),
  deferralMonths: z.number().int().min(0).optional().nullable(),
  deferralEndDate: z.coerce.date().optional().nullable(),
  
  // Dates
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  firstPaymentDate: z.coerce.date().optional().nullable(),
  lastPaymentDate: z.coerce.date().optional().nullable(),
  
  // Rattachement actif
  linkedActifId: z.string().cuid().optional().nullable(),
  
  // Emprunteurs
  borrowerType: z.enum(['SOLO', 'JOINT']).optional().nullable(),
  primaryBorrower: z.string().optional().nullable(),
  primaryBorrowerQuota: z.number().min(0).max(100).optional().nullable(),
  coBorrower: z.string().optional().nullable(),
  coBorrowerQuota: z.number().min(0).max(100).optional().nullable(),
  borrowers: z.array(z.object({
    name: z.string(),
    quota: z.number().min(0).max(100),
    isGuarantor: z.boolean().optional(),
  })).optional().nullable(),
  
  // Assurance emprunteur
  insuranceType: z.enum(['GROUPE', 'DELEGATION']).optional().nullable(),
  insuranceProvider: z.string().optional().nullable(),
  insuranceRate: z.number().min(0).max(100).optional().nullable(),
  insuranceMonthly: z.number().min(0).optional().nullable(),
  insuranceTotalCost: z.number().min(0).optional().nullable(),
  insuranceGuarantees: z.array(z.object({
    type: z.enum(['DC', 'PTIA', 'ITT', 'IPT', 'IPP', 'PE']),
    covered: z.boolean(),
    quota: z.number().min(0).max(100).optional(),
  })).optional().nullable(),
  insuranceDetails: z.array(z.object({
    borrower: z.string(),
    guarantees: z.array(z.string()),
    quota: z.number().min(0).max(100),
    monthlyPremium: z.number().min(0),
  })).optional().nullable(),
  
  // Garanties du prêt
  guaranteeType: z.enum(['HYPOTHEQUE', 'PPD', 'CAUTION_MUTUELLE', 'NANTISSEMENT', 'AUCUNE']).optional().nullable(),
  guaranteeProvider: z.string().optional().nullable(),
  guaranteeAmount: z.number().min(0).optional().nullable(),
  guaranteeCost: z.number().min(0).optional().nullable(),
  guaranteeRestitution: z.number().min(0).optional().nullable(),
  
  // Prêteur
  lenderName: z.string().optional().nullable(),
  lenderType: z.enum(['BANQUE', 'ORGANISME_CREDIT', 'PARTICULIER', 'EMPLOYEUR']).optional().nullable(),
  contractNumber: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  
  // Remboursement anticipé
  earlyRepaymentAllowed: z.boolean().default(true),
  earlyRepaymentPenalty: z.number().min(0).max(100).optional().nullable(),
  earlyRepaymentPenaltyMax: z.number().min(0).optional().nullable(),
  
  // Modularité
  isModular: z.boolean().default(false),
  pauseAllowed: z.boolean().default(false),
  pauseMaxMonths: z.number().int().min(0).optional().nullable(),
  
  // Calculs
  totalInterestCost: z.number().min(0).optional().nullable(),
  totalCost: z.number().min(0).optional().nullable(),
})

// ===========================================
// UPDATE PASSIF SCHEMA
// ===========================================

export const UpdatePassifSchema = z.object({
  type: PassifTypeSchema.optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  
  initialAmount: z.number().min(0).optional(),
  remainingAmount: z.number().min(0).optional(),
  monthlyPayment: z.number().min(0).optional(),
  
  interestRate: z.number().min(0).max(100).optional(),
  effectiveRate: z.number().min(0).max(100).optional().nullable(),
  rateType: z.enum(['FIXED', 'VARIABLE', 'CAPPED_VARIABLE']).optional().nullable(),
  variableCap: z.number().min(0).max(100).optional().nullable(),
  deferralType: z.enum(['NONE', 'PARTIAL', 'TOTAL']).optional().nullable(),
  deferralMonths: z.number().int().min(0).optional().nullable(),
  deferralEndDate: z.coerce.date().optional().nullable(),
  
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  firstPaymentDate: z.coerce.date().optional().nullable(),
  lastPaymentDate: z.coerce.date().optional().nullable(),
  
  linkedActifId: z.string().cuid().optional().nullable(),
  
  borrowerType: z.enum(['SOLO', 'JOINT']).optional().nullable(),
  primaryBorrower: z.string().optional().nullable(),
  primaryBorrowerQuota: z.number().min(0).max(100).optional().nullable(),
  coBorrower: z.string().optional().nullable(),
  coBorrowerQuota: z.number().min(0).max(100).optional().nullable(),
  
  insuranceType: z.enum(['GROUPE', 'DELEGATION']).optional().nullable(),
  insuranceProvider: z.string().optional().nullable(),
  insuranceRate: z.number().min(0).max(100).optional().nullable(),
  insuranceMonthly: z.number().min(0).optional().nullable(),
  
  guaranteeType: z.enum(['HYPOTHEQUE', 'PPD', 'CAUTION_MUTUELLE', 'NANTISSEMENT', 'AUCUNE']).optional().nullable(),
  guaranteeProvider: z.string().optional().nullable(),
  guaranteeAmount: z.number().min(0).optional().nullable(),
  
  lenderName: z.string().optional().nullable(),
  lenderType: z.enum(['BANQUE', 'ORGANISME_CREDIT', 'PARTICULIER', 'EMPLOYEUR']).optional().nullable(),
  contractNumber: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  
  earlyRepaymentAllowed: z.boolean().optional(),
  earlyRepaymentPenalty: z.number().min(0).max(100).optional().nullable(),
  
  isModular: z.boolean().optional(),
  pauseAllowed: z.boolean().optional(),
  
  totalInterestCost: z.number().min(0).optional().nullable(),
  totalCost: z.number().min(0).optional().nullable(),
  
  isActive: z.boolean().optional(),
})

// ===========================================
// TYPES
// ===========================================

export type PassifType = z.infer<typeof PassifTypeSchema>
export type CreatePassifInput = z.infer<typeof CreatePassifSchema>
export type UpdatePassifInput = z.infer<typeof UpdatePassifSchema>
