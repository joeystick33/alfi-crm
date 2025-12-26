import { NextRequest } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'
import {
  requireAuth,
  createErrorResponse,
  createSuccessResponse,
} from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { mapExpenseCategory } from '@/app/_common/lib/enum-mappings'
import { z } from 'zod'

// ============================================
// Schéma de validation pour les charges
// Les valeurs sont uniformes: Frontend = Prisma = Supabase
// ============================================
const expenseSchema = z.object({
  libelle: z.string().min(1, 'Le libellé est requis'),
  description: z.string().optional(),
  categorie: z.string().min(1, 'La catégorie est requise'),
  montant: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]),
  frequence: z.string().default('MENSUEL'),
  estFixe: z.boolean().default(true),
  estEssentiel: z.boolean().default(false),
  estDeductible: z.boolean().default(false),
  tauxDeductibilite: z.number().optional(),
  dateDebut: z.string().optional(),
  dateFin: z.string().optional(),
  datePrelevement: z.number().optional(),
  beneficiaire: z.string().optional(),
  numeroContrat: z.string().optional(),
  referenceMandat: z.string().optional(),
  notes: z.string().optional(),
  documents: z.any().optional(),
})

// Multiplicateurs pour calcul du montant annuel
const FREQUENCE_MULTIPLIER: Record<string, number> = {
  MENSUEL: 12,
  BIMESTRIEL: 6,
  TRIMESTRIEL: 4,
  SEMESTRIEL: 2,
  ANNUEL: 1,
  PONCTUEL: 1,
}

// Utilise mapExpenseCategory depuis enum-mappings.ts pour le mapping centralisé

// ============================================
// GET /api/advisor/clients/[id]/expenses
// ============================================
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId } = await params

    const expenses = await prisma.expense.findMany({
      where: {
        clientId,
        cabinetId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Les colonnes sont maintenant en français dans Prisma
    return createSuccessResponse(expenses)
  } catch (error: any) {
    console.error('Error fetching expenses:', error)
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to fetch expenses', 500)
  }
}

// ============================================
// POST /api/advisor/clients/[id]/expenses
// ============================================
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const context = await requireAuth(req)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId } = await params
    const body = await req.json()

    // Validation
    const validated = expenseSchema.parse(body)

    // Extraire les valeurs (uniforme frontend/backend)
    const montant = Number(validated.montant) || 0
    const frequence = validated.frequence || 'MENSUEL'
    const multiplier = FREQUENCE_MULTIPLIER[frequence] || 12
    const montantAnnuel = montant * multiplier

    const expense = await prisma.expense.create({
      data: {
        cabinetId,
        clientId,
        libelle: validated.libelle,
        description: validated.description,
        categorie: mapExpenseCategory(validated.categorie) as any,
        montant,
        frequence: frequence as any,
        montantAnnuel,
        estFixe: validated.estFixe ?? true,
        estEssentiel: validated.estEssentiel ?? false,
        estDeductible: validated.estDeductible ?? false,
        tauxDeductibilite: validated.tauxDeductibilite,
        dateDebut: validated.dateDebut ? new Date(validated.dateDebut) : null,
        dateFin: validated.dateFin ? new Date(validated.dateFin) : null,
        datePrelevement: validated.datePrelevement,
        beneficiaire: validated.beneficiaire,
        numeroContrat: validated.numeroContrat,
        referenceMandat: validated.referenceMandat,
        notes: validated.notes,
        documents: validated.documents,
      },
    })

    return createSuccessResponse(expense, 201)
  } catch (error: any) {
    console.error('Error creating expense:', error)
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        'Données invalides: ' + error.issues.map(e => e.message).join(', '),
        400
      )
    }
    if (error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to create expense', 500)
  }
}
