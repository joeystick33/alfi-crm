 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'


import { ReclamationService } from '@/app/_common/lib/services/reclamation-service'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
// Schéma de validation
const updateReclamationSchema = z.object({
  subject: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  type: z.enum(['QUALITE_SERVICE', 'TARIFICATION', 'QUALITE_CONSEIL', 'DOCUMENT', 'COMMUNICATION', 'AUTRE']).optional(),
  status: z.enum(['RECUE', 'EN_COURS', 'EN_ATTENTE_INFO', 'RESOLUE', 'CLOTUREE', 'ESCALADEE']).optional(),
  severity: z.enum(['BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE']).optional(),
  assignedToId: z.string().cuid().optional(),
  responseText: z.string().optional(),
  internalNotes: z.string().optional(),
})

/**
 * GET /api/advisor/reclamations/[id]
 * Récupère une réclamation par ID
 */
export async function GET(
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

    const service = new ReclamationService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const reclamation = await service.getReclamation(reclamationId)
    return NextResponse.json(reclamation)
  } catch (error: any) {
    logger.error('Error fetching reclamation:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/advisor/reclamations/[id]
 * Met à jour une réclamation
 */
export async function PATCH(
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
    const validatedData = updateReclamationSchema.parse(body)

    const service = new ReclamationService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const reclamation = await service.updateReclamation(reclamationId, validatedData)
    return NextResponse.json(reclamation)
  } catch (error: any) {
    logger.error('Error updating reclamation:', { error: error instanceof Error ? error.message : String(error) })
    
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

/**
 * DELETE /api/advisor/reclamations/[id]
 * Supprime une réclamation
 */
export async function DELETE(
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

    const service = new ReclamationService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    await service.deleteReclamation(reclamationId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Error deleting reclamation:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
