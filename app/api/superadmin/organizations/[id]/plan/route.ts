import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/supabase/auth-helpers';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updatePlanSchema = z.object({
  plan: z.enum(['TRIAL', 'STARTER', 'BUSINESS', 'PREMIUM', 'ENTERPRISE', 'CUSTOM']),
  subscriptionStart: z.string().datetime().optional(),
  subscriptionEnd: z.string().datetime().optional(),
  updateQuotas: z.boolean().default(true),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();

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
    const validatedData = updatePlanSchema.parse(body);

    // Vérifier que le cabinet existe
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: params.id },
    });

    if (!cabinet) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 404 }
      );
    }

    // Définir les quotas par défaut selon le plan
    const defaultQuotas = {
      TRIAL: {
        maxUsers: 2,
        maxClients: 50,
        maxStorage: 1024, // 1 GB en MB
        maxSimulations: 100,
      },
      STARTER: {
        maxUsers: 5,
        maxClients: 200,
        maxStorage: 5120, // 5 GB
        maxSimulations: 500,
      },
      BUSINESS: {
        maxUsers: 15,
        maxClients: 1000,
        maxStorage: 20480, // 20 GB
        maxSimulations: 2000,
      },
      PREMIUM: {
        maxUsers: 50,
        maxClients: 5000,
        maxStorage: 102400, // 100 GB
        maxSimulations: 10000,
      },
      ENTERPRISE: {
        maxUsers: -1, // Illimité
        maxClients: -1,
        maxStorage: -1,
        maxSimulations: -1,
      },
      CUSTOM: {
        maxUsers: -1,
        maxClients: -1,
        maxStorage: -1,
        maxSimulations: -1,
      },
    };

    // Préparer les données de mise à jour
    const updateData: any = {
      plan: validatedData.plan,
    };

    // Si on passe d'un plan TRIAL à un plan payant, mettre à jour le statut
    if (cabinet.plan === 'TRIAL' && validatedData.plan !== 'TRIAL') {
      updateData.status = 'ACTIVE';
      updateData.subscriptionStart = validatedData.subscriptionStart 
        ? new Date(validatedData.subscriptionStart)
        : new Date();
      
      if (validatedData.subscriptionEnd) {
        updateData.subscriptionEnd = new Date(validatedData.subscriptionEnd);
      }
    }

    // Mettre à jour les quotas si demandé
    if (validatedData.updateQuotas) {
      updateData.quotas = defaultQuotas[validatedData.plan];
    }

    // Mettre à jour le cabinet
    const updatedCabinet = await prisma.cabinet.update({
      where: { id: params.id },
      data: updateData,
    });

    // Créer un log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        cabinetId: cabinet.id,
        action: 'UPDATE',
        entityType: 'Cabinet',
        entityId: cabinet.id,
        changes: {
          field: 'plan',
          oldValue: cabinet.plan,
          newValue: validatedData.plan,
          quotasUpdated: validatedData.updateQuotas,
        },
      },
    });

    return NextResponse.json({
      success: true,
      cabinet: {
        id: updatedCabinet.id,
        plan: updatedCabinet.plan,
        status: updatedCabinet.status,
        quotas: updatedCabinet.quotas,
        subscriptionStart: updatedCabinet.subscriptionStart,
        subscriptionEnd: updatedCabinet.subscriptionEnd,
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la mise à jour du plan:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
