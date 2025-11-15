import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'RESTRICTED', 'SUSPENDED', 'TERMINATED', 'TRIALING']),
  reason: z.string().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier que l'utilisateur est SuperAdmin
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: session.user.email! },
    });

    if (!superAdmin || !superAdmin.isActive) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateStatusSchema.parse(body);

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

    // Mettre à jour le statut
    const updatedCabinet = await prisma.cabinet.update({
      where: { id: params.id },
      data: {
        status: validatedData.status,
      },
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
          field: 'status',
          oldValue: cabinet.status,
          newValue: validatedData.status,
          reason: validatedData.reason,
        },
      },
    });

    return NextResponse.json({
      success: true,
      status: updatedCabinet.status,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Erreur lors de la mise à jour du statut:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
