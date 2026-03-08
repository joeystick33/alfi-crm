 
import { NextRequest } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
// GET /api/advisor/clients/[id]/biens-mobiliers/[bienMobilierId] - Récupérer un bien mobilier spécifique
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bienMobilierId: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId, bienMobilierId } = await params

    const bienMobilier = await prisma.bienMobilier.findFirst({
      where: {
        id: bienMobilierId,
        clientId,
        cabinetId,
      },
    })

    if (!bienMobilier) {
      return createErrorResponse('Bien mobilier not found', 404)
    }

    return createSuccessResponse(bienMobilier)
  } catch (error: any) {
    logger.error('Error fetching bien mobilier:', { error: error instanceof Error ? error.message : String(error) })
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to fetch bien mobilier', 500)
  }
}

// PUT /api/advisor/clients/[id]/biens-mobiliers/[bienMobilierId] - Mettre à jour un bien mobilier
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bienMobilierId: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId, bienMobilierId } = await params
    const data = await req.json()

    // Vérifier que le bien mobilier existe et appartient au bon client/cabinet
    const existingBien = await prisma.bienMobilier.findFirst({
      where: {
        id: bienMobilierId,
        clientId,
        cabinetId,
      },
    })

    if (!existingBien) {
      return createErrorResponse('Bien mobilier not found', 404)
    }

    // Recalculer la plus-value latente si les valeurs changent
    const valeurAcquisition = data.valeurAcquisition !== undefined 
      ? Number(data.valeurAcquisition) 
      : Number(existingBien.valeurAcquisition)
    const valeurActuelle = data.valeurActuelle !== undefined 
      ? Number(data.valeurActuelle) 
      : Number(existingBien.valeurActuelle)
    const plusValueLatente = valeurActuelle - valeurAcquisition

    const updatedBien = await prisma.bienMobilier.update({
      where: { id: bienMobilierId },
      data: {
        // Classification
        type: data.type !== undefined ? data.type : undefined,
        categorie: data.categorie !== undefined ? data.categorie : undefined,
        
        // Identification
        libelle: data.libelle !== undefined ? data.libelle : undefined,
        description: data.description !== undefined ? data.description : undefined,
        marque: data.marque !== undefined ? data.marque : undefined,
        modele: data.modele !== undefined ? data.modele : undefined,
        annee: data.annee !== undefined ? data.annee : undefined,
        numeroSerie: data.numeroSerie !== undefined ? data.numeroSerie : undefined,
        immatriculation: data.immatriculation !== undefined ? data.immatriculation : undefined,
        
        // Valorisation
        valeurAcquisition: data.valeurAcquisition !== undefined ? data.valeurAcquisition : undefined,
        dateAcquisition: data.dateAcquisition !== undefined ? (data.dateAcquisition ? new Date(data.dateAcquisition) : null) : undefined,
        valeurActuelle: data.valeurActuelle !== undefined ? data.valeurActuelle : undefined,
        dateEstimation: data.dateEstimation !== undefined ? (data.dateEstimation ? new Date(data.dateEstimation) : null) : undefined,
        sourceEstimation: data.sourceEstimation !== undefined ? data.sourceEstimation : undefined,
        plusValueLatente: data.valeurAcquisition !== undefined || data.valeurActuelle !== undefined ? plusValueLatente : undefined,
        
        // Détention
        modeDetention: data.modeDetention !== undefined ? data.modeDetention : undefined,
        quotiteDetention: data.quotiteDetention !== undefined ? data.quotiteDetention : undefined,
        
        // Assurance
        estAssure: data.estAssure !== undefined ? data.estAssure : undefined,
        assureur: data.assureur !== undefined ? data.assureur : undefined,
        montantAssurance: data.montantAssurance !== undefined ? data.montantAssurance : undefined,
        numeroPolice: data.numeroPolice !== undefined ? data.numeroPolice : undefined,
        
        // Financement
        estGage: data.estGage !== undefined ? data.estGage : undefined,
        organismePreteur: data.organismePreteur !== undefined ? data.organismePreteur : undefined,
        capitalRestantDu: data.capitalRestantDu !== undefined ? data.capitalRestantDu : undefined,
        creditId: data.creditId !== undefined ? data.creditId : undefined,
        
        // Amortissement (équipements pro)
        estAmortissable: data.estAmortissable !== undefined ? data.estAmortissable : undefined,
        dureeAmortissement: data.dureeAmortissement !== undefined ? data.dureeAmortissement : undefined,
        valeurResiduelle: data.valeurResiduelle !== undefined ? data.valeurResiduelle : undefined,
        
        // Localisation
        localisation: data.localisation !== undefined ? data.localisation : undefined,
        
        // Métadonnées
        photos: data.photos !== undefined ? data.photos : undefined,
        documents: data.documents !== undefined ? data.documents : undefined,
        notes: data.notes !== undefined ? data.notes : undefined,
        
        // Statut
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    })

    return createSuccessResponse(updatedBien)
  } catch (error: any) {
    logger.error('Error updating bien mobilier:', { error: error instanceof Error ? error.message : String(error) })
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to update bien mobilier', 500)
  }
}

// DELETE /api/advisor/clients/[id]/biens-mobiliers/[bienMobilierId] - Supprimer un bien mobilier (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bienMobilierId: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId, bienMobilierId } = await params

    // Vérifier que le bien mobilier existe et appartient au bon client/cabinet
    const existingBien = await prisma.bienMobilier.findFirst({
      where: {
        id: bienMobilierId,
        clientId,
        cabinetId,
      },
    })

    if (!existingBien) {
      return createErrorResponse('Bien mobilier not found', 404)
    }

    // Soft delete - mettre isActive à false
    const deletedBien = await prisma.bienMobilier.update({
      where: { id: bienMobilierId },
      data: { isActive: false },
    })

    return createSuccessResponse({ message: 'Bien mobilier deleted successfully', id: deletedBien.id })
  } catch (error: any) {
    logger.error('Error deleting bien mobilier:', { error: error instanceof Error ? error.message : String(error) })
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to delete bien mobilier', 500)
  }
}
