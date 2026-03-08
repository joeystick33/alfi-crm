import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { EntretienService } from '@/app/_common/lib/services/entretien-service'
import { logger } from '@/app/_common/lib/logger'

const updateEntretienSchema = z.object({
  titre: z.string().min(1).optional(),
  type: z.enum(['DECOUVERTE', 'SUIVI_PERIODIQUE', 'BILAN_PATRIMONIAL', 'CONSEIL_PONCTUEL', 'SIGNATURE', 'AUTRE']).optional(),
  status: z.enum(['BROUILLON', 'EN_COURS', 'TERMINE', 'TRAITE', 'ARCHIVE']).optional(),
  clientId: z.string().optional().nullable(),
  prospectNom: z.string().optional().nullable(),
  prospectPrenom: z.string().optional().nullable(),
  prospectEmail: z.string().email().optional().nullable().or(z.literal('')),
  prospectTel: z.string().optional().nullable(),
  transcription: z.any().optional(),
  transcriptionBrute: z.string().optional().nullable(),
  duree: z.number().min(0).optional().nullable(),
  dateEntretien: z.string().transform(s => new Date(s)).optional(),
  tags: z.array(z.string()).optional(),
  notesConseiller: z.string().optional().nullable(),
  consentementRecueilli: z.boolean().optional(),
  consentementDate: z.string().transform(s => new Date(s)).optional().nullable(),
  consentementTexte: z.string().optional().nullable(),
}).strict()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Invalid user type', 400)

    const { id } = await params
    const service = new EntretienService(context.cabinetId, user.id, context.isSuperAdmin)
    const entretien = await service.getEntretien(id)
    return createSuccessResponse(entretien)
  } catch (error) {
    logger.error('GET /api/advisor/entretiens/[id] failed', { error: error instanceof Error ? error.message : String(error), module: 'ENTRETIENS' })
    if (error instanceof Error && error.message === 'Unauthorized') return createErrorResponse('Unauthorized', 401)
    if (error instanceof Error && error.message === 'Entretien non trouvé') return createErrorResponse('Entretien non trouvé', 404)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Invalid user type', 400)

    const { id } = await params
    const body = await request.json()
    const parsed = updateEntretienSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(
        'Données invalides: ' + parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '),
        400
      )
    }

    const service = new EntretienService(context.cabinetId, user.id, context.isSuperAdmin)
    const entretien = await service.updateEntretien(id, parsed.data as any)
    return createSuccessResponse(entretien)
  } catch (error) {
    logger.error('PATCH /api/advisor/entretiens/[id] failed', { error: error instanceof Error ? error.message : String(error), module: 'ENTRETIENS' })
    if (error instanceof Error && error.message === 'Unauthorized') return createErrorResponse('Unauthorized', 401)
    if (error instanceof Error && error.message === 'Entretien non trouvé') return createErrorResponse('Entretien non trouvé', 404)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Invalid user type', 400)

    const { id } = await params
    const service = new EntretienService(context.cabinetId, user.id, context.isSuperAdmin)
    await service.deleteEntretien(id)
    return createSuccessResponse({ success: true })
  } catch (error) {
    logger.error('DELETE /api/advisor/entretiens/[id] failed', { error: error instanceof Error ? error.message : String(error), module: 'ENTRETIENS' })
    if (error instanceof Error && error.message === 'Unauthorized') return createErrorResponse('Unauthorized', 401)
    if (error instanceof Error && error.message === 'Entretien non trouvé') return createErrorResponse('Entretien non trouvé', 404)
    return createErrorResponse('Internal server error', 500)
  }
}
