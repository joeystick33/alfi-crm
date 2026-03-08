import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { DossierService } from '@/app/_common/lib/services/dossier-service'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
const createDossierSchema = z.object({
  clientId: z.string().min(1, 'Client requis'),
  conseillerId: z.string().optional(),
  nom: z.string().min(1, 'Nom du dossier requis'),
  description: z.string().optional(),
  categorie: z.enum(['PATRIMOINE', 'SUCCESSION', 'RETRAITE', 'INVESTISSEMENT', 'IMMOBILIER', 'CREDIT', 'ASSURANCE_PERSONNES', 'ASSURANCE_BIENS', 'ASSURANCE_PRO', 'ENTREPRISE', 'AUTRE']),
  type: z.string(), // Accept any type string, will be validated by Prisma
  status: z.enum(['EN_ATTENTE', 'EN_COURS', 'A_VALIDER', 'VALIDE', 'REJETE', 'TERMINE', 'BROUILLON', 'ACTIF', 'SUSPENDU', 'CLOTURE', 'ARCHIVE', 'ANNULE']).optional(),
  priorite: z.enum(['BASSE', 'NORMALE', 'HAUTE', 'URGENTE']).optional(),
  dateCloturePrevu: z.string().optional().transform(val => val ? new Date(val) : undefined),
  montantEstime: z.number().optional(),
  budgetAlloue: z.number().optional(),
  objetifs: z.string().optional(),
  risques: z.string().optional(),
  recommandations: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

function parseFilters(searchParams: URLSearchParams) {
  const filters: any = {}
  
  if (searchParams.get('clientId')) filters.clientId = searchParams.get('clientId')!
  if (searchParams.get('conseillerId')) filters.conseillerId = searchParams.get('conseillerId')!
  if (searchParams.get('status')) filters.status = searchParams.get('status')
  if (searchParams.get('type')) filters.type = searchParams.get('type')
  if (searchParams.get('priorite')) filters.priorite = searchParams.get('priorite')
  if (searchParams.get('search')) filters.search = searchParams.get('search')!
  if (searchParams.get('isArchive')) filters.isArchive = searchParams.get('isArchive') === 'true'
  
  if (searchParams.get('dateOuvertureFrom')) {
    filters.dateOuvertureFrom = new Date(searchParams.get('dateOuvertureFrom')!)
  }
  if (searchParams.get('dateOuvertureTo')) {
    filters.dateOuvertureTo = new Date(searchParams.get('dateOuvertureTo')!)
  }
  
  if (searchParams.get('tags')) {
    filters.tags = searchParams.get('tags')!.split(',')
  }
  
  if (searchParams.get('limit')) filters.limit = parseInt(searchParams.get('limit')!, 10)
  if (searchParams.get('offset')) filters.offset = parseInt(searchParams.get('offset')!, 10)
  if (searchParams.get('sortBy')) filters.sortBy = searchParams.get('sortBy')
  if (searchParams.get('sortOrder')) filters.sortOrder = searchParams.get('sortOrder')
  
  return filters
}

/**
 * GET /api/advisor/dossiers
 * Liste des dossiers avec filtres
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { searchParams } = new URL(request.url)
    const filters = parseFilters(searchParams)

    const service = new DossierService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const result = await service.listDossiers(filters)

    return createSuccessResponse(result)
  } catch (error) {
    logger.error('Error in GET /api/advisor/dossiers:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/dossiers
 * Créer un nouveau dossier
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const body = await request.json()
    
    let validated
    try {
      validated = createDossierSchema.parse(body)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const messages = error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        return createErrorResponse(`Validation échouée: ${messages}`, 400)
      }
      throw error
    }

    const service = new DossierService(
      context.cabinetId,
      user.id,
      context.isSuperAdmin
    )

    const dossier = await service.createDossier({
      ...validated,
      conseillerId: validated.conseillerId || user.id,
    })

    return createSuccessResponse(dossier, 201)
  } catch (error) {
    logger.error('Error in POST /api/advisor/dossiers:', { error: error instanceof Error ? error.message : String(error) })
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    if (error instanceof Error) {
      return createErrorResponse(error.message, 400)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
