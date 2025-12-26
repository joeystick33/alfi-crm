 
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'

// GET - Récupérer les informations de facturation
export async function GET(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId } = context

    // Vérifier que l'utilisateur est admin
    if (user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      )
    }

    // Récupérer les infos du cabinet
    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: {
        plan: true,
        email: true,
        subscriptionEnd: true,
      },
    })

    if (!cabinet) {
      return NextResponse.json({ error: 'Cabinet non trouvé' }, { status: 404 })
    }

    // Déterminer le montant selon le plan
    const planPrices: Record<string, number> = {
      STARTER: 49,
      BUSINESS: 99,
      PREMIUM: 199,
      ENTERPRISE: 499,
    }
    const amount = planPrices[cabinet.plan] || 49

    // Pour l'instant, retourner des données simulées
    // En production, cela serait connecté à Stripe ou un autre provider
    const billingInfo = {
      invoices: [
        {
          id: 'inv_001',
          number: 'AURA-2024-001',
          amount,
          status: 'paid',
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          pdfUrl: '#',
        },
        {
          id: 'inv_002',
          number: 'AURA-2024-002',
          amount,
          status: 'paid',
          date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          pdfUrl: '#',
        },
        {
          id: 'inv_003',
          number: 'AURA-2024-003',
          amount,
          status: 'paid',
          date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          dueDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          pdfUrl: '#',
        },
      ],
      paymentMethods: [
        {
          id: 'pm_001',
          type: 'card',
          last4: '4242',
          expiryMonth: 12,
          expiryYear: 2027,
          brand: 'visa',
          isDefault: true,
        },
      ],
      nextBillingDate: cabinet.subscriptionEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      billingEmail: cabinet.email || user.email,
      billingPeriod: 'monthly' as const,
    }

    return NextResponse.json(billingInfo)

  } catch (error: any) {
    console.error('Get billing info error:', error)

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    return NextResponse.json(
      { error: 'Erreur lors de la récupération des informations de facturation' },
      { status: 500 }
    )
  }
}
