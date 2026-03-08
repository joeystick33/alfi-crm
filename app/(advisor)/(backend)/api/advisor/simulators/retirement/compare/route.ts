import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
/**
 * Comparateur de Scénarios de Retraite
 * 
 * Corrections appliquées :
 * - Capitalisation mensuelle uniforme
 * - Phase de décumulation corrigée (rendement + retrait)
 * - Calcul de l'âge d'épuisement du capital
 * - Recommandations enrichies avec priorités
 */

const retirementCompareSchema = z.object({
  baseInput: z.object({
    currentAge: z.number().int().min(18).max(100),
    lifeExpectancy: z.number().int().min(60).max(120),
    currentSavings: z.number().min(0),
    monthlyContribution: z.number().min(0),
    expectedReturn: z.number().min(-0.5).max(0.5),
    inflationRate: z.number().min(0).max(0.2),
    currentIncome: z.number().positive(),
    desiredReplacementRate: z.number().min(0).max(2),
  }),
  scenarios: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      retirementAge: z.number().int().min(50).max(75),
      monthlyContribution: z.number().min(0).optional(),
      expectedReturn: z.number().min(-0.5).max(0.5).optional(),
    })
  ).min(1).max(10),
})

// Fonction de calcul d'un scénario avec capitalisation mensuelle corrigée
function calculateScenario(
  currentAge: number,
  retirementAge: number,
  lifeExpectancy: number,
  currentSavings: number,
  monthlyContribution: number,
  expectedReturn: number,
  desiredAnnualIncome: number
) {
  const monthlyRate = expectedReturn / 12
  const yearsUntilRetirement = retirementAge - currentAge
  const yearsInRetirement = lifeExpectancy - retirementAge
  const months = yearsUntilRetirement * 12

  // Total contributions (sans intérêts)
  const totalContributions = currentSavings + (monthlyContribution * 12 * yearsUntilRetirement)

  // FV Capital Initial (capitalisation mensuelle)
  const futureValueInitial = currentSavings * Math.pow(1 + monthlyRate, months)

  // FV Contributions (formule d'annuité mensuelle)
  let futureValueContributions = 0
  if (monthlyRate > 0 && monthlyContribution > 0) {
    futureValueContributions = monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate)
  } else if (monthlyContribution > 0) {
    futureValueContributions = monthlyContribution * months
  }

  const savingsAtRetirement = futureValueInitial + futureValueContributions
  const investmentGains = savingsAtRetirement - totalContributions

  // Retrait annuel durable (règle des 4%)
  const sustainableAnnualIncome = savingsAtRetirement * 0.04
  const sustainableMonthlyIncome = sustainableAnnualIncome / 12

  // Déficit
  const incomeShortfall = Math.max(0, desiredAnnualIncome - sustainableAnnualIncome)
  const isRetirementFeasible = incomeShortfall === 0

  // Calcul de l'âge d'épuisement du capital (décumulation corrigée)
  let capitalBalance = savingsAtRetirement
  let exhaustionAge: number | null = null

  for (let age = retirementAge; age <= lifeExpectancy + 10; age++) {
    // Capital × (1 + rendement) - Retrait
    capitalBalance = capitalBalance * (1 + expectedReturn) - sustainableAnnualIncome

    if (capitalBalance <= 0 && exhaustionAge === null) {
      exhaustionAge = age
      break
    }
  }

  // Capital restant à l'espérance de vie (décumulation corrigée)
  let capitalAtLifeExpectancy = savingsAtRetirement
  for (let year = 0; year < yearsInRetirement; year++) {
    capitalAtLifeExpectancy = capitalAtLifeExpectancy * (1 + expectedReturn) - sustainableAnnualIncome
  }
  capitalAtLifeExpectancy = Math.max(0, capitalAtLifeExpectancy)

  return {
    yearsUntilRetirement,
    yearsInRetirement,
    totalContributions: Math.round(totalContributions),
    savingsAtRetirement: Math.round(savingsAtRetirement),
    investmentGains: Math.round(investmentGains),
    gainPercentage: totalContributions > 0 ? Math.round((investmentGains / totalContributions) * 100) : 0,
    sustainableAnnualIncome: Math.round(sustainableAnnualIncome),
    sustainableMonthlyIncome: Math.round(sustainableMonthlyIncome),
    incomeShortfall: Math.round(incomeShortfall),
    isRetirementFeasible,
    exhaustionAge,
    capitalAtLifeExpectancy: Math.round(capitalAtLifeExpectancy),
    capitalLasts: exhaustionAge ? exhaustionAge - retirementAge : yearsInRetirement + 10
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = retirementCompareSchema.parse(body)
    const { baseInput, scenarios } = validatedData

    const {
      currentAge,
      lifeExpectancy,
      currentSavings,
      monthlyContribution: baseMonthlyContribution,
      expectedReturn: baseExpectedReturn,
      inflationRate,
      currentIncome,
      desiredReplacementRate
    } = baseInput

    const desiredAnnualIncome = currentIncome * desiredReplacementRate
    const desiredMonthlyIncome = desiredAnnualIncome / 12

    // Calcul de chaque scénario
    const scenarioResults = scenarios.map((scenario) => {
      const retirementAge = scenario.retirementAge
      const monthlyContribution = scenario.monthlyContribution ?? baseMonthlyContribution
      const expectedReturn = scenario.expectedReturn ?? baseExpectedReturn

      const result = calculateScenario(
        currentAge,
        retirementAge,
        lifeExpectancy,
        currentSavings,
        monthlyContribution,
        expectedReturn,
        desiredAnnualIncome
      )

      return {
        name: scenario.name,
        description: scenario.description,
        retirementAge,
        monthlyContribution,
        expectedReturn,
        expectedReturnPercent: Math.round(expectedReturn * 100),
        ...result,
        isBestScenario: false,
        ecartAvecMeilleur: 0,
      }
    })

    // Identifier le meilleur scénario
    const feasibleScenarios = scenarioResults.filter((s) => s.isRetirementFeasible)

    let bestScenario: typeof scenarioResults[0]
    let bestScenarioReason: string

    if (feasibleScenarios.length > 0) {
      // Parmi les viables, celui avec le plus de capital restant
      bestScenario = feasibleScenarios.reduce((best, current) =>
        current.capitalAtLifeExpectancy > best.capitalAtLifeExpectancy ? current : best
      )
      bestScenarioReason = 'capital restant le plus élevé parmi les scénarios viables'
    } else {
      // Sinon, celui avec le déficit le plus faible
      bestScenario = scenarioResults.reduce((best, current) =>
        current.incomeShortfall < best.incomeShortfall ? current : best
      )
      bestScenarioReason = 'déficit de revenu le plus faible'
    }

    // Marquer le meilleur
    scenarioResults.forEach((s) => {
      s.isBestScenario = s.name === bestScenario.name
      s.ecartAvecMeilleur = s.savingsAtRetirement - bestScenario.savingsAtRetirement
    })

    // Statistiques globales
    const feasibleCount = feasibleScenarios.length
    const averageSavings = Math.round(scenarioResults.reduce((sum: number, s) => sum + s.savingsAtRetirement, 0) / scenarioResults.length)
    const minSavings = Math.min(...scenarioResults.map((s) => s.savingsAtRetirement))
    const maxSavings = Math.max(...scenarioResults.map((s) => s.savingsAtRetirement))

    // Résumé narratif
    const summary = feasibleCount > 0
      ? `✅ ${feasibleCount} scénario(s) sur ${scenarioResults.length} permettent d'atteindre vos objectifs. Le scénario "${bestScenario.name}" est recommandé (${bestScenarioReason}).`
      : `⚠️ Aucun scénario ne permet d'atteindre vos objectifs actuels (${Math.round(desiredReplacementRate * 100)}% de ${currentIncome.toLocaleString('fr-FR')} €). Le scénario "${bestScenario.name}" présente le déficit le plus faible.`

    // Recommandations enrichies
    const recommendations: Array<{ priorite: 'haute' | 'moyenne' | 'basse', type: string, description: string }> = []

    if (feasibleCount === 0) {
      // Calculer l'épargne supplémentaire nécessaire
      const avgShortfall = scenarioResults.reduce((sum: number, s) => sum + s.incomeShortfall, 0) / scenarioResults.length
      const avgYearsToRetirement = scenarioResults.reduce((sum: number, s) => sum + s.yearsUntilRetirement, 0) / scenarioResults.length
      const additionalMonthlyNeeded = Math.round(avgShortfall / (avgYearsToRetirement * 12 * 0.04))

      recommendations.push({
        priorite: 'haute',
        type: 'epargne',
        description: `Augmentez votre épargne mensuelle d'environ ${additionalMonthlyNeeded.toLocaleString('fr-FR')} € pour rendre les scénarios viables.`
      })

      recommendations.push({
        priorite: 'moyenne',
        type: 'objectif',
        description: `Réduisez votre taux de remplacement cible de ${Math.round(desiredReplacementRate * 100)}% à ~${Math.round((bestScenario.sustainableAnnualIncome / currentIncome) * 100)}% pour correspondre à votre épargne.`
      })

      recommendations.push({
        priorite: 'moyenne',
        type: 'report',
        description: 'Reporter votre départ augmente le temps de capitalisation et réduit la période de décumulation.'
      })
    } else if (feasibleCount < scenarioResults.length) {
      recommendations.push({
        priorite: 'basse',
        type: 'choix',
        description: `Le scénario "${bestScenario.name}" est recommandé : départ à ${bestScenario.retirementAge} ans avec ${bestScenario.sustainableMonthlyIncome.toLocaleString('fr-FR')} €/mois.`
      })

      const nonFeasible = scenarioResults.filter((s) => !s.isRetirementFeasible)
      if (nonFeasible.length > 0) {
        recommendations.push({
          priorite: 'moyenne',
          type: 'alerte',
          description: `Les scénarios de départ anticipé (${nonFeasible.map((s) => s.retirementAge + ' ans').join(', ')}) présentent un déficit. Une épargne supplémentaire est nécessaire.`
        })
      }
    } else {
      recommendations.push({
        priorite: 'basse',
        type: 'info',
        description: '✅ Tous vos scénarios sont viables. Choisissez selon vos préférences personnelles (durée de travail vs capital restant).'
      })

      recommendations.push({
        priorite: 'basse',
        type: 'optimisation',
        description: `Le scénario "${bestScenario.name}" maximise votre capital de retraite avec ${bestScenario.capitalAtLifeExpectancy.toLocaleString('fr-FR')} € restant à ${lifeExpectancy} ans.`
      })
    }

    // Alerte si capital épuisé avant espérance de vie
    const exhaustionRisks = scenarioResults.filter((s) => s.exhaustionAge && s.exhaustionAge < lifeExpectancy)
    if (exhaustionRisks.length > 0) {
      recommendations.unshift({
        priorite: 'haute',
        type: 'risque',
        description: `⚠️ ${exhaustionRisks.length} scénario(s) voient le capital s'épuiser avant ${lifeExpectancy} ans. Risque de longévité à considérer.`
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        // Paramètres de base
        currentAge,
        lifeExpectancy,
        currentIncome: Math.round(currentIncome),
        desiredReplacementRate,
        desiredAnnualIncome: Math.round(desiredAnnualIncome),
        desiredMonthlyIncome: Math.round(desiredMonthlyIncome),

        // Statistiques
        stats: {
          feasibleCount,
          totalScenarios: scenarioResults.length,
          averageSavings,
          minSavings,
          maxSavings,
          spreadSavings: maxSavings - minSavings
        },

        // Résultats
        scenarios: scenarioResults,
        bestScenario: {
          ...bestScenario,
          reason: bestScenarioReason
        },

        // Narration
        summary,
        recommendations
      }
    })
  } catch (error) {
    logger.error('Error in retirement comparison:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation error: ' + error.message }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
