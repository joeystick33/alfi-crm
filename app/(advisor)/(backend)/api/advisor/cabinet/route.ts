 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
// Prix des plans (en euros/mois)
// STARTER: CRM uniquement | BUSINESS: CRM + Calculateurs | PREMIUM: CRM + Calculateurs + Simulateurs
const PLAN_PRICES: Record<string, { monthly: number; yearly: number; name: string }> = {
  TRIAL: { monthly: 0, yearly: 0, name: 'Essai gratuit' },
  STARTER: { monthly: 59, yearly: 590, name: 'Starter' },
  BUSINESS: { monthly: 99, yearly: 990, name: 'Business' },
  PREMIUM: { monthly: 199, yearly: 1990, name: 'Premium' },
}

// Quotas par défaut par plan (maxAdmins = nombre max d'administrateurs par cabinet)
const DEFAULT_QUOTAS: Record<string, any> = {
  TRIAL: { maxUsers: 2, maxAdmins: 1, maxClients: 50, maxStorageGB: 1, maxDocuments: 100 },
  STARTER: { maxUsers: 3, maxAdmins: 2, maxClients: 150, maxStorageGB: 5, maxDocuments: 500 },
  BUSINESS: { maxUsers: 10, maxAdmins: 2, maxClients: 500, maxStorageGB: 20, maxDocuments: 2000 },
  PREMIUM: { maxUsers: -1, maxAdmins: 5, maxClients: -1, maxStorageGB: 100, maxDocuments: -1 },
}

export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { cabinetId } = context

    if (!cabinetId) {
      return NextResponse.json(
        { error: 'Aucun cabinet associé' },
        { status: 400 }
      )
    }

    // Récupérer le cabinet avec les utilisateurs
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
            createdAt: true,
            lastLogin: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            users: true,
            clients: true,
            documents: true,
          }
        }
      }
    })

    if (!cabinet) {
      return NextResponse.json(
        { error: 'Cabinet introuvable' },
        { status: 404 }
      )
    }

    // Calculer l'usage du stockage (approximatif basé sur les documents)
    const documents = await prisma.document.findMany({
      where: { cabinetId },
      select: { fileSize: true }
    })
    const storageUsedBytes = documents.reduce((acc, doc) => acc + (doc.fileSize || 0), 0)
    const storageUsedGB = storageUsedBytes / (1024 * 1024 * 1024)

    // Quotas du cabinet ou par défaut
    const quotas = cabinet.quotas || DEFAULT_QUOTAS[cabinet.plan] || DEFAULT_QUOTAS.TRIAL
    const planInfo = PLAN_PRICES[cabinet.plan] || PLAN_PRICES.TRIAL

    // Calculer les jours restants d'essai
    let trialDaysRemaining = null
    if (cabinet.status === 'TRIALING' && cabinet.trialEndsAt) {
      const now = new Date()
      const trialEnd = new Date(cabinet.trialEndsAt)
      trialDaysRemaining = Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    }

    // Identifier l'admin primaire (le plus ancien admin)
    const admins = cabinet.users.filter(u => u.role === 'ADMIN')
    const primaryAdminId = admins.length > 0 
      ? admins.reduce((oldest, current) => 
          new Date(current.createdAt) < new Date(oldest.createdAt) ? current : oldest
        ).id
      : null

    // Enrichir les users avec isPrimaryAdmin
    const enrichedUsers = cabinet.users.map(u => ({
      ...u,
      isPrimaryAdmin: u.id === primaryAdminId,
    }))

    return NextResponse.json({
      id: cabinet.id,
      name: cabinet.name,
      email: cabinet.email,
      phone: cabinet.phone,
      address: cabinet.address,
      plan: cabinet.plan,
      planName: planInfo.name,
      planPrice: planInfo,
      status: cabinet.status,
      subscriptionStart: cabinet.subscriptionStart,
      subscriptionEnd: cabinet.subscriptionEnd,
      trialEndsAt: cabinet.trialEndsAt,
      trialDaysRemaining,
      quotas,
      usage: {
        users: cabinet._count.users,
        clients: cabinet._count.clients,
        documents: cabinet._count.documents,
        storageGB: Math.round(storageUsedGB * 100) / 100,
      },
      users: enrichedUsers,
      primaryAdminId,
      features: cabinet.features,
      createdAt: cabinet.createdAt,
    })
  } catch (error: any) {
    logger.error('Get cabinet error:', { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération du cabinet' },
      { status: 500 }
    )
  }
}

// Mettre à jour les informations du cabinet
export async function PATCH(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId } = context

    // Seuls les admins peuvent modifier le cabinet
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les administrateurs peuvent modifier le cabinet' },
        { status: 403 }
      )
    }

    if (!cabinetId) {
      return NextResponse.json(
        { error: 'Aucun cabinet associé' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, email, phone, address } = body

    const updatedCabinet = await prisma.cabinet.update({
      where: { id: cabinetId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
      }
    })

    return NextResponse.json({
      success: true,
      cabinet: updatedCabinet
    })
  } catch (error: any) {
    logger.error('Update cabinet error:', { error: error instanceof Error ? error.message : String(error) })

    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du cabinet' },
      { status: 500 }
    )
  }
}
