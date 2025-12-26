/**
 * API Route: /api/advisor/clients/[id]/passifs
 * Récupère les passifs (crédits, dettes) d'un client spécifique
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { PassifService } from '@/app/_common/lib/services/passif-service'
import { mapPassifType } from '@/app/_common/lib/enum-mappings'
import { z } from 'zod'

// Schéma de validation pour les passifs
const createPassifSchema = z.object({
  name: z.string().optional(),
  nom: z.string().optional(),
  type: z.string().optional(),
  typeCredit: z.string().optional(),
  initialAmount: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  montantInitial: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  remainingAmount: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  capitalRestant: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  interestRate: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  tauxInteret: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  monthlyPayment: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  mensualite: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  startDate: z.string().optional(),
  dateDebut: z.string().optional(),
  endDate: z.string().optional(),
  dateFin: z.string().optional(),
  description: z.string().optional(),
  linkedActifId: z.string().optional(),
  hasInsurance: z.boolean().optional(),
  insurance: z.record(z.string(), z.unknown()).optional(),
})

/**
 * GET /api/advisor/clients/[id]/passifs
 * Returns all passifs (liabilities) for a specific client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId, isSuperAdmin } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId } = await params

    const service = new PassifService(cabinetId, user.id, isSuperAdmin)
    const passifs = await service.listPassifsWithClients({ clientId })

    // Calculer les totaux
    const totalInitial = passifs.reduce((sum: number, p: { initialAmount?: number | null }) => 
      sum + Number(p.initialAmount || 0), 0)
    const totalRestant = passifs.reduce((sum: number, p: { remainingAmount?: number | null }) => 
      sum + Number(p.remainingAmount || 0), 0)
    const mensualitesTotales = passifs.reduce((sum: number, p: { monthlyPayment?: number | null }) => 
      sum + Number(p.monthlyPayment || 0), 0)

    return createSuccessResponse({
      passifs,
      summary: {
        count: passifs.length,
        totalInitial,
        totalRestant,
        mensualitesTotales,
        tauxEndettementEstime: 0, // À calculer avec les revenus
      }
    })
  } catch (error: unknown) {
    console.error('Get client passifs error:', error)

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/clients/[id]/passifs
 * Crée un nouveau passif pour un client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId, isSuperAdmin } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId } = await params
    const body = await request.json()

    // Validation avec Zod
    const validated = createPassifSchema.parse(body)

    // Normaliser les champs FR/EN
    // startDate est requis par Prisma - utiliser la date actuelle si non fournie
    const startDateValue = validated.startDate || validated.dateDebut || new Date().toISOString().split('T')[0]
    // endDate est requis par Prisma - fallback sur startDate si absent
    const endDateValue = validated.endDate || validated.dateFin || startDateValue
    
    const normalizedData = {
      name: validated.name || validated.nom || 'Passif',
      type: mapPassifType(validated.type || validated.typeCredit),
      initialAmount: validated.initialAmount || validated.montantInitial || 0,
      remainingAmount: validated.remainingAmount || validated.capitalRestant || 0,
      interestRate: validated.interestRate || validated.tauxInteret || 0,
      monthlyPayment: validated.monthlyPayment || validated.mensualite || 0,
      startDate: new Date(startDateValue),
      endDate: new Date(endDateValue),
      description: validated.description,
      linkedActifId: validated.linkedActifId,
      hasInsurance: validated.hasInsurance,
      insurance: validated.insurance,
      clientId,
    }

    const service = new PassifService(cabinetId, user.id, isSuperAdmin)
    const passif = await service.createPassif(normalizedData as Parameters<typeof service.createPassif>[0])

    return createSuccessResponse(passif, 201)
  } catch (error: unknown) {
    console.error('Create client passif error:', error)

    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides: ' + error.issues.map(e => e.message).join(', '), 400)
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}
