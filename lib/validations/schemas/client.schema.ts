// FILE: lib/validations/schemas/client.schema.ts

import { z } from 'zod'

// ===========================================
// ENUMS
// ===========================================

export const ClientTypeSchema = z.enum(['PARTICULIER', 'PROFESSIONNEL'])

export const ClientStatusSchema = z.enum([
  'PROSPECT',
  'ACTIF',
  'INACTIF',
  'ARCHIVE',
  'PERDU',
])

export const MaritalStatusSchema = z.enum([
  'CELIBATAIRE',
  'MARIE',
  'DIVORCE',
  'VEUF',
  'PACSE',
  'CONCUBINAGE',
])

export const RiskProfileSchema = z.enum([
  'CONSERVATEUR',
  'PRUDENT',
  'EQUILIBRE',
  'DYNAMIQUE',
  'OFFENSIF',
])

export const InvestmentHorizonSchema = z.enum([
  'COURT',
  'MOYEN',
  'LONG',
])

export const KYCStatusSchema = z.enum([
  'EN_ATTENTE',
  'EN_COURS',
  'COMPLET',
  'EXPIRE',
  'REJETE',
])

// ===========================================
// ADDRESS SCHEMA
// ===========================================

export const AddressSchema = z.object({
  street: z.string().optional(),
  complement: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('France'),
})

// ===========================================
// BASE CLIENT SCHEMA
// ===========================================

const BaseClientSchema = z.object({
  clientType: ClientTypeSchema.default('PARTICULIER'),
  
  // Identité
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide').optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  address: AddressSchema.optional().nullable(),
  
  // Statut
  status: ClientStatusSchema.default('PROSPECT'),
  
  // Conseiller
  conseillerId: z.string().cuid('ID conseiller invalide'),
  conseillerRemplacantId: z.string().cuid().optional().nullable(),
  apporteurId: z.string().cuid().optional().nullable(),
})

// ===========================================
// PARTICULIER SCHEMA
// ===========================================

export const ParticulierSchema = BaseClientSchema.extend({
  clientType: z.literal('PARTICULIER'),
  
  // Civilité
  civilite: z.enum(['M', 'MME', 'MLLE']).optional().nullable(),
  nomUsage: z.string().optional().nullable(),
  
  // Naissance
  birthDate: z.coerce.date().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  nationality: z.string().default('Française'),
  
  // Situation familiale
  maritalStatus: MaritalStatusSchema.optional().nullable(),
  matrimonialRegime: z.string().optional().nullable(),
  numberOfChildren: z.number().int().min(0).default(0),
  dependents: z.number().int().min(0).default(0),
  
  // Profession
  profession: z.string().optional().nullable(),
  professionCategory: z.string().optional().nullable(),
  employerName: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),
  employmentSince: z.coerce.date().optional().nullable(),
  
  // Revenus
  annualIncome: z.number().min(0).optional().nullable(),
  
  // Fiscalité
  irTaxRate: z.number().min(0).max(100).optional().nullable(),
  ifiSubject: z.boolean().default(false),
  ifiAmount: z.number().min(0).optional().nullable(),
  taxResidenceCountry: z.string().default('FR'),
  
  // Profil investisseur
  riskProfile: RiskProfileSchema.optional().nullable(),
  investmentHorizon: InvestmentHorizonSchema.optional().nullable(),
  investmentGoals: z.array(z.string()).optional().nullable(),
  investmentKnowledge: z.string().optional().nullable(),
  investmentExperience: z.string().optional().nullable(),
  
  // KYC
  kycStatus: KYCStatusSchema.default('EN_ATTENTE'),
  isPEP: z.boolean().default(false),
  originOfFunds: z.string().optional().nullable(),
})

// ===========================================
// PROFESSIONNEL SCHEMA
// ===========================================

