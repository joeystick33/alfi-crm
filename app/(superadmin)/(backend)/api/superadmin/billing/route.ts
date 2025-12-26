import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createErrorResponse } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

/**
 * API SuperAdmin - Facturation SaaS
 * GET /api/superadmin/billing - Récupérer les statistiques de facturation
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

    // Récupérer les cabinets avec leur plan
    const cabinets = await prisma.cabinet.findMany({
      where: { status: { not: 'TERMINATED' } },
      select: {
        id: true,
        name: true,
        plan: true,
        status: true,
        subscriptionStart: true,
        subscriptionEnd: true,
      },
    })

    // Récupérer les factures SaaS
    const invoices = await prisma.saaSInvoice.findMany({
      include: {
        cabinet: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // STARTER: CRM | BUSINESS: CRM + Calculateurs | PREMIUM: Tout
    const planPrices: Record<string, number> = {
      TRIAL: 0,
      STARTER: 59,
      BUSINESS: 99,
      PREMIUM: 199,
    }

    // MRR (Monthly Recurring Revenue)
     
    const mrr = cabinets.reduce((sum: number, cab: any) => {
      if (cab.status === 'ACTIVE' || cab.status === 'TRIALING') {
        return sum + (planPrices[cab.plan] || 0)
      }
      return sum
    }, 0)

    // ARR (Annual Recurring Revenue)
    const arr = mrr * 12

    // Distribution par plan
     
    const planDistribution = cabinets.reduce((acc: Record<string, number>, cab: any) => {
      acc[cab.plan] = (acc[cab.plan] || 0) + 1
      return acc
    }, {})

    // Factures par statut
     
    const invoiceStats = invoices.reduce((acc: Record<string, number>, inv: any) => {
      acc[inv.status] = (acc[inv.status] || 0) + 1
      return acc
    }, {})

    // Revenus des 12 derniers mois (simulé basé sur MRR actuel)
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      // Simuler une croissance progressive
      const growthFactor = 0.85 + (i * 0.015) // De 85% à 100%
      return {
        month: date.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }),
        revenue: Math.round(mrr * growthFactor),
      }
    })

    // Factures impayées
    const overdueInvoices = invoices.filter(
       
      (inv: any) => inv.status === 'EN_RETARD' || (inv.status === 'EN_ATTENTE' && new Date(inv.dueDate) < new Date())
    )

    // Formater les factures
     
    const formattedInvoices = invoices.map((inv: any) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      cabinetId: inv.cabinetId,
      cabinetName: inv.cabinet?.name || 'N/A',
      periodStart: inv.periodStart,
      periodEnd: inv.periodEnd,
      amountHT: parseFloat(inv.amountHT.toString()),
      amountTTC: parseFloat(inv.amountTTC.toString()),
      status: inv.status,
      dueDate: inv.dueDate,
      paidAt: inv.paidAt,
      planName: inv.planName,
    }))

    return NextResponse.json({
      stats: {
        mrr,
        arr,
        totalCabinets: cabinets.length,
        activeCabinets: cabinets.filter((c: { status: string }) => c.status === 'ACTIVE').length,
        trialCabinets: cabinets.filter((c: { status: string }) => c.status === 'TRIALING').length,
        planDistribution,
        invoiceStats,
        overdueCount: overdueInvoices.length,
         
        overdueAmount: overdueInvoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.amountTTC.toString()), 0),
      },
      monthlyRevenue,
      invoices: formattedInvoices,
    })
  } catch (error) {
    console.error('Erreur billing:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
