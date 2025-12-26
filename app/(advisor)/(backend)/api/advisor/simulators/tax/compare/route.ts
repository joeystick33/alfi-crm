import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'

const taxCompareSchema = z.object({
    income: z.number().positive('Le revenu doit être positif'),
    currentDeductions: z.number().min(0, 'Les déductions doivent être positives'),
    familyQuotient: z.number().min(1).max(10, 'Le quotient familial doit être entre 1 et 10'),
    availableBudget: z.number().min(0, 'Le budget doit être positif'),
})

/**
 * Barème progressif de l'impôt sur le revenu 2024
 */
const TAX_BRACKETS_2024 = [
    { limit: 11294, rate: 0 },
    { limit: 28797, rate: 0.11 },
    { limit: 82341, rate: 0.30 },
    { limit: 177106, rate: 0.41 },
    { limit: Infinity, rate: 0.45 }
]

interface TaxStrategy {
    strategyName: string
    description: string
    investment: number
    taxSavings: number
    netBenefit: number
    roi: number
    implementation: string[]
    constraints: string[]
}

/**
 * Calcule l'impôt sur le revenu selon le barème progressif
 */
function calculateIncomeTax(taxableIncome: number, familyQuotient: number): number {
    const incomePerPart = taxableIncome / familyQuotient
    
    let tax = 0
    let previousLimit = 0

    for (const bracket of TAX_BRACKETS_2024) {
        if (incomePerPart > previousLimit) {
            const taxableInBracket = Math.min(incomePerPart, bracket.limit) - previousLimit
            tax += taxableInBracket * bracket.rate
        }
        previousLimit = bracket.limit
        if (incomePerPart <= bracket.limit) break
    }

    return Math.max(0, tax * familyQuotient)
}

/**
 * Compare différentes stratégies d'optimisation fiscale
 */
