import { NextRequest, NextResponse } from 'next/server';
import { prisma, setRLSContext } from '@/app/_common/lib/prisma';
import { requireAuth } from '@/app/_common/lib/auth-helpers';

/**
 * GET /api/advisor/emails/accounts
 * Retourne la liste des comptes email connectés pour l'utilisateur courant.
 *
 * Le modèle EmailIntegration (défini dans schema.prisma) stocke une intégration
 * par utilisateur (relation 1-1). On la présente sous forme de tableau pour
 * simplifier le rendu côté client (évolutif vers plusieurs comptes).
 */
export async function GET(req: NextRequest) {
  try {
    const { user, cabinetId, isSuperAdmin } = await requireAuth(req);

    if (!cabinetId && !isSuperAdmin) {
      return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 400 });
    }

    if (cabinetId) {
      await setRLSContext(cabinetId, isSuperAdmin);
    }

    // Récupérer l'intégration email de l'utilisateur
    const integration = await prisma.emailIntegration.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        provider: true,
        email: true,
        syncEnabled: true,
        lastSyncAt: true,
        lastSyncStatus: true,
      },
    });

    if (!integration || !integration.syncEnabled) {
      return NextResponse.json({
        accounts: [],
        message:
          'Aucun compte email connecté. Utilisez les onglets Gmail ou Outlook pour en ajouter un.',
      });
    }

    // Normaliser en tableau pour l'interface (prêt pour multi-comptes futur)
    const accounts = [
      {
        id: integration.id,
        provider: integration.provider as 'GMAIL' | 'OUTLOOK',
        email: integration.email,
        syncEnabled: integration.syncEnabled,
        lastSyncAt: integration.lastSyncAt ? integration.lastSyncAt.toISOString() : null,
        lastSyncStatus: integration.lastSyncStatus ?? null,
      },
    ];

    return NextResponse.json({ accounts });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    console.error('[Email Accounts Error]:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur interne' },
      { status: 500 }
    );
  }
}
