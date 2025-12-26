/**
 * Schémas Zod de validation pour le module Opérations
 * 
 * Ce fichier contient tous les schémas de validation pour les inputs
 * du module opérations (Affaires Nouvelles, Opérations de Gestion, Providers)
 * 
 * @module lib/operations/schemas
 */

import { z } from 'zod';
import {
  PRODUCT_TYPES,
  AFFAIRE_STATUS,
  AFFAIRE_SOURCE,
  OPERATION_GESTION_TYPES,
  OPERATION_GESTION_STATUS,
  PROVIDER_TYPES,
  CONVENTION_STATUS,
} from './types';

// ============================================
// Common Schemas
// ============================================

/**
 * Schéma pour un ID CUID
 */
export const cuidSchema = z.string().cuid();

/**
 * Schéma pour une date
 */
export const dateSchema = z.coerce.date();

/**
 * Schéma pour une date optionnelle
 */
export const optionalDateSchema = z.coerce.date().optional().nullable();

/**
 * Schéma pour un montant décimal positif
 */
export const positiveDecimalSchema = z.number().positive();

/**
 * Schéma pour un pourcentage (0-100)
 */
export const percentageSchema = z.number().min(0).max(100);

// ============================================
// Product Type Schemas
// ============================================

/**
 * Schéma pour le type de produit
 */
export const productTypeSchema = z.enum(PRODUCT_TYPES);

// ============================================
// Fund Allocation Schemas
// ============================================

/**
 * Schéma pour une allocation de fonds
 */
export const fundAllocationSchema = z.object({
  fundId: z.string().min(1),
  fundName: z.string().min(1).max(255),
  percentage: percentageSchema,
});

/**
 * Schéma pour un tableau d'allocations (doit totaliser 100%)
 */
export const fundAllocationsSchema = z.array(fundAllocationSchema).refine(
  (allocations) => {
    if (allocations.length === 0) return true;
    const total = allocations.reduce((sum, a) => sum + a.percentage, 0);
    return Math.abs(total - 100) < 0.01; // Tolérance pour les erreurs d'arrondi
  },
  { message: 'Le total des allocations doit être égal à 100%' }
);

// ============================================
// Affaire Nouvelle Schemas
// ============================================

/**
 * Schéma pour le statut d'affaire
 */
export const affaireStatusSchema = z.enum(AFFAIRE_STATUS);

/**
 * Schéma pour la source d'affaire
 */
export const affaireSourceSchema = z.enum(AFFAIRE_SOURCE);

/**
 * Schéma pour les détails produit Assurance Vie
 */
export const assuranceVieDetailsSchema = z.object({
  type: z.literal('ASSURANCE_VIE'),
  allocation: fundAllocationsSchema,
  beneficiaryClause: z.string().min(1).max(5000),
  paymentMode: z.enum(['UNIQUE', 'PROGRAMME', 'LIBRE']),
});

/**
 * Schéma pour les détails produit PER
 */
export const perDetailsSchema = z.object({
  type: z.enum(['PER_INDIVIDUEL', 'PER_ENTREPRISE']),
  compartment: z.enum(['INDIVIDUEL', 'COLLECTIF', 'OBLIGATOIRE']),
  beneficiaryClause: z.string().min(1).max(5000),
  exitOptions: z.array(z.enum(['CAPITAL', 'RENTE', 'MIXTE'])).min(1),
});

/**
 * Schéma pour les détails produit SCPI/OPCI
 */
export const scpiOpciDetailsSchema = z.object({
  type: z.enum(['SCPI', 'OPCI']),
  numberOfShares: z.number().int().positive(),
  paymentSchedule: z.array(z.object({
    date: dateSchema,
    amount: positiveDecimalSchema,
    status: z.enum(['PENDING', 'PAID']),
  })),
  dismemberment: z.object({
    type: z.enum(['NUE_PROPRIETE', 'USUFRUIT']),
    duration: z.number().int().positive().nullable(),
    counterpartyId: cuidSchema.nullable(),
  }).nullable(),
});

/**
 * Schéma pour les détails produit Compte-titres/PEA
 */
export const compteTitresDetailsSchema = z.object({
  type: z.enum(['COMPTE_TITRES', 'PEA', 'PEA_PME']),
  allocation: fundAllocationsSchema,
  mandateType: z.enum(['CONSEIL', 'GESTION_PILOTEE', 'GESTION_LIBRE']),
});

/**
 * Schéma pour les détails produit Private Equity
 */
