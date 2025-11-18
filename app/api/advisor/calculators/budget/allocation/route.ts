import { NextRequest, NextResponse } from 'next/server';
import { BudgetCalculator } from '@/lib/services/calculators/budget-calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { monthlyIncome, currentAge } = body;

    // Validation
    if (typeof monthlyIncome !== 'number' || monthlyIncome <= 0) {
      return NextResponse.json(
        { error: 'Monthly income must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof currentAge !== 'number' || currentAge < 18 || currentAge > 120) {
      return NextResponse.json(
        { error: 'Current age must be between 18 and 120' },
        { status: 400 }
      );
    }

    // Calculate budget allocation recommendation
    const result = BudgetCalculator.optimizeBudgetAllocation(
      monthlyIncome,
      currentAge
    );

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Budget allocation calculation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate budget allocation',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
