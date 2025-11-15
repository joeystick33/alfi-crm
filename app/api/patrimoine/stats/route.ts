import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import { isRegularUser } from '@/lib/auth-types';

/**
 * GET /api/patrimoine/stats
 * Récupère les statistiques globales du patrimoine
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request);
    
    if (!isRegularUser(context.user)) {
      return createErrorResponse('Accès non autorisé', 403);
    }

    const { cabinetId } = context;

    // Récupérer tous les actifs du cabinet
    const actifs = await prisma.actif.findMany({
      where: { cabinetId },
      select: {
        id: true,
        valeurActuelle: true,
        performance: true,
        gere: true
      }
    });

    // Récupérer tous les passifs du cabinet
    const passifs = await prisma.passif.findMany({
      where: { cabinetId },
      select: {
        id: true,
        montantRestant: true
      }
    });

    // Récupérer tous les contrats du cabinet
    const contrats = await prisma.contrat.findMany({
      where: { cabinetId },
      select: {
        id: true,
        valeur: true,
        statut: true
      }
    });

    // Calculer les totaux
    const totalActifs = actifs.reduce((sum, a) => sum + (a.valeurActuelle || 0), 0);
    const totalPassifs = passifs.reduce((sum, p) => sum + (p.montantRestant || 0), 0);
    const totalWealth = totalActifs - totalPassifs;

    // Calculer la croissance (estimation basée sur la performance moyenne)
    const avgPerformance = actifs.length > 0
      ? actifs.reduce((sum, a) => sum + (a.performance || 0), 0) / actifs.length
      : 0;

    const stats = {
      totalWealth,
      totalActifs,
      totalPassifs,
      wealthGrowth: avgPerformance.toFixed(2),
      actifsCount: actifs.length,
      passifsCount: passifs.length,
      contratsCount: contrats.length,
      contratsActifs: contrats.filter(c => c.statut === 'ACTIF').length,
      actifsGeres: actifs.filter(a => a.gere).length,
      actifsNonGeres: actifs.filter(a => !a.gere).length
    };

    return createSuccessResponse(stats);
  } catch (error: any) {
    console.error('Erreur récupération stats patrimoine:', error);
    return createErrorResponse(
      error.message || 'Erreur lors de la récupération des statistiques',
      500
    );
  }
}
