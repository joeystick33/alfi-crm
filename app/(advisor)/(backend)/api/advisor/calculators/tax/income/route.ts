import { NextRequest, NextResponse } from 'next/server';
import { TaxCalculator } from '@/app/_common/lib/services/calculators/tax-calculator';
import { logger } from '@/app/_common/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { grossIncome, deductions = 0, familyQuotient = 1, year = 2024 } = body;

    // Validation
    if (typeof grossIncome !== 'number' || grossIncome < 0) {
      return NextResponse.json(
        { error: 'Gross income must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof deductions !== 'number' || deductions < 0) {
      return NextResponse.json(
        { error: 'Deductions must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof familyQuotient !== 'number' || familyQuotient < 1) {
      return NextResponse.json(
        { error: 'Family quotient must be at least 1' },
        { status: 400 }
      );
    }

    // Calculate income tax
    const result = TaxCalculator.calculateIncomeTax(
      grossIncome,
      deductions,
      familyQuotient,
      year
    );

    // Enrichir avec TMI formatée
    const tmi = `${(result.marginalRate * 100).toFixed(0)}%`;

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        tmi, // Tranche Marginale d'Imposition formatée (ex: "30%")
      }
    });
  } catch (error) {
    logger.error('Income tax calculation error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { 
        error: 'Failed to calculate income tax',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
