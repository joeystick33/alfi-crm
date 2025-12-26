/**
 * API Route: /api/advisor/clients/[id]/patrimoine-financier-pro
 * GET - Liste le patrimoine financier pro d'un client
 * POST - Crée un nouveau placement
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { TypePlacementPro } from '@prisma/client'

const createSchema = z.object({
  type: z.nativeEnum(TypePlacementPro),
  libelle: z.string().min(1),
  etablissement: z.string().optional().nullable(),
  numeroContrat: z.string().optional().nullable(),
  montantInvesti: z.number().min(0),
  valeurActuelle: z.number().min(0),
  dateOuverture: z.string().optional().nullable(),
  dateEcheance: z.string().optional().nullable(),
  tauxRendement: z.number().optional().nullable(),
  plusValueLatente: z.number().optional().nullable(),
  disponible: z.boolean().default(true),
  preavisSortie: z.number().optional().nullable(),
  regimeFiscal: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

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

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId: context.cabinetId },
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    const patrimoineFinancierPro = await prisma.patrimoineFinancierPro.findMany({
      where: { clientId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })

    const totalInvesti = patrimoineFinancierPro.reduce(
      (sum, p) => sum + Number(p.montantInvesti), 0
    )
    const totalValeurActuelle = patrimoineFinancierPro.reduce(
      (sum, p) => sum + Number(p.valeurActuelle), 0
    )
    const totalPlusValueLatente = patrimoineFinancierPro.reduce(
      (sum, p) => sum + Number(p.plusValueLatente || 0), 0
    )
    const totalDisponible = patrimoineFinancierPro
      .filter(p => p.disponible)
      .reduce((sum, p) => sum + Number(p.valeurActuelle), 0)

    return createSuccessResponse({
      patrimoineFinancierPro,
      count: patrimoineFinancierPro.length,
      totals: { 
        totalInvesti, 
        totalValeurActuelle, 
        totalPlusValueLatente,
        totalDisponible,
        rendementGlobal: totalInvesti > 0 ? ((totalValeurActuelle - totalInvesti) / totalInvesti * 100) : 0
      },
    })
  } catch (error: any) {
    console.error('Error getting patrimoine financier pro:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

export async function POST(
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
    const validatedData = createSchema.parse(body)

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId: context.cabinetId },
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    const placement = await prisma.patrimoineFinancierPro.create({
      data: {
        cabinetId: context.cabinetId,
        clientId,
        type: validatedData.type,
        libelle: validatedData.libelle,
        etablissement: validatedData.etablissement,
        numeroContrat: validatedData.numeroContrat,
        montantInvesti: validatedData.montantInvesti,
        valeurActuelle: validatedData.valeurActuelle,
        dateOuverture: validatedData.dateOuverture ? new Date(validatedData.dateOuverture) : null,
        dateEcheance: validatedData.dateEcheance ? new Date(validatedData.dateEcheance) : null,
        tauxRendement: validatedData.tauxRendement,
        plusValueLatente: validatedData.plusValueLatente,
        disponible: validatedData.disponible,
        preavisSortie: validatedData.preavisSortie,
        regimeFiscal: validatedData.regimeFiscal,
        notes: validatedData.notes,
      },
    })

    return createSuccessResponse({ patrimoineFinancierPro: placement, message: 'Placement créé avec succès' }, 201)
  } catch (error: any) {
    console.error('Error creating patrimoine financier pro:', error)

    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error: ' + error.message, 400)
    }

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
