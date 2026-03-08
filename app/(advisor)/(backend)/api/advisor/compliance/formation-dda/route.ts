import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { FormationDDAService } from '@/app/_common/lib/services/formation-dda-service'

const createSchema = z.object({
  userId: z.string().min(1).optional(),
  titre: z.string().min(1, 'Le titre est requis'),
  organisme: z.string().min(1, 'L\'organisme est requis'),
  type: z.enum(['PRESENTIEL', 'DISTANCIEL', 'E_LEARNING', 'CONFERENCE', 'WEBINAIRE', 'CERTIFICATION']),
  dateDebut: z.string().transform(s => new Date(s)),
  dateFin: z.string().transform(s => new Date(s)).optional(),
  dureeHeures: z.number().min(0.5, 'Durée minimum 0.5h').max(100),
  categorieDDA: z.enum(['TECHNIQUE_PRODUIT', 'JURIDIQUE_FISCAL', 'COMMERCIAL', 'CONFORMITE', 'DIGITAL']).optional(),
  attestation: z.boolean().optional(),
  attestationUrl: z.string().url().optional(),
  notes: z.string().optional(),
})

/**
 * POST /api/advisor/compliance/formation-dda
 * Enregistre une formation DDA
 */
export async function POST(request: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(request)
    if (!cabinetId) return createErrorResponse('Cabinet non trouvé', 403)

    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse('Données invalides: ' + parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', '), 400)
    }

    const formation = await FormationDDAService.enregistrerFormation({
      cabinetId,
      userId: parsed.data.userId || user.id,
      titre: parsed.data.titre,
      organisme: parsed.data.organisme,
      type: parsed.data.type,
      dateDebut: parsed.data.dateDebut,
      dateFin: parsed.data.dateFin,
      dureeHeures: parsed.data.dureeHeures,
      categorieDDA: parsed.data.categorieDDA,
      attestation: parsed.data.attestation,
      attestationUrl: parsed.data.attestationUrl,
      notes: parsed.data.notes,
    })

    return createSuccessResponse(formation, 201)
  } catch (error: any) {
    return createErrorResponse(error.message || 'Erreur enregistrement formation', 500)
  }
}

/**
 * GET /api/advisor/compliance/formation-dda?annee=2025
 * GET /api/advisor/compliance/formation-dda?annee=2025&userId=xxx
 * GET /api/advisor/compliance/formation-dda?annee=2025&cabinet=true
 */
export async function GET(request: NextRequest) {
  try {
    const { user, cabinetId } = await requireAuth(request)
    if (!cabinetId) return createErrorResponse('Cabinet non trouvé', 403)

    const { searchParams } = new URL(request.url)
    const annee = parseInt(searchParams.get('annee') || String(new Date().getFullYear()))
    const userId = searchParams.get('userId')
    const cabinet = searchParams.get('cabinet')

    if (cabinet === 'true') {
      const bilanCabinet = await FormationDDAService.getBilanCabinet(cabinetId, annee)
      return createSuccessResponse(bilanCabinet)
    }

    const bilan = await FormationDDAService.getBilan(cabinetId, userId || user.id, annee)
    return createSuccessResponse(bilan)
  } catch (error: any) {
    return createErrorResponse(error.message || 'Erreur récupération bilan DDA', 500)
  }
}
