import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
const generatePdfSchema = z.object({
  type: z.enum(['BILAN_PATRIMONIAL', 'RAPPORT_CONSEIL', 'SIMULATION_DETAIL', 'RECUEIL_BESOINS', 'PROPOSITION_COMMERCIALE', 'LETTRE_MISSION', 'MANDAT', 'AUTRE']).optional().default('RAPPORT_CONSEIL'),
})

/**
 * POST /api/advisor/dossiers/[id]/generate-pdf
 * Générer un PDF pour le dossier
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

    let body = {}
    try {
      body = await request.json()
    } catch {
      // Body vide, on utilise les valeurs par défaut
    }
    
    const validated = generatePdfSchema.parse(body)

    // Récupérer le dossier complet avec toutes les relations
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, cabinetId: context.cabinetId },
      include: {
        client: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        conseiller: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        simulations: {
          where: { selectionne: true },
          orderBy: { ordre: 'asc' }
        },
        preconisations: {
          orderBy: { ordre: 'asc' }
        },
        documentsGeneres: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!dossier) {
      return createErrorResponse('Dossier non trouvé', 404)
    }

    // Déterminer la version
    const lastDoc = dossier.documentsGeneres[0]
    const newVersion = lastDoc ? lastDoc.version + 1 : 1

    // Générer le nom du fichier
    const docTypeName = validated.type.replace(/_/g, ' ').toLowerCase()
    const fileName = `${docTypeName} - ${dossier.client.firstName} ${dossier.client.lastName} - ${dossier.reference} v${newVersion}.pdf`

    // TODO: Intégrer @react-pdf/renderer pour la génération réelle
    // Pour l'instant, on simule la création d'un document
    const pdfUrl = `/api/advisor/dossiers/${dossierId}/pdf/v${newVersion}`

    // Créer l'entrée document
    const document = await prisma.dossierDocument.create({
      data: {
        dossierId,
        type: validated.type,
        nom: fileName,
        url: pdfUrl,
        taille: 0, // Sera mis à jour après génération réelle
        version: newVersion,
        genereParId: user.id,
      }
    })

    // Récupérer le cabinet pour les infos de personnalisation
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: context.cabinetId },
      select: { name: true, address: true, phone: true, email: true }
    })

    // Retourner les données pour le PDF (le frontend peut les utiliser pour preview)
    return createSuccessResponse({
      document,
      pdfData: {
        dossier: {
          reference: dossier.reference,
          nom: dossier.nom,
          categorie: dossier.categorie,
          type: dossier.type,
          dateOuverture: dossier.dateOuverture,
        },
        client: dossier.client,
        conseiller: dossier.conseiller,
        cabinet,
        snapshot: dossier.clientDataSnapshot,
        simulations: dossier.simulations.map(s => ({
          nom: s.nom,
          type: s.simulateurType,
          resultats: s.resultats,
        })),
        preconisations: dossier.preconisations.map(p => ({
          titre: p.titre,
          description: p.description,
          argumentaire: p.argumentaire,
          montant: p.montant,
          statut: p.statut,
        })),
        generatedAt: new Date().toISOString(),
        version: newVersion,
      }
    }, 201)
  } catch (error) {
    logger.error('Error in POST /api/advisor/dossiers/[id]/generate-pdf:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
