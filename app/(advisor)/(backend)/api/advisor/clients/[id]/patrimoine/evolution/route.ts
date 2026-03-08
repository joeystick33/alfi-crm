/**
 * API Route: /api/advisor/clients/[id]/patrimoine/evolution
 * Récupère l'évolution du patrimoine d'un client sur une période donnée
 */

import { NextRequest } from 'next/server'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { isRegularUser } from '@/app/_common/lib/auth-types'
import { prisma } from '@/app/_common/lib/prisma'
import { logger } from '@/app/_common/lib/logger'
interface EvolutionPoint {
  date: string
  totalActifs: number
  totalPassifs: number
  patrimoineNet: number
  variation: number // % par rapport au point précédent
}

/**
 * Calcule l'évolution du patrimoine à partir des actifs et passifs historiques
 */
async function calculatePatrimoineEvolution(
  clientId: string,
  months: number = 12
): Promise<{ evolution: number; history: EvolutionPoint[] }> {
  const now = new Date()
  const startDate = new Date(now.getTime() - months * 30 * 24 * 60 * 60 * 1000)

  // Récupérer les actifs avec leurs dates d'acquisition (via la table de liaison ClientActif)
  const clientActifs = await prisma.clientActif.findMany({
    where: { clientId },
    include: {
      actif: {
        select: {
          id: true,
          value: true,
          acquisitionDate: true,
          acquisitionValue: true,
          createdAt: true,
          type: true,
        },
      },
    },
  })
  const actifs = clientActifs.map(ca => ca.actif)

  // Récupérer les passifs avec leurs dates de début
  const passifs = await prisma.passif.findMany({
    where: { clientId },
    select: {
      id: true,
      initialAmount: true,
      remainingAmount: true,
      monthlyPayment: true,
      startDate: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  // Générer les points d'évolution mensuels
  const history: EvolutionPoint[] = []
  let previousNet = 0

  for (let i = months; i >= 0; i--) {
    const pointDate = new Date(now.getTime() - i * 30 * 24 * 60 * 60 * 1000)
    
    // Calculer les actifs à cette date (valeur d'acquisition si acquis après, valeur actuelle sinon)
    let totalActifs = 0
    actifs.forEach((actif) => {
      const acqDate = actif.acquisitionDate || actif.createdAt
      if (acqDate <= pointDate) {
        // Si l'actif existait à cette date
        if (i === 0) {
          // Valeur actuelle pour aujourd'hui
          totalActifs += Number(actif.value) || 0
        } else {
          // Estimer la valeur historique (interpolation linéaire simple)
          const acqValue = Number(actif.acquisitionValue) || Number(actif.value) || 0
          const currentValue = Number(actif.value) || 0
          const daysSinceAcq = (now.getTime() - acqDate.getTime()) / (24 * 60 * 60 * 1000)
          const daysToPoint = (now.getTime() - pointDate.getTime()) / (24 * 60 * 60 * 1000)
          
          if (daysSinceAcq > 0) {
            const growthRate = (currentValue - acqValue) / daysSinceAcq
            const estimatedValue = currentValue - (growthRate * daysToPoint)
            totalActifs += Math.max(estimatedValue, acqValue)
          } else {
            totalActifs += currentValue
          }
        }
      }
    })

    // Calculer les passifs à cette date
    let totalPassifs = 0
    passifs.forEach((passif) => {
      const startDate = passif.startDate || passif.createdAt
      if (startDate <= pointDate) {
        // Si le passif existait à cette date
        const initialAmount = Number(passif.initialAmount) || 0
        const remainingAmount = Number(passif.remainingAmount) || 0
        const monthlyPayment = Number(passif.monthlyPayment) || 0
        
        if (i === 0) {
          // Valeur actuelle pour aujourd'hui
          totalPassifs += remainingAmount
        } else {
          // Estimer le capital restant dû à cette date
          const monthsFromStart = Math.floor((pointDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
          const totalMonths = initialAmount / (monthlyPayment || 1)
          const estimatedRemaining = initialAmount - (monthsFromStart * monthlyPayment * 0.7) // ~70% va au capital
          totalPassifs += Math.max(Math.min(estimatedRemaining, initialAmount), remainingAmount)
        }
      }
    })

    const patrimoineNet = totalActifs - totalPassifs
    const variation = previousNet > 0 
      ? ((patrimoineNet - previousNet) / previousNet) * 100 
      : 0

    history.push({
      date: pointDate.toISOString().split('T')[0],
      totalActifs: Math.round(totalActifs),
      totalPassifs: Math.round(totalPassifs),
      patrimoineNet: Math.round(patrimoineNet),
      variation: Math.round(variation * 100) / 100,
    })

    previousNet = patrimoineNet
  }

  // Calculer l'évolution globale sur la période
  const firstPoint = history[0]
  const lastPoint = history[history.length - 1]
  const evolution = firstPoint.patrimoineNet > 0
    ? ((lastPoint.patrimoineNet - firstPoint.patrimoineNet) / firstPoint.patrimoineNet) * 100
    : 0

  return {
    evolution: Math.round(evolution * 100) / 100,
    history,
  }
}

/**
 * GET /api/advisor/clients/[id]/patrimoine/evolution
 * Returns patrimoine evolution over time
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAuth(request)
    const { user, cabinetId } = context

    if (!isRegularUser(user)) {
      return createErrorResponse('Invalid user type', 400)
    }

    const { id: clientId } = await params
    const { searchParams } = new URL(request.url)
    const months = parseInt(searchParams.get('months') || '12', 10)

    // Vérifier que le client existe et appartient au cabinet
    const client = await prisma.client.findFirst({
      where: { id: clientId, cabinetId },
      select: { id: true },
    })

    if (!client) {
      return createErrorResponse('Client not found', 404)
    }

    const evolutionData = await calculatePatrimoineEvolution(clientId, Math.min(months, 60))

    return createSuccessResponse({
      clientId,
      period: `${months} mois`,
      ...evolutionData,
      // Ajouter des métriques supplémentaires
      metrics: {
        evolutionAnnuelle: evolutionData.evolution,
        tendance: evolutionData.evolution > 0 ? 'hausse' : evolutionData.evolution < 0 ? 'baisse' : 'stable',
        volatilite: calculateVolatility(evolutionData.history),
      },
    })
  } catch (error) {
    logger.error('Get patrimoine evolution error:', { error: error instanceof Error ? error.message : String(error) })

    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }

    return createErrorResponse('Internal server error', 500)
  }
}

/**
 * Calcule la volatilité (écart-type des variations)
 */
function calculateVolatility(history: EvolutionPoint[]): number {
  if (history.length < 2) return 0
  
  const variations = history.slice(1).map((p) => p.variation)
  const mean = variations.reduce((sum, v) => sum + v, 0) / variations.length
  const squaredDiffs = variations.map((v) => Math.pow(v - mean, 2))
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / variations.length
  
  return Math.round(Math.sqrt(variance) * 100) / 100
}
