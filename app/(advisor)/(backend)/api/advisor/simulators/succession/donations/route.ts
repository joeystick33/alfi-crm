 
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth, createErrorResponse, createSuccessResponse } from '@/app/_common/lib/auth-helpers'
import { logger } from '@/app/_common/lib/logger'
const donationOptimizationSchema = z.object({
    donorAge: z.number().int().min(18).max(100),
    totalWealth: z.number().positive('Le patrimoine doit être positif'),
    targetAge: z.number().int().min(18).max(120),
    beneficiaries: z.array(
        z.object({
            id: z.string(),
            name: z.string().min(1),
            relationship: z.enum(['spouse', 'child', 'grandchild', 'great_grandchild', 'sibling', 'nephew_niece', 'other']),
            share: z.number().min(0).max(1),
            previousDonations: z.number().min(0).optional(),
        })
    ).min(1).max(20),
})

// French donation tax brackets and allowances (2026 — inchangé)
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
    const validatedData = donationOptimizationSchema.parse(body)
    const { donorAge, totalWealth, targetAge, beneficiaries } = validatedData

    // Additional validation
    if (targetAge <= donorAge) {
      return createErrorResponse('Âge cible doit être supérieur à l\'âge du donateur', 400)
    }

    // Calculate optimal donation schedule
    const yearsToTarget = targetAge - donorAge;
    const allowanceRenewalPeriod = 15; // years
    
    // Calculate number of donation periods (every 15 years)
    const numberOfDonations = Math.floor(yearsToTarget / allowanceRenewalPeriod) + 1;
    
    // Calculate donation schedule
    const donationSchedule = [];
    let cumulativeTaxSavings = 0;
    
    for (let i = 0; i < numberOfDonations; i++) {
      const year = new Date().getFullYear() + (i * allowanceRenewalPeriod);
      const donorAgeAtDonation = donorAge + (i * allowanceRenewalPeriod);
      
      // Calculate donation amount per period
      const donationAmount = totalWealth / numberOfDonations;
      
      // Calculate tax for each beneficiary
      let totalDonationTax = 0;
      let totalWithoutDonation = 0;
      
      beneficiaries.forEach(beneficiary => {
        const beneficiaryDonation = donationAmount * beneficiary.share;
        const allowance = ALLOWANCES[beneficiary.relationship] || ALLOWANCES.other;
        
        // Adjust for previous donations (only within the same 15-year period)
        const previousDonationsInPeriod = i === 0 ? (beneficiary.previousDonations || 0) : 0;
        const adjustedAllowance = Math.max(0, allowance - previousDonationsInPeriod);
        
        // Calculate taxable amount
        const taxableAmount = Math.max(0, beneficiaryDonation - adjustedAllowance);
        
        // Calculate tax with donation
        const taxWithDonation = calculateTax(taxableAmount, beneficiary.relationship);
        totalDonationTax += taxWithDonation;
        
        // Calculate tax without donation (as inheritance)
        const taxWithoutDonation = calculateTax(
          Math.max(0, beneficiaryDonation - adjustedAllowance),
          beneficiary.relationship
        );
        totalWithoutDonation += taxWithoutDonation;
      });
      
      const taxSavings = totalWithoutDonation - totalDonationTax;
      cumulativeTaxSavings += taxSavings;
      
      donationSchedule.push({
        year,
        donorAge: donorAgeAtDonation,
        totalDonationAmount: donationAmount,
        totalTax: totalDonationTax,
        taxSavings,
        cumulativeTaxSavings
      });
    }

    // Calculate beneficiary breakdown
    const beneficiaryBreakdown = beneficiaries.map(beneficiary => {
      const totalDonations = totalWealth * beneficiary.share;
      let totalTax = 0;
      
      // Calculate tax for each donation period
      for (let i = 0; i < numberOfDonations; i++) {
        const donationAmount = totalDonations / numberOfDonations;
        const allowance = ALLOWANCES[beneficiary.relationship] || ALLOWANCES.other;
        const previousDonationsInPeriod = i === 0 ? (beneficiary.previousDonations || 0) : 0;
        const adjustedAllowance = Math.max(0, allowance - previousDonationsInPeriod);
        const taxableAmount = Math.max(0, donationAmount - adjustedAllowance);
        totalTax += calculateTax(taxableAmount, beneficiary.relationship);
      }
      
      return {
        id: beneficiary.id,
        name: beneficiary.name,
        relationship: beneficiary.relationship,
        totalDonations,
        totalTax,
        netReceived: totalDonations - totalTax
      };
    });

    // Calculate totals
    const totalDonations = totalWealth;
    const totalDonationTax = beneficiaryBreakdown.reduce((sum: any, b: any) => sum + b.totalTax, 0);
    
    // Calculate tax if transmitted as inheritance (without donations)
    let totalInheritanceTax = 0;
    beneficiaries.forEach(beneficiary => {
      const inheritance = totalWealth * beneficiary.share;
      const allowance = ALLOWANCES[beneficiary.relationship] || ALLOWANCES.other;
      const adjustedAllowance = Math.max(0, allowance - (beneficiary.previousDonations || 0));
      const taxableAmount = Math.max(0, inheritance - adjustedAllowance);
      totalInheritanceTax += calculateTax(taxableAmount, beneficiary.relationship);
    });
    
    const totalTaxSavings = totalInheritanceTax - totalDonationTax;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (numberOfDonations > 1) {
      recommendations.push(`Effectuez ${numberOfDonations} donations espacées de 15 ans pour maximiser les abattements`);
    }
    
    if (totalTaxSavings > 0) {
      recommendations.push(`Économie fiscale de ${Math.round(totalTaxSavings).toLocaleString('fr-FR')}€ par rapport à une succession directe`);
    }
    
    if (donorAge < 70) {
      recommendations.push('Commencez les donations tôt pour bénéficier de plusieurs renouvellements d\'abattements');
    }
    
    recommendations.push('Consultez un notaire pour formaliser les donations et optimiser la stratégie');

    const strategy = numberOfDonations > 1
      ? `Stratégie optimale : ${numberOfDonations} donations espacées de 15 ans pour renouveler les abattements et minimiser les droits`
      : 'Stratégie : donation unique avec utilisation des abattements disponibles';

    return createSuccessResponse({
      optimization: {
        totalDonations,
        totalDonationTax,
        totalTaxSavings,
        numberOfDonations,
        donationSchedule,
        beneficiaryBreakdown,
        strategy,
        recommendations
      }
    })
  } catch (error: any) {
    logger.error('Error in donation optimization:', { error: error instanceof Error ? error.message : String(error) })
    if (error instanceof z.ZodError) {
      return createErrorResponse('Validation error: ' + error.message, 400)
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return createErrorResponse('Unauthorized', 401)
    }
    return createErrorResponse('Internal server error', 500)
  }
}
