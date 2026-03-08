/**
 * Schémas Zod pour la validation des requêtes API IA
 * Centralise les validations pour toutes les routes /api/advisor/ai/*
 */

import { z } from 'zod'

// ── Chat ──

export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Le message est requis').max(10000, 'Message trop long'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
  enableRag: z.boolean().optional().default(true),
  clientContext: z.string().optional(),
})

// ── Chat Stream ──

export const chatStreamRequestSchema = z.object({
  message: z.string().min(1, 'Le message est requis').max(10000, 'Message trop long'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
  clientId: z.string().optional(),
  enableRag: z.boolean().optional().default(true),
  enableAgent: z.boolean().optional().default(true),
  autoExecute: z.boolean().optional(),
  confirmActionId: z.string().optional(),
  clientContext: z.string().optional(),
  pageContext: z.object({
    path: z.string(),
    pageType: z.string().optional(),
    clientId: z.string().optional(),
    clientName: z.string().optional(),
    visibleData: z.string().optional(),
  }).optional(),
})

// ── Summarize ──

export const summarizeRequestSchema = z.object({
  notes: z.string().min(1, 'Les notes sont requises').max(50000),
  clientName: z.string().optional().default('Client'),
  appointmentType: z.string().optional().default('Rendez-vous patrimonial'),
})

// ── Email ──

export const emailRequestSchema = z.object({
  clientName: z.string().min(1, 'clientName est requis'),
  advisorName: z.string().optional().default('Le conseiller'),
  cabinetName: z.string().optional().default('Le cabinet'),
  emailType: z.enum(['relance', 'confirmation_rdv', 'envoi_bilan', 'information', 'anniversaire', 'suivi_preco', 'custom']).optional().default('custom'),
  context: z.string().min(1, 'context est requis'),
  tone: z.enum(['formel', 'chaleureux', 'urgent']).optional(),
})

// ── Analyze Profile ──

export const analyzeProfileRequestSchema = z.object({
  age: z.number().min(0).max(150),
  situationFamiliale: z.string().optional().default('Non renseigné'),
  nbEnfants: z.number().min(0).optional().default(0),
  profession: z.string().optional().default('Non renseigné'),
  revenuAnnuel: z.number().min(0).optional().default(0),
  patrimoineNet: z.number(),
  patrimoineImmobilier: z.number().min(0).optional().default(0),
  patrimoineFinancier: z.number().min(0).optional().default(0),
  endettement: z.number().min(0).optional().default(0),
  tauxEpargne: z.number().min(0).optional().default(0),
  tmi: z.number().min(0).optional().default(0),
  ifiAssujetti: z.boolean().optional().default(false),
})

// ── Enrich Preconisation ──

export const enrichPrecoRequestSchema = z.object({
  titre: z.string().min(1, 'titre est requis'),
  categorie: z.string().optional().default('général'),
  produit: z.string().optional(),
  montantEstime: z.number().optional(),
  objectif: z.string().min(1, 'objectif est requis'),
  clientAge: z.number().min(0).optional().default(40),
  clientTmi: z.number().min(0).optional().default(30),
  clientCapaciteEpargne: z.number().min(0).optional().default(500),
  clientPatrimoineNet: z.number().min(0).optional().default(100000),
})

// ── Explain / Compare ──

export const explainRequestSchema = z.object({
  action: z.literal('explain'),
  concept: z.string().min(1, 'concept est requis'),
  level: z.enum(['junior', 'senior']).optional(),
})

export const compareRequestSchema = z.object({
  action: z.literal('compare'),
  items: z.array(z.string()).min(2, 'Au moins 2 items à comparer'),
  clientContext: z.string().optional().default(''),
})

export const explainOrCompareSchema = z.discriminatedUnion('action', [
  explainRequestSchema,
  compareRequestSchema,
])

// ── Generate Narrative ──

export const narrativeRequestSchema = z.object({
  type: z.enum(['synthese', 'budget', 'fiscalite', 'retraite', 'succession', 'preconisation', 'immobilier', 'financier']),
  context: z.record(z.string(), z.unknown()),
  clientName: z.string().optional(),
})

// ── Helper ──

type ValidationSuccess<T> = { success: true; data: T; error?: undefined }
type ValidationFailure = { success: false; data?: undefined; error: Response }
type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure

/**
 * Valide une requête avec un schéma Zod et retourne le résultat parsé ou une Response d'erreur
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateRequest<T>(schema: z.ZodType<T, any>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errors = (result.error.issues as any[]).map((i) => `${(i.path || []).join('.')}: ${i.message}`).join(', ')
  return {
    success: false,
    error: new Response(
      JSON.stringify({ error: `Validation échouée: ${errors}` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    ),
  }
}