export const privateEquityDetailsSchema = z.object({
  type: z.enum(['FCPR', 'FCPI', 'FIP']),
  commitmentAmount: positiveDecimalSchema,
  callSchedule: z.array(z.object({
    callNumber: z.number().int().positive(),
    expectedDate: dateSchema,
    percentage: percentageSchema,
    status: z.enum(['PENDING', 'CALLED', 'PAID']),
  })),
  lockUpPeriod: z.number().int().positive(), // En mois
});

/**
 * Schéma pour les détails produit Capitalisation
 */
export const capitalisationDetailsSchema = z.object({
  type: z.literal('CAPITALISATION'),
  allocation: fundAllocationsSchema,
  beneficiaryClause: z.string().min(1).max(5000),
  paymentMode: z.enum(['UNIQUE', 'PROGRAMME', 'LIBRE']),
});

/**
 * Schéma pour les détails produit générique
 */
export const otherProductDetailsSchema = z.object({
  type: z.enum(['IMMOBILIER_DIRECT', 'CREDIT_IMMOBILIER', 'OTHER']),
  data: z.record(z.string(), z.unknown()),
});

/**
 * Schéma union pour les détails produit
 */
export const affaireProductDetailsSchema = z.discriminatedUnion('type', [
  assuranceVieDetailsSchema,
  perDetailsSchema.extend({ type: z.literal('PER_INDIVIDUEL') }),
  perDetailsSchema.extend({ type: z.literal('PER_ENTREPRISE') }),
  scpiOpciDetailsSchema.extend({ type: z.literal('SCPI') }),
  scpiOpciDetailsSchema.extend({ type: z.literal('OPCI') }),
  compteTitresDetailsSchema.extend({ type: z.literal('COMPTE_TITRES') }),
  compteTitresDetailsSchema.extend({ type: z.literal('PEA') }),
  compteTitresDetailsSchema.extend({ type: z.literal('PEA_PME') }),
  capitalisationDetailsSchema,
  privateEquityDetailsSchema.extend({ type: z.literal('FCPR') }),
  privateEquityDetailsSchema.extend({ type: z.literal('FCPI') }),
  privateEquityDetailsSchema.extend({ type: z.literal('FIP') }),
  otherProductDetailsSchema.extend({ type: z.literal('IMMOBILIER_DIRECT') }),
  otherProductDetailsSchema.extend({ type: z.literal('CREDIT_IMMOBILIER') }),
  otherProductDetailsSchema.extend({ type: z.literal('OTHER') }),
]);

/**
 * Schéma pour créer une affaire nouvelle
 */
export const createAffaireSchema = z.object({
  cabinetId: cuidSchema,
  clientId: cuidSchema,
  productType: productTypeSchema,
  providerId: cuidSchema,
  productId: cuidSchema.optional(),
  source: affaireSourceSchema,
  estimatedAmount: positiveDecimalSchema,
  targetDate: optionalDateSchema,
  productDetails: affaireProductDetailsSchema.optional(),
  createdById: cuidSchema,
});

/**
 * Schéma pour mettre à jour le statut d'une affaire
 */
export const updateAffaireStatusSchema = z.object({
  affaireId: cuidSchema,
  newStatus: affaireStatusSchema,
  userId: cuidSchema,
  note: z.string().max(2000).optional(),
  rejectionReason: z.string().max(2000).optional(),
  cancellationReason: z.string().max(2000).optional(),
}).check((ctx) => {
  if (ctx.value.newStatus === 'REJETE' && !ctx.value.rejectionReason) {
    ctx.issues.push({
      code: 'custom',
      message: 'La raison du rejet est obligatoire',
      input: ctx.value,
      path: ['rejectionReason'],
    });
  }
  if (ctx.value.newStatus === 'ANNULE' && !ctx.value.cancellationReason) {
    ctx.issues.push({
      code: 'custom',
      message: "La raison de l'annulation est obligatoire",
      input: ctx.value,
      path: ['cancellationReason'],
    });
  }
});

/**
 * Schéma pour les filtres d'affaires
 */
export const affaireFiltersSchema = z.object({
  status: z.array(affaireStatusSchema).optional(),
  productType: z.array(productTypeSchema).optional(),
  providerId: cuidSchema.optional(),
  source: z.array(affaireSourceSchema).optional(),
  clientId: cuidSchema.optional(),
  dateFrom: optionalDateSchema,
  dateTo: optionalDateSchema,
  enCoursOnly: z.boolean().optional(),
}).check((ctx) => {
  if (ctx.value.dateFrom && ctx.value.dateTo) {
    if (ctx.value.dateFrom > ctx.value.dateTo) {
      ctx.issues.push({
        code: 'custom',
        message: 'La date de début doit être antérieure à la date de fin',
        input: ctx.value,
        path: ['dateFrom'],
      });
    }
  }
});

// ============================================
// Operation Gestion Schemas
// ============================================

