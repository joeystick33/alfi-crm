import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Quotas Globaux
 * GET /api/superadmin/quotas - Statistiques de quotas
 */

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

    // Récupérer tous les cabinets avec leurs quotas et usage
    const cabinets = await prisma.cabinet.findMany({
      where: { status: { not: 'TERMINATED' } },
      select: {
        id: true,
        name: true,
        plan: true,
        quotas: true,
        usage: true,
        _count: {
          select: {
            users: true,
            clients: true,
            simulations: true,
            documents: true,
          },
        },
      },
    })

    // Calculer les totaux globaux
    let totalUsers = 0
    let maxUsers = 0
    let totalClients = 0
    let maxClients = 0
    let totalStorage = 0
    let maxStorage = 0
    let totalSimulations = 0
    let maxSimulations = 0

     
    const cabinetStats = cabinets.map((cabinet: any) => {
      const quotas = cabinet.quotas || {}
      const usage = cabinet.usage || {}
      
      const userCount = cabinet._count.users
      const clientCount = cabinet._count.clients
      const simulationCount = cabinet._count.simulations
      const storageUsed = usage.storageUsedGB || 0
      
      const maxUserQuota = quotas.maxUsers || 5
      const maxClientQuota = quotas.maxClients || 100
      const maxStorageQuota = quotas.maxStorageGB || 5
      const maxSimulationQuota = quotas.maxSimulationsPerMonth || 500

      // Accumuler les totaux
      totalUsers += userCount
      maxUsers += maxUserQuota
      totalClients += clientCount
      maxClients += maxClientQuota
      totalStorage += storageUsed
      maxStorage += maxStorageQuota
      totalSimulations += simulationCount
      maxSimulations += maxSimulationQuota

      // Déterminer les alertes
      const alerts: string[] = []
      if (maxUserQuota > 0 && userCount >= maxUserQuota) {
        alerts.push('Limite utilisateurs atteinte')
      } else if (maxUserQuota > 0 && userCount / maxUserQuota >= 0.9) {
        alerts.push('Utilisateurs proche limite')
      }
      if (maxClientQuota > 0 && clientCount / maxClientQuota >= 0.9) {
        alerts.push('Clients proche limite')
      }
      if (maxStorageQuota > 0 && storageUsed / maxStorageQuota >= 0.9) {
        alerts.push('Stockage proche limite')
      }
      if (maxSimulationQuota > 0 && simulationCount / maxSimulationQuota >= 0.9) {
        alerts.push('Simulations proche limite')
      }

      return {
        id: cabinet.id,
        name: cabinet.name,
        plan: cabinet.plan,
        users: { used: userCount, max: maxUserQuota },
        clients: { used: clientCount, max: maxClientQuota },
        storage: { used: storageUsed, max: maxStorageQuota },
        simulations: { used: simulationCount, max: maxSimulationQuota },
        alerts,
      }
    })

    // Trier par nombre d'alertes (les plus critiques en premier)
    cabinetStats.sort((a: { alerts: string[] }, b: { alerts: string[] }) => b.alerts.length - a.alerts.length)

    return NextResponse.json({
      stats: {
        global: {
          totalUsers,
          maxUsers,
          totalClients,
          maxClients,
          totalStorage,
          maxStorage,
          totalSimulations,
          maxSimulations,
        },
        cabinets: cabinetStats,
      },
    })
  } catch (error) {
    console.error('Erreur quotas:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
