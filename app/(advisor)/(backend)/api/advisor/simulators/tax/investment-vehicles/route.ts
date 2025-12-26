import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'

const investmentVehiclesSchema = z.object({
    investmentAmount: z.number().positive('Le montant doit être positif'),
    holdingPeriod: z.number().int().min(1).max(50, 'La durée doit être entre 1 et 50 ans'),
    expectedAnnualReturn: z.number().min(-0.5).max(0.5, 'Le rendement doit être entre -50% et 50%'),
})

interface VehicleComparison {
    name: string
    description: string
    grossReturn: number
    taxOnReturn: number
    netReturn: number
    effectiveTaxRate: number
    advantages: string[]
    disadvantages: string[]
}

/**
 * Calcule le rendement net après fiscalité pour chaque véhicule d'investissement
 * Basé sur la fiscalité française en vigueur
 */
function calculateInvestmentVehicles(
    investmentAmount: number,
    holdingPeriod: number,
    expectedAnnualReturn: number
): VehicleComparison[] {
    // Calcul du capital final brut (avant impôts)
    const grossFinalValue = investmentAmount * Math.pow(1 + expectedAnnualReturn, holdingPeriod)
    const grossReturn = grossFinalValue - investmentAmount

    const comparisons: VehicleComparison[] = []

    // 1. PEA (Plan d'Épargne en Actions)
    // Exonération d'impôt sur les plus-values après 5 ans, prélèvements sociaux uniquement (17.2%)
    const peaTaxRate = holdingPeriod >= 5 ? 0.172 : 0.172 + 0.128 // PS seuls après 5 ans, PS + IR avant
    const peaTax = grossReturn * peaTaxRate
    const peaNetReturn = grossReturn - peaTax
    comparisons.push({
        name: 'PEA (Plan d\'Épargne en Actions)',
        description: holdingPeriod >= 5 
            ? 'Exonération d\'IR après 5 ans, prélèvements sociaux uniquement'
            : 'Fiscalité complète avant 5 ans',
        grossReturn,
        taxOnReturn: peaTax,
        netReturn: peaNetReturn,
        effectiveTaxRate: peaTaxRate * 100,
        advantages: [
            holdingPeriod >= 5 ? 'Exonération d\'impôt sur le revenu' : 'Enveloppe fiscale avantageuse à long terme',
            'Plafond de 150 000€',
            'Transmission optimisée',
        ],
        disadvantages: [
            holdingPeriod < 5 ? 'Fiscalité complète avant 5 ans' : 'Prélèvements sociaux toujours dus',
            'Limité aux actions européennes',
            'Pénalité de sortie anticipée',
        ],
    })

    // 2. Assurance-vie
    // Fiscalité dégressive : 35% < 4 ans, 15% 4-8 ans, 7.5% > 8 ans + PS 17.2%
    // Abattement de 4 600€ (célibataire) ou 9 200€ (couple) après 8 ans
    let avIRRate = 0.35
    if (holdingPeriod >= 8) avIRRate = 0.075
    else if (holdingPeriod >= 4) avIRRate = 0.15
    
    const avAbatement = holdingPeriod >= 8 ? 4600 : 0 // Abattement célibataire
    const taxableReturn = Math.max(0, grossReturn - avAbatement)
    const avTax = taxableReturn * (avIRRate + 0.172)
    const avNetReturn = grossReturn - avTax
    comparisons.push({
        name: 'Assurance-vie',
        description: holdingPeriod >= 8 
            ? 'Fiscalité très avantageuse après 8 ans avec abattement'
            : `Fiscalité réduite à ${avIRRate * 100}% + PS`,
        grossReturn,
        taxOnReturn: avTax,
        netReturn: avNetReturn,
        effectiveTaxRate: (avTax / grossReturn) * 100,
        advantages: [
            holdingPeriod >= 8 ? 'Abattement annuel de 4 600€' : 'Fiscalité dégressive dans le temps',
            'Transmission optimisée (abattement 152 500€ par bénéficiaire)',
            'Grande flexibilité',
        ],
        disadvantages: [
            'Frais de gestion annuels',
            'Fiscalité moins avantageuse avant 8 ans',
            'Frais sur versements',
        ],
    })

    // 3. Compte-titres ordinaire (CTO)
    // Flat tax 30% (12.8% IR + 17.2% PS) ou barème progressif de l'IR
    const ctoTaxRate = 0.30 // Flat tax
    const ctoTax = grossReturn * ctoTaxRate
    const ctoNetReturn = grossReturn - ctoTax
    comparisons.push({
        name: 'Compte-titres ordinaire',
        description: 'Flat tax de 30% (ou option pour le barème progressif)',
        grossReturn,
        taxOnReturn: ctoTax,
        netReturn: ctoNetReturn,
        effectiveTaxRate: ctoTaxRate * 100,
        advantages: [
            'Aucune contrainte de durée',
            'Plafond illimité',
            'Accès à tous les marchés',
        ],
        disadvantages: [
            'Fiscalité immédiate et complète',
            'Pas d\'abattement',
            'Taxation annuelle des dividendes',
        ],
    })

    // 4. PER (Plan Épargne Retraite)
    // Déduction fiscale à l\'entrée, taxation à la sortie selon TMI
    // On suppose TMI 30% (hypothèse médiane)
    const perTMI = 0.30
    const perDeduction = investmentAmount * perTMI // Économie d'impôt à l'entrée
    const perTaxOnExit = grossFinalValue * (perTMI + 0.172) // Taxation totale à la sortie sur le capital
    const perNetReturn = grossReturn + perDeduction - (perTaxOnExit - investmentAmount) // Net après économie d'impôt et taxation
    comparisons.push({
        name: 'PER (Plan Épargne Retraite)',
        description: `Déduction fiscale à l'entrée (TMI ${perTMI * 100}%), taxation à la sortie`,
        grossReturn,
        taxOnReturn: perTaxOnExit - investmentAmount - perDeduction,
        netReturn: perNetReturn,
        effectiveTaxRate: ((perTaxOnExit - investmentAmount - perDeduction) / grossReturn) * 100,
        advantages: [
            'Déduction fiscale immédiate',
            'Report d\'imposition',
            'Transmission avantageuse',
        ],
        disadvantages: [
            'Blocage jusqu\'à la retraite',
            'Taxation à la sortie',
            'Sortie en capital limitée',
        ],
    })

    // 5. SCPI (Société Civile de Placement Immobilier)
    // Revenus fonciers taxés au TMI (hypothèse 30%) + PS 17.2%
    // Plus-value immobilière : abattement progressif jusqu'à exonération après 22 ans (IR) et 30 ans (PS)
    const scpiRentalYield = 0.045 // Rendement locatif moyen de 4.5%
    const scpiAnnualIncome = investmentAmount * scpiRentalYield
    const scpiTotalIncome = scpiAnnualIncome * holdingPeriod
    const scpiIncomeTax = scpiTotalIncome * (perTMI + 0.172)
    
    // Plus-value (différence entre valeur finale et investissement)
    const scpiCapitalGain = grossReturn - scpiTotalIncome
    let scpiCapitalGainTaxRate = 0.192 + 0.172 // 19% IR + 17.2% PS
    if (holdingPeriod >= 22) scpiCapitalGainTaxRate = 0.172 // Exonération IR après 22 ans
    if (holdingPeriod >= 30) scpiCapitalGainTaxRate = 0 // Exonération totale après 30 ans
    const scpiCapitalGainTax = scpiCapitalGain * scpiCapitalGainTaxRate
    
    const scpiTotalTax = scpiIncomeTax + scpiCapitalGainTax
    const scpiNetReturn = grossReturn - scpiTotalTax
    comparisons.push({
        name: 'SCPI (Pierre-papier)',
        description: holdingPeriod >= 22 
            ? 'Exonération de plus-value immobilière progressive'
            : 'Revenus fonciers + plus-value taxés',
        grossReturn,
        taxOnReturn: scpiTotalTax,
        netReturn: scpiNetReturn,
        effectiveTaxRate: (scpiTotalTax / grossReturn) * 100,
        advantages: [
            'Revenus réguliers',
            'Diversification immobilière',
            holdingPeriod >= 22 ? 'Exonération progressive de plus-value' : 'Fiscalité immobilière',
        ],
        disadvantages: [
            'Liquidité limitée',
            'Revenus fonciers taxés au TMI',
            'Frais de souscription élevés',
        ],
    })

    // Trier par rendement net décroissant
    return comparisons.sort((a, b) => b.netReturn - a.netReturn)
}

