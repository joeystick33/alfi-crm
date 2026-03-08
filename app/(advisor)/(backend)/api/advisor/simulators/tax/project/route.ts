 
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
import { RULES } from '@/app/_common/lib/rules/fiscal-rules'
const taxProjectionSchema = z.object({
    currentIncome: z.number().positive('Le revenu doit être positif'),
    incomeGrowthRate: z.number().min(-0.1).max(0.2, 'Le taux de croissance doit être entre -10% et 20%'),
    currentDeductions: z.number().min(0, 'Les déductions doivent être positives'),
    yearsToProject: z.number().int().min(1).max(50, 'Le nombre d\'années doit être entre 1 et 50'),
    familyQuotient: z.number().min(1).max(10, 'Le quotient familial doit être entre 1 et 10'),
    currentAge: z.number().int().min(18).max(100).optional(),
})

/**
 * Barème progressif de l'impôt sur le revenu 2026 (revenus 2025)
 * LF2026 art. 2 ter — Revalorisation +0,9%
 */
const TAX_BRACKETS_2024 = RULES.ir.bareme.map(t => ({
    limit: t.max,
    rate: t.taux,
}))

/**
 * Taux des prélèvements sociaux 2026 — LFSS 2026 : système dual
 * 18,6% sur revenus financiers (dividendes, PV mobilières, LMNP/BIC, PEA)
 * 17,2% INCHANGÉ sur revenus fonciers, PV immobilières, assurance-vie
 * Ici : taux financier par défaut (projection patrimoine financier)
 */
const SOCIAL_CONTRIBUTIONS_RATE = RULES.ps.pfu_per_2026 // PS revenus financiers

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
        logger.error('Error in tax projection:', { error: error instanceof Error ? error.message : String(error) })
        if (error instanceof z.ZodError) {
            return createErrorResponse('Validation error: ' + error.message, 400)
        }
        if (error instanceof Error && error.message === 'Unauthorized') {
            return createErrorResponse('Unauthorized', 401)
        }
        return createErrorResponse('Internal server error', 500)
    }
}
