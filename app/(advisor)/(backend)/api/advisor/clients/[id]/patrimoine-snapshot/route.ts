/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/clients/[id]/patrimoine-snapshot
 * Récupérer un snapshot complet du patrimoine client pour le dossier
 */
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

    // Récupérer le client
    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId: context.cabinetId },
    }) as any

    if (!client) {
      return createErrorResponse('Client non trouvé', 404)
    }

    // Récupérer les actifs liés au client
    const clientActifs = await prisma.clientActif.findMany({
      where: { clientId },
      include: { actif: true }
    })

    const actifs = clientActifs.map(ca => ca.actif)

    // Séparer par catégorie
    const patrimoineImmobilier = actifs
      .filter((a: any) => a.category === 'IMMOBILIER')
      .map((a: any) => ({
        id: a.id,
        type: a.type,
        nom: a.name,
        valeur: Number(a.value),
        location: a.location,
      }))

    const patrimoineFinancier = actifs
      .filter((a: any) => ['EPARGNE', 'PLACEMENT', 'RETRAITE', 'FINANCIER'].includes(a.category))
      .map((a: any) => ({
        id: a.id,
        type: a.type,
        nom: a.name,
        valeur: Number(a.value),
      }))

    const patrimoineProfessionnel = actifs
      .filter((a: any) => a.category === 'PROFESSIONNEL')
      .map((a: any) => ({
        id: a.id,
        nom: a.name,
        valeur: Number(a.value),
      }))

    // Récupérer les passifs du client
    const passifs = await prisma.passif.findMany({
      where: { clientId }
    }) as any[]

    const passifsFormatted = passifs.map((p: any) => ({
      id: p.id,
      type: p.type,
      nom: p.name,
      capitalRestant: Number(p.remainingAmount || 0),
      tauxInteret: Number(p.interestRate || 0),
      mensualite: Number(p.monthlyPayment || 0),
    }))

    // Récupérer les contrats du client
    const contrats = await prisma.contrat.findMany({
      where: { clientId },
    }) as any[]

    // Construire les détails revenus
    const revenuTotal = Number(client.annualIncome || 0)
    const revenusDetails: { categorie: string; montantAnnuel: number; montantMensuel: number }[] = []
    if (revenuTotal > 0) {
      // Estimer la répartition selon la profession
      const profession = (client.profession as string || '').toLowerCase()
      const isTNS = profession.includes('indépendant') || profession.includes('libéral') || profession.includes('tns') || profession.includes('artisan') || profession.includes('commerçant')
      if (isTNS) {
        revenusDetails.push({ categorie: 'Revenus BIC/BNC', montantAnnuel: revenuTotal, montantMensuel: Math.round(revenuTotal / 12) })
      } else {
        revenusDetails.push({ categorie: 'Salaires et traitements', montantAnnuel: revenuTotal, montantMensuel: Math.round(revenuTotal / 12) })
      }
    }

    // Revenus fonciers estimés depuis les actifs immobiliers locatifs
    const revenusFonciers = actifs
      .filter((a: any) => a.category === 'IMMOBILIER' && Number(a.monthlyIncome || 0) > 0)
      .reduce((s: number, a: any) => s + Number(a.monthlyIncome || 0) * 12, 0)
    if (revenusFonciers > 0) {
      revenusDetails.push({ categorie: 'Revenus fonciers', montantAnnuel: Math.round(revenusFonciers), montantMensuel: Math.round(revenusFonciers / 12) })
    }

    const revenuTotalEffectif = revenuTotal + revenusFonciers

    // Construire les détails charges
    const totalMensualitesCredits = passifsFormatted.reduce((acc: number, p: any) => acc + p.mensualite, 0)
    const chargesDetails: { categorie: string; montantMensuel: number; montantAnnuel: number }[] = []
    if (totalMensualitesCredits > 0) {
      chargesDetails.push({ categorie: 'Mensualités de crédits', montantMensuel: Math.round(totalMensualitesCredits), montantAnnuel: Math.round(totalMensualitesCredits * 12) })
    }

    // Construire le snapshot
    const snapshot = {
      identite: {
        nom: client.lastName,
        prenom: client.firstName,
        dateNaissance: client.birthDate,
        situationFamiliale: client.maritalStatus,
        regimeMatrimonial: client.matrimonialRegime,
        enfants: client.numberOfChildren || 0,
        profession: client.profession || null,
      },
      revenus: {
        details: revenusDetails,
        total: Math.round(revenuTotalEffectif),
        totalMensuel: Math.round(revenuTotalEffectif / 12),
      },
      charges: {
        details: chargesDetails,
        passifs: passifsFormatted,
        total: Math.round(totalMensualitesCredits * 12),
        totalMensuel: Math.round(totalMensualitesCredits),
        totalMensualitesCredits: Math.round(totalMensualitesCredits),
      },
      patrimoineImmobilier,
      patrimoineFinancier,
      patrimoineProfessionnel,
      contrats: contrats.map((c: any) => ({
        id: c.id,
        type: c.type,
        assureur: c.provider,
        produit: c.name,
        prime: Number(c.commission || 0),
        statut: c.status,
      })),
    }

    return createSuccessResponse(snapshot)
  } catch (error) {
    logger.error('Error in GET /api/advisor/clients/[id]/patrimoine-snapshot:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
