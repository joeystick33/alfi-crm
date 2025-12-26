// FILE: lib/validations/schemas/actif.schema.ts

import { z } from 'zod'

// ===========================================
// ENUMS
// ===========================================

export const ActifCategorySchema = z.enum([
  'IMMOBILIER',
  'FINANCIER',
  'EPARGNE_SALARIALE',
  'EPARGNE_RETRAITE',
  'PROFESSIONNEL',
  'MOBILIER',
  'AUTRE',
])

export const ActifTypeSchema = z.enum([
  // Immobilier
  'RESIDENCE_PRINCIPALE',
  'IMMOBILIER_LOCATIF',
  'RESIDENCE_SECONDAIRE',
  'IMMOBILIER_COMMERCIAL',
  'SCPI',
  'SCI',
  'OPCI',
  'CROWDFUNDING_IMMO',
  'VIAGER',
  'NUE_PROPRIETE',
  'USUFRUIT',
  
  // Épargne salariale
  'PEE',
  'PEG',
  'PERCO',
  'PERECO',
  'CET',
  'PARTICIPATION',
  'INTERESSEMENT',
  'STOCK_OPTIONS',
  'ACTIONS_GRATUITES',
  'BSPCE',
  
  // Épargne retraite
  'PER',
  'PERP',
  'MADELIN',
  'ARTICLE_83',
  'PREFON',
  'COREM',
  
  // Placements financiers
  'ASSURANCE_VIE',
  'CONTRAT_CAPITALISATION',
  'COMPTE_TITRES',
  'PEA',
  'PEA_PME',
  
  // Épargne bancaire
  'COMPTE_BANCAIRE',
  'LIVRETS',
  'PEL',
  'CEL',
  'COMPTE_A_TERME',
  
  // Actifs professionnels
  'PARTS_SOCIALES',
  'IMMOBILIER_PRO',
  'MATERIEL_PRO',
  'FONDS_COMMERCE',
  'BREVETS_PI',
  
  // Mobilier & Divers
  'METAUX_PRECIEUX',
  'BIJOUX',
  'OEUVRES_ART',
  'VINS',
  'MONTRES',
  'VEHICULES',
  'MOBILIER',
  'CRYPTO',
  'NFT',
  
  'AUTRE',
])

// ===========================================
// CREATE ACTIF SCHEMA
// ===========================================

export const CreateActifSchema = z.object({
  // Identification
  type: ActifTypeSchema,
  category: ActifCategorySchema,
  name: z.string().min(1, 'Le nom est requis'),
  description: z.string().optional().nullable(),
  
  // Valeurs (en centimes ou montant exact selon config)
  value: z.number().min(0, 'La valeur doit être positive'),
  acquisitionDate: z.coerce.date().optional().nullable(),
  acquisitionValue: z.number().min(0).optional().nullable(),
  annualIncome: z.number().min(0).optional().nullable(),
  
  // Gestion
  managedByFirm: z.boolean().default(false),
  managementFees: z.number().min(0).max(100).optional().nullable(),
  
  // Localisation
  location: z.string().optional().nullable(),
  currency: z.string().default('EUR'),
  
  // Détails spécifiques (JSON)
  details: z.record(z.string(), z.unknown()).optional().nullable(),
  taxDetails: z.record(z.string(), z.unknown()).optional().nullable(),
  
  // Propriété
  ownershipPercentage: z.number().min(0).max(100).default(100),
  ownershipType: z.string().optional().nullable(),
  
  // Liaison avec passif
  linkedPassifId: z.string().cuid().optional().nullable(),
})

// ===========================================
// UPDATE ACTIF SCHEMA
// ===========================================

