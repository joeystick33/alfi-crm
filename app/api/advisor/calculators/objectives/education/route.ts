import { NextRequest, NextResponse } from 'next/server';
import { ObjectiveCalculator } from '@/lib/services/calculators/objective-calculator';

/**
 * POST /api/calculators/objectives/education
 * Calculate education funding plan with inflation adjustments
 * 
 * Requirements: 3.4, 3.5, 9.4
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      childAge,
      educationStartAge = 18,
      annualCost,
      educationDuration = 3,
      inflationRate = 2,
      currentSavings = 0,
      clientId
    } = body;

    // Validation
    if (childAge === undefined || childAge < 0 || childAge > 25) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'L\'âge de l\'enfant doit être entre 0 et 25 ans' },
        { status: 400 }
      );
    }

    if (!educationStartAge || educationStartAge < childAge || educationStartAge > 30) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'L\'âge de début des études doit être supérieur à l\'âge actuel et inférieur à 30 ans' },
        { status: 400 }
      );
    }

    if (!annualCost || annualCost <= 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Le coût annuel doit être supérieur à 0' },
        { status: 400 }
      );
    }

    if (!educationDuration || educationDuration <= 0 || educationDuration > 10) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'La durée des études doit être entre 1 et 10 ans' },
        { status: 400 }
      );
    }

    if (inflationRate < 0 || inflationRate > 10) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Le taux d\'inflation doit être entre 0% et 10%' },
        { status: 400 }
      );
    }

    if (currentSavings < 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'L\'épargne actuelle ne peut pas être négative' },
        { status: 400 }
      );
    }

    // Calculate education funding plan
    const result = ObjectiveCalculator.calculateEducationFunding(
      childAge,
      educationStartAge,
      annualCost,
      educationDuration,
      inflationRate / 100, // Convert percentage to decimal
      currentSavings
    );

    return NextResponse.json({
      success: true,
      data: result,
      clientId
    });

  } catch (error: any) {
    console.error('Error calculating education funding:', error);
    return NextResponse.json(
      { 
        error: 'Calculation Error', 
        message: error instanceof Error ? error.message : 'Erreur lors du calcul du financement des études'
      },
      { status: 500 }
    );
  }
}
