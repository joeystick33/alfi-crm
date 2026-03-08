import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { EntretienService } from '@/app/_common/lib/services/entretien-service'
import { logger } from '@/app/_common/lib/logger'

function resolveCabinetId(cabinetIdFromContext: string, userCabinetId?: string): string {
  return cabinetIdFromContext || userCabinetId || ''
}

const createEntretienSchema = z.object({
  titre: z.string().min(1, 'Titre requis'),
  type: z.enum(['DECOUVERTE', 'SUIVI_PERIODIQUE', 'BILAN_PATRIMONIAL', 'CONSEIL_PONCTUEL', 'SIGNATURE', 'AUTRE']).optional(),
  clientId: z.string().optional(),
  prospectNom: z.string().optional(),
  prospectPrenom: z.string().optional(),
  prospectEmail: z.string().email().optional().or(z.literal('')),
  prospectTel: z.string().optional(),
  consentementRecueilli: z.boolean().optional(),
  consentementDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  consentementTexte: z.string().optional(),
  dateEntretien: z.string().optional().transform(val => val ? new Date(val) : undefined),
  tags: z.array(z.string()).optional(),
  notesConseiller: z.string().optional(),
})

function parseFilters(searchParams: URLSearchParams) {
  const filters: Record<string, unknown> = {}
  if (searchParams.get('clientId')) filters.clientId = searchParams.get('clientId')!
  if (searchParams.get('conseillerId')) filters.conseillerId = searchParams.get('conseillerId')!
  if (searchParams.get('status')) filters.status = searchParams.get('status')
  if (searchParams.get('type')) filters.type = searchParams.get('type')
  if (searchParams.get('search')) filters.search = searchParams.get('search')!
  if (searchParams.get('dateFrom')) filters.dateFrom = new Date(searchParams.get('dateFrom')!)
  if (searchParams.get('dateTo')) filters.dateTo = new Date(searchParams.get('dateTo')!)
  if (searchParams.get('tags')) filters.tags = searchParams.get('tags')!.split(',')
  if (searchParams.get('limit')) filters.limit = parseInt(searchParams.get('limit')!, 10)
  if (searchParams.get('offset')) filters.offset = parseInt(searchParams.get('offset')!, 10)
  if (searchParams.get('sortBy')) filters.sortBy = searchParams.get('sortBy')
  if (searchParams.get('sortOrder')) filters.sortOrder = searchParams.get('sortOrder')
  return filters
}

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Invalid user type', 400)
    const cabinetId = resolveCabinetId(context.cabinetId, user.cabinetId)
    if (!context.isSuperAdmin && !cabinetId) return createErrorResponse('Missing cabinet context', 400)

    const { searchParams } = new URL(request.url)
    const filters = parseFilters(searchParams)

    const service = new EntretienService(cabinetId, user.id, context.isSuperAdmin)
    const result = await service.listEntretiens(filters as any)
    return createSuccessResponse(result)
  } catch (error) {
    logger.error('GET /api/advisor/entretiens failed', { error: error instanceof Error ? error.message : String(error), module: 'ENTRETIENS' })
    if (error instanceof Error && error.message === 'Unauthorized') return createErrorResponse('Unauthorized', 401)
    return createErrorResponse('Internal server error', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    if (!isRegularUser(user)) return createErrorResponse('Invalid user type', 400)
    const cabinetId = resolveCabinetId(context.cabinetId, user.cabinetId)
    if (!context.isSuperAdmin && !cabinetId) return createErrorResponse('Missing cabinet context', 400)

    const body = await request.json()
    let validated
    try {
      validated = createEntretienSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        return createErrorResponse(`Validation échouée: ${messages}`, 400)
      }
      throw error
    }

    const service = new EntretienService(cabinetId, user.id, context.isSuperAdmin)
    const entretien = await service.createEntretien(validated as any)
    return createSuccessResponse(entretien, 201)
  } catch (error) {
    logger.error('POST /api/advisor/entretiens failed', { error: error instanceof Error ? error.message : String(error), module: 'ENTRETIENS' })
    if (error instanceof Error && error.message === 'Unauthorized') return createErrorResponse('Unauthorized', 401)
    if (error instanceof Error) return createErrorResponse(error.message, 400)
    return createErrorResponse('Internal server error', 500)
  }
}
