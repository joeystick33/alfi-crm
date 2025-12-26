 
import { NextRequest } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { mapRevenueCategory } from '@/app/_common/lib/enum-mappings'
import { z } from 'zod'

// ============================================
// Schéma de validation pour les revenus
// Les valeurs sont uniformes: Frontend = Prisma = Supabase
// ============================================
const revenueSchema = z.object({
  libelle: z.string().min(1, 'Le libellé est requis'),
  description: z.string().optional(),
  categorie: z.string().min(1, 'La catégorie est requise'),
  montant: z.number().optional(),
  montantNet: z.number().optional(),
  montantBrut: z.number().optional(),
  frequence: z.string().default('MENSUEL'),
  fiscalite: z.string().optional(),
  tauxImposition: z.number().optional(),
  abattementForfaitaire: z.number().optional(),
  chargesSociales: z.number().optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  estRecurrent: z.boolean().default(true),
  sourceRevenu: z.string().optional(),
  numeroContrat: z.string().optional(),
  notes: z.string().optional(),
  documents: z.any().optional(),
}).refine(data => (data.montant !== undefined) || (data.montantNet !== undefined) || (data.montantBrut !== undefined), {
  message: "Un montant est requis",
})

// Multiplicateurs pour calcul du montant annuel
const FREQUENCE_MULTIPLIER: Record<string, number> = {
  MENSUEL: 12,
  TRIMESTRIEL: 4,
  SEMESTRIEL: 2,
  ANNUEL: 1,
  PONCTUEL: 1,
}

// ============================================
// GET /api/advisor/clients/[id]/revenues
// ============================================
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId } = await params

    const revenues = await prisma.revenue.findMany({
      where: {
        clientId,
        cabinetId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Les colonnes sont maintenant en français dans Prisma
    const result = revenues.map(r => ({
      ...r,
      // Alias pour compatibilité
      montantNet: r.montant,
      montantBrut: r.montant,
      sourceRevenu: r.sourceOrganisme,
    }))

    return createSuccessResponse(result)
  } catch (error: any) {
    console.error('Error fetching revenues:', error)
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to fetch revenues', 500)
  }
}

// ============================================
// POST /api/advisor/clients/[id]/revenues
// ============================================
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId } = await params
    const body = await req.json()

    // Validation
    const validated = revenueSchema.parse(body)

    // Extraire les valeurs (uniforme frontend/backend)
    const montant = validated.montant ?? validated.montantNet ?? validated.montantBrut ?? 0
    const frequence = validated.frequence || 'MENSUEL'
    const multiplier = FREQUENCE_MULTIPLIER[frequence] || 12
    const montantAnnuel = Number(montant) * multiplier

    const revenue = await prisma.revenue.create({
      data: {
        cabinetId,
        clientId,
        libelle: validated.libelle,
        description: validated.description,
        categorie: mapRevenueCategory(validated.categorie) as any,
        montant,
        frequence: frequence as any,
        montantAnnuel,
        fiscalite: (validated.fiscalite || 'IMPOSABLE_IR') as any,
        tauxImposition: validated.tauxImposition,
        abattementForfaitaire: validated.abattementForfaitaire,
        chargesSociales: validated.chargesSociales,
        dateDebut: validated.dateDebut ? new Date(validated.dateDebut) : null,
        dateFin: validated.dateFin ? new Date(validated.dateFin) : null,
        estRecurrent: validated.estRecurrent ?? true,
        sourceOrganisme: validated.sourceRevenu,
        numeroContrat: validated.numeroContrat,
        notes: validated.notes,
        documents: validated.documents,
      },
    })

    // Retourner avec alias
    return createSuccessResponse({
      ...revenue,
      montantNet: revenue.montant,
      montantBrut: revenue.montant,
      sourceRevenu: revenue.sourceOrganisme,
    }, 201)
  } catch (error: any) {
    console.error('Error creating revenue:', error)
    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides: ' + error.issues.map(e => e.message).join(', '), 400)
    }
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to create revenue', 500)
  }
}
