 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'


import { ReclamationService } from '@/app/_common/lib/services/reclamation-service'
import { z } from 'zod'

// Schéma de validation
const createReclamationSchema = z.object({
  clientId: z.string().cuid(),
  subject: z.string().min(1),
  description: z.string().min(1),
  type: z.enum(['QUALITE_SERVICE', 'TARIFICATION', 'QUALITE_CONSEIL', 'DOCUMENT', 'COMMUNICATION', 'AUTRE']),
  severity: z.enum(['BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE']).optional(),
  assignedToId: z.string().cuid().optional(),
  receivedAt: z.string().datetime().optional(),
})

/**
 * GET /api/advisor/reclamations
 * Liste les réclamations avec filtres
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
    if (searchParams.get('severity')) filters.severity = searchParams.get('severity')
    if (searchParams.get('assignedToId')) filters.assignedToId = searchParams.get('assignedToId')
    if (searchParams.get('slaBreach')) filters.slaBreach = searchParams.get('slaBreach') === 'true'
    if (searchParams.get('escalatedToMediator')) filters.escalatedToMediator = searchParams.get('escalatedToMediator') === 'true'
    if (searchParams.get('search')) filters.search = searchParams.get('search')

    const service = new ReclamationService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const reclamations = await service.listReclamations(filters)
    return createSuccessResponse(reclamations)
  } catch (error: any) {
    console.error('Error fetching reclamations:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/advisor/reclamations
 * Crée une nouvelle réclamation
 */
export async function POST(req: NextRequest) {
  try {
    const context = await requireAuth(req)
    const { user } = context
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await req.json()
    const validatedData = createReclamationSchema.parse(body)

    const service = new ReclamationService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const reclamation = await service.createReclamation({
      cabinetId: context.cabinetId,
      clientId: validatedData.clientId,
      subject: validatedData.subject,
      description: validatedData.description,
      type: validatedData.type,
      severity: validatedData.severity,
      assignedToId: validatedData.assignedToId,
      receivedAt: validatedData.receivedAt ? new Date(validatedData.receivedAt) : undefined,
    })

    return createSuccessResponse(reclamation, 201)
  } catch (error: any) {
    console.error('Error creating reclamation:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
