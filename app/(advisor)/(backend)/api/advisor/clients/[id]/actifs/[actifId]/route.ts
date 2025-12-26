 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { ActifService } from '@/app/_common/lib/services/actif-service'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { z } from 'zod'

const updateActifSchema = z.object({
  // Identification
  name: z.string().min(1).optional(),
  type: z.string().optional(),
  category: z.enum(['IMMOBILIER', 'FINANCIER', 'PROFESSIONNEL', 'AUTRE']).optional(),
  description: z.string().optional(),
  
  // Valeurs
  value: z.number().min(0).optional(),
  acquisitionDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  acquisitionValue: z.number().optional(),
  
  // Revenus
  annualIncome: z.number().optional(),
  
  // Détails spécifiques (JSON)
  details: z.any().optional(),
  taxDetails: z.any().optional(),
  
  // Gestion
  managedByFirm: z.boolean().optional(),
  managementFees: z.number().optional(),
  
  // Localisation
  location: z.string().optional(),
  
  // Management enrichi
  managementAdvisor: z.string().optional(),
  managementSince: z.string().optional().transform(val => val ? new Date(val) : undefined),
  
  // Fiscal IFI (immobilier)
  fiscalPropertyType: z.string().optional(),
  fiscalRpAbatement: z.boolean().optional(),
  fiscalManualDiscount: z.number().optional(),
  fiscalIfiValue: z.number().optional(),
  
  // Linkage avec passif
  linkedPassifId: z.string().optional(),
  
  // Statut
  isActive: z.boolean().optional(),
}).partial()

/**
 * GET /api/advisor/clients/[id]/actifs/[actifId]
 * Récupérer un actif spécifique
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; actifId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: _clientId, actifId } = await params
    const service = new ActifService(cabinetId, user.id, context.isSuperAdmin)

    const actif = await service.getActifById(actifId, true)

    if (!actif) {
      return createErrorResponse('Actif not found', 404)
    }

    return createSuccessResponse(actif)
  } catch (error: any) {
    console.error('Error fetching actif:', error)
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to fetch actif', 500)
  }
}

/**
 * PUT /api/advisor/clients/[id]/actifs/[actifId]
 * Mettre à jour un actif
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; actifId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: _clientId, actifId } = await params
    const body = await request.json()
    
    // Validation partielle des données
    const data = updateActifSchema.parse(body)
    
    const service = new ActifService(cabinetId, user.id, context.isSuperAdmin)

    // Vérifier que l'actif existe
    const existingActif = await service.getActifById(actifId)
    if (!existingActif) {
      return createErrorResponse('Actif not found', 404)
    }

    // Mise à jour de l'actif
    const updatedActif = await service.updateActif(actifId, data as any)

    return createSuccessResponse({
      actif: updatedActif,
      message: 'Actif mis à jour avec succès',
    })
  } catch (error: any) {
    console.error('Error updating actif:', error)
    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides: ' + error.issues.map(e => e.message).join(', '), 400)
    }
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    if (error.message === 'Actif not found or access denied') {
      return createErrorResponse('Actif not found', 404)
    }
    return createErrorResponse('Failed to update actif', 500)
  }
}

/**
 * DELETE /api/advisor/clients/[id]/actifs/[actifId]
 * Supprimer un actif (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; actifId: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: _clientId, actifId } = await params
    const service = new ActifService(cabinetId, user.id, context.isSuperAdmin)

    // Vérifier que l'actif existe
    const existingActif = await service.getActifById(actifId)
    if (!existingActif) {
      return createErrorResponse('Actif not found', 404)
    }

    // Soft delete
    await service.deactivateActif(actifId)

    return createSuccessResponse({
      message: 'Actif supprimé avec succès',
      id: actifId,
    })
  } catch (error: any) {
    console.error('Error deleting actif:', error)
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    if (error.message === 'Actif not found or access denied') {
      return createErrorResponse('Actif not found', 404)
    }
    return createErrorResponse('Failed to delete actif', 500)
  }
}
