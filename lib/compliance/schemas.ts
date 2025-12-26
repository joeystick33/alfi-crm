/**
 * Schémas Zod de validation pour le module Conformité
 * 
 * Ce fichier contient tous les schémas de validation pour les inputs
 * du module conformité (KYC, Alertes, Contrôles, Réclamations)
 * 
 * @module lib/compliance/schemas
 */

import { z } from 'zod';
import {
  KYC_DOCUMENT_TYPES,
  KYC_DOCUMENT_STATUS,
  ALERT_SEVERITY,
  ALERT_TYPES,
  CONTROL_TYPES,
  CONTROL_STATUS,
  CONTROL_PRIORITY,
  RISK_LEVELS,
  RECLAMATION_TYPES,
  RECLAMATION_STATUS,
  SLA_SEVERITY,
  TIMELINE_EVENT_TYPES,
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
 * Schéma pour la pagination
 * @requirements 2.8, 4.6, 5.7 - Pagination pour les listes
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Type pour les résultats paginés
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

// ============================================
// KYC Document Schemas
// ============================================

/**
 * Schéma pour le type de document KYC
 */
export const kycDocumentTypeSchema = z.enum(KYC_DOCUMENT_TYPES);

/**
 * Schéma pour le statut de document KYC
 */
export const kycDocumentStatusSchema = z.enum(KYC_DOCUMENT_STATUS);

/**
 * Schéma pour créer un document KYC
 */
export const createKYCDocumentSchema = z.object({
  cabinetId: cuidSchema,
  clientId: cuidSchema,
  type: kycDocumentTypeSchema,
  fileName: z.string().min(1).max(255).optional(),
  fileUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Schéma pour valider un document KYC
 */
export const validateKYCDocumentSchema = z.object({
  documentId: cuidSchema,
  validatedById: cuidSchema,
  notes: z.string().max(1000).optional(),
});

/**
 * Schéma pour rejeter un document KYC
 */
export const rejectKYCDocumentSchema = z.object({
  documentId: cuidSchema,
  rejectionReason: z.string().min(1, 'La raison du rejet est obligatoire').max(1000),
  validatedById: cuidSchema,
});

/**
 * Schéma pour les filtres de documents
 */
export const documentFiltersSchema = z.object({
  status: z.array(kycDocumentStatusSchema).optional(),
  type: z.array(kycDocumentTypeSchema).optional(),
  clientId: cuidSchema.optional(),
  expirationDateFrom: optionalDateSchema,
  expirationDateTo: optionalDateSchema,
}).check((ctx) => {
  if (ctx.value.expirationDateFrom && ctx.value.expirationDateTo) {
    if (ctx.value.expirationDateFrom > ctx.value.expirationDateTo) {
      ctx.issues.push({
        code: 'custom',
        message: 'La date de début doit être antérieure à la date de fin',
        input: ctx.value,
        path: ['expirationDateFrom'],
      });
    }
  }
});

// ============================================
// Alert Schemas
// ============================================

/**
 * Schéma pour la sévérité d'alerte
 */
export const alertSeveritySchema = z.enum(ALERT_SEVERITY);

/**
 * Schéma pour le type d'alerte
 */
export const alertTypeSchema = z.enum(ALERT_TYPES);

/**
 * Schéma pour créer une alerte
 */
export const createAlertSchema = z.object({
  cabinetId: cuidSchema,
  clientId: cuidSchema.optional(),
  operationId: cuidSchema.optional(),
  type: alertTypeSchema,
  severity: alertSeveritySchema,
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  actionRequired: z.string().min(1).max(500),
  actionUrl: z.string().url().optional(),
});

/**
 * Schéma pour acquitter une alerte
 */
export const acknowledgeAlertSchema = z.object({
  alertId: cuidSchema,
  acknowledgedById: cuidSchema,
});

/**
 * Schéma pour les filtres d'alertes
 */
export const alertFiltersSchema = z.object({
  severity: z.array(alertSeveritySchema).optional(),
  type: z.array(alertTypeSchema).optional(),
  acknowledged: z.boolean().optional(),
  resolved: z.boolean().optional(),
  clientId: cuidSchema.optional(),
});

// ============================================
// Control Schemas
// ============================================

/**
 * Schéma pour le type de contrôle
 */
export const controlTypeSchema = z.enum(CONTROL_TYPES);

/**
 * Schéma pour le statut de contrôle
 */
export const controlStatusSchema = z.enum(CONTROL_STATUS);

/**
 * Schéma pour la priorité de contrôle
 */
export const controlPrioritySchema = z.enum(CONTROL_PRIORITY);

/**
 * Schéma pour le niveau de risque
 */
export const riskLevelSchema = z.enum(RISK_LEVELS);

/**
 * Schéma pour créer un contrôle
 */
export const createControlSchema = z.object({
  cabinetId: cuidSchema,
  clientId: cuidSchema,
  type: controlTypeSchema,
  priority: controlPrioritySchema,
  description: z.string().max(2000).optional(),
  dueDate: dateSchema,
  isACPRMandatory: z.boolean().default(false),
});

/**
 * Schéma pour compléter un contrôle
 */
export const completeControlSchema = z.object({
  controlId: cuidSchema,
  completedById: cuidSchema,
  findings: z.string().min(1, 'Les conclusions sont obligatoires').max(5000),
  recommendations: z.string().max(5000).optional(),
  score: z.number().int().min(0).max(100),
});

/**
 * Schéma pour les filtres de contrôles
 */
export const controlFiltersSchema = z.object({
  status: z.array(controlStatusSchema).optional(),
  type: z.array(controlTypeSchema).optional(),
  priority: z.array(controlPrioritySchema).optional(),
  isACPRMandatory: z.boolean().optional(),
  overdueOnly: z.boolean().optional(),
  clientId: cuidSchema.optional(),
});

// ============================================
// Reclamation Schemas
// ============================================

/**
 * Schéma pour le type de réclamation
 */
export const reclamationTypeSchema = z.enum(RECLAMATION_TYPES);

/**
 * Schéma pour le statut de réclamation
 */
export const reclamationStatusSchema = z.enum(RECLAMATION_STATUS);

/**
 * Schéma pour la sévérité SLA
 */
export const slaSeveritySchema = z.enum(SLA_SEVERITY);

/**
 * Schéma pour créer une réclamation
 */
export const createReclamationSchema = z.object({
  cabinetId: cuidSchema,
  clientId: cuidSchema,
  subject: z.string().min(1, 'Le sujet est obligatoire').max(255),
  description: z.string().min(1, 'La description est obligatoire').max(5000),
  type: reclamationTypeSchema,
  severity: slaSeveritySchema,
  assignedToId: cuidSchema.optional(),
  internalNotes: z.string().max(5000).optional(),
});

/**
 * Schéma pour mettre à jour le statut d'une réclamation
 */
export const updateReclamationStatusSchema = z.object({
  reclamationId: cuidSchema,
  newStatus: reclamationStatusSchema,
  userId: cuidSchema,
  note: z.string().max(2000).optional(),
});

/**
 * Schéma pour résoudre une réclamation
 */
export const resolveReclamationSchema = z.object({
  reclamationId: cuidSchema,
  responseText: z.string().min(1, 'La réponse est obligatoire').max(10000),
  internalNotes: z.string().max(5000).optional(),
});

/**
 * Schéma pour les filtres de réclamations
 */
export const reclamationFiltersSchema = z.object({
  status: z.array(reclamationStatusSchema).optional(),
  type: z.array(reclamationTypeSchema).optional(),
  slaBreachOnly: z.boolean().optional(),
  dateFrom: optionalDateSchema,
  dateTo: optionalDateSchema,
  clientId: cuidSchema.optional(),
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
// Timeline Event Schemas
// ============================================

/**
 * Schéma pour le type d'événement timeline
 */
export const timelineEventTypeSchema = z.enum(TIMELINE_EVENT_TYPES);

/**
 * Schéma pour créer un événement timeline
 */
export const createTimelineEventSchema = z.object({
  cabinetId: cuidSchema,
  clientId: cuidSchema,
  operationId: cuidSchema.optional(),
  type: timelineEventTypeSchema,
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(2000),
  metadata: z.record(z.string(), z.unknown()).optional(),
  userId: cuidSchema,
});

/**
 * Schéma pour les filtres de timeline
 */
export const timelineFiltersSchema = z.object({
  type: z.array(timelineEventTypeSchema).optional(),
  dateFrom: optionalDateSchema,
  dateTo: optionalDateSchema,
  clientId: cuidSchema.optional(),
  operationId: cuidSchema.optional(),
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
// Type Exports
// ============================================

export type CreateKYCDocumentInput = z.infer<typeof createKYCDocumentSchema>;
export type ValidateKYCDocumentInput = z.infer<typeof validateKYCDocumentSchema>;
export type RejectKYCDocumentInput = z.infer<typeof rejectKYCDocumentSchema>;
export type DocumentFiltersInput = z.infer<typeof documentFiltersSchema>;

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type AcknowledgeAlertInput = z.infer<typeof acknowledgeAlertSchema>;
export type AlertFiltersInput = z.infer<typeof alertFiltersSchema>;

export type CreateControlInput = z.infer<typeof createControlSchema>;
export type CompleteControlInput = z.infer<typeof completeControlSchema>;
export type ControlFiltersInput = z.infer<typeof controlFiltersSchema>;

export type CreateReclamationInput = z.infer<typeof createReclamationSchema>;
export type UpdateReclamationStatusInput = z.infer<typeof updateReclamationStatusSchema>;
export type ResolveReclamationInput = z.infer<typeof resolveReclamationSchema>;
export type ReclamationFiltersInput = z.infer<typeof reclamationFiltersSchema>;

export type CreateTimelineEventInput = z.infer<typeof createTimelineEventSchema>;
export type TimelineFiltersInput = z.infer<typeof timelineFiltersSchema>;
