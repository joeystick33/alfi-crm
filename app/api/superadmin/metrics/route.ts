import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    // Calculer les métriques globales
    const [
      totalOrganizations,
      activeOrganizations,
      totalAdvisors,
      totalClients,
      planDistribution,
    ] = await Promise.all([
      // Total cabinets
      prisma.cabinet.count(),

      // Cabinets actifs
      prisma.cabinet.count({
        where: { status: 'ACTIVE' },
      }),

      // Total conseillers
      prisma.user.count({
        where: { role: 'ADVISOR', isActive: true },
      }),

      // Total clients
      prisma.client.count(),

      // Répartition des plans
      prisma.cabinet.groupBy({
        by: ['plan'],
        _count: true,
      }),
    ]);

    // Calculer le MRR (Monthly Recurring Revenue)
    const planPrices: Record<string, number> = {
      TRIAL: 0,
      STARTER: 49,
      BUSINESS: 149,
      PREMIUM: 299,
      ENTERPRISE: 599,
      CUSTOM: 0,
    };

    const activeCabinets = await prisma.cabinet.findMany({
      where: { status: 'ACTIVE' },
      select: { plan: true },
    });

    const mrr = activeCabinets.reduce((sum, cabinet) => {
      return sum + (planPrices[cabinet.plan] || 0);
    }, 0);

    // Calculer la moyenne de clients par cabinet
    const avgClientsPerOrg = totalOrganizations > 0 
      ? Math.round(totalClients / totalOrganizations) 
      : 0;

    // Calculer le taux d'activation
    const activationRate = totalOrganizations > 0
      ? Math.round((activeOrganizations / totalOrganizations) * 100)
      : 0;

    // Formater la distribution des plans
    const planDistributionMap: Record<string, number> = {};
    planDistribution.forEach((item) => {
      planDistributionMap[item.plan] = item._count;
    });

    return NextResponse.json({
      totalOrganizations,
      activeOrganizations,
      totalAdvisors,
      totalClients,
      mrr,
      avgClientsPerOrg,
      activationRate,
      planDistribution: planDistributionMap,
    });
  } catch (error) {
    console.error('Erreur lors du chargement des métriques:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
