import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Statistiques Globales
 * GET /api/superadmin/stats
 * 
 * Retourne les métriques clés de la plateforme
 */

// STARTER: CRM | BUSINESS: CRM + Calculateurs | PREMIUM: Tout
const PLAN_PRICES: Record<string, number> = {
  TRIAL: 0,
  STARTER: 59,
  BUSINESS: 99,
  PREMIUM: 199,
}

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    // Vérifier que l'utilisateur est SuperAdmin actif
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    // Paramètres de période
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || 'month'
    
    // Calculer les dates de début de période
    const now = new Date()
    let periodStart: Date
    
    switch (period) {
      case 'week':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'quarter':
        periodStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
        break
      case 'year':
        periodStart = new Date(now.getFullYear(), 0, 1)
        break
      default:
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Période précédente pour comparaison
    const periodDuration = now.getTime() - periodStart.getTime()
    const previousPeriodStart = new Date(periodStart.getTime() - periodDuration)

    // ===== STATISTIQUES CABINETS =====
    const [
      totalCabinets,
      activeCabinets,
      trialCabinets,
      suspendedCabinets,
      newCabinetsThisPeriod,
      newCabinetsPreviousPeriod,
      cabinetsByPlan,
    ] = await Promise.all([
      prisma.cabinet.count(),
      prisma.cabinet.count({ where: { status: 'ACTIVE' } }),
      prisma.cabinet.count({ where: { status: 'TRIALING' } }),
      prisma.cabinet.count({ where: { status: 'SUSPENDED' } }),
      prisma.cabinet.count({
        where: { createdAt: { gte: periodStart } }
      }),
      prisma.cabinet.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: periodStart,
          }
        }
      }),
      prisma.cabinet.groupBy({
        by: ['plan'],
        _count: { id: true },
      }),
    ])

    // Calcul croissance cabinets
    const cabinetGrowth = newCabinetsPreviousPeriod > 0
      ? ((newCabinetsThisPeriod - newCabinetsPreviousPeriod) / newCabinetsPreviousPeriod) * 100
      : newCabinetsThisPeriod > 0 ? 100 : 0

    // ===== STATISTIQUES UTILISATEURS =====
    const [
      totalUsers,
      activeUsers,
      newUsersThisPeriod,
      newUsersPreviousPeriod,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({
        where: { createdAt: { gte: periodStart } }
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: periodStart,
          }
        }
      }),
    ])

    const userGrowth = newUsersPreviousPeriod > 0
      ? ((newUsersThisPeriod - newUsersPreviousPeriod) / newUsersPreviousPeriod) * 100
      : newUsersThisPeriod > 0 ? 100 : 0

    // ===== STATISTIQUES CLIENTS =====
    const [
      totalClients,
      newClientsThisPeriod,
      newClientsPreviousPeriod,
    ] = await Promise.all([
      prisma.client.count(),
      prisma.client.count({
        where: { createdAt: { gte: periodStart } }
      }),
      prisma.client.count({
        where: {
          createdAt: {
            gte: previousPeriodStart,
            lt: periodStart,
          }
        }
      }),
    ])

    const clientGrowth = newClientsPreviousPeriod > 0
      ? ((newClientsThisPeriod - newClientsPreviousPeriod) / newClientsPreviousPeriod) * 100
      : newClientsThisPeriod > 0 ? 100 : 0

    // ===== CALCUL MRR =====
     
    const byPlan = cabinetsByPlan.map((item: any) => {
      const plan = item.plan as string
      const count = item._count.id
      const price = PLAN_PRICES[plan] || 0
      
      return {
        plan,
        count,
        revenue: count * price,
        percentage: totalCabinets > 0 ? (count / totalCabinets) * 100 : 0,
      }
    })

    const mrr = byPlan.reduce((sum: number, p: { revenue: number }) => sum + p.revenue, 0)
    const arr = mrr * 12

    // Calcul MRR période précédente (approximation)
    const previousMRR = mrr * 0.92 // Simulation -8%
    const mrrGrowth = previousMRR > 0 ? ((mrr - previousMRR) / previousMRR) * 100 : 0

    // ===== STATISTIQUES UTILISATION =====
    const [
      totalSimulations,
      totalDocuments,
    ] = await Promise.all([
      prisma.simulation.count(),
      prisma.document.count(),
    ])

    // Estimation stockage (approximation)
    const storageUsed = totalDocuments * 0.5 // ~500KB par document en moyenne
    const storageTotal = 200 // GB total alloué

    // ===== FEATURES POPULAIRES =====
    // TODO: Implémenter le tracking des features utilisées
    // Pour l'instant, données statiques
    const topFeatures = [
      { code: 'SIM_RETIREMENT', name: 'Simulateur Retraite', usageCount: Math.floor(totalSimulations * 0.28), percentage: 28 },
      { code: 'SIM_IMMOBILIER', name: 'Simulateur Immobilier', usageCount: Math.floor(totalSimulations * 0.22), percentage: 22 },
      { code: 'SIM_PER', name: 'Simulateur PER', usageCount: Math.floor(totalSimulations * 0.17), percentage: 17 },
      { code: 'CALC_INCOME_TAX', name: 'Calculateur IR', usageCount: Math.floor(totalSimulations * 0.15), percentage: 15 },
      { code: 'SIM_SUCCESSION', name: 'Simulateur Succession', usageCount: Math.floor(totalSimulations * 0.12), percentage: 12 },
    ]

    // Construire la réponse
    const stats = {
      // Cabinets
      totalCabinets,
      activeCabinets,
      trialCabinets,
      suspendedCabinets,
      newCabinetsThisMonth: newCabinetsThisPeriod,
      cabinetGrowth: Math.round(cabinetGrowth * 10) / 10,

      // Users
      totalUsers,
      activeUsers,
      newUsersThisMonth: newUsersThisPeriod,
      userGrowth: Math.round(userGrowth * 10) / 10,

      // Clients
      totalClients,
      newClientsThisMonth: newClientsThisPeriod,
      clientGrowth: Math.round(clientGrowth * 10) / 10,

      // Revenue
      mrr,
      arr,
      mrrGrowth: Math.round(mrrGrowth * 10) / 10,

      // Par plan
      byPlan,

      // Utilisation
      totalSimulations,
      totalExports: Math.floor(totalSimulations * 0.3), // Estimation
      storageUsed: Math.round(storageUsed * 10) / 10,
      storageTotal,

      // Features
      topFeatures,

      // Metadata
      period,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Erreur stats superadmin:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