/**
 * Schéma pour le type d'opération de gestion
 */
export const operationGestionTypeSchema = z.enum(OPERATION_GESTION_TYPES);

/**
 * Schéma pour le statut d'opération de gestion
 */
export const operationGestionStatusSchema = z.enum(OPERATION_GESTION_STATUS);

/**
 * Schéma pour la simulation fiscale
 */
export const taxSimulationSchema = z.object({
  contractAge: z.number().int().min(0),
  totalGains: z.number(),
  taxableAmount: z.number().min(0),
  estimatedTax: z.number().min(0),
  taxRate: percentageSchema,
  socialCharges: z.number().min(0),
});

/**
 * Schéma pour les détails d'arbitrage
 */
export const arbitrageDetailsSchema = z.object({
  type: z.literal('ARBITRAGE'),
  sourceAllocations: fundAllocationsSchema,
  targetAllocations: fundAllocationsSchema,
  arbitrageType: z.enum(['PONCTUEL', 'PROGRAMME']),
});

/**
 * Schéma pour les détails de rachat
 */
export const rachatDetailsSchema = z.object({
  type: z.enum(['RACHAT_PARTIEL', 'RACHAT_TOTAL']),
  destinationRib: z.string().min(1).max(50),
  taxSimulation: taxSimulationSchema,
});

/**
 * Schéma pour les détails de versement complémentaire
 */
export const versementDetailsSchema = z.object({
  type: z.literal('VERSEMENT_COMPLEMENTAIRE'),
  allocation: fundAllocationsSchema,
  allocationMode: z.enum(['IDENTIQUE', 'NOUVELLE']),
});

/**
 * Schéma pour les détails de modification bénéficiaire
 */
export const modificationBeneficiaireDetailsSchema = z.object({
  type: z.literal('MODIFICATION_BENEFICIAIRE'),
  newClause: z.string().min(1).max(5000),
  previousClause: z.string().min(1).max(5000),
});

/**
 * Schéma pour les détails d'avance
 */
export const avanceDetailsSchema = z.object({
  type: z.literal('AVANCE'),
  duration: z.number().int().positive(), // En mois
  interestRate: percentageSchema,
});

/**
 * Schéma pour les détails de transfert
 */
export const transfertDetailsSchema = z.object({
  type: z.literal('TRANSFERT'),
  targetProviderId: cuidSchema,
  targetProductId: cuidSchema,
});

/**
 * Schéma pour les détails de changement d'option de gestion
 */
export const changementOptionGestionDetailsSchema = z.object({
  type: z.literal('CHANGEMENT_OPTION_GESTION'),
  newOption: z.string().min(1).max(255),
  previousOption: z.string().min(1).max(255),
});

/**
 * Schéma pour les détails génériques
 */
export const otherOperationDetailsSchema = z.object({
  type: z.literal('OTHER'),
  data: z.record(z.string(), z.unknown()),
});

/**
 * Schéma union pour les détails d'opération de gestion
 */
export const operationGestionDetailsSchema = z.discriminatedUnion('type', [
  arbitrageDetailsSchema,
  rachatDetailsSchema.extend({ type: z.literal('RACHAT_PARTIEL') }),
  rachatDetailsSchema.extend({ type: z.literal('RACHAT_TOTAL') }),
  versementDetailsSchema,
  modificationBeneficiaireDetailsSchema,
  avanceDetailsSchema,
  transfertDetailsSchema,
  changementOptionGestionDetailsSchema,
  otherOperationDetailsSchema,
]);

/**
 * Schéma pour créer une opération de gestion
 */
export const createOperationGestionSchema = z.object({
  cabinetId: cuidSchema,
  clientId: cuidSchema,
  contractId: z.string().min(1).max(100),
  affaireOrigineId: cuidSchema,
  type: operationGestionTypeSchema,
  amount: positiveDecimalSchema.optional(),
  effectiveDate: optionalDateSchema,
  operationDetails: operationGestionDetailsSchema.optional(),
  createdById: cuidSchema,
});

/**
 * Schéma pour mettre à jour le statut d'une opération de gestion
 */
export const updateOperationGestionStatusSchema = z.object({
  operationId: cuidSchema,
  newStatus: operationGestionStatusSchema,
  userId: cuidSchema,
  note: z.string().max(2000).optional(),
  rejectionReason: z.string().max(2000).optional(),
}).check((ctx) => {
  if (ctx.value.newStatus === 'REJETE' && !ctx.value.rejectionReason) {
    ctx.issues.push({
      code: 'custom',
      message: 'La raison du rejet est obligatoire',
      input: ctx.value,
      path: ['rejectionReason'],
    });
  }
});

