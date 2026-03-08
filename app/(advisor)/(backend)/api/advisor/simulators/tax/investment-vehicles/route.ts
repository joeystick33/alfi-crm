import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
import { RULES } from '@/app/_common/lib/rules/fiscal-rules'
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
    // Exonération d'impôt sur les plus-values après 5 ans, prélèvements sociaux uniquement
    // PEA = revenus financiers → PS 18,6% (LFSS 2026)
    const peaTaxRate = holdingPeriod >= 5 ? RULES.ps.pfu_per_2026 : RULES.ps.pfu_per_2026 + RULES.ps.pfu_ir // PS seuls après 5 ans, PS + IR avant
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
    let avIRRate = RULES.assurance_vie.rachat.pfl_moins_4ans
    if (holdingPeriod >= 8) avIRRate = RULES.assurance_vie.rachat.taux_reduit_8ans
    else if (holdingPeriod >= 4) avIRRate = RULES.assurance_vie.rachat.pfl_4_8ans
    
    const avAbatement = holdingPeriod >= 8 ? RULES.assurance_vie.rachat.abattement_celibataire_8ans : 0
    const taxableReturn = Math.max(0, grossReturn - avAbatement)
    const avTax = taxableReturn * (avIRRate + RULES.ps.total) // PS sur AV
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
    // Flat tax 31.4% (12.8% IR + 18.6% PS LFSS 2026) sur revenus financiers
    const ctoTaxRate = RULES.ps.pfu_ir + RULES.ps.pfu_per_2026 // PFU (revenus financiers)
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
    const perTaxOnExit = grossFinalValue * (perTMI + RULES.ps.pfu_per_2026) // PS (PER = revenus financiers) // Taxation totale à la sortie sur le capital
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
    // Revenus fonciers taxés au TMI (hypothèse 30%) + PS 17,2% INCHANGÉ (foncier exclu LFSS 2026)
    // Plus-value immobilière : abattement progressif jusqu'à exonération après 22 ans (IR) et 30 ans (PS)
    const scpiRentalYield = 0.045 // Rendement locatif moyen de 4.5%
    const scpiAnnualIncome = investmentAmount * scpiRentalYield
    const scpiTotalIncome = scpiAnnualIncome * holdingPeriod
    const scpiIncomeTax = scpiTotalIncome * (perTMI + RULES.ps.total) // PS foncier
    
    // Plus-value (différence entre valeur finale et investissement)
    const scpiCapitalGain = grossReturn - scpiTotalIncome
    let scpiCapitalGainTaxRate = RULES.immobilier.plus_value.taux_ir + RULES.ps.total // IR + PS PV immo
    if (holdingPeriod >= 22) scpiCapitalGainTaxRate = RULES.ps.total // Exonération IR après 22 ans
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
        logger.error('Error in investment vehicles comparison:', { error: error instanceof Error ? error.message : String(error) })
        if (error instanceof z.ZodError) {
            return createErrorResponse('Validation error: ' + error.message, 400)
        }
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
        }
        return createErrorResponse('Internal server error', 500)
    }
}
