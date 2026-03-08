/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'
import { PdfGenerator } from '@/app/_common/lib/services/pdf-generator'
import { generateBilanPatrimonialPremiumHtml, BilanPatrimonialPremiumData } from '@/app/_common/lib/templates/bilan-patrimonial-premium'
import { buildAuditData } from '@/app/_common/lib/services/bilan-audit-builder'
import { logger } from '@/app/_common/lib/logger'
/**
 * POST /api/advisor/dossiers/[id]/generate-pdf-html
 * Génère un PDF professionnel à partir du template HTML
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: dossierId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Récupérer le dossier avec toutes les données nécessaires
    const dossier = await prisma.dossier.findFirst({
      where: {
        id: dossierId,
        cabinetId: context.cabinetId,
      },
      include: {
        client: true,
        conseiller: true,
      },
    }) as any

    if (!dossier) {
      return createErrorResponse('Dossier non trouvé', 404)
    }

    // Récupérer le cabinet
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: context.cabinetId },
    })

    // Récupérer les actifs du client
    const clientActifs = await prisma.clientActif.findMany({
      where: { clientId: dossier.clientId },
      include: { actif: true },
    })

    const actifs = clientActifs.map((ca: any) => ca.actif)

    // Récupérer les passifs du client
    const passifs = await prisma.passif.findMany({
      where: { clientId: dossier.clientId },
    }) as any[]

    // Récupérer les préconisations et simulations du dossier
    let preconisations: any[] = []
    let dossierSimulations: any[] = []
    try {
      preconisations = await (prisma as any).dossierPreconisation.findMany({
        where: { dossierId },
        orderBy: { ordre: 'asc' },
      })
      dossierSimulations = await (prisma as any).dossierSimulation.findMany({
        where: { dossierId, selectionne: true },
        orderBy: { ordre: 'asc' },
      })
    } catch {
      // Models may not exist yet
    }

    // Récupérer les contrats du client
    const contrats = await prisma.contrat.findMany({
      where: { clientId: dossier.clientId },
    }) as any[]

    // Construire les données d'audit complètes
    const auditData = buildAuditData({
      client: dossier.client,
      actifs,
      passifs,
      contrats,
      simulations: dossierSimulations,
    })

    // Construire les données pour le template
    const templateData: BilanPatrimonialPremiumData = {
      dossier: {
        id: dossier.id,
        reference: dossier.reference,
        type: dossier.type,
        categorie: dossier.categorie,
        createdAt: dossier.createdAt,
      },
      client: {
        nom: dossier.client.lastName,
        prenom: dossier.client.firstName,
        dateNaissance: dossier.client.birthDate,
        situationFamiliale: dossier.client.maritalStatus,
        regimeMatrimonial: dossier.client.matrimonialRegime,
        enfants: dossier.client.numberOfChildren,
        profession: dossier.client.profession,
        email: dossier.client.email,
        telephone: dossier.client.phone || dossier.client.mobile,
      },
      conseiller: dossier.conseiller ? {
        nom: dossier.conseiller.lastName || '',
        prenom: dossier.conseiller.firstName || '',
        email: dossier.conseiller.email || undefined,
      } : { nom: '', prenom: '', email: cabinet?.email || undefined },
      cabinet: cabinet ? {
        nom: cabinet.name,
        adresse: String(cabinet.address || ''),
        telephone: cabinet.phone || undefined,
        email: cabinet.email || undefined,
      } as any : undefined,
      patrimoine: {
        immobilier: actifs
          .filter((a: any) => a.category === 'IMMOBILIER')
          .map((a: any) => ({
            type: a.type,
            nom: a.name,
            valeur: Number(a.value),
            location: a.location,
          })),
        financier: actifs
          .filter((a: any) => ['EPARGNE', 'PLACEMENT', 'RETRAITE', 'FINANCIER'].includes(a.category))
          .map((a: any) => ({
            type: a.type,
            nom: a.name,
            valeur: Number(a.value),
          })),
        professionnel: actifs
          .filter((a: any) => a.category === 'PROFESSIONNEL')
          .map((a: any) => ({
            nom: a.name,
            valeur: Number(a.value),
          })),
        passifs: passifs.map((p: any) => ({
          type: p.type,
          nom: p.name,
          capitalRestant: Number(p.remainingAmount || 0),
          tauxInteret: Number(p.interestRate || 0),
          mensualite: Number(p.monthlyPayment || 0),
        })),
      },
      revenus: {
        total: Number(dossier.client.annualIncome || 0),
      },
      charges: {
        total: 0,
        totalMensualitesCredits: passifs.reduce((acc: number, p: any) => acc + Number(p.monthlyPayment || 0), 0),
      },
      simulations: dossierSimulations.map((s: any) => ({
        type: s.simulateurType,
        nom: s.nom,
        parametres: s.parametres,
        resultats: s.resultats,
      })),
      preconisations: preconisations.map((p: any) => ({
        titre: p.titre,
        description: p.description || '',
        priorite: p.priorite === 1 ? 'HAUTE' : p.priorite === 2 ? 'MOYENNE' : 'BASSE',
        montantEstime: p.montant ? Number(p.montant) : undefined,
        objectif: p.argumentaire || undefined,
      })),
      audit: auditData,
    }

    // Générer le HTML
    const html = generateBilanPatrimonialPremiumHtml(templateData)

    // Générer le PDF
    const pdfBuffer = await PdfGenerator.generateFromHtml(html, {
      format: 'A4',
      margin: {
        top: '0',
        right: '0',
        bottom: '0',
        left: '0',
      },
      printBackground: true,
    })

    // Retourner le PDF
    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Bilan_Patrimonial_${dossier.client.lastName}_${dossier.reference}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    logger.error('Error generating PDF:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse(
      error instanceof Error ? error.message : 'Erreur lors de la génération du PDF',
      500
    )
  }
}

/**
 * GET /api/advisor/dossiers/[id]/generate-pdf-html
 * Retourne le HTML du rapport (pour prévisualisation)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    const { id: dossierId } = await params

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    // Récupérer le dossier avec toutes les données nécessaires
    const dossier = await prisma.dossier.findFirst({
      where: {
        id: dossierId,
        cabinetId: context.cabinetId,
      },
      include: {
        client: true,
        conseiller: true,
      },
    }) as any

    if (!dossier) {
      return createErrorResponse('Dossier non trouvé', 404)
    }

    // Récupérer le cabinet
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: context.cabinetId },
    })

    // Récupérer les actifs du client
    const clientActifs = await prisma.clientActif.findMany({
      where: { clientId: dossier.clientId },
      include: { actif: true },
    })

    const actifs = clientActifs.map((ca: any) => ca.actif)

    // Récupérer les passifs du client
    const passifs = await prisma.passif.findMany({
      where: { clientId: dossier.clientId },
    }) as any[]

    // Récupérer les préconisations et simulations du dossier
    let preconisations: any[] = []
    let dossierSimulations: any[] = []
    try {
      preconisations = await (prisma as any).dossierPreconisation.findMany({
        where: { dossierId },
        orderBy: { ordre: 'asc' },
      })
      dossierSimulations = await (prisma as any).dossierSimulation.findMany({
        where: { dossierId, selectionne: true },
        orderBy: { ordre: 'asc' },
      })
    } catch {
      // Models may not exist yet
    }

    // Récupérer les contrats du client
    const contrats = await prisma.contrat.findMany({
      where: { clientId: dossier.clientId },
    }) as any[]

    // Construire les données d'audit complètes
    const auditData = buildAuditData({
      client: dossier.client,
      actifs,
      passifs,
      contrats,
      simulations: dossierSimulations,
    })

    // Construire les données pour le template
    const templateData: BilanPatrimonialPremiumData = {
      dossier: {
        id: dossier.id,
        reference: dossier.reference,
        type: dossier.type,
        categorie: dossier.categorie,
        createdAt: dossier.createdAt,
      },
      client: {
        nom: dossier.client.lastName,
        prenom: dossier.client.firstName,
        dateNaissance: dossier.client.birthDate,
        situationFamiliale: dossier.client.maritalStatus,
        regimeMatrimonial: dossier.client.matrimonialRegime,
        enfants: dossier.client.numberOfChildren,
        profession: dossier.client.profession,
        email: dossier.client.email,
        telephone: dossier.client.phone || dossier.client.mobile,
      },
      conseiller: dossier.conseiller ? {
        nom: dossier.conseiller.lastName || '',
        prenom: dossier.conseiller.firstName || '',
        email: dossier.conseiller.email || undefined,
      } : { nom: '', prenom: '', email: cabinet?.email || undefined },
      cabinet: cabinet ? {
        nom: cabinet.name,
        adresse: String(cabinet.address || ''),
        telephone: cabinet.phone || undefined,
        email: cabinet.email || undefined,
      } as any : undefined,
      patrimoine: {
        immobilier: actifs
          .filter((a: any) => a.category === 'IMMOBILIER')
          .map((a: any) => ({
            type: a.type,
            nom: a.name,
            valeur: Number(a.value),
            location: a.location,
          })),
        financier: actifs
          .filter((a: any) => ['EPARGNE', 'PLACEMENT', 'RETRAITE', 'FINANCIER'].includes(a.category))
          .map((a: any) => ({
            type: a.type,
            nom: a.name,
            valeur: Number(a.value),
          })),
        professionnel: actifs
          .filter((a: any) => a.category === 'PROFESSIONNEL')
          .map((a: any) => ({
            nom: a.name,
            valeur: Number(a.value),
          })),
        passifs: passifs.map((p: any) => ({
          type: p.type,
          nom: p.name,
          capitalRestant: Number(p.remainingAmount || 0),
          tauxInteret: Number(p.interestRate || 0),
          mensualite: Number(p.monthlyPayment || 0),
        })),
      },
      revenus: {
        total: Number(dossier.client.annualIncome || 0),
      },
      charges: {
        total: 0,
        totalMensualitesCredits: passifs.reduce((acc: number, p: any) => acc + Number(p.monthlyPayment || 0), 0),
      },
      simulations: dossierSimulations.map((s: any) => ({
        type: s.simulateurType,
        nom: s.nom,
        parametres: s.parametres,
        resultats: s.resultats,
      })),
      preconisations: preconisations.map((p: any) => ({
        titre: p.titre,
        description: p.description || '',
        priorite: p.priorite === 1 ? 'HAUTE' : p.priorite === 2 ? 'MOYENNE' : 'BASSE',
        montantEstime: p.montant ? Number(p.montant) : undefined,
        objectif: p.argumentaire || undefined,
      })),
      audit: auditData,
    }

    // Générer et retourner le HTML
    const html = generateBilanPatrimonialPremiumHtml(templateData)

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })
  } catch (error) {
    logger.error('Error generating HTML preview:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse(
      error instanceof Error ? error.message : 'Erreur lors de la génération du HTML',
      500
    )
  }
}