export async function POST(request: NextRequest) {
    try {
        await requireAuth(request)

        const body = await request.json()
        const validatedData = investmentVehiclesSchema.parse(body)

        const comparisons = calculateInvestmentVehicles(
            validatedData.investmentAmount,
            validatedData.holdingPeriod,
            validatedData.expectedAnnualReturn
        )

        const bestVehicle = comparisons[0]
        const worstVehicle = comparisons[comparisons.length - 1]
        const savingsPotential = bestVehicle.netReturn - worstVehicle.netReturn

        return createSuccessResponse({
            comparisons,
            summary: {
                bestVehicle: bestVehicle.name,
                bestNetReturn: bestVehicle.netReturn,
                worstVehicle: worstVehicle.name,
                worstNetReturn: worstVehicle.netReturn,
                savingsPotential,
                savingsPotentialPercent: (savingsPotential / validatedData.investmentAmount) * 100,
            },
            parameters: {
                investmentAmount: validatedData.investmentAmount,
                holdingPeriod: validatedData.holdingPeriod,
                expectedAnnualReturn: validatedData.expectedAnnualReturn,
            },
        })
    } catch (error) {
        console.error('Error in investment vehicles comparison:', error)
        if (error instanceof z.ZodError) {
            return createErrorResponse('Validation error: ' + error.message, 400)
        }
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
        }
        return createErrorResponse('Internal server error', 500)
    }
}
