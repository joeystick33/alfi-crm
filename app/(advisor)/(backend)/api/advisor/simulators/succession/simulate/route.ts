 
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
const successionSimulationSchema = z.object({
    assets: z.array(
        z.object({
            id: z.string(),
            name: z.string().min(1),
            type: z.enum(['real_estate', 'financial', 'business', 'other']),
            value: z.number().min(0),
            debt: z.number().min(0).optional(),
        })
    ).min(1).max(50),
    heirs: z.array(
        z.object({
            id: z.string(),
            name: z.string().min(1),
            relationship: z.enum(['spouse', 'child', 'grandchild', 'great_grandchild', 'sibling', 'nephew_niece', 'other']),
            share: z.number().min(0).max(1),
            disabled: z.boolean().optional(),
            previousDonations: z.number().min(0).optional(),
        })
    ).min(1).max(20),
})

// French inheritance tax brackets and allowances (2026 — inchangé)
const ALLOWANCES: Record<string, number> = {
  spouse: 80724,
  child: 100000,
  grandchild: 31865,
  great_grandchild: 5310,
  sibling: 15932,
  nephew_niece: 7967,
  other: 1594
};

const TAX_BRACKETS: Record<string, Array<{ limit: number; rate: number }>> = {
  spouse: [
    { limit: Infinity, rate: 0 } // Spouse is exempt
  ],
  child: [
    { limit: 8072, rate: 0.05 },
    { limit: 12109, rate: 0.10 },
    { limit: 15932, rate: 0.15 },
    { limit: 552324, rate: 0.20 },
    { limit: 902838, rate: 0.30 },
    { limit: 1805677, rate: 0.40 },
    { limit: Infinity, rate: 0.45 }
  ],
  grandchild: [
    { limit: 8072, rate: 0.05 },
    { limit: 12109, rate: 0.10 },
    { limit: 15932, rate: 0.15 },
    { limit: 552324, rate: 0.20 },
    { limit: 902838, rate: 0.30 },
    { limit: 1805677, rate: 0.40 },
    { limit: Infinity, rate: 0.45 }
  ],
  great_grandchild: [
    { limit: 8072, rate: 0.05 },
    { limit: 12109, rate: 0.10 },
    { limit: 15932, rate: 0.15 },
    { limit: 552324, rate: 0.20 },
    { limit: 902838, rate: 0.30 },
    { limit: 1805677, rate: 0.40 },
    { limit: Infinity, rate: 0.45 }
  ],
  sibling: [
    { limit: 24430, rate: 0.35 },
    { limit: Infinity, rate: 0.45 }
  ],
  nephew_niece: [
    { limit: Infinity, rate: 0.55 }
  ],
  other: [
    { limit: Infinity, rate: 0.60 }
  ]
};

function calculateTax(taxableAmount: number, relationship: string): number {
  const brackets = TAX_BRACKETS[relationship] || TAX_BRACKETS.other;
  let tax = 0;
  let previousLimit = 0;

  for (const bracket of brackets) {
    const taxableInBracket = Math.min(taxableAmount, bracket.limit) - previousLimit;
    if (taxableInBracket <= 0) break;
    
    tax += taxableInBracket * bracket.rate;
    previousLimit = bracket.limit;
    
    if (taxableAmount <= bracket.limit) break;
  }

  return tax;
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request)

    const body = await request.json()
    const validatedData = successionSimulationSchema.parse(body)
    const { assets, heirs } = validatedData

    // Calculate gross estate value
    const grossEstate = assets.reduce((sum: any, asset: any) => {
      return sum + (asset.value - (asset.debt || 0));
    }, 0);

    // Calculate inheritance for each heir
    const heirResults = heirs.map(heir => {
      const grossInheritance = grossEstate * heir.share;
      const allowance = ALLOWANCES[heir.relationship] || ALLOWANCES.other;
      
      // Adjust allowance for previous donations
      const adjustedAllowance = Math.max(0, allowance - (heir.previousDonations || 0));
      
      // Calculate taxable amount
      const taxableAmount = Math.max(0, grossInheritance - adjustedAllowance);
      
      // Calculate tax
      const tax = calculateTax(taxableAmount, heir.relationship);
      
      // Calculate net inheritance
      const netInheritance = grossInheritance - tax;

      return {
        id: heir.id,
        name: heir.name,
        relationship: heir.relationship,
        share: heir.share,
        grossInheritance,
        allowance: adjustedAllowance,
        taxableAmount,
        tax,
        netInheritance
      };
    });

    // Calculate totals
    const totalTax = heirResults.reduce((sum: any, heir: any) => sum + heir.tax, 0);
    const netEstate = grossEstate - totalTax;
    const effectiveTaxRate = grossEstate > 0 ? totalTax / grossEstate : 0;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (effectiveTaxRate > 0.30) {
      recommendations.push('Taux de taxation élevé - envisagez des donations anticipées pour réduire les droits');
    }
    
    if (heirs.some(h => h.relationship === 'child' && (h.previousDonations || 0) === 0)) {
      recommendations.push('Utilisez les abattements de 100 000€ par enfant tous les 15 ans via des donations');
    }
    
    if (heirs.some(h => ['nephew_niece', 'other'].includes(h.relationship))) {
      recommendations.push('Taux de taxation très élevé pour les héritiers éloignés - envisagez l\'assurance-vie');
    }
    
    if (grossEstate > 1000000) {
      recommendations.push('Patrimoine important - consultez un notaire pour optimiser la transmission');
    }

    return createSuccessResponse({
      simulation: {
        grossEstate,
        totalTax,
        netEstate,
        effectiveTaxRate,
        heirs: heirResults,
        recommendations
      }
    })
  } catch (error: any) {
    logger.error('Error in succession simulation:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error: ' + error.message, 400)
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
