import { NextRequest, NextResponse } from 'next/server';
import { TaxCalculator } from '@/lib/services/calculators/tax-calculator';

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

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Income tax calculation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate income tax',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
