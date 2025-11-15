import { NextRequest, NextResponse } from 'next/server';
import { ObjectiveCalculator } from '@/lib/services/calculators/objective-calculator';

/**
 * POST /api/calculators/objectives/single
 * Calculate required contributions for a single financial objective
 * 
 * Requirements: 3.1, 3.2, 3.3, 9.1
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      objectiveName,
      targetAmount,
      currentAmount = 0,
      timeHorizon,
      expectedReturn = 5,
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

    if (expectedReturn < 0 || expectedReturn > 20) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Le rendement attendu doit être entre 0% et 20%' },
        { status: 400 }
      );
    }

    // Calculate objective
    const result = ObjectiveCalculator.calculateObjective(
      objectiveName,
      targetAmount,
      currentAmount,
      timeHorizon,
      expectedReturn / 100 // Convert percentage to decimal
    );

    return NextResponse.json({
      success: true,
      data: result,
      clientId
    });

  } catch (error) {
    console.error('Error calculating single objective:', error);
    return NextResponse.json(
      { 
        error: 'Calculation Error', 
        message: error instanceof Error ? error.message : 'Erreur lors du calcul de l\'objectif'
      },
      { status: 500 }
    );
  }
}
