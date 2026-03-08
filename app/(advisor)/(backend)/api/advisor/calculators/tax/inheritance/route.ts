import { NextRequest, NextResponse } from 'next/server';
import { TaxCalculator } from '@/app/_common/lib/services/calculators/tax-calculator';
import { logger } from '@/app/_common/lib/logger'
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
  } catch (error) {
    logger.error('Inheritance tax calculation error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { 
        error: 'Failed to calculate inheritance tax',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
