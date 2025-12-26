 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'


import { ReclamationService } from '@/app/_common/lib/services/reclamation-service'
import { z } from 'zod'

// Schéma de validation
const resolveReclamationSchema = z.object({
  responseText: z.string().min(1),
  internalNotes: z.string().optional(),
})

/**
 * POST /api/advisor/reclamations/[id]/resolve
 * Résout une réclamation
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
    const validatedData = resolveReclamationSchema.parse(body)

    const service = new ReclamationService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const reclamation = await service.resolveReclamation({
      reclamationId,
      responseText: validatedData.responseText,
      internalNotes: validatedData.internalNotes,
    })

    return NextResponse.json(reclamation)
  } catch (error: any) {
    console.error('Error resolving reclamation:', error)
    
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
