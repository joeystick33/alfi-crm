import { NextRequest, NextResponse } from 'next/server';
import { ObjectiveCalculator } from '@/app/_common/lib/services/calculators/objective-calculator';

/**
 * POST /api/calculators/objectives/multiple
 * Calculate allocation for multiple financial objectives with priorities
 * 
 * Requirements: 3.2, 3.3, 9.1, 9.2, 9.3, 9.5
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      objectives,
      totalMonthlyBudget,
      expectedReturn = 5,
      clientId
    } = body;

    // Validation
    if (!objectives || !Array.isArray(objectives) || objectives.length === 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Au moins un objectif est requis' },
        { status: 400 }
      );
    }

    if (!totalMonthlyBudget || totalMonthlyBudget <= 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Le budget mensuel total doit être supérieur à 0' },
        { status: 400 }
      );
    }

    if (expectedReturn < 0 || expectedReturn > 20) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Le rendement attendu doit être entre 0% et 20%' },
        { status: 400 }
      );
    }

    // Validate each objective
    for (let i = 0; i < objectives.length; i++) {
      const obj = objectives[i];
      
      if (!obj.name || typeof obj.name !== 'string') {
        return NextResponse.json(
          { error: 'Validation Error', message: `L'objectif ${i + 1} doit avoir un nom` },
          { status: 400 }
        );
      }

      if (!obj.targetAmount || obj.targetAmount <= 0) {
        return NextResponse.json(
          { error: 'Validation Error', message: `Le montant cible de l'objectif "${obj.name}" doit être supérieur à 0` },
          { status: 400 }
        );
      }

      if (obj.currentAmount && obj.currentAmount < 0) {
        return NextResponse.json(
          { error: 'Validation Error', message: `Le montant actuel de l'objectif "${obj.name}" ne peut pas être négatif` },
          { status: 400 }
        );
      }

      if (!obj.timeHorizon || obj.timeHorizon <= 0 || obj.timeHorizon > 50) {
        return NextResponse.json(
          { error: 'Validation Error', message: `L'horizon temporel de l'objectif "${obj.name}" doit être entre 1 et 50 ans` },
          { status: 400 }
        );
      }

      if (!obj.priority || !['high', 'medium', 'low'].includes(obj.priority)) {
        return NextResponse.json(
          { error: 'Validation Error', message: `La priorité de l'objectif "${obj.name}" doit être high, medium ou low` },
          { status: 400 }
        );
      }
    }

    // Calculate multiple objectives allocation
    const result = ObjectiveCalculator.calculateMultipleObjectives(
      objectives,
      totalMonthlyBudget,
      expectedReturn / 100 // Convert percentage to decimal
    );

    return NextResponse.json({
      success: true,
      data: result,
      clientId
    });

  } catch (error) {
    console.error('Error calculating multiple objectives:', error);
    return NextResponse.json(
      { 
        error: 'Calculation Error', 
        message: error instanceof Error ? error.message : 'Erreur lors du calcul des objectifs multiples'
      },
      { status: 500 }
    );
  }
}
