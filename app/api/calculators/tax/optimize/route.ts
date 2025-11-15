import { NextRequest, NextResponse } from 'next/server';
import { TaxCalculator } from '@/lib/services/calculators/tax-calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { income, currentDeductions = 0 } = body;

    // Validation
    if (typeof income !== 'number' || income < 0) {
      return NextResponse.json(
        { error: 'Income must be a positive number' },
        { status: 400 }
      );
    }

    if (typeof currentDeductions !== 'number' || currentDeductions < 0) {
      return NextResponse.json(
        { error: 'Current deductions must be a positive number' },
        { status: 400 }
      );
    }

    // Optimize tax
    const result = TaxCalculator.optimizeTax(income, currentDeductions);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Tax optimization error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to optimize tax',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
