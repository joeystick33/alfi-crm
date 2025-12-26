import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import { 
  getDefaultFeaturesForPlan, 
  getDefaultLimitsForPlan,
  type SubscriptionPlan 
} from '@/app/_common/lib/features/plan-presets'

/**
 * API SuperAdmin - Détail Cabinet
 * GET /api/superadmin/cabinets/[id] - Détail complet d'un cabinet
 * PUT /api/superadmin/cabinets/[id] - Modifier un cabinet
 * DELETE /api/superadmin/cabinets/[id] - Supprimer un cabinet
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: cabinetId } = await params
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    // Récupérer le cabinet avec les relations
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            clients: true,
            users: true,
            simulations: true,
            documents: true,
          },
        },
      },
    })

    if (!cabinet) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 404 }
      )
    }

    // Récupérer les derniers logs d'activité
    const recentActivity = await prisma.auditLog.findMany({
      where: { cabinetId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Simuler l'historique de facturation (à remplacer par vraies données)
    const billingHistory = [
      { id: '1', date: new Date().toISOString(), amount: getPlanPrice(cabinet.plan), status: 'PAYEE' },
      { id: '2', date: new Date(Date.now() - 30 * 86400000).toISOString(), amount: getPlanPrice(cabinet.plan), status: 'PAYEE' },
      { id: '3', date: new Date(Date.now() - 60 * 86400000).toISOString(), amount: getPlanPrice(cabinet.plan), status: 'PAYEE' },
    ]

    // Formater la réponse
     
    const quotas = cabinet.quotas as any || {}
     
    const usage = cabinet.usage as any || {}
     
    const features = cabinet.features as any || {}

    const formattedCabinet = {
      id: cabinet.id,
      name: cabinet.name,
      slug: cabinet.slug,
      email: cabinet.email,
      phone: cabinet.phone,
      address: cabinet.address,
      plan: cabinet.plan,
      status: cabinet.status,
      subscriptionStart: cabinet.subscriptionStart,
      subscriptionEnd: cabinet.subscriptionEnd,
      trialEndsAt: cabinet.trialEndsAt,
      quotas: {
        maxUsers: quotas.maxUsers || 5,
        maxClients: quotas.maxClients || 100,
        maxStorage: quotas.maxStorageGB || 5,
        maxSimulations: quotas.maxSimulationsPerMonth || 500,
      },
      usage: {
        users: cabinet._count.users,
        clients: cabinet._count.clients,
        storage: usage.storageUsedGB || 0,
        simulations: usage.simulationsThisMonth || 0,
      },
      features,
      createdAt: cabinet.createdAt,
      updatedAt: cabinet.updatedAt,
      users: cabinet.users,
       
      recentActivity: recentActivity.map((log: any) => ({
        id: log.id,
        action: log.action,
        description: `${log.user?.firstName || 'Système'} ${log.user?.lastName || ''} - ${log.action} ${log.entityType}`,
        timestamp: log.createdAt,
      })),
      billingHistory,
    }

    return NextResponse.json({ cabinet: formattedCabinet })
  } catch (error) {
    console.error('Erreur détail cabinet:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: cabinetId } = await params
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    const body = await request.json()

    // Récupérer le cabinet actuel
    const currentCabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
    })

    if (!currentCabinet) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 404 }
      )
    }

    // Construire les données de mise à jour de manière sécurisée
     
    const updateData: Record<string, any> = {}
    
    // Champs autorisés à mettre à jour
    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.address !== undefined) updateData.address = body.address
    if (body.plan !== undefined) {
      updateData.plan = body.plan
      
      // IMPORTANT: Synchroniser automatiquement les features lors d'un changement de plan
      const validPlans = ['TRIAL', 'STARTER', 'BUSINESS', 'PREMIUM']
      if (validPlans.includes(body.plan) && body.plan !== currentCabinet.plan) {
        const planFeatures = getDefaultFeaturesForPlan(body.plan as SubscriptionPlan)
        const planLimits = getDefaultLimitsForPlan(body.plan as SubscriptionPlan)
        
        updateData.features = {
          ...planFeatures,
          customLimits: {
            maxSimulationsPerMonth: planLimits.maxSimulationsPerMonth,
            maxExportsPerMonth: planLimits.maxExportsPerMonth,
            maxClientsPortal: planLimits.maxClientsPortal,
          },
        }
        
        // Mettre à jour aussi les quotas
        updateData.quotas = {
          maxUsers: planLimits.maxUsers,
          maxClients: planLimits.maxClients,
          maxStorage: planLimits.maxStorage,
          maxSimulationsPerMonth: planLimits.maxSimulationsPerMonth,
        }
      }
    }
    if (body.status !== undefined) updateData.status = body.status
    if (body.subscriptionStart !== undefined) updateData.subscriptionStart = body.subscriptionStart ? new Date(body.subscriptionStart) : null
    if (body.subscriptionEnd !== undefined) updateData.subscriptionEnd = body.subscriptionEnd ? new Date(body.subscriptionEnd) : null
    if (body.trialEndsAt !== undefined) updateData.trialEndsAt = body.trialEndsAt ? new Date(body.trialEndsAt) : null
    
    // Champs JSON - s'assurer qu'ils sont bien des objets
    if (body.quotas !== undefined) {
      updateData.quotas = typeof body.quotas === 'object' ? body.quotas : currentCabinet.quotas
    }
    if (body.features !== undefined) {
      updateData.features = typeof body.features === 'object' ? body.features : currentCabinet.features
    }
    if (body.usage !== undefined) {
      updateData.usage = typeof body.usage === 'object' ? body.usage : currentCabinet.usage
    }
    if (body.restrictions !== undefined) {
      updateData.restrictions = typeof body.restrictions === 'object' ? body.restrictions : currentCabinet.restrictions
    }

    // Mettre à jour
    const updatedCabinet = await prisma.cabinet.update({
      where: { id: cabinetId },
      data: updateData,
    })

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        cabinetId,
        action: 'MODIFICATION',
        entityType: 'Cabinet',
        entityId: cabinetId,
        changes: {
          before: currentCabinet,
          after: updatedCabinet,
        },
      },
    })

    return NextResponse.json({ success: true, cabinet: updatedCabinet })
  } catch (error) {
    console.error('Erreur modification cabinet:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { id: cabinetId } = await params
    
    if (!context.isSuperAdmin) {
      return createErrorResponse('Non autorisé', 403)
    }

    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: context.user.email! },
    })

    if (!superAdmin || !superAdmin.isActive) {
      return createErrorResponse('Accès refusé', 403)
    }

    // Vérifier permissions
     
    const permissions = superAdmin.permissions as any
    if (superAdmin.role !== 'OWNER' && !permissions?.canDeleteData) {
      return createErrorResponse('Permission insuffisante', 403)
    }

    // Récupérer le cabinet
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
    })

    if (!cabinet) {
      return NextResponse.json(
        { error: 'Cabinet non trouvé' },
        { status: 404 }
      )
    }

    // Supprimer le cabinet (cascade défini dans schema)
    await prisma.cabinet.delete({
      where: { id: cabinetId },
    })

    // Log d'audit
    await prisma.auditLog.create({
      data: {
        superAdminId: superAdmin.id,
        action: 'SUPPRESSION',
        entityType: 'Cabinet',
        entityId: cabinetId,
        changes: {
          deleted: {
            name: cabinet.name,
            email: cabinet.email,
            plan: cabinet.plan,
          },
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erreur suppression cabinet:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}

function getPlanPrice(plan: string): number {
  // STARTER: CRM | BUSINESS: CRM + Calculateurs | PREMIUM: Tout
  const prices: Record<string, number> = {
    TRIAL: 0,
    STARTER: 59,
    BUSINESS: 99,
    PREMIUM: 199,
  }
  return prices[plan] || 0
}
