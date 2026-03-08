/**
 * Simulateur Assurance-Vie - Impact des Frais
 * Calcule l'évolution du capital avec et sans frais
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
const fraisInputSchema = z.object({
  duree: z.number().min(1).max(99).default(15),
  versement_initial: z.number().min(0).default(10000),
  versement_mensuel: z.number().min(0).default(300),
  pct_uc: z.number().min(0).max(100).default(30),
  pct_gsm: z.number().min(0).max(100).default(0),
  rendement_euros: z.number().default(2.2),
  rendement_uc: z.number().default(5),
  rendement_gsm: z.number().default(7),
  frais_gestion_assureur: z.number().min(0).default(0.6),
  frais_gestion_uc: z.number().min(0).default(0.8),
  frais_gestion_gsm: z.number().min(0).default(1.9),
  frais_sur_versement: z.number().min(0).default(2),
  frais_arbitrage: z.number().min(0).default(0.5),
  nb_arbitrages_par_an: z.number().min(0).default(1),
})

export async function POST(request: NextRequest) {
  try {
    const context = await requireAuth(request)
    if (!context.user) {
      return createErrorResponse('Accès non autorisé', 403)
    }

    const body = await request.json()
    const input = fraisInputSchema.parse(body)

    // Calcul de la répartition
    const pctEuros = Math.max(0, 100 - input.pct_uc - input.pct_gsm)
    
    // Rendement moyen pondéré
    const rendementMoyenBrut = 
      (pctEuros / 100) * input.rendement_euros +
      (input.pct_uc / 100) * input.rendement_uc +
      (input.pct_gsm / 100) * input.rendement_gsm

    // Frais de gestion moyens pondérés
    const fraisGestionMoyens = 
      (pctEuros / 100) * input.frais_gestion_assureur +
      (input.pct_uc / 100) * (input.frais_gestion_assureur + input.frais_gestion_uc) +
      (input.pct_gsm / 100) * (input.frais_gestion_assureur + input.frais_gestion_gsm)

    // Frais d'arbitrage annuels
    const fraisArbitrageAnnuel = input.frais_arbitrage * input.nb_arbitrages_par_an

    // Taux mensuel
    const tauxMensuelBrut = Math.pow(1 + rendementMoyenBrut / 100, 1/12) - 1
    const tauxMensuelNet = Math.pow(1 + (rendementMoyenBrut - fraisGestionMoyens - fraisArbitrageAnnuel) / 100, 1/12) - 1

    const moisTotal = input.duree * 12
    let capitalSansFrais = input.versement_initial
    let capitalAvecFrais = input.versement_initial * (1 - input.frais_sur_versement / 100)
    let totalVersements = input.versement_initial
    
    // Détail des frais
    let fraisSurVersementTotal = input.versement_initial * input.frais_sur_versement / 100
    let fraisGestionTotal = 0
    let fraisArbitrageTotal = 0

    const chartData: { mois: number; 'Sans Frais': number; 'Avec Frais': number }[] = []

    for (let mois = 1; mois <= moisTotal; mois++) {
      // Versement mensuel
      capitalSansFrais += input.versement_mensuel
      const versementNet = input.versement_mensuel * (1 - input.frais_sur_versement / 100)
      capitalAvecFrais += versementNet
      totalVersements += input.versement_mensuel
      fraisSurVersementTotal += input.versement_mensuel * input.frais_sur_versement / 100

      // Rendement mensuel
      capitalSansFrais *= (1 + tauxMensuelBrut)
      capitalAvecFrais *= (1 + tauxMensuelNet)

      // Frais de gestion mensuels
      const fraisGestionMois = capitalAvecFrais * (fraisGestionMoyens / 100 / 12)
      fraisGestionTotal += fraisGestionMois

      // Frais d'arbitrage (une fois par an)
      if (mois % 12 === 0) {
        const fraisArbitrageMois = capitalAvecFrais * (fraisArbitrageAnnuel / 100)
        fraisArbitrageTotal += fraisArbitrageMois
      }

      // Point de donnée pour le graphique (tous les 6 mois)
      if (mois % 6 === 0 || mois === moisTotal) {
        chartData.push({
          mois,
          'Sans Frais': Math.round(capitalSansFrais * 100) / 100,
          'Avec Frais': Math.round(capitalAvecFrais * 100) / 100,
        })
      }
    }

    const difference = capitalSansFrais - capitalAvecFrais
    const totalFrais = fraisSurVersementTotal + fraisGestionTotal + fraisArbitrageTotal
    const impactSurRendement = totalVersements > 0 
      ? ((capitalSansFrais - capitalAvecFrais) / capitalSansFrais) * 100 
      : 0

    // Données pour le graphique donut des frais
    const fraisData = [
      { name: 'Frais sur versements', value: Math.round(fraisSurVersementTotal * 100) / 100 },
      { name: 'Frais de gestion', value: Math.round(fraisGestionTotal * 100) / 100 },
      { name: 'Frais d\'arbitrage', value: Math.round(fraisArbitrageTotal * 100) / 100 },
    ].filter(f => f.value > 0)

    return createSuccessResponse({
      capital_sans_frais: Math.round(capitalSansFrais * 100) / 100,
      capital_avec_frais: Math.round(capitalAvecFrais * 100) / 100,
      difference: Math.round(difference * 100) / 100,
      total_versements: Math.round(totalVersements * 100) / 100,
      total_frais: Math.round(totalFrais * 100) / 100,
      rendement_sans_frais: Math.round(rendementMoyenBrut * 100) / 100,
      rendement_avec_frais: Math.round((rendementMoyenBrut - fraisGestionMoyens - fraisArbitrageAnnuel) * 100) / 100,
      impact_sur_rendement: Math.round(impactSurRendement * 100) / 100,
      chart_data: chartData,
      frais_data: fraisData,
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return createErrorResponse(`Données invalides: ${error.issues.map(e => e.message).join(', ')}`, 400)
    }
    logger.error('Erreur simulateur frais AV:', { error: error instanceof Error ? error.message : String(error) })
    return createErrorResponse('Erreur lors de la simulation', 500)
  }
}
