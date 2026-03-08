import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/app/_common/lib/prisma'
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { mapCreditType } from '@/app/_common/lib/enum-mappings'
import { logger } from '@/app/_common/lib/logger'
// Schéma de validation pour les crédits
const createCreditSchema = z.object({
  libelle: z.string().min(1, 'Le libellé est requis'),
  type: z.string().min(1, 'Le type est requis'),
  status: z.string().optional(),
  numeroContrat: z.string().optional(),
  organisme: z.string().optional(),
  agence: z.string().optional(),
  contactNom: z.string().optional(),
  contactTel: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  montantInitial: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]),
  capitalRestantDu: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  montantRembourse: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  tauxNominal: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  tauxEffectifGlobal: z
    .union([z.number(), z.string().transform(v => parseFloat(v) || 0)])
    .optional(),
  typeAmortissement: z.string().optional(),
  mensualiteHorsAssurance: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]),
  mensualiteTotale: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  dateDebut: z.string().min(1, 'La date de début est requise'),
  dateFin: z.string().min(1, 'La date de fin est requise'),
  jourPrelevement: z.number().optional(),
  assuranceEmprunteur: z.boolean().optional(),
  assureurNom: z.string().optional(),
  assuranceMontant: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  assuranceTaux: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  assuranceQuotite: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  assuranceCouvertures: z.any().optional(),
  assuranceDateFin: z.string().optional(),
  assuranceDelegation: z.boolean().optional(),
  garanties: z.any().optional(),
  bienFinanceId: z.string().optional(),
  modulable: z.boolean().optional(),
  differe: z.boolean().optional(),
  differeMois: z.number().optional(),
  rachetable: z.boolean().optional(),
  penalitesRemboursement: z
    .union([z.number(), z.string().transform(v => parseFloat(v) || 0)])
    .optional(),
  notes: z.string().optional(),
  documents: z.any().optional(),
})

// GET /api/advisor/clients/[id]/credits - Liste des crédits
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId } = await params

    const credits = await prisma.credit.findMany({
      where: {
        clientId,
        cabinetId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return createSuccessResponse(credits)
  } catch (error: any) {
    logger.error('Error fetching credits:', { error: error instanceof Error ? error.message : String(error) })
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to fetch credits', 500)
  }
}

// POST /api/advisor/clients/[id]/credits - Créer un crédit
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId } = await params
    const body = await req.json()

    // Validation avec Zod
    const data = createCreditSchema.parse(body)

    // Utilise le mapping centralisé depuis enum-mappings.ts
    const mappedType = mapCreditType(data.type)

    // Calcul de la durée restante en mois
    const dateDebut = new Date(data.dateDebut)
    const dateFin = new Date(data.dateFin)
    const now = new Date()
    const dureeRestanteMois = Math.max(
      0,
      Math.ceil((dateFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30))
    )
    const dureeInitialeMois = Math.ceil(
      (dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24 * 30)
    )

    const credit = await prisma.credit.create({
      data: {
        cabinetId,
        clientId,
        libelle: data.libelle,
        type: mappedType as any, // Type simplifié mappé vers enum Prisma
        status: (data.status || 'EN_COURS') as any,
        numeroContrat: data.numeroContrat,
        organisme: data.organisme,
        agence: data.agence,
        contactNom: data.contactNom,
        contactTel: data.contactTel,
        contactEmail: data.contactEmail || undefined,
        montantInitial: data.montantInitial,
        capitalRestantDu: data.capitalRestantDu || data.montantInitial,
        montantRembourse: data.montantRembourse || 0,
        tauxNominal: data.tauxNominal,
        tauxEffectifGlobal: data.tauxEffectifGlobal,
        typeAmortissement: (data.typeAmortissement || 'LINEAIRE') as any,
        mensualiteHorsAssurance: data.mensualiteHorsAssurance,
        mensualiteTotale: data.mensualiteTotale || data.mensualiteHorsAssurance,
        dateDebut,
        dateFin,
        dureeInitialeMois,
        dureeRestanteMois,
        jourPrelevement: data.jourPrelevement || 5,
        // Assurance emprunteur
        assuranceEmprunteur: data.assuranceEmprunteur || false,
        assureurNom: data.assureurNom,
        assuranceMontant: data.assuranceMontant,
        assuranceTaux: data.assuranceTaux,
        assuranceQuotite: data.assuranceQuotite,
        assuranceCouvertures: data.assuranceCouvertures,
        assuranceDateFin: data.assuranceDateFin ? new Date(data.assuranceDateFin) : null,
        assuranceDelegation: data.assuranceDelegation || false,
        // Garanties
        garanties: data.garanties,
        bienFinanceId: data.bienFinanceId,
        // Options
        modulable: data.modulable || false,
        differe: data.differe || false,
        differeMois: data.differeMois,
        rachetable: data.rachetable ?? true,
        penalitesRemboursement: data.penalitesRemboursement,
        notes: data.notes,
        documents: data.documents,
      },
    })

    return createSuccessResponse(credit, 201)
  } catch (error: any) {
    logger.error('Error creating credit:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'Données invalides: ' + error.issues.map(e => e.message).join(', '),
        400
      )
    }
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to create credit', 500)
  }
}
