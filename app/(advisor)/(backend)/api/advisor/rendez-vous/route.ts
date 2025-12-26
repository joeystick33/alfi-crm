 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { RendezVousService } from '@/app/_common/lib/services/rendez-vous-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { parseRendezVousFilters } from './utils'

/**
 * GET /api/rendez-vous
 * Liste des rendez-vous avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const filters = parseRendezVousFilters(searchParams)

    const service = new RendezVousService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const rendezvous = await service.getRendezVous(filters)

    return createSuccessResponse(rendezvous)
  } catch (error: any) {
    console.error('Error in GET /api/rendez-vous:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      if (error.message === 'Time slot conflict detected') {
        return createErrorResponse('Conflit de rendez-vous détecté', 409)
      }
      if (error.message?.startsWith('Conflits détectés aux dates')) {
        return createErrorResponse(error.message, 409)
      }
      if (error.message?.startsWith('RRULE invalide')) {
        return createErrorResponse(error.message, 400)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/rendez-vous
 * Créer un nouveau rendez-vous
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request); const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const rawBody = (body && typeof body === 'object') ? (body as Record<string, unknown>) : {}
    if (!rawBody.conseillerId) {
      rawBody.conseillerId = user.id
    }
    const { normalizeRendezVousCreatePayload } = await import('./utils')
    const payload = normalizeRendezVousCreatePayload(rawBody)

    const isRecurring = rawBody.isRecurring === true || rawBody.isRecurring === 'true'
    const recurrenceRule = typeof rawBody.recurrenceRule === 'string' ? rawBody.recurrenceRule.trim() : undefined
    const recurrenceEndDate = rawBody.recurrenceEndDate ? new Date(rawBody.recurrenceEndDate as string) : undefined

    if (isRecurring && !recurrenceRule) {
      return createErrorResponse('recurrenceRule est requis pour un rendez-vous récurrent', 400)
    }

    if (recurrenceEndDate && Number.isNaN(recurrenceEndDate.getTime())) {
      return createErrorResponse('recurrenceEndDate invalide', 400)
    }

    const service = new RendezVousService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const rendezvous = isRecurring
      ? await service.createRecurringRendezVous({
          ...payload,
          recurrenceRule: recurrenceRule || '',
          recurrenceEndDate,
        })
      : await service.createRendezVous(payload)

    return createSuccessResponse(rendezvous, 201)
  } catch (error: any) {
    console.error('Error in POST /api/rendez-vous:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      if (error.message === 'Time slot conflict detected') {
        return createErrorResponse('Conflit de rendez-vous détecté', 409)
      }
      if (error.message?.startsWith('Conflits détectés aux dates')) {
        return createErrorResponse(error.message, 409)
      }
      if (error.message?.startsWith('RRULE invalide')) {
        return createErrorResponse(error.message, 400)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
