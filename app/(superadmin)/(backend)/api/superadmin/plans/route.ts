import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Plans d'Abonnement
 * GET /api/superadmin/plans - Liste les plans avec statistiques
 * PUT /api/superadmin/plans - Mettre à jour un plan
 */

// STARTER: CRM uniquement | BUSINESS: CRM + Calculateurs | PREMIUM: CRM + Calculateurs + Simulateurs
const PLAN_DEFINITIONS: Record<string, {
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  quotas: { maxUsers: number; maxClients: number; maxStorage: number; maxSimulations: number }
  features: { simulators: string[]; calculators: string[]; modules: string[] }
}> = {
  TRIAL: {
    name: 'Essai Gratuit',
    description: '14 jours pour découvrir Aura CRM',
    monthlyPrice: 0,
    yearlyPrice: 0,
    quotas: { maxUsers: 2, maxClients: 50, maxStorage: 1, maxSimulations: 0 },
    features: {
      simulators: [],
      calculators: [],
      modules: ['MOD_BASE', 'MOD_CLIENT_360'],
    },
  },
  STARTER: {
    name: 'Starter',
    description: 'CRM complet pour démarrer',
    monthlyPrice: 59,
    yearlyPrice: 590,
    quotas: { maxUsers: 3, maxClients: 150, maxStorage: 5, maxSimulations: 0 },
    features: {
      simulators: [],
      calculators: [],
      modules: ['MOD_BASE', 'MOD_CLIENT_360', 'MOD_DOCUMENTS', 'MOD_EXPORT_PDF'],
    },
  },
  BUSINESS: {
    name: 'Business',
    description: 'CRM + Calculateurs fiscaux',
    monthlyPrice: 99,
    yearlyPrice: 990,
    quotas: { maxUsers: 10, maxClients: 500, maxStorage: 20, maxSimulations: 0 },
    features: {
      simulators: [],
      calculators: ['CALC_INCOME_TAX', 'CALC_IFI', 'CALC_CAPITAL_GAINS', 'CALC_DONATION', 'CALC_INHERITANCE', 'CALC_DEBT_CAPACITY', 'CALC_BUDGET'],
      modules: ['MOD_BASE', 'MOD_CLIENT_360', 'MOD_DOCUMENTS', 'MOD_EXPORT_PDF', 'MOD_EXPORT_EXCEL', 'MOD_CLIENT_PORTAL'],
    },
  },
  PREMIUM: {
    name: 'Premium',
    description: 'Accès complet : CRM + Calculateurs + Simulateurs',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    quotas: { maxUsers: -1, maxClients: -1, maxStorage: 100, maxSimulations: -1 },
    features: {
      simulators: ['ALL'],
      calculators: ['ALL'],
      modules: ['ALL'],
    },
  },
}

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    // Compter les cabinets par plan
    const cabinetsByPlan = await prisma.cabinet.groupBy({
      by: ['plan'],
      _count: { id: true },
      where: { status: { not: 'TERMINATED' } },
    })

    // Construire les données des plans avec les stats
    const plans = Object.entries(PLAN_DEFINITIONS).map(([code, definition]) => {
      const cabinetCount = cabinetsByPlan.find(c => c.plan === code)?._count.id || 0
      
      return {
        id: code.toLowerCase(),
        code,
        ...definition,
        isPopular: code === 'BUSINESS',
        isCustom: false,
        cabinetsCount: cabinetCount,
      }
    })

    // Calculer les stats globales
    const totalMRR = plans.reduce((sum, p) => sum + (p.monthlyPrice * p.cabinetsCount), 0)
    const totalCabinets = plans.reduce((sum, p) => sum + p.cabinetsCount, 0)

    return NextResponse.json({
      plans,
      stats: {
        totalMRR,
        totalARR: totalMRR * 12,
        totalCabinets,
        averageRevenue: totalCabinets > 0 ? totalMRR / totalCabinets : 0,
      },
    })
  } catch (error) {
    console.error('Erreur plans:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    // Vérifier les permissions (seul OWNER peut modifier les plans)
    if (superAdmin.role !== 'OWNER') {
      return createErrorResponse('Seuls les propriétaires peuvent modifier les plans', 403)
    }

    const body = await request.json()
    const { planCode, updates } = body

    if (!planCode || !updates) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    // Sauvegarder les modifications dans SystemConfig
    await prisma.systemConfig.upsert({
      where: { key: `plan_${planCode}` },
      create: {
        key: `plan_${planCode}`,
        value: updates,
        category: 'plans',
        updatedById: superAdmin.id,
      },
      update: {
        value: updates,
        updatedById: superAdmin.id,
      },
    })

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        action: 'MODIFICATION',
        entityType: 'Plan',
        entityId: planCode,
        changes: updates,
      },
    })

    return NextResponse.json({ 
      success: true, 
      message: `Plan ${planCode} mis à jour` 
    })
  } catch (error) {
    console.error('Erreur modification plan:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
