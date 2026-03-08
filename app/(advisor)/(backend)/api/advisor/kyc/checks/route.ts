 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { KYCService } from '@/app/_common/lib/services/kyc-service'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
// Schéma de validation
const createKYCCheckSchema = z.object({
  clientId: z.string().cuid(),
  type: z.enum([
    'VERIFICATION_IDENTITE',
    'VERIFICATION_ADRESSE',
    'SITUATION_FINANCIERE',
    'CONNAISSANCE_INVESTISSEMENT',
    'PROFIL_RISQUE',
    'ORIGINE_PATRIMOINE',
    'PERSONNE_EXPOSEE',
    'CRIBLAGE_SANCTIONS',
    'REVUE_PERIODIQUE',
    'AUTRE',
  ]),
  priority: z.enum(['BASSE', 'MOYENNE', 'HAUTE', 'URGENTE']).optional(),
  assignedToId: z.string().cuid().optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  isACPRMandatory: z.boolean().optional(),
  acprReference: z.string().optional(),
})

/**
 * GET /api/advisor/kyc/checks
 * Liste les contrôles KYC avec filtres
 */
export async function GET(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(req.url)
    const filters: any = {}

    if (searchParams.get('clientId')) filters.clientId = searchParams.get('clientId')
    if (searchParams.get('status')) filters.status = searchParams.get('status')
    if (searchParams.get('type')) filters.type = searchParams.get('type')
    if (searchParams.get('priority')) filters.priority = searchParams.get('priority')
    if (searchParams.get('assignedToId')) filters.assignedToId = searchParams.get('assignedToId')
    if (searchParams.get('isACPRMandatory')) filters.isACPRMandatory = searchParams.get('isACPRMandatory') === 'true'

    const service = new KYCService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const checks = await service.listKYCChecks(filters)
    return createSuccessResponse(checks)
  } catch (error: any) {
    logger.error('Error fetching KYC checks:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/kyc/checks
 * Crée un nouveau contrôle KYC
 */
export async function POST(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    const { user } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await req.json()
    const validatedData = createKYCCheckSchema.parse(body)

    const service = new KYCService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const check = await service.createKYCCheck({
      cabinetId: context.cabinetId,
      clientId: validatedData.clientId,
      type: validatedData.type,
      priority: validatedData.priority,
      assignedToId: validatedData.assignedToId,
      description: validatedData.description,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      isACPRMandatory: validatedData.isACPRMandatory,
      acprReference: validatedData.acprReference,
    })

    return createSuccessResponse(check, 201)
  } catch (error: any) {
    logger.error('Error creating KYC check:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(`Validation error: ${JSON.stringify(error.issues)}`, 400)
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
