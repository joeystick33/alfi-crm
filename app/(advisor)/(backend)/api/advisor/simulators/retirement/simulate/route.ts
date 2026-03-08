 
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
/**
 * Simulateur de Retraite Privée
 * 
 * Corrections appliquées :
 * - Capitalisation mensuelle uniforme pour plus de précision
 * - Phase de décumulation corrigée : le capital gagne des intérêts après retrait
 * - Formule : Solde_final = (Solde_initial * (1 + rendement)) - Retrait
 */

const retirementSimulationSchema = z.object({
    currentAge: z.coerce.number().int().min(18).max(100),
    retirementAge: z.coerce.number().int().min(50).max(100),
    lifeExpectancy: z.coerce.number().int().min(60).max(120),
    currentSavings: z.coerce.number().min(0).default(0),
    monthlyContribution: z.coerce.number().min(0).default(0),
    expectedReturn: z.coerce.number().min(-0.5).max(0.5).default(0.04), // Taux annuel (ex: 0.04 = 4%)
    inflationRate: z.coerce.number().min(0).max(0.2).default(0.02),
    currentIncome: z.coerce.number().min(0).default(0), // Changed from positive() to min(0)
    desiredReplacementRate: z.coerce.number().min(0).max(2).default(0.7),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = retirementSimulationSchema.parse(body)
    const {
      currentAge,
      retirementAge,
      lifeExpectancy,
      currentSavings,
      monthlyContribution,
      expectedReturn,
      inflationRate,
      currentIncome,
      desiredReplacementRate
    } = validatedData

    // =====================================================
    // CALCULS CORRIGÉS - Capitalisation mensuelle uniforme
    // =====================================================
    
    const monthlyRate = expectedReturn / 12 // Taux mensuel
    const yearsUntilRetirement = retirementAge - currentAge
    const yearsInRetirement = lifeExpectancy - retirementAge
    const months = yearsUntilRetirement * 12

    // Total des contributions (sans intérêts)
    const totalContributions = currentSavings + (monthlyContribution * 12 * yearsUntilRetirement)

    // FV Capital Initial (capitalisation mensuelle pour cohérence)
    const futureValueInitial = currentSavings * Math.pow(1 + monthlyRate, months)

    // FV Contributions mensuelles (formule d'annuité)
    let futureValueContributions = 0
    if (monthlyRate > 0 && monthlyContribution > 0) {
      futureValueContributions = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
    } else if (monthlyContribution > 0) {
      futureValueContributions = monthlyContribution * months
    }

    const savingsAtRetirement = futureValueInitial + futureValueContributions
    const investmentGains = savingsAtRetirement - totalContributions

    // Revenu annuel désiré
    const desiredAnnualIncome = currentIncome * desiredReplacementRate

    // Retrait annuel durable (règle des 4%)
    const sustainableAnnualIncome = savingsAtRetirement * 0.04

    // Déficit de revenu
    const incomeShortfall = Math.max(0, desiredAnnualIncome - sustainableAnnualIncome)
    const isRetirementFeasible = incomeShortfall === 0

    // =====================================================
    // PROJECTION CORRIGÉE - Décumulation avec rendement
    // =====================================================
    const projection: Array<{
      age: number
      savingsBalance: number
      totalContributions: number
      annualWithdrawal: number
      interestsEarned: number
      phase: 'accumulation' | 'retirement'
    }> = []
    
    let currentSavingsBalance = currentSavings
    let cumulativeContributions = currentSavings
    let cumulativeInterests = 0

    for (let age = currentAge; age <= lifeExpectancy; age++) {
      if (age < retirementAge) {
        // ===============================
        // PHASE D'ACCUMULATION (année par année)
        // ===============================
        
        // Intérêts sur le solde de l'année précédente
        const interestsThisYear = currentSavingsBalance * expectedReturn
        cumulativeInterests += interestsThisYear
        
        // Capital après intérêts + contributions annuelles
        currentSavingsBalance = currentSavingsBalance * (1 + expectedReturn) + (monthlyContribution * 12)
        cumulativeContributions += (monthlyContribution * 12)

        projection.push({
          age,
          savingsBalance: Math.round(currentSavingsBalance),
          totalContributions: Math.round(cumulativeContributions),
          annualWithdrawal: 0,
          interestsEarned: Math.round(interestsThisYear),
          phase: 'accumulation'
        })

      } else {
        // ===============================
        // PHASE DE DÉCUMULATION (corrigée)
        // Le capital gagne des intérêts PUIS on retire
        // ===============================
        
        // À la retraite, on utilise le capital calculé précisément
        if (age === retirementAge) {
          currentSavingsBalance = savingsAtRetirement
        }

        // Intérêts sur le capital
        const interestsThisYear = currentSavingsBalance * expectedReturn
        
        // Nouveau solde = Capital × (1 + rendement) - Retrait
        currentSavingsBalance = currentSavingsBalance * (1 + expectedReturn) - sustainableAnnualIncome
        
        // Le solde ne peut pas être négatif pour l'affichage
        const displayBalance = Math.max(0, currentSavingsBalance)

        projection.push({
          age,
          savingsBalance: Math.round(displayBalance),
          totalContributions: Math.round(totalContributions), // Figé à la retraite
          annualWithdrawal: Math.round(sustainableAnnualIncome),
          interestsEarned: Math.round(interestsThisYear),
          phase: 'retirement'
        })

        // Vérifier si le capital est épuisé
        if (currentSavingsBalance < 0) {
          // Marquer l'âge d'épuisement
          const exhaustionAge = age
          // On continue la projection mais avec 0
        }
      }
    }

    // Calcul de l'âge d'épuisement du capital
    const exhaustionEntry = projection.find(p => p.phase === 'retirement' && p.savingsBalance === 0)
    const capitalExhaustionAge = exhaustionEntry?.age || null
    const capitalLastsUntil = capitalExhaustionAge ? capitalExhaustionAge : lifeExpectancy

    // =====================================================
    // RECOMMANDATIONS AMÉLIORÉES
    // =====================================================
    const recommendations: Array<{ priorite: 'haute' | 'moyenne' | 'basse', type: string, description: string }> = []
    
    if (incomeShortfall > 0) {
      const additionalMonthly = Math.round(incomeShortfall / (yearsUntilRetirement * 12))
      const additionalYears = monthlyContribution > 0 ? Math.ceil(incomeShortfall / (sustainableAnnualIncome * 0.04)) : 5
      const achievableRate = Math.round((sustainableAnnualIncome / currentIncome) * 100)
      
      recommendations.push({
        priorite: 'haute',
        type: 'epargne',
        description: `Déficit de ${Math.round(incomeShortfall).toLocaleString('fr-FR')} €/an. Augmentez votre épargne mensuelle de ${additionalMonthly.toLocaleString('fr-FR')} € pour le combler.`
      })
      
      if (yearsUntilRetirement > 3) {
        recommendations.push({
          priorite: 'moyenne',
          type: 'report',
          description: `Reporter votre départ de ${Math.min(additionalYears, 10)} ans augmenterait significativement votre capital.`
        })
      }
      
      recommendations.push({
        priorite: 'moyenne',
        type: 'objectif',
        description: `Avec votre épargne actuelle, vous pouvez viser un taux de remplacement de ${achievableRate}% au lieu de ${Math.round(desiredReplacementRate * 100)}%.`
      })
    } else {
      recommendations.push({
        priorite: 'basse',
        type: 'info',
        description: 'Votre plan de retraite est viable. Continuez vos contributions régulières.'
      })
      
      if (expectedReturn < 0.04) {
        recommendations.push({
          priorite: 'moyenne',
          type: 'rendement',
          description: `Avec un rendement de ${(expectedReturn * 100).toFixed(1)}%, envisagez une diversification pour améliorer la performance long terme.`
        })
      }
      
      recommendations.push({
        priorite: 'basse',
        type: 'suivi',
        description: 'Réévaluez votre plan annuellement pour ajuster selon l\'évolution de votre situation.'
      })
    }

    // Avertissement si le capital s'épuise avant l'espérance de vie
    if (capitalExhaustionAge && capitalExhaustionAge < lifeExpectancy) {
      recommendations.unshift({
        priorite: 'haute',
        type: 'alerte',
        description: `⚠️ Attention : votre capital serait épuisé à ${capitalExhaustionAge} ans, soit ${lifeExpectancy - capitalExhaustionAge} ans avant votre espérance de vie.`
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        // Paramètres
        currentAge,
        retirementAge,
        lifeExpectancy,
        yearsUntilRetirement,
        yearsInRetirement,
        
        // Résultats principaux
        savingsAtRetirement: Math.round(savingsAtRetirement),
        totalContributions: Math.round(totalContributions),
        investmentGains: Math.round(investmentGains),
        gainPercentage: totalContributions > 0 ? Math.round((investmentGains / totalContributions) * 100) : 0,
        
        // Revenus
        desiredAnnualIncome: Math.round(desiredAnnualIncome),
        desiredReplacementRate,
        sustainableAnnualIncome: Math.round(sustainableAnnualIncome),
        sustainableMonthlyIncome: Math.round(sustainableAnnualIncome / 12),
        incomeShortfall: Math.round(incomeShortfall),
        isRetirementFeasible,
        
        // Durabilité
        capitalExhaustionAge,
        capitalLastsUntil,
        
        // Projection et recommandations
        projection,
        recommendations
      }
    })
  } catch (error: any) {
    logger.error('Error in retirement simulation:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation error: ' + error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
