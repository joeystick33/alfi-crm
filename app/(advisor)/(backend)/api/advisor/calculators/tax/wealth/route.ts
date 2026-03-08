import { NextRequest, NextResponse } from 'next/server';
import { TaxCalculator } from '@/app/_common/lib/services/calculators/tax-calculator';
import { logger } from '@/app/_common/lib/logger'
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { totalWealth, year = 2024 } = body;

    // Validation
    if (typeof totalWealth !== 'number' || totalWealth < 0) {
      return NextResponse.json(
        { error: 'Total wealth must be a positive number' },
        { status: 400 }
      );
    }

    // Calculate wealth tax (IFI)
    const result = TaxCalculator.calculateWealthTax(totalWealth, year);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Wealth tax calculation error:', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json(
      { 
        error: 'Failed to calculate wealth tax',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
