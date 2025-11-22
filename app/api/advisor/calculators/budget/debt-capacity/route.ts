import { NextRequest, NextResponse } from 'next/server';
import { BudgetCalculator } from '@/lib/services/calculators/budget-calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { monthlyIncome, currentDebts, interestRate, loanTerm } = body;

    // Validation
    if (typeof monthlyIncome !== 'number' || monthlyIncome <= 0) {
      return NextResponse.json(
        { error: 'Monthly income must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof currentDebts !== 'number' || currentDebts < 0) {
      return NextResponse.json(
        { error: 'Current debts must be a non-negative number' },
        { status: 400 }
      );
    }

    if (typeof interestRate !== 'number' || interestRate < 0) {
      return NextResponse.json(
        { error: 'Interest rate must be a non-negative number' },
        { status: 400 }
      );
    }

    if (typeof loanTerm !== 'number' || loanTerm <= 0) {
      return NextResponse.json(
        { error: 'Loan term must be a positive number' },
        { status: 400 }
      );
    }

    // Calculate debt capacity
    const result = BudgetCalculator.calculateDebtCapacity(
      monthlyIncome,
      currentDebts,
      interestRate,
      loanTerm
    );

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Debt capacity calculation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate debt capacity',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
