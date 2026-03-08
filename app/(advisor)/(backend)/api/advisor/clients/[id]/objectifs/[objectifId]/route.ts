import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { ObjectifService } from '@/app/_common/lib/services/objectif-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
function parseNumberFR(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string') {
    const cleaned = value
      .replace(/[\s\u00A0\u202F]/g, '')
      .replace(/€.*$/g, '')
      .replace(',', '.')
      .trim()
    const n = Number(cleaned)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; objectifId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId, objectifId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const objectifService = new ObjectifService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const objectif = await objectifService.getObjectifById(objectifId)

    if (!objectif) {
      return createErrorResponse('Objectif not found', 404)
    }

    if ((objectif as any).clientId !== clientId) {
      return createErrorResponse('Objectif does not belong to this client', 403)
    }

    return createSuccessResponse(objectif)
  } catch (error: any) {
    logger.error('Get objectif error:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    const msg = process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    return createErrorResponse(msg, 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; objectifId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId, objectifId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()

    const objectifService = new ObjectifService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const existing = await objectifService.getObjectifById(objectifId)
    if (!existing) {
      return createErrorResponse('Objectif not found', 404)
    }
    if ((existing as any).clientId !== clientId) {
      return createErrorResponse('Objectif does not belong to this client', 403)
    }

    const updateData: Record<string, any> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.type !== undefined) updateData.type = body.type
    if (body.status !== undefined) updateData.status = body.status

    const targetAmount = parseNumberFR(body.targetAmount)
    if (targetAmount !== null) updateData.targetAmount = targetAmount

    const currentAmount = parseNumberFR(body.currentAmount)
    if (currentAmount !== null) updateData.currentAmount = currentAmount

    const monthlyContribution = parseNumberFR(body.monthlyContribution)
    if (monthlyContribution !== null) updateData.monthlyContribution = monthlyContribution

    if (body.targetDate !== undefined) {
      updateData.targetDate = new Date(body.targetDate)
    }

    if (body.priority !== undefined) {
      const priorityMap: Record<string, string> = {
        'HAUTE': 'HAUTE',
        'MOYENNE': 'MOYENNE',
        'BASSE': 'BASSE',
        'HIGH': 'HAUTE',
        'MEDIUM': 'MOYENNE',
        'LOW': 'BASSE',
      }
      updateData.priority = priorityMap[body.priority] || body.priority
    }

    const updated = await objectifService.updateObjectif(objectifId, updateData)

    return createSuccessResponse(updated)
  } catch (error: any) {
    logger.error('Update objectif error:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    const msg = process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    return createErrorResponse(msg, 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; objectifId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId, objectifId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const objectifService = new ObjectifService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const existing = await objectifService.getObjectifById(objectifId)
    if (!existing) {
      return createErrorResponse('Objectif not found', 404)
    }
    if ((existing as any).clientId !== clientId) {
      return createErrorResponse('Objectif does not belong to this client', 403)
    }

    await objectifService.deleteObjectif(objectifId)

    return createSuccessResponse({ success: true })
  } catch (error: any) {
    logger.error('Delete objectif error:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    const msg = process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    return createErrorResponse(msg, 500)
  }
}