export const UpdateActifSchema = z.object({
  type: ActifTypeSchema.optional(),
  category: ActifCategorySchema.optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  
  value: z.number().min(0).optional(),
  acquisitionDate: z.coerce.date().optional().nullable(),
  acquisitionValue: z.number().min(0).optional().nullable(),
  annualIncome: z.number().min(0).optional().nullable(),
  
  managedByFirm: z.boolean().optional(),
  managementFees: z.number().min(0).max(100).optional().nullable(),
  
  location: z.string().optional().nullable(),
  currency: z.string().optional(),
  
  details: z.record(z.string(), z.unknown()).optional().nullable(),
  taxDetails: z.record(z.string(), z.unknown()).optional().nullable(),
  
  ownershipPercentage: z.number().min(0).max(100).optional(),
  ownershipType: z.string().optional().nullable(),
  
  linkedPassifId: z.string().cuid().optional().nullable(),
  
  isActive: z.boolean().optional(),
})

// ===========================================
// IMMOBILIER SPECIFIC SCHEMA
// ===========================================

export const ImmobilierDetailsSchema = z.object({
  // Adresse
  propertyAddress: z.string().optional(),
  propertyCity: z.string().optional(),
  propertyPostalCode: z.string().optional(),
  propertySurface: z.number().min(0).optional(),
  propertyRooms: z.number().int().min(0).optional(),
  propertyType: z.string().optional(),
  propertyCondition: z.string().optional(),
  propertyParkingSpaces: z.number().int().min(0).optional(),
  
  // Locatif
  rentalScheme: z.string().optional(),
  rentalSchemeStartDate: z.coerce.date().optional(),
  rentalSchemeEndDate: z.coerce.date().optional(),
  rentalMonthlyRent: z.number().min(0).optional(),
  rentalCharges: z.number().min(0).optional(),
  rentalOccupancyRate: z.number().min(0).max(100).optional(),
  rentalTenantName: z.string().optional(),
  rentalLeaseEndDate: z.coerce.date().optional(),
  
  // IFI
  fiscalPropertyType: z.string().optional(),
  fiscalRpAbatement: z.boolean().optional(),
  fiscalManualDiscount: z.number().min(0).max(100).optional(),
  fiscalIfiValue: z.number().min(0).optional(),
  
  // Démembrement
  dismembermentType: z.string().optional(),
  dismembermentEndDate: z.coerce.date().optional(),
  usufructuaryName: z.string().optional(),
  bareOwnerName: z.string().optional(),
})

// ===========================================
// ASSURANCE VIE SPECIFIC SCHEMA
// ===========================================

export const AssuranceVieDetailsSchema = z.object({
  insurerName: z.string().optional(),
  contractNumber: z.string().optional(),
  contractOpenDate: z.coerce.date().optional(),
  beneficiaryClause: z.string().optional(),
  beneficiaryClauseType: z.string().optional(),
  beneficiaries: z.array(z.object({
    name: z.string(),
    percentage: z.number().min(0).max(100),
    rank: z.number().int().min(1).optional(),
    relationship: z.string().optional(),
  })).optional(),
  totalPremiums: z.number().min(0).optional(),
  premiumsBefore70: z.number().min(0).optional(),
  premiumsAfter70: z.number().min(0).optional(),
  surrenderValue: z.number().min(0).optional(),
  unrealizedGains: z.number().optional(),
  fundsAllocation: z.array(z.object({
    fundName: z.string(),
    isin: z.string().optional(),
    percentage: z.number().min(0).max(100),
    value: z.number().min(0).optional(),
    type: z.enum(['EURO', 'UC']),
  })).optional(),
  euroFundRate: z.number().min(0).max(100).optional(),
  managementMode: z.string().optional(),
})

// ===========================================
// TYPES
// ===========================================

export type ActifCategory = z.infer<typeof ActifCategorySchema>
export type ActifType = z.infer<typeof ActifTypeSchema>
export type CreateActifInput = z.infer<typeof CreateActifSchema>
export type UpdateActifInput = z.infer<typeof UpdateActifSchema>
export type ImmobilierDetails = z.infer<typeof ImmobilierDetailsSchema>
export type AssuranceVieDetails = z.infer<typeof AssuranceVieDetailsSchema>
