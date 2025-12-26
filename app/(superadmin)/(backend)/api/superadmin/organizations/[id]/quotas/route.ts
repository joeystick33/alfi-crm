import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers';
import { prisma } from '@/app/_common/lib/prisma';
import { z } from 'zod';

const updateQuotasSchema = z.object({
  maxUsers: z.number().int().min(-1),
  maxClients: z.number().int().min(-1),
  maxStorage: z.number().int().min(-1),
  maxSimulations: z.number().int().min(-1),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request);
    const user = context.user;
    const { id: organizationId } = await params;

    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403);
    }

    // Vérifier que l'utilisateur est SuperAdmin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: user.email! },
    });

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403);
    }

    const body = await request.json();
    const validatedData = updateQuotasSchema.parse(body);

    // Vérifier que le cabinet existe
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: organizationId },
    });

    if (!cabinet) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour les quotas
    const updatedCabinet = await prisma.cabinet.update({
      where: { id: organizationId },
      data: {
        quotas: validatedData,
      },
    });

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        cabinetId: cabinet.id,
        action: 'MODIFICATION',
        entityType: 'Cabinet',
        entityId: cabinet.id,
        changes: {
          field: 'quotas',
          oldValue: cabinet.quotas,
          newValue: validatedData,
        },
      },
    });

    return NextResponse.json({
      success: true,
      quotas: updatedCabinet.quotas,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la mise à jour des quotas:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
