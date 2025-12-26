/**
 * Schémas Zod de validation pour le module Documents Réglementaires
 * 
 * Ce fichier contient tous les schémas de validation pour les inputs
 * du module documents (Templates, Documents générés, MiFID)
 * 
 * @module lib/documents/schemas
 */

import { z } from 'zod';
import {
  REGULATORY_DOCUMENT_TYPES,
  ASSOCIATION_TYPES,
  DOCUMENT_FORMATS,
  DOCUMENT_STATUS,
  MIFID_RISK_PROFILES,
  MIFID_INVESTMENT_HORIZONS,
} from './types';
import { PRODUCT_TYPES } from '../operations/types';

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
 * Schéma pour une couleur hexadécimale
 */
export const hexColorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/);

// ============================================
// Document Type Schemas
// ============================================

/**
 * Schéma pour le type de document réglementaire
 */
export const regulatoryDocumentTypeSchema = z.enum(REGULATORY_DOCUMENT_TYPES);

/**
 * Schéma pour le type d'association
 */
export const associationTypeSchema = z.enum(ASSOCIATION_TYPES);

/**
 * Schéma pour le format de document
 */
export const documentFormatSchema = z.enum(DOCUMENT_FORMATS);

/**
 * Schéma pour le statut de document
 */
export const documentStatusSchema = z.enum(DOCUMENT_STATUS);

/**
 * Schéma pour le type de produit
 */
export const productTypeSchema = z.enum(PRODUCT_TYPES);

// ============================================
// Template Schemas
// ============================================

/**
 * Schéma pour une section de template
 */
export const templateSectionSchema = z.object({
  id: z.string().min(1).max(50),
  title: z.string().min(1).max(255),
  content: z.string().min(1).max(50000), // Markdown avec placeholders
  isMandatory: z.boolean(),
  order: z.number().int().min(0),
});

/**
 * Schéma pour les styles de document
 */
export const documentStylesSchema = z.object({
  primaryColor: hexColorSchema,
  secondaryColor: hexColorSchema,
  fontFamily: z.string().min(1).max(100),
  logoUrl: z.string().url().nullable(),
  headerHeight: z.number().int().min(0).max(500),
  footerHeight: z.number().int().min(0).max(200),
});

/**
 * Schéma pour le contenu d'un template
 */
export const documentTemplateContentSchema = z.object({
  header: templateSectionSchema,
  sections: z.array(templateSectionSchema).min(1),
  footer: templateSectionSchema,
  styles: documentStylesSchema,
});

/**
 * Schéma pour créer un template de document
 */
export const createDocumentTemplateSchema = z.object({
  cabinetId: cuidSchema,
  documentType: regulatoryDocumentTypeSchema,
  associationType: associationTypeSchema.default('GENERIC'),
  providerId: cuidSchema.optional(),
  name: z.string().min(1).max(255),
  version: z.string().min(1).max(20),
  content: documentTemplateContentSchema,
  mandatorySections: z.array(z.string()),
  customizableSections: z.array(z.string()),
  createdById: cuidSchema,
});

/**
 * Schéma pour mettre à jour un template de document
 */
export const updateDocumentTemplateSchema = createDocumentTemplateSchema
  .partial()
  .omit({ cabinetId: true, createdById: true });

/**
 * Schéma pour les filtres de templates
 */
export const documentTemplateFiltersSchema = z.object({
  documentType: z.array(regulatoryDocumentTypeSchema).optional(),
  associationType: z.array(associationTypeSchema).optional(),
  providerId: cuidSchema.optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// Generated Document Schemas
// ============================================

/**
 * Schéma pour le rôle du signataire
 */
export const signerRoleSchema = z.enum(['CLIENT', 'ADVISOR', 'WITNESS']);

/**
 * Schéma pour un signataire
 */
export const signerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role: signerRoleSchema,
  order: z.number().int().min(1),
});

/**
 * Schéma pour le statut d'un signataire
 */
export const signerStatusSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  role: signerRoleSchema,
  order: z.number().int().min(1),
  status: z.enum(['PENDING', 'SIGNED', 'REJECTED']),
  signedAt: optionalDateSchema,
});

/**
 * Schéma pour le statut de signature
 */
export const signatureStatusSchema = z.object({
  signatureRequestId: z.string().min(1),
  signers: z.array(signerStatusSchema),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'PARTIALLY_SIGNED', 'SIGNED', 'REJECTED', 'EXPIRED']),
  sentAt: dateSchema,
  completedAt: optionalDateSchema,
});

/**
 * Schéma pour générer un document
 */
