import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { ProjetService } from '@/app/_common/lib/services/projet-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'

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
  { params }: { params: Promise<{ id: string; projetId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId, projetId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const projetService = new ProjetService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const projet = await projetService.getProjetById(projetId)

    if (!projet) {
      return createErrorResponse('Projet not found', 404)
    }

    if ((projet as any).clientId !== clientId) {
      return createErrorResponse('Projet does not belong to this client', 403)
    }

    return createSuccessResponse(projet)
  } catch (error: any) {
    console.error('Get projet error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    const msg = process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    return createErrorResponse(msg, 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; projetId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId, projetId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()

    const projetService = new ProjetService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const existing = await projetService.getProjetById(projetId)
    if (!existing) {
      return createErrorResponse('Projet not found', 404)
    }
    if ((existing as any).clientId !== clientId) {
      return createErrorResponse('Projet does not belong to this client', 403)
    }

    const updateData: Record<string, any> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.type !== undefined) updateData.type = body.type

    const estimatedBudget = parseNumberFR(body.estimatedBudget ?? body.budget)
    if (estimatedBudget !== null) updateData.estimatedBudget = estimatedBudget

    const actualBudget = parseNumberFR(body.actualBudget)
    if (actualBudget !== null) updateData.actualBudget = actualBudget

    if (body.startDate !== undefined) {
      updateData.startDate = new Date(body.startDate)
    }
    if (body.endDate !== undefined) {
      updateData.endDate = new Date(body.endDate)
    }

    if (body.status !== undefined) {
      const statusMap: Record<string, string> = {
        'BROUILLON': 'BROUILLON',
        'EN_COURS': 'EN_COURS',
        'TERMINE': 'TERMINE',
        'ANNULE': 'ANNULE',
        'EN_ATTENTE': 'EN_ATTENTE',
        'DRAFT': 'BROUILLON',
        'IN_PROGRESS': 'EN_COURS',
        'COMPLETED': 'TERMINE',
        'CANCELLED': 'ANNULE',
        'ON_HOLD': 'EN_ATTENTE',
      }
      updateData.status = statusMap[body.status] || body.status
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

    const updated = await projetService.updateProjet(projetId, updateData)

    return createSuccessResponse(updated)
  } catch (error: any) {
    console.error('Update projet error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    const msg = process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    return createErrorResponse(msg, 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; projetId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId, projetId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const projetService = new ProjetService(
      context.cabinetId,
      user.id,
      user.role,
      context.isSuperAdmin
    )

    const existing = await projetService.getProjetById(projetId)
    if (!existing) {
      return createErrorResponse('Projet not found', 404)
    }
    if ((existing as any).clientId !== clientId) {
      return createErrorResponse('Projet does not belong to this client', 403)
    }

    await projetService.deleteProjet(projetId)

    return createSuccessResponse({ success: true })
  } catch (error: any) {
    console.error('Delete projet error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    const msg = process.env.NODE_ENV === 'development' ? error?.message : 'Internal server error'
    return createErrorResponse(msg, 500)
  }
}
