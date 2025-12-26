 
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'

const taxProjectionSchema = z.object({
    currentIncome: z.number().positive('Le revenu doit être positif'),
    incomeGrowthRate: z.number().min(-0.1).max(0.2, 'Le taux de croissance doit être entre -10% et 20%'),
    currentDeductions: z.number().min(0, 'Les déductions doivent être positives'),
    yearsToProject: z.number().int().min(1).max(50, 'Le nombre d\'années doit être entre 1 et 50'),
    familyQuotient: z.number().min(1).max(10, 'Le quotient familial doit être entre 1 et 10'),
    currentAge: z.number().int().min(18).max(100).optional(),
})

/**
 * Barème progressif de l'impôt sur le revenu 2024
 * Taux appliqué par tranche de revenu imposable (après quotient familial)
 */
const TAX_BRACKETS_2024 = [
    { limit: 11294, rate: 0 },      // 0% jusqu'à 11 294€
    { limit: 28797, rate: 0.11 },   // 11% de 11 294€ à 28 797€
    { limit: 82341, rate: 0.30 },   // 30% de 28 797€ à 82 341€
    { limit: 177106, rate: 0.41 },  // 41% de 82 341€ à 177 106€
    { limit: Infinity, rate: 0.45 } // 45% au-delà de 177 106€
]

/**
 * Taux des prélèvements sociaux sur les revenus d'activité
 */
const SOCIAL_CONTRIBUTIONS_RATE = 0.172 // 17.2% (CSG + CRDS + autres)

interface YearProjection {
    year: number
    age?: number
    income: number
    deductions: number
    taxableIncome: number
    incomeTax: number
    socialContributions: number
    totalTax: number
    netIncome: number
    effectiveRate: number
    marginalRate: number
}

/**
 * Calcule l'impôt sur le revenu selon le barème progressif
 * @param taxableIncome Revenu imposable après déductions
 * @param familyQuotient Nombre de parts fiscales
 * @returns Montant de l'impôt sur le revenu
 */
function calculateIncomeTax(taxableIncome: number, familyQuotient: number): { tax: number; marginalRate: number } {
    // Revenu imposable par part
    const incomePerPart = taxableIncome / familyQuotient
    
    let tax = 0
    let previousLimit = 0
    let marginalRate = 0

    for (const bracket of TAX_BRACKETS_2024) {
        if (incomePerPart > previousLimit) {
            const taxableInBracket = Math.min(incomePerPart, bracket.limit) - previousLimit
            tax += taxableInBracket * bracket.rate
            marginalRate = bracket.rate
        }
        previousLimit = bracket.limit
        if (incomePerPart <= bracket.limit) break
    }

    // Multiplier par le nombre de parts pour obtenir l'impôt total du foyer
    const totalTax = tax * familyQuotient

    return { tax: Math.max(0, totalTax), marginalRate }
}

/**
 * Projette les impôts sur plusieurs années avec croissance des revenus
 */
function projectTaxes(
    currentIncome: number,
    incomeGrowthRate: number,
    currentDeductions: number,
    yearsToProject: number,
    familyQuotient: number,
    currentAge?: number
): {
    projections: YearProjection[]
    summary: string
    totalTaxOverPeriod: number
    totalIncomeOverPeriod: number
    averageAnnualTax: number
    averageEffectiveRate: number
    input: any
} {
    const projections: YearProjection[] = []
    let totalTaxOverPeriod = 0
    let totalIncomeOverPeriod = 0

    const currentYear = new Date().getFullYear()

    for (let i = 0; i < yearsToProject; i++) {
        const year = currentYear + i
        const age = currentAge ? currentAge + i : undefined

        // Calcul du revenu avec croissance
        const income = currentIncome * Math.pow(1 + incomeGrowthRate, i)
        
        // Déductions (croissance au même rythme que le revenu)
        const deductions = currentDeductions * Math.pow(1 + incomeGrowthRate, i)
        
        // Revenu imposable
        const taxableIncome = Math.max(0, income - deductions)
        
        // Calcul de l'impôt sur le revenu
        const { tax: incomeTax, marginalRate } = calculateIncomeTax(taxableIncome, familyQuotient)
        
        // Prélèvements sociaux (calculés sur le revenu brut pour les revenus d'activité)
        // Pour une simulation simplifiée, on applique le taux sur le revenu imposable
        const socialContributions = taxableIncome * SOCIAL_CONTRIBUTIONS_RATE
        
        // Total des impôts et contributions
        const totalTax = incomeTax + socialContributions
        
        // Revenu net après impôts
        const netIncome = income - totalTax
        
        // Taux effectif d'imposition
        const effectiveRate = income > 0 ? (totalTax / income) * 100 : 0

        projections.push({
            year,
            age,
            income,
            deductions,
            taxableIncome,
            incomeTax,
            socialContributions,
            totalTax,
            netIncome,
            effectiveRate,
            marginalRate: marginalRate * 100,
        })

        totalTaxOverPeriod += totalTax
        totalIncomeOverPeriod += income
    }

    const averageAnnualTax = totalTaxOverPeriod / yearsToProject
    const averageEffectiveRate = totalIncomeOverPeriod > 0 
        ? (totalTaxOverPeriod / totalIncomeOverPeriod) * 100 
        : 0

    // Génération du résumé
    const firstYear = projections[0]
    const lastYear = projections[projections.length - 1]
    const growthPercent = ((lastYear.income - firstYear.income) / firstYear.income) * 100
    
    const summary = `Sur ${yearsToProject} ans, votre revenu passera de ${Math.round(firstYear.income).toLocaleString('fr-FR')}€ à ${Math.round(lastYear.income).toLocaleString('fr-FR')}€ (+${growthPercent.toFixed(1)}%). Vos impôts totaux s'élèveront à ${Math.round(totalTaxOverPeriod).toLocaleString('fr-FR')}€, soit un taux effectif moyen de ${averageEffectiveRate.toFixed(1)}%.`

    return {
        projections,
        summary,
        totalTaxOverPeriod,
        totalIncomeOverPeriod,
        averageAnnualTax,
        averageEffectiveRate,
        input: {
            currentIncome,
            incomeGrowthRate,
            currentDeductions,
            yearsToProject,
            familyQuotient,
            currentAge,
        },
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAuth(request)

        const body = await request.json()
        const validatedData = taxProjectionSchema.parse(body)

        const result = projectTaxes(
            validatedData.currentIncome,
            validatedData.incomeGrowthRate,
            validatedData.currentDeductions,
            validatedData.yearsToProject,
            validatedData.familyQuotient,
            validatedData.currentAge
        )

        return createSuccessResponse(result)
    } catch (error: any) {
        console.error('Error in tax projection:', error)
        if (error instanceof z.ZodError) {
            return createErrorResponse('Validation error: ' + error.message, 400)
        }
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
        }
        return createErrorResponse('Internal server error', 500)
    }
}
