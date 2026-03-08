 
import { NextRequest } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers';
import { ContratService } from '@/app/_common/lib/services/contrat-service';
import { isRegularUser } from '@/app/_common/lib/auth-types';
import { z } from 'zod';
import { logger } from '@/app/_common/lib/logger'
// Schema aligné sur les enums Prisma ContratType et ContratStatus
const createContratSchema = z.object({
    name: z.string().min(1, 'Le nom est requis'),
    type: z.enum([
        'ASSURANCE_VIE',
        'MUTUELLE',
        'ASSURANCE_HABITATION',
        'ASSURANCE_AUTO',
        'ASSURANCE_PRO',
        'ASSURANCE_DECES',
        'PREVOYANCE',
        'EPARGNE_RETRAITE',
        'AUTRE'
    ]),
    provider: z.string().min(1, 'L\'assureur est requis'),
    contractNumber: z.string().optional(),
    value: z.number().min(0).optional(),
    coverage: z.number().min(0).optional(),
    premium: z.number().min(0).optional(),
    startDate: z.string().transform(val => new Date(val)),
    endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
    status: z.enum(['ACTIF', 'SUSPENDU', 'RESILIE', 'EXPIRE']).default('ACTIF'),
    beneficiaries: z.any().optional(),
    details: z.any().optional(),
});

/**
 * GET /api/advisor/clients/[id]/contrats
 * List client contracts
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const context = await requireAuth(request); const { user } = context;

        if (!isRegularUser(user)) {
            return createErrorResponse('Invalid user type', 400);
        }

        const { id } = await params;
        const service = new ContratService(context.cabinetId, user.id, context.isSuperAdmin);

        const contrats = await service.getClientContrats(id);

        return createSuccessResponse({
            contrats,
            count: contrats.length,
        });
    } catch (error: any) {
        logger.error('Error fetching contracts:', { error: error instanceof Error ? error.message : String(error) });
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401);
        }
        return createErrorResponse('Internal server error', 500);
    }
}

/**
 * POST /api/advisor/clients/[id]/contrats
 * Create a new contract for client
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const context = await requireAuth(request); const { user } = context;

        if (!isRegularUser(user)) {
            return createErrorResponse('Invalid user type', 400);
        }

        const { id } = await params;
        const body = await request.json();
        const data = createContratSchema.parse(body);

        const service = new ContratService(context.cabinetId, user.id, context.isSuperAdmin);

        const contrat = await service.createContrat({
            ...data,
            clientId: id,
        } as any);

        return createSuccessResponse({
            contrat,
            message: 'Contrat créé avec succès',
        }, 201);
    } catch (error: any) {
        logger.error('Error creating contract:', { error: error instanceof Error ? error.message : String(error) });
        if (error instanceof z.ZodError) {
            return createErrorResponse('Données invalides', 400);
        }
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401);
        }
        return createErrorResponse('Internal server error', 500);
    }
}
