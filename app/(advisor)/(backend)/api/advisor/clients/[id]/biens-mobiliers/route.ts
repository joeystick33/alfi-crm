 
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/app/_common/lib/prisma'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'

// Schéma de validation pour les biens mobiliers
const createBienMobilierSchema = z.object({
  type: z.string().min(1, 'Le type est requis'),
  categorie: z.string().optional(),
  libelle: z.string().min(1, 'Le libellé est requis'),
  description: z.string().optional(),
  marque: z.string().optional(),
  modele: z.string().optional(),
  annee: z.number().optional(),
  numeroSerie: z.string().optional(),
  immatriculation: z.string().optional(),
  valeurAcquisition: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  dateAcquisition: z.string().optional(),
  valeurActuelle: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]),
  dateEstimation: z.string().optional(),
  sourceEstimation: z.string().optional(),
  modeDetention: z.string().optional(),
  quotiteDetention: z.number().optional(),
  estAssure: z.boolean().optional(),
  assureur: z.string().optional(),
  montantAssurance: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  numeroPolice: z.string().optional(),
  estGage: z.boolean().optional(),
  organismePreteur: z.string().optional(),
  capitalRestantDu: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  creditId: z.string().optional(),
  estAmortissable: z.boolean().optional(),
  dureeAmortissement: z.number().optional(),
  valeurResiduelle: z.union([z.number(), z.string().transform(v => parseFloat(v) || 0)]).optional(),
  localisation: z.string().optional(),
  photos: z.array(z.string()).optional(),
  documents: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

// GET /api/advisor/clients/[id]/biens-mobiliers - Liste des biens mobiliers
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

    const biensMobiliers = await prisma.bienMobilier.findMany({
      where: {
        clientId,
        cabinetId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return createSuccessResponse(biensMobiliers)
  } catch (error: unknown) {
    console.error('Error fetching biens mobiliers:', error)
    if ((error as Error).message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to fetch biens mobiliers', 500)
  }
}

// POST /api/advisor/clients/[id]/biens-mobiliers - Créer un bien mobilier
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

    // Validation avec Zod
    const data = createBienMobilierSchema.parse(body)

    // Calcul de la plus-value latente
    const valeurAcquisition = Number(data.valeurAcquisition) || 0
    const valeurActuelle = Number(data.valeurActuelle) || 0
    const plusValueLatente = valeurActuelle - valeurAcquisition

    const bienMobilier = await prisma.bienMobilier.create({
      data: {
        cabinetId,
        clientId,
        type: data.type as any, // Type casting pour enum Prisma
        categorie: data.categorie as any,
        libelle: data.libelle,
        description: data.description,
        marque: data.marque,
        modele: data.modele,
        annee: data.annee,
        numeroSerie: data.numeroSerie,
        immatriculation: data.immatriculation,
        valeurAcquisition,
        dateAcquisition: data.dateAcquisition ? new Date(data.dateAcquisition) : null,
        valeurActuelle,
        dateEstimation: data.dateEstimation ? new Date(data.dateEstimation) : new Date(),
        sourceEstimation: (data.sourceEstimation || 'DECLARATION') as any,
        plusValueLatente,
        modeDetention: (data.modeDetention || 'PLEINE_PROPRIETE') as any,
        quotiteDetention: data.quotiteDetention || 100,
        estAssure: data.estAssure || false,
        assureur: data.assureur,
        montantAssurance: data.montantAssurance,
        numeroPolice: data.numeroPolice,
        estGage: data.estGage || false,
        organismePreteur: data.organismePreteur,
        capitalRestantDu: data.capitalRestantDu,
        creditId: data.creditId,
        estAmortissable: data.estAmortissable || false,
        dureeAmortissement: data.dureeAmortissement,
        valeurResiduelle: data.valeurResiduelle,
        localisation: data.localisation,
        photos: data.photos,
        documents: data.documents,
        notes: data.notes,
      },
    })

    return createSuccessResponse(bienMobilier, 201)
  } catch (error: unknown) {
    console.error('Error creating bien mobilier:', error)
    if (error instanceof z.ZodError) {
      return createErrorResponse('Données invalides: ' + error.issues.map(e => e.message).join(', '), 400)
    }
    if ((error as Error).message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Failed to create bien mobilier', 500)
  }
}