export const generateDocumentSchema = z.object({
  cabinetId: cuidSchema,
  clientId: cuidSchema,
  affaireId: cuidSchema.optional(),
  operationId: cuidSchema.optional(),
  templateId: cuidSchema,
  documentType: regulatoryDocumentTypeSchema,
  format: documentFormatSchema,
  generatedById: cuidSchema,
  customData: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schéma pour envoyer un document pour signature
 */
export const sendForSignatureSchema = z.object({
  documentId: cuidSchema,
  signers: z.array(signerSchema).min(1),
});

/**
 * Schéma pour les filtres de documents générés
 */
export const generatedDocumentFiltersSchema = z.object({
  documentType: z.array(regulatoryDocumentTypeSchema).optional(),
  status: z.array(documentStatusSchema).optional(),
  clientId: cuidSchema.optional(),
  affaireId: cuidSchema.optional(),
  operationId: cuidSchema.optional(),
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
// Document Requirements Schemas
// ============================================

/**
 * Schéma pour une condition de document
 */
export const documentConditionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ALWAYS') }),
  z.object({ type: z.literal('IF_FIRST_RELATION') }),
  z.object({ type: z.literal('IF_OUTDATED'), maxAgeDays: z.number().int().positive() }),
  z.object({ type: z.literal('IF_AMOUNT_ABOVE'), threshold: z.number().positive() }),
  z.object({ type: z.literal('IF_PRODUCT_TYPE'), productTypes: z.array(productTypeSchema).min(1) }),
  z.object({ type: z.literal('IF_ALLOCATION_CHANGED') }),
]);

/**
 * Schéma pour un requirement de document
 */
export const documentRequirementSchema = z.object({
  documentType: regulatoryDocumentTypeSchema,
  condition: documentConditionSchema,
  isBlocking: z.boolean(),
});

// ============================================
// Document Export Schemas
// ============================================

/**
 * Schéma pour les options d'export
 */
export const documentExportOptionsSchema = z.object({
  format: documentFormatSchema,
  includeSignaturePlaceholders: z.boolean().default(true),
  applyBranding: z.boolean().default(true),
  watermark: z.string().max(100).optional(),
});

/**
 * Schéma pour l'export batch
 */
export const batchExportSchema = z.object({
  documentIds: z.array(cuidSchema).min(1).max(50),
  options: documentExportOptionsSchema,
});

// ============================================
// MiFID Questionnaire Schemas
// ============================================

/**
 * Schéma pour le profil de risque MiFID
 */
export const mifidRiskProfileSchema = z.enum(MIFID_RISK_PROFILES);

/**
 * Schéma pour l'horizon d'investissement MiFID
 */
export const mifidInvestmentHorizonSchema = z.enum(MIFID_INVESTMENT_HORIZONS);

/**
 * Schéma pour une option de question MiFID
 */
export const mifidQuestionOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1).max(500),
  score: z.number().int().min(0),
});

/**
 * Schéma pour une question MiFID
 */
export const mifidQuestionSchema = z.object({
  id: z.string().min(1).max(50),
  text: z.string().min(1).max(1000),
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'SCALE', 'TEXT']),
  options: z.array(mifidQuestionOptionSchema).optional(),
  required: z.boolean(),
});

/**
 * Schéma pour une section du questionnaire MiFID
 */
export const mifidQuestionnaireSectionSchema = z.object({
  id: z.string().min(1).max(50),
  title: z.string().min(1).max(255),
  questions: z.array(mifidQuestionSchema).min(1),
});

/**
 * Schéma pour une réponse MiFID
 */
export const mifidAnswerSchema = z.object({
  questionId: z.string().min(1),
  value: z.union([
    z.string(),
    z.array(z.string()),
    z.number(),
  ]),
});

/**
 * Schéma pour sauvegarder les réponses MiFID
 */
export const saveMifidAnswersSchema = z.object({
  clientId: cuidSchema,
  answers: z.array(mifidAnswerSchema).min(1),
  userId: cuidSchema,
});

/**
 * Schéma pour le résultat du questionnaire MiFID
 */
export const mifidQuestionnaireResultSchema = z.object({
  clientId: cuidSchema,
  completedAt: dateSchema,
  answers: z.array(mifidAnswerSchema),
  riskProfile: mifidRiskProfileSchema,
  investmentHorizon: mifidInvestmentHorizonSchema,
  totalScore: z.number().int().min(0),
  recommendations: z.array(z.string()),
});

// ============================================
// Type Exports
// ============================================

export type CreateDocumentTemplateInput = z.infer<typeof createDocumentTemplateSchema>;
export type UpdateDocumentTemplateInput = z.infer<typeof updateDocumentTemplateSchema>;
export type DocumentTemplateFiltersInput = z.infer<typeof documentTemplateFiltersSchema>;
export type DocumentTemplateContentInput = z.infer<typeof documentTemplateContentSchema>;
export type TemplateSectionInput = z.infer<typeof templateSectionSchema>;
export type DocumentStylesInput = z.infer<typeof documentStylesSchema>;

export type GenerateDocumentInput = z.infer<typeof generateDocumentSchema>;
export type SendForSignatureInput = z.infer<typeof sendForSignatureSchema>;
export type GeneratedDocumentFiltersInput = z.infer<typeof generatedDocumentFiltersSchema>;
export type SignerInput = z.infer<typeof signerSchema>;
export type SignerStatusInput = z.infer<typeof signerStatusSchema>;
export type SignatureStatusInput = z.infer<typeof signatureStatusSchema>;

export type DocumentConditionInput = z.infer<typeof documentConditionSchema>;
export type DocumentRequirementInput = z.infer<typeof documentRequirementSchema>;

export type DocumentExportOptionsInput = z.infer<typeof documentExportOptionsSchema>;
export type BatchExportInput = z.infer<typeof batchExportSchema>;

export type MiFIDAnswerInput = z.infer<typeof mifidAnswerSchema>;
export type SaveMiFIDAnswersInput = z.infer<typeof saveMifidAnswersSchema>;
export type MiFIDQuestionnaireResultInput = z.infer<typeof mifidQuestionnaireResultSchema>;
export type MiFIDQuestionInput = z.infer<typeof mifidQuestionSchema>;
export type MiFIDQuestionnaireSectionInput = z.infer<typeof mifidQuestionnaireSectionSchema>;
