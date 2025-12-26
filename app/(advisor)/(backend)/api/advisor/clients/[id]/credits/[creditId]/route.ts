 
import { NextRequest } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'

// GET /api/advisor/clients/[id]/credits/[creditId] - Récupérer un crédit spécifique
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; creditId: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId, creditId } = await params

    const credit = await prisma.credit.findFirst({
      where: {
        id: creditId,
        clientId,
        cabinetId,
      },
    })

    if (!credit) {
      return createErrorResponse('Credit not found', 404)
    }

    return createSuccessResponse(credit)
  } catch (error: any) {
    console.error('Error fetching credit:', error)
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to fetch credit', 500)
  }
}

// PUT /api/advisor/clients/[id]/credits/[creditId] - Mettre à jour un crédit
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; creditId: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId, creditId } = await params
    const data = await req.json()

    // Vérifier que le crédit existe et appartient au bon client/cabinet
    const existingCredit = await prisma.credit.findFirst({
      where: {
        id: creditId,
        clientId,
        cabinetId,
      },
    })

    if (!existingCredit) {
      return createErrorResponse('Credit not found', 404)
    }

    // Recalculer la durée restante si les dates changent
    let dureeRestanteMois = existingCredit.dureeRestanteMois
    let dureeInitialeMois = existingCredit.dureeInitialeMois
    
    if (data.dateDebut || data.dateFin) {
      const dateDebut = data.dateDebut ? new Date(data.dateDebut) : existingCredit.dateDebut
      const dateFin = data.dateFin ? new Date(data.dateFin) : existingCredit.dateFin
      const now = new Date()
      dureeRestanteMois = Math.max(0, Math.ceil((dateFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30)))
      dureeInitialeMois = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24 * 30))
    }

    const updatedCredit = await prisma.credit.update({
      where: { id: creditId },
      data: {
        // Identification
        libelle: data.libelle !== undefined ? data.libelle : undefined,
        type: data.type !== undefined ? data.type : undefined,
        status: data.status !== undefined ? data.status : undefined,
        numeroContrat: data.numeroContrat !== undefined ? data.numeroContrat : undefined,
        
        // Organisme prêteur
        organisme: data.organisme !== undefined ? data.organisme : undefined,
        agence: data.agence !== undefined ? data.agence : undefined,
        contactNom: data.contactNom !== undefined ? data.contactNom : undefined,
        contactTel: data.contactTel !== undefined ? data.contactTel : undefined,
        contactEmail: data.contactEmail !== undefined ? data.contactEmail : undefined,
        
        // Montants
        montantInitial: data.montantInitial !== undefined ? data.montantInitial : undefined,
        capitalRestantDu: data.capitalRestantDu !== undefined ? data.capitalRestantDu : undefined,
        montantRembourse: data.montantRembourse !== undefined ? data.montantRembourse : undefined,
        
        // Taux
        tauxNominal: data.tauxNominal !== undefined ? data.tauxNominal : undefined,
        tauxEffectifGlobal: data.tauxEffectifGlobal !== undefined ? data.tauxEffectifGlobal : undefined,
        typeAmortissement: data.typeAmortissement !== undefined ? data.typeAmortissement : undefined,
        
        // Échéances
        mensualiteHorsAssurance: data.mensualiteHorsAssurance !== undefined ? data.mensualiteHorsAssurance : undefined,
        mensualiteTotale: data.mensualiteTotale !== undefined ? data.mensualiteTotale : undefined,
        dateDebut: data.dateDebut !== undefined ? new Date(data.dateDebut) : undefined,
        dateFin: data.dateFin !== undefined ? new Date(data.dateFin) : undefined,
        dureeInitialeMois: data.dateDebut || data.dateFin ? dureeInitialeMois : undefined,
        dureeRestanteMois: data.dateDebut || data.dateFin ? dureeRestanteMois : undefined,
        jourPrelevement: data.jourPrelevement !== undefined ? data.jourPrelevement : undefined,
        
        // Assurance emprunteur
        assuranceEmprunteur: data.assuranceEmprunteur !== undefined ? data.assuranceEmprunteur : undefined,
        assureurNom: data.assureurNom !== undefined ? data.assureurNom : undefined,
        assuranceMontant: data.assuranceMontant !== undefined ? data.assuranceMontant : undefined,
        assuranceTaux: data.assuranceTaux !== undefined ? data.assuranceTaux : undefined,
        assuranceQuotite: data.assuranceQuotite !== undefined ? data.assuranceQuotite : undefined,
        assuranceCouvertures: data.assuranceCouvertures !== undefined ? data.assuranceCouvertures : undefined,
        assuranceDateFin: data.assuranceDateFin !== undefined ? (data.assuranceDateFin ? new Date(data.assuranceDateFin) : null) : undefined,
        assuranceDelegation: data.assuranceDelegation !== undefined ? data.assuranceDelegation : undefined,
        
        // Garanties
        garanties: data.garanties !== undefined ? data.garanties : undefined,
        bienFinanceId: data.bienFinanceId !== undefined ? data.bienFinanceId : undefined,
        
        // Options
        modulable: data.modulable !== undefined ? data.modulable : undefined,
        differe: data.differe !== undefined ? data.differe : undefined,
        differeMois: data.differeMois !== undefined ? data.differeMois : undefined,
        rachetable: data.rachetable !== undefined ? data.rachetable : undefined,
        penalitesRemboursement: data.penalitesRemboursement !== undefined ? data.penalitesRemboursement : undefined,
        
        // Métadonnées
        notes: data.notes !== undefined ? data.notes : undefined,
        documents: data.documents !== undefined ? data.documents : undefined,
        
        // Statut
        isActive: data.isActive !== undefined ? data.isActive : undefined,
      },
    })

    return createSuccessResponse(updatedCredit)
  } catch (error: any) {
    console.error('Error updating credit:', error)
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to update credit', 500)
  }
}

// DELETE /api/advisor/clients/[id]/credits/[creditId] - Supprimer un crédit (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; creditId: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId, creditId } = await params

    // Vérifier que le crédit existe et appartient au bon client/cabinet
    const existingCredit = await prisma.credit.findFirst({
      where: {
        id: creditId,
        clientId,
        cabinetId,
      },
    })

    if (!existingCredit) {
      return createErrorResponse('Credit not found', 404)
    }

    // Soft delete - mettre isActive à false
    const deletedCredit = await prisma.credit.update({
      where: { id: creditId },
      data: { isActive: false },
    })

    return createSuccessResponse({ message: 'Credit deleted successfully', id: deletedCredit.id })
  } catch (error: any) {
    console.error('Error deleting credit:', error)
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to delete credit', 500)
  }
}
