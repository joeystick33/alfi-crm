 
import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { getPrismaClient } from '@/app/_common/lib/prisma'

/**
 * GET /api/advisor/management/objectifs
 * Récupère les objectifs du cabinet et par conseiller
 * Accessible uniquement par les ADMIN
 */
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (user.role !== 'ADMIN') {
      return createErrorResponse('Permission denied: Réservé aux administrateurs', 403)
    }

    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)
    
    // Parse period
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    
    const now = new Date()
    let startDate: Date
    let periodLabel: string
    
    switch (period) {
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        periodLabel = `T${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        periodLabel = `${now.getFullYear()}`
        break
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        periodLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    }

    // Get objectifs from database (if table exists) or use defaults
    let objectifs: any[] = []
    
    try {
      // Try to get objectifs from database
      objectifs = await prisma.objectif.findMany({
        where: {
          cabinetId: context.cabinetId,
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      })
    } catch (e) {
      // Objectif table might not exist, use calculated defaults
      console.log('Objectif table not found, using calculated defaults')
    }

    // Get current values for CA and clients
    const conseillers = await prisma.user.findMany({
      where: {
        cabinetId: context.cabinetId,
        role: { in: ['ADVISOR', 'ASSISTANT'] },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      }
    })

    // Calculate current values per conseiller
    const conseillersWithProgress = await Promise.all(
      conseillers.map(async (conseiller) => {
        // CA from won opportunities
        const wonOpportunities = await prisma.opportunite.findMany({
          where: {
            conseillerId: conseiller.id,
            status: 'CONVERTIE',
            createdAt: { gte: startDate },
          },
          select: { estimatedValue: true }
        })
        const currentCA = wonOpportunities.reduce((sum: number, o: any) => 
          sum + (Number(o.estimatedValue) || 0), 0)

        // New clients
        const newClients = await prisma.client.count({
          where: {
            conseillerId: conseiller.id,
            createdAt: { gte: startDate },
          }
        })

        // Won opportunities count
        const wonCount = await prisma.opportunite.count({
          where: {
            conseillerId: conseiller.id,
            status: 'CONVERTIE',
            createdAt: { gte: startDate },
          }
        })

        return {
          conseillerId: conseiller.id,
          conseillerName: `${conseiller.firstName} ${conseiller.lastName}`,
          currentCA,
          newClients,
          wonOpportunities: wonCount,
        }
      })
    )

    // Calculate global values
    const globalCA = conseillersWithProgress.reduce((sum, c) => sum + c.currentCA, 0)
    const globalNewClients = conseillersWithProgress.reduce((sum, c) => sum + c.newClients, 0)
    const globalWonOpportunities = conseillersWithProgress.reduce((sum, c) => sum + c.wonOpportunities, 0)

    // Build objectifs response
    // Default targets (can be customized per cabinet)
    const defaultTargets = {
      cabinetCA: 100000,
      cabinetClients: 20,
      cabinetOpportunities: 15,
      conseillerCA: 30000,
      conseillerClients: 6,
    }

    const getStatus = (current: number, target: number): string => {
      const ratio = current / target
      if (ratio >= 1) return 'ATTEINT'
      if (ratio >= 0.8) return 'ON_TRACK'
      if (ratio >= 0.5) return 'AT_RISK'
      return 'BEHIND'
    }

    const cabinetObjectifs = [
      {
        id: 'cabinet-ca',
        type: 'CA',
        label: 'CA Cabinet',
        target: defaultTargets.cabinetCA,
        current: globalCA,
        unit: '€',
        period: periodLabel,
        status: getStatus(globalCA, defaultTargets.cabinetCA),
      },
      {
        id: 'cabinet-clients',
        type: 'CLIENTS',
        label: 'Nouveaux Clients',
        target: defaultTargets.cabinetClients,
        current: globalNewClients,
        unit: 'clients',
        period: periodLabel,
        status: getStatus(globalNewClients, defaultTargets.cabinetClients),
      },
      {
        id: 'cabinet-opportunities',
        type: 'OPPORTUNITIES',
        label: 'Opportunités Gagnées',
        target: defaultTargets.cabinetOpportunities,
        current: globalWonOpportunities,
        unit: 'opport.',
        period: periodLabel,
        status: getStatus(globalWonOpportunities, defaultTargets.cabinetOpportunities),
      },
    ]

    const conseillerObjectifs = conseillersWithProgress.flatMap((c) => [
      {
        id: `${c.conseillerId}-ca`,
        type: 'CA',
        label: 'CA Mensuel',
        target: defaultTargets.conseillerCA,
        current: c.currentCA,
        unit: '€',
        period: periodLabel,
        conseillerId: c.conseillerId,
        conseillerName: c.conseillerName,
        status: getStatus(c.currentCA, defaultTargets.conseillerCA),
      },
      {
        id: `${c.conseillerId}-clients`,
        type: 'CLIENTS',
        label: 'Nouveaux Clients',
        target: defaultTargets.conseillerClients,
        current: c.newClients,
        unit: 'clients',
        period: periodLabel,
        conseillerId: c.conseillerId,
        conseillerName: c.conseillerName,
        status: getStatus(c.newClients, defaultTargets.conseillerClients),
      },
    ])

    return createSuccessResponse({
      period,
      periodLabel,
      objectifs: [...cabinetObjectifs, ...conseillerObjectifs],
    })
  } catch (error) {
    console.error('Error in GET /api/advisor/management/objectifs:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * POST /api/advisor/management/objectifs
 * Créer un nouvel objectif
 */
export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user } = context
    
    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    if (user.role !== 'ADMIN') {
      return createErrorResponse('Permission denied: Réservé aux administrateurs', 403)
    }

    const body = await request.json()
    const { type, label, target, period, conseillerId } = body

    if (!type || !label || !target || !period) {
      return createErrorResponse('Champs requis: type, label, target, period', 400)
    }

    // For now, return success with the created objectif
    // In a real implementation, this would save to database
    return createSuccessResponse({
      id: `obj-${Date.now()}`,
      type,
      label,
      target,
      current: 0,
      period,
      conseillerId,
      status: 'BEHIND',
      createdAt: new Date().toISOString(),
    }, 201)
  } catch (error) {
    console.error('Error in POST /api/advisor/management/objectifs:', error)
    
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    
    return createErrorResponse('Internal server error', 500)
  }
}
