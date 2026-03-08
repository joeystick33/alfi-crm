/**
 * API Route: /api/advisor/clients/[id]/settings
 * GET - Retrieves all client settings
 * PUT - Updates client settings
 * 
 * **Feature: client360-evolution**
 * **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6**
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { SettingsDataService } from '@/app/_common/lib/services/settings-data-service'
import { logger } from '@/app/_common/lib/logger'
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const service = new SettingsDataService(context.cabinetId, user.id, context.isSuperAdmin)
    const data = await service.getSettingsData(clientId)

    return createSuccessResponse(data)
  } catch (error: unknown) {
    logger.error('Error fetching client settings:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Erreur lors de la récupération des paramètres', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: clientId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    const {
      communication,
      reportingFrequency,
      language,
      taxYear,
      selectedRegime,
      bankAccounts,
      notifications,
      dataConsent,
      marketingConsent,
    } = body

    const service = new SettingsDataService(context.cabinetId, user.id, context.isSuperAdmin)
    const data = await service.updateSettings(clientId, {
      communication,
      reportingFrequency,
      language,
      taxYear,
      selectedRegime,
      bankAccounts,
      notifications,
      dataConsent,
      marketingConsent,
    })

    return createSuccessResponse(data)
  } catch (error: unknown) {
    logger.error('Error updating client settings:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        return createErrorResponse('Unauthorized', 401)
      }
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Erreur lors de la mise à jour des paramètres', 500)
  }
}