export const ProfessionnelSchema = BaseClientSchema.extend({
  clientType: z.literal('PROFESSIONNEL'),
  
  // Entreprise
  companyName: z.string().min(1, 'La raison sociale est requise'),
  siret: z.string().length(14, 'SIRET invalide (14 caractères)').optional().nullable(),
  legalForm: z.string().optional().nullable(),
  activitySector: z.string().optional().nullable(),
  companyCreationDate: z.coerce.date().optional().nullable(),
  numberOfEmployees: z.number().int().min(0).optional().nullable(),
  annualRevenue: z.number().min(0).optional().nullable(),
  
  // KYC
  kycStatus: KYCStatusSchema.default('EN_ATTENTE'),
})

// ===========================================
// CREATE CLIENT SCHEMA (UNION)
// ===========================================

export const CreateClientSchema = z.discriminatedUnion('clientType', [
  ParticulierSchema,
  ProfessionnelSchema,
])

// ===========================================
// UPDATE CLIENT SCHEMA
// ===========================================

export const UpdateClientSchema = z.object({
  clientType: ClientTypeSchema.optional(),
  
  // Identité
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  mobile: z.string().optional().nullable(),
  address: AddressSchema.optional().nullable(),
  
  // Particulier
  civilite: z.enum(['M', 'MME', 'MLLE']).optional().nullable(),
  nomUsage: z.string().optional().nullable(),
  birthDate: z.coerce.date().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  maritalStatus: MaritalStatusSchema.optional().nullable(),
  matrimonialRegime: z.string().optional().nullable(),
  numberOfChildren: z.number().int().min(0).optional(),
  dependents: z.number().int().min(0).optional(),
  profession: z.string().optional().nullable(),
  professionCategory: z.string().optional().nullable(),
  employerName: z.string().optional().nullable(),
  employmentType: z.string().optional().nullable(),
  employmentSince: z.coerce.date().optional().nullable(),
  annualIncome: z.number().min(0).optional().nullable(),
  irTaxRate: z.number().min(0).max(100).optional().nullable(),
  ifiSubject: z.boolean().optional(),
  ifiAmount: z.number().min(0).optional().nullable(),
  taxResidenceCountry: z.string().optional().nullable(),
  riskProfile: RiskProfileSchema.optional().nullable(),
  investmentHorizon: InvestmentHorizonSchema.optional().nullable(),
  investmentGoals: z.array(z.string()).optional().nullable(),
  investmentKnowledge: z.string().optional().nullable(),
  investmentExperience: z.string().optional().nullable(),
  
  // Professionnel
  companyName: z.string().optional().nullable(),
  siret: z.string().length(14).optional().nullable(),
  legalForm: z.string().optional().nullable(),
  activitySector: z.string().optional().nullable(),
  companyCreationDate: z.coerce.date().optional().nullable(),
  numberOfEmployees: z.number().int().min(0).optional().nullable(),
  annualRevenue: z.number().min(0).optional().nullable(),
  
  // Statut
  status: ClientStatusSchema.optional(),
  kycStatus: KYCStatusSchema.optional(),
  isPEP: z.boolean().optional(),
  originOfFunds: z.string().optional().nullable(),
  
  // Conseiller
  conseillerId: z.string().cuid().optional(),
  conseillerRemplacantId: z.string().cuid().optional().nullable(),
  apporteurId: z.string().cuid().optional().nullable(),
})

// ===========================================
// TYPES
// ===========================================

export type ClientType = z.infer<typeof ClientTypeSchema>
export type ClientStatus = z.infer<typeof ClientStatusSchema>
export type MaritalStatus = z.infer<typeof MaritalStatusSchema>
export type RiskProfile = z.infer<typeof RiskProfileSchema>
export type InvestmentHorizon = z.infer<typeof InvestmentHorizonSchema>
export type KYCStatus = z.infer<typeof KYCStatusSchema>
export type Address = z.infer<typeof AddressSchema>
export type CreateClientInput = z.infer<typeof CreateClientSchema>
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>