/**
 * Schéma pour les filtres d'opérations de gestion
 */
export const operationGestionFiltersSchema = z.object({
  status: z.array(operationGestionStatusSchema).optional(),
  type: z.array(operationGestionTypeSchema).optional(),
  clientId: cuidSchema.optional(),
  contractId: z.string().optional(),
  dateFrom: optionalDateSchema,
  dateTo: optionalDateSchema,
}).check((ctx) => {
  if (ctx.value.dateFrom && ctx.value.dateTo) {
    if (ctx.value.dateFrom > ctx.value.dateTo) {
      ctx.issues.push({
        code: 'custom',
        message: 'La date de début doit être antérieure à la date de fin',
        input: ctx.value,
        path: ['dateFrom'],
      });
    }
  }
});

// ============================================
// Provider Schemas
// ============================================

/**
 * Schéma pour le type de fournisseur
 */
export const providerTypeSchema = z.enum(PROVIDER_TYPES);

/**
 * Schéma pour le statut de convention
 */
export const conventionStatusSchema = z.enum(CONVENTION_STATUS);

/**
 * Schéma pour les informations de contact
 */
export const contactInfoSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email(),
  phone: z.string().max(20).nullable(),
});

/**
 * Schéma pour créer un fournisseur
 */
export const createProviderSchema = z.object({
  cabinetId: cuidSchema,
  name: z.string().min(1).max(255),
  type: providerTypeSchema,
  siren: z.string().length(9).regex(/^\d{9}$/).optional(),
  address: z.string().max(500).optional(),
  commercialContact: contactInfoSchema.optional(),
  backOfficeContact: contactInfoSchema.optional(),
  extranetUrl: z.string().url().optional(),
  extranetNotes: z.string().max(2000).optional(),
  commissionGridUrl: z.string().url().optional(),
  conventionStatus: conventionStatusSchema.default('ACTIVE'),
  isFavorite: z.boolean().default(false),
  notes: z.string().max(2000).optional(),
});

/**
 * Schéma pour mettre à jour un fournisseur
 */
export const updateProviderSchema = createProviderSchema.partial().omit({ cabinetId: true });

// ============================================
// Product Schemas
// ============================================

/**
 * Schéma pour les caractéristiques de produit
 */
export const productCharacteristicsSchema = z.object({
  entryFees: z.object({
    min: percentageSchema,
    max: percentageSchema,
    default: percentageSchema,
  }),
  managementFees: z.object({
    min: percentageSchema,
    max: percentageSchema,
    default: percentageSchema,
  }),
  exitFees: percentageSchema.nullable(),
  options: z.array(z.string()),
});

/**
 * Schéma pour un fonds
 */
export const fundSchema = z.object({
  id: z.string().min(1),
  isin: z.string().length(12),
  name: z.string().min(1).max(255),
  category: z.string().min(1).max(100),
  riskLevel: z.number().int().min(1).max(7),
  ongoingCharges: percentageSchema,
});

/**
 * Schéma pour créer un produit
 */
export const createProductSchema = z.object({
  providerId: cuidSchema,
  name: z.string().min(1).max(255),
  code: z.string().min(1).max(50),
  type: productTypeSchema,
  characteristics: productCharacteristicsSchema,
  availableFunds: z.array(fundSchema).optional(),
  minimumInvestment: positiveDecimalSchema,
  documentTemplates: z.array(cuidSchema).optional(),
  isActive: z.boolean().default(true),
});

/**
 * Schéma pour mettre à jour un produit
 */
export const updateProductSchema = createProductSchema.partial().omit({ providerId: true });

// ============================================
// Type Exports
// ============================================

export type CreateAffaireInput = z.infer<typeof createAffaireSchema>;
export type UpdateAffaireStatusInput = z.infer<typeof updateAffaireStatusSchema>;
export type AffaireFiltersInput = z.infer<typeof affaireFiltersSchema>;
export type AffaireProductDetailsInput = z.infer<typeof affaireProductDetailsSchema>;

export type CreateOperationGestionInput = z.infer<typeof createOperationGestionSchema>;
export type UpdateOperationGestionStatusInput = z.infer<typeof updateOperationGestionStatusSchema>;
export type OperationGestionFiltersInput = z.infer<typeof operationGestionFiltersSchema>;
export type OperationGestionDetailsInput = z.infer<typeof operationGestionDetailsSchema>;

export type CreateProviderInput = z.infer<typeof createProviderSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderSchema>;
export type ContactInfoInput = z.infer<typeof contactInfoSchema>;

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductCharacteristicsInput = z.infer<typeof productCharacteristicsSchema>;
export type FundInput = z.infer<typeof fundSchema>;
