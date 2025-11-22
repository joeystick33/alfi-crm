import { NextRequest, NextResponse } from 'next/server';
import { TaxCalculator } from '@/lib/services/calculators/tax-calculator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inheritanceAmount, relationship } = body;

    // Validation
    if (typeof inheritanceAmount !== 'number' || inheritanceAmount < 0) {
      return NextResponse.json(
        { error: 'Inheritance amount must be a positive number' },
        { status: 400 }
      );
    }

    if (!['spouse', 'child', 'grandchild', 'sibling', 'other'].includes(relationship)) {
      return NextResponse.json(
        { error: 'Invalid relationship type' },
        { status: 400 }
      );
    }

    // Calculate inheritance tax
    const result = TaxCalculator.calculateInheritanceTax(
      inheritanceAmount,
      relationship as 'spouse' | 'child' | 'grandchild' | 'sibling' | 'other'
    );

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Inheritance tax calculation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate inheritance tax',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
