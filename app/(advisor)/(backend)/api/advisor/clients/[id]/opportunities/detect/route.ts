 
/**
 * API Route: /api/advisor/clients/[id]/opportunities/detect
 * POST - Détecte les opportunités pour un client
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { prisma } from '@/app/_common/lib/prisma'
import { detectOpportunities, calculateOpportunityScore, type ClientProfile } from '@/app/_common/lib/services/opportunities-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId } = context

    const { id: clientId } = await params

    // Récupérer le client avec ses données patrimoniales
    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId },
      include: {
        actifs: true,
        passifs: true,
        contrats: true,
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    // Calculer l'âge
    const age = client.birthDate
      ? Math.floor((Date.now() - new Date(client.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 45

    // Calculer les actifs
    const financialAssets = (client.actifs as any[])
      .filter(a => ['ASSURANCE_VIE', 'PEA', 'COMPTE_TITRES', 'LIVRET', 'PER'].includes(a.type))
      .reduce((s, a) => s + Number(a.value || 0), 0)

    const realEstateAssets = (client.actifs as any[])
      .filter(a => ['RESIDENCE_PRINCIPALE', 'IMMOBILIER_LOCATIF', 'SCPI'].includes(a.type))
      .reduce((s, a) => s + Number(a.value || 0), 0)

    const liabilities = (client.passifs as any[])
      .reduce((s, p) => s + Number(p.currentBalance || 0), 0)

    const netWealth = financialAssets + realEstateAssets - liabilities

    // Vérifier si a assurance-vie ou PER
    const hasLifeInsurance = (client.contrats as any[]).some(c => c.type === 'ASSURANCE_VIE')
    const hasPER = (client.contrats as any[]).some(c => c.type === 'PER')

    // Estimer TMI (simplifié)
    const annualIncome = Number(client.annualIncome) || 50000
    let taxRate = 0
    if (annualIncome > 177106) taxRate = 45
    else if (annualIncome > 82341) taxRate = 41
    else if (annualIncome > 29174) taxRate = 30
    else if (annualIncome > 11294) taxRate = 11

    // Construire le profil
    const profile: ClientProfile = {
      age,
      netWealth,
      financialAssets,
      realEstateAssets,
      liabilities,
      annualIncome,
      numberOfChildren: client.numberOfChildren || 0,
      hasLifeInsurance,
      hasPER,
      taxRate,
      riskProfile: client.riskProfile || 'EQUILIBRE',
    }

    // Détecter les opportunités
    const opportunities = detectOpportunities(profile)
    const averageScore = calculateOpportunityScore(opportunities)

    // TODO: Sauvegarder les opportunités détectées
    // Note: Le schéma Prisma Opportunite nécessite une mise à jour pour correspondre à l'interface Opportunity
    // Les opportunités sont retournées sans persistance pour l'instant

    return NextResponse.json({
      success: true,
      data: {
        opportunities,
        profile: {
          age,
          netWealth,
          financialAssets,
          realEstateAssets,
          liabilities,
          taxRate,
        },
        summary: {
          total: opportunities.length,
          high: opportunities.filter(o => o.priority === 'HAUTE').length,
          medium: opportunities.filter(o => o.priority === 'MOYENNE').length,
          low: opportunities.filter(o => o.priority === 'BASSE').length,
          averageScore,
        },
      },
    })

  } catch (error) {
    console.error('Erreur détection opportunités:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
