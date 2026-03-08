import { NextRequest, NextResponse } from 'next/server';
import { ObjectiveCalculator } from '@/app/_common/lib/services/calculators/objective-calculator';
import { logger } from '@/app/_common/lib/logger'
/**
 * POST /api/calculators/objectives/home-purchase
 * Calculate home purchase savings plan with price appreciation
 * 
 * Requirements: 3.5, 9.5
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      targetPrice,
      downPaymentPercent = 20,
      currentSavings = 0,
      timeHorizon,
      priceAppreciation = 2,
      closingCostsPercent = 8,
      clientId
    } = body;

    // Validation
    if (!targetPrice || targetPrice <= 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Le prix cible doit être supérieur à 0' },
        { status: 400 }
      );
    }

    if (downPaymentPercent < 0 || downPaymentPercent > 100) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Le pourcentage d\'apport doit être entre 0% et 100%' },
        { status: 400 }
      );
    }

    if (currentSavings < 0) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'L\'épargne actuelle ne peut pas être négative' },
        { status: 400 }
      );
    }

    if (!timeHorizon || timeHorizon <= 0 || timeHorizon > 30) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'L\'horizon temporel doit être entre 1 et 30 ans' },
        { status: 400 }
      );
    }

    if (priceAppreciation < -5 || priceAppreciation > 10) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'L\'appréciation du prix doit être entre -5% et 10%' },
        { status: 400 }
      );
    }

    if (closingCostsPercent < 0 || closingCostsPercent > 100) {
      return NextResponse.json(
        { error: 'Validation Error', message: 'Les frais de notaire doivent être entre 0% et 100%' },
        { status: 400 }
      );
    }

    // Calculate home purchase plan
    const result = ObjectiveCalculator.calculateHomePurchase(
      targetPrice,
      downPaymentPercent / 100, // Convert percentage to decimal
      currentSavings,
      timeHorizon,
      priceAppreciation / 100, // Convert percentage to decimal
      closingCostsPercent / 100 // Convert percentage to decimal
    );

    return NextResponse.json({
      success: true,
      data: result,
      clientId
    });

  } catch (error) {
    logger.error('Error calculating home purchase:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { 
        error: 'Calculation Error', 
        message: error instanceof Error ? error.message : 'Erreur lors du calcul de l\'achat immobilier'
      },
      { status: 500 }
    );
  }
}
