import { NextRequest, NextResponse } from 'next/server';
import { ObjectiveCalculator } from '@/app/_common/lib/services/calculators/objective-calculator';

/**
 * POST /api/calculators/objectives/optimize
 * Optimize financial goal with investment strategy recommendations
 * 
 * Requirements: 3.3, 9.2, 9.3
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      objectiveName,
      targetAmount,
      currentAmount = 0,
      timeHorizon,
      riskTolerance = 'medium',
      clientId
    } = body;

    // Validation
    if (!objectiveName || typeof objectiveName !== 'string') {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Le nom de l\'objectif est requis' },
        { status: 400 }
      );
    }

    if (!targetAmount || targetAmount <= 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Le montant cible doit être supérieur à 0' },
        { status: 400 }
      );
    }

    if (currentAmount < 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Le montant actuel ne peut pas être négatif' },
        { status: 400 }
      );
    }

    if (!timeHorizon || timeHorizon <= 0 || timeHorizon > 50) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'L\'horizon temporel doit être entre 1 et 50 ans' },
        { status: 400 }
      );
    }

    if (!['low', 'medium', 'high'].includes(riskTolerance)) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'La tolérance au risque doit être low, medium ou high' },
        { status: 400 }
      );
    }

    // Optimize objective with investment strategies
    const result = ObjectiveCalculator.optimizeObjective(
      objectiveName,
      targetAmount,
      currentAmount,
      timeHorizon,
      riskTolerance as 'low' | 'medium' | 'high'
    );

    return NextResponse.json({
      success: true,
      data: result,
      clientId
    });

  } catch (error) {
    console.error('Error optimizing objective:', error);
    return NextResponse.json(
      { 
        error: 'Calculation Error', 
        message: error instanceof Error ? error.message : 'Erreur lors de l\'optimisation de l\'objectif'
      },
      { status: 500 }
    );
  }
}
