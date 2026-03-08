 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'


import { ReclamationService } from '@/app/_common/lib/services/reclamation-service'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
// Schéma de validation
const escalateReclamationSchema = z.object({
  reason: z.string().min(1),
  mediatorReference: z.string().optional(),
})

/**
 * POST /api/advisor/reclamations/[id]/escalate
 * Escale une réclamation vers un médiateur
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user } = context
    const { id: reclamationId } = await params
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await req.json()
    const validatedData = escalateReclamationSchema.parse(body)

    const service = new ReclamationService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const reclamation = await service.escalateReclamation({
      reclamationId,
      reason: validatedData.reason,
      mediatorReference: validatedData.mediatorReference,
    })

    return NextResponse.json(reclamation)
  } catch (error: any) {
    logger.error('Error escalating reclamation:', { error: error instanceof Error ? error.message : String(error) })
    
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
