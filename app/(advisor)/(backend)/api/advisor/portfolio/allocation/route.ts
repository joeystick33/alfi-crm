import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'
import { getAuthUser } from '@/app/_common/lib/auth-helpers'
import { isSuperAdmin, isRegularUser } from '@/app/_common/lib/auth-types'
import { logger } from '@/app/_common/lib/logger'
/**
 * GET /api/advisor/portfolio/allocation
 * Retourne la répartition des actifs par catégorie
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || isSuperAdmin(user) || !isRegularUser(user)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const cabinetId = user.cabinetId

    // Récupérer tous les actifs avec leur catégorie
    const clientActifs = await prisma.clientActif.findMany({
      where: {
        client: {
          cabinetId,
          status: 'ACTIF',
        },
      },
      include: {
        actif: true,
      },
    })

    // Grouper par catégorie
    const categoryTotals: Record<string, { value: number; count: number }> = {
      IMMOBILIER: { value: 0, count: 0 },
      FINANCIER: { value: 0, count: 0 },
      PROFESSIONNEL: { value: 0, count: 0 },
      AUTRE: { value: 0, count: 0 },
    }

    const categoryMap: Record<string, string> = {
      REAL_ESTATE: 'IMMOBILIER',
      MAIN_RESIDENCE: 'IMMOBILIER',
      SECONDARY_RESIDENCE: 'IMMOBILIER',
      RENTAL_PROPERTY: 'IMMOBILIER',
      LAND: 'IMMOBILIER',
      COMMERCIAL_PROPERTY: 'IMMOBILIER',
      SCPI: 'IMMOBILIER',
      FINANCIAL: 'FINANCIER',
      SAVINGS_ACCOUNT: 'FINANCIER',
      STOCK_PORTFOLIO: 'FINANCIER',
      LIFE_INSURANCE: 'FINANCIER',
      RETIREMENT_SAVINGS: 'FINANCIER',
      CRYPTOCURRENCY: 'FINANCIER',
      PROFESSIONAL: 'PROFESSIONNEL',
      BUSINESS_SHARES: 'PROFESSIONNEL',
      PROFESSIONAL_EQUIPMENT: 'PROFESSIONNEL',
      VEHICLE: 'AUTRE',
      JEWELRY: 'AUTRE',
      ART: 'AUTRE',
      OTHER: 'AUTRE',
    }

    clientActifs.forEach((ca) => {
      const percentage = Number(ca.ownershipPercentage) / 100
      const value = Number(ca.actif.value || 0) * percentage
      const category = categoryMap[ca.actif.category] || categoryMap[ca.actif.type] || 'AUTRE'
      
      if (categoryTotals[category]) {
        categoryTotals[category].value += value
        categoryTotals[category].count += 1
      }
    })

    // Calculer le total
    const total = Object.values(categoryTotals).reduce((sum, cat) => sum + cat.value, 0)

    // Construire la réponse
    const colors: Record<string, string> = {
      IMMOBILIER: '#3B82F6',
      FINANCIER: '#10B981',
      PROFESSIONNEL: '#8B5CF6',
      AUTRE: '#F59E0B',
    }

    const labels: Record<string, string> = {
      IMMOBILIER: 'Immobilier',
      FINANCIER: 'Financier',
      PROFESSIONNEL: 'Professionnel',
      AUTRE: 'Autres',
    }

    const allocation = Object.entries(categoryTotals)
      .filter(([_, data]) => data.value > 0)
      .map(([category, data]) => ({
        category: labels[category] || category,
        value: Math.round(data.value),
        percentage: total > 0 ? Math.round((data.value / total) * 1000) / 10 : 0,
        color: colors[category] || '#94A3B8',
        count: data.count,
      }))
      .sort((a, b) => b.value - a.value)

    return NextResponse.json(allocation)
  } catch (error) {
    logger.error('Erreur allocation portfolio:', { error: error instanceof Error ? error.message : String(error) })
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
