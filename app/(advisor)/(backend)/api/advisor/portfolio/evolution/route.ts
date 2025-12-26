import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/_common/lib/prisma'
import { getAuthUser } from '@/app/_common/lib/auth-helpers'
import { isSuperAdmin, isRegularUser } from '@/app/_common/lib/auth-types'

/**
 * GET /api/advisor/portfolio/evolution
 * Retourne l'évolution du patrimoine sur la période
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user || isSuperAdmin(user) || !isRegularUser(user)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const cabinetId = user.cabinetId
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'ytd'

    // Déterminer le nombre de mois à afficher
    let months = 12
    switch (period) {
      case 'mtd':
        months = 1
        break
      case 'qtd':
        months = 3
        break
      case 'ytd':
        months = new Date().getMonth() + 1
        break
      case '1y':
        months = 12
        break
    }

    // Calculer le patrimoine actuel
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

    let currentActifs = 0
    clientActifs.forEach((ca) => {
      const percentage = Number(ca.ownershipPercentage) / 100
      currentActifs += Number(ca.actif.value || 0) * percentage
    })

    const passifs = await prisma.passif.findMany({
      where: {
        cabinetId,
        isActive: true,
      },
    })

    let currentPassifs = 0
    passifs.forEach((passif) => {
      currentPassifs += Number(passif.remainingAmount || passif.initialAmount || 0)
    })

    const currentPatrimoine = currentActifs - currentPassifs

    // Générer des données historiques simulées (à remplacer par vraies données si disponibles)
    // Pour l'instant, on simule une croissance linéaire avec un peu de variation
    const now = new Date()
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
    
    const evolution = []
    const growthRate = 0.08 // 8% annuel en moyenne
    const monthlyGrowth = growthRate / 12
    
    for (let i = months - 1; i >= 0; i--) {
      const monthIndex = (now.getMonth() - i + 12) % 12
      const factor = Math.pow(1 + monthlyGrowth, i)
      const variation = 1 + (Math.random() - 0.5) * 0.02 // ±1% de variation
      
      const patrimoine = Math.round(currentPatrimoine / factor * variation)
      const actifs = Math.round(currentActifs / factor * variation)
      const passifValue = Math.round(currentPassifs * (1 - i * 0.002)) // Passifs diminuent légèrement
      
      evolution.push({
        month: monthNames[monthIndex],
        patrimoine,
        actifs,
        passifs: passifValue,
      })
    }

    return NextResponse.json(evolution)
  } catch (error) {
    console.error('Erreur evolution portfolio:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
