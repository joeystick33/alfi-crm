import { NextRequest, NextResponse } from 'next/server';

// French inheritance tax brackets and allowances (2024)
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
    { limit: Infinity, rate: 0 }
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
    const body = await request.json();
    const { estateValue, heirs } = body;

    // Validate input
    if (!estateValue || estateValue <= 0) {
      return NextResponse.json(
        { error: 'Valeur du patrimoine invalide' },
        { status: 400 }
      );
    }

    if (!heirs || !Array.isArray(heirs) || heirs.length === 0) {
      return NextResponse.json(
        { error: 'Les héritiers sont requis' },
        { status: 400 }
      );
    }

    const strategies = [];

    // Strategy 1: Direct Inheritance (baseline)
    let directInheritanceTax = 0;
    heirs.forEach(heir => {
      const inheritance = estateValue * heir.share;
      const allowance = ALLOWANCES[heir.relationship] || ALLOWANCES.other;
      const adjustedAllowance = Math.max(0, allowance - (heir.previousDonations || 0));
      const taxableAmount = Math.max(0, inheritance - adjustedAllowance);
      directInheritanceTax += calculateTax(taxableAmount, heir.relationship);
    });

    strategies.push({
      name: 'Succession directe',
      description: 'Transmission au décès sans optimisation',
      totalTax: directInheritanceTax,
      netEstate: estateValue - directInheritanceTax,
      effectiveTaxRate: directInheritanceTax / estateValue,
      taxSavings: 0,
      details: [
        'Aucune planification préalable',
        'Utilisation des abattements disponibles au moment du décès',
        'Pas d\'optimisation fiscale'
      ]
    });

    // Strategy 2: Anticipated Donations (every 15 years)
    // Assume 2 donation periods
    const numberOfDonations = 2;
    let donationTax = 0;
    
    heirs.forEach(heir => {
      const totalInheritance = estateValue * heir.share;
      const donationPerPeriod = totalInheritance / numberOfDonations;
      const allowance = ALLOWANCES[heir.relationship] || ALLOWANCES.other;
      
      // Each donation period gets full allowance
      for (let i = 0; i < numberOfDonations; i++) {
        const previousDonationsInPeriod = i === 0 ? (heir.previousDonations || 0) : 0;
        const adjustedAllowance = Math.max(0, allowance - previousDonationsInPeriod);
        const taxableAmount = Math.max(0, donationPerPeriod - adjustedAllowance);
        donationTax += calculateTax(taxableAmount, heir.relationship);
      }
    });

    strategies.push({
      name: 'Donations anticipées',
      description: 'Donations tous les 15 ans pour renouveler les abattements',
      totalTax: donationTax,
      netEstate: estateValue - donationTax,
      effectiveTaxRate: donationTax / estateValue,
      taxSavings: directInheritanceTax - donationTax,
      details: [
        `${numberOfDonations} donations espacées de 15 ans`,
        'Renouvellement des abattements à chaque période',
        'Réduction significative des droits'
      ]
    });

    // Strategy 3: Dismemberment (usufruit/nue-propriété)
    // Simplified: assume 30% discount on bare ownership
    const bareOwnershipValue = estateValue * 0.70;
    let dismembermentTax = 0;
    
    heirs.forEach(heir => {
      const inheritance = bareOwnershipValue * heir.share;
      const allowance = ALLOWANCES[heir.relationship] || ALLOWANCES.other;
      const adjustedAllowance = Math.max(0, allowance - (heir.previousDonations || 0));
      const taxableAmount = Math.max(0, inheritance - adjustedAllowance);
      dismembermentTax += calculateTax(taxableAmount, heir.relationship);
    });

    strategies.push({
      name: 'Démembrement de propriété',
      description: 'Donation de la nue-propriété avec conservation de l\'usufruit',
      totalTax: dismembermentTax,
      netEstate: estateValue - dismembermentTax,
      effectiveTaxRate: dismembermentTax / estateValue,
      taxSavings: directInheritanceTax - dismembermentTax,
      details: [
        'Donation de la nue-propriété (70% de la valeur)',
        'Conservation de l\'usufruit par le donateur',
        'Réunion automatique au décès sans droits supplémentaires'
      ]
    });

    // Strategy 4: Life Insurance
    // Assume 152,500€ allowance per beneficiary for life insurance
    const lifeInsuranceAllowance = 152500;
    let lifeInsuranceTax = 0;
    
    heirs.forEach(heir => {
      const inheritance = estateValue * heir.share;
      const taxableAmount = Math.max(0, inheritance - lifeInsuranceAllowance);
      // Life insurance has favorable tax rates
      const lifeInsuranceRate = taxableAmount <= 700000 ? 0.20 : 0.31;
      lifeInsuranceTax += taxableAmount * lifeInsuranceRate;
    });

    strategies.push({
      name: 'Assurance-vie',
      description: 'Transmission via contrats d\'assurance-vie',
      totalTax: lifeInsuranceTax,
      netEstate: estateValue - lifeInsuranceTax,
      effectiveTaxRate: lifeInsuranceTax / estateValue,
      taxSavings: directInheritanceTax - lifeInsuranceTax,
      details: [
        'Abattement de 152 500€ par bénéficiaire',
        'Taux réduits : 20% jusqu\'à 700 000€, puis 31%',
        'Hors succession, transmission directe aux bénéficiaires'
      ]
    });

    // Find best strategy
    const bestStrategy = strategies.reduce((best, current) => 
      current.totalTax < best.totalTax ? current : best
    );

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (bestStrategy.name !== 'Succession directe') {
      recommendations.push(`La stratégie "${bestStrategy.name}" permet d'économiser ${Math.round(bestStrategy.taxSavings).toLocaleString('fr-FR')}€`);
    }
    
    if (estateValue > 500000) {
      recommendations.push('Patrimoine important : combinez plusieurs stratégies pour optimiser');
    }
    
    if (heirs.some(h => h.relationship === 'child')) {
      recommendations.push('Utilisez les donations anticipées pour les enfants (abattement de 100 000€ renouvelable)');
    }
    
    recommendations.push('Consultez un notaire pour mettre en place la stratégie optimale');

    const summary = `La meilleure stratégie est "${bestStrategy.name}" avec une économie de ${Math.round(bestStrategy.taxSavings).toLocaleString('fr-FR')}€ par rapport à une succession directe.`;

    const comparison = {
      strategies,
      bestStrategy,
      recommendations,
      summary
    };

    return NextResponse.json({ comparison });
  } catch (error: any) {
    console.error('Error in succession comparison:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la comparaison' },
      { status: 500 }
    );
  }
}
