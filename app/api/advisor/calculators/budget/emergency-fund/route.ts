import { NextRequest, NextResponse } from 'next/server';
import { BudgetCalculator } from '@/lib/services/calculators/budget-calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { monthlyExpenses, riskProfile = 'medium' } = body;

    // Validation
    if (typeof monthlyExpenses !== 'number' || monthlyExpenses < 0) {
      return NextResponse.json(
        { error: 'Monthly expenses must be a non-negative number' },
        { status: 400 }
      );
    }

    if (!['low', 'medium', 'high'].includes(riskProfile)) {
      return NextResponse.json(
        { error: 'Risk profile must be one of: low, medium, high' },
        { status: 400 }
      );
    }

    // Calculate emergency fund recommendation
    const result = BudgetCalculator.calculateEmergencyFund(
      monthlyExpenses,
      riskProfile
    );

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Emergency fund calculation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate emergency fund',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
