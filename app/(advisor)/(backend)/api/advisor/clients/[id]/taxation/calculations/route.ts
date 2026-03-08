/**
 * API Route: /api/advisor/clients/[id]/taxation/calculations
 * Calculs fiscaux (IR, IFI, PS) + détection optimisations
 * Next.js 15 App Router - Route Handlers
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/app/_common/lib/auth-helpers'
import { getPrismaClient } from '@/app/_common/lib/prisma'
import {
  calculateIncomeTax,
  calculateTaxShares,
  calculateIFI,
  calculateSocialContributions,
  detectTaxOptimizations,
} from '@/app/_common/lib/services/tax-service'
import { z } from 'zod'
import { logger } from '@/app/_common/lib/logger'
// ============================================================================
// Schema validation pour le POST
// ============================================================================

const calculationsRequestSchema = z.object({
  // Pour calcul IR
  fiscalReferenceIncome: z.number().min(0).optional(),
  maritalStatus: z.string().optional(),
  numberOfChildren: z.number().int().min(0).optional(),
  dependents: z.number().int().min(0).optional(),

  // Pour calcul IFI
  netTaxableWealth: z.number().min(0).optional(),

  // Pour calcul PS
  taxableAssetIncome: z.number().min(0).optional(),

  // Pour détection optimisations
  annualIncome: z.number().min(0).optional(),
  taxBracket: z.number().int().min(0).max(45).optional(),
  realEstateAssets: z.number().min(0).optional(),
  financialAssets: z.number().min(0).optional(),
  age: z.number().int().min(0).optional(),
  hasChildren: z.boolean().optional(),
})

// ============================================================================
// POST /api/advisor/clients/[id]/taxation/calculations
// Effectue les calculs fiscaux et retourne les résultats
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentification requise
    const context = await requireAuth(request)
    const { id } = await params
    const prisma = getPrismaClient(context.cabinetId, context.isSuperAdmin)

    // Vérifier que le client existe et appartient au cabinet
    const client = await prisma.client.findFirst({
      where: {
        id,
        cabinetId: context.cabinetId,
      },
      select: {
        id: true,
        maritalStatus: true,
        numberOfChildren: true,
        annualIncome: true,
        taxBracket: true,
        dependents: true,
      },
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found', code: 'CLIENT_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Parser et valider le body
    const body = await request.json()
    const validated = calculationsRequestSchema.parse(body)

    // === CALCUL IMPÔT SUR LE REVENU ===

    let incomeTaxResult = null

    if (validated.fiscalReferenceIncome !== undefined) {
      // Calculer le nombre de parts
      const taxShares = calculateTaxShares(
        validated.maritalStatus || client.maritalStatus || 'SINGLE',
        validated.numberOfChildren ?? client.numberOfChildren ?? 0,
        validated.dependents ?? client.dependents ?? 0
      )

      // Calculer l'IR
      const irCalc = calculateIncomeTax(
        validated.fiscalReferenceIncome,
        taxShares
      )

      incomeTaxResult = {
        fiscalReferenceIncome: validated.fiscalReferenceIncome,
        taxShares,
        quotientFamilial: irCalc.quotientFamilial,
        taxBracket: irCalc.taxBracket,
        grossTax: irCalc.grossTax,
        decote: irCalc.decote,
        annualAmount: irCalc.netTax,
        monthlyPayment: Math.round(irCalc.netTax / 12),
        effectiveRate: irCalc.effectiveRate,
        taxCredits: 0, // À renseigner manuellement
        taxReductions: 0, // À renseigner manuellement
      }
    }

    // === CALCUL IFI ===

    let ifiResult = null

    if (validated.netTaxableWealth !== undefined) {
      const ifiCalc = calculateIFI(validated.netTaxableWealth)

      ifiResult = {
        taxableRealEstateAssets: validated.netTaxableWealth,
        deductibleLiabilities: 0, // À calculer séparément
        netTaxableIFI: validated.netTaxableWealth,
        ifiAmount: ifiCalc.ifiAmount,
        bracket: ifiCalc.bracket,
        threshold: 1300000,
        isSubjectToIFI: ifiCalc.isSubjectToIFI,
        distanceFromThreshold: ifiCalc.distanceFromThreshold,
      }
    }

    // === CALCUL PRÉLÈVEMENTS SOCIAUX ===

    let socialContributionsResult = null

    if (validated.taxableAssetIncome !== undefined) {
      const psAmount = calculateSocialContributions(
        validated.taxableAssetIncome
      )

      socialContributionsResult = {
        taxableAssetIncome: validated.taxableAssetIncome,
        rate: 0.172,
        amount: psAmount,
      }
    }

    // === DÉTECTION OPTIMISATIONS FISCALES ===

    const optimizations = detectTaxOptimizations({
      annualIncome: validated.annualIncome ?? Number(client.annualIncome ?? 0),
      taxBracket:
        validated.taxBracket ??
        (client.taxBracket ? parseInt(client.taxBracket) : 0),
      netWealth: validated.netTaxableWealth,
      ifiAmount: ifiResult?.ifiAmount,
      realEstateAssets: validated.realEstateAssets,
      financialAssets: validated.financialAssets,
      age: validated.age,
      hasChildren: validated.hasChildren ?? (client.numberOfChildren ?? 0) > 0,
      numberOfChildren: validated.numberOfChildren ?? client.numberOfChildren,
    })

    return NextResponse.json(
      {
        data: {
          incomeTax: incomeTaxResult,
          ifi: ifiResult,
          socialContributions: socialContributionsResult,
          optimizations,
          calculations: {
            timestamp: new Date().toISOString(),
            anneeFiscale: new Date().getFullYear(),
          },
        },
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error(
      'POST /api/advisor/clients/[id]/taxation/calculations error:',
      error
    )

    // Erreur de validation Zod
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          code: 'VALIDATION_ERROR',
          details: error.issues,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
      { status: 500 }
    )
  }
}
