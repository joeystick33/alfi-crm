import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { DataProcessingRegistryService } from '@/app/_common/lib/services/data-processing-registry-service'

/**
 * GET /api/advisor/gdpr/registry
 * Récupère le registre des traitements RGPD Art. 30
 * ?summary=true → résumé pour audit/CNIL
 * ?code=T-001 → traitement spécifique
 */
export async function GET(request: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(request)
    if (!user || !cabinetId) {
      return createErrorResponse('Non autorisé', 401)
    }

    const { searchParams } = new URL(request.url)
    const summary = searchParams.get('summary') === 'true'
    const code = searchParams.get('code')

    if (summary) {
      const result = await DataProcessingRegistryService.getRegistrySummary(cabinetId)
      return createSuccessResponse(result)
    }

    if (code) {
      const treatment = await DataProcessingRegistryService.getTreatment(cabinetId, code)
      if (!treatment) {
        return createErrorResponse(`Traitement ${code} non trouvé`, 404)
      }
      return createSuccessResponse(treatment)
    }

    const registry = await DataProcessingRegistryService.getRegistry(cabinetId)
    return createSuccessResponse(registry)
  } catch (error: any) {
    return createErrorResponse(error.message || 'Erreur registre RGPD', 500)
  }
}

/**
 * POST /api/advisor/gdpr/registry
 * Actions : seed, add, review
 */
const seedSchema = z.object({ action: z.literal('seed') })
const reviewSchema = z.object({ action: z.literal('review'), code: z.string().min(1) })
const addSchema = z.object({
  action: z.literal('add'),
  code: z.string().min(1).regex(/^T-\d{3}$/, 'Format code: T-XXX'),
  purpose: z.string().min(1),
  description: z.string().optional(),
  legalBasis: z.enum(['CONSENTEMENT', 'EXECUTION_CONTRAT', 'OBLIGATION_LEGALE', 'INTERET_VITAL', 'MISSION_PUBLIQUE', 'INTERET_LEGITIME']),
  legalBasisDetail: z.string().optional(),
  dataCategories: z.array(z.string()),
  dataSensitive: z.boolean().optional().default(false),
  dataSubjects: z.array(z.string()),
  retentionDuration: z.string().min(1),
  retentionBasis: z.string().optional(),
  recipients: z.array(z.string()),
  subProcessors: z.array(z.string()).optional().default([]),
  transfers: z.array(z.string()),
  transferSafeguards: z.string().nullable().optional(),
  securityMeasures: z.array(z.string()),
  aipdRequired: z.boolean().optional().default(false),
})

const postSchema = z.discriminatedUnion('action', [seedSchema, reviewSchema, addSchema])

export async function POST(request: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(request)
    if (!user || !cabinetId) {
      return createErrorResponse('Non autorisé', 401)
    }

    const body = await request.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(
        'Données invalides: ' + parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        400
      )
    }

    const data = parsed.data

    switch (data.action) {
      case 'seed': {
        const result = await DataProcessingRegistryService.seedRegistry(cabinetId, user.id)
        return createSuccessResponse(result)
      }
      case 'review': {
        const result = await DataProcessingRegistryService.markReviewed(cabinetId, data.code)
        return createSuccessResponse(result)
      }
      case 'add': {
        const result = await DataProcessingRegistryService.addTreatment(cabinetId, user.id, {
          ...data,
          description: data.description || '',
          legalBasisDetail: data.legalBasisDetail || '',
          retentionBasis: data.retentionBasis || '',
          transferSafeguards: data.transferSafeguards || null,
          subProcessors: data.subProcessors || [],
        })
        return createSuccessResponse(result)
      }
    }
  } catch (error: any) {
    return createErrorResponse(error.message || 'Erreur registre RGPD', 500)
  }
}

/**
 * PATCH /api/advisor/gdpr/registry
 * Met à jour un traitement existant
 */
const patchSchema = z.object({
  code: z.string().min(1),
  purpose: z.string().min(1).optional(),
  description: z.string().optional(),
  legalBasis: z.enum(['CONSENTEMENT', 'EXECUTION_CONTRAT', 'OBLIGATION_LEGALE', 'INTERET_VITAL', 'MISSION_PUBLIQUE', 'INTERET_LEGITIME']).optional(),
  legalBasisDetail: z.string().optional(),
  dataCategories: z.array(z.string()).optional(),
  dataSensitive: z.boolean().optional(),
  dataSubjects: z.array(z.string()).optional(),
  retentionDuration: z.string().optional(),
  retentionBasis: z.string().optional(),
  recipients: z.array(z.string()).optional(),
  subProcessors: z.array(z.string()).optional(),
  transfers: z.array(z.string()).optional(),
  transferSafeguards: z.string().nullable().optional(),
  securityMeasures: z.array(z.string()).optional(),
  aipdRequired: z.boolean().optional(),
  aipdDate: z.string().transform(s => new Date(s)).nullable().optional(),
  aipdReference: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(request: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(request)
    if (!user || !cabinetId) {
      return createErrorResponse('Non autorisé', 401)
    }

    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(
        'Données invalides: ' + parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        400
      )
    }

    const { code, ...updateData } = parsed.data
    const result = await DataProcessingRegistryService.updateTreatment(cabinetId, code, updateData)
    return createSuccessResponse(result)
  } catch (error: any) {
    return createErrorResponse(error.message || 'Erreur mise à jour traitement', 500)
  }
}