function compareTaxStrategies(
    income: number,
    currentDeductions: number,
    familyQuotient: number,
    availableBudget: number
): {
    baselineTax: number
    maxSavings: number
    bestStrategy: string
    recommendation: string
    strategies: TaxStrategy[]
} {
    const taxableIncome = Math.max(0, income - currentDeductions)
    const baselineTax = calculateIncomeTax(taxableIncome, familyQuotient)

    const strategies: TaxStrategy[] = []

    // 1. PER (Plan Épargne Retraite)
    // Déduction fiscale jusqu'à 10% du revenu (plafonné à 35 194€ pour 2024)
    const perMaxDeduction = Math.min(income * 0.10, 35194)
    const perInvestment = Math.min(perMaxDeduction, availableBudget)
    if (perInvestment >= 1000) {
        const newTaxableIncome = taxableIncome - perInvestment
        const newTax = calculateIncomeTax(newTaxableIncome, familyQuotient)
        const perSavings = baselineTax - newTax
        const perNetBenefit = perSavings // Économie immédiate (l'investissement sera récupéré à la retraite)
        
        strategies.push({
            strategyName: 'PER (Plan Épargne Retraite)',
            description: `Déduisez jusqu'à ${perMaxDeduction.toLocaleString('fr-FR')}€ de votre revenu imposable en versant sur un PER`,
            investment: perInvestment,
            taxSavings: perSavings,
            netBenefit: perNetBenefit,
            roi: perInvestment > 0 ? perSavings / perInvestment : 0,
            implementation: [
                'Ouvrir un PER auprès d\'un établissement financier',
                `Effectuer un versement de ${perInvestment.toLocaleString('fr-FR')}€`,
                'Déclarer le versement dans votre déclaration d\'impôts',
                'Bénéficier de la réduction d\'impôt l\'année suivante'
            ],
            constraints: [
                'Blocage des fonds jusqu\'à la retraite (sauf cas de déblocage anticipé)',
                `Plafond de déduction : ${perMaxDeduction.toLocaleString('fr-FR')}€/an`,
                'Taxation à la sortie lors de la retraite'
            ]
        })
    }

    // 2. Dons aux œuvres
    // Réduction d'impôt de 66% des dons (plafonné à 20% du revenu imposable)
    const donMaxDeduction = taxableIncome * 0.20
    const donInvestment = Math.min(5000, availableBudget, donMaxDeduction) // Arbitrairement limité à 5000€ pour la simulation
    if (donInvestment >= 100) {
        const donReduction = donInvestment * 0.66
        const donSavings = Math.min(donReduction, baselineTax)
        const donNetBenefit = donSavings - donInvestment
        
        strategies.push({
            strategyName: 'Dons aux associations',
            description: 'Réduction d\'impôt de 66% des dons effectués à des associations d\'intérêt général',
            investment: donInvestment,
            taxSavings: donSavings,
            netBenefit: donNetBenefit,
            roi: donInvestment > 0 ? donSavings / donInvestment : 0,
            implementation: [
                'Identifier les associations éligibles (reconnues d\'intérêt général)',
                `Effectuer un don de ${donInvestment.toLocaleString('fr-FR')}€`,
                'Conserver les reçus fiscaux',
                'Déclarer les dons dans votre déclaration d\'impôts'
            ],
            constraints: [
                'Plafond de 20% du revenu imposable',
                'Associations reconnues d\'intérêt général uniquement',
                'Pas de contrepartie autorisée'
            ]
        })
    }

    // 3. Investissement locatif (dispositif Pinel)
    // Réduction d'impôt de 12% sur 6 ans (2% par an) pour l'achat d'un bien neuf mis en location
    const pinelMaxInvestment = 300000 // Plafond 2024
    const pinelInvestment = Math.min(pinelMaxInvestment, availableBudget)
    if (pinelInvestment >= 100000) {
        // On simule sur 6 ans : 2% par an pendant 6 ans = 12%
        const pinelReductionTotal = pinelInvestment * 0.12
        const pinelReductionAnnual = pinelReductionTotal / 6
        const pinelSavings = pinelReductionAnnual // Économie annuelle pendant 6 ans
        const pinelNetBenefit = pinelSavings - (pinelInvestment * 0.02) // On simule un coût annuel de 2% (gestion, travaux, vacance locative)
        
        strategies.push({
            strategyName: 'Investissement Pinel',
            description: 'Réduction d\'impôt de 12% sur 6 ans pour l\'achat d\'un logement neuf mis en location',
            investment: pinelInvestment,
            taxSavings: pinelReductionTotal,
            netBenefit: pinelReductionTotal - (pinelInvestment * 0.12), // Coût estimé sur 6 ans
            roi: pinelInvestment > 0 ? pinelReductionTotal / pinelInvestment : 0,
            implementation: [
                'Acheter un logement neuf éligible en zone Pinel',
                'Mettre le bien en location pendant 6 ans minimum',
                'Respecter les plafonds de loyer et de ressources des locataires',
                'Déclarer l\'investissement dans votre déclaration d\'impôts'
            ],
            constraints: [
                'Achat d\'un logement neuf uniquement',
                'Engagement de location de 6, 9 ou 12 ans',
                `Plafond d\'investissement : ${pinelMaxInvestment.toLocaleString('fr-FR')}€`,
                'Plafonds de loyer et de ressources des locataires',
                'Zones géographiques éligibles limitées'
            ]
        })
    }

    // 4. Travaux de rénovation énergétique
    // Crédit d'impôt de 30% pour certains travaux (MaPrimeRénov')
    const travauxMaxCredit = 15000 // Plafond indicatif
    const travauxInvestment = Math.min(travauxMaxCredit, availableBudget)
    if (travauxInvestment >= 1000) {
        const travauxCredit = travauxInvestment * 0.30
        const travauxSavings = Math.min(travauxCredit, baselineTax)
        const travauxNetBenefit = travauxSavings - travauxInvestment
        
        strategies.push({
            strategyName: 'Travaux de rénovation énergétique',
            description: 'Crédit d\'impôt et aides (MaPrimeRénov\') pour les travaux d\'amélioration énergétique',
            investment: travauxInvestment,
            taxSavings: travauxSavings,
            netBenefit: travauxNetBenefit,
            roi: travauxInvestment > 0 ? travauxSavings / travauxInvestment : 0,
            implementation: [
                'Identifier les travaux éligibles (isolation, chauffage, etc.)',
                'Faire appel à un professionnel RGE (Reconnu Garant de l\'Environnement)',
                `Réaliser les travaux pour ${travauxInvestment.toLocaleString('fr-FR')}€`,
                'Demander MaPrimeRénov\' et déclarer les travaux aux impôts'
            ],
            constraints: [
                'Travaux éligibles uniquement (isolation, chauffage, etc.)',
                'Professionnel RGE obligatoire',
                'Plafonds de revenus pour certaines aides',
                'Résidence principale uniquement'
            ]
        })
    }

    // 5. Emploi à domicile
    // Crédit d'impôt de 50% des dépenses (plafonné à 12 000€/an + 1 500€ par enfant)
    const emploiMaxCredit = 12000 + (Math.max(0, familyQuotient - 1) * 1500)
    const emploiInvestment = Math.min(emploiMaxCredit, availableBudget, 15000)
    if (emploiInvestment >= 500) {
        const emploiCredit = emploiInvestment * 0.50
        const emploiSavings = Math.min(emploiCredit, baselineTax)
        const emploiNetBenefit = emploiSavings - emploiInvestment
        
        strategies.push({
            strategyName: 'Emploi à domicile',
            description: 'Crédit d\'impôt de 50% pour l\'emploi d\'un salarié à domicile (ménage, jardinage, garde d\'enfants)',
            investment: emploiInvestment,
            taxSavings: emploiSavings,
            netBenefit: emploiNetBenefit,
            roi: emploiInvestment > 0 ? emploiSavings / emploiInvestment : 0,
            implementation: [
                'Employer un salarié à domicile ou faire appel à un prestataire agréé',
                'Déclarer les dépenses via CESU ou PAJEMPLOI',
                `Effectuer des paiements pour ${emploiInvestment.toLocaleString('fr-FR')}€`,
                'Le crédit d\'impôt sera automatiquement calculé'
            ],
            constraints: [
                `Plafond : ${emploiMaxCredit.toLocaleString('fr-FR')}€/an`,
                'Services éligibles uniquement (ménage, jardinage, garde, etc.)',
                'Paiement par CESU ou virement',
                'Résidence principale ou secondaire'
            ]
        })
    }

    // Trier les stratégies par ROI décroissant
    strategies.sort((a, b) => b.roi - a.roi)

    const maxSavings = strategies.length > 0 ? Math.max(...strategies.map(s => s.taxSavings)) : 0
    const bestStrategy = strategies.length > 0 ? strategies[0].strategyName : ''
    const recommendation = strategies.length > 0 
        ? `Avec un budget de ${availableBudget.toLocaleString('fr-FR')}€, la stratégie "${bestStrategy}" offre le meilleur retour sur investissement avec ${(strategies[0].roi * 100).toFixed(0)}% de ROI. Vous pourriez économiser ${strategies[0].taxSavings.toLocaleString('fr-FR')}€ d'impôts.`
        : `Aucune stratégie n'est applicable avec votre budget actuel de ${availableBudget.toLocaleString('fr-FR')}€. Augmentez votre budget pour voir les options disponibles.`

    return {
        baselineTax,
        maxSavings,
        bestStrategy,
        recommendation,
        strategies
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAuth(request)

        const body = await request.json()
        const validatedData = taxCompareSchema.parse(body)

        const result = compareTaxStrategies(
            validatedData.income,
            validatedData.currentDeductions,
            validatedData.familyQuotient,
            validatedData.availableBudget
        )

        return createSuccessResponse(result)
    } catch (error) {
        console.error('Error in tax strategy comparison:', error)
        if (error instanceof z.ZodError) {
            return createErrorResponse('Validation error: ' + error.message, 400)
        }
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
        }
        return createErrorResponse('Internal server error', 500)
    }
}
