import { NextRequest, NextResponse } from 'next/server';
import { BudgetCalculator } from '@/app/_common/lib/services/calculators/budget-calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { income, expenses, debts } = body;

    // Validation - Income
    if (!income || typeof income !== 'object') {
      return NextResponse.json(
        { error: 'Income breakdown is required and must be an object' },
        { status: 400 }
      );
    }

    const requiredIncomeFields = ['salary', 'bonuses', 'rentalIncome', 'investmentIncome', 'otherIncome'];
    for (const field of requiredIncomeFields) {
      if (typeof income[field] !== 'number' || income[field] < 0) {
        return NextResponse.json(
          { error: `Income.${field} must be a non-negative number` },
          { status: 400 }
        );
      }
    }

    // Validation - Expenses
    if (!expenses || typeof expenses !== 'object') {
      return NextResponse.json(
        { error: 'Expenses breakdown is required and must be an object' },
        { status: 400 }
      );
    }

    const requiredExpenseFields = [
      'housing', 'utilities', 'food', 'transportation', 'insurance',
      'healthcare', 'education', 'entertainment', 'savings', 'otherExpenses'
    ];
    for (const field of requiredExpenseFields) {
      if (typeof expenses[field] !== 'number' || expenses[field] < 0) {
        return NextResponse.json(
          { error: `Expenses.${field} must be a non-negative number` },
          { status: 400 }
        );
      }
    }

    // Validation - Debts
    if (!debts || typeof debts !== 'object') {
      return NextResponse.json(
        { error: 'Debts breakdown is required and must be an object' },
        { status: 400 }
      );
    }

    const requiredDebtFields = ['mortgage', 'consumerLoans', 'creditCards', 'studentLoans', 'otherDebts'];
    for (const field of requiredDebtFields) {
      if (typeof debts[field] !== 'number' || debts[field] < 0) {
        return NextResponse.json(
          { error: `Debts.${field} must be a non-negative number` },
          { status: 400 }
        );
      }
    }

    // Calculate budget analysis
    const result = BudgetCalculator.analyzeBudget({
      income,
      expenses,
      debts
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Budget analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze budget',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
